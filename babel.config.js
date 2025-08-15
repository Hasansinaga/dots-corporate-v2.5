module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ['module:react-native-dotenv', { moduleName: '@env', path: '.env', allowUndefined: true }],
      ['module-resolver', { root: ['./'], alias: { '@': './src' }, extensions: ['.ts','.tsx','.js','.jsx','.json'] }],
      'react-native-reanimated/plugin', 
    ],
  };
};
