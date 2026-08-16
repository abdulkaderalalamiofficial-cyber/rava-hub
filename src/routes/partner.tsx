import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { PartnerApp } from "@/rafa/apps/PartnerApp";

export const Route = createFileRoute("/partner")({
  component: () => <RoleScreen role="partner" background><PartnerApp /></RoleScreen>,
  head: () => ({
    meta: [
      { title: "RAVA لشركاء المناطق — إدارة الامتياز | RAVA Zone Partner" },
      { name: "description", content: "إدارة نطاق الامتياز: الكباتن، الطلبات، العمولات والتسويات الشهرية داخل منطقتك." },
      { property: "og:title", content: "RAVA لشركاء المناطق — إدارة الامتياز" },
      { property: "og:description", content: "كباتن، طلبات، عمولات وتسويات لنطاقك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-partner.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-partner.png" },
      { rel: "icon", type: "image/png", href: "/icon-partner.png" },
    ],
  }),
});
