"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "../../icons";
import { SUPERADMIN_ROUTE_PATH } from "./superadminRoute";
import "../admin.css";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ensure-seed").catch(() => {});
    fetch("/api/admin/superadmin", { cache: "no-store" })
      .then((response) => {
        if (response.ok) router.replace(`${SUPERADMIN_ROUTE_PATH}/superadmin`);
      })
      .catch(() => {});
  }, [router]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/admin/ensure-seed").catch(() => {});
      const response = await fetch("/api/admin/superadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Superadmin sign-in failed.");
        return;
      }
      router.replace(`${SUPERADMIN_ROUTE_PATH}/superadmin`);
    } catch {
      setError("Could not reach the sign-in service. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-root superadmin-mode admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-mark">S</div>
        <h1>Superadmin sign in</h1>
        <p>Use the separate superadmin credentials to open privileged controls.</p>

        <label>
          Superadmin email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="superadmin@example.com"
            autoComplete="username"
            required
          />
        </label>

        <label>
          Password
          <div className="admin-pw-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="admin-pw-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </label>

        {error && <div className="admin-error" role="alert">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in to superadmin"}
        </button>
        <a className="admin-login-forgot" href="/admin/login">Regular admin sign in</a>
      </form>
    </div>
  );
}
