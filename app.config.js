module.exports = {
  expo: {
    name: "Equinox",
    slug: "equinox",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0A",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      package: "com.equinox.psx",
      adaptiveIcon: {
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundColor: "#0A0A0A",
      },
      permissions: ["INTERNET"],
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: ["expo-secure-store", "expo-font"],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      vercelApiUrl: process.env.EXPO_PUBLIC_VERCEL_API_URL,
      eas: {
        projectId: "c1bcaf90-eff0-416e-9ab0-7101fa63c7a2",
      },
    },
  },
};
