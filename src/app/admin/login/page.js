"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { IconEye, IconEyeOff } from "../../icons";
import "../admin.css";

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: "unsupported" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      reject,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

// City name for the login record ("Lahore, Punjab, Pakistan"). BigDataCloud's
// free client-side endpoint needs no key; a failed lookup just leaves the
// place empty and never blocks the login.
async function lookupPlace({ lat, lng }) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return [d.city || d.locality, d.principalSubdivision, d.countryName].filter(Boolean).join(", ") || null;
  } catch {
    return null;
  }
}

function locationErrorMessage(err) {
  if (err?.code === 1) return "Location permission was denied. Allow location access for this site to sign in as admin.";
  if (err?.code === "unsupported" || !window.isSecureContext) return "This browser can't share location here. Use a modern browser over HTTPS to sign in as admin.";
  return "Couldn't get your location. Turn on location services and try again.";
}

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/ensure-seed").catch(() => {});
    if (new URLSearchParams(window.location.search).get("reason") === "other-device") {
      setError("You were logged out because this admin account signed in on another device.");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Admin login requires the device's location; the server refuses it otherwise.
      let location;
      try {
        location = await getLocation();
      } catch (err) {
        setError(locationErrorMessage(err));
        return;
      }
      location.place = await lookupPlace(location);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, location }),
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
