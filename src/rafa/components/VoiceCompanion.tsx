import { useEffect, useState } from "react";
import { Volume2, VolumeX, PartyPopper, X } from "lucide-react";
import { useEgyptianVoice } from "../hooks/useEgyptianVoice";
import { detectOccasion, shouldGreet, syncProfile, topInterests } from "../occasions";
import { useI18n } from "../i18n";

export type VoiceRole = "customer" | "merchant" | "captain" | "partner" | "admin" | "medical";

/** Warm, comedic Egyptian companion lines — one pack per role. */
const WELCOME: Record<VoiceRole, string> = {
  customer: "أهلاً بيك يا فندم في رافا، اطلب براحتك واحنا في الخدمة، ومتقلقش السواق جاي زي الصاروخ",
  merchant: "أهلاً يا معلم، المحل فاتح والرزق جاي، شد حيلك والطلبات هتولع النهاردة",
  captain: "يا هلا بالكابتن، شد الخوذة وهات من الآخر، والسلامة أهم من أي طلب",
  partner: "أهلاً يا باشا شريك المنطقة، النطاق بتاعك تحت السيطرة، خلينا نكبّر الشغل",
  admin: "أهلاً بحضرتك في غرفة التحكم، كل حاجة تحت عينك، والدنيا ماشية زي الساعة",
  medical: "أهلاً دكتور، المرضى في انتظار لمستك، ربنا يجعل على إيدك الشفا",
};

const IDLE: Record<VoiceRole, string> = {
  customer: "لو محتاج حاجة أنا هنا، وبلاش تفكير كتير الأكل هيبرد",
  merchant: "بص على المخزون بسرعة، أحسن الزباين متزعلش منك",
  captain: "خد نفس وشرب مية، الطريق طويل وانت جامد",
  partner: "طمّن على الكباتن بتوعك، كلمة حلوة بتعمل معجزات",
  admin: "كله تمام، بس بص على التقارير علشان محدش يجيبها في ودانك",
  medical: "لسه في حجوزات مستنية، خد راحتك وشوفهم واحد واحد",
};

export function VoiceCompanion({ role }: { role: VoiceRole }) {
  const { lang } = useI18n();
  const { enabled, toggle, play } = useEgyptianVoice();
  const [greeting, setGreeting] = useState<{ ar: string; en: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Silent profile: syncs with the database when signed in, local cache otherwise.
  useEffect(() => {
    void syncProfile();
    const occasion = detectOccasion();
    const timer = window.setTimeout(() => {
      if (occasion && shouldGreet(occasion)) {
        setGreeting({ ar: occasion.ar, en: occasion.en });
        void play(occasion.voiceAr);
      } else {
        void play(WELCOME[role]);
      }
    }, 900);
    return () => window.clearTimeout(timer);
  }, [role, play]);

  // Re-sync whenever the session changes (sign-in on another device, refresh…).
  useEffect(() => {
    let active = true;
    let unsub: (() => void) | undefined;
    void (async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      if (!active) return;
      const { data } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "USER_UPDATED") void syncProfile();
      });
      unsub = () => data.subscription.unsubscribe();
    })();
    return () => { active = false; unsub?.(); };
  }, []);


  // Gentle comedic nudge based on silently inferred interests.
  useEffect(() => {
    const t = window.setInterval(() => {
      const interests = topInterests(1);
      setHint(interests[0] ?? null);
      void play(IDLE[role]);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, [role, play]);

  return (
    <>
      {greeting && (
        <div className="fixed top-20 inset-x-3 z-[60] mx-auto max-w-md rounded-2xl border-2 border-gold/60 bg-card/95 backdrop-blur-md px-4 py-3 shadow-elegant flex items-start gap-3">
          <PartyPopper className="w-5 h-5 text-gold shrink-0 mt-0.5" />
          <div className="text-sm font-bold flex-1">{lang === "ar" ? greeting.ar : greeting.en}</div>
          <button onClick={() => setGreeting(null)} aria-label="close" className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <button
        onClick={() => { toggle(); if (!enabled) void play(WELCOME[role]); }}
        title={enabled ? (lang === "ar" ? "إيقاف الصوت الودود" : "Mute companion") : (lang === "ar" ? "تشغيل الصوت الودود" : "Unmute companion")}
        className="fixed bottom-4 start-4 z-[55] w-12 h-12 rounded-full bg-gradient-royal text-primary-foreground shadow-royal ring-2 ring-gold grid place-items-center"
      >
        {enabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>

      {hint && (
        <div className="sr-only" aria-live="polite">{hint}</div>
      )}
    </>
  );
}
