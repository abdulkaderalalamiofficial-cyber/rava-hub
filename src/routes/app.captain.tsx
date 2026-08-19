import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { I18nProvider } from "@/rafa/i18n";
import { StoreProvider, type CaptainFleet } from "@/rafa/store";
import { CaptainApp } from "@/rafa/apps/CaptainApp";
import { CaptainLogin } from "@/rafa/gateway/CaptainLogin";
import { VoiceCompanion } from "@/rafa/components/VoiceCompanion";
import { startBackgroundMode } from "@/lib/pwa";
import { ensureNotificationPermission } from "@/lib/notify";

export const Route = createFileRoute("/app/captain")({
  component: CaptainRoute,
  head: () => ({
    meta: [
      { title: "RAVA للكباتن — بوابة الكابتن الموحدة | RAVA Captain" },
      { name: "description", content: "تطبيق كابتن رافا الموحد: موتو، تروسيكل، شاحنات وونش — طلبات، ورديات، محفظة وخريطة حية." },
      { property: "og:title", content: "RAVA للكباتن — بوابة الكابتن الموحدة" },
      { property: "og:description", content: "طلبات، ورديات، محفظة وخريطة حية لكل فئات الكباتن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-captain.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-captain.png" },
      { rel: "icon", type: "image/png", href: "/icon-captain.png" },
    ],
  }),
});

function CaptainRoute() {
  return (
    <I18nProvider>
      <StoreProvider>
        <CaptainInner />
      </StoreProvider>
    </I18nProvider>
  );
}

function CaptainInner() {
  const [fleet, setFleet] = useState<CaptainFleet | null>(null);

  useEffect(() => startBackgroundMode(() => {
    window.dispatchEvent(new CustomEvent("rava:wake", { detail: { role: "captain" } }));
  }), []);

  // Ask for notification permission on the captain's first interaction.
  useEffect(() => {
    const ask = () => { void ensureNotificationPermission(); };
    window.addEventListener("pointerdown", ask, { once: true });
    window.addEventListener("keydown", ask, { once: true });
    return () => {
      window.removeEventListener("pointerdown", ask);
      window.removeEventListener("keydown", ask);
    };
  }, []);

  if (!fleet) {
    return <CaptainLogin onSuccess={setFleet} />;
  }

  return (
    <>
      <CaptainApp lockedFleet={fleet} />
      <VoiceCompanion role="captain" />
    </>
  );
}
