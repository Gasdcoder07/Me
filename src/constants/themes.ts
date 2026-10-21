import { StyleSheet, type ViewStyle } from 'react-native';

// Two independent choices. Appearance (light or dark) applies to every color theme.
// A color theme changes only the accent colors. Everything else is neutral, so each theme is Niebla with another accent.
export type Appearance = 'light' | 'dark';
export type ColorThemeId = 'niebla' | 'esmeralda' | 'anil' | 'rosa' | 'ruby';

export type Palette = {
  background: string;
  canvas: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  // Focus blocks. Black in Niebla; in the other themes, a deep shade of the accent.
  focus: string;
  focusText: string;
  // Primary surfaces: the active tab, solid buttons and the selected option of a toggle.
  accent: string;
  // Text and icons drawn on top of the accent.
  onAccent: string;
  // Highlights: item badges and icons. Niebla's highlight is amber.
  highlight: string;
  // Text and icons drawn on top of the highlight.
  onHighlight: string;
  coral: string;
  // Fill behind calendar chips.
  chip: string;
  // Blobs of the animated glow behind dark panels.
  lava: readonly [string, string, string, string];
  // Whether the canvas is light or dark. Frosted glass takes its tint from this.
  appearance: Appearance;
  // Status bar style over the canvas, and while the Time screen's dark panel is on top.
  statusBar: 'dark' | 'light';
  statusBarOnFocus: 'dark' | 'light';
};

type Neutrals = Omit<Palette, 'accent' | 'onAccent' | 'highlight' | 'onHighlight'>;

// Light is the original Niebla palette. Dark keeps the same roles: focus blocks are a raised charcoal,
// text is a soft off-white with a muted secondary tone, and the glow is kept subdued so it never competes with text.
const neutrals: Record<Appearance, Neutrals> = {
  light: {
    background: '#808080',
    canvas: '#e9eef3',
    ink: '#0a0a0a',
    inkMuted: '#8f8b84',
    inkFaint: '#c9c5bc',
    focus: '#0a0a0a',
    focusText: '#f2efe8',
    coral: '#f26b5b',
    chip: '#e2ddd3',
    lava: ['#2c2c2c', '#3a3a3a', '#1d1d1d', '#4a4a4a'],
    appearance: 'light',
    statusBar: 'dark',
    statusBarOnFocus: 'light',
  },
  dark: {
    background: '#06070a',
    canvas: '#0c0d10',
    ink: '#e4e6ea',
    inkMuted: '#9aa1ab',
    inkFaint: '#353b45',
    focus: '#272c35',
    focusText: '#eceef2',
    coral: '#f47a6c',
    chip: '#2b3038',
    lava: ['#2a303b', '#313845', '#20252e', '#3a4150'],
    appearance: 'dark',
    statusBar: 'light',
    statusBarOnFocus: 'light',
  },
};

type Accent = Pick<Palette, 'accent' | 'onAccent' | 'highlight' | 'onHighlight'>;

// Each color theme in each appearance. Niebla's primary is the neutral focus (black in light, so the original
// look is kept). In dark, Niebla's primary is inverted to light, so solid controls keep their contrast.
// The other themes use their color for both the primary surfaces and the highlights, and their focus blocks
// and glow are tinted from it (see tintedSurface).
const accents: Record<ColorThemeId, Record<Appearance, Accent>> = {
  niebla: {
    light: { accent: '#0a0a0a', onAccent: '#f2efe8', highlight: '#f2a33a', onHighlight: '#0a0a0a' },
    dark: { accent: '#e4e6ea', onAccent: '#0c0d10', highlight: '#f5b35c', onHighlight: '#0c0d10' },
  },
  esmeralda: {
    light: { accent: '#2fbf8a', onAccent: '#06140e', highlight: '#2fbf8a', onHighlight: '#06140e' },
    dark: { accent: '#3ddba0', onAccent: '#06140e', highlight: '#3ddba0', onHighlight: '#06140e' },
  },
  anil: {
    light: { accent: '#4f5bd5', onAccent: '#ffffff', highlight: '#4f5bd5', onHighlight: '#ffffff' },
    dark: { accent: '#8c95ff', onAccent: '#0c0d18', highlight: '#8c95ff', onHighlight: '#0c0d18' },
  },
  rosa: {
    light: { accent: '#f4b6c8', onAccent: '#2a0f18', highlight: '#f4b6c8', onHighlight: '#2a0f18' },
    dark: { accent: '#f0a9bd', onAccent: '#2a0f18', highlight: '#f0a9bd', onHighlight: '#2a0f18' },
  },
  ruby: {
    light: { accent: '#c8244f', onAccent: '#ffffff', highlight: '#c8244f', onHighlight: '#ffffff' },
    dark: { accent: '#ff5a7a', onAccent: '#1a0508', highlight: '#ff5a7a', onHighlight: '#1a0508' },
  },
};

export const COLOR_THEME_IDS = Object.keys(accents) as ColorThemeId[];
export const APPEARANCES: readonly Appearance[] = ['light', 'dark'];

export const DEFAULT_COLOR_THEME: ColorThemeId = 'niebla';
export const DEFAULT_APPEARANCE: Appearance = 'light';

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return typeof value === 'string' && (COLOR_THEME_IDS as string[]).includes(value);
}

export function isAppearance(value: unknown): value is Appearance {
  return value === 'light' || value === 'dark';
}

// The focus block of a color theme is the accent pushed toward black, so the theme's color is the main color of
// the screen. Its glow is the accent blended into that block, in four tones for the four blobs.
// Niebla keeps its neutral focus and grey glow, so the original look does not change.
function tintedSurface(accent: string): Pick<Palette, 'focus' | 'lava'> {
  const focus = mixHex(accent, '#000000', 0.6);
  return {
    focus,
    lava: [
      mixHex(focus, accent, 0.45),
      mixHex(focus, accent, 0.6),
      mixHex(focus, accent, 0.3),
      mixHex(focus, accent, 0.8),
    ],
  };
}

export function buildPalette(theme: ColorThemeId, appearance: Appearance): Palette {
  const palette = { ...neutrals[appearance], ...accents[theme][appearance] };
  return theme === 'niebla' ? palette : { ...palette, ...tintedSurface(palette.accent) };
}

// Dim layer behind modals and sheets. Black in every theme, so it dims any canvas the same way.
export const SCRIM = '#0a0a0a';

// Red, green and blue channels (0 to 255) of a 6-digit hex token.
function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// Blend of two hex tokens: t = 0 gives `from`, t = 1 gives `to`.
function mixHex(from: string, to: string, t: number): string {
  const start = channels(from);
  const end = channels(to);
  const hex = start.map((channel, i) => Math.round(channel + (end[i] - channel) * t).toString(16).padStart(2, '0'));
  return `#${hex.join('')}`;
}

// Translucent version of a 6-digit hex token. Glass, fades and tints are derived from the tokens this way,
// so they change with the theme instead of being hard-coded.
export function withAlpha(hex: string, alpha: number): string {
  const [red, green, blue] = channels(hex);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

// Translucent chip on a focus block: a faint tint of the focus text with a hairline edge.
export function glassOnFocus(palette: Palette): ViewStyle {
  return {
    backgroundColor: withAlpha(palette.focusText, 0.1),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withAlpha(palette.focusText, 0.25),
  };
}

// CSS variable names for NativeWind, one per color token in src/global.css.
export function cssVars(palette: Palette): Record<`--color-${string}`, string> {
  return {
    '--color-background': palette.background,
    '--color-canvas': palette.canvas,
    '--color-ink': palette.ink,
    '--color-ink-muted': palette.inkMuted,
    '--color-ink-faint': palette.inkFaint,
    '--color-focus': palette.focus,
    '--color-focus-text': palette.focusText,
    '--color-accent': palette.accent,
    '--color-on-accent': palette.onAccent,
    '--color-highlight': palette.highlight,
    '--color-on-highlight': palette.onHighlight,
    '--color-coral': palette.coral,
    '--color-chip': palette.chip,
  };
}
