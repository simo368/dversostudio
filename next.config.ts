import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isPages
    ? {
      output: "export",
      basePath: "/dversostudio",
      images: { unoptimized: true },
    }
    : {}),
};

export default nextConfig;
