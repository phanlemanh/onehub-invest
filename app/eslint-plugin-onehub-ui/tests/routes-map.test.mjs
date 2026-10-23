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

describe("routes.md của skill onehub-ui", () => {
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
