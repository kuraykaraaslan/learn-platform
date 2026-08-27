# 401. Express: Real-Time Updates with SSE and Socket.io

## What It Is
Server-to-client push comes in exactly two flavors in this stack, and picking the wrong one is an architecture-level mistake that's expensive to undo later: Server-Sent Events (SSE) for one-directional server-to-client streams, and Socket.io for genuinely bidirectional real-time communication. The decision isn't stylistic — SSE rides on plain HTTP, reconnects automatically in the browser, and passes through proxies and load balancers without special configuration, while Socket.io upgrades to a WebSocket connection, requires the client to handle reconnection logic itself, and needs sticky sessions configured at the load balancer when running more than one server instance.

SSE is the right tool for job progress bars, live notification streams, and order-status updates — anything where the server has something to say and the client has nothing to say back beyond the initial request. The implementation is a single long-lived HTTP response with `Content-Type: text/event-stream`, where the server writes `data: {...}\n\n` chunks and the connection stays open until the work finishes or the client disconnects. Because it's just HTTP, a `req.on("close", ...)` handler is enough to clean up any interval or subscription tied to that connection — there's no separate protocol-level heartbeat to manage.

Socket.io earns its complexity when the client needs to send events too — a chat feature, collaborative editing cursors, or anything where "the client also emits" is core to the feature. Its authentication happens once at the `io.use()` middleware layer during the handshake, not per-message, and every connected socket joins scoped rooms (`user:{userId}`, `tenant:{tenantId}`) rather than ever broadcasting to `io.emit()` — a global broadcast to every connected client regardless of tenant or ownership is treated as a bug, not a feature, because it both leaks data across tenants and wastes bandwidth on clients who have no reason to receive the event.

## Key Concepts
- **SSE = one-directional, HTTP-native**: `Content-Type: text/event-stream`, auto-reconnect in the browser, proxy-friendly, no sticky sessions needed
- **Socket.io = bidirectional, WebSocket-based**: needed only when the client also emits events; requires client-side reconnect logic and sticky sessions behind a load balancer
- **`res.flushHeaders()` before writing SSE chunks**: without it, some proxies buffer the response and the client never sees data until the connection closes
- **Cleanup on `req.on("close")`**: SSE's cleanup hook is just a Node request event — clear any `setInterval` or subscription there to avoid leaking timers per abandoned connection
- **Socket.io auth at the handshake, not per-message**: `io.use((socket, next) => {...})` validates the token once when the socket connects; a rejected handshake never reaches `io.on("connection")`
- **Room-scoped emission only**: every push goes to `user:{userId}`, `tenant:{tenantId}`, or a similarly scoped room — `io.emit()` broadcasting to everyone is treated as a bug
- **Services emit, routes never touch the socket layer**: `getIO()` is called from service code (e.g. `NotificationService.send`), never imported into a route file
- **Decision table, not vibes**: default to SSE; reach for Socket.io only when the feature genuinely requires the client to send events back in real time

## Example Code
```typescript
// modules/jobs/jobs.route.ts — SSE for one-directional progress updates
import { Router } from "express";
import { authMiddleware } from "@/lib/middleware/auth";
import JobService from "@/modules/jobs/job.service";
import { UuidParam } from "@/lib/validation";

const router = Router();

router.get("/:jobId/progress", authMiddleware("USER"), async (req, res, next) => {
  try {
    const { jobId: _ignored } = UuidParam.parse({ id: req.params.jobId });
    const jobId = req.params.jobId;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // send headers immediately so proxies don't buffer

    const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

    const interval = setInterval(async () => {
      const job = await JobService.getProgress(jobId);
      send({ status: job.status, progress: job.progress });

      if (job.status === "done" || job.status === "failed") {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on("close", () => clearInterval(interval)); // client disconnected — stop polling
  } catch (error) { next(error); }
});

export default router;

// libs/socket.ts — Socket.io setup for bidirectional features
import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "@/lib/jwt";
import { env } from "@/lib/env";

let io: SocketServer;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: env.CORS_ORIGIN, credentials: true },
  });

  // Auth happens once, at the handshake — never per-message
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data.user;
    socket.join(`user:${userId}`); // scoped room, never a global broadcast target

    socket.on("disconnect", () => socket.leave(`user:${userId}`));
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

// modules/notification/notification.service.ts — services emit, routes never touch the socket
import { AppDataSource } from "@/lib/typeorm";
import { Notification } from "@/modules/notification/entities/Notification";
import { getIO } from "@/lib/socket";
import type { NotificationPayload } from "@/modules/notification/notification.types";

export default class NotificationService {
  static async send(userId: string, payload: NotificationPayload): Promise<void> {
    await AppDataSource.getRepository(Notification).save({ userId, ...payload });

    // Room-scoped push — never io.emit() to everyone
    getIO().to(`user:${userId}`).emit("notification", payload);
  }
}

// index.ts — attaching Socket.io to the same HTTP server as Express
import http from "http";
import app from "@/app";
import { initSocket } from "@/lib/socket";
import { env } from "@/lib/env";

const httpServer = http.createServer(app);
initSocket(httpServer);
httpServer.listen(env.PORT);
```

## When to Use
- A live progress bar, order-status stream, or notification feed where only the server has something to say → SSE
- A chat feature, collaborative cursor, or live multiplayer state where the client must also emit events in real time → Socket.io
- Running behind a load balancer with multiple server instances and choosing Socket.io — confirm sticky sessions are configured before shipping, or connections will bounce between instances mid-handshake
- Deciding between the two for a new feature — default to SSE first; only escalate to Socket.io once the feature genuinely needs bidirectional messaging, since it costs strictly more operational complexity

## Common Mistakes
- **Reaching for Socket.io when SSE would do** — a notification stream or progress bar doesn't need a WebSocket; adding Socket.io's connection lifecycle and sticky-session requirement for a one-directional feature is unjustified complexity.
- **Broadcasting with `io.emit()`** — this sends the event to every connected client across every tenant and user; always scope to a room (`user:{id}`, `tenant:{id}`) instead.
- **Forgetting `res.flushHeaders()` on an SSE route** — without it, some reverse proxies buffer the entire response and the client sees nothing until the connection eventually closes, defeating the purpose of a live stream.
- **Authenticating Socket.io per-message instead of at the handshake** — checking the token inside every `socket.on("event", ...)` handler is redundant and slower; validate once in `io.use()` and trust `socket.data.user` afterward.

## Further Reading
- MDN — Using server-sent events: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- Socket.io documentation — Rooms and namespaces: https://socket.io/docs/v4/rooms/
- Socket.io documentation — Middlewares (handshake auth): https://socket.io/docs/v4/middlewares/
