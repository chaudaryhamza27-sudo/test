"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconGift, IconActivity, IconChevronLeft } from "../icons";
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
  account_banned: "Account disabled",
  account_unbanned: "Account re-enabled",
  balance_adjusted: "Balance updated",
};

export default function ActivityPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/activity?page=${page}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Activity</span>
        <span className="kk-header-side" />
      </header>

      <main>
        {loading ? (
          <div className="kk-empty">
            <span>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="kk-empty">
            <IconGift style={{ margin: "0 auto" }} />
            <b>No activities yet</b>
            <span>Sign in, deposit, withdraw or play to see your activity here.</span>
          </div>
        ) : (
          <>
            <div className="kk-list" style={{ margin: "14px 16px 0" }}>
              {items.map((item) => (
                <div className="kk-list-item" key={item._id} style={{ cursor: "default" }}>
                  <span className="kk-list-item-icon">
                    <IconActivity />
                  </span>
                  <span className="label" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span>{ACTION_LABELS[item.action] || item.action}</span>
                    <span style={{ fontSize: 11, color: "var(--kk-muted)", fontWeight: 400 }}>{item.message}</span>
                  </span>
                  <span className="chev" style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
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
    </div>
  );
}
