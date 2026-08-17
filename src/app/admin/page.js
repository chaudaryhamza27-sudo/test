"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import AdminLayout from "./AdminLayout";
import { IconUsers, IconShield, IconWallet, IconLockLine, IconX, IconEye, IconEyeOff, IconCheck, IconTrendingUp } from "../icons";

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

const AVATAR_COLORS = ["#7c5cff", "#4c8dff", "#22c55e", "#f5b82e", "#ff4d5a", "#14b8a6", "#a855f7"];

function avatarColor(seed) {
  let hash = 0;
  for (let i = 0; i < (seed || "").length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name, uid) {
  const source = (name || "").trim();
  if (source) {
    const parts = source.split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }
  return (uid || "??").slice(0, 2).toUpperCase();
}

function Avatar({ name, uid, size }) {
  return (
    <div className={`admin-avatar ${size === "lg" ? "lg" : ""}`} style={{ background: avatarColor(uid || name || "?") }}>
      {initials(name, uid)}
    </div>
  );
}

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

// Trust score is a 0-100 gauge; these tiers drive the label shown next to it
// admin-side and the "Account Health" message shown to the user themselves.
function trustTier(score) {
  const s = score ?? 50;
  if (s >= 70) return { label: "Trusted", tone: "success" };
  if (s >= 30) return { label: "Active", tone: "info" };
  return { label: "Under Review", tone: "warning" };
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
  const [userStatsModal, setUserStatsModal] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [banModal, setBanModal] = useState(null); // { user }
  const [banSubmitting, setBanSubmitting] = useState(false);
  const [resetBalanceModal, setResetBalanceModal] = useState(null); // { user }
  const [resetBalanceInput, setResetBalanceInput] = useState("");
  const [resetBalanceSubmitting, setResetBalanceSubmitting] = useState(false);
  const [passwordFormModal, setPasswordFormModal] = useState(null); // { user }
  const [passwordFormValue, setPasswordFormValue] = useState("");
  const [passwordFormConfirm, setPasswordFormConfirm] = useState("");
  const [passwordFormShow, setPasswordFormShow] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState("");
  const [passwordFormSubmitting, setPasswordFormSubmitting] = useState(false);
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

  // Balance Manager — email lookup + add/deduct amount, same quick-panel
  // pattern as the Block/Trust Score panels in User Control.
  const [balanceEmail, setBalanceEmail] = useState("");
  const [balanceDeltaInput, setBalanceDeltaInput] = useState("");
  const [balanceSubmitting, setBalanceSubmitting] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceSuccess, setBalanceSuccess] = useState("");

  // User Control quick panels — Block / Trust Score, all by email lookup
  const [blockEmail, setBlockEmail] = useState("");
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [blockMessage, setBlockMessage] = useState(null);
  const [trustEmail, setTrustEmail] = useState("");
  const [trustAmount, setTrustAmount] = useState("");
  const [trustSubmitting, setTrustSubmitting] = useState(false);
  const [trustMessage, setTrustMessage] = useState(null);

  // Manual Payment (Support & Methods) — content/config only, no gateway APIs
  const [supportSettings, setSupportSettings] = useState(null);
  const [supportOnlineInput, setSupportOnlineInput] = useState("online");
  const [supportSavingOnline, setSupportSavingOnline] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [supportSavingWhatsapp, setSupportSavingWhatsapp] = useState(false);
  const [methodToggling, setMethodToggling] = useState(null);
  const [withdrawMethodToggling, setWithdrawMethodToggling] = useState(null);
  const [announcementInput, setAnnouncementInput] = useState("");
  const [announcementEnabledInput, setAnnouncementEnabledInput] = useState(false);
  const [supportSavingAnnouncement, setSupportSavingAnnouncement] = useState(false);

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
    fetch("/api/admin/ensure-seed").catch(() => {});
  }, []);

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

  const loadSupportSettings = useCallback(() => {
    fetch("/api/admin/support-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setSupportSettings(data.settings);
        setSupportOnlineInput(data.settings.online ? "online" : "offline");
        setWhatsappInput(data.settings.whatsappNumber || "");
        setAnnouncementInput(data.settings.announcementText || "");
        setAnnouncementEnabledInput(Boolean(data.settings.announcementEnabled));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (checking || tab !== "support") return;
    loadSupportSettings();
  }, [checking, tab, loadSupportSettings]);

  const saveSupportOnline = async () => {
    setSupportSavingOnline(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ online: supportOnlineInput === "online" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update support status.");
        return;
      }
      setSupportSettings(data.settings);
    } finally {
      setSupportSavingOnline(false);
    }
  };

  const saveWhatsapp = async () => {
    setSupportSavingWhatsapp(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappNumber: whatsappInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update WhatsApp number.");
        return;
      }
      setSupportSettings(data.settings);
    } finally {
      setSupportSavingWhatsapp(false);
    }
  };

  const saveAnnouncement = async () => {
    setSupportSavingAnnouncement(true);
    setError("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementText: announcementInput, announcementEnabled: announcementEnabledInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update announcement.");
        return;
      }
      setSupportSettings(data.settings);
    } finally {
      setSupportSavingAnnouncement(false);
    }
  };

  const toggleMethod = async (method) => {
    setMethodToggling(method.key);
    setError("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ methodKey: method.key, methodEnabled: !method.enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update payment method.");
        return;
      }
      setSupportSettings(data.settings);
    } finally {
      setMethodToggling(null);
    }
  };

  const toggleWithdrawMethod = async (method) => {
    setWithdrawMethodToggling(method.key);
    setError("");
    try {
      const res = await fetch("/api/admin/support-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawMethodKey: method.key, withdrawMethodEnabled: !method.enabled }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update withdraw method.");
        return;
      }
      setSupportSettings(data.settings);
    } finally {
      setWithdrawMethodToggling(null);
    }
  };

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

  const submitBan = async () => {
    if (!banModal) return;
    setBanSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: banModal.user._id, isBanned: !banModal.user.isBanned }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update user.");
        return;
      }
      setBanModal(null);
      loadAll();
    } finally {
      setBanSubmitting(false);
    }
  };

  const submitResetBalance = async () => {
    if (!resetBalanceModal) return;
    const balance = Number(resetBalanceInput);
    if (!Number.isFinite(balance) || balance < 0) {
      setError("Enter a valid non-negative number.");
      return;
    }
    setResetBalanceSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetBalanceModal.user._id, balance }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update balance.");
        return;
      }
      setResetBalanceModal(null);
      loadAll();
    } finally {
      setResetBalanceSubmitting(false);
    }
  };

  const viewUserStats = async (userId) => {
    setError("");
    setUserStatsModal({ loading: true });
    const res = await fetch(`/api/admin/users/${userId}/stats`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to load user details.");
      setUserStatsModal(null);
      return;
    }
    setUserStatsModal(data);
  };

  const passwordRequirements = [
    { key: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
    { key: "num", label: "Include a number", test: (v) => /[0-9]/.test(v) },
    { key: "letter", label: "Include a letter", test: (v) => /[a-zA-Z]/.test(v) },
  ];

  const submitPasswordReset = async () => {
    if (!passwordFormModal) return;
    setPasswordFormError("");
    const unmet = passwordRequirements.find((r) => !r.test(passwordFormValue));
    if (unmet) {
      setPasswordFormError("Password doesn't meet the requirements below.");
      return;
    }
    if (passwordFormValue !== passwordFormConfirm) {
      setPasswordFormError("Passwords don't match.");
      return;
    }
    setPasswordFormSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: passwordFormModal.user._id, newPassword: passwordFormValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordFormError(data.error || "Failed to reset password.");
        return;
      }
      setPasswordFormModal(null);
      setPasswordFormValue("");
      setPasswordFormConfirm("");
      loadAll();
    } finally {
      setPasswordFormSubmitting(false);
    }
  };

  const submitBalanceAdjust = async () => {
    setBalanceError("");
    setBalanceSuccess("");
    const target = findUserByEmail(balanceEmail);
    if (!target) {
      setBalanceError("No user found with that email, UID, or phone.");
      return;
    }
    const delta = Number(balanceDeltaInput);
    if (!Number.isFinite(delta) || delta === 0) {
      setBalanceError("Enter a non-zero amount (use a negative number to deduct).");
      return;
    }
    const verb = delta > 0 ? "Credit" : "Debit";
    const confirmed = window.confirm(`${verb} Rs${Math.abs(delta).toLocaleString()} ${delta > 0 ? "to" : "from"} ${target.uid}'s balance?`);
    if (!confirmed) return;

    setBalanceSubmitting(true);
    try {
      const res = await fetch("/api/admin/balance-adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target._id, delta }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBalanceError(data.error || "Failed to adjust balance.");
        return;
      }
      setBalanceDeltaInput("");
      setBalanceSuccess(`Balance updated to Rs${Number(data.user.balance).toLocaleString()}.`);
      loadAll();
    } catch {
      setBalanceError("Something went wrong. Please try again.");
    } finally {
      setBalanceSubmitting(false);
    }
  };

  // Looks a user up by whichever identifier the admin typed — UID, email, or
  // phone — so one field covers all three instead of requiring an exact
  // email match.
  const findUserByEmail = (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return users.find((u) => u.uid?.toLowerCase() === q || u.email?.toLowerCase() === q || u.phone?.toLowerCase() === q) || null;
  };

  const submitBlock = async (action) => {
    setBlockMessage(null);
    const target = findUserByEmail(blockEmail);
    if (!target) {
      setBlockMessage({ tone: "error", text: "No user found with that email, UID, or phone." });
      return;
    }
    if (target.role === "admin") {
      setBlockMessage({ tone: "error", text: "Cannot block another admin." });
      return;
    }
    setBlockSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target._id, isBanned: action === "block" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBlockMessage({ tone: "error", text: data.error || "Failed to update account status." });
        return;
      }
      setBlockMessage({ tone: "success", text: `${target.uid} ${action === "block" ? "blocked" : "unblocked"}.` });
      loadAll();
    } catch {
      setBlockMessage({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setBlockSubmitting(false);
    }
  };

  const fetchTrustScore = () => {
    const target = findUserByEmail(trustEmail);
    if (!target) {
      setTrustMessage({ tone: "error", text: "No user found with that email, UID, or phone." });
      return;
    }
    setTrustMessage({ tone: "success", text: `${target.uid}'s current trust score is ${target.trustScore ?? 50}%.` });
  };

  const adjustTrustScore = async (direction) => {
    setTrustMessage(null);
    const target = findUserByEmail(trustEmail);
    if (!target) {
      setTrustMessage({ tone: "error", text: "No user found with that email, UID, or phone." });
      return;
    }
    const amount = Number(trustAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setTrustMessage({ tone: "error", text: "Enter a positive amount." });
      return;
    }
    setTrustSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target._id, trustScoreDelta: direction * amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTrustMessage({ tone: "error", text: data.error || "Failed to update trust score." });
        return;
      }
      setTrustMessage({ tone: "success", text: `${target.uid}'s trust score is now ${data.user.trustScore}%.` });
      loadAll();
    } catch {
      setTrustMessage({ tone: "error", text: "Something went wrong. Please try again." });
    } finally {
      setTrustSubmitting(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (checking) {
    return <div className="admin-root admin-loading-screen">Loading admin panel…</div>;
  }

  const balanceLookupUser = balanceEmail.trim() ? findUserByEmail(balanceEmail) : null;

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
                <StatCard label="Banned Users" value={overview.bannedUsers} />
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
          <div className="admin-page-head">
            <div>
              <h1>User Control</h1>
              <p>{users.length} registered users</p>
            </div>
            <div className="admin-page-search">
              <IconSearch />
              <input placeholder="Search by name, email or UID…" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
            </div>
          </div>

          <div className="admin-quick-grid">
            <div className="admin-quick-card">
              <div className="admin-quick-card-head">
                <h3><IconShield style={{ width: 15, height: 15 }} /> Block Control</h3>
                <p>Block or unblock user account</p>
              </div>
              <div className="admin-quick-divider" />
              <div className="admin-quick-field">
                <label>Email / UID / Phone</label>
                <input type="text" placeholder="Email, UID, or phone" value={blockEmail} onChange={(e) => setBlockEmail(e.target.value)} disabled={blockSubmitting} />
              </div>
              <div className="admin-quick-actions">
                <button className="admin-btn danger" onClick={() => submitBlock("block")} disabled={blockSubmitting || !blockEmail.trim()}>
                  Block
                </button>
                <button className="admin-btn success" onClick={() => submitBlock("unblock")} disabled={blockSubmitting || !blockEmail.trim()}>
                  Unblock
                </button>
              </div>
              {blockMessage && <div className={`admin-quick-message ${blockMessage.tone}`}>{blockMessage.text}</div>}
            </div>

            <div className="admin-quick-card">
              <div className="admin-quick-card-head">
                <h3><IconTrendingUp style={{ width: 15, height: 15 }} /> Trust Score</h3>
                <p>Fetch, increase or decrease user trust score</p>
              </div>
              <div className="admin-quick-divider" />
              <div className="admin-quick-row">
                <div className="admin-quick-field">
                  <label>Email / UID / Phone</label>
                  <input type="text" placeholder="Email, UID, or phone" value={trustEmail} onChange={(e) => setTrustEmail(e.target.value)} disabled={trustSubmitting} />
                </div>
                <div className="admin-quick-field">
                  <label>Amount</label>
                  <input type="number" min="1" placeholder="Amount" value={trustAmount} onChange={(e) => setTrustAmount(e.target.value)} disabled={trustSubmitting} />
                </div>
              </div>
              <div className="admin-quick-actions">
                <button className="admin-btn dark" onClick={fetchTrustScore} disabled={!trustEmail.trim()}>
                  Fetch
                </button>
                <button className="admin-btn success" onClick={() => adjustTrustScore(1)} disabled={trustSubmitting || !trustEmail.trim() || !trustAmount}>
                  Increase
                </button>
                <button className="admin-btn warning" onClick={() => adjustTrustScore(-1)} disabled={trustSubmitting || !trustEmail.trim() || !trustAmount}>
                  Decrease
                </button>
              </div>
              {trustMessage && <div className={`admin-quick-message ${trustMessage.tone}`}>{trustMessage.text}</div>}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
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
                {users
                  .filter((u) => {
                    const q = userSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      u.uid?.toLowerCase().includes(q) ||
                      u.name?.toLowerCase().includes(q) ||
                      u.email?.toLowerCase().includes(q) ||
                      u.phone?.toLowerCase().includes(q)
                    );
                  })
                  .map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="admin-name-cell">
                          <Avatar name={u.name} uid={u.uid} />
                          <div>
                            <b>{u.name || "—"}</b>
                            <div style={{ fontSize: 10.5, color: "var(--a-muted)" }}>{u.uid}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>{u.email || "—"}</td>
                      <td style={{ color: "var(--a-success)", fontWeight: 800 }}>Rs {Number(u.balance).toLocaleString()}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className={`admin-status-pill tone-${u.isBanned ? "danger" : "success"}`}>{u.isBanned ? "Banned" : "Active"}</span>
                      </td>
                      <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                      <td>
                        {u.role !== "admin" && (
                          <button className="admin-small-btn" onClick={() => viewUserStats(u._id)}>
                            Details
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty">
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
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
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
                    <td>{w.user?.name || "—"}</td>
                    <td>{w.user?.email || "—"}</td>
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
                    <td colSpan={8} className="empty">
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
          <PageHead title="Balance Manager" sub="Fetch balance and add/deduct amount" />

          <div className="admin-balance-grid">
            <div className="admin-quick-card">
              <div className="admin-quick-card-head">
                <h3><IconWallet style={{ width: 15, height: 15 }} /> Balance Manager</h3>
                <p>Fetch balance and add/deduct amount</p>
              </div>
              <div className="admin-quick-divider" />
              <div className="admin-quick-field">
                <label>User Email / UID / Phone</label>
                <input
                  type="text"
                  placeholder="user@example.com, UID, or phone"
                  value={balanceEmail}
                  onChange={(e) => {
                    setBalanceEmail(e.target.value);
                    setBalanceError("");
                    setBalanceSuccess("");
                  }}
                  disabled={balanceSubmitting}
                />
              </div>
              <div className="admin-quick-field">
                <label>Amount</label>
                <input
                  type="number"
                  placeholder="Use + amount to add, - amount to deduct"
                  value={balanceDeltaInput}
                  onChange={(e) => setBalanceDeltaInput(e.target.value)}
                  disabled={balanceSubmitting}
                />
                <span className="admin-quick-hint-text">Example: 100 to add balance, -100 to deduct.</span>
              </div>

              {balanceError && <div className="admin-quick-message error">{balanceError}</div>}
              {balanceSuccess && <div className="admin-quick-message success">{balanceSuccess}</div>}

              <button
                className="admin-btn primary"
                style={{ width: "100%", marginTop: 6 }}
                onClick={submitBalanceAdjust}
                disabled={balanceSubmitting || !balanceEmail.trim() || !balanceDeltaInput}
              >
                {balanceSubmitting ? "Updating…" : "$ Update Balance"}
              </button>
            </div>

            <div className="admin-balance-info-col">
              <div className="admin-quick-hint-box">
                {balanceLookupUser ? (
                  <>
                    Current balance for <b>{balanceLookupUser.uid}</b>: <b>Rs {Number(balanceLookupUser.balance).toLocaleString()}</b>
                  </>
                ) : balanceEmail.trim() ? (
                  "No user found with that email, UID, or phone."
                ) : (
                  "Enter a user's email, UID, or phone to check their current balance."
                )}
              </div>

              <div className="admin-quick-card">
                <div className="admin-quick-card-head">
                  <h3>Trust Score Logic</h3>
                  <p>
                    This only adjusts wallet balance. Trust score is auto-set on every approved deposit based on the
                    user's lifetime total (40% up to Rs3,000, 70% up to Rs10,000, 90% up to Rs17,000, 100% above that),
                    but can still be fetched and manually increased or decreased from the Trust Score panel in User
                    Control.
                  </p>
                </div>
              </div>

              <div className="admin-quick-card">
                <div className="admin-quick-card-head">
                  <h3>Notification</h3>
                  <p>The user gets a real in-app notification with the amount immediately after a successful update.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-info-section-label" style={{ marginTop: 24, marginBottom: 10 }}>
            Deposit Requests
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Number</th>
                  <th>Payment Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d._id}>
                    <td>{d.user?.uid || "—"}</td>
                    <td>{d.user?.name || "—"}</td>
                    <td>{d.user?.email || "—"}</td>
                    <td>{d.accountNumber || d.user?.phone || "—"}</td>
                    <td>{d.method}</td>
                    <td>Rs {Number(d.amount).toLocaleString()}</td>
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
                    <td colSpan={8} className="empty">
                      No deposit requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

      {tab === "support" && (
        <div>
          <PageHead
            title="Manual Payment"
            sub="Support status, contact number, and which deposit methods are advertised as available. Content only — no payment gateway is connected."
          />

          {!supportSettings ? (
            <div className="admin-table-wrap" style={{ padding: 40, textAlign: "center", color: "var(--a-muted)" }}>
              Loading…
            </div>
          ) : (
            <>
              <div className="admin-settings-card">
                <div className="admin-settings-card-info">
                  <h3>Support Status</h3>
                  <p>Shown to users as your support team's online/offline status.</p>
                </div>
                <div className="admin-settings-card-control">
                  <select value={supportOnlineInput} onChange={(e) => setSupportOnlineInput(e.target.value)} disabled={supportSavingOnline}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                  <button className="admin-btn primary" onClick={saveSupportOnline} disabled={supportSavingOnline}>
                    {supportSavingOnline ? "Saving…" : "Save Support"}
                  </button>
                </div>
              </div>

              <div className="admin-settings-card">
                <div className="admin-settings-card-info">
                  <h3>WhatsApp Support Number</h3>
                  <p>Shown to users as the contact number for support.</p>
                </div>
                <div className="admin-settings-card-control">
                  <input placeholder="923001234567" value={whatsappInput} onChange={(e) => setWhatsappInput(e.target.value)} disabled={supportSavingWhatsapp} />
                  <button
                    className="admin-btn"
                    style={{ background: "var(--a-success)", color: "#06190f" }}
                    onClick={saveWhatsapp}
                    disabled={supportSavingWhatsapp}
                  >
                    {supportSavingWhatsapp ? "Saving…" : "Save WhatsApp"}
                  </button>
                </div>
              </div>

              <div className="admin-settings-card">
                <div className="admin-settings-card-info">
                  <h3>Announcement</h3>
                  <p>Shown to users on the Support page and the Announcement quick-action when enabled.</p>
                </div>
                <div className="admin-settings-card-control" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
                  <textarea
                    placeholder="e.g. Scheduled maintenance on Friday 10pm–11pm."
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    disabled={supportSavingAnnouncement}
                    rows={3}
                    maxLength={500}
                    style={{ width: "100%", resize: "vertical", font: "inherit" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
                    <select
                      value={announcementEnabledInput ? "on" : "off"}
                      onChange={(e) => setAnnouncementEnabledInput(e.target.value === "on")}
                      disabled={supportSavingAnnouncement}
                    >
                      <option value="off">Off</option>
                      <option value="on">On</option>
                    </select>
                    <button
                      className="admin-btn"
                      style={{ background: "var(--a-success)", color: "#06190f" }}
                      onClick={saveAnnouncement}
                      disabled={supportSavingAnnouncement}
                    >
                      {supportSavingAnnouncement ? "Saving…" : "Save Announcement"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-info-section-label" style={{ marginBottom: 10 }}>
                Advertised Deposit Methods
              </div>
              <div className="admin-methods-grid">
                {supportSettings.methods.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className="admin-method-toggle"
                    onClick={() => toggleMethod(m)}
                    disabled={methodToggling === m.key}
                  >
                    <b>{m.label}</b>
                    <span className={`admin-method-pill ${m.enabled ? "on" : "off"}`}>{methodToggling === m.key ? "…" : m.enabled ? "ON" : "OFF"}</span>
                  </button>
                ))}
              </div>
              <p className="admin-modal-note" style={{ marginTop: 14 }}>
                This only controls which method names are shown as available on the deposit page — no payment gateway, API key, or real transaction
                capability is connected to any of these.
              </p>

              <div className="admin-info-section-label" style={{ marginTop: 24, marginBottom: 10 }}>
                Advertised Withdraw Methods
              </div>
              <div className="admin-methods-grid">
                {supportSettings.withdrawMethods.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    className="admin-method-toggle"
                    onClick={() => toggleWithdrawMethod(m)}
                    disabled={withdrawMethodToggling === m.key}
                  >
                    <b>{m.label}</b>
                    <span className={`admin-method-pill ${m.enabled ? "on" : "off"}`}>{withdrawMethodToggling === m.key ? "…" : m.enabled ? "ON" : "OFF"}</span>
                  </button>
                ))}
              </div>
              <p className="admin-modal-note" style={{ marginTop: 14 }}>
                Independent from the deposit methods above — this controls which method names are shown as available on the withdraw page. No payment
                gateway, API key, or real payout capability is connected to any of these.
              </p>
            </>
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

      {userStatsModal && (
        <div className="admin-modal-backdrop" onClick={() => setUserStatsModal(null)}>
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()}>
            {userStatsModal.loading ? (
              <div className="admin-modal-v2-body">
                <p className="admin-modal-note">Loading…</p>
              </div>
            ) : (
              <>
                <div className="admin-modal-v2-head">
                  <div className="admin-modal-v2-icon tone-info">
                    <IconUsers />
                  </div>
                  <div>
                    <h3>User Details</h3>
                    <p>Complete information about this user</p>
                  </div>
                  <button className="admin-modal-v2-close" onClick={() => setUserStatsModal(null)}>
                    <IconX />
                  </button>
                </div>
                <div className="admin-modal-v2-body">
                  <div className="admin-modal-user-row">
                    <Avatar name={userStatsModal.user.name} uid={userStatsModal.user.uid} size="lg" />
                    <div>
                      <b>
                        {userStatsModal.user.name || userStatsModal.user.uid}{" "}
                        <span className="admin-status-pill tone-success" style={{ marginLeft: 6 }}>
                          Active
                        </span>
                      </b>
                      <span>User ID: {userStatsModal.user.uid}</span>
                    </div>
                  </div>

                  <div className="admin-info-section">
                    <div className="admin-info-section-label">Contact</div>
                    <div className="admin-info-row">
                      <span className="label">Email</span>
                      <span className="value">{userStatsModal.user.email || "—"}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Phone</span>
                      <span className="value">{userStatsModal.user.phone || "—"}</span>
                    </div>
                  </div>

                  <div className="admin-info-section">
                    <div className="admin-info-section-label">Account activity</div>
                    <div className="admin-info-highlight">
                      <span className="label">Current balance</span>
                      <span className="value" style={{ color: "var(--a-accent)" }}>
                        Rs {Number(userStatsModal.user.balance).toLocaleString()}
                      </span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Total deposited</span>
                      <span className="value">Rs {Number(userStatsModal.totalDeposited).toLocaleString()}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Total withdrawn</span>
                      <span className="value">Rs {Number(userStatsModal.totalWithdrawn).toLocaleString()}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Total wagered</span>
                      <span className="value">Rs {Number(userStatsModal.totalWagered).toLocaleString()}</span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Total won</span>
                      <span className="value" style={{ color: "var(--a-success)" }}>
                        Rs {Number(userStatsModal.totalWon).toLocaleString()} ({userStatsModal.betsWon})
                      </span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Total lost</span>
                      <span className="value" style={{ color: "var(--a-danger)" }}>
                        Rs {Number(userStatsModal.totalLost).toLocaleString()} ({userStatsModal.betsLost})
                      </span>
                    </div>
                  </div>

                  <div className="admin-info-section">
                    <div className="admin-info-section-label">Trust & Verification</div>
                    <div className="admin-info-row">
                      <span className="label">KYC status</span>
                      <span className={`admin-status-pill tone-${userStatsModal.user.kycApproved ? "success" : "warning"}`}>
                        {userStatsModal.user.kycApproved ? "Verified" : "Not verified"}
                      </span>
                    </div>
                    <div className="admin-info-row">
                      <span className="label">Trust score</span>
                      <span className="value">
                        {userStatsModal.user.trustScore ?? 50}%{" "}
                        <span className={`admin-status-pill tone-${trustTier(userStatsModal.user.trustScore).tone}`} style={{ marginLeft: 4 }}>
                          {trustTier(userStatsModal.user.trustScore).label}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="admin-modal-v2-actions">
                  <button
                    className="admin-btn danger"
                    onClick={() => {
                      const u = users.find((x) => x.uid === userStatsModal.user.uid);
                      setUserStatsModal(null);
                      if (u) setBanModal({ user: u });
                    }}
                  >
                    Ban User
                  </button>
                  <button
                    className="admin-btn primary"
                    onClick={() => {
                      const u = users.find((x) => x.uid === userStatsModal.user.uid);
                      setUserStatsModal(null);
                      if (u) {
                        setResetBalanceInput(String(u.balance));
                        setResetBalanceModal({ user: u });
                      }
                    }}
                  >
                    Reset Balance
                  </button>
                  <button
                    className="admin-btn ghost"
                    onClick={() => {
                      const u = users.find((x) => x.uid === userStatsModal.user.uid);
                      setUserStatsModal(null);
                      if (u) {
                        setPasswordFormValue("");
                        setPasswordFormConfirm("");
                        setPasswordFormError("");
                        setPasswordFormModal({ user: u });
                      }
                    }}
                  >
                    Reset Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {banModal && (
        <div className="admin-modal-backdrop" onClick={() => !banSubmitting && setBanModal(null)}>
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-v2-head">
              <div className="admin-modal-v2-icon tone-danger">
                <IconShield />
              </div>
              <div>
                <h3>{banModal.user.isBanned ? "Unban User?" : "Ban User?"}</h3>
                <p>{banModal.user.isBanned ? "Restore this user's access." : "You are about to suspend this user."}</p>
              </div>
              <button className="admin-modal-v2-close" onClick={() => setBanModal(null)}>
                <IconX />
              </button>
            </div>
            <div className="admin-modal-v2-body">
              <div className="admin-info-row">
                <span className="label">Name</span>
                <span className="value">{banModal.user.name || "—"}</span>
              </div>
              <div className="admin-info-row">
                <span className="label">Email</span>
                <span className="value">{banModal.user.email || "—"}</span>
              </div>
              <div className="admin-info-row">
                <span className="label">Role</span>
                <span className="value">{banModal.user.role}</span>
              </div>
              {!banModal.user.isBanned && (
                <div className="admin-warn-box tone-danger" style={{ marginTop: 14 }}>
                  The user will no longer be able to access the application until they are unbanned.
                </div>
              )}
            </div>
            <div className="admin-modal-v2-actions">
              <button className="admin-btn ghost" onClick={() => setBanModal(null)} disabled={banSubmitting}>
                Cancel
              </button>
              <button className="admin-btn danger" onClick={submitBan} disabled={banSubmitting}>
                {banSubmitting ? "Working…" : banModal.user.isBanned ? "Unban User" : "Ban User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {resetBalanceModal && (
        <div className="admin-modal-backdrop" onClick={() => !resetBalanceSubmitting && setResetBalanceModal(null)}>
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-v2-head">
              <div className="admin-modal-v2-icon tone-violet">
                <IconWallet />
              </div>
              <div>
                <h3>Reset User Balance?</h3>
                <p>Set this user&apos;s balance to a new value.</p>
              </div>
              <button className="admin-modal-v2-close" onClick={() => setResetBalanceModal(null)}>
                <IconX />
              </button>
            </div>
            <div className="admin-modal-v2-body">
              <div className="admin-info-row">
                <span className="label">Name</span>
                <span className="value">{resetBalanceModal.user.name || resetBalanceModal.user.uid}</span>
              </div>
              <div className="admin-info-row">
                <span className="label">Current balance</span>
                <span className="value">Rs {Number(resetBalanceModal.user.balance).toLocaleString()}</span>
              </div>
              <div className="admin-password-field">
                <label>New balance (Rs)</label>
                <input
                  type="number"
                  min="0"
                  value={resetBalanceInput}
                  onChange={(e) => setResetBalanceInput(e.target.value)}
                  disabled={resetBalanceSubmitting}
                  style={{ paddingRight: 12 }}
                />
              </div>
              <div className="admin-warn-box tone-warning">This action cannot be undone. The user&apos;s current balance will be permanently reset.</div>
            </div>
            <div className="admin-modal-v2-actions">
              <button className="admin-btn ghost" onClick={() => setResetBalanceModal(null)} disabled={resetBalanceSubmitting}>
                Cancel
              </button>
              <button className="admin-btn primary" onClick={submitResetBalance} disabled={resetBalanceSubmitting}>
                {resetBalanceSubmitting ? "Working…" : "Reset Balance"}
              </button>
            </div>
          </div>
        </div>
      )}

      {passwordFormModal && (
        <div className="admin-modal-backdrop" onClick={() => !passwordFormSubmitting && setPasswordFormModal(null)}>
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-v2-head">
              <div className="admin-modal-v2-icon tone-violet">
                <IconLockLine />
              </div>
              <div>
                <h3>Reset Password</h3>
                <p>Set a new password for this user.</p>
              </div>
              <button className="admin-modal-v2-close" onClick={() => setPasswordFormModal(null)}>
                <IconX />
              </button>
            </div>
            <div className="admin-modal-v2-body">
              <div className="admin-info-row">
                <span className="label">User</span>
                <span className="value">{passwordFormModal.user.name || passwordFormModal.user.uid}</span>
              </div>
              <div className="admin-info-row">
                <span className="label">Email</span>
                <span className="value">{passwordFormModal.user.email || passwordFormModal.user.phone || "—"}</span>
              </div>

              <div className="admin-password-field" style={{ marginTop: 16 }}>
                <label>New Password</label>
                <input
                  type={passwordFormShow ? "text" : "password"}
                  placeholder="Enter new password"
                  value={passwordFormValue}
                  onChange={(e) => setPasswordFormValue(e.target.value)}
                  disabled={passwordFormSubmitting}
                />
                <button type="button" className="admin-password-toggle" onClick={() => setPasswordFormShow((v) => !v)} aria-label="Toggle visibility">
                  {passwordFormShow ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <div className="admin-password-field">
                <label>Confirm New Password</label>
                <input
                  type={passwordFormShow ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={passwordFormConfirm}
                  onChange={(e) => setPasswordFormConfirm(e.target.value)}
                  disabled={passwordFormSubmitting}
                />
              </div>

              <div className="admin-info-section-label" style={{ marginTop: 4 }}>
                Password Requirements
              </div>
              <div className="admin-requirements">
                {passwordRequirements.map((r) => {
                  const met = r.test(passwordFormValue);
                  return (
                    <div key={r.key} className={`admin-requirement ${met ? "met" : ""}`}>
                      {met ? <IconCheck /> : <IconX />}
                      {r.label}
                    </div>
                  );
                })}
              </div>

              {passwordFormError && (
                <div className="admin-warn-box tone-danger" style={{ marginTop: 10 }}>
                  {passwordFormError}
                </div>
              )}
            </div>
            <div className="admin-modal-v2-actions">
              <button className="admin-btn ghost" onClick={() => setPasswordFormModal(null)} disabled={passwordFormSubmitting}>
                Cancel
              </button>
              <button className="admin-btn primary" onClick={submitPasswordReset} disabled={passwordFormSubmitting}>
                {passwordFormSubmitting ? "Resetting…" : "Reset Password"}
              </button>
            </div>
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
