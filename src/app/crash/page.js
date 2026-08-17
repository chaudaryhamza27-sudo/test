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
  IconChartLine,
  IconExpand,
  IconHeadset,
  IconStar,
} from "../icons";
import { useGameSocket } from "./useGameSocket";
import AppShellHeader from "../components/AppShellHeader";
import GameChart from "./GameChart";
import { useSound } from "../components/SoundProvider";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];
const MIN_BET = 10;
const MAX_BET = 100000;
// Betting window length — must match WAITING_MS in src/lib/gameEngine.js
// (server-authoritative; this is only used client-side to draw the progress bar).
const WAITING_MS = 6000;

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

// One of the two independent bet panels (slot 1 / slot 2). Each manages its
// own amount, tab, and auto-bet/auto-cash-out settings, and calls the shared
// placeBet/cashOut functions from useGameSocket tagged with its own slot —
// the backend tracks up to one GameBet per (round, user, slot), so both
// panels can have a live bet in the same round at the same time.
function BetPanel({ slot, authed, phase, multiplier, roundId, myBet, balance, placeBetFn, cashOutFn }) {
  const { playTone } = useSound();
  const [tab, setTab] = useState("bet");
  const [amount, setAmount] = useState(MIN_BET);
  const [autoBetOn, setAutoBetOn] = useState(false);
  const [autoCashOutOn, setAutoCashOutOn] = useState(false);
  // Kept as a string while the field is being edited so an in-progress edit
  // (e.g. clearing "2" to type "3") doesn't get clobbered mid-keystroke by a
  // forced fallback to the minimum — normalization only happens on blur.
  const [autoCashOutTarget, setAutoCashOutTarget] = useState("2");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const autoCashoutFiredRef = useRef(null); // roundId already auto-cashed-out
  const autoBetFiredRef = useRef(null); // roundId already auto-bet

  const canBet = authed && phase === "WAITING" && !myBet;
  const canCashOut = authed && phase === "RUNNING" && myBet?.status === "placed";
  const insufficientBalance = canBet && balance < amount;
  // The backend only writes status:"lost" once the round rotates (a few
  // seconds after the crash, at RESULT_MS) — waiting for that would leave
  // the button reading "Placed" through the whole crash-result window even
  // though the round has clearly already ended. Infer it immediately instead.
  const displayLost = (phase === "CRASHED" || phase === "DONE") && myBet?.status === "placed";

  const doPlaceBet = useCallback(
    async (betAmount) => {
      setPending(true);
      setNotice("");
      try {
        const result = await placeBetFn(betAmount, autoCashOutOn ? Number(autoCashOutTarget) : null, slot);
        if (result?.error) {
          setNotice(result.error);
          return;
        }
        playTone("bet");
      } catch {
        setNotice("Something went wrong. Please try again.");
      } finally {
        setPending(false);
      }
    },
    [placeBetFn, autoCashOutOn, autoCashOutTarget, slot, playTone]
  );

  const doCashOut = useCallback(async () => {
    setNotice("");
    try {
      const result = await cashOutFn(slot);
      if (result?.error) {
        if (!/no active bet/i.test(result.error)) setNotice(result.error);
        return;
      }
      playTone("cashout");
    } catch {
      setNotice("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }, [cashOutFn, slot, playTone]);

  // Client-side auto cash-out safety net — the realtime server already
  // enforces this server-side once connected; this mainly matters for the
  // REST polling fallback, which has nothing watching the multiplier server-side.
  useEffect(() => {
    if (!autoCashOutOn) return;
    const target = Number(autoCashOutTarget);
    const reached =
      phase === "RUNNING" &&
      myBet?.status === "placed" &&
      target >= 1 &&
      multiplier >= target &&
      !pending &&
      autoCashoutFiredRef.current !== roundId;
    if (reached) {
      autoCashoutFiredRef.current = roundId;
      setPending(true);
      doCashOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, multiplier, myBet?.status, autoCashOutOn, autoCashOutTarget, roundId]);

  // Auto Bet — re-places the same amount at the start of every new WAITING
  // round while armed, until the toggle is switched off.
  useEffect(() => {
    if (!autoBetOn || !authed) return;
    if (phase === "WAITING" && !myBet && !pending && autoBetFiredRef.current !== roundId) {
      autoBetFiredRef.current = roundId;
      doPlaceBet(amount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoBetOn, authed, phase, myBet, roundId, amount]);

  const halveAmount = () => setAmount((a) => Math.max(MIN_BET, Math.floor((Number(a) || 0) / 2)));
  const doubleAmount = () => setAmount((a) => Math.min(MAX_BET, Math.max(MIN_BET, (Number(a) || 0) * 2)));

  const stepAutoCashOutTarget = (delta) =>
    setAutoCashOutTarget((v) => Math.max(1, Number((Number(v) || 1) + delta)).toFixed(2));
  const normalizeAutoCashOutTarget = () =>
    setAutoCashOutTarget((v) => Math.max(1, Number(v) || 1).toFixed(2));

  const handleBetClick = () => {
    if (pending || !canBet || autoBetOn) return;
    doPlaceBet(amount);
  };
  const handleCashOutClick = () => {
    if (pending) return;
    setPending(true);
    doCashOut();
  };

  const fieldsDisabled = !canBet || autoBetOn;

  return (
    <div className="game-bet-panel">
      <div className="game-bet-tabs">
        <button type="button" className={tab === "bet" ? "active" : ""} onClick={() => setTab("bet")}>
          Bet
        </button>
        <button type="button" className={tab === "auto" ? "active" : ""} onClick={() => setTab("auto")}>
          Auto
        </button>
      </div>

      <div className="game-bet-main-row">
        <div className="game-bet-amount-col">
          <div className="game-amount-pill">
            <button type="button" className="game-amount-step" onClick={halveAmount} disabled={fieldsDisabled} aria-label="Decrease amount">
              −
            </button>
            <input
              type="number"
              min={MIN_BET}
              max={MAX_BET}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              disabled={fieldsDisabled}
            />
            <button type="button" className="game-amount-step" onClick={doubleAmount} disabled={fieldsDisabled} aria-label="Increase amount">
              +
            </button>
          </div>

          <div className="game-quick-amounts">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                className={`game-quick-btn ${amount === v ? "active" : ""}`}
                onClick={() => setAmount(v)}
                disabled={fieldsDisabled}
              >
                {v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {canCashOut ? (
          <button type="button" className="game-place-bet-btn game-cashout-btn" onClick={handleCashOutClick} disabled={pending}>
            Cash Out {(myBet.amount * multiplier).toFixed(0)}
          </button>
        ) : insufficientBalance ? (
          <Link href="/deposit" className="game-place-bet-btn" style={{ textDecoration: "none" }}>
            Deposit
          </Link>
        ) : autoBetOn ? (
          <button type="button" className="game-place-bet-btn armed" disabled>
            {displayLost ? "Lost" : myBet?.status === "placed" ? "Auto Bet Placed" : "Auto Bet Armed"}
          </button>
        ) : (
          <button type="button" className="game-place-bet-btn" onClick={handleBetClick} disabled={!canBet || pending}>
            {pending ? "…" : displayLost ? "Lost" : myBet?.status === "placed" ? "Placed" : "BET"}
          </button>
        )}
      </div>

      {tab === "auto" && (
        <div className="game-auto-controls">
          <div className="game-auto-toggle-row">
            <span>Auto Bet</span>
            <button
              type="button"
              className={`game-toggle ${autoBetOn ? "on" : ""}`}
              onClick={() => setAutoBetOn((v) => !v)}
              aria-label="Toggle Auto Bet"
            >
              <span className="game-toggle-knob" />
            </button>
          </div>
          <div className="game-auto-toggle-row">
            <span>Auto Cash Out</span>
            <button
              type="button"
              className={`game-toggle ${autoCashOutOn ? "on" : ""}`}
              onClick={() => setAutoCashOutOn((v) => !v)}
              aria-label="Toggle Auto Cash Out"
            >
              <span className="game-toggle-knob" />
            </button>
            <div className="game-auto-target-pill">
              <button
                type="button"
                className="game-auto-target-step"
                onClick={() => stepAutoCashOutTarget(-0.1)}
                disabled={!autoCashOutOn}
                aria-label="Decrease auto cash out target"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="0.01"
                className="game-auto-target-input"
                value={autoCashOutTarget}
                onChange={(e) => setAutoCashOutTarget(e.target.value)}
                onBlur={normalizeAutoCashOutTarget}
                disabled={!autoCashOutOn}
              />
              <button
                type="button"
                className="game-auto-target-step"
                onClick={() => stepAutoCashOutTarget(0.1)}
                disabled={!autoCashOutOn}
                aria-label="Increase auto cash out target"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && <div className="deposit-alert" style={{ marginTop: 12 }}>{notice}</div>}
      {myBet?.status === "cashed_out" && (
        <div className="alert alert-success" style={{ marginTop: 12, justifyContent: "center", textAlign: "center" }}>
          Won Rs{myBet.payout?.toLocaleString()} at {myBet.cashoutMultiplier?.toFixed(2)}x
        </div>
      )}
      {(myBet?.status === "lost" || displayLost) && (
        <div className="alert alert-danger" style={{ marginTop: 12, justifyContent: "center", textAlign: "center" }}>
          Round crashed — bet lost.
        </div>
      )}
    </div>
  );
}

export default function GamePage() {
  const router = useRouter();
  const { state, authed, roundFinishedAt, placeBet: socketPlaceBet, cashOut: socketCashOut } = useGameSocket();
  const { playTone } = useSound();
  const crashSoundRoundRef = useRef(null);
  const [history, setHistory] = useState([]);
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [tab, setTab] = useState("mine");
  const [tableItems, setTableItems] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);
  const stageRef = useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundFinishedAt]);

  const phase = state?.phase || "WAITING";
  const multiplier = state?.multiplier || 1;
  const msLeft = state?.waitingEndsAt ? Math.max(0, state.waitingEndsAt - Date.now()) : 0;
  const myBets = state?.myBets || { 1: null, 2: null };
  const balance = Number(state?.balance ?? 0);

  useEffect(() => {
    if (phase === "CRASHED" && state?.roundId && crashSoundRoundRef.current !== state.roundId) {
      crashSoundRoundRef.current = state.roundId;
      playTone("crash");
    }
  }, [phase, state?.roundId, playTone]);

  const copyRoundId = () => {
    if (!state?.roundId) return;
    navigator.clipboard?.writeText(String(state.roundId));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      stageRef.current?.requestFullscreen?.();
    }
  };

  const visibleRecent = showAllRecent ? history : history.slice(0, 5);
  const recentChips = history.slice(0, 8);
  const playerCount = state?.playerCount ?? 0;
  const roundShort = state?.roundId ? String(state.roundId).slice(-6) : "------";
  const activeTabConfig = TABS.find((t) => t.key === tab);
  const showPlayerCol = tab !== "mine";
  const showStatusCol = tab !== "top";

  return (
    <div className="app-shell no-bottom-nav game-red-theme">
      <div className="app-glow g1" />
      <div className="app-glow g2" />
      <div className="app-glow g3" />

      <AppShellHeader subtitle="Aviator — Simulation" balance={state?.balance ?? 0} showTrustBadges={false} />

      <main className="content game-page-content" style={{ paddingTop: 14 }}>
        <div className="game-recent-strip-head">Recent Rounds</div>
        <div className="game-history-strip">
          {recentChips.length === 0 ? (
            <span className="game-history-empty">Recent rounds will appear here</span>
          ) : (
            recentChips.map((h) => (
              <span key={h.id} className={`game-history-chip ${h.crashPoint < 200 ? "low" : "high"}`}>
                {(h.crashPoint / 100).toFixed(2)}x
              </span>
            ))
          )}
        </div>

        <div className="game-round-bar">
          <div className="game-round-id">
            Round ID: {roundShort}
            <button onClick={copyRoundId} aria-label="Copy round ID" title={copied ? "Copied!" : "Copy round ID"}>
              <IconCopy />
            </button>
          </div>
          {/* <span className="badge-pill game-mode-badge">Basic Mode</span> */}
          <div className="game-players">
            <span className="dot" />
            {playerCount} {playerCount === 1 ? "player" : "players"} this round
          </div>
        </div>

        <div className="game-layout">
          <div className="game-main-col">
            <section className={`game-stage ${showGrid ? "" : "no-grid"}`} ref={stageRef}>
              <div className="game-stage-controls">
                <button className="game-stage-icon-btn" onClick={() => setShowGrid((v) => !v)} aria-label="Toggle grid" title="Toggle grid">
                  <IconChartLine />
                </button>
                <button className="game-stage-icon-btn" onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen">
                  <IconExpand />
                </button>
              </div>

              <GameChart phase={phase} multiplier={multiplier} roundId={state?.roundId} />
              <span className={`game-stage-baseline ${phase === "RUNNING" ? "moving" : ""}`} />

              {phase === "WAITING" && (
                <div className="game-waiting-badge">
                  <span className="game-waiting-badge-icon" />
                  <div className="game-waiting-text">Next Round</div>
                  <div className="game-waiting-bar">
                    <div
                      className="game-waiting-bar-fill"
                      style={{ width: `${Math.min(100, Math.max(0, ((WAITING_MS - msLeft) / WAITING_MS) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
              {phase === "RUNNING" && (
                <div className="game-multiplier running">
                  {multiplier.toFixed(2)}x
                  <span className="game-flying-status">
                    <span className="dot" />
                    FLYING HIGH
                  </span>
                </div>
              )}
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

            {authed && (
              <>
                <div className="game-bet-panel-head">
                  <h2 style={{marginRight:"2px"}}>Place Your Bet</h2>
                  {/* <span className="badge-pill">Demo Mode</span> */}
                </div>
                <div className="game-bet-panels-row">
                  <BetPanel
                    slot={1}
                    authed={authed}
                    phase={phase}
                    multiplier={multiplier}
                    roundId={state?.roundId}
                    myBet={myBets[1]}
                    balance={balance}
                    placeBetFn={socketPlaceBet}
                    cashOutFn={socketCashOut}
                  />
                  <BetPanel
                    slot={2}
                    authed={authed}
                    phase={phase}
                    multiplier={multiplier}
                    roundId={state?.roundId}
                    myBet={myBets[2]}
                    balance={balance}
                    placeBetFn={socketPlaceBet}
                    cashOutFn={socketCashOut}
                  />
                </div>
                <div className="game-limits-note">
                  Min Bet: Rs{MIN_BET} &nbsp;|&nbsp; Max Bet: Rs{MAX_BET.toLocaleString()}
                </div>
              </>
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

        <div className="game-trust-row">
          <div className="game-trust-card" title={state?.serverSeedHash ? `Commit hash: ${state.serverSeedHash}` : undefined}>
            <span className="game-trust-icon"><IconShield /></span>
            <b>Provably Fair</b>
            <span>Crash point is hashed before every round starts</span>
          </div>
          <div className="game-trust-card">
            <span className="game-trust-icon"><IconStar /></span>
            <b>Demo Credits Only</b>
            <span>No real money is used, wagered, or paid out</span>
          </div>
          <div className="game-trust-card">
            <span className="game-trust-icon"><IconHeadset /></span>
            <b>Need Help?</b>
            <Link href="/support">Contact support</Link>
          </div>
          <div className="game-trust-card">
            <span className="game-trust-icon"><IconGlobe /></span>
            <b>How to Play</b>
            <Link href="/legal/betting-rules" target="_blank" rel="noopener noreferrer">Read the rules</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
