"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "../../../icons";
import "../../admin.css";

export default function AdminScResetPage() {
  const router = useRouter();
  const [setupKey, setSetupKey] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  // Dev-only convenience — the endpoint only ever returns a key outside of
  // production, so this field stays blank (and required) on a real deployment.
  useEffect(() => {
    fetch("/api/admin/sc-reset")
      .then((res) => res.json())
      .then((data) => {
        if (data?.setupKey) setSetupKey(data.setupKey);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResult("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/sc-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setupKey, email, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setResult(data.result);
      setTimeout(() => router.push("/admin/login"), 1500);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-mark">A</div>
        <h1>Admin Setup / Reset</h1>
        <p>
          Create the admin account or reset its password using this deployment&apos;s
          setup key (<code>ADMIN_SEED_PASSWORD</code>).
        </p>

        <label>
          Setup key
          <div className="admin-pw-wrap">
            <input
              type={showSetupKey ? "text" : "password"}
              value={setupKey}
              onChange={(e) => setSetupKey(e.target.value)}
              placeholder="Setup key from server env"
              required
            />
            <button type="button" className="admin-pw-toggle" onClick={() => setShowSetupKey((v) => !v)} aria-label="Toggle setup key visibility">
              {showSetupKey ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </label>

        <label>
          Admin email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>

        <label>
          New password
          <div className="admin-pw-wrap">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              required
            />
            <button type="button" className="admin-pw-toggle" onClick={() => setShowNewPassword((v) => !v)} aria-label="Toggle password visibility">
              {showNewPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </label>

        <label>
          Confirm new password
          <div className="admin-pw-wrap">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              minLength={8}
              required
            />
            <button
              type="button"
              className="admin-pw-toggle"
              onClick={() => setShowConfirmPassword((v) => !v)}
              aria-label="Toggle confirm password visibility"
            >
              {showConfirmPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </label>

        {error && <div className="admin-error">{error}</div>}
        {result && <div className="admin-success">{result}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Create / Reset admin"}
        </button>
      </form>
    </div>
  );
}
