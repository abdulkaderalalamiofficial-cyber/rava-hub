import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { MedicalApp } from "@/rafa/apps/MedicalApp";

export const Route = createFileRoute("/app/medical")({
  component: () => <RoleScreen role="medical" background><MedicalApp /></RoleScreen>,
  head: () => ({
    meta: [
      { title: "RAVA لمقدمي الخدمات الطبية والتجميلية | RAVA Providers" },
      { name: "description", content: "إدارة العيادات ومعامل التحاليل وصالونات التجميل: الحجوزات، الأسعار والمدفوعات." },
      { property: "og:title", content: "RAVA لمقدمي الخدمات الطبية والتجميلية" },
      { property: "og:description", content: "حجوزات وأسعار ومدفوعات للعيادات والمعامل والصالونات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-medical.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-medical.png" },
      { rel: "icon", type: "image/png", href: "/icon-medical.png" },
    ],
  }),
});
