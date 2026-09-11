"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronRight, IconDeposit, IconWithdraw, IconHistory } from "../icons";
import TransactionHistoryCard from "./TransactionHistoryCard";

const TYPE_ICONS = {
  deposit: IconDeposit,
  withdraw: IconWithdraw,
};

const TYPE_LABELS = {
  deposit: "Deposit",
  withdraw: "Withdraw",
};

export default function HistoryList({ type, title }) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);

  // Deposit and withdrawal reviews happen in a separate admin session. Refresh
  // a mounted history when the user returns to it, with a light background
  // check while it stays open, so a confirmed review cannot remain displayed
  // as Pending until the user manually reloads the page.
  useEffect(() => {
    const refresh = () => setRefreshVersion((version) => version + 1);
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/transactions?type=${type}&page=${page}`, { cache: "no-store" })
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
  }, [type, page, refreshVersion]);

  const TypeIcon = TYPE_ICONS[type] || IconHistory;

  return (
    <>
      <div className="kk-section-head" style={{ padding: "18px 16px 8px" }}>
        <span className="kk-section-title" style={{ fontSize: 15 }}>{title}</span>
        <Link href={`/transactions?type=${type}`} className="view-all" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          View All <IconChevronRight style={{ width: 12, height: 12 }} />
        </Link>
      </div>

      {loading ? (
        <div className="card kk-history-empty" style={{ margin: "10px 16px 0" }}>
          <div className="kk-history-empty-icon kk-history-empty-icon-pulse">
            <IconHistory />
          </div>
          <span>Loading…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="card kk-history-empty" style={{ margin: "10px 16px 0" }}>
          <div className="kk-history-empty-icon">
            <TypeIcon />
          </div>
          <b>No {TYPE_LABELS[type].toLowerCase()}s yet</b>
          <span>Your {TYPE_LABELS[type].toLowerCase()} history will show up here.</span>
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
    </>
  );
}
