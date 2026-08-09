"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const TABS = ["Overview", "Users", "Deposits", "Withdrawals", "Game Rounds", "Payments", "Audit Log"];

function StatCard({ label, value }) {
  return (
    <div className="admin-stat-card">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function BarChart({ data, valueKey, color, formatValue }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div className="admin-chart">
      {data.map((d) => (
        <div className="admin-chart-col" key={d.date}>
          <div className="admin-chart-bar-wrap">
            <div
              className="admin-chart-bar"
              style={{ height: `${Math.max(2, (d[valueKey] / max) * 100)}%`, background: color }}
              title={`${d.date}: ${formatValue ? formatValue(d[valueKey]) : d[valueKey]}`}
            />
          </div>
          <span>{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("Overview");
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [overview, setOverview] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [roundsPage, setRoundsPage] = useState(1);
  const [roundsTotalPages, setRoundsTotalPages] = useState(1);
  const [auditLog, setAuditLog] = useState([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [payments, setPayments] = useState([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);
  const [paymentFilters, setPaymentFilters] = useState({ status: "all", orderId: "", user: "" });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const loadAll = useCallback(async () => {
    const [usersRes, depositsRes, withdrawalsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/deposits"),
      fetch("/api/admin/withdrawals"),
    ]);

    if (usersRes.status === 403 || depositsRes.status === 403 || withdrawalsRes.status === 403) {
      router.push("/admin/login");
      return;
    }

    const usersData = await usersRes.json();
    const depositsData = await depositsRes.json();
    const withdrawalsData = await withdrawalsRes.json();

    setUsers(usersData.users || []);
    setDeposits(depositsData.deposits || []);
    setWithdrawals(withdrawalsData.withdrawals || []);
  }, [router]);

  useEffect(() => {
    (async () => {
      setChecking(true);
      try {
        await loadAll();
      } catch {
        setError("Failed to load admin data.");
      } finally {
        setChecking(false);
      }
    })();
  }, [loadAll]);

  useEffect(() => {
    if (checking || tab !== "Overview") return;
    fetch("/api/admin/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setOverview)
      .catch(() => {});
  }, [checking, tab]);

  useEffect(() => {
    if (checking || tab !== "Game Rounds") return;
    fetch(`/api/admin/game-rounds?page=${roundsPage}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setRounds(data.items || []);
        setRoundsTotalPages(data.totalPages || 1);
      })
      .catch(() => {});
  }, [checking, tab, roundsPage]);

  useEffect(() => {
    if (checking || tab !== "Audit Log") return;
    fetch(`/api/admin/audit-log?page=${auditPage}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setAuditLog(data.items || []);
        setAuditTotalPages(data.totalPages || 1);
      })
      .catch(() => {});
  }, [checking, tab, auditPage]);

  const loadPayments = useCallback(() => {
    const params = new URLSearchParams({ page: String(paymentsPage) });
    if (paymentFilters.status !== "all") params.set("status", paymentFilters.status);
    if (paymentFilters.orderId) params.set("orderId", paymentFilters.orderId);
    if (paymentFilters.user) params.set("user", paymentFilters.user);
    fetch(`/api/admin/payments?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setPayments(data.items || []);
        setPaymentsTotalPages(data.totalPages || 1);
      })
      .catch(() => {});
  }, [paymentsPage, paymentFilters]);

  useEffect(() => {
    if (checking || tab !== "Payments") return;
    loadPayments();
  }, [checking, tab, loadPayments]);

  const reverifyPayment = async (id) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/admin/payments/${id}/verify`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to re-verify payment.");
        return;
      }
      setSelectedPayment(data.payment);
      loadPayments();
    } finally {
      setVerifying(false);
    }
  };

  const reviewDeposit = async (transactionId, action) => {
    setError("");
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to review deposit.");
      return;
    }
    loadAll();
  };

  const reviewWithdrawal = async (transactionId, action) => {
    setError("");
    const res = await fetch("/api/admin/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, action }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to review withdrawal.");
      return;
    }
    loadAll();
  };

  const toggleBan = async (userId, isBanned) => {
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isBanned }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update user.");
      return;
    }
    loadAll();
  };

  const resetBalance = async (userId) => {
    const input = window.prompt("Set new demo balance (Rs):", "10000");
    if (input === null) return;
    const balance = Number(input);
    if (!Number.isFinite(balance) || balance < 0) {
      setError("Enter a valid non-negative number.");
      return;
    }
    setError("");
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, balance }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update balance.");
      return;
    }
    loadAll();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (checking) {
    return <div className="admin-shell admin-loading">Loading admin panel…</div>;
  }

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>Admin Panel</h1>
          <span className="admin-demo-badge">EDUCATIONAL DEMO · SIMULATION MODE · NO REAL MONEY</span>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      {error && <div className="admin-banner-error">{error}</div>}

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>

      {tab === "Overview" && (
        <div>
          {!overview ? (
            <div className="admin-loading-inline">Loading overview…</div>
          ) : (
            <>
              <div className="admin-stats-grid">
                <StatCard label="Total Users" value={overview.totalUsers} />
                <StatCard label="Active Users" value={overview.activeUsers} />
                <StatCard label="Demo Deposits" value={`Rs ${overview.totalDeposits.toLocaleString()}`} />
                <StatCard label="Demo Withdrawals" value={`Rs ${overview.totalWithdrawals.toLocaleString()}`} />
                <StatCard label="Total Transactions" value={overview.totalTransactions} />
                <StatCard label="Game Rounds" value={overview.totalGameRounds} />
                <StatCard label="Pending Deposits" value={overview.pendingDeposits} />
                <StatCard label="Pending Withdrawals" value={overview.pendingWithdrawals} />
              </div>

              <div className="admin-charts-grid">
                <div className="admin-chart-card">
                  <h3>User registrations (last 14 days)</h3>
                  <BarChart data={overview.registrationsByDay} valueKey="count" color="#28e7ff" />
                </div>
                <div className="admin-chart-card">
                  <h3>Approved demo deposits (last 14 days)</h3>
                  <BarChart data={overview.depositsByDay} valueKey="amount" color="#37f59a" formatValue={(v) => `Rs ${v.toLocaleString()}`} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "Users" && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>UID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Balance</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>{u.uid}</td>
                  <td>{u.name || "—"}</td>
                  <td>{u.phone || "—"}</td>
                  <td>{u.email || "—"}</td>
                  <td>Rs {Number(u.balance).toLocaleString()}</td>
                  <td>{u.role}</td>
                  <td>{u.isBanned ? "Banned" : "Active"}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                  <td>
                    {u.role !== "admin" && (
                      <>
                        <button className="small-btn" onClick={() => toggleBan(u._id, !u.isBanned)}>
                          {u.isBanned ? "Unban" : "Ban"}
                        </button>
                        <button className="small-btn" onClick={() => resetBalance(u._id)}>
                          Reset balance
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">No users yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Deposits" && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((d) => (
                <tr key={d._id}>
                  <td>{d.user?.uid || "—"}</td>
                  <td>Rs {Number(d.amount).toLocaleString()}</td>
                  <td>{d.method}</td>
                  <td>{d.status}</td>
                  <td>
                    {d.status === "pending" && (
                      <>
                        <button className="small-btn approve" onClick={() => reviewDeposit(d._id, "approve")}>
                          Approve
                        </button>
                        <button className="small-btn reject" onClick={() => reviewDeposit(d._id, "reject")}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">No deposit requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Withdrawals" && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Account</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w._id}>
                  <td>{w.user?.uid || "—"}</td>
                  <td>Rs {Number(w.amount).toLocaleString()}</td>
                  <td>{w.method}</td>
                  <td>{w.accountNumber}</td>
                  <td>{w.status}</td>
                  <td>
                    {w.status === "pending" && (
                      <>
                        <button className="small-btn approve" onClick={() => reviewWithdrawal(w._id, "approve")}>
                          Approve
                        </button>
                        <button className="small-btn reject" onClick={() => reviewWithdrawal(w._id, "reject")}>
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">No withdraw requests yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Game Rounds" && (
        <div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Started</th>
                  <th>Crash Point</th>
                  <th>Phase</th>
                  <th>Bets</th>
                  <th>Wagered</th>
                  <th>Paid Out</th>
                </tr>
              </thead>
              <tbody>
                {rounds.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.createdAt).toLocaleString()}</td>
                    <td>{(r.crashPoint / 100).toFixed(2)}x</td>
                    <td>{r.phase}</td>
                    <td>{r.bets}</td>
                    <td>Rs {Number(r.wagered).toLocaleString()}</td>
                    <td>Rs {Number(r.paidOut).toLocaleString()}</td>
                  </tr>
                ))}
                {rounds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">No rounds yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={roundsPage <= 1} onClick={() => setRoundsPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {roundsPage} of {roundsTotalPages}</span>
            <button disabled={roundsPage >= roundsTotalPages} onClick={() => setRoundsPage((p) => Math.min(roundsTotalPages, p + 1))}>Next</button>
          </div>
        </div>
      )}

      {tab === "Payments" && (
        <div>
          <div className="admin-filter-bar">
            <select
              value={paymentFilters.status}
              onChange={(e) => {
                setPaymentsPage(1);
                setPaymentFilters((f) => ({ ...f, status: e.target.value }));
              }}
            >
              {["all", "PENDING", "APPROVED", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"].map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? "All statuses" : s}
                </option>
              ))}
            </select>
            <input
              placeholder="PayPal order ID"
              value={paymentFilters.orderId}
              onChange={(e) => {
                setPaymentsPage(1);
                setPaymentFilters((f) => ({ ...f, orderId: e.target.value }));
              }}
            />
            <input
              placeholder="User (uid or email)"
              value={paymentFilters.user}
              onChange={(e) => {
                setPaymentsPage(1);
                setPaymentFilters((f) => ({ ...f, user: e.target.value }));
              }}
            />
          </div>

          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Provider Order ID</th>
                  <th>Capture ID</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td title={p._id}>{p._id.slice(-8)}</td>
                    <td>{p.userId?.uid || "—"}</td>
                    <td>
                      {p.currency} {(p.amount / 100).toFixed(2)}
                    </td>
                    <td title={p.providerOrderId}>{p.providerOrderId?.slice(0, 14)}…</td>
                    <td>{p.providerCaptureId ? `${p.providerCaptureId.slice(0, 10)}…` : "—"}</td>
                    <td>{p.status}</td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="small-btn" onClick={() => setSelectedPayment(p)}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">No PayPal payments yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={paymentsPage <= 1} onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {paymentsPage} of {paymentsTotalPages}</span>
            <button disabled={paymentsPage >= paymentsTotalPages} onClick={() => setPaymentsPage((p) => Math.min(paymentsTotalPages, p + 1))}>Next</button>
          </div>

          {selectedPayment && (
            <div className="admin-modal-backdrop" onClick={() => setSelectedPayment(null)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Payment {selectedPayment._id}</h3>
                <dl>
                  <dt>User</dt>
                  <dd>{selectedPayment.userId?.uid || selectedPayment.userId} ({selectedPayment.userId?.email || "—"})</dd>
                  <dt>Amount</dt>
                  <dd>{selectedPayment.currency} {(selectedPayment.amount / 100).toFixed(2)}</dd>
                  <dt>Provider</dt>
                  <dd>{selectedPayment.provider}</dd>
                  <dt>Provider Order ID</dt>
                  <dd>{selectedPayment.providerOrderId}</dd>
                  <dt>Provider Capture ID</dt>
                  <dd>{selectedPayment.providerCaptureId || "—"}</dd>
                  <dt>Status</dt>
                  <dd>{selectedPayment.status}</dd>
                  <dt>Created</dt>
                  <dd>{new Date(selectedPayment.createdAt).toLocaleString()}</dd>
                  <dt>Updated</dt>
                  <dd>{new Date(selectedPayment.updatedAt).toLocaleString()}</dd>
                  <dt>Credited At</dt>
                  <dd>{selectedPayment.creditedAt ? new Date(selectedPayment.creditedAt).toLocaleString() : "—"}</dd>
                </dl>
                <p className="admin-modal-note">
                  Re-verify re-fetches this order directly from PayPal and reconciles our record against it. An
                  admin can never mark a payment COMPLETED by hand — only a verified PayPal capture can do that.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="small-btn approve" disabled={verifying} onClick={() => reverifyPayment(selectedPayment._id)}>
                    {verifying ? "Verifying…" : "Re-verify with PayPal"}
                  </button>
                  <button className="small-btn" onClick={() => setSelectedPayment(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "Audit Log" && (
        <div>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((a) => (
                  <tr key={a._id}>
                    <td>{new Date(a.createdAt).toLocaleString()}</td>
                    <td>
                      {a.actorRole}
                      {a.user?.uid ? ` · ${a.user.uid}` : ""}
                    </td>
                    <td>{a.action}</td>
                    <td>{a.message}</td>
                  </tr>
                ))}
                {auditLog.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty">No activity recorded yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={auditPage <= 1} onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span>Page {auditPage} of {auditTotalPages}</span>
            <button disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}>Next</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-shell {
          min-height: 100vh;
          background: #07020f;
          color: #fff8ef;
          padding: 24px;
          font-family: sans-serif;
        }
        .admin-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #b9a8ce;
        }
        .admin-loading-inline {
          padding: 40px;
          text-align: center;
          color: #b9a8ce;
          font-size: 13px;
        }
        .admin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
        }
        .admin-header h1 {
          font-size: 22px;
        }
        .admin-demo-badge {
          display: inline-block;
          margin-top: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          border: 1px dashed rgba(255, 209, 102, 0.4);
          background: rgba(255, 209, 102, 0.08);
          color: #ffd166;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .admin-header button {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          border-radius: 10px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 12px;
        }
        .admin-banner-error {
          background: rgba(255, 77, 109, 0.14);
          border: 1px solid rgba(255, 77, 109, 0.28);
          color: #ffd9e0;
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 12px;
          margin-bottom: 16px;
        }
        .admin-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .admin-tabs button {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          color: #b9a8ce;
          border-radius: 10px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .admin-tabs button.active {
          background: linear-gradient(135deg, #ffd166, #ff3d81);
          color: #1a0614;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }
        .admin-stat-card {
          border-radius: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .admin-stat-card span {
          display: block;
          font-size: 11px;
          color: #b9a8ce;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .admin-stat-card b {
          display: block;
          margin-top: 8px;
          font-size: 22px;
        }
        .admin-charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }
        .admin-chart-card {
          border-radius: 16px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .admin-chart-card h3 {
          font-size: 13px;
          font-weight: 700;
          color: #eadff7;
          margin-bottom: 14px;
        }
        .admin-chart {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 120px;
        }
        .admin-chart-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }
        .admin-chart-bar-wrap {
          flex: 1;
          display: flex;
          align-items: flex-end;
          width: 100%;
        }
        .admin-chart-bar {
          width: 100%;
          border-radius: 4px 4px 0 0;
          min-height: 2px;
        }
        .admin-chart-col span {
          margin-top: 6px;
          font-size: 8px;
          color: #7a6a90;
        }
        .admin-table-wrap {
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th,
        td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          white-space: nowrap;
        }
        th {
          color: #b9a8ce;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .empty {
          text-align: center;
          color: #b9a8ce;
        }
        .small-btn {
          border: 0;
          border-radius: 8px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          margin-right: 6px;
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }
        .small-btn.approve {
          background: linear-gradient(135deg, #37f59a, #28e7ff);
          color: #06120e;
        }
        .small-btn.reject {
          background: linear-gradient(135deg, #ff5c5c, #ff3d81);
          color: #1a0614;
        }
        .admin-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
          font-size: 12px;
          color: #b9a8ce;
        }
        .admin-pagination button {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-radius: 8px;
          padding: 6px 14px;
          cursor: pointer;
        }
        .admin-pagination button:disabled {
          opacity: 0.4;
          cursor: default;
        }
        .admin-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }
        .admin-filter-bar select,
        .admin-filter-bar input {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 12px;
        }
        .admin-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
        }
        .admin-modal {
          width: 100%;
          max-width: 480px;
          background: #150a28;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 16px;
          padding: 22px;
        }
        .admin-modal h3 {
          font-size: 15px;
          margin-bottom: 14px;
          word-break: break-all;
        }
        .admin-modal dl {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 6px 14px;
          font-size: 12px;
          margin-bottom: 14px;
        }
        .admin-modal dt {
          color: #b9a8ce;
          font-weight: 700;
        }
        .admin-modal dd {
          word-break: break-all;
        }
        .admin-modal-note {
          font-size: 11px;
          color: #b9a8ce;
          line-height: 1.5;
          margin-bottom: 14px;
        }
      `}</style>
    </div>
  );
}
