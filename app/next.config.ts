import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /deals rời Invest sang Ops (SPL tầng A) — giữ link cũ, proxy.ts chặn tiếp /ops.
  async redirects() {
    return [{ source: "/deals", destination: "/ops/deals", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
