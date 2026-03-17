import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { apiService } from "../services/api";

const API_URL =
  process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3000";

export interface ChatMessage {
  _id: string;
  role: "user" | "ai";
  content: string;
  isStreaming?: boolean;
}

export function useHomeworkChat(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const bufferRef = useRef("");

  useEffect(() => {
    // Load history
    apiService
      .getHomeworkChatHistory(sessionId)
      .then((history) => {
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
        const last = prev[prev.length - 1];
        if (last?.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...last, content: current },
          ];
        }
        return [
          ...prev,
          {
            _id: `streaming-${Date.now()}`,
            role: "ai",
            content: current,
            isStreaming: true,
          },
        ];
      });
    });

    socket.on("homework:done", (saved: any) => {
      setStreaming(false);
      bufferRef.current = "";
      setMessages((prev) => [
        ...prev.filter((m) => !m._id.startsWith("streaming-")),
        { _id: saved._id, role: "ai", content: saved.content },
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
        ...prev.filter((m) => !m._id.startsWith("streaming-")),
        {
          _id: `err-${Date.now()}`,
          role: "ai",
          content: `Sorry, something went wrong. ${err}`,
        },
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
    setMessages((prev) => [
      ...prev,
      { _id: `opt-${Date.now()}`, role: "user", content: text.trim() },
      {
        _id: `streaming-${Date.now()}`,
        role: "ai",
        content: "",
        isStreaming: true,
      },
    ]);
    socketRef.current?.emit("homework:chat", {
      sessionId,
      message: text.trim(),
    });
  };

  const stop = () => {
    if (!streaming) return;
    socketRef.current?.emit("homework:stop");
  };

  return { messages, send, stop, streaming };
}
