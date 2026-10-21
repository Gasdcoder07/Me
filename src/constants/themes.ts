import { StyleSheet, type ViewStyle } from 'react-native';

// Two independent choices. Appearance (light or dark) applies to every color theme.
// A color theme sets the accent colors, the focus blocks and the glow. The neutrals (canvas, text, chips) are the same in every theme.
export type Appearance = 'light' | 'dark';
export type ColorThemeId = 'niebla' | 'esmeralda' | 'anil' | 'rosa' | 'ruby';

export type Palette = {
  background: string;
  canvas: string;
  ink: string;
  inkMuted: string;
  inkFaint: string;
  // Focus blocks. Each color theme sets its own in each appearance (see `accents`).
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

type Neutrals = Omit<Palette, 'focus' | 'accent' | 'onAccent' | 'highlight' | 'onHighlight' | 'lava'>;

// Light is the original Niebla palette. Dark keeps the same roles: text is a soft off-white with a muted secondary tone.
const neutrals: Record<Appearance, Neutrals> = {
  light: {
    background: '#808080',
    canvas: '#e9eef3',
    ink: '#0a0a0a',
    inkMuted: '#8f8b84',
    inkFaint: '#c9c5bc',
    focusText: '#f2efe8',
    coral: '#f26b5b',
    chip: '#e2ddd3',
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
    focusText: '#eceef2',
    coral: '#f47a6c',
    chip: '#2b3038',
    appearance: 'dark',
    statusBar: 'light',
    statusBarOnFocus: 'light',
  },
};

type Accent = Pick<Palette, 'focus' | 'accent' | 'onAccent' | 'highlight' | 'onHighlight' | 'lava'>;

// Each color theme in each appearance: its focus blocks, its glow and its accent roles. The accent is a mid tone
// of the glow, so the primary surfaces stay sober. The highlights keep the brighter color: Niebla's is amber.
// In light, the darkest glow tone is lifted above the focus block, so it never reads as a dark hole in the panel.
const accents: Record<ColorThemeId, Record<Appearance, Accent>> = {
  niebla: {
    light: {
      focus: '#0a0a0a',
      accent: '#44403c',
      onAccent: '#ffffff',
      highlight: '#f59e0b',
      onHighlight: '#000000',
      lava: ['#1c1917', '#292524', '#272727', '#44403c'],
    },
    dark: {
      focus: '#272c35',
      accent: '#57534e',
      onAccent: '#ffffff',
      highlight: '#fbbf24',
      onHighlight: '#000000',
      lava: ['#292524', '#44403c', '#1c1917', '#57534e'],
    },
  },
  esmeralda: {
    light: {
      focus: '#064e3b',
      accent: '#059669',
      onAccent: '#000000',
      highlight: '#10b981',
      onHighlight: '#022c22',
      lava: ['#064e3b', '#047857', '#246353', '#059669'],
    },
    dark: {
      focus: '#065f46',
      accent: '#059669',
      onAccent: '#000000',
      highlight: '#34d399',
      onHighlight: '#022c22',
      lava: ['#065f46', '#059669', '#064e3b', '#10b981'],
    },
  },
  anil: {
    light: {
      focus: '#1e3a8a',
      accent: '#312e81',
      onAccent: '#ffffff',
      highlight: '#6366f1',
      onHighlight: '#ffffff',
      lava: ['#172554', '#1e3a8a', '#395298', '#312e81'],
    },
    dark: {
      focus: '#1e40af',
      accent: '#3730a3',
      onAccent: '#ffffff',
      highlight: '#818cf8',
      onHighlight: '#0b1120',
      lava: ['#1e3a8a', '#1e40af', '#172554', '#3730a3'],
    },
  },
  rosa: {
    light: {
      focus: '#881337',
      accent: '#9f1239',
      onAccent: '#ffffff',
      highlight: '#f43f5e',
      onHighlight: '#ffffff',
      lava: ['#4c0519', '#881337', '#962f4f', '#9f1239'],
    },
    dark: {
      focus: '#9f1239',
      accent: '#be123c',
      onAccent: '#ffffff',
      highlight: '#fb7185',
      onHighlight: '#2a0f18',
      lava: ['#881337', '#9f1239', '#4c0519', '#be123c'],
    },
  },
  ruby: {
    light: {
      focus: '#7f1d1d',
      accent: '#991b1b',
      onAccent: '#ffffff',
      highlight: '#e11d48',
      onHighlight: '#ffffff',
      lava: ['#450a0a', '#7f1d1d', '#8e3838', '#991b1b'],
    },
    dark: {
      focus: '#991b1b',
      accent: '#b91c1c',
      onAccent: '#ffffff',
      highlight: '#f43f5e',
      onHighlight: '#1a0508',
      lava: ['#7f1d1d', '#991b1b', '#450a0a', '#b91c1c'],
    },
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

export function buildPalette(theme: ColorThemeId, appearance: Appearance): Palette {
  return { ...neutrals[appearance], ...accents[theme][appearance] };
}

// Dim layer behind modals and sheets. Black in every theme, so it dims any canvas the same way.
export const SCRIM = '#0a0a0a';

// Red, green and blue channels (0 to 255) of a 6-digit hex token.
function channels(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
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
