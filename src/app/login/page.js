"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  IconEagle,
  IconChevronLeft,
  IconChevronDown,
  IconPhone,
  IconMail,
  IconLockLine,
  IconEye,
  IconEyeOff,
  IconSupport,
  IconFlagUS,
} from "../icons";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [popup, setPopup] = useState(null);
  const [error, setError] = useState(null);
  const [redirectHome, setRedirectHome] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openNotice = (msg) => setPopup(msg);
  const closeNotice = () => {
    setPopup(null);
    if (redirectHome) {
      setRedirectHome(false);
      router.push("/");
    }
  };

  const canSubmit = useMemo(() => {
    const idFilled = tab === "phone" ? phone.trim().length > 0 : email.trim().length > 0;
    return idFilled && password.trim().length > 0;
  }, [tab, phone, email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tab === "phone" ? { phone, password } : { email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Please check your details and try again.");
        return;
      }
      setRedirectHome(true);
      openNotice("Logged in successfully. Heading back to the home screen.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="kk-auth-shell">
      <div className="kk-auth-card">
        <header className="kk-auth-header">
          <div className="kk-auth-topline">
            <Link href="/" className="kk-auth-back-btn">
              <IconChevronLeft />
            </Link>
            <div className="kk-auth-brand">
              <IconEagle />
              PK92
            </div>
            <button type="button" className="kk-auth-lang" onClick={() => openNotice("Language selection is a placeholder in this demo.")}>
              <IconFlagUS className="kk-auth-flag" />
              EN
            </button>
          </div>

          <h1 className="kk-auth-title">Log in</h1>
          <p className="kk-auth-sub">
            Please log in with your phone number or email
            <br />
            If you forget your password, please contact customer service
          </p>
        </header>

        <div className="kk-auth-body">
          <div className="kk-auth-tabs2">
            <button type="button" className={`kk-auth-tab2 ${tab === "phone" ? "active" : ""}`} onClick={() => setTab("phone")}>
              <IconPhone />
              phone number
            </button>
            <button type="button" className={`kk-auth-tab2 ${tab === "email" ? "active" : ""}`} onClick={() => setTab("email")}>
              <IconMail />
              Email Login
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {tab === "phone" ? (
              <div className="kk-auth-field">
                <div className="kk-auth-label">
                  <IconPhone />
                  Phone number
                </div>
                <div className="kk-auth-phone-row">
                  <button type="button" className="kk-country-select" onClick={() => openNotice("Country code selection is a placeholder in this demo.")}>
                    +92
                    <IconChevronDown />
                  </button>
                  <input
                    className="kk-auth-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="Please enter the phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="kk-auth-field">
                <div className="kk-auth-label">
                  <IconMail />
                  Mail
                </div>
                <input
                  className="kk-auth-input"
                  type="email"
                  placeholder="please input your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <div className="kk-auth-field">
              <div className="kk-auth-label">
                <IconLockLine />
                Password
              </div>
              <div className="kk-pass-wrap">
                <input
                  className="kk-auth-input"
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" className="kk-eye-btn" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password visibility">
                  {showPass ? <IconEye /> : <IconEyeOff />}
                </button>
              </div>
            </div>

            <label className="kk-remember-row">
              <button
                type="button"
                className={`kk-radio ${remember ? "checked" : ""}`}
                onClick={() => setRemember((v) => !v)}
                aria-label="Remember password"
              />
              <span>Remember password</span>
            </label>

            {error && <div className="alert alert-danger" style={{ marginTop: 18 }}>{error}</div>}

            <button type="submit" className="kk-btn-primary" disabled={!canSubmit || submitting}>
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>

          <Link href="/signup" className="kk-btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            Register
          </Link>

          <div className="kk-auth-footer">
            <button type="button" className="kk-auth-footer-item" onClick={() => openNotice("Password recovery is a placeholder in this demo.")}>
              <span className="kk-auth-footer-icon">
                <IconLockLine />
              </span>
              Forgot password
            </button>
            <button type="button" className="kk-auth-footer-item" onClick={() => openNotice("Customer service chat is a placeholder in this demo.")}>
              <span className="kk-auth-footer-icon">
                <IconSupport />
              </span>
              Customer Service
            </button>
          </div>
        </div>
      </div>

      <div className={`popup ${popup ? "active" : ""}`} onClick={closeNotice}>
        <div className="kk-popup-box" onClick={(e) => e.stopPropagation()}>
          <div className="kk-popup-icon">🔐</div>
          <div className="kk-popup-title">Demo Mode</div>
          <p className="kk-popup-text">{popup}</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
