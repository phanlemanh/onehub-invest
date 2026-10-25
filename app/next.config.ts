import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /deals rời Invest sang Ops (SPL tầng A) — giữ link cũ, proxy.ts chặn tiếp /ops.
      { source: "/deals", destination: "/ops/deals", permanent: false },
      // Đổi slug sang tiếng Anh (CONTEXT.md «Slug cũ»): 301 vĩnh viễn, query (?areas=…) đi theo.
      // `statusCode: 301` thay vì `permanent: true` (308) — link cũ và công cụ tìm kiếm hiểu 301.
      { source: "/so-sanh", destination: "/compare", statusCode: 301 },
      { source: "/phuong-phap", destination: "/methodology", statusCode: 301 },
      // Mô phỏng đầu tư gộp vào Ước tính lợi suất (mục «Dòng tiền vốn vay»): area = mã thị trường, nhảy tới #financing.
      { source: "/:country/:market/dau-tu", destination: "/yield?area=:country-:market#financing", statusCode: 301 },
    ];
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
