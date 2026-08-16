import { createFileRoute } from "@tanstack/react-router";
import { RoleScreen } from "@/rafa/RoleScreen";
import { AdminGate } from "@/rafa/components/AdminGate";
import { AdminApp } from "@/rafa/apps/AdminApp";

export const Route = createFileRoute("/admin")({
  component: () => (
    <RoleScreen role="admin" background>
      <AdminGate>
        <AdminApp />
      </AdminGate>
    </RoleScreen>
  ),
  head: () => ({
    meta: [
      { title: "RAVA — غرفة التحكم المركزية | RAVA Control Room" },
      { name: "description", content: "غرفة التحكم المركزية: مراقبة الأسطول والطلبات، العمولات، حسابات الناشرين والتسويات." },
      { property: "og:title", content: "RAVA — غرفة التحكم المركزية" },
      { property: "og:description", content: "مراقبة، عمولات، حسابات وتسويات المنصة." },
      { property: "og:type", content: "website" },
      { name: "robots", content: "noindex" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "manifest", href: "/manifest-admin.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-admin.png" },
      { rel: "icon", type: "image/png", href: "/icon-admin.png" },
    ],
  }),
});
