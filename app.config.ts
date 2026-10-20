import type { ConfigContext, ExpoConfig } from "expo/config";

export default function configure({ config }: ConfigContext): ExpoConfig {
  const base: ExpoConfig = {
    ...config,
    name: config.name ?? "Laundry Driver",
    slug: config.slug ?? "LaundryDriver",
  };
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  if (!apiKey) return base;
  return {
    ...base,
    android: {
      ...base.android,
      config: { ...base.android?.config, googleMaps: { apiKey } },
    },
  };
}
