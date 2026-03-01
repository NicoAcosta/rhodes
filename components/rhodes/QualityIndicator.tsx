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
    glow = "0 0 6px var(--led), 0 0 12px rgba(74, 222, 128, 0.3)";
    title = "HD Samples";
  } else if (tier === "t1") {
    color = "var(--led)";
    glow = "0 0 3px rgba(74, 222, 128, 0.3)";
    title = "Samples loaded";
  } else if (isLoading) {
    color = "var(--accent)";
    glow = "0 0 4px var(--accent)";
    className = "led-pulse";
    title = "Loading samples…";
  } else {
    color = "#555";
    title = "FM synthesis";
  }

  return (
    <div
      className={className}
      title={title}
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        backgroundColor: color,
        boxShadow: glow,
        flexShrink: 0,
      }}
    />
  );
}
