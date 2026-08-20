"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconGift,
  IconActivity,
  IconChevronLeft,
  IconChevronDown,
  IconAccount,
  IconDeposit,
  IconWithdraw,
  IconGame,
  IconTrophy,
  IconWallet,
  IconShield,
} from "../icons";
import BottomNav from "../components/BottomNav";

const ACTION_LABELS = {
  signup: "Account created",
  login: "Logged in",
  logout: "Logged out",
  login_failed: "Failed login attempt",
  deposit_requested: "Deposit requested",
  withdraw_requested: "Withdrawal requested",
  deposit_approved: "Deposit approved",
  deposit_rejected: "Deposit rejected",
  withdraw_approved: "Withdrawal approved",
  withdraw_rejected: "Withdrawal rejected",
  game_bet_placed: "Game bet placed",
  game_cashout: "Game cash-out",
  account_banned: "Withdrawals restricted",
  account_unbanned: "Withdrawals re-enabled",
  balance_adjusted: "Balance updated",
};

const ACTION_META = {
  signup: { tag: "Account", icon: IconAccount, bg: "linear-gradient(160deg,#33d19a,#1a9450)", dot: "var(--success)" },
  login: { tag: "Account", icon: IconAccount, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)", dot: "var(--link)" },
  logout: { tag: "Account", icon: IconAccount, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)", dot: "var(--link)" },
  login_failed: { tag: "Security", icon: IconShield, bg: "linear-gradient(160deg,#ff6b6b,#c0392b)", dot: "var(--danger)" },
  deposit_requested: { tag: "Deposit", icon: IconDeposit, bg: "linear-gradient(160deg,#ffb23d,#e8531b)", dot: "var(--warning)" },
  deposit_approved: { tag: "Deposit", icon: IconDeposit, bg: "linear-gradient(160deg,#33d19a,#1a9450)", dot: "var(--success)" },
  deposit_rejected: { tag: "Deposit", icon: IconDeposit, bg: "linear-gradient(160deg,#ff6b6b,#c0392b)", dot: "var(--danger)" },
  withdraw_requested: { tag: "Withdraw", icon: IconWithdraw, bg: "linear-gradient(160deg,#ffb23d,#e8531b)", dot: "var(--warning)" },
  withdraw_approved: { tag: "Withdraw", icon: IconWithdraw, bg: "linear-gradient(160deg,#33d19a,#1a9450)", dot: "var(--success)" },
  withdraw_rejected: { tag: "Withdraw", icon: IconWithdraw, bg: "linear-gradient(160deg,#ff6b6b,#c0392b)", dot: "var(--danger)" },
  game_bet_placed: { tag: "Aviator", icon: IconGame, bg: "linear-gradient(160deg,#4aa8ff,#1565e8)", dot: "var(--link)" },
  game_cashout: { tag: "Aviator", icon: IconTrophy, bg: "linear-gradient(160deg,#7c5cff,#4a2fd6)", dot: "var(--violet)" },
  account_banned: { tag: "Account", icon: IconAccount, bg: "linear-gradient(160deg,#ff6b6b,#c0392b)", dot: "var(--danger)" },
  account_unbanned: { tag: "Account", icon: IconAccount, bg: "linear-gradient(160deg,#33d19a,#1a9450)", dot: "var(--success)" },
  balance_adjusted: { tag: "Wallet", icon: IconWallet, bg: "linear-gradient(160deg,#33d19a,#1a9450)", dot: "var(--success)" },
};
const DEFAULT_META = { tag: "Activity", icon: IconActivity, bg: "linear-gradient(160deg,#8891A3,#565D6E)", dot: "var(--text-muted)" };

const FILTERS = ["All Activity", "Account", "Deposit", "Withdraw", "Aviator", "Wallet", "Security"];

const money = (n) => `Rs${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Which field in an activity's `meta` represents a real money amount, and
// which direction it moved — derived from the same meta objects logActivity()
// already writes for these actions (see src/lib/gameActions.js, api/deposit,
// api/withdraw, api/admin/deposits, api/admin/withdrawals).
function getAmountBadge(item) {
  const meta = item.meta || {};
  switch (item.action) {
    case "game_bet_placed":
      return meta.amount != null ? { sign: "-", value: meta.amount } : null;
    case "game_cashout":
      return meta.payout != null ? { sign: "+", value: meta.payout } : null;
    case "deposit_approved":
      return meta.amount != null ? { sign: "+", value: meta.amount } : null;
    case "deposit_requested":
      return meta.amount != null ? { sign: "+", value: meta.amount, pending: true } : null;
    case "withdraw_requested":
      return meta.amount != null ? { sign: "-", value: meta.amount, pending: true } : null;
    case "withdraw_approved":
      return meta.amount != null ? { sign: "-", value: meta.amount } : null;
    default:
      return null;
  }
}

export default function ActivityPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All Activity");
  const [filterOpen, setFilterOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [totalActivity, setTotalActivity] = useState(0);
  const [popup, setPopup] = useState(null);
  const filterRef = useRef(null);

  const openDemo = (label) => setPopup(label);
  const closeDemo = () => setPopup(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/activity?page=${page}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotalActivity(data.total || 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Real aggregates for the summary row — reusing endpoints already built for
  // Wallet and Game History rather than adding a new one just for this page.
  useEffect(() => {
    fetch("/api/wallet/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((walletStats) =>
        fetch("/api/game/my-history?page=1")
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((history) => setStats({ ...walletStats, gamesPlayed: history.total || 0 }))
      )
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const visibleItems = items.filter((item) => {
    if (filter === "All Activity") return true;
    return (ACTION_META[item.action] || DEFAULT_META).tag === filter;
  });

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <div style={{ textAlign: "center" }}>
          <span className="kk-header-title" style={{ display: "block" }}>Activity</span>
          <span style={{ fontSize: 11, color: "var(--kk-muted)" }}>Track your recent actions and updates</span>
        </div>
        <div ref={filterRef} style={{ position: "relative" }}>
          <button className="kk-activity-filter" onClick={() => setFilterOpen((v) => !v)}>
            {filter}
            <IconChevronDown style={{ width: 12, height: 12 }} />
          </button>
          {filterOpen && (
            <div className="notif-dropdown profile-dropdown" style={{ width: 160 }}>
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className="profile-menu-item"
                  onClick={() => {
                    setFilter(f);
                    setFilterOpen(false);
                  }}
                >
                  <span>{f}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="kk-quick-actions">
          <button className="kk-quick-action" onClick={() => openDemo("Activity Award")}>
            <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#ff8a65,#e64a19)" }}>
              <IconTrophy />
            </span>
            <span>Activity Award</span>
          </button>
          <button className="kk-quick-action" onClick={() => openDemo("Betting Rebate")}>
            <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
              <IconWallet />
            </span>
            <span>Betting Rebate</span>
          </button>
          <button className="kk-quick-action" onClick={() => openDemo("Super Jackpot")}>
            <span className="kk-quick-action-icon" style={{ background: "linear-gradient(160deg,#4de8c0,#12a883)" }}>
              <IconTrophy />
            </span>
            <span>Super Jackpot</span>
          </button>
        </section>

        <section className="kk-promo-grid">
          <button className="kk-promo-card" onClick={() => openDemo("")}>
            <div className="kk-promo-card-art" style={{ background: "linear-gradient(135deg,#ff8a80,#ff5252)" }}>🎁</div>
            <div className="kk-promo-card-body">
              <b>Gifts</b>
              <p>Enter the redemption code to receive gift rewards</p>
            </div>
          </button>
          <button className="kk-promo-card" onClick={() => openDemo("")}>
            <div className="kk-promo-card-art" style={{ background: "linear-gradient(135deg,#ffab91,#ff7043)" }}>📅</div>
            <div className="kk-promo-card-body">
              <b>Attendance bonus</b>
              <p>The more consecutive days you sign in, the higher the reward will be.</p>
            </div>
          </button>
        </section>

        {/* <button className="kk-promo-banner" onClick={() => openDemo("Recharge Bonus")}>
          <div className="kk-promo-banner-art" style={{ "--a": "#3f7fe0", "--b": "#153e91" }}>
            <div className="kk-promo-banner-title">
              Recharge
              <br />
              Bonus
            </div>
          </div>
          <div className="kk-promo-banner-body">
            <b>Recharge bonus</b>
          </div>
        </button>

        <button className="kk-promo-banner" style={{ marginBottom: 8 }} onClick={() => openDemo("Streak Bonus")}>
          <div className="kk-promo-banner-art" style={{ "--a": "#2f6fe0", "--b": "#123a8f" }}>
            <div className="kk-promo-banner-title">
              Streak
              <br />
              Bonus
            </div>
          </div>
          <div className="kk-promo-banner-body">
            <b>Login streak bonus</b>
          </div>
        </button> */}

        <div className="kk-activity-stats">
          <div className="kk-activity-stat">
            <div className="kk-activity-stat-icon" style={{ background: "linear-gradient(160deg,#4aa8ff,#1565e8)" }}>
              <IconGame />
            </div>
            <div>
              <b>{stats ? String(stats.gamesPlayed).padStart(2, "0") : "…"}</b>
              <span>Games Played</span>
            </div>
          </div>
          <div className="kk-activity-stat">
            <div className="kk-activity-stat-icon" style={{ background: "linear-gradient(160deg,#33d19a,#1a9450)" }}>
              <IconDeposit />
            </div>
            <div>
              <b className="win">{stats ? money(stats.totalDeposited) : "…"}</b>
              <span>Total Deposited</span>
            </div>
          </div>
          <div className="kk-activity-stat">
            <div className="kk-activity-stat-icon" style={{ background: "linear-gradient(160deg,#7c5cff,#4a2fd6)" }}>
              <IconWithdraw />
            </div>
            <div>
              <b>{stats ? money(stats.totalWithdrawn) : "…"}</b>
              <span>Total Withdrawn</span>
            </div>
          </div>
          <div className="kk-activity-stat">
            <div className="kk-activity-stat-icon" style={{ background: "linear-gradient(160deg,#ffb23d,#e8531b)" }}>
              <IconActivity />
            </div>
            <div>
              <b>{String(totalActivity).padStart(2, "0")}</b>
              <span>Total Transactions</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="kk-empty">
            <span>Loading…</span>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="kk-empty">
            <IconGift style={{ margin: "0 auto" }} />
            <b>No activity yet</b>
            <span>Sign in, deposit, withdraw or play to see your activity here.</span>
          </div>
        ) : (
          <>
            <div className="kk-activity-head">
              <h2>Recent Activity</h2>
              <p>Your latest updates and events</p>
            </div>

            <div className="kk-timeline">
              {visibleItems.map((item, i) => {
                const meta = ACTION_META[item.action] || DEFAULT_META;
                const Icon = meta.icon;
                const isLast = i === visibleItems.length - 1;
                const amountBadge = getAmountBadge(item);
                return (
                  <div className="kk-timeline-row" key={item._id}>
                    <div className="kk-timeline-rail">
                      <span className="kk-timeline-dot" style={{ background: meta.dot }} />
                      {!isLast && <span className="kk-timeline-line" />}
                    </div>
                    <div className="kk-timeline-card">
                      <div className="kk-timeline-icon" style={{ background: meta.bg }}>
                        <Icon />
                      </div>
                      <div className="kk-timeline-body">
                        <div className="kk-timeline-title">{ACTION_LABELS[item.action] || item.action}</div>
                        <div className="kk-timeline-msg">{item.message}</div>
                        <span className="badge-pill badge-neutral kk-timeline-tag">{meta.tag}</span>
                      </div>
                      <div className="kk-timeline-time">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {amountBadge && (
                          <span className={`badge-pill ${amountBadge.pending ? "badge-warning" : "badge-success"} kk-timeline-amount`}>
                            {amountBadge.sign} {money(amountBadge.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 10, margin: "16px" }}>
                <button
                  className="kk-notice-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ opacity: page <= 1 ? 0.5 : 1 }}
                >
                  Prev
                </button>
                <span style={{ alignSelf: "center", fontSize: 12, color: "var(--kk-muted)" }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="kk-notice-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{ opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeDemo}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">🎁</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">
            &quot;{popup}&quot; is a placeholder tile in this UI showcase — no real bonus is credited.
          </p>
          <button className="kk-popup-btn" onClick={closeDemo}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
