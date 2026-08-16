import { lazy, Suspense } from "react";
import type { LiveMapProps } from "./LiveMap";

const LiveMapInner = lazy(() => import("./LiveMap").then((m) => ({ default: m.LiveMap })));

export function LiveMap(props: LiveMapProps) {
  if (typeof window === "undefined") {
    return <div style={{ height: props.height ?? 220 }} className="rounded-xl bg-secondary/40 border border-gold/30 animate-pulse" />;
  }
  return (
    <Suspense fallback={<div style={{ height: props.height ?? 220 }} className="rounded-xl bg-secondary/40 border border-gold/30 animate-pulse" />}>
      <LiveMapInner {...props} />
    </Suspense>
  );
}