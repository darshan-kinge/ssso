import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@oneauth/core", "@oneauth/react", "@oneauth/node"],
};

export default nextConfig;
