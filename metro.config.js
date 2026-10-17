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

module.exports = withNativewind(config);
