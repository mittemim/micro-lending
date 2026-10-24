import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["sqlite3"],
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
