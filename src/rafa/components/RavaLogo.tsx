import { cn } from "@/lib/utils";

export function RavaLogo({ size = 44, withWord = true }: { size?: number; withWord?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2.5">
      <div
        className="relative rounded-2xl grid place-items-center shadow-royal ring-1 ring-[color-mix(in_oklab,var(--color-gold)_55%,transparent)]"
        style={{
          width: size, height: size,
          background: "linear-gradient(135deg, #034a27 0%, #046A38 55%, #023420 100%)",
        }}
      >
        <span className="absolute inset-0 rounded-2xl shimmer opacity-40 pointer-events-none" />
        <span
          className="text-gold-3d relative"
          style={{ fontSize: size * 0.36, lineHeight: 1, fontFamily: "Georgia, serif", letterSpacing: "0.02em" }}
        >
          R<span style={{ opacity: 0.92 }}>A</span>
        </span>
      </div>
      {withWord && (
        <div className="leading-tight">
          <div className={cn("font-black text-gold-3d", "tracking-[0.18em]")} style={{ fontSize: size * 0.34 }}>RAVA</div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Super App</div>
        </div>
      )}
    </div>
  );
}
