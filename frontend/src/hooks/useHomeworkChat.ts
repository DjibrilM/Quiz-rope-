import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiService } from "../services/api";
import * as guestDb from "../services/guestDb";
import i18next from "i18next";

const API_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";

export interface ChatMessage {
  _id: string;
  role: "user" | "ai";
  content: string;
  isStreaming?: boolean;
}

/**
 * @param sessionId     The homework session ID.
 * @param guestContext  If provided, connect as guest (no auth token) and use homework:guest-chat event.
 */
export function useHomeworkChat(sessionId: string, guestContext?: string) {
  const isGuest = guestContext !== undefined;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bufferRef = useRef("");

  const loadMore = async () => {
    if (isGuest || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const history = await apiService.getHomeworkChatHistory(sessionId, messages.length, 500);
      if (history.length < 500) {
        setHasMore(false);
      }
      setMessages((prev) => [
        ...prev,
        ...history.map((m: any) => ({
          _id: m._id,
          role: m.role,
          content: m.content,
        })),
      ]);
    } catch {
      // ignore
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isGuest) {
      // Load local SQLite history (oldest first → reverse to newest first)
      guestDb.getChatHistory(sessionId).then((history) => {
        setMessages(history.reverse().map((m) => ({
          _id: m.id,
          role: m.role === "model" ? "ai" : (m.role as "user" | "ai"),
          content: m.content,
        })));
      }).catch(() => {});

      // Connect without auth token
      const socket = io(API_URL, {
        transports: ["websocket"],
        reconnection: true,
      });

      socket.on("homework:token", (token: string) => {
        setStreaming(true);
        bufferRef.current += token;
        const current = bufferRef.current;
        setMessages((prev) => {
          const last = prev[0];
          if (last?.isStreaming) {
            return [{ ...last, content: current }, ...prev.slice(1)];
          }
          return [
            { _id: `streaming-${Date.now()}`, role: "ai", content: current, isStreaming: true },
            ...prev,
          ];
        });
      });

      socket.on("homework:done", (saved: { _id: string; role: string; content: string }) => {
        setStreaming(false);
        const fullResponse = bufferRef.current;
        bufferRef.current = "";
        setMessages((prev) => [
          { _id: saved._id, role: "ai", content: saved.content },
          ...prev.filter((m) => !m._id.startsWith("streaming-")),
        ]);
        // Persist to SQLite
        const now = Date.now();
        guestDb.saveChatMessage({ id: saved._id, sessionId, role: "model", content: saved.content, createdAt: now }).catch(() => {});
        void fullResponse; // used only for streaming display, saved value comes from server
      });

      socket.on("homework:stopped", () => {
        setStreaming(false);
        const partial = bufferRef.current;
        bufferRef.current = "";
        setMessages((prev) =>
          prev.map((m) =>
            m.isStreaming ? { ...m, content: partial || m.content, isStreaming: false } : m,
          ),
        );
      });

      socket.on("homework:error", (err: string) => {
        setStreaming(false);
        bufferRef.current = "";
        setMessages((prev) => [
          { _id: `err-${Date.now()}`, role: "ai", content: `Sorry, something went wrong. ${err}` },
          ...prev.filter((m) => !m._id.startsWith("streaming-")),
        ]);
      });

      socketRef.current = socket;
      return () => {
        socket.disconnect();
      };
    }

    // ── Authenticated mode ────────────────────────────────────────────────────
    apiService
      .getHomeworkChatHistory(sessionId, 0, 500)
      .then((history) => {
        if (history.length < 500) setHasMore(false);
        setMessages(
          history.map((m: any) => ({
            _id: m._id,
            role: m.role,
            content: m.content,
          })),
        );
      })
      .catch(() => {});

    const socket = io(API_URL, {
      auth: { token: apiService.getAuthToken() },
      transports: ["websocket"],
      reconnection: true,
    });

    socket.emit("homework:join", { sessionId });

    socket.on("homework:token", (token: string) => {
      setStreaming(true);
      bufferRef.current += token;
      const current = bufferRef.current;
      setMessages((prev) => {
        const last = prev[0];
        if (last?.isStreaming) {
          return [{ ...last, content: current }, ...prev.slice(1)];
        }
        return [
          { _id: `streaming-${Date.now()}`, role: "ai", content: current, isStreaming: true },
          ...prev,
        ];
      });
    });

    socket.on("homework:done", (saved: any) => {
      setStreaming(false);
      bufferRef.current = "";
      setMessages((prev) => [
        { _id: saved._id, role: "ai", content: saved.content },
        ...prev.filter((m) => !m._id.startsWith("streaming-")),
      ]);
    });

    socket.on("homework:stopped", () => {
      setStreaming(false);
      const partial = bufferRef.current;
      bufferRef.current = "";
      setMessages((prev) =>
        prev.map((m) =>
          m.isStreaming ? { ...m, content: partial || m.content, isStreaming: false } : m,
        ),
      );
    });

    socket.on("homework:error", (err: string) => {
      setStreaming(false);
      bufferRef.current = "";
      setMessages((prev) => [
        {
          _id: `err-${Date.now()}`,
          role: "ai",
          content: `Sorry, something went wrong. ${err}`,
        },
        ...prev.filter((m) => !m._id.startsWith("streaming-")),
      ]);
    });

    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const send = (text: string) => {
    if (!text.trim() || streaming) return;
    setStreaming(true);

    // Optimistically add user message
    const userMsgId = `opt-${Date.now()}`;
    setMessages((prev) => [
      { _id: `streaming-${Date.now()}`, role: "ai", content: "", isStreaming: true },
      { _id: userMsgId, role: "user", content: text.trim() },
      ...prev,
    ]);

    if (isGuest) {
      // Build history from current messages (exclude streaming placeholders)
      const history = messages
        .filter((m) => !m.isStreaming)
        .slice()
        .reverse()
        .map((m) => ({
          role: m.role === "ai" ? ("model" as const) : ("user" as const),
          content: m.content,
        }));

      // Save user message to SQLite immediately
      guestDb.saveChatMessage({
        id: userMsgId,
        sessionId,
        role: "user",
        content: text.trim(),
        createdAt: Date.now(),
      }).catch(() => {});

      socketRef.current?.emit("homework:guest-chat", {
        sessionContext: guestContext || "",
        history,
        message: text.trim(),
        language: i18next.language || "en",
      });
    } else {
      socketRef.current?.emit("homework:chat", { sessionId, message: text.trim(), language: i18next.language || "en" });
    }
  };

  const stop = () => {
    if (!streaming) return;
    socketRef.current?.emit("homework:stop");
  };

  return { messages, send, stop, streaming, loadMore, isLoadingMore, hasMore };
}
