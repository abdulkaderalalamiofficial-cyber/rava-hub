import { useEffect, type ReactNode } from "react";
import { I18nProvider, useI18n } from "./i18n";
import { StoreProvider } from "./store";
import { Shell, type Role } from "./components/Shell";
import { VoiceCompanion } from "./components/VoiceCompanion";
import { startBackgroundMode } from "@/lib/pwa";
import { ensureNotificationPermission } from "@/lib/notify";

/**
 * Shared wrapper for every role screen route.
 * Keeps providers, the shell chrome, the friendly voice companion and the
 * background (screen-off) mode in one place.
 */
export function RoleScreen({ role, background = false, children }: { role: Role; background?: boolean; children: ReactNode }) {
  return (
    <I18nProvider>
      <StoreProvider>
        <Inner role={role} background={background}>{children}</Inner>
      </StoreProvider>
    </I18nProvider>
  );
}

function Inner({ role, background, children }: { role: Role; background: boolean; children: ReactNode }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!background) return;
    return startBackgroundMode(() => {
      window.dispatchEvent(new CustomEvent("rava:wake", { detail: { role } }));
    });
  }, [background, role]);

  // Browsers only grant notification permission from a user gesture, so ask on
  // the first interaction inside a background-capable role screen.
  useEffect(() => {
    if (!background) return;
    const ask = () => { void ensureNotificationPermission(); };
    window.addEventListener("pointerdown", ask, { once: true });
    window.addEventListener("keydown", ask, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
    };
  }, [background]);


  return (
    <Shell role={role} roleLabel={t(role)}>
      {children}
      <VoiceCompanion role={role} />
    </Shell>
  );
}
