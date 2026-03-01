import type { SampleTier } from "@/lib/audio/samples/sample-manager";

interface QualityIndicatorProps {
  tier: SampleTier;
}

export function QualityIndicator({ tier }: QualityIndicatorProps) {
  const isLoading = tier === "loading-t1" || tier === "loading-t2";

  let color: string;
  let glow: string | undefined;
  let className = "";
  let title: string;

  if (tier === "t2") {
    color = "var(--led)";
    glow = "0 0 6px var(--led), 0 0 12px var(--accent-glow)";
    title = "HD Samples";
  } else if (tier === "t1") {
    color = "var(--led)";
    glow = "0 0 3px var(--accent-glow)";
    title = "Samples loaded";
  } else if (isLoading) {
    color = "var(--led)";
    glow = "0 0 4px var(--led)";
    className = "led-pulse";
    title = "Loading samples\u2026";
  } else {
    color = "var(--led-off)";
    title = "FM synthesis";
  }

  return (
    <div
      className={className}
      title={title}
      style={{
        width: 7,
        height: 7,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: glow,
        flexShrink: 0,
      }}
    />
  );
}
