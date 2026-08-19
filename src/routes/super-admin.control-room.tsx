import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Store, Building2, Stethoscope, Compass } from "lucide-react";
import { RoleScreen } from "@/rafa/RoleScreen";
import { AdminGate } from "@/rafa/components/AdminGate";
import { AdminApp } from "@/rafa/apps/AdminApp";
import { ControlPasswordSettings } from "@/rafa/components/ControlPasswordSettings";

export const Route = createFileRoute("/super-admin/control-room")({
  component: () => (
    <RoleScreen role="admin" background>
      <AdminGate>
        <div className="space-y-6">
          <PortalLauncher />
          <ControlPasswordSettings />
          <AdminApp />
        </div>
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

const PORTALS = [
  { to: "/app/customer", label: "العميل", icon: Users },
  { to: "/app/merchant", label: "التاجر", icon: Store },
  { to: "/app/captain", label: "الكابتن", icon: Compass },
  { to: "/app/medical", label: "الطبي والتجميلي", icon: Stethoscope },
  { to: "/app/partner", label: "شريك المنطقة", icon: Building2 },
] as const;

function PortalLauncher() {
  return (
    <section className="bg-card border-2 border-border rounded-2xl p-5 shadow-card">
      <h3 className="font-black text-sm mb-3">بوابات التطبيقات · الدخول إلى أي دور</h3>
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {PORTALS.map((p) => {
          const Icon = p.icon;
          return (
            <Link key={p.to} to={p.to}
              className="p-3 rounded-xl border-2 border-border hover:border-gold/60 transition-colors flex items-center gap-2 text-xs font-bold">
              <Icon className="w-4 h-4 text-gold" /> {p.label}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
