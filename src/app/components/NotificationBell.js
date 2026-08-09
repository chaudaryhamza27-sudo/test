"use client";

import { useEffect, useRef, useState } from "react";
import { IconBell } from "../icons";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const boxRef = useRef(null);

  const load = () => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setItems(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unreadCount > 0) {
      await fetch("/api/notifications/read-all", { method: "PATCH" });
      setUnreadCount(0);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        style={{
          position: "relative",
          width: 30,
          height: 30,
          borderRadius: 10,
          background: "#eaf3ff",
          color: "var(--kk-blue)",
          display: "grid",
          placeItems: "center",
          border: 0,
          cursor: "pointer",
        }}
      >
        <IconBell style={{ width: 17, height: 17 }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: -3,
              right: -3,
              minWidth: 15,
              height: 15,
              padding: "0 3px",
              borderRadius: 999,
              background: "#ff3d81",
              color: "#fff",
              fontSize: 9,
              fontWeight: 800,
              display: "grid",
              placeItems: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 38,
            width: 300,
            maxHeight: 360,
            overflowY: "auto",
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 20px 50px rgba(20,40,80,.25)",
            zIndex: 1000,
            padding: 8,
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--kk-muted)", fontSize: 12 }}>
              No notifications yet.
            </div>
          ) : (
            items.map((n) => (
              <div
                key={n._id}
                style={{
                  padding: "10px 10px",
                  borderRadius: 12,
                  background: n.read ? "transparent" : "#eaf3ff",
                  marginBottom: 4,
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--kk-text)" }}>{n.title}</div>
                <div style={{ fontSize: 11.5, color: "var(--kk-muted)", marginTop: 2, lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: "#c2ccd8", marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
