import { useEffect, useRef } from "react";

export function AlertOverlay() {
  const audioRef = useRef<{ ctx: AudioContext | null; osc: OscillatorNode | null; gain: GainNode | null }>({ ctx: null, osc: null, gain: null });
  useEffect(() => {
    // Synth a soft repeating beep (no asset needed). User must interact once for audio to start in some browsers.
    let stopped = false;
    const start = () => {
      if (audioRef.current.ctx) return;
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx: AudioContext = new Ctx();
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(ctx.destination);
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = 880;
        osc.connect(gain);
        osc.start();
        audioRef.current = { ctx, osc, gain };
        const loop = () => {
          if (stopped) return;
          const now = ctx.currentTime;
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
          setTimeout(loop, 900);
        };
        loop();
      } catch {}
    };
    const onClick = () => start();
    window.addEventListener("pointerdown", onClick, { once: true });
    start();
    return () => {
      stopped = true;
      window.removeEventListener("pointerdown", onClick);
      const { ctx, osc } = audioRef.current;
      try { osc?.stop(); ctx?.close(); } catch {}
      audioRef.current = { ctx: null, osc: null, gain: null };
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-30 mix-blend-overlay flash-alert" aria-hidden="true" />
  );
}
