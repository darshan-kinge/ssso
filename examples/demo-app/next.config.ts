import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ssso/core", "@ssso/react", "@ssso/node"],
};

export default nextConfig;
