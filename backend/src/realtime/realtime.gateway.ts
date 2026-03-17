import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger, Inject, forwardRef } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { MatchService } from "../match/match.service";
import { ChildrenService } from "../children/children.service";
import { HomeworkService } from "../homework/homework.service";
import { GEMINI_MODEL } from "../constants";

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : process.env.NODE_ENV === "production"
        ? false
        : true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  // Track players per match and timers
  private matchPlayers = new Map<string, Set<string>>();
  private playerSockets = new Map<string, string>(); // socketId -> matchId
  private matchTimers = new Map<string, NodeJS.Timeout>();
  private readyPlayers = new Map<string, Set<string>>();
  // Active AI streams — aborted when client emits homework:stop
  private activeStreams = new Map<string, AbortController>();

  constructor(
    private matchService: MatchService,
    @Inject(forwardRef(() => ChildrenService))
    private childrenService: ChildrenService,
    private homeworkService: HomeworkService,
  ) {}

  afterInit() {
    this.logger.log("WebSocket Gateway initialized (Socket.io)");
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const matchId = this.playerSockets.get(client.id);
    if (matchId) {
      const players = this.matchPlayers.get(matchId);
      if (players) {
        players.delete(client.id);
        this.server.to(matchId).emit("lobby:update", {
          matchId,
          playerCount: players.size,
        });
      }
      this.playerSockets.delete(client.id);
    }
    // Abort any active AI stream for this client
    this.activeStreams.get(client.id)?.abort();
    this.activeStreams.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("match:join")
  handleJoinMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: { matchId: string; playerId: string; teamSide: string },
  ) {
    const { matchId, playerId, teamSide } = data;
    client.join(matchId);
    this.playerSockets.set(client.id, matchId);

    if (!this.matchPlayers.has(matchId)) {
      this.matchPlayers.set(matchId, new Set());
    }
    this.matchPlayers.get(matchId)!.add(client.id);

    this.server.to(matchId).emit("lobby:update", {
      matchId,
      playerCount: this.matchPlayers.get(matchId)!.size,
      newPlayer: { playerId, teamSide },
    });

    this.logger.log(`Player ${playerId} joined match ${matchId}`);
  }

  @SubscribeMessage("match:leave")
  handleLeaveMatch(@ConnectedSocket() client: Socket) {
    const matchId = this.playerSockets.get(client.id);
    if (matchId) {
      client.leave(matchId);
      const players = this.matchPlayers.get(matchId);
      if (players) players.delete(client.id);
      this.playerSockets.delete(client.id);

      this.server.to(matchId).emit("lobby:update", {
        matchId,
        playerCount: players?.size || 0,
      });
    }
  }

  @SubscribeMessage("player:ready")
  handlePlayerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string; playerId: string },
  ) {
    if (!this.readyPlayers.has(data.matchId)) {
      this.readyPlayers.set(data.matchId, new Set());
    }
    this.readyPlayers.get(data.matchId)!.add(data.playerId);

    this.server.to(data.matchId).emit("lobby:update", {
      matchId: data.matchId,
      readyCount: this.readyPlayers.get(data.matchId)!.size,
    });
  }

  @SubscribeMessage("match:start")
  async handleStartMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { matchId: string },
  ) {
    const { matchId } = data;

    try {
      const question = await this.matchService.getCurrentQuestion(matchId);
      if (!question) {
        client.emit("error", { message: "No questions available" });
        return;
      }

      this.server.to(matchId).emit("game:question", question);
      this.startTimer(matchId, 30);

      this.logger.log(`Match ${matchId} started`);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("game:answer")
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      matchId: string;
      playerId: string;
      teamSide: string;
      answerIndex: number;
      responseTime: number;
    },
  ) {
    const { matchId, playerId, teamSide, answerIndex, responseTime } = data;

    try {
      // Stop current timer
      this.stopTimer(matchId);

      // Submit answer and get result
      const result = await this.matchService.submitAnswer(
        matchId,
        playerId,
        teamSide,
        answerIndex,
        responseTime,
      );

      // Broadcast round result
      this.server.to(matchId).emit("game:round-result", {
        ...result,
        playerId,
        teamSide,
      });

      // Broadcast score update
      this.server.to(matchId).emit("game:score-update", {
        left: result.teamScores.left,
        right: result.teamScores.right,
      });

      // Wait 3 seconds then advance to next question
      setTimeout(async () => {
        const next = await this.matchService.advanceQuestion(matchId);
        if (next?.gameOver) {
          const stats = await this.matchService.getMatchStats(matchId);
          this.server.to(matchId).emit("game:end", {
            matchId,
            winnerTeamId: next.winner,
            finalRopePosition: result.newRopePosition,
            teamScores: next.teamScores,
            stats,
          });
          this.logger.log(`Match ${matchId} ended. Winner: ${next.winner}`);
        } else if (next?.question) {
          this.server.to(matchId).emit("game:question", next.question);
          this.startTimer(matchId, 30);
        }
      }, 3000);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("qr:create")
  async handleQRCreate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { parentId: string },
  ) {
    try {
      const session = await this.childrenService.createQRSession(data.parentId);
      client.emit("qr:create", {
        sessionToken: session.sessionToken,
        qrData: session.qrData,
        expiresAt: session.expiresAt,
      });
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("qr:join")
  async handleQRJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string; childId: string },
  ) {
    try {
      const session = await this.childrenService.validateSession(
        data.sessionToken,
      );
      if (!session) {
        client.emit("error", { message: "Invalid or expired session" });
        return;
      }

      await this.childrenService.linkChildToSession(
        data.sessionToken,
        data.childId,
      );

      client.emit("qr:linked", { success: true, parentId: session.parentId });
      this.logger.log(`Child ${data.childId} linked via QR session`);
    } catch (error) {
      client.emit("error", { message: error.message });
    }
  }

  @SubscribeMessage("session:watch")
  handleSessionWatch(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionToken: string },
  ) {
    const room = `session:${data.sessionToken}`;
    client.join(room);
    this.logger.log(
      `Client ${client.id} watching session ${data.sessionToken}`,
    );
  }

  emitSessionAuthorized(
    sessionToken: string,
    data: { parentId: string; childId?: string | null },
  ) {
    const room = `session:${sessionToken}`;
    this.server.to(room).emit("session:authorized", data);
    this.logger.log(`Session ${sessionToken} authorized, notified room`);
  }

  private startTimer(matchId: string, seconds: number) {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining -= 1;
      this.server.to(matchId).emit("game:timer", { timeRemaining: remaining });
      if (remaining <= 0) {
        clearInterval(interval);
        this.matchTimers.delete(matchId);
      }
    }, 1000);
    this.matchTimers.set(matchId, interval);
  }

  private stopTimer(matchId: string) {
    const timer = this.matchTimers.get(matchId);
    if (timer) {
      clearInterval(timer);
      this.matchTimers.delete(matchId);
    }
  }

  // ─── Homework chat ───────────────────────────────────────────────────────────

  @SubscribeMessage("homework:join")
  handleHomeworkJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    client.join(`hw:${data.sessionId}`);
    this.logger.log(
      `Client ${client.id} joined homework session ${data.sessionId}`,
    );
  }

  @SubscribeMessage("homework:chat")
  async handleHomeworkChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; message: string },
  ) {
    const { sessionId, message } = data;

    const controller = new AbortController();
    this.activeStreams.set(client.id, controller);

    try {
      const session = await this.homeworkService.getSessionRaw(sessionId);
      const history = await this.homeworkService.getChatHistory(sessionId);

      await this.homeworkService.saveMessage(sessionId, "user", message);

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        client.emit("homework:error", "AI not configured");
        return;
      }

      const model = new ChatGoogleGenerativeAI({
        model: GEMINI_MODEL,
        apiKey,
        maxOutputTokens: 1024,
        temperature: 0.7,
      });

      let systemInstruction = `You are an expert, encouraging K-12 tutor helping a student deeply understand their homework.
Subject: ${session.subject || "General"}.
Homework content for context:
${session.answersMarkdown || ""}

Do NOT just give the answer. 
Write LONG, thorough, step-by-step educational explanations. 
Break down the fundamental concepts so the child actually learns the material. Use simple, supportive language.`;

      if (session.chatSummary) {
        systemInstruction += `\n\nHere is a summary of the conversation so far, for context:\n${session.chatSummary}`;
      }

      // Only pass unsummarized history exactly to prevent redundant token usage
      const unsummarizedStartIndex = session.summarizedMessageCount || 0;
      const conversationMessages = history.slice(unsummarizedStartIndex).map((m) => ({
        role: m.role === "user" ? ("human" as const) : ("ai" as const),
        content: m.content,
      }));

      const { HumanMessage, AIMessage, SystemMessage } =
        await import("@langchain/core/messages");
      const msgs = [
        new SystemMessage(systemInstruction),
        ...conversationMessages.map((m) =>
          m.role === "human"
            ? new HumanMessage(m.content)
            : new AIMessage(m.content),
        ),
        new HumanMessage(message),
      ];

      let fullResponse = "";

      try {
        const stream = await model.stream(msgs, {
          signal: controller.signal,
        } as any);

        for await (const chunk of stream) {
          if (controller.signal.aborted) break;
          const token = typeof chunk.content === "string" ? chunk.content : "";
          if (token) {
            fullResponse += token;
            client.emit("homework:token", token);
          }
        }
      } catch (err: any) {
        if (!controller.signal.aborted) throw err;
      }

      // Save whatever was generated (full or partial)
      if (fullResponse) {
        const saved = await this.homeworkService.saveMessage(
          sessionId,
          "ai",
          fullResponse,
        );
        client.emit("homework:done", saved);

        // Fire and forget the background summarization logic so it doesn't block the connection
        this.homeworkService.summarizeConversationContext(sessionId).catch((err) => {
          this.logger.error("Failed to run background context summarization:", err.message);
        });

      } else {
        client.emit("homework:stopped");
      }
    } catch (error) {
      this.logger.error("Homework chat error:", error.message);
      client.emit("homework:error", "Something went wrong. Try again.");
    } finally {
      this.activeStreams.delete(client.id);
    }
  }

  @SubscribeMessage("homework:stop")
  handleHomeworkStop(@ConnectedSocket() client: Socket) {
    const controller = this.activeStreams.get(client.id);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(client.id);
    }
  }
}
