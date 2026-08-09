"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft } from "../icons";
import BottomNav from "../components/BottomNav";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "game", label: "Game" },
];

const TYPE_LABELS = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  game_bet: "Game bet",
  game_win: "Game win",
};

const STATUS_TONE = {
  approved: "green",
  completed: "green",
  rejected: "red",
  pending: "orange",
};

export default function TransactionsPage() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Seed the initial filter from a `?type=` query param (e.g. linked from the
  // Wallet page's "Deposit history" / "Withdrawal history" shortcuts).
  useEffect(() => {
    const type = new URLSearchParams(window.location.search).get("type");
    if (type && FILTERS.some((f) => f.key === type)) setFilter(type);
  }, []);

  useEffect(() => setPage(1), [filter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/transactions?type=${filter}&page=${page}`)
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
  }, [filter, page]);

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/profile" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Transaction History</span>
        <span className="kk-header-side" />
      </header>

      <main>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "14px 16px 6px" }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                flexShrink: 0,
                border: 0,
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                background: filter === f.key ? "var(--kk-blue-grad)" : "var(--surface)",
                color: filter === f.key ? "#fff" : "var(--kk-text)",
                border: filter === f.key ? "none" : "1px solid var(--border)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="kk-empty">
            <span>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="kk-empty">
            <b>No transactions yet</b>
            <span>Deposits, withdrawals and game activity will show up here.</span>
          </div>
        ) : (
          <>
            <div className="kk-list" style={{ margin: "10px 16px 0" }}>
              {items.map((tx) => {
                const tone = STATUS_TONE[tx.status] || "";
                const isPayPal = tx.method === "PayPal Sandbox";
                return (
                  <div className="kk-list-item" key={tx._id} style={{ cursor: "default", alignItems: "flex-start" }}>
                    <span className="label" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isPayPal ? "Demo Deposit" : TYPE_LABELS[tx.type] || tx.type}
                        {isPayPal && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              padding: "2px 6px",
                              borderRadius: 999,
                              background: "var(--info-bg)",
                              color: "var(--kk-blue)",
                            }}
                          >
                            PAYPAL SANDBOX
                          </span>
                        )}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--kk-muted)", fontWeight: 400 }}>
                        {new Date(tx.createdAt).toLocaleString()}
                        {tx.method ? ` · ${tx.method}` : ""}
                        {tx._id ? ` · ${tx._id.slice(-8)}` : ""}
                      </span>
                    </span>
                    <span style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>
                        {tx.type === "withdraw" || tx.type === "game_bet" ? "-" : "+"}Rs{Number(tx.amount).toLocaleString()}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          marginTop: 2,
                          color: tone === "green" ? "var(--success)" : tone === "red" ? "var(--danger)" : tone === "orange" ? "var(--warning)" : "var(--kk-muted)",
                        }}
                      >
                        {tx.status}
                      </div>
                    </span>
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
    </div>
  );
}
