import { lazy, Suspense } from "react";
import type { TrackedCaptain } from "./CaptainTrackingMap";

const Inner = lazy(() =>
  import("./CaptainTrackingMap").then((m) => ({ default: m.CaptainTrackingMap })),
);

export function CaptainTrackingMap(props: { captains: TrackedCaptain[]; height?: number }) {
  const fallback = (
    <div
      style={{ height: props.height ?? 420 }}
      className="rounded-2xl bg-secondary/40 border border-gold/30 animate-pulse"
    />
  );
  if (typeof window === "undefined") return fallback;
  return (
    <Suspense fallback={fallback}>
      <Inner {...props} />
    </Suspense>
  );
}
