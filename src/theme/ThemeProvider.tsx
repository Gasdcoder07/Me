import Storage from 'expo-sqlite/kv-store';
import { VariableContextProvider } from 'nativewind';
import { createContext, type ReactNode, useCallback, useContext, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { duration, easing, timing } from '@/constants/motion';
import {
  type Appearance,
  buildPalette,
  type ColorThemeId,
  cssVars,
  DEFAULT_APPEARANCE,
  DEFAULT_COLOR_THEME,
  isAppearance,
  isColorThemeId,
  type Palette,
} from '@/constants/themes';

const THEME_STORAGE_KEY = 'theme';
const APPEARANCE_STORAGE_KEY = 'appearance';

type ThemeContextValue = {
  colorTheme: ColorThemeId;
  appearance: Appearance;
  colors: Palette;
  setColorTheme: (colorTheme: ColorThemeId) => void;
  setAppearance: (appearance: Appearance) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Synchronous reads, so the saved choices are already applied on the first frame, before anything is drawn.
// A missing or unknown value falls back to the default, and a failed read never blocks the app.
function readStored<T>(key: string, isValid: (value: unknown) => value is T, fallback: T): T {
  try {
    const stored = Storage.getItemSync(key);
    return isValid(stored) ? stored : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string) {
  try {
    Storage.setItemSync(key, value);
  } catch {
    // Not saved, but the choice still applies for this session.
  }
}

// Owns the active palette, persists both choices, and feeds the CSS variables that className tokens read.
// Placed above everything, so the splash screens and the database wait are themed too.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ColorThemeId>(() =>
    readStored(THEME_STORAGE_KEY, isColorThemeId, DEFAULT_COLOR_THEME),
  );
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    readStored(APPEARANCE_STORAGE_KEY, isAppearance, DEFAULT_APPEARANCE),
  );
  // The palette being left: its canvas covers the screen and fades out, so either change reads as a smooth wash
  // rather than a hard cut. `key` makes every change a new transition, even back to the same canvas.
  const [transition, setTransition] = useState<{ canvas: string; key: number } | null>(null);
  const washOpacity = useSharedValue(0);
  const colors = useMemo(() => buildPalette(colorTheme, appearance), [colorTheme, appearance]);

  const startWash = useCallback(() => {
    setTransition((current) => ({ canvas: colors.canvas, key: (current?.key ?? 0) + 1 }));
  }, [colors.canvas]);

  const setColorTheme = useCallback(
    (next: ColorThemeId) => {
      if (next === colorTheme) return;
      startWash();
      setColorThemeState(next);
      writeStored(THEME_STORAGE_KEY, next);
    },
    [colorTheme, startWash],
  );

  const setAppearance = useCallback(
    (next: Appearance) => {
      if (next === appearance) return;
      startWash();
      setAppearanceState(next);
      writeStored(APPEARANCE_STORAGE_KEY, next);
    },
    [appearance, startWash],
  );

  // Layout effect: the wash is set before the new palette is painted, so there is no frame of it without the wash.
  useLayoutEffect(() => {
    if (!transition) return;
    washOpacity.value = 1;
    washOpacity.value = withTiming(0, timing(duration.slow, easing.inOut));
  }, [transition, washOpacity]);

  const variables = useMemo(() => cssVars(colors), [colors]);
  const value = useMemo(
    () => ({ colorTheme, appearance, colors, setColorTheme, setAppearance }),
    [colorTheme, appearance, colors, setColorTheme, setAppearance],
  );
  const washStyle = useAnimatedStyle(() => ({ opacity: washOpacity.value }));

  return (
    <ThemeContext.Provider value={value}>
      <VariableContextProvider value={variables}>
        {children}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: transition?.canvas }, washStyle]}
        />
      </VariableContextProvider>
    </ThemeContext.Provider>
  );
}

// Palette for JS-side styling (SVG, shadows, gradients, props NativeWind does not style), plus the setters.
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
