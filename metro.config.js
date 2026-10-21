const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Expo ships with inlineRequires off, so every module runs at launch. Turning it on defers each module
// until its first use, which shortens startup. Expo's own options are kept and only this flag changes.
const getExpoTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const options = await getExpoTransformOptions(...args);
  return { ...options, transform: { ...options.transform, inlineRequires: true } };
};

// Color tokens stay as variables in the bundle, so ThemeProvider can override them at runtime.
// Without this list, NativeWind would inline the Niebla values and the theme switch would do nothing.
const THEME_COLOR_VARIABLES = [
  '--color-background',
  '--color-canvas',
  '--color-ink',
  '--color-ink-muted',
  '--color-ink-faint',
  '--color-focus',
  '--color-focus-text',
  '--color-accent',
  '--color-on-accent',
  '--color-highlight',
  '--color-on-highlight',
  '--color-coral',
  '--color-chip',
];

module.exports = withNativewind(config, {
  inlineVariables: { exclude: THEME_COLOR_VARIABLES },
});
