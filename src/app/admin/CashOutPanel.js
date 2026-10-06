"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconX, IconWithdraw, IconRefresh } from "../icons";
import {
  WALLET_PROVIDERS,
  BANK_PROVIDERS,
  PROVIDER_STATUS_LABELS,
  validatePayoutInput,
  makePayoutOrderId,
  maskTail,
} from "../../lib/payoutRules";

const EMPTY_FORM = {
  withdrawalId: "",
  merchantUserId: "",
  accountType: "WALLET",
  accountProvider: "EASYPAISA",
  accountNum: "",
  amount: "",
};

const STATUS_FILTERS = ["ALL", "PENDING", "COMPLETED", "FAILED"];
const STATUS_TONE = { COMPLETED: "success", FAILED: "danger", PENDING: "warning" };

function formatPkr(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return `PKR ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "03001234567" / "+923001234567" → "3001234567" (Karopay wants 10 digits starting with 3).
function toTenDigit(num) {
  const digits = String(num || "").replace(/\D/g, "");
  if (/^923\d{9}$/.test(digits)) return digits.slice(2);
  if (/^03\d{9}$/.test(digits)) return digits.slice(1);
  return digits;
}

function providerFromMethod(method) {
  const m = String(method || "").toLowerCase();
  if (m.includes("easy")) return "EASYPAISA";
  if (m.includes("jazz")) return "JAZZCASH";
  return null;
}

function prettyProvider(p) {
  return String(p || "").replace(/_/g, " ");
}

function HiddenValue({ value }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="co-node-value muted">Unavailable</span>;
  return (
    <button type="button" className="co-node-value" onClick={() => setShown((s) => !s)} title="Click to reveal/hide">
      {shown ? value : "********"}
    </button>
  );
}

export default function CashOutPanel({ withdrawals, preselectWithdrawalId, onPreselectConsumed, onWithdrawalsChanged, superadminMode = false }) {
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [confirm, setConfirm] = useState(null); // { orderId, value }
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, text }
  const [syncingId, setSyncingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const submitLock = useRef(false);

  const pendingWithdrawals = useMemo(() => (withdrawals || []).filter((w) => w.status === "pending"), [withdrawals]);
  const linkedWithdrawal = pendingWithdrawals.find((w) => w._id === form.withdrawalId) || null;

  const loadOverview = useCallback(() => {
    setOverviewLoading(true);
    return fetch("/api/admin/karopay/overview", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setOverview(data))
      .catch(() => setOverview({ balanceError: "Could not load gateway info." }))
      .finally(() => setOverviewLoading(false));
  }, []);

  const loadPayouts = useCallback(() => {
    setPayoutsLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (superadminMode) params.set("scope", "superadmin");
    const qs = params.size ? `?${params.toString()}` : "";
    return fetch(`/api/admin/karopay/payout${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setPayouts(data.payouts || []))
      .catch(() => {})
      .finally(() => setPayoutsLoading(false));
  }, [statusFilter, superadminMode]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  const fillFromWithdrawal = useCallback((w) => {
    if (!w) {
      setForm((f) => ({ ...EMPTY_FORM, accountType: f.accountType, accountProvider: f.accountProvider }));
      return;
    }
    const provider = providerFromMethod(w.method);
    const account = toTenDigit(w.accountNumber);
    setForm({
      ...EMPTY_FORM,
      withdrawalId: w._id,
      merchantUserId: w.user?._id || "",
      accountType: "WALLET",
      accountProvider: provider || "EASYPAISA",
      accountNum: account,
      amount: String(w.amount),
    });
    setFieldErrors({});
  }, []);

  // "Cash Out" clicked on a row in the Withdraws tab.
  useEffect(() => {
    if (!preselectWithdrawalId) return;
    const w = pendingWithdrawals.find((x) => x._id === preselectWithdrawalId);
    if (w) fillFromWithdrawal(w);
    onPreselectConsumed?.();
  }, [preselectWithdrawalId, pendingWithdrawals, fillFromWithdrawal, onPreselectConsumed]);

  const setField = (key) => (e) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: v };
      if (key === "accountType") next.accountProvider = v === "WALLET" ? WALLET_PROVIDERS[0] : "";
      return next;
    });
    setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const openConfirm = (e) => {
    e.preventDefault();
    setNotice(null);
    const normalized = form.accountType === "WALLET" ? { ...form, accountNum: toTenDigit(form.accountNum) } : form;
    const { value, errors } = validatePayoutInput(normalized, { accountOnly: true });
    if (errors) {
      setFieldErrors(errors);
      return;
    }
    if (linkedWithdrawal && Math.round(Number(linkedWithdrawal.amount) * 100) !== value.amountCents) {
      setFieldErrors({ amount: "Must match the withdrawal amount." });
      return;
    }
    setConfirm({ orderId: makePayoutOrderId(), value });
  };

  const sendPayout = async () => {
    if (!confirm || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    try {
      const payoutUrl = `/api/admin/karopay/payout${superadminMode ? "?scope=superadmin" : ""}`;
      const res = await fetch(payoutUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, merchantOrderId: confirm.orderId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.fields) setFieldErrors(data.fields);
        const k = data.karopay;
        const extra = k ? ` (code ${k.code ?? "—"}${k.traceId ? `, trace ${k.traceId}` : ""})` : "";
        setNotice({ tone: "error", text: `${data.error || "Cash out failed."}${extra}` });
      } else {
        setNotice({
          tone: "success",
          text: `Cash out ${data.payout.merchantOrderId} accepted by Karopay — status PENDING until Karopay confirms.`,
        });
        setForm(EMPTY_FORM);
      }
      setConfirm(null);
      loadPayouts();
      loadOverview();
      onWithdrawalsChanged?.();
    } catch {
      setNotice({ tone: "error", text: "Network error — check the history below before retrying." });
      setConfirm(null);
      loadPayouts();
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const syncPayout = async (id) => {
    setSyncingId(id);
    try {
      const scopeQuery = superadminMode ? "?scope=superadmin" : "";
      const res = await fetch(`/api/admin/karopay/payout/${id}/sync${scopeQuery}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setNotice({ tone: "error", text: data.error || "Status check failed." });
      await loadPayouts();
      onWithdrawalsChanged?.();
    } finally {
      setSyncingId("");
    }
  };

  const deletePayoutHistory = async (payout) => {
    if (!superadminMode || (payout.status !== "FAILED" && payout.status !== "COMPLETED")) return;
    if (!window.confirm(`Permanently delete ${payout.status.toLowerCase()} payout ${payout.merchantOrderId}? This removes history only and does not change balances.`)) return;

    setDeletingId(payout.id);
    try {
      const scopeQuery = superadminMode ? "?scope=superadmin" : "";
      const response = await fetch(`/api/admin/karopay/payout/${payout.id}${scopeQuery}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ tone: "error", text: data.error || "Failed to delete payout history." });
        return;
      }
      setNotice({ tone: "success", text: "Payout history deleted. No additional balance change was made." });
      await loadPayouts();
    } catch {
      setNotice({ tone: "error", text: "Could not delete the failed payout record." });
    } finally {
      setDeletingId("");
    }
  };

  const refreshAll = () => {
    loadOverview();
    loadPayouts();
    onWithdrawalsChanged?.();
  };

  const providers = form.accountType === "BANK" ? BANK_PROVIDERS : WALLET_PROVIDERS;
  const err = (k) => fieldErrors[k] && <span className="co-field-error">{fieldErrors[k]}</span>;

  return (
    <div className="co-root">
      <section className="co-hero">
        <div className="co-hero-top">
          <div>
            <span className="co-chip">Live Gateway</span>
            <h1 className="co-title">CashOut Engine</h1>
            <p className="co-sub">Manual API payout system with live wallet balance, server node info and response logs.</p>
          </div>
          <button type="button" className="co-refresh" onClick={refreshAll} disabled={overviewLoading || payoutsLoading}>
            <IconRefresh className={overviewLoading || payoutsLoading ? "spinning" : ""} />
            Refresh
          </button>
        </div>

        <div className="co-balances">
          <div className="co-balance-card">
            <span>Available Balance</span>
            <b className="green">{overview?.balance ? formatPkr(overview.balance.available) : overviewLoading ? "Loading…" : "—"}</b>
          </div>
          <div className="co-balance-card">
            <span>Frozen Balance</span>
            <b className="amber">{overview?.balance ? formatPkr(overview.balance.frozen) : overviewLoading ? "Loading…" : "—"}</b>
          </div>
        </div>
        {overview?.balanceError && <div className="co-inline-error">Balance: {overview.balanceError}</div>}

        <div className="co-grid">
          <div className="co-panel">
            <h2>Server Node</h2>
            <p>Click hidden IP values to reveal/hide.</p>
            <div className="co-node-row">
              <span>Internal Base IP</span>
              <HiddenValue value={overview?.server?.internalIp} />
            </div>
            <div className="co-node-row">
              <span>Public IPv4</span>
              <HiddenValue value={overview?.server?.publicIpv4} />
            </div>
            <div className="co-node-row">
              <span>Public IPv6</span>
              <HiddenValue value={overview?.server?.publicIpv6} />
            </div>
            <div className="co-node-row stacked">
              <span>Notify URL</span>
              <code>{overview?.notifyUrl || (overviewLoading || !overview ? "Loading…" : "Not configured")}</code>
            </div>
            <div className="co-node-note">Karopay only accepts requests from whitelisted IPs — add the public IPv4 in the merchant console.</div>
          </div>

          <form className="co-panel" onSubmit={openConfirm} noValidate>
            <h2>Dispatch Withdrawal</h2>
            <p>Send payout request to gateway</p>

            <label className="co-label">Withdrawal Request</label>
            <select
              className="co-input"
              value={form.withdrawalId}
              onChange={(e) => fillFromWithdrawal(pendingWithdrawals.find((w) => w._id === e.target.value) || null)}
            >
              <option value="">Manual payout (no withdrawal request)</option>
              {pendingWithdrawals.map((w) => (
                <option key={w._id} value={w._id}>
                  {(w.user?.name || w.user?.uid || "User")} · Rs {Number(w.amount).toLocaleString()} · {w.method} {w.accountNumber}
                </option>
              ))}
            </select>


            <div className="co-two">
              <div>
                <label className="co-label">Account Type</label>
                <select className="co-input" value={form.accountType} onChange={setField("accountType")}>
                  <option value="WALLET">WALLET</option>
                  <option value="BANK">BANK</option>
                </select>
              </div>
              <div>
                <label className="co-label">Account Provider</label>
                <select className="co-input" value={form.accountProvider} onChange={setField("accountProvider")}>
                  {form.accountType === "BANK" && <option value="">Select bank…</option>}
                  {providers.map((p) => (
                    <option key={p} value={p}>
                      {prettyProvider(p)}
                    </option>
                  ))}
                </select>
                {err("accountProvider")}
              </div>
            </div>

            <label className="co-label">Account / Wallet Number</label>
            <input
              className="co-input"
              value={form.accountNum}
              onChange={setField("accountNum")}
              placeholder={form.accountType === "WALLET" ? "3001234567" : "Bank account number"}
              inputMode="numeric"
            />
            {err("accountNum")}

            <label className="co-label">Amount (PKR)</label>
            <input
              className="co-input"
              value={form.amount}
              onChange={setField("amount")}
              placeholder="e.g. 500"
              inputMode="decimal"
              readOnly={!!linkedWithdrawal}
            />
            {err("amount")}

            {notice && <div className={`co-notice ${notice.tone}`}>{notice.text}</div>}

            <button type="submit" className="co-submit" disabled={submitting}>
              {submitting ? "Sending…" : "Cash Out"}
            </button>
          </form>
        </div>
      </section>

      <section className="co-history">
        <div className="co-history-head">
          <h2>Cash Out History</h2>
          <div className="co-filters">
            {STATUS_FILTERS.map((s) => (
              <button key={s} type="button" className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Provider</th>
                <th>Account</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.createdAt).toLocaleString()}</td>
                  <td className="co-mono">{p.merchantOrderId}</td>
                  <td>{p.user ? p.user.name || p.user.uid : p.merchantUserId}</td>
                  <td>Rs {Number(p.amount).toLocaleString()}</td>
                  <td>{p.accountType}</td>
                  <td>{prettyProvider(p.accountProvider)}</td>
                  <td className="co-mono">{p.accountNumMasked}</td>
                  <td>
                    <span className={`admin-status-pill tone-${STATUS_TONE[p.status] || "neutral"}`}>{p.status}</span>
                    {p.providerStatus && (
                      <div className="co-substatus" title={p.providerMsg || ""}>
                        {p.providerStatus} · {PROVIDER_STATUS_LABELS[p.providerStatus] || "unknown"}
                      </div>
                    )}
                    {p.status === "FAILED" && p.providerMsg && <div className="co-substatus danger">{p.providerMsg}</div>}
                  </td>
                  <td>
                    {p.status === "PENDING" && (
                      <button type="button" className="admin-small-btn" onClick={() => syncPayout(p.id)} disabled={syncingId === p.id}>
                        {syncingId === p.id ? "Checking…" : "Check status"}
                      </button>
                    )}
                    {superadminMode && (p.status === "FAILED" || p.status === "COMPLETED") && (
                      <button
                        type="button"
                        className="admin-small-btn reject"
                        onClick={() => deletePayoutHistory(p)}
                        disabled={deletingId === p.id}
                      >
                        {deletingId === p.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {payouts.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty">
                    {payoutsLoading ? "Loading…" : "No cash outs yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {confirm && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setConfirm(null)}>
          <div className="admin-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-v2-head">
              <div className="admin-modal-v2-icon tone-warning">
                <IconWithdraw />
              </div>
              <div>
                <h3>Confirm Cash Out</h3>
                <p>This sends a real payout request to Karopay.</p>
              </div>
              <button type="button" className="admin-modal-v2-close" onClick={() => setConfirm(null)} disabled={submitting} aria-label="Close">
                <IconX />
              </button>
            </div>
            <div className="admin-modal-v2-body">
              <dl className="co-confirm-list">
                <dt>Amount</dt>
                <dd className="co-confirm-amount">{formatPkr(confirm.value.amountCents / 100)}</dd>
                <dt>Account Type</dt>
                <dd>{confirm.value.accountType}</dd>
                <dt>Provider</dt>
                <dd>{prettyProvider(confirm.value.accountProvider)}</dd>
                <dt>Account</dt>
                <dd>{maskTail(confirm.value.accountNum)}</dd>
                <dt>Paid To</dt>
                <dd>{linkedWithdrawal ? linkedWithdrawal.user?.name || linkedWithdrawal.user?.uid || "User" : "Manual payout"}</dd>
                <dt>Order ID</dt>
                <dd className="co-mono">{confirm.orderId}</dd>
                {linkedWithdrawal && (
                  <>
                    <dt>Withdrawal</dt>
                    <dd>Settles {linkedWithdrawal.user?.uid || "user"}&apos;s request</dd>
                  </>
                )}
              </dl>
            </div>
            <div className="admin-modal-v2-actions">
              <button type="button" className="admin-btn ghost" onClick={() => setConfirm(null)} disabled={submitting}>
                Cancel
              </button>
              <button type="button" className="admin-btn primary" onClick={sendPayout} disabled={submitting}>
                {submitting ? "Sending…" : "Confirm Cash Out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
