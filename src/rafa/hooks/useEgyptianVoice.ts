import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { speakEgyptian } from "@/lib/voice.functions";

const STORAGE_KEY = "rafa.voice.enabled";
const CACHE = new Map<string, string>(); // text -> data URI

/** Preset Egyptian phrases — comedic, warm, morale-boosting */
export const VOICE_LINES = {
  welcome: "أهلاً يا نجم، ربنا يبارك في رزقك النهاردة، انت جاهز والدنيا كلها معاك",
  shiftStart: "يالا يا بطل، الوردية بدأت، شد الخوذة وهات من الآخر",
  newOrder: "طلب جديد يا معلم، شد حيلك واقبل بسرعة",
  accepted: "تمام يا فنان، خد راحتك في الطريق والسلامة أهم حاجة",
  nearPickup: "قربت على نقطة الاستلام، خلي بالك من الشارع",
  nearDrop: "فاضل شوية وتخلّص، انت جامد والله",
  delivered: "برافو عليك، الفلوس نزلت المحفظة، ربنا يزيدك",
  sos: "طمّني يا كبير، فريق الدعم في الطريق ليك، خد نفسك",
  breakHint: "بقالك ساعتين شغل، خد استراحة عشرة دقايق شاي وترجع أقوى",
} as const;

export type VoiceLine = keyof typeof VOICE_LINES;

export function useEgyptianVoice() {
  const speakFn = useServerFn(speakEgyptian);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "1";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    }
    if (!enabled && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [enabled]);

  const play = useCallback(async (text: string) => {
    if (!enabled || !text) return;
    try {
      let src = CACHE.get(text);
      if (!src) {
        const { audio, mime } = await speakFn({ data: { text } });
        src = `data:${mime};base64,${audio}`;
        CACHE.set(text, src);
      }
      if (audioRef.current) audioRef.current.pause();
      const a = new Audio(src);
      audioRef.current = a;
      a.volume = 0.9;
      await a.play().catch(() => {
        /* browser autoplay: needs user gesture. Ignore silently. */
      });
    } catch {
      /* fail silent — voice is decorative */
    }
  }, [enabled, speakFn]);

  const speak = useCallback((line: VoiceLine) => play(VOICE_LINES[line]), [play]);

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, speak, play };
}
