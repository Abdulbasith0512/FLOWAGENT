export interface Swatch {
  key: string;
  label: string;
  token: string;
}

export const COLOR_LABELS: Swatch[] = [
  { key: "accent", label: "Accent", token: "var(--color-accent)" },
  { key: "ok", label: "Green", token: "var(--color-ok)" },
  { key: "run", label: "Blue", token: "var(--color-run)" },
  { key: "err", label: "Red", token: "var(--color-err)" },
  { key: "muted", label: "Gray", token: "var(--color-fg-muted)" },
];

export const NOTE_COLORS: Swatch[] = [
  { key: "amber", label: "Amber", token: "var(--color-accent-tint)" },
  { key: "green", label: "Green", token: "color-mix(in oklch, var(--color-ok) 22%, var(--color-surface))" },
  { key: "blue", label: "Blue", token: "color-mix(in oklch, var(--color-run) 22%, var(--color-surface))" },
  { key: "red", label: "Red", token: "color-mix(in oklch, var(--color-err) 20%, var(--color-surface))" },
  { key: "neutral", label: "Neutral", token: "var(--color-surface-2)" },
];

export function colorToken(swatches: Swatch[], key: string | undefined): string | undefined {
  return swatches.find((s) => s.key === key)?.token;
}
