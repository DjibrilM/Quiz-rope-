import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiService } from "../services/api";
import * as guestDb from "../services/guestDb";

const API_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";

export interface ChatMessage {
  _id: string;
  role: "user" | "ai";
  content: string;
  isStreaming?: boolean;
}

/**
 * @param sessionId  The homework session ID.
 * @param guestContext  If provided, use stateless guest REST chat (no socket) with this context.
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
      // Load from SQLite (oldest first, so reverse to newest first)
      guestDb.getChatHistory(sessionId).then((history) => {
        setMessages(history.reverse().map((m) => ({
          _id: m.id,
          role: m.role === 'model' ? 'ai' : m.role as 'user' | 'ai',
          content: m.content,
        })));
      }).catch(() => {});
      return;
    }

    // Load initial history
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
        const last = prev[0]; // Newest is at index 0 now
        if (last?.isStreaming) {
          return [
            { ...last, content: current },
            ...prev.slice(1),
          ];
        }
        return [
          {
            _id: `streaming-${Date.now()}`,
            role: "ai",
            content: current,
            isStreaming: true,
          },
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

    // Partial response stopped (user aborted, nothing saved yet)
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

  const sendGuest = async (text: string) => {
    if (!text.trim() || streaming) return;
    setStreaming(true);
    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;
    setMessages((prev) => [
      { _id: aiMsgId, role: "ai", content: "", isStreaming: true },
      { _id: userMsgId, role: "user", content: text.trim() },
      ...prev,
    ]);
    try {
      const history = messages // This is newest-first, we need oldest-first for the AI context!
        .filter((m) => !m.isStreaming)
        .reverse()
        .map((m) => ({ role: m.role === 'ai' ? 'model' as const : 'user' as const, content: m.content }));
      const { response } = await apiService.guestChat(guestContext || '', history, text.trim());
      const now = Date.now();
      // Persist both messages to SQLite
      await guestDb.saveChatMessage({ id: userMsgId, sessionId, role: 'user', content: text.trim(), createdAt: now - 1 });
      await guestDb.saveChatMessage({ id: aiMsgId, sessionId, role: 'model', content: response, createdAt: now });
      setMessages((prev) => [
        { _id: aiMsgId, role: "ai", content: response },
        ...prev.filter((m) => !m.isStreaming),
      ]);
    } catch {
      setMessages((prev) => [
        { _id: `err-${Date.now()}`, role: "ai", content: "Sorry, something went wrong. Try again." },
        ...prev.filter((m) => m._id !== aiMsgId),
      ]);
    } finally {
      setStreaming(false);
    }
  };

  const send = (text: string) => {
    if (isGuest) { sendGuest(text); return; }
    if (!text.trim() || streaming) return;
    setStreaming(true);
    setMessages((prev) => [
      {
        _id: `streaming-${Date.now()}`,
        role: "ai",
        content: "",
        isStreaming: true,
      },
      { _id: `opt-${Date.now()}`, role: "user", content: text.trim() },
      ...prev,
    ]);
    socketRef.current?.emit("homework:chat", {
      sessionId,
      message: text.trim(),
    });
  };

  const stop = () => {
    if (isGuest || !streaming) return;
    socketRef.current?.emit("homework:stop");
  };

  return { messages, send, stop, streaming, loadMore, isLoadingMore, hasMore };
}
