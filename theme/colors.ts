// Aurora Glow v2 — Design System Color Tokens
// Ref: 03-DESIGN-SYSTEM.md

export const colors = {
  // Backgrounds — a top-to-bottom violet gradient, never flat black
  bgTop: "#170B2E",
  bgMid: "#2B1354",
  bgBottom: "#4B2079",

  surface: "rgba(255,255,255,0.06)", // glass card fill
  surfaceBorder: "rgba(255,255,255,0.12)", // glass card hairline
  surfaceElevated: "rgba(255,255,255,0.10)",

  label: "#FFFFFF",
  secondaryLabel: "#B9A9D9",
  tertiaryLabel: "#8471A8",

  accentStart: "#8A3FFC", // violet
  accentEnd: "#E23FD6", // magenta/pink glow
  accentSolid: "#9B4DFF",

  chipInactiveBorder: "rgba(255,255,255,0.18)",
  chipInactiveBg: "rgba(255,255,255,0.04)",

  danger: "#FF5C7A",
};

export const gradients = {
  background: ["#170B2E", "#2B1354", "#4B2079"] as const,
  primary: ["#8A3FFC", "#E23FD6"] as const, // buttons, active chip, FAB, progress
  forYouCard: ["#7B2FF7", "#B23FE0", "#FF6FD8"] as const,
  nowPlayingGlow: [
    "rgba(138,63,252,0.55)",
    "rgba(0,0,0,0)",
  ] as const,
  nowPlayingOverlay: [
    "transparent",
    "rgba(15,6,32,0.95)",
  ] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  pill: 9999,
};
