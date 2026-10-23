// Bản đồ route của skill onehub-ui phải khớp đúng tập page.tsx thật: thêm/xoá/dời
// trang mà quên sửa .claude/skills/onehub-ui/routes.md thì test này đỏ.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_DIR = join(HERE, "..", "..", "src", "app");
const ROUTES_MD = join(HERE, "..", "..", "..", ".claude", "skills", "onehub-ui", "routes.md");

/** Mọi page.tsx dưới src/app, đường dẫn tương đối, phân cách "/". */
function pageFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(full));
    else if (entry.name === "page.tsx") out.push(relative(APP_DIR, full).split(sep).join("/"));
  }
  return out;
}

/** Cột 2 của mọi dòng bảng có ô đầu dạng `/…` (bỏ dòng tiêu đề và dòng kẻ). */
function mappedFiles(markdown) {
  const out = [];
  for (const line of markdown.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 2 || !/^`\//.test(cells[0])) continue;
    const m = /^`([^`]+)`$/.exec(cells[1]);
    assert.ok(m, `routes.md: cột 2 phải là một đường dẫn trong backtick — dòng: ${line}`);
    out.push(m[1]);
  }
  return out;
}

/** Các dòng route (ô đầu dạng `/…`) dưới dạng { tên cột → ô }, theo dòng tiêu đề bắt đầu bằng "Route". */
function routeRows(markdown) {
  let header = null;
  const out = [];
  for (const line of markdown.split("\n")) {
    if (!line.trimStart().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells[0] === "Route") header = cells;
    else if (header && /^`\//.test(cells[0])) {
      out.push({ line, row: Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""])) });
    }
  }
  return { header, rows: out };
}

describe("routes.md của skill onehub-ui", () => {
  it("mọi route có cột Block đích: tên block trong backtick, `chờ (…)`, hoặc `—` cho redirect", () => {
    const { header, rows } = routeRows(readFileSync(ROUTES_MD, "utf8"));
    assert.ok(header?.includes("Block đích"), "routes.md: bảng route thiếu cột 'Block đích'");
    assert.ok(rows.length > 0, "routes.md: không đọc được dòng route nào");
    const bad = rows.filter(({ row }) => {
      const value = row["Block đích"];
      if (row["Bề mặt"] === "redirect") return value !== "—";
      return !(/^chờ \(.+\)$/.test(value) || /`[^`]+`/.test(value));
    });
    assert.equal(
      bad.length,
      0,
      `Dòng thiếu/sai Block đích (cần \`tên-block\`, "chờ (lý do)", hoặc "—" khi redirect):\n  ${bad
        .map(({ row }) => `${row.Route} → "${row["Block đích"]}"`)
        .join("\n  ")}`,
    );
  });

  it("mọi route có cột Slug đích: `giữ` hoặc đường dẫn tiếng Anh trong backtick", () => {
    const { header, rows } = routeRows(readFileSync(ROUTES_MD, "utf8"));
    assert.ok(header?.includes("Slug đích"), "routes.md: bảng route thiếu cột 'Slug đích'");
    const bad = rows.filter(({ row }) => {
      const value = row["Slug đích"];
      if (value === "giữ") return false;
      const m = /^`(\/[^`]*)`/.exec(value);
      // Đoạn URL đích không mang dấu tiếng Việt (slug địa lý là biến <market>, [id]…)
      return !m || /[^\x20-\x7e]/.test(m[1]);
    });
    assert.equal(
      bad.length,
      0,
      `Dòng thiếu/sai Slug đích (cần "giữ" hoặc \`/duong-dan-tieng-anh\`):\n  ${bad
        .map(({ row }) => `${row.Route} → "${row["Slug đích"]}"`)
        .join("\n  ")}`,
    );
  });

  it("phủ đúng mọi page.tsx dưới app/src/app (không thiếu, không thừa, không trùng)", () => {
    assert.ok(existsSync(ROUTES_MD), `thiếu ${ROUTES_MD}`);
    const fromFiles = pageFiles(APP_DIR).sort();
    const fromMap = mappedFiles(readFileSync(ROUTES_MD, "utf8")).sort();

    const dupes = fromMap.filter((f, i) => fromMap.indexOf(f) !== i);
    const missing = fromFiles.filter((f) => !fromMap.includes(f));
    const extra = fromMap.filter((f) => !fromFiles.includes(f));
    const report = [
      missing.length ? `Thiếu trong routes.md (thêm dòng):\n  ${missing.join("\n  ")}` : "",
      extra.length ? `Thừa trong routes.md (không còn page.tsx):\n  ${extra.join("\n  ")}` : "",
      dupes.length ? `Trùng trong routes.md:\n  ${dupes.join("\n  ")}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    assert.equal(dupes.length, 0, report);
    assert.deepEqual(new Set(fromFiles), new Set(fromMap), report);
  });
});
