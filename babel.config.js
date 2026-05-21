module.exports = function(api) {
  api.cache(true);
  
  const plugins = ["react-native-reanimated/plugin"];
  
  // Remove console.log in production/release builds
  // Checks both NODE_ENV and BABEL_ENV since Metro may set either
  const isProduction = process.env.NODE_ENV === 'production' || process.env.BABEL_ENV === 'production';
  if (isProduction) {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins: plugins,
  };
};
