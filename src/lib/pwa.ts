/** PWA + background-keepalive helpers (browser only). */

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => { /* ignore */ });
}

/**
 * Keeps a role workspace (captain / merchant / provider / control room) working
 * while the screen is off, the tab is hidden, or the app is backgrounded.
 * - registers periodic background sync when the browser allows it
 * - holds a screen wake lock while the tab is visible
 * - re-runs `onWake` when the browser resumes the tab or the SW pings us
 */
export function startBackgroundMode(onWake: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  let wakeLock: any = null;
  let disposed = false;

  const acquireLock = async () => {
    try {
      if (document.visibilityState === "visible" && "wakeLock" in navigator) {
        wakeLock = await (navigator as any).wakeLock.request("screen");
      }
    } catch { /* not supported / denied */ }
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") {
      void acquireLock();
      onWake();
    }
  };

  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === "rava-sync") onWake();
  };

  void acquireLock();
  document.addEventListener("visibilitychange", onVisibility);
  navigator.serviceWorker?.addEventListener?.("message", onMessage);

  navigator.serviceWorker?.ready
    ?.then(async (reg: any) => {
      if (disposed) return;
      try { await reg.periodicSync?.register("rava-role-sync", { minInterval: 15 * 60 * 1000 }); } catch { /* ignore */ }
      try { await reg.sync?.register("rava-role-sync"); } catch { /* ignore */ }
    })
    .catch(() => {});

  // Heartbeat so timers/polling stay warm even in throttled tabs.
  const beat = window.setInterval(onWake, 60_000);

  return () => {
    disposed = true;
    window.clearInterval(beat);
    document.removeEventListener("visibilitychange", onVisibility);
    navigator.serviceWorker?.removeEventListener?.("message", onMessage);
    try { wakeLock?.release?.(); } catch { /* ignore */ }
  };
}
