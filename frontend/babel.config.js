const path = require("path");

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@shared": path.resolve(__dirname, "../shared/src"),
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  };
};
