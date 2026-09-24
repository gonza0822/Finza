import type { CapacitorConfig } from "@capacitor/cli";
import appConfig from "./capacitor/app-config.json";

const appUrl = appConfig.appUrl;
const host = new URL(appUrl).hostname;

const config: CapacitorConfig = {
  appId: "app.finza.mobile",
  appName: "Finza",
  webDir: "capacitor/www",
  server: {
    url: appUrl,
    androidScheme: "https",
    allowNavigation: [
      host,
      "accounts.google.com",
      "*.google.com",
      "*.googleapis.com",
      "*.gstatic.com",
    ],
  },
  android: {
    overrideUserAgent:
      "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
  },
  ios: {
    overrideUserAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  },
};

export default config;
