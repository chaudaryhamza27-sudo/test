"use client";

import { useEffect, useRef, useState } from "react";
import { IconWhatsapp } from "../icons";

// Movement smaller than this counts as a tap/click, not a drag — lets the
// button stay draggable while still being clickable without moving it.
const DRAG_THRESHOLD = 6;
const STORAGE_KEY = "floatingWhatsappPos";
// The app content is a centered column capped at 480px (see .app-shell /
// .bottom-nav in globals.css) — on wider screens it sits on a grey backdrop.
// Clamp the button to that column instead of the full window so it can't be
// dragged out onto the backdrop.
const APP_MAX_WIDTH = 480;

function getColumnBounds() {
  const width = Math.min(window.innerWidth, APP_MAX_WIDTH);
  const left = (window.innerWidth - width) / 2;
  return { left, right: left + width };
}

export default function FloatingWhatsApp() {
  const [waLink, setWaLink] = useState(null);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    fetch("/api/support-settings")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        const digits = String(data.whatsappNumber || "").replace(/[^\d]/g, "");
        if (!digits) return;
        const message = "Hello support, I need help with my account.";
        setWaLink(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`);
      })
      .catch(() => {});
  }, []);

  const clamp = (x, y, sizeOverride) => {
    const size = sizeOverride || btnRef.current?.offsetWidth || 56;
    const { left, right } = getColumnBounds();
    const maxX = right - size;
    const maxY = window.innerHeight - size;
    return { x: Math.min(Math.max(x, left), Math.max(maxX, left)), y: Math.min(Math.max(y, 0), Math.max(maxY, 0)) };
  };

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {}
    const size = 56;
    const { right } = getColumnBounds();
    const defaultPos = {
      x: right - size - 16,
      y: window.innerHeight - size - 84,
    };
    const initial = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? saved : defaultPos;
    setPos(clamp(initial.x, initial.y, size));

    const onResize = () => setPos((current) => (current ? clamp(current.x, current.y) : current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPointerDown = (e) => {
    if (!pos) return;
    btnRef.current.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) d.moved = true;
    if (d.moved) setPos(clamp(d.originX + dx, d.originY + dy));
  };

  const onPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    if (d.moved) {
      setPos((current) => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        } catch {}
        return current;
      });
    } else if (waLink) {
      window.open(waLink, "_blank", "noopener,noreferrer");
    }
  };

  if (!waLink || !pos) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      aria-label="Chat on WhatsApp"
      className="floating-whatsapp"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <IconWhatsapp />
    </button>
  );
}
