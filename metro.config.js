const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable inline requires: defers module loading until first use (faster startup)
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Exclude platform-specific files not needed for Android production
config.resolver = {
  ...config.resolver,
  // Explicitly block web-only modules from being resolved in native builds
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;
