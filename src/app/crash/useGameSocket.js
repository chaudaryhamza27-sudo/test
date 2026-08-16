"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
const POLL_MS = 250;
const CONNECT_TIMEOUT_MS = 4000;

// Drives the Aviator game screen from the realtime-server when it's
// reachable, and transparently falls back to the original REST-polling
// approach when it isn't (no SOCKET_URL configured, connection refused,
// or the realtime-server exhausts its reconnect attempts). Exactly one of
// the two data sources is ever active at a time — never both — so state
// updates can't arrive twice for the same event.
export function useGameSocket() {
  const [state, setState] = useState(null);
  const [authed, setAuthed] = useState(null); // null = not known yet
  const [connectionStatus, setConnectionStatus] = useState(SOCKET_URL ? "connecting" : "polling");
  const [roundFinishedAt, setRoundFinishedAt] = useState(0);

  const socketRef = useRef(null);
  const pollTimerRef = useRef(null);
  const modeRef = useRef(SOCKET_URL ? "socket" : "polling"); // "socket" | "polling"

  const applyRoundUpdate = useCallback((payload) => {
    setState((s) => ({ ...(s || {}), ...payload }));
  }, []);

  // --- Polling fallback (identical shape/behavior to the pre-Socket.IO version) ---
  const startPolling = useCallback(() => {
    if (pollTimerRef.current) return;
    modeRef.current = "polling";
    setConnectionStatus("polling");

    let lastPhase = null;
    const poll = async () => {
      try {
        const res = await fetch("/api/game/state", { cache: "no-store" });
        const data = await res.json();
        setAuthed(data.balance !== null);
        if (lastPhase && lastPhase !== "WAITING" && data.phase === "WAITING") {
          setRoundFinishedAt(Date.now());
        }
        lastPhase = data.phase;
        setState(data);
      } catch {
        // transient network error — next poll will retry
      }
    };
    poll();
    pollTimerRef.current = setInterval(poll, POLL_MS);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  // --- Socket.IO primary path ---
  useEffect(() => {
    if (!SOCKET_URL) {
      startPolling();
      return () => stopPolling();
    }

    let cancelled = false;
    let fellBack = false;
    const fallbackTimer = setTimeout(() => {
      if (!cancelled && modeRef.current === "socket" && connectionStatus !== "connected") {
        fellBack = true;
        startPolling();
      }
    }, CONNECT_TIMEOUT_MS);

    async function connect() {
      // Authenticated users exchange their httpOnly session for a short-lived
      // socket token server-side; an anonymous visitor just watches (no token).
      let token = null;
      try {
        const res = await fetch("/api/auth/socket-token");
        if (res.ok) token = (await res.json()).token;
      } catch {
        // request failed — treat the same as "not logged in" below
      }
      if (cancelled) return;

      const socket = io(SOCKET_URL, { auth: token ? { token } : {}, reconnectionAttempts: 8 });
      socketRef.current = socket;

      socket.on("connect", () => {
        clearTimeout(fallbackTimer);
        if (fellBack) return; // already committed to polling for this mount — ignore late connect
        modeRef.current = "socket";
        stopPolling();
        setConnectionStatus("connected");
        setAuthed(Boolean(token));
      });

      socket.on("disconnect", () => {
        if (modeRef.current === "socket") setConnectionStatus("reconnecting");
      });

      socket.on("reconnect_failed", () => {
        if (!cancelled) startPolling();
      });

      socket.on("connect_error", () => {
        // handled by the fallback timer / reconnect_failed
      });

      socket.on("round:update", (payload) => {
        applyRoundUpdate({
          roundId: payload.roundId,
          serverSeedHash: payload.serverSeedHash,
          phase: payload.phase,
          multiplier: payload.multiplier,
          waitingEndsAt: payload.waitingEndsAt,
          now: payload.now,
          playerCount: payload.playerCount,
        });
      });

      socket.on("round:waiting", () => setRoundFinishedAt(Date.now()));

      socket.on("bet:updated", (payload) => {
        const slot = payload.slot === 2 ? 2 : 1;
        setState((s) => {
          const prevBets = s?.myBets || { 1: null, 2: null };
          return {
            ...(s || {}),
            myBets: {
              ...prevBets,
              [slot]: payload.status === null ? null : { ...(prevBets[slot] || {}), ...payload },
            },
          };
        });
      });

      socket.on("balance:updated", (payload) => {
        setAuthed(true);
        setState((s) => ({ ...(s || {}), balance: payload.balance }));
      });

      socket.on("players:update", () => {
        // Per-round bet count already arrives on round:update; this event is
        // reserved for a future "connected spectators" indicator if needed.
      });

      socket.on("error", () => {
        // Server-reported non-fatal error — surfaced by the caller's own
        // notice state when it comes through an action ack instead.
      });
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      stopPolling();
      const socket = socketRef.current;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placeBet = useCallback((amount, autoCashoutTarget, slot = 1) => {
    if (modeRef.current === "socket" && socketRef.current?.connected) {
      return new Promise((resolve) => {
        socketRef.current.emit("bet:place", { amount, autoCashoutTarget, slot }, (result) => resolve(result));
      });
    }
    return fetch("/api/game/bet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, autoCashoutTarget, slot }),
    }).then((res) => res.json());
  }, []);

  const cashOut = useCallback((slot = 1) => {
    if (modeRef.current === "socket" && socketRef.current?.connected) {
      return new Promise((resolve) => {
        socketRef.current.emit("bet:cashout", { slot }, (result) => resolve(result));
      });
    }
    return fetch("/api/game/cashout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot }),
    }).then((res) => res.json());
  }, []);

  return { state, authed, connectionStatus, roundFinishedAt, placeBet, cashOut };
}
