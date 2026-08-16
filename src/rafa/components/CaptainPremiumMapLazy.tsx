import { lazy, Suspense } from "react";
import type { CaptainMapProps } from "./CaptainPremiumMap";

const Inner = lazy(() => import("./CaptainPremiumMap").then((m) => ({ default: m.CaptainPremiumMap })));

export function CaptainPremiumMap(props: CaptainMapProps) {
  const fallback = <div className="absolute inset-0 bg-neutral-900 animate-pulse" />;
  if (typeof window === "undefined") return fallback;
  return (
    <Suspense fallback={fallback}>
      <Inner {...props} />
    </Suspense>
  );
}
