/** Local (on-device) notifications for background role screens. */

let asked = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied" || asked) return false;
  asked = true;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

/**
 * Shows a notification through the service worker when available, so it still
 * appears while the tab is hidden or the screen is off.
 */
export async function notify(title: string, body: string, tag = "rava") {
  if (!(await ensureNotificationPermission())) return;
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg?.showNotification) {
      await reg.showNotification(title, { body, tag, icon: "/icon-512.png", badge: "/icon-512.png" });
      return;
    }
  } catch { /* fall through */ }
  try { new Notification(title, { body, tag, icon: "/icon-512.png" }); } catch { /* ignore */ }
}
