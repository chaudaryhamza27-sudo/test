import { loadEnvLocal } from "./loadEnv.js";
loadEnvLocal();

import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import dbConnect from "../src/lib/mongodb.js";
import User from "../src/lib/models/User.js";
import GameBet from "../src/lib/models/GameBet.js";
import { getActiveRound, getRoundPhase } from "../src/lib/gameEngine.js";
import { placeBet, cashOutBet, sweepAutoCashouts } from "../src/lib/gameActions.js";

const JWT_SECRET = process.env.JWT_SECRET;
// Most PaaS hosts (Render, Railway, Heroku...) assign the port dynamically
// via PORT and require the app to bind to it — SOCKET_PORT remains the local
// dev override (see .env.local) so nothing about local dev changes.
const PORT = process.env.PORT || process.env.SOCKET_PORT || 4001;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const TICK_MS = 100;

if (!JWT_SECRET) throw new Error("JWT_SECRET is not set — add it to .env.local");
if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set — add it to .env.local");

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: APP_URL, methods: ["GET", "POST"] },
});

// userId -> Set<socketId>, so server-initiated events (auto cash-out,
// balance updates) reach every tab/device a given user has open.
const userSockets = new Map();

function emitToUser(userId, event, payload) {
  const sockets = userSockets.get(String(userId));
  if (!sockets) return;
  for (const id of sockets) io.to(id).emit(event, payload);
}

function broadcastPlayerPresence() {
  io.emit("players:update", { count: io.engine.clientsCount });
}

// Socket auth: verifies the short-lived, purpose-scoped token issued by
// GET /api/auth/socket-token (see that route for why we don't just forward
// the httpOnly session cookie). No token at all just means an anonymous
// spectator — the game is watchable without an account, same as before.
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.data.user = null;
    return next();
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== "socket") throw new Error("wrong token purpose");
    await dbConnect();
    const user = await User.findById(payload.sub);
    socket.data.user = user && !user.isBanned ? user : null;
  } catch {
    socket.data.user = null;
  }
  next();
});

io.on("connection", async (socket) => {
  if (socket.data.user) {
    const uid = String(socket.data.user._id);
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
  }
  broadcastPlayerPresence();

  // Round synchronization: a client that connects mid-round gets the full
  // authoritative current state immediately, not just the next tick.
  try {
    await dbConnect();
    const round = await getActiveRound();
    const info = getRoundPhase(round);
    const playerCount = await GameBet.countDocuments({ round: round._id });
    socket.emit("round:update", {
      roundId: round._id,
      serverSeedHash: round.serverSeedHash,
      phase: info.phase,
      multiplier: info.multiplier,
      waitingEndsAt: info.waitingEndsAt ?? null,
      startedAt: info.startedAt ?? null,
      crashedAt: info.crashedAt ?? null,
      crashPoint: info.phase === "CRASHED" ? round.crashPoint : null,
      now: Date.now(),
      playerCount,
    });

    if (socket.data.user) {
      const bets = await GameBet.find({ round: round._id, user: socket.data.user._id });
      const bySlot = { 1: null, 2: null };
      for (const bet of bets) bySlot[bet.slot] = bet;
      for (const slot of [1, 2]) {
        const bet = bySlot[slot];
        socket.emit("bet:updated", bet
          ? { slot, status: bet.status, amount: bet.amount, cashoutMultiplier: bet.cashoutMultiplier, autoCashoutTarget: bet.autoCashoutTarget, payout: bet.payout }
          : { slot, status: null });
      }
      socket.emit("balance:updated", { balance: socket.data.user.balance });
    }
  } catch (err) {
    console.error("[socket] initial sync failed", err);
    socket.emit("error", { message: "Could not load the current round. Retrying shortly." });
  }

  socket.on("bet:place", async (payload, ack) => {
    if (!socket.data.user) return ack?.({ error: "Not authenticated." });
    try {
      await dbConnect();
      const result = await placeBet({
        userId: socket.data.user._id,
        amount: payload?.amount,
        autoCashoutTarget: payload?.autoCashoutTarget,
        slot: payload?.slot,
      });
      if (result.error) return ack?.({ error: result.error });
      ack?.(result);
      socket.emit("bet:updated", { slot: result.slot, status: "placed", amount: result.amount, autoCashoutTarget: payload?.autoCashoutTarget ?? null });
      socket.emit("balance:updated", { balance: result.balance });
    } catch (err) {
      console.error("[socket] bet:place failed", err);
      ack?.({ error: "Something went wrong. Please try again." });
    }
  });

  socket.on("bet:cashout", async (payload, ack) => {
    if (!socket.data.user) return ack?.({ error: "Not authenticated." });
    try {
      await dbConnect();
      const result = await cashOutBet({ userId: socket.data.user._id, slot: payload?.slot });
      if (result.error) return ack?.({ error: result.error });
      ack?.(result);
      socket.emit("bet:updated", { slot: result.slot, status: "cashed_out", cashoutMultiplier: result.multiplier, payout: result.payout });
      socket.emit("balance:updated", { balance: result.balance });
    } catch (err) {
      console.error("[socket] bet:cashout failed", err);
      ack?.({ error: "Something went wrong. Please try again." });
    }
  });

  socket.on("disconnect", () => {
    if (socket.data.user) {
      const uid = String(socket.data.user._id);
      userSockets.get(uid)?.delete(socket.id);
      if (userSockets.get(uid)?.size === 0) userSockets.delete(uid);
    }
    broadcastPlayerPresence();
  });
});

// --- Server-authoritative game loop -----------------------------------
// gameEngine.getRoundPhase() is a pure function of wall-clock time, so this
// loop doesn't "run" the game so much as sample it frequently and broadcast
// the authoritative result — the same math the REST fallback route already
// used, just pushed instead of polled. See src/lib/gameEngine.js.
let lastRoundId = null;
let lastPhase = null;

async function tick() {
  await dbConnect();
  const round = await getActiveRound();
  const info = getRoundPhase(round);
  const roundId = String(round._id);

  if (info.phase === "RUNNING") {
    const results = await sweepAutoCashouts({ roundId: round._id, multiplier: info.multiplier });
    for (const r of results) {
      emitToUser(r.userId, "bet:updated", { slot: r.slot, status: "cashed_out", cashoutMultiplier: r.multiplier, payout: r.payout });
      emitToUser(r.userId, "balance:updated", { balance: r.balance });
    }
  }

  const playerCount = await GameBet.countDocuments({ round: round._id });

  io.emit("round:update", {
    roundId: round._id,
    serverSeedHash: round.serverSeedHash,
    phase: info.phase,
    multiplier: info.multiplier,
    waitingEndsAt: info.waitingEndsAt ?? null,
    startedAt: info.startedAt ?? null,
    crashedAt: info.crashedAt ?? null,
    crashPoint: info.phase === "CRASHED" ? round.crashPoint : null,
    now: Date.now(),
    playerCount,
  });

  if (roundId !== lastRoundId) {
    // getActiveRound() rotates lazily — by the time DONE is externally
    // visible it has already become a brand-new WAITING round, so we infer
    // "the previous round just finished" from the id changing rather than
    // trying to catch an instantaneous DONE phase.
    if (lastRoundId) io.emit("round:finished", { previousRoundId: lastRoundId });
    io.emit("round:waiting", { roundId: round._id, waitingEndsAt: info.waitingEndsAt });
    lastRoundId = roundId;
    lastPhase = info.phase;
  } else if (info.phase !== lastPhase) {
    if (info.phase === "RUNNING") io.emit("round:started", { roundId: round._id, startedAt: info.startedAt });
    if (info.phase === "CRASHED") io.emit("round:crashed", { roundId: round._id, crashPoint: round.crashPoint, crashedAt: info.crashedAt, serverSeed: round.serverSeed });
    lastPhase = info.phase;
  }
}

setInterval(() => {
  tick().catch((err) => console.error("[game-loop] tick failed", err));
}, TICK_MS);

httpServer.listen(PORT, () => {
  console.log(`[realtime-server] listening on :${PORT} (CORS origin: ${APP_URL})`);
});
