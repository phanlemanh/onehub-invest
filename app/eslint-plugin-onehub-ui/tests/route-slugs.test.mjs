// URL tiếng Anh toàn bộ (Mạnh chốt 2026-10-23, AGENTS.md › Quy ước): mỗi đoạn URL tĩnh của trang
// phải nằm trong "Slug URL" của CONTEXT.md. Route tiếng Việt đang chạy sống nhờ VIET_EXCEPTIONS có hạn;
// thêm route Việt mới thì test này đỏ.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkRouteSlugs, parseContextSlugs, parseRedirects, staticSegments } from "../lib/route-slugs.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, "..", "..");
const CONTEXT_MD = join(APP, "..", "CONTEXT.md");

// Route tiếng Việt còn chạy → slug đích. Đổi trong đợt dọn của nhóm trang, kèm redirect vĩnh viễn
// trong app/next.config.ts, rồi xoá dòng ở đây. Không thêm dòng mới: route mới phải tiếng Anh.
const VIET_EXCEPTIONS = [
  { segment: "phuong-phap", target: "methodology", until: "2026-12-31" },
  { segment: "dau-tu", target: "yield", until: "2026-12-31" },
];

const today = () => new Date().toISOString().slice(0, 10);

describe("slug URL của cây route thật", () => {
  it("mọi đoạn tĩnh nằm trong CONTEXT.md hoặc ngoại lệ còn hạn; slug cũ có redirect", () => {
    const { slugs, old } = parseContextSlugs(readFileSync(CONTEXT_MD, "utf8"));
    assert.ok(slugs.size > 0, "CONTEXT.md không có dòng `- Slug URL:` nào");
    const errors = checkRouteSlugs({
      segments: staticSegments(join(APP, "src", "app")),
      slugs,
      old,
      exceptions: VIET_EXCEPTIONS,
      redirects: parseRedirects(readFileSync(join(APP, "next.config.ts"), "utf8")),
      today: today(),
    });
    assert.deepEqual(errors, [], errors.join("\n"));
  });
});

describe("checkRouteSlugs", () => {
  const base = {
    slugs: new Set(["yield", "compare", "ops", "deals"]),
    old: [{ from: "so-sanh", to: "compare" }],
    exceptions: [{ segment: "so-sanh", target: "compare", until: "2026-12-31" }],
    redirects: [],
    today: "2026-10-23",
  };
  const seg = (...names) => names.map((s) => ({ segment: s, route: `/${s}` }));

  it("route tiếng Anh có trong CONTEXT.md: xanh", () => {
    assert.deepEqual(checkRouteSlugs({ ...base, segments: seg("yield", "so-sanh", "ops", "deals") }), []);
  });
  it("route tiếng Việt MỚI: đỏ, nêu đúng đoạn", () => {
    const errors = checkRouteSlugs({ ...base, segments: seg("yield", "so-sanh", "tim-kiem") });
    assert.equal(errors.length, 1);
    assert.match(errors[0], /"tim-kiem"/);
  });
  it("đoạn không phải ASCII kebab: đỏ", () => {
    const errors = checkRouteSlugs({ ...base, segments: seg("so-sanh", "Yield", "so_sanh") });
    assert.equal(errors.filter((e) => /kebab/.test(e)).length, 2);
  });
  it("ngoại lệ quá hạn: đỏ; đúng ngày hạn: chưa đỏ", () => {
    assert.match(checkRouteSlugs({ ...base, segments: seg("so-sanh"), today: "2027-01-01" })[0], /hết hạn/);
    assert.deepEqual(checkRouteSlugs({ ...base, segments: seg("so-sanh"), today: "2026-12-31" }), []);
  });
  it("đã đổi route nhưng thiếu redirect: đỏ", () => {
    const errors = checkRouteSlugs({ ...base, segments: seg("compare") });
    assert.ok(errors.some((e) => /thiếu redirect/.test(e)), errors.join("\n"));
  });
  it("đã đổi route, có redirect vĩnh viễn: chỉ còn nhắc xoá ngoại lệ", () => {
    const redirects = parseRedirects(`[{ source: "/so-sanh", destination: "/compare", permanent: true }]`);
    assert.deepEqual(checkRouteSlugs({ ...base, segments: seg("compare"), redirects }), [
      'ngoại lệ "so-sanh" đã đổi xong — xoá khỏi danh sách ngoại lệ',
    ]);
  });
  it("redirect tạm (permanent: false) không tính", () => {
    const redirects = parseRedirects(`[{ source: "/so-sanh", destination: "/compare", permanent: false }]`);
    const errors = checkRouteSlugs({ ...base, exceptions: [], segments: seg("compare"), redirects });
    assert.ok(errors.some((e) => /thiếu redirect/.test(e)), errors.join("\n"));
  });
  it("slug cũ đã đổi, đã xoá ngoại lệ, còn redirect 301: xanh", () => {
    const redirects = parseRedirects(`[{ source: "/so-sanh", destination: "/compare", statusCode: 301 }]`);
    assert.deepEqual(checkRouteSlugs({ ...base, exceptions: [], segments: seg("compare"), redirects }), []);
  });
  it("ngoại lệ trỏ slug đích chưa có trong CONTEXT.md: đỏ", () => {
    const exceptions = [{ segment: "so-sanh", target: "comparison", until: "2026-12-31" }];
    const errors = checkRouteSlugs({ ...base, exceptions, segments: seg("so-sanh") });
    assert.ok(errors.some((e) => /"comparison" chưa có/.test(e)), errors.join("\n"));
  });
});

describe("parseContextSlugs", () => {
  it("đọc Slug URL và Slug cũ, bỏ chữ ngoài backtick", () => {
    const md = [
      "**So sánh**: Đặt 2–4 khu vực cạnh nhau.",
      "- Code: `compare` · RESO: —",
      "- Slug URL: `compare`",
      "- Slug cũ: `so-sanh` → `compare`",
      "- Slug URL: `listings` · `listing`",
    ].join("\n");
    const { slugs, old } = parseContextSlugs(md);
    assert.deepEqual([...slugs].sort(), ["compare", "listing", "listings"]);
    assert.deepEqual(old, [{ from: "so-sanh", to: "compare" }]);
  });
});
