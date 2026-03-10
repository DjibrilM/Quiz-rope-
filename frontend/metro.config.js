const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve the shared package outside the project root
const sharedPath = path.resolve(__dirname, "../shared");
config.watchFolders = [sharedPath];
config.resolver.extraNodeModules = {
  "@shared": path.resolve(sharedPath, "src"),
  // Force a single Three.js instance so @react-three/fiber and direct imports share the same copy
  "three": path.resolve(__dirname, "node_modules/three"),
};

module.exports = withNativeWind(config, { input: "./src/styles/global.css" });
