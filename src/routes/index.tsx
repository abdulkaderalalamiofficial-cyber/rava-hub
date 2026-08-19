import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/login", replace: true });
  },
  component: () => null,
  head: () => ({
    meta: [
      { title: "Rava Super App — منصة التنقل والتجارة الذكية" },
      { name: "description", content: "منصة رافا الموحدة: رحلات، توصيل، شحن، تجارة، خدمات طبية وامتياز المناطق — بواجهة عربية/إنجليزية ولكل دور تطبيق مستقل." },
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
