import { useEffect, useState } from "react";
import { MapPin, Navigation } from "lucide-react";

export function MiniMap({ label, active = true }: { label?: string; active?: boolean }) {
  const [pos, setPos] = useState(10);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setPos((p) => (p >= 85 ? 10 : p + 2)), 600);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className="relative h-44 rounded-xl overflow-hidden bg-secondary/40 map-grid border border-[color-mix(in_oklab,var(--color-gold)_25%,transparent)]">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="route" x1="0" x2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-gold)" />
          </linearGradient>
        </defs>
        <path d="M 8 50 Q 30 10 50 30 T 92 12" fill="none" stroke="url(#route)" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
      <div className="absolute" style={{ left: "8%", bottom: "16%" }}>
        <div className="w-3 h-3 rounded-full bg-success ring-4 ring-success/30" />
      </div>
      <div className="absolute" style={{ right: "8%", top: "12%" }}>
        <MapPin className="w-5 h-5 text-gold" />
      </div>
      {active && (
        <div className="absolute transition-all duration-500" style={{ left: `${pos}%`, top: `${50 - pos * 0.4}%` }}>
          <div className="relative">
            <div className="absolute inset-0 rounded-full pulse-ring" />
            <div className="w-6 h-6 rounded-full bg-gradient-royal grid place-items-center shadow-elegant">
              <Navigation className="w-3 h-3 text-primary-foreground" />
            </div>
          </div>
        </div>
      )}
      {label && (
        <div className="absolute bottom-2 start-2 text-[10px] px-2 py-1 rounded-md glass font-semibold text-gold">
          {label}
        </div>
      )}
    </div>
  );
}
