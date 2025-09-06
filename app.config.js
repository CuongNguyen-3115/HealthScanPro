export default {
  expo: {
    name: "my-expo-app",
    slug: "my-expo-app",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "myexpoapp",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-splash-screen",
      "expo-barcode-scanner"
    ]
  }
};
