import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/erpreview",
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
