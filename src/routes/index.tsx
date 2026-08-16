import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { I18nProvider } from "@/rafa/i18n";
import { StoreProvider } from "@/rafa/store";
import { Gateway, type GatewayRole } from "@/rafa/gateway/Gateway";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Rava Super App — منصة التنقل والتجارة الذكية" },
      { name: "description", content: "منصة رافا الموحدة: رحلات، توصيل، شحن، تجارة، خدمات طبية وامتياز المناطق — بواجهة عربية/إنجليزية ولكل دور شاشة مستقلة." },
      { property: "og:title", content: "Rava Super App — منصة التنقل والتجارة الذكية" },
      { property: "og:description", content: "رحلات، توصيل، شحن، تجارة وخدمات طبية في تطبيق واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "icon", type: "image/png", href: "/icon-512.png" },
    ],
  }),
});

const ROLE_PATH: Record<GatewayRole, string> = {
  customer: "/customer",
  merchant: "/merchant",
  medical: "/medical",
  partner: "/partner",
  admin: "/admin",
  captain: "/captain",
  captainUnified: "/captain",
};

function Index() {
  return (
    <I18nProvider>
      <StoreProvider>
        <GatewayRouter />
      </StoreProvider>
    </I18nProvider>
  );
}

function GatewayRouter() {
  const navigate = useNavigate();
  return <Gateway onEnter={(_country, role) => navigate({ to: ROLE_PATH[role] })} />;
}
