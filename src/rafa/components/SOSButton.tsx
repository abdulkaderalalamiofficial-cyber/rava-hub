import { useState } from "react";
import { Headphones, X, Phone, MessageCircle, Mail } from "lucide-react";

// Floating Customer Support button (replaces the previous emergency SOS floating button).
// The dedicated red SOS card remains inside the Customer dashboard.
export function SOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 end-5 z-40 w-14 h-14 rounded-full shadow-royal grid place-items-center font-bold text-[10px] text-white"
        style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 200), oklch(0.62 0.13 215))" }}
        aria-label="خدمة العملاء"
      >
        <div className="flex flex-col items-center leading-none">
          <Headphones className="w-5 h-5" />
          <span className="mt-0.5">دعم</span>
        </div>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl border border-gold shadow-royal max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl grid place-items-center text-white" style={{ background: "linear-gradient(135deg, oklch(0.72 0.12 200), oklch(0.62 0.13 215))" }}>
                <Headphones className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg">خدمة العملاء</div>
                <div className="text-xs text-muted-foreground mt-1">فريق الدعم متاح 24/7 لمساعدتك</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
            </div>
            <div className="mt-4 space-y-2">
              <a href="tel:19000" className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/50 hover:border-gold transition-all">
                <Phone className="w-4 h-4 text-primary" />
                <div className="flex-1 text-start">
                  <div className="text-sm font-bold">اتصال مباشر</div>
                  <div className="text-[11px] text-muted-foreground">19000</div>
                </div>
              </a>
              <button className="w-full flex items-center gap-3 p-3 rounded-xl border bg-secondary/50 hover:border-gold transition-all">
                <MessageCircle className="w-4 h-4 text-primary" />
                <div className="flex-1 text-start">
                  <div className="text-sm font-bold">دردشة فورية</div>
                  <div className="text-[11px] text-muted-foreground">ابدأ محادثة مع فريق الدعم</div>
                </div>
              </button>
              <a href="mailto:support@rava.app" className="flex items-center gap-3 p-3 rounded-xl border bg-secondary/50 hover:border-gold transition-all">
                <Mail className="w-4 h-4 text-primary" />
                <div className="flex-1 text-start">
                  <div className="text-sm font-bold">البريد الإلكتروني</div>
                  <div className="text-[11px] text-muted-foreground">support@rava.app</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
