import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import onehubUi from "./eslint-plugin-onehub-ui/index.mjs";

// Bốn thư mục vendor (ui = shadcn, reui, blocks, examples): cài nguyên bản, không sửa tay, không bị luật onehub-ui quét.
// reui + blocks đã nằm trong globalIgnores bên dưới; ui + examples vẫn được lint bằng bộ luật Next như cũ.
const VENDOR_DIRS = [
  "src/components/ui/**",
  "src/components/reui/**",
  "src/components/blocks/**",
  "src/components/examples/**",
];

// File bản đồ: được phép dùng hex (màu dữ liệu/nền bản đồ). Chỉ tắt đúng luật màu, các luật khác vẫn chạy.
const MAP_FILES = [
  "src/lib/map-style.ts",
  "src/components/finder/bins.ts",
  "src/components/finder/choropleth-map.tsx",
  "src/components/mini-map.tsx",
  "src/components/listing/listings-map.tsx",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Chuẩn UI ReUI: chỉ áp cho src/**. KHÔNG áp cho eslint-plugin-onehub-ui/** (test của plugin chứa mẫu cấm có chủ đích).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: VENDOR_DIRS,
    plugins: { "onehub-ui": onehubUi },
    rules: {
      "onehub-ui/no-raw-table": "error",
      "onehub-ui/no-raw-controls": "error",
      "onehub-ui/no-native-dialogs": "error",
      "onehub-ui/no-raw-palette": "error",
      "onehub-ui/no-hardcoded-color": "error",
      "onehub-ui/no-arbitrary-text-size": "error",
      "onehub-ui/no-banned-motion": "error",
      "onehub-ui/no-aschild": "error",
      "onehub-ui/no-emoji-icons": "error",
      "onehub-ui/require-disable-reason": "error",
    },
  },
  {
    files: MAP_FILES,
    rules: { "onehub-ui/no-hardcoded-color": "off" },
  },
  // Plugin cục bộ: export default dạng object-literal là chuẩn của ESLint plugin, không phải lỗi.
  {
    files: ["eslint-plugin-onehub-ui/**/*.mjs"],
    rules: { "import/no-anonymous-default-export": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Code vendor ReUI — cài nguyên bản qua shadcn CLI, quy ước KHÔNG sửa (xem .claude/skills/onehub-ui/SKILL.md, mục "Không đụng vendor").
    "src/components/reui/**",
    "src/components/blocks/**",
    // Bản sao nguyên văn maplibre-gl/dist (đã minify), xem lib/map-worker.ts.
    "public/maplibre-gl-worker.mjs",
  ]),
]);

export default eslintConfig;
