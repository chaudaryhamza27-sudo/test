// setInterval that skips ticks while the browser tab is hidden (no point
// refreshing what nobody sees), then catches up with one immediate run when
// the tab becomes visible again — only if a tick was actually skipped, so
// returning to the tab never costs an extra request. Returns a cleanup fn.
export function startVisibleInterval(fn, ms) {
  let missed = false;
  const timer = window.setInterval(() => {
    if (document.hidden) {
      missed = true;
      return;
    }
    fn();
  }, ms);
  const onVisibility = () => {
    if (!document.hidden && missed) {
      missed = false;
      fn();
    }
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
