"use client";

import { useEffect, useRef, useState } from "react";
import { IconWhatsapp } from "../icons";

// Movement smaller than this counts as a tap/click, not a drag — lets the
// button stay draggable while still being clickable without moving it.
const DRAG_THRESHOLD = 6;
const STORAGE_KEY = "floatingWhatsappPos";

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

  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    } catch {}
    const size = 56;
    const defaultPos = {
      x: window.innerWidth - size - 16,
      y: window.innerHeight - size - 84,
    };
    setPos(saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? saved : defaultPos);
  }, []);

  const clamp = (x, y) => {
    const size = btnRef.current?.offsetWidth || 56;
    const maxX = window.innerWidth - size;
    const maxY = window.innerHeight - size;
    return { x: Math.min(Math.max(x, 0), Math.max(maxX, 0)), y: Math.min(Math.max(y, 0), Math.max(maxY, 0)) };
  };

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
