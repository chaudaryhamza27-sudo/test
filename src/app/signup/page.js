"use client";

import { useEffect, useMemo, useState } from "react";
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
  IconGift,
  IconSupport,
  IconFlagUS,
  IconAccount,
} from "../icons";

export default function SignupPage() {
  const router = useRouter();
  const [tab, setTab] = useState("phone");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [invite, setInvite] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const [popup, setPopup] = useState(null);
  const [error, setError] = useState(null);
  const [redirectHome, setRedirectHome] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setInvite(ref);
  }, []);

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
    return name.trim().length > 0 && idFilled && password.trim().length > 0 && confirm.trim().length > 0 && agree;
  }, [name, tab, phone, email, password, confirm, agree]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          ...(tab === "phone" ? { phone } : { email }),
          password,
          confirmPassword: confirm,
          inviteCode: invite || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your details and try again.");
        return;
      }
   
       router.push("/");
      openNotice("Account created successfully. ");
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

          <h1 className="kk-auth-title">Register</h1>
          <p className="kk-auth-sub">
            Create an account with your phone number or email
            <br />
            Takes less than a minute
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
              Email Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="kk-auth-field">
              <div className="kk-auth-label">
                <IconAccount />
                Name
              </div>
              <input
                className="kk-auth-input"
                type="text"
                placeholder="Please enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

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
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="kk-eye-btn" onClick={() => setShowPass((v) => !v)} aria-label="Toggle password visibility">
                  {showPass ? <IconEye /> : <IconEyeOff />}
                </button>
              </div>
            </div>

            <div className="kk-auth-field">
              <div className="kk-auth-label">
                <IconLockLine />
                Confirm Password
              </div>
              <div className="kk-pass-wrap">
                <input
                  className="kk-auth-input"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
                <button type="button" className="kk-eye-btn" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle password visibility">
                  {showConfirm ? <IconEye /> : <IconEyeOff />}
                </button>
              </div>
            </div>

            <div className="kk-auth-field">
              <div className="kk-auth-label">
                <IconGift />
                Invitation code (optional)
              </div>
              <input
                className="kk-auth-input"
                type="text"
                placeholder="Please enter invitation code"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
              />
            </div>

            <label className="kk-terms-row">
              <button
                type="button"
                className={`kk-radio ${agree ? "checked" : ""}`}
                onClick={() => setAgree((v) => !v)}
                aria-label="Agree to terms"
                style={{ marginTop: 2 }}
              />
              <span>
                I confirm I&apos;m 18+ and agree to the{" "}
                <Link href="/legal/terms" target="_blank" rel="noopener noreferrer">
                  Terms
                </Link>{" "}
                &amp;{" "}
                <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </Link>
              </span>
            </label>

            {error && <div className="alert alert-danger" style={{ marginTop: 18 }}>{error}</div>}

            <button type="submit" className="kk-btn-primary" disabled={!canSubmit || submitting}>
              {submitting ? "Registering…" : "Register"}
            </button>
          </form>

          <Link href="/login" className="kk-btn-outline" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            Log in
          </Link>

          <div className="kk-auth-footer">
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
          <div className="kk-popup-icon">✨</div>
          <div className="kk-popup-title">PK92</div>
          <p className="kk-popup-text">{popup}</p>
          <button className="kk-popup-btn" onClick={closeNotice}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
