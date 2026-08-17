"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "../../icons";
import "../admin.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ensure-seed").catch(() => {});
  }, []);

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
    <div className="admin-root admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-mark">A</div>
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
          <div className="admin-pw-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <button type="button" className="admin-pw-toggle" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </label>

        {error && <div className="admin-error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <a className="admin-login-forgot" href="/admin/sc/reset">
          No admin account yet, or forgot the password?
        </a>
      </form>
    </div>
  );
}
