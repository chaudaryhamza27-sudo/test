"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconCopy,
  IconWallet,
  IconUsers,
  IconTrophy,
  IconShield,
  IconGlobe,
} from "../icons";
import { useGameSocket } from "./useGameSocket";
import AppShellHeader from "../components/AppShellHeader";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];
const MIN_BET = 10;
const MAX_BET = 100000;

const CONNECTION_LABELS = {
  connected: { label: "Live", tone: "success" },
  connecting: { label: "Connecting…", tone: "warning" },
  reconnecting: { label: "Reconnecting…", tone: "warning" },
  polling: { label: "Live (basic mode)", tone: "info" },
};

const TABS = [
  { key: "mine", label: "My Bets", icon: IconWallet, endpoint: "/api/game/my-history", authOnly: true },
  { key: "all", label: "All Bets", icon: IconUsers, endpoint: "/api/game/all-bets", authOnly: false },
  { key: "top", label: "Top Wins", icon: IconTrophy, endpoint: "/api/game/top-wins", authOnly: false },
];

function timeAgo(dateStr) {
  const diffMs = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const s = Math.floor(diffMs / 1000);
  if (s < 5) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

const money = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const mult = (n) => `${Number(n ?? 0).toFixed(2)}x`;

export default function GamePage() {
  const router = useRouter();
  const { state, authed, connectionStatus, roundFinishedAt, placeBet: socketPlaceBet, cashOut: socketCashOut } = useGameSocket();
  const [history, setHistory] = useState([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [amount, setAmount] = useState(100);
  const [autoCashout, setAutoCashout] = useState(2);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState("mine");
  const [tableItems, setTableItems] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const autoFiredRef = useRef(null);

  // The Aviator game requires an account — anonymous spectating was removed.
  // `authed` is `null` until the first auth check resolves (socket connect or
  // first poll tick); only redirect once we positively know the user is
  // logged out, so a logged-in visitor never sees a redirect flash.
  useEffect(() => {
    if (authed === false) router.push("/login");
  }, [authed, router]);

  const loadHistory = useCallback(() => {
    fetch("/api/game/history")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setHistory(data.items || []))
      .catch(() => {});
  }, []);

  const loadTab = useCallback((key) => {
    const config = TABS.find((t) => t.key === key);
    if (!config) return;
    setTableLoading(true);
    fetch(config.endpoint)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setTableItems(data.items || []))
      .catch(() => setTableItems([]))
      .finally(() => setTableLoading(false));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadTab(tab);
  }, [tab, loadTab]);

  // Refresh the recent-rounds strip and the active bets table whenever the
  // realtime layer (socket or polling fallback) tells us a round just ended,
  // instead of re-deriving that from raw phase polling ourselves.
  useEffect(() => {
    if (!roundFinishedAt) return;
    loadHistory();
    loadTab(tab);
    autoFiredRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundFinishedAt]);

  const placeBet = async () => {
    if (pending) return;
    setPending(true);
    setNotice("");
    try {
      const result = await socketPlaceBet(amount, autoCashout > 0 ? autoCashout : null);
      if (result?.error) {
        setNotice(result.error);
        return;
      }
      autoFiredRef.current = null;
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  // Shared by the manual "Cash out" button and the auto cash-out safety-net
  // watcher below. When connected via socket, the realtime-server already
  // enforces autoCashoutTarget server-side (see gameActions.sweepAutoCashouts) —
  // this client watcher mainly matters for the REST polling fallback, where
  // nothing is continuously watching the multiplier on the server's behalf.
  const doCashOut = useCallback(async () => {
    setNotice("");
    try {
      const result = await socketCashOut();
      if (result?.error) {
        // Ignore "nothing to cash out" — most likely the server's own
        // auto-cash-out sweep already claimed it a tick earlier.
        if (!/no active bet/i.test(result.error)) setNotice(result.error);
        return;
      }
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = state?.phase || "WAITING";
  const multiplier = state?.multiplier || 1;
  const msLeft = state?.waitingEndsAt ? Math.max(0, state.waitingEndsAt - Date.now()) : 0;
  const myBet = state?.myBet;
  const balance = Number(state?.balance ?? 0);
  const canBet = authed && phase === "WAITING" && !myBet;
  const canCashOut = authed && phase === "RUNNING" && myBet?.status === "placed";
  const insufficientBalance = canBet && balance < amount;
  const planeLift = Math.min(220, Math.log(multiplier + 0.001) * 90);
  const playerCount = state?.playerCount ?? 0;
  const roundShort = state?.roundId ? String(state.roundId).slice(-6) : "------";

  // Client-side auto cash-out: fires the real cash-out request the moment the
  // polled multiplier crosses the target, same API path as the manual button.
  // autoFiredRef prevents firing more than once per round.
  useEffect(() => {
    const target = Number(autoCashout);
    const reached =
      phase === "RUNNING" &&
      myBet?.status === "placed" &&
      target > 0 &&
      multiplier >= target &&
      !pending &&
      autoFiredRef.current !== state?.roundId;

    if (reached) {
      autoFiredRef.current = state?.roundId;
      setPending(true);
      doCashOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, multiplier, myBet?.status, autoCashout, state?.roundId]);

  const handleCashOutClick = () => {
    if (pending) return;
    setPending(true);
    doCashOut();
  };

  const halveAmount = () => setAmount((a) => Math.max(MIN_BET, Math.floor((Number(a) || 0) / 2)));
  const doubleAmount = () => setAmount((a) => Math.min(MAX_BET, Math.max(MIN_BET, (Number(a) || 0) * 2)));
  const adjustAuto = (delta) => setAutoCashout((v) => Math.max(1.01, Math.round(((Number(v) || 1) + delta) * 100) / 100));

  const copyRoundId = () => {
    if (!state?.roundId) return;
    navigator.clipboard?.writeText(String(state.roundId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const visibleRecent = showAllRecent ? history : history.slice(0, 5);
  const activeTabConfig = TABS.find((t) => t.key === tab);
  const showPlayerCol = tab !== "mine";
  const showStatusCol = tab !== "top";

  return (
    <div className="app-shell no-bottom-nav">
      <div className="app-glow g1" />
      <div className="app-glow g2" />
      <div className="app-glow g3" />

      <AppShellHeader subtitle="Aviator — Simulation" balance={state?.balance ?? 0} showTrustBadges={false} />

      <main className="content game-page-content" style={{ paddingTop: 14 }}>
        <div className="game-round-bar">
          <div className="game-round-id">
            Round ID: {roundShort}
            <button onClick={copyRoundId} aria-label="Copy round ID" title={copied ? "Copied!" : "Copy round ID"}>
              <IconCopy />
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span className={`badge-pill badge-${CONNECTION_LABELS[connectionStatus]?.tone || "neutral"}`}>
              {CONNECTION_LABELS[connectionStatus]?.label || connectionStatus}
            </span>
            <div className="game-players">
              <span className="dot" />
              {playerCount} {playerCount === 1 ? "player" : "players"} this round
            </div>
          </div>
        </div>

        <div className="game-layout">
          <div className="game-main-col">
            <section className="game-stage">
              <div className="game-stage-bg" />
              <div
                className={`game-plane ${phase === "CRASHED" || phase === "DONE" ? "crashed" : ""}`}
                style={{ transform: `translate(${Math.min(120, planeLift * 0.55)}px, -${planeLift}px)` }}
              >
                ✈️
              </div>

              {phase === "WAITING" && (
                <div className="game-multiplier waiting">
                  <span className="game-phase-label">Next round in</span>
                  <span className="game-countdown">{(msLeft / 1000).toFixed(1)}s</span>
                </div>
              )}
              {phase === "RUNNING" && <div className="game-multiplier running">{multiplier.toFixed(2)}x</div>}
              {(phase === "CRASHED" || phase === "DONE") && (
                <div className="game-multiplier crashed">
                  <span className="game-phase-label">Flew away at</span>
                  <span>{multiplier.toFixed(2)}x</span>
                </div>
              )}
            </section>

            {authed === null && (
              <div className="game-login-note">Checking your session…</div>
            )}

            <section className="game-bets-panel">
              <div className="game-tabs">
                {TABS.map((t) => (
                  <button key={t.key} className={`game-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
                    <t.icon />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="game-table-wrap">
                {activeTabConfig?.authOnly && !authed ? (
                  <div className="game-table-empty">
                    <Link href="/login">Log in</Link> to see your bet history.
                  </div>
                ) : tableLoading ? (
                  <div className="game-table-empty">Loading…</div>
                ) : tableItems.length === 0 ? (
                  <div className="game-table-empty">No bets to show yet.</div>
                ) : (
                  <table className="game-table">
                    <thead>
                      <tr>
                        {showPlayerCol && <th>Player</th>}
                        <th>Round ID</th>
                        <th>Bet (Rs)</th>
                        <th>Cash Out (x)</th>
                        <th>Win (Rs)</th>
                        {showStatusCol && <th>Status</th>}
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableItems.map((row) => {
                        const won = row.status === "cashed_out" || tab === "top";
                        const running = row.status === "placed";
                        return (
                          <tr key={row.id}>
                            {showPlayerCol && <td className="muted">Player #{row.uid ?? "—"}</td>}
                            <td className="muted">{row.roundId ? String(row.roundId).slice(-6) : "—"}</td>
                            <td>{money(row.amount)}</td>
                            <td className="muted">{row.cashoutMultiplier ? mult(row.cashoutMultiplier) : "—"}</td>
                            <td className={won ? "win" : "muted"}>{won ? money(row.payout) : "—"}</td>
                            {showStatusCol && (
                              <td>
                                <span className={`badge-pill ${won ? "badge-success" : running ? "badge-warning" : "badge-danger"}`}>
                                  {won ? "Cashed Out" : running ? "Running" : "Lost"}
                                </span>
                              </td>
                            )}
                            <td className="muted">{timeAgo(row.createdAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>

          <aside className="game-side-col">
            {authed && (
              <section className="game-bet-panel">
                <h2>Place Your Bet</h2>

                <div className="game-field-label">Bet Amount (Rs)</div>
                <div className="game-amount-row">
                  <div className="game-amount-input-wrap">
                    <div className="coin-icon">🪙</div>
                    <input
                      type="number"
                      min={MIN_BET}
                      max={MAX_BET}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value) || 0)}
                      disabled={!canBet}
                    />
                  </div>
                  <button className="game-step-btn" onClick={halveAmount} disabled={!canBet} aria-label="Halve amount">
                    ½
                  </button>
                  <button className="game-step-btn" onClick={doubleAmount} disabled={!canBet} aria-label="Double amount">
                    x2
                  </button>
                </div>

                <div className="game-quick-amounts">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      key={v}
                      className={`game-quick-btn ${amount === v ? "active" : ""}`}
                      onClick={() => setAmount(v)}
                      disabled={!canBet}
                    >
                      {v.toLocaleString()}
                    </button>
                  ))}
                </div>

                <div className="game-field-label" style={{ marginTop: 16 }}>
                  Auto Cash-Out (x)
                </div>
                <div className="game-auto-row">
                  <button className="game-step-btn" onClick={() => adjustAuto(-0.1)} aria-label="Decrease auto cash-out">
                    −
                  </button>
                  <input
                    type="number"
                    min="1.01"
                    step="0.01"
                    value={autoCashout}
                    onChange={(e) => setAutoCashout(Number(e.target.value) || 0)}
                  />
                  <button className="game-step-btn" onClick={() => adjustAuto(0.1)} aria-label="Increase auto cash-out">
                    +
                  </button>
                </div>

                {notice && <div className="deposit-alert" style={{ marginTop: 14 }}>{notice}</div>}

                {myBet ? (
                  <div
                    className={`alert ${myBet.status === "cashed_out" ? "alert-success" : myBet.status === "lost" ? "alert-danger" : "alert-info"}`}
                    style={{ marginTop: 14, justifyContent: "center", textAlign: "center" }}
                  >
                    {myBet.status === "placed" && <span>Bet placed: Rs{myBet.amount.toLocaleString()} — good luck!</span>}
                    {myBet.status === "cashed_out" && (
                      <span>
                        You won! Cashed out at {myBet.cashoutMultiplier?.toFixed(2)}x for Rs{myBet.payout?.toLocaleString()}
                      </span>
                    )}
                    {myBet.status === "lost" && <span>Round crashed — bet lost.</span>}
                  </div>
                ) : null}

                {canCashOut ? (
                  <button className="game-place-bet-btn game-cashout-btn" onClick={handleCashOutClick} disabled={pending}>
                    💸 Cash out {(myBet.amount * multiplier).toFixed(0)}
                  </button>
                ) : insufficientBalance ? (
                  <Link href="/deposit" className="game-place-bet-btn" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    💰 Deposit to Play — Balance Rs{balance.toLocaleString()}
                  </Link>
                ) : (
                  <button className="game-place-bet-btn" onClick={placeBet} disabled={!canBet || pending}>
                    🚀 {pending ? "Placing…" : `Place Bet — Rs${amount ? Number(amount).toLocaleString() : 0}`}
                  </button>
                )}

                <div className="game-limits-note">
                  Min Bet: Rs{MIN_BET} &nbsp;|&nbsp; Max Bet: Rs{MAX_BET.toLocaleString()}
                </div>
              </section>
            )}

            <section className="game-recent-panel">
              <div className="game-recent-head">
                <h2>Recent Rounds</h2>
                {history.length > 5 && (
                  <button onClick={() => setShowAllRecent((v) => !v)}>{showAllRecent ? "Show less" : "View All"}</button>
                )}
              </div>
              {visibleRecent.length === 0 ? (
                <div className="game-table-empty">Round history will appear here</div>
              ) : (
                visibleRecent.map((h) => (
                  <div className="game-recent-row" key={h.id}>
                    <span className={`game-recent-mult ${h.crashPoint < 200 ? "down" : "up"}`}>{(h.crashPoint / 100).toFixed(2)}x</span>
                    <span className="game-recent-time">{timeAgo(h.createdAt)}</span>
                  </div>
                ))
              )}
            </section>
          </aside>
        </div>

        <div className="game-legal-footer">
          <span className="item" title={state?.serverSeedHash ? `Commit hash: ${state.serverSeedHash}` : undefined}>
            <IconShield style={{ width: 14, height: 14 }} />
            Provably Fair
          </span>
          <span className="item">For entertainment purposes only — demo credits, no real money</span>
          <Link href="/legal/betting-rules" target="_blank" rel="noopener noreferrer" className="item">
            <IconGlobe style={{ width: 14, height: 14 }} />
            How to Play
          </Link>
        </div>
      </main>
    </div>
  );
}
