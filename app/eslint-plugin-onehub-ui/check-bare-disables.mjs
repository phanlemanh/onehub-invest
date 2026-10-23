#!/usr/bin/env node
// Bổ sung cho luật `onehub-ui/require-disable-reason`: ESLint tự nuốt báo cáo của luật này ở hai dạng directive
// (eslint-disable trần che luôn báo cáo của chính nó; directive nêu đích danh `onehub-ui/require-disable-reason`
// tắt luôn luật), nên luật không thể tự bắt. Script này quét văn bản thô, chạy sau `eslint` trong `npm run lint`.
//
// Bắt hai dạng (trong chú thích `//` và `/* */`):
//   (a) `eslint-disable` / `eslint-disable-line` / `eslint-disable-next-line` TRẦN, không nêu luật nào;
//   (b) directive nêu `onehub-ui/require-disable-reason` mà thiếu ` -- <lý do>`.
//
// Phạm vi: app/src/**/*.{ts,tsx}, trừ src/components/{ui,reui,blocks,examples}/** (vendor).
// Thoát 0 và im lặng khi sạch; thoát 1 và in `file:dòng: thông báo` khi có vi phạm.

import { readdirSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Cùng quy ước với luật require-disable-reason.
const DIRECTIVE = /^\s*eslint-disable(?:-next-line|-line)?(?=\s|$)/;
const SEPARATOR = /\s-{2,}\s/;
const SELF_RULE = "onehub-ui/require-disable-reason";
const COMMENT = /\/\/([^\n]*)|\/\*([\s\S]*?)\*\//g;

const MSG_BARE =
  "Directive eslint-disable trần (không nêu luật): hãy ghi rõ luật, ví dụ `eslint-disable-next-line <luật> -- <lý do>`.";
const MSG_SELF =
  "Ngoại lệ cho onehub-ui/require-disable-reason phải kèm lý do sau ` -- `: `eslint-disable-next-line onehub-ui/require-disable-reason -- <lý do>`.";

/** @returns {Array<{line: number, message: string}>} */
export function findBareDisables(fileText) {
  const found = [];
  COMMENT.lastIndex = 0;
  for (const match of fileText.matchAll(COMMENT)) {
    const body = match[1] ?? match[2];
    const directive = DIRECTIVE.exec(body);
    if (!directive) continue;

    const rest = body.slice(directive[0].length);
    const sep = SEPARATOR.exec(rest);
    const list = sep ? rest.slice(0, sep.index) : rest;
    const reason = sep ? rest.slice(sep.index + sep[0].length).trim() : "";
    const rules = list.split(",").map((r) => r.trim()).filter(Boolean);

    // Dòng của dấu mở chú thích (không tính dòng của directive nằm sau xuống dòng trong /* */ — hiếm).
    const line = fileText.slice(0, match.index).split("\n").length;
    if (rules.length === 0) found.push({ line, message: MSG_BARE });
    else if (rules.includes(SELF_RULE) && !reason) found.push({ line, message: MSG_SELF });
  }
  return found;
}

const VENDOR = ["ui", "reui", "blocks", "examples"].map((d) => join("components", d) + sep);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) yield full;
  }
}

/** Quét src/ của app; trả về mảng `{file, line, message}` (file tương đối so với appDir). */
export function scanSrc(appDir) {
  const srcDir = join(appDir, "src");
  const out = [];
  for (const file of walk(srcDir)) {
    const relToSrc = relative(srcDir, file);
    if (VENDOR.some((v) => relToSrc.startsWith(v))) continue;
    for (const v of findBareDisables(readFileSync(file, "utf8"))) {
      out.push({ file: relative(appDir, file), ...v });
    }
  }
  return out;
}

// realpath: macOS đổi /var -> /private/var nên so thẳng argv[1] với import.meta.url sẽ lệch.
if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) {
  const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
  const violations = scanSrc(appDir);
  for (const v of violations) console.log(`${v.file}:${v.line}: ${v.message}`);
  process.exit(violations.length ? 1 : 0);
}
