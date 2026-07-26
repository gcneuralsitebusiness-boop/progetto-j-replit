/**
 * Progetto J Mobile — design tokens synced from the sibling web artifact.
 * The app is always dark (matches the web's dark-only palette).
 */

const darkPalette = {
  // Legacy aliases
  text: '#F5F0E8',
  tint: '#BA1C1C',

  // Core surfaces
  background: '#0a0a0a',
  foreground: '#F5F0E8',

  // Cards / elevated surfaces
  card: '#121212',
  cardForeground: '#F5F0E8',

  // Primary action — deep red from hsl(0 74% 42%)
  primary: '#BA1C1C',
  primaryForeground: '#F5F0E8',

  // Secondary / muted
  secondary: '#1a1a1a',
  secondaryForeground: '#8a8a8a',
  muted: '#1f1f1f',
  mutedForeground: '#8a8a8a',

  // Accent (same as primary for this brand)
  accent: '#BA1C1C',
  accentForeground: '#F5F0E8',

  // Destructive
  destructive: '#BA1C1C',
  destructiveForeground: '#F5F0E8',

  // Borders / inputs
  border: '#1a1a1a',
  input: '#242424',

  // Brand custom colors
  acid: '#39FF14',   // neon green — hsl(111 100% 54%)
  bronze: '#8B6914', // hsl(42 74% 31%)
};

const colors = {
  // Both light and dark use the dark palette — app is always dark-themed.
  light: darkPalette,
  dark: darkPalette,

  // --radius: 0rem → 0px (brutalist, no rounding)
  radius: 0,
};

export default colors;
