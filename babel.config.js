module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo adds the react-native-worklets (Reanimated) plugin
    // automatically — listing it here too would run it twice.
    presets: ["babel-preset-expo"],
  };
};
