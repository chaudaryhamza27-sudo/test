"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconChevronLeft, IconGameHistory } from "../../icons";
import BottomNav from "../../components/BottomNav";

const money = (n) => `Rs${Number(n ?? 0).toLocaleString()}`;
const mult = (n) => `${(Number(n ?? 0)).toFixed(2)}x`;

export default function GameHistoryPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/game/my-history?page=${page}`)
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
        <Link href="/profile" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Game History</span>
        <span className="kk-header-side" />
      </header>

      <main>
        {loading ? (
          <div className="kk-empty">
            <span>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="kk-empty">
            <IconGameHistory style={{ margin: "0 auto" }} />
            <b>No rounds played yet</b>
            <span>Place a bet on the Aviator crash game to see your round history here.</span>
          </div>
        ) : (
          <>
            <div className="kk-list" style={{ margin: "14px 16px 0" }}>
              {items.map((r) => {
                const won = r.status === "cashed_out";
                const running = r.status === "placed";
                const tone = won ? "var(--success)" : running ? "var(--warning)" : "var(--danger)";
                const label = won ? "Won" : running ? "Running" : "Lost";
                return (
                  <div className="kk-list-item" key={r.id} style={{ cursor: "default", alignItems: "flex-start" }}>
                    <span className="label" style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span>Wagered {money(r.amount)}{won ? ` · cashed out ${mult(r.cashoutMultiplier)}` : ""}</span>
                      <span style={{ fontSize: 11, color: "var(--kk-muted)", fontWeight: 400 }}>
                        {running ? "Round in progress" : `Crashed at ${mult((r.crashPoint ?? 0) / 100)}`} · {new Date(r.createdAt).toLocaleString()}
                        {r.roundId ? ` · Round ${String(r.roundId).slice(-8)}` : ""}
                      </span>
                    </span>
                    <span style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: tone }}>
                        {won ? `+${money(r.payout)}` : running ? money(r.amount) : `-${money(r.amount)}`}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginTop: 2, color: tone }}>
                        {label}
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

        <footer className="kk-footer">Every round here used demo credits only — no real money was wagered or won.</footer>
      </main>

      <BottomNav />
    </div>
  );
}
