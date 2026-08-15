"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import AdminLayout from "./AdminLayout";

const STATUS_TONE = {
  approved: "success",
  completed: "success",
  COMPLETED: "success",
  APPROVED: "success",
  cashed_out: "success",
  rejected: "danger",
  FAILED: "danger",
  CANCELLED: "danger",
  lost: "danger",
  pending: "warning",
  PENDING: "warning",
  placed: "warning",
  REFUNDED: "info",
};
function statusTone(status) {
  return STATUS_TONE[status] || "neutral";
}
function StatusPill({ status }) {
  return <span className={`admin-status-pill tone-${statusTone(status)}`}>{status}</span>;
}

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

function PageHead({ title, sub, badge }) {
  return (
    <div className="admin-page-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {badge && <span className="admin-demo-badge">EDUCATIONAL DEMO · SIMULATION MODE · NO REAL MONEY</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("dashboard");
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
  const [paymentFilters, setPaymentFilters] = useState({ status: "all", provider: "all", orderId: "", user: "" });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [proofModal, setProofModal] = useState(null);

  // Balance Manager
  const [balanceSearch, setBalanceSearch] = useState("");
  const [selectedBalanceUser, setSelectedBalanceUser] = useState(null);
  const [balanceDeltaInput, setBalanceDeltaInput] = useState("");
  const [balanceReason, setBalanceReason] = useState("");
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceSuccess, setBalanceSuccess] = useState("");

  // CashOut
  const [cashouts, setCashouts] = useState([]);
  const [cashoutsPage, setCashoutsPage] = useState(1);
  const [cashoutsTotalPages, setCashoutsTotalPages] = useState(1);
  const [cashoutsLoading, setCashoutsLoading] = useState(false);
  const [cashoutSearch, setCashoutSearch] = useState("");

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
    if (checking || tab !== "dashboard") return;
    fetch("/api/admin/overview")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setOverview)
      .catch(() => {});
  }, [checking, tab]);

  useEffect(() => {
    if (checking || tab !== "rounds") return;
    fetch(`/api/admin/game-rounds?page=${roundsPage}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setRounds(data.items || []);
        setRoundsTotalPages(data.totalPages || 1);
      })
      .catch(() => {});
  }, [checking, tab, roundsPage]);

  useEffect(() => {
    if (checking || tab !== "audit") return;
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
    if (paymentFilters.provider !== "all") params.set("provider", paymentFilters.provider);
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
    if (checking || tab !== "payments") return;
    loadPayments();
  }, [checking, tab, loadPayments]);

  const loadCashouts = useCallback(() => {
    setCashoutsLoading(true);
    const params = new URLSearchParams({ page: String(cashoutsPage) });
    if (cashoutSearch.trim()) params.set("user", cashoutSearch.trim());
    fetch(`/api/admin/cashouts?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setCashouts(data.items || []);
        setCashoutsTotalPages(data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setCashoutsLoading(false));
  }, [cashoutsPage, cashoutSearch]);

  useEffect(() => {
    if (checking || tab !== "cashouts") return;
    loadCashouts();
  }, [checking, tab, loadCashouts]);

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
    let rejectionReason;
    if (action === "reject") {
      rejectionReason = window.prompt("Reason for rejecting this deposit (shown to the user):", "Payment proof did not match the requested amount.");
      if (rejectionReason === null) return; // cancelled
    }
    setError("");
    const res = await fetch("/api/admin/deposits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId, action, rejectionReason }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to review deposit.");
      return;
    }
    loadAll();
  };

  const viewProof = async (transactionId) => {
    setError("");
    setProofModal({ loading: true, image: null });
    const res = await fetch(`/api/admin/deposits/${transactionId}/proof`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "No payment proof on file for this deposit.");
      setProofModal(null);
      return;
    }
    setProofModal({ loading: false, image: data.proofImage });
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

  const submitBalanceAdjust = async () => {
    if (!selectedBalanceUser) return;
    const delta = Number(balanceDeltaInput);
    setBalanceError("");
    setBalanceSuccess("");
    if (!Number.isFinite(delta) || delta === 0) {
      setBalanceError("Enter a non-zero amount (use a negative number to deduct).");
      return;
    }
    if (!balanceReason.trim()) {
      setBalanceError("A reason is required.");
      return;
    }
    const verb = delta > 0 ? "Credit" : "Debit";
    const confirmed = window.confirm(
      `${verb} Rs${Math.abs(delta).toLocaleString()} ${delta > 0 ? "to" : "from"} ${selectedBalanceUser.uid}'s balance?\n\nReason: ${balanceReason}`
    );
    if (!confirmed) return;

    setBalanceSubmitting(true);
    try {
      const res = await fetch("/api/admin/balance-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedBalanceUser._id, delta, reason: balanceReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBalanceError(data.error || "Failed to adjust balance.");
        return;
      }
      setSelectedBalanceUser(data.user);
      setBalanceDeltaInput("");
      setBalanceReason("");
      setBalanceSuccess(`Balance updated to Rs${Number(data.user.balance).toLocaleString()}.`);
      loadAll();
    } catch {
      setBalanceError("Something went wrong. Please try again.");
    } finally {
      setBalanceSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (checking) {
    return <div className="admin-root admin-loading-screen">Loading admin panel…</div>;
  }

  const filteredBalanceUsers = balanceSearch.trim()
    ? users.filter((u) => {
        const q = balanceSearch.trim().toLowerCase();
        return (
          u.uid?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <AdminLayout active={tab} onNavigate={setTab} onLogout={logout}>
      {error && <div className="admin-banner-error">{error}</div>}

      {tab === "dashboard" && (
        <div>
          <PageHead title="Dashboard" sub="Live stats pulled from the real database." badge />
          {!overview ? (
            <div className="admin-table-wrap" style={{ padding: 40, textAlign: "center", color: "var(--a-muted)" }}>
              Loading overview…
            </div>
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
                  <BarChart data={overview.registrationsByDay} valueKey="count" color="#4c8dff" />
                </div>
                <div className="admin-chart-card">
                  <h3>Approved demo deposits (last 14 days)</h3>
                  <BarChart data={overview.depositsByDay} valueKey="amount" color="#22c55e" formatValue={(v) => `Rs ${v.toLocaleString()}`} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "users" && (
        <div>
          <PageHead title="User Control" sub={`${users.length} registered users`} />
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <td>
                      <span className={`admin-status-pill tone-${u.isBanned ? "danger" : "success"}`}>{u.isBanned ? "Banned" : "Active"}</span>
                    </td>
                    <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                    <td>
                      {u.role !== "admin" && (
                        <>
                          <button className="admin-small-btn" onClick={() => toggleBan(u._id, !u.isBanned)}>
                            {u.isBanned ? "Unban" : "Ban"}
                          </button>
                          <button className="admin-small-btn" onClick={() => resetBalance(u._id)}>
                            Reset balance
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty">
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "withdrawals" && (
        <div>
          <PageHead title="Withdraws" sub={`${withdrawals.length} withdrawal requests`} />
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <td>
                      <StatusPill status={w.status} />
                    </td>
                    <td>
                      {w.status === "pending" && (
                        <>
                          <button className="admin-small-btn approve" onClick={() => reviewWithdrawal(w._id, "approve")}>
                            Approve
                          </button>
                          <button className="admin-small-btn reject" onClick={() => reviewWithdrawal(w._id, "reject")}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No withdraw requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "balance" && (
        <div>
          <PageHead title="Balance Manager" sub="Search a user, then credit or debit their demo balance with a reason. Every change is audit-logged." />

          <div className="admin-search-row">
            <input
              placeholder="Search by UID, name, email or phone…"
              value={balanceSearch}
              onChange={(e) => setBalanceSearch(e.target.value)}
            />
          </div>

          {balanceSearch.trim() && !selectedBalanceUser && (
            <div style={{ marginBottom: 20 }}>
              {filteredBalanceUsers.length === 0 ? (
                <div className="admin-table-wrap" style={{ padding: 24, textAlign: "center", color: "var(--a-muted)" }}>
                  No matching users.
                </div>
              ) : (
                filteredBalanceUsers.slice(0, 8).map((u) => (
                  <div
                    key={u._id}
                    className="admin-user-result"
                    onClick={() => {
                      setSelectedBalanceUser(u);
                      setBalanceError("");
                      setBalanceSuccess("");
                    }}
                  >
                    <div>
                      <b>{u.uid}</b>
                      <span>
                        {u.name || "—"} · {u.email || u.phone || "—"}
                      </span>
                    </div>
                    <div className="admin-balance-value">Rs {Number(u.balance).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedBalanceUser && (
            <div className="admin-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <b style={{ fontSize: 15 }}>{selectedBalanceUser.uid}</b>
                  <div style={{ fontSize: 12, color: "var(--a-muted)", marginTop: 2 }}>
                    {selectedBalanceUser.name || "—"} · {selectedBalanceUser.email || selectedBalanceUser.phone || "—"}
                  </div>
                </div>
                <button
                  className="admin-small-btn"
                  onClick={() => {
                    setSelectedBalanceUser(null);
                    setBalanceSearch("");
                    setBalanceError("");
                    setBalanceSuccess("");
                  }}
                >
                  Change user
                </button>
              </div>

              <div style={{ marginBottom: 18 }}>
                <span style={{ fontSize: 11, color: "var(--a-muted)", textTransform: "uppercase", letterSpacing: 0.4 }}>Current balance</span>
                <div className="admin-balance-value" style={{ fontSize: 24, marginTop: 4 }}>
                  Rs {Number(selectedBalanceUser.balance).toLocaleString()}
                </div>
              </div>

              <div className="admin-modal-field">
                <label>Amount (Rs) — negative to deduct</label>
                <input
                  type="number"
                  placeholder="e.g. 500 or -500"
                  value={balanceDeltaInput}
                  onChange={(e) => setBalanceDeltaInput(e.target.value)}
                  disabled={balanceSubmitting}
                />
              </div>
              <div className="admin-modal-field">
                <label>Reason (required, shown in audit log)</label>
                <input
                  placeholder="e.g. Compensation for a bug, manual correction…"
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  disabled={balanceSubmitting}
                />
              </div>

              {balanceError && <div className="admin-banner-error">{balanceError}</div>}
              {balanceSuccess && (
                <div className="admin-banner-error" style={{ background: "var(--a-success-bg)", borderColor: "rgba(34,197,94,.3)", color: "#c9f7d9" }}>
                  {balanceSuccess}
                </div>
              )}

              <button className="admin-small-btn approve" style={{ padding: "10px 18px", fontSize: 12.5 }} onClick={submitBalanceAdjust} disabled={balanceSubmitting}>
                {balanceSubmitting ? "Submitting…" : "Apply balance change"}
              </button>
            </div>
          )}

          {!balanceSearch.trim() && !selectedBalanceUser && (
            <div className="admin-table-wrap" style={{ padding: 40, textAlign: "center", color: "var(--a-muted)" }}>
              Search for a user above to manage their balance.
            </div>
          )}
        </div>
      )}

      {tab === "cashouts" && (
        <div>
          <PageHead title="CashOut" sub="Real Aviator cashout activity — bets a player already cashed out mid-round." />

          <div className="admin-filter-bar">
            <input
              placeholder="Search by UID or email…"
              value={cashoutSearch}
              onChange={(e) => {
                setCashoutsPage(1);
                setCashoutSearch(e.target.value);
              }}
            />
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Bet (Rs)</th>
                  <th>Cashout (x)</th>
                  <th>Round Crash</th>
                  <th>Payout (Rs)</th>
                  <th>Cashed Out</th>
                </tr>
              </thead>
              <tbody>
                {cashoutsLoading ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      Loading…
                    </td>
                  </tr>
                ) : cashouts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty">
                      No cashouts yet.
                    </td>
                  </tr>
                ) : (
                  cashouts.map((c) => (
                    <tr key={c.id}>
                      <td>{c.user?.uid || "—"}</td>
                      <td>Rs {Number(c.amount).toLocaleString()}</td>
                      <td style={{ color: "var(--a-success)", fontWeight: 800 }}>{c.cashoutMultiplier ? `${c.cashoutMultiplier.toFixed(2)}x` : "—"}</td>
                      <td>{c.roundCrashPoint ? `${(c.roundCrashPoint / 100).toFixed(2)}x` : "—"}</td>
                      <td>Rs {Number(c.payout).toLocaleString()}</td>
                      <td>{new Date(c.cashedOutAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={cashoutsPage <= 1} onClick={() => setCashoutsPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {cashoutsPage} of {cashoutsTotalPages}
            </span>
            <button disabled={cashoutsPage >= cashoutsTotalPages} onClick={() => setCashoutsPage((p) => Math.min(cashoutsTotalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}

      {tab === "deposits" && (
        <div>
          <PageHead title="Deposits" sub={`${deposits.length} deposit requests`} />
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Proof</th>
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
                    <td>
                      {d.hasProof ? (
                        <button className="admin-small-btn" onClick={() => viewProof(d._id)}>
                          View Proof
                        </button>
                      ) : (
                        <span className="empty">None</span>
                      )}
                    </td>
                    <td>
                      <StatusPill status={d.status} />
                      {d.status === "rejected" && d.rejectionReason && (
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{d.rejectionReason}</div>
                      )}
                    </td>
                    <td>
                      {d.status === "pending" && (
                        <>
                          <button className="admin-small-btn approve" onClick={() => reviewDeposit(d._id, "approve")}>
                            Approve
                          </button>
                          <button className="admin-small-btn reject" onClick={() => reviewDeposit(d._id, "reject")}>
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {deposits.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      No deposit requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "rounds" && (
        <div>
          <PageHead title="Game Rounds" sub="Every Aviator round, real crash points and aggregated bet activity." />
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <td colSpan={6} className="empty">
                      No rounds yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={roundsPage <= 1} onClick={() => setRoundsPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {roundsPage} of {roundsTotalPages}
            </span>
            <button disabled={roundsPage >= roundsTotalPages} onClick={() => setRoundsPage((p) => Math.min(roundsTotalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div>
          <PageHead title="Payments" sub="PayPal Sandbox / Paybost gateway records." />
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
            <select
              value={paymentFilters.provider}
              onChange={(e) => {
                setPaymentsPage(1);
                setPaymentFilters((f) => ({ ...f, provider: e.target.value }));
              }}
            >
              <option value="all">All providers</option>
              <option value="paypal">PayPal</option>
              <option value="paybost">Paybost</option>
            </select>
            <input
              placeholder="Provider order ID"
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
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Provider</th>
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
                    <td>{p.provider}</td>
                    <td>{p.userId?.uid || "—"}</td>
                    <td>
                      {p.currency} {(p.amount / 100).toFixed(2)}
                    </td>
                    <td title={p.providerOrderId}>{p.providerOrderId?.slice(0, 14)}…</td>
                    <td>{p.providerCaptureId ? `${p.providerCaptureId.slice(0, 10)}…` : "—"}</td>
                    <td>
                      <StatusPill status={p.status} />
                    </td>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <button className="admin-small-btn" onClick={() => setSelectedPayment(p)}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty">
                      No payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={paymentsPage <= 1} onClick={() => setPaymentsPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {paymentsPage} of {paymentsTotalPages}
            </span>
            <button disabled={paymentsPage >= paymentsTotalPages} onClick={() => setPaymentsPage((p) => Math.min(paymentsTotalPages, p + 1))}>
              Next
            </button>
          </div>

          {selectedPayment && (
            <div className="admin-modal-backdrop" onClick={() => setSelectedPayment(null)}>
              <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Payment {selectedPayment._id}</h3>
                <dl>
                  <dt>User</dt>
                  <dd>
                    {selectedPayment.userId?.uid || selectedPayment.userId} ({selectedPayment.userId?.email || "—"})
                  </dd>
                  <dt>Amount</dt>
                  <dd>
                    {selectedPayment.currency} {(selectedPayment.amount / 100).toFixed(2)}
                  </dd>
                  <dt>Provider</dt>
                  <dd>{selectedPayment.provider}</dd>
                  <dt>Provider Order ID</dt>
                  <dd>{selectedPayment.providerOrderId}</dd>
                  <dt>Provider Capture ID</dt>
                  <dd>{selectedPayment.providerCaptureId || "—"}</dd>
                  <dt>Status</dt>
                  <dd>
                    <StatusPill status={selectedPayment.status} />
                  </dd>
                  <dt>Created</dt>
                  <dd>{new Date(selectedPayment.createdAt).toLocaleString()}</dd>
                  <dt>Updated</dt>
                  <dd>{new Date(selectedPayment.updatedAt).toLocaleString()}</dd>
                  <dt>Credited At</dt>
                  <dd>{selectedPayment.creditedAt ? new Date(selectedPayment.creditedAt).toLocaleString() : "—"}</dd>
                </dl>
                <p className="admin-modal-note">
                  {selectedPayment.provider === "paybost" ? (
                    <>
                      Paybost has no status/query API — this payment can only ever move to COMPLETED via a verified, signature-checked IPN webhook from
                      Paybost itself. There is nothing to re-verify manually; an admin can never mark it COMPLETED by hand.
                    </>
                  ) : (
                    <>
                      Re-verify re-fetches this order directly from PayPal and reconciles our record against it. An admin can never mark a payment
                      COMPLETED by hand — only a verified PayPal capture can do that.
                    </>
                  )}
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  {selectedPayment.provider !== "paybost" && (
                    <button className="admin-small-btn approve" disabled={verifying} onClick={() => reverifyPayment(selectedPayment._id)}>
                      {verifying ? "Verifying…" : "Re-verify with PayPal"}
                    </button>
                  )}
                  <button className="admin-small-btn" onClick={() => setSelectedPayment(null)}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        <div>
          <PageHead title="Audit Log" sub="Every admin and system action, in order." />
          <div className="admin-table-wrap">
            <table className="admin-table">
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
                    <td colSpan={4} className="empty">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <button disabled={auditPage <= 1} onClick={() => setAuditPage((p) => Math.max(1, p - 1))}>
              Prev
            </button>
            <span>
              Page {auditPage} of {auditTotalPages}
            </span>
            <button disabled={auditPage >= auditTotalPages} onClick={() => setAuditPage((p) => Math.min(auditTotalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}

      {proofModal && (
        <div className="admin-modal-backdrop" onClick={() => setProofModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Payment Proof</h3>
            {proofModal.loading ? (
              <p className="admin-modal-note">Loading…</p>
            ) : proofModal.image?.startsWith("data:application/pdf") ? (
              <p className="admin-modal-note">
                This proof was uploaded as a PDF —{" "}
                <a href={proofModal.image} target="_blank" rel="noopener noreferrer">
                  open it in a new tab
                </a>
                .
              </p>
            ) : (
              <img src={proofModal.image} alt="Payment proof" style={{ maxWidth: "100%", borderRadius: 8, display: "block" }} />
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <button className="admin-small-btn" onClick={() => setProofModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
