import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@xenova/transformers': require.resolve('@xenova/transformers'),
    };
    return config;
  },
};

export default nextConfig;
