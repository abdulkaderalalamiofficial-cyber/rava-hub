import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Store, Building2, ShieldCheck, Stethoscope, Compass, ArrowRight, Lock } from "lucide-react";
import { RavaLogo } from "@/rafa/components/RavaLogo";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — RAVA Super App" },
      { name: "description", content: "اختر بوابتك للدخول إلى تطبيق رافا: العملاء، التجار، الكباتن، مقدمو الخدمات الطبية وشركاء المناطق." },
      { property: "og:title", content: "تسجيل الدخول — RAVA Super App" },
      { property: "og:description", content: "بوابة دخول موحدة لكل أدوار منصة رافا." },
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

const PORTALS = [
  { to: "/app/customer", titleAr: "العميل", descAr: "اطلب رحلة أو توصيل فوري", icon: Users, tone: "bg-gradient-royal" },
  { to: "/app/merchant", titleAr: "التاجر", descAr: "إدارة المتجر والطلبات", icon: Store, tone: "bg-gradient-gold" },
  { to: "/app/captain", titleAr: "الكابتن", descAr: "موتو · تروسيكل · شاحنات · ونش", icon: Compass, tone: "bg-gradient-royal" },
  { to: "/app/medical", titleAr: "الخدمات الطبية والتجميلية", descAr: "عيادات، معامل وصالونات", icon: Stethoscope, tone: "bg-gradient-gold" },
  { to: "/app/partner", titleAr: "شريك المنطقة", descAr: "إدارة نطاق الامتياز", icon: Building2, tone: "bg-gradient-royal" },
] as const;

function LoginPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-metallic relative overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(ellipse at top, #046A38 0%, transparent 55%), radial-gradient(ellipse at bottom right, #D4AF37 0%, transparent 50%)" }} />
      <div className="relative max-w-3xl mx-auto px-5 py-12">
        <header className="flex justify-center mb-6"><RavaLogo size={64} /></header>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black"><span className="text-gold-3d">RAVA</span> <span className="text-foreground">Super App</span></h1>
          <p className="text-xs text-muted-foreground mt-2">اختر بوابتك للدخول — كل دور له تطبيق مستقل تمامًا</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {PORTALS.map((p) => {
            const Icon = p.icon;
            return (
              <Link key={p.to} to={p.to}
                className="p-4 rounded-2xl border-2 border-border bg-card/90 backdrop-blur-sm hover:border-gold/60 hover:-translate-y-0.5 transition-all flex items-center gap-3 shadow-card">
                <div className={`w-12 h-12 rounded-xl grid place-items-center text-primary-foreground ${p.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{p.titleAr}</div>
                  <div className="text-[11px] text-muted-foreground">{p.descAr}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gold rotate-180" />
              </Link>
            );
          })}
        </div>

        <div className="mt-10 border-t border-border pt-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <Lock className="w-3.5 h-3.5 text-gold" />
            <span className="font-bold">منطقة آمنة</span>
            <span className="text-muted-foreground">· للإدارة المركزية فقط</span>
          </div>
          <Link to="/super-admin/control-room"
            className="px-4 py-2 rounded-xl bg-gradient-royal text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-royal">
            <ShieldCheck className="w-4 h-4" /> غرفة التحكم المركزية
          </Link>
        </div>

        <footer className="text-center text-[10px] text-muted-foreground mt-8">
          © {new Date().getFullYear()} RAVA Super App
        </footer>
      </div>
    </div>
  );
}
