import type { SampleTier } from "@/lib/audio/samples/sample-manager";

interface QualityIndicatorProps {
  tier: SampleTier;
}

export function QualityIndicator({ tier }: QualityIndicatorProps) {
  const isLoading = tier === "loading-t1" || tier === "loading-t2";
  const isSampled = tier === "t1" || tier === "t2" || isLoading;

  return (
    <div className="flex items-center gap-1 text-[10px] tracking-wider font-medium uppercase">
      {isSampled ? (
        <span
          className={
            tier === "t2"
              ? "text-accent"
              : isLoading
                ? "text-chrome/60 animate-pulse"
                : "text-chrome/80"
          }
        >
          HD
        </span>
      ) : (
        <span className="text-chrome/40">FM</span>
      )}
    </div>
  );
}
