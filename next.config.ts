import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "bcrypt"],
  experimental: {
    serverActions: {
      bodySizeLimit: "64mb",
    },
  },
};

export default nextConfig;
