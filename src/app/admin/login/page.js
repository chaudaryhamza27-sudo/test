"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      if (data.user.role !== "admin") {
        setError("This account does not have admin access.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <p>Sign in with your admin account to manage users and transactions.</p>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <div className="admin-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <style jsx>{`
        .admin-login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 20px;
        }
        .admin-login-card {
          width: 100%;
          max-width: 380px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          color: var(--text);
        }
        h1 {
          font-size: 22px;
          margin-bottom: 6px;
        }
        p {
          font-size: 12px;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 14px;
        }
        input {
          display: block;
          width: 100%;
          margin-top: 6px;
          height: 44px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--surface-sunken);
          color: var(--text);
          padding: 0 12px;
          font-size: 14px;
        }
        .admin-error {
          background: var(--danger-bg);
          border: 1px solid rgba(240, 74, 94, 0.3);
          color: #ffd9e0;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 12px;
          margin-bottom: 14px;
        }
        button {
          width: 100%;
          height: 46px;
          border: 0;
          border-radius: 12px;
          background: var(--accent);
          color: #181206;
          font-weight: 800;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.6;
          cursor: default;
        }
      `}</style>
    </div>
  );
}
