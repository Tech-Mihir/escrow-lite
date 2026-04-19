import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      path: false,
      os: false,
      "sodium-native": false,
      "require-addon": false,
    };

    config.resolve.alias = {
      ...config.resolve.alias,
      "sodium-native": false,
      "require-addon": false,
    };

    // Suppress critical dependency warnings from stellar-sdk
    config.ignoreWarnings = [
      { module: /node_modules\/require-addon/ },
      { module: /node_modules\/sodium-native/ },
      /Critical dependency/,
    ];

    return config;
  },
};

export default nextConfig;
