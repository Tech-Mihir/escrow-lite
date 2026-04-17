import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
      os: false,
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "sodium-native": false,
        "require-addon": false,
      };
    }

    return config;
  },
};

export default nextConfig;
