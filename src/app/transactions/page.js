"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft } from "../icons";
import BottomNav from "../components/BottomNav";
import TransactionHistoryCard from "../components/TransactionHistoryCard";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "deposit", label: "Deposit" },
  { key: "withdraw", label: "Withdraw" },
  { key: "game", label: "Game" },
];

export default function TransactionsPage() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((version) => version + 1);
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

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
    fetch(`/api/transactions?type=${filter}&page=${page}`, { cache: "no-store" })
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
  }, [filter, page, refreshVersion]);

  return (
    <div className="kk-page transaction-history-page">
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
            <div className="transaction-history-list">
              {items.map((tx) => <TransactionHistoryCard key={tx._id} transaction={tx} />)}
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
