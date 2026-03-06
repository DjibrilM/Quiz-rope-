const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve the shared package outside the project root
const sharedPath = path.resolve(__dirname, "../shared");
config.watchFolders = [sharedPath];
config.resolver.extraNodeModules = {
  "@shared": path.resolve(sharedPath, "src"),
};

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });
