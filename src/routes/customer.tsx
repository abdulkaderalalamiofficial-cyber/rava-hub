import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { CustomerApp } from "@/rafa/apps/CustomerApp";

export const Route = createFileRoute("/customer")({
  component: () => <RoleScreen role="customer"><CustomerApp /></RoleScreen>,
  head: () => ({
    meta: [
      { title: "RAVA للعملاء — رحلات وتوصيل فوري | RAVA Customer" },
      { name: "description", content: "اطلب رحلة أو توصيل فوري، تسوق من مول رافا والمكتبة الرقمية، وتابع الكابتن على الخريطة لحظة بلحظة." },
      { property: "og:title", content: "RAVA للعملاء — رحلات وتوصيل فوري" },
      { property: "og:description", content: "رحلات، توصيل، تسوق وخدمات طبية في تطبيق واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-customer.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-customer.png" },
      { rel: "icon", type: "image/png", href: "/icon-customer.png" },
    ],
  }),
});
