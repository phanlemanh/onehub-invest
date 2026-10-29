// node --test scripts/don-hex-tho.test.mjs
// Hồ sơ don-hex-tho: mã giao diện của app (design.surface_globs trừ vendor) không còn hex thô; 14 màu bản đồ sống ở
// app/src/lib/map-colors.ts với đúng giá trị đo trên 3936e3d0. Luật eslint no-hardcoded-color không bắt khoá paint
// MapLibre (fill-color, line-color) hay chuỗi mặt nạ, nên hàng này có thước riêng. Không cần DB.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "3936e3d0316293d55e6ddc5b68e2f82d4c91683a";
// Chép nguyên văn từ design-floor-s4.mjs (acceptance-gate 2.35.0); DHT-AC-1 (d) đối chiếu nguồn khi máy có kit.
const RE_HEX = /(?<![&\w])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?!\w)/g;
const KIT_S4 = path.join(homedir(), ".claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.35.0/scripts/design-floor-s4.mjs");
const SURFACE = ["app/src/app", "app/src/components"];
const VENDOR = ["ui", "reui", "blocks", "examples"].map((d) => `app/src/components/${d}/`);
const DUOI = /\.(tsx?|css)$/;

const doc = (rel) => readFileSync(path.join(REPO, rel), "utf8");
const git = (...args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8" });

/** Mỗi chỗ hex thô của một tệp: «tệp:dòng giá trị». */
export function quetHex(rel, text) {
  const ra = [];
  text.split("\n").forEach((dong, i) => {
    for (const m of dong.matchAll(RE_HEX)) ra.push(`${rel}:${i + 1} ${m[0]}`);
  });
  return ra;
}

function tepGiaoDien() {
  const ra = [];
  const di = (rel) => {
    for (const e of readdirSync(path.join(REPO, rel), { withFileTypes: true })) {
      const con = `${rel}/${e.name}`;
      if (e.isDirectory()) {
        if (!VENDOR.includes(`${con}/`)) di(con);
      } else if (DUOI.test(e.name)) ra.push(con);
    }
  };
  SURFACE.forEach(di);
  return ra;
}

// Danh sách đo sẵn trên 3936e3d0 (viết trước) — 15 chỗ ở 5 tệp.
const CU = {
  "app/src/components/finder/bins.ts": ["9 #bedbff", "9 #51a2ff", "9 #1447e6", "9 #1c398e", "10 #e2e8f0", "12 #3f3f46"],
  "app/src/components/finder/choropleth-map.tsx": ["121 #0a0a0a", "121 #ffffff"],
  "app/src/components/listing/listings-map.tsx": ["22 #18181b", "23 #ffffff", "24 #d4d4d8"],
  "app/src/components/mini-map.tsx": ["72 #2563eb", "72 #93c5fd", "83 #1e3a8a"],
  "app/src/components/ops/data-flow/flow-journey.tsx": ["20 #000"],
};

describe("DHT-AC-1 không còn hex thô trong mã giao diện ngoài vendor", () => {
  test("DHT-AC-1 (a) quét vùng giao diện trừ vendor → 0 chỗ", () => {
    const tep = tepGiaoDien();
    assert.ok(tep.length > 100, `bộ đi cây chỉ thấy ${tep.length} tệp — vùng quét hỏng`);
    assert.deepEqual(tep.flatMap((t) => quetHex(t, doc(t))), []);
  });

  test("DHT-AC-1 (b) đối chứng dương: năm tệp ở 3936e3d0 báo đúng 15 chỗ đo sẵn", () => {
    const thay = Object.keys(CU).flatMap((t) => quetHex(t, git("show", `${BASE}:${t}`)));
    const mong = Object.entries(CU).flatMap(([t, ds]) => ds.map((x) => `${t}:${x}`));
    assert.deepEqual(thay, mong);
    assert.equal(thay.length, 15);
  });

  test("DHT-AC-1 (c) chèn một hex vào bản sao mini-map.tsx → báo đúng tệp và dòng", () => {
    const t = "app/src/components/mini-map.tsx";
    const dong = doc(t).split("\n");
    dong.splice(5, 0, 'const SAI = "#123456";');
    assert.deepEqual(quetHex(t, dong.join("\n")), [`${t}:6 #123456`]);
  });

  test("DHT-AC-1 (d) regex của test trùng RE_HEX của design-floor S4 (kit 2.35.0)", (t) => {
    if (!existsSync(KIT_S4)) return t.skip("không có acceptance-gate 2.35.0 ở máy này — ca ghim regex chỉ chạy ở máy có kit");
    const m = readFileSync(KIT_S4, "utf8").match(/export const RE_HEX = \/(.+)\/g;/);
    assert.ok(m, "design-floor-s4.mjs không còn dòng «export const RE_HEX» — kit đổi khuôn, xem lại test");
    assert.equal(RE_HEX.source, m[1]);
  });
});

// Bảng AC-2 của hợp đồng (viết trước, đo trên 3936e3d0).
const BANG = [
  ["bậc 1", (c) => c.BIN_COLORS[0], "#bedbff"],
  ["bậc 2", (c) => c.BIN_COLORS[1], "#51a2ff"],
  ["bậc 3", (c) => c.BIN_COLORS[2], "#1447e6"],
  ["bậc 4", (c) => c.BIN_COLORS[3], "#1c398e"],
  ["ô chưa có số, nền sáng", (c) => c.NO_DATA_COLOR, "#e2e8f0"],
  ["ô chưa có số, nền tối", (c) => c.NO_DATA_COLOR_DARK, "#3f3f46"],
  ["viền khu vực, nền sáng", (c) => c.AREA_LINE.light, "#ffffff"],
  ["viền khu vực, nền tối", (c) => c.AREA_LINE.dark, "#0a0a0a"],
  ["nhãn giá — mực", (c) => c.LISTING_PIN.ink, "#18181b"],
  ["nhãn giá — nền", (c) => c.LISTING_PIN.paper, "#ffffff"],
  ["nhãn giá — viền", (c) => c.LISTING_PIN.edge, "#d4d4d8"],
  ["mini-map — phường đang xem", (c) => c.MINI_MAP.active, "#2563eb"],
  ["mini-map — phường khác", (c) => c.MINI_MAP.idle, "#93c5fd"],
  ["mini-map — viền", (c) => c.MINI_MAP.line, "#1e3a8a"],
];

const lechBang = (c, bang) => bang.filter(([, lay, hex]) => lay(c) !== hex).map(([vai]) => vai);

describe("DHT-AC-2 14 màu bản đồ ở lib/map-colors.ts giữ đúng giá trị cũ", () => {
  test("DHT-AC-2 mỗi tên vai mang đúng giá trị của bảng", async () => {
    const c = await import(pathToFileURL(path.join(REPO, "app/src/lib/map-colors.ts")).href);
    assert.equal(BANG.length, 14);
    for (const [vai, lay, hex] of BANG) assert.equal(lay(c), hex, `sai giá trị: ${vai}`);
  });

  test("DHT-AC-2 chiều đỏ: bảng đổi một giá trị → báo đúng tên vai đó", async () => {
    const c = await import(pathToFileURL(path.join(REPO, "app/src/lib/map-colors.ts")).href);
    const hong = BANG.map((r) => (r[0] === "nhãn giá — viền" ? [r[0], r[1], "#d4d4d9"] : r));
    assert.deepEqual(lechBang(c, hong), ["nhãn giá — viền"]);
  });
});

// Bảy neo chỗ dùng (viết trước, phủ 14 giá trị).
const NEO = [
  ["app/src/components/finder/bins.ts", "bins tái xuất ba hằng bậc", 'export { BIN_COLORS, NO_DATA_COLOR, NO_DATA_COLOR_DARK } from "@/lib/map-colors"'],
  ["app/src/components/finder/choropleth-map.tsx", "choropleth viền sáng/tối", '"line-color": isDark ? AREA_LINE.dark : AREA_LINE.light'],
  ["app/src/components/listing/listings-map.tsx", "nhãn giá mực", "const INK = LISTING_PIN.ink"],
  ["app/src/components/listing/listings-map.tsx", "nhãn giá nền", "const PAPER = LISTING_PIN.paper"],
  ["app/src/components/listing/listings-map.tsx", "nhãn giá viền", "const EDGE = LISTING_PIN.edge"],
  ["app/src/components/mini-map.tsx", "mini-map phường đang xem/khác", '"fill-color": ["case", ["get", "active"], MINI_MAP.active, MINI_MAP.idle]'],
  ["app/src/components/mini-map.tsx", "mini-map viền", '"line-color": MINI_MAP.line'],
];

/** Các neo thiếu trong bộ tệp `tep` (đường → nội dung). */
const neoThieu = (tep) => NEO.filter(([t, , neo]) => !tep[t].includes(neo)).map(([, ten]) => ten);
const tepThat = () => Object.fromEntries([...new Set(NEO.map(([t]) => t))].map((t) => [t, doc(t)]));

describe("DHT-AC-3 chỗ dùng trỏ đúng tên vai", () => {
  test("DHT-AC-3 bảy neo có mặt", () => {
    const tep = tepThat();
    for (const [t, ten, neo] of NEO) assert.ok(tep[t].includes(neo), `thiếu neo «${ten}» ở ${t}: ${neo}`);
  });

  const DOT_BIEN = [
    ["bins bỏ NO_DATA_COLOR_DARK", "app/src/components/finder/bins.ts", ", NO_DATA_COLOR_DARK }", " }", "bins tái xuất ba hằng bậc"],
    ["choropleth đảo dark/light", "app/src/components/finder/choropleth-map.tsx", "isDark ? AREA_LINE.dark : AREA_LINE.light", "isDark ? AREA_LINE.light : AREA_LINE.dark", "choropleth viền sáng/tối"],
    ["listings đảo ink/paper", "app/src/components/listing/listings-map.tsx", "const INK = LISTING_PIN.ink", "const INK = LISTING_PIN.paper", "nhãn giá mực"],
    ["mini-map đảo active/idle", "app/src/components/mini-map.tsx", "MINI_MAP.active, MINI_MAP.idle", "MINI_MAP.idle, MINI_MAP.active", "mini-map phường đang xem/khác"],
  ];
  for (const [ten, t, tu, thanh, neo] of DOT_BIEN) {
    test(`DHT-AC-3 chiều đỏ: ${ten} → đỏ ghim «${neo}»`, () => {
      const tep = tepThat();
      assert.ok(tep[t].includes(tu), `đột biến không áp được: ${t} không chứa «${tu}»`);
      tep[t] = tep[t].replace(tu, thanh);
      assert.deepEqual(neoThieu(tep), [neo]);
    });
  }
});

test("DHT-AC-4 mặt nạ quét của Sankey dùng black (cùng alpha với #000)", () => {
  const t = doc("app/src/components/ops/data-flow/flow-journey.tsx");
  assert.ok(t.includes('const SWEEP_MASK = "linear-gradient(to right, black 48%, transparent 52%)"'), "SWEEP_MASK không đúng chuỗi mong đợi");
});

const MAP_FILES_MONG = ["src/lib/map-style.ts", "src/lib/map-colors.ts"];

export function docMapFiles(eslintText) {
  const m = eslintText.match(/const MAP_FILES = \[([\s\S]*?)\];/);
  assert.ok(m, "eslint.config.mjs không còn «const MAP_FILES = [...]»");
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

export function docDanhSachSkill(skillText) {
  const i = skillText.indexOf("## Hex chỉ được dùng trong file bản đồ (danh sách đóng)");
  assert.ok(i >= 0, "SKILL.md mất mục «Hex chỉ được dùng trong file bản đồ (danh sách đóng)»");
  const muc = skillText.slice(i).split("\n## ")[0];
  return [...muc.matchAll(/^- `(src\/[^`]+)`$/gm)].map((x) => x[1]);
}

describe("DHT-AC-5 MAP_FILES chỉ còn tệp lib và SKILL.md khớp", () => {
  test("DHT-AC-5 MAP_FILES = [map-style.ts, map-colors.ts]", () => {
    assert.deepEqual(docMapFiles(doc("app/eslint.config.mjs")), MAP_FILES_MONG);
  });

  test("DHT-AC-5 danh sách đóng của SKILL.md bằng đúng MAP_FILES", () => {
    assert.deepEqual(docDanhSachSkill(doc(".claude/skills/onehub-ui/SKILL.md")), docMapFiles(doc("app/eslint.config.mjs")));
  });

  test("DHT-AC-5 chiều đỏ: SKILL.md thêm một tệp → lệch, gọi tên tệp thừa", () => {
    const s = doc(".claude/skills/onehub-ui/SKILL.md").replace("- `src/lib/map-colors.ts`", "- `src/lib/map-colors.ts`\n- `src/components/mini-map.tsx`");
    const thua = docDanhSachSkill(s).filter((x) => !MAP_FILES_MONG.includes(x));
    assert.deepEqual(thua, ["src/components/mini-map.tsx"]);
  });
});

// AC-8: chỉ tính commit không gộp của vòng (chạm tệp riêng của vòng) — commit sau vòng chỉ chạm vendor không bị tính.
const TEP_VONG = ["_acceptance/don-hex-tho/", "scripts/don-hex-tho.test.mjs", "app/src/lib/map-colors.ts"];
const laTepVong = (f) => TEP_VONG.some((p) => (p.endsWith("/") ? f.startsWith(p) : f === p));

export function vendorCuaVong(commits) {
  return commits.filter((c) => c.files.some(laTepVong)).flatMap((c) => c.files.filter((f) => VENDOR.some((v) => f.startsWith(v))));
}

describe("DHT-AC-8 vòng không đụng thư mục vendor", () => {
  test("DHT-AC-8 commit của vòng từ 3936e3d0 không đổi tệp vendor", () => {
    try {
      git("cat-file", "-e", `${BASE}^{commit}`);
    } catch {
      assert.fail("thiếu ref 3936e3d0 — checkout cần lịch sử đầy đủ (fetch-depth: 0)");
    }
    const shas = git("log", "--no-merges", "--format=%H", `${BASE}..HEAD`, "--", ...TEP_VONG).split("\n").filter(Boolean);
    const commits = shas.map((sha) => ({ sha, files: git("show", "--name-only", "--format=", sha).split("\n").filter(Boolean) }));
    assert.deepEqual(vendorCuaVong(commits), []);
  });

  test("DHT-AC-8 chiều đỏ và đối chứng: commit của vòng chạm vendor bị bắt, commit chỉ chạm vendor không tính", () => {
    const commits = [
      { sha: "a", files: ["app/src/lib/map-colors.ts", "app/src/components/ui/x.tsx"] },
      { sha: "b", files: ["app/src/components/reui/y.tsx"] },
    ];
    assert.deepEqual(vendorCuaVong(commits), ["app/src/components/ui/x.tsx"]);
  });
});
