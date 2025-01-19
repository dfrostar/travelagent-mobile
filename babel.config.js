module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      }],
      process.env.NODE_ENV === 'test' && '@babel/plugin-transform-runtime',
      'react-native-reanimated/plugin',
    ].filter(Boolean),
    env: {
      test: {
        plugins: [
          '@babel/plugin-transform-modules-commonjs',
        ],
      },
    },
  };
};
