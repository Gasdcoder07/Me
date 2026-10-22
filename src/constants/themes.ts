import { StyleSheet, type ViewStyle } from 'react-native';

// Two independent choices. Appearance (light or dark) applies to every color theme.
// A color theme sets the canvas, the text, the focus blocks, the accent and the glow, all taken from its FigCraft design.
// The page background, chips, coral and the status bar are shared by every theme.
export type Appearance = 'light' | 'dark';
export type ColorThemeId = 'niebla' | 'esmeralda' | 'anil' | 'rosa' | 'ruby' | 'morado';

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
  // Highlights: item badges and icons.
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

type Accent = Pick<
  Palette,
  'canvas' | 'ink' | 'inkMuted' | 'inkFaint' | 'focus' | 'focusText' | 'accent' | 'onAccent' | 'highlight' | 'onHighlight' | 'lava'
>;

type Neutrals = Omit<Palette, keyof Accent>;

// Shared by every color theme. Dark keeps the same roles: text is a soft off-white with a muted secondary tone.
const neutrals: Record<Appearance, Neutrals> = {
  light: {
    background: '#808080',
    coral: '#f26b5b',
    chip: '#e2ddd3',
    appearance: 'light',
    statusBar: 'dark',
    statusBarOnFocus: 'light',
  },
  dark: {
    background: '#06070a',
    coral: '#d98a80',
    chip: '#1e2025',
    appearance: 'dark',
    statusBar: 'light',
    statusBarOnFocus: 'light',
  },
};

// Each color theme in each appearance, from the FigCraft designs (left column light, right column dark).
// canvas is the screen; focus is the large block; accent is the active tab; highlight is the badge.
// lava is the glow, all tints of the highlight: never darker than it in the dark appearance. The light appearance mutes it 25% toward black, so the glow does not smudge the light UI.
const accents: Record<ColorThemeId, Record<Appearance, Accent>> = {
  niebla: {
    light: {
      canvas: '#e8eef3',
      ink: '#000000',
      inkMuted: '#000000',
      inkFaint: '#e3e3e3',
      focus: '#000000',
      focusText: '#ffffff',
      accent: '#000000',
      onAccent: '#ffffff',
      highlight: '#474747',
      onHighlight: '#ffffff',
      lava: ['#4d4d4d', '#3e3e3e', '#606060', '#606060'],
    },
    dark: {
      canvas: '#000000',
      ink: '#ffffff',
      inkMuted: '#bababa',
      inkFaint: '#101010',
      focus: '#101010',
      focusText: '#ffffff',
      accent: '#101010',
      onAccent: '#ffffff',
      highlight: '#474747',
      onHighlight: '#ffffff',
      lava: ['#666666', '#535353', '#808080', '#808080'],
    },
  },
  esmeralda: {
    light: {
      canvas: '#e8eef3',
      ink: '#000000',
      inkMuted: '#000000',
      inkFaint: '#e3e3e3',
      focus: '#295654',
      focusText: '#ffffff',
      accent: '#295654',
      onAccent: '#ffffff',
      highlight: '#6eb5b3',
      onHighlight: '#ffffff',
      lava: ['#659190', '#598c8a', '#749998', '#749998'],
    },
    dark: {
      canvas: '#041e1d',
      ink: '#ffffff',
      inkMuted: '#bababa',
      inkFaint: '#295654',
      focus: '#295654',
      focusText: '#ffffff',
      accent: '#295654',
      onAccent: '#ffffff',
      highlight: '#6eb5b3',
      onHighlight: '#ffffff',
      lava: ['#87c1c0', '#77bab8', '#9bcccb', '#9bcccb'],
    },
  },
  anil: {
    light: {
      canvas: '#e8eef3',
      ink: '#000000',
      inkMuted: '#000000',
      inkFaint: '#e3e3e3',
      focus: '#18398a',
      focusText: '#ffffff',
      accent: '#18398a',
      onAccent: '#ffffff',
      highlight: '#5d7abf',
      onHighlight: '#ffffff',
      lava: ['#5a6d98', '#4d6292', '#6b7a9e', '#6b7a9e'],
    },
    dark: {
      canvas: '#101420',
      ink: '#ffffff',
      inkMuted: '#9a9a9a',
      inkFaint: '#1b2950',
      focus: '#1b2950',
      focusText: '#ffffff',
      accent: '#18398a',
      onAccent: '#ffffff',
      highlight: '#4a5988',
      onHighlight: '#ffffff',
      lava: ['#68759c', '#556490', '#828cad', '#828cad'],
    },
  },
  rosa: {
    light: {
      canvas: '#e8eef3',
      ink: '#6b6b6b',
      inkMuted: '#6b6b6b',
      inkFaint: '#e3e3e3',
      focus: '#ff92c7',
      focusText: '#ffffff',
      accent: '#ff92c7',
      onAccent: '#ffffff',
      highlight: '#ebd3df',
      onHighlight: '#ffffff',
      lava: ['#b3a4ac', '#b1a1a9', '#b5a8af', '#b5a8af'],
    },
    dark: {
      canvas: '#380a20',
      ink: '#000000',
      inkMuted: '#ebd3df',
      inkFaint: '#631a3d',
      focus: '#631a3d',
      focusText: '#ffffff',
      accent: '#631a3d',
      onAccent: '#ffffff',
      highlight: '#c7769e',
      onHighlight: '#ffffff',
      lava: ['#d08daf', '#cb7fa4', '#d9a0bc', '#d9a0bc'],
    },
  },
  ruby: {
    light: {
      canvas: '#e8eef3',
      ink: '#000000',
      inkMuted: '#000000',
      inkFaint: '#e3e3e3',
      focus: '#9e2626',
      focusText: '#ffffff',
      accent: '#9e2626',
      onAccent: '#ffffff',
      highlight: '#e79494',
      onHighlight: '#ffffff',
      lava: ['#b07d7d', '#af7474', '#b38888', '#b38888'],
    },
    dark: {
      canvas: '#270303',
      ink: '#ffffff',
      inkMuted: '#ebd3df',
      inkFaint: '#500d0d',
      focus: '#500d0d',
      focusText: '#ffffff',
      accent: '#500d0d',
      onAccent: '#ffffff',
      highlight: '#9e2626',
      onHighlight: '#ffffff',
      lava: ['#af4b4b', '#a43434', '#bc6969', '#bc6969'],
    },
  },
  morado: {
    light: {
      canvas: '#e8eef3',
      ink: '#000000',
      inkMuted: '#000000',
      inkFaint: '#e3e3e3',
      focus: '#4b146e',
      focusText: '#ffffff',
      accent: '#4b146e',
      onAccent: '#ffffff',
      highlight: '#8141aa',
      onHighlight: '#ffffff',
      lava: ['#714a8b', '#673a83', '#7e5d93', '#7e5d93'],
    },
    dark: {
      canvas: '#1a0527',
      ink: '#000000',
      inkMuted: '#ebd3df',
      inkFaint: '#341548',
      focus: '#341548',
      focusText: '#ffffff',
      accent: '#4b146e',
      onAccent: '#ffffff',
      highlight: '#653c80',
      onHighlight: '#ffffff',
      lava: ['#7f5d95', '#6f4888', '#9578a7', '#9578a7'],
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
