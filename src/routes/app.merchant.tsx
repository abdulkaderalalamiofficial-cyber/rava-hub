import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { MerchantApp } from "@/rafa/apps/MerchantApp";

export const Route = createFileRoute("/app/merchant")({
  component: () => <RoleScreen role="merchant" background><MerchantApp /></RoleScreen>,
  head: () => ({
    meta: [
      { title: "RAVA للتجار — إدارة المتجر والطلبات | RAVA Merchant" },
      { name: "description", content: "لوحة التاجر والناشر: كتالوج ذكي، مخزون وتنبيهات، حملات إعلانية، وتسويات أرباح المبيعات الرقمية." },
      { property: "og:title", content: "RAVA للتجار — إدارة المتجر والطلبات" },
      { property: "og:description", content: "كتالوج، مخزون، إعلانات وتسويات في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-merchant.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-merchant.png" },
      { rel: "icon", type: "image/png", href: "/icon-merchant.png" },
    ],
  }),
});
