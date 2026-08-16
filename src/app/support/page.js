"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconChevronLeft,
  IconShield,
  IconWhatsapp,
  IconHeadset,
  IconMegaphone,
} from "../icons";
import BottomNav from "../components/BottomNav";

export default function SupportPage() {
  const [settings, setSettings] = useState(null);
  const [uid, setUid] = useState(null);

  useEffect(() => {
    fetch("/api/support-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setSettings)
      .catch(() => setSettings(null));
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUid(data.user?.uid || null))
      .catch(() => setUid(null));
  }, []);

  const number = settings?.whatsappNumber || "";
  const digits = number.replace(/[^\d]/g, "");
  const message = `Hello support, I need help with my account.${uid ? ` UID: ${uid}` : ""}`;
  const waLink = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;

  return (
    <div className="kk-page">
      <header className="kk-header">
        <Link href="/" className="kk-header-icon-btn">
          <IconChevronLeft />
        </Link>
        <span className="kk-header-title">Support</span>
        <span className="badge-pill badge-info">
          <IconShield style={{ width: 11, height: 11 }} />
          24/7
        </span>
      </header>

      <main>
        <section className="support-canvas">
          <div className="support-head">
            <div className="support-icon">
              <IconWhatsapp />
            </div>
            <div className="support-title">
              <h3>Support Center</h3>
              <p>Fast help, payment issue, account support and game guidance.</p>
            </div>
          </div>

          <div className="support-number">
            <div>
              <span>WhatsApp Number</span>
              <b>{number || "…"}</b>
            </div>
            <IconHeadset style={{ width: 20, height: 20 }} />
          </div>

          {waLink ? (
            <a href={waLink} className="support-btn" target="_blank" rel="noopener noreferrer">
              <IconWhatsapp style={{ width: 17, height: 17 }} />
              Chat on WhatsApp
            </a>
          ) : (
            <button type="button" className="support-btn" disabled>
              <IconWhatsapp style={{ width: 17, height: 17 }} />
              WhatsApp support unavailable
            </button>
          )}
        </section>

        {settings?.announcementEnabled && settings?.announcementText && (
          <section className="support-canvas announcement">
            <div className="support-head">
              <div className="support-icon announcement">
                <IconMegaphone />
              </div>
              <div className="support-title">
                <h3>Announcement</h3>
              </div>
            </div>
            <p className="support-announcement-text">{settings.announcementText}</p>
          </section>
        )}

        <footer className="kk-footer">
          PK92 is an educational simulation using demo credits only — WhatsApp support is provided for demo
          purposes and no real transactions are handled over chat.
        </footer>
      </main>

      <BottomNav />
    </div>
  );
}
