#!/usr/bin/env node
// Rào hồi quy TĨNH cho GET /api/v1/deals đang tạm đóng (hồ sơ deals-api-tam-dong, AC-5): route phải
// `if (!(await canCallOpsApi(req, getSessionUser))) return NextResponse.json({ error: "unauthorized" },
// { status: 401 })` TRƯỚC lời gọi pool.query đầu tiên. Đo quan hệ (cổng-có-await-trả-401-đứng-trước-truy-vấn),
// không đo chữ có mặt: dòng import bị bỏ trước khi tìm.
//   node scripts/check-deals-api.mjs static    — đo route thật (exit 0 = đạt, 1 = trượt)
//   node scripts/check-deals-api.mjs mutation  — bản nguyên phải ĐẠT, bốn bản đột biến phải TRƯỢT đúng thông điệp
// check-portal-compliance.mjs gọi checkDealsRoute trên cây thật (làn ghim lại).
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEALS_GUARD_MSG = "deals: cổng ops (canCallOpsApi) chạy trước pool.query";
const ROUTE = "app/src/app/api/v1/deals/route.ts";

const GUARD =
  /if \(!\(await canCallOpsApi\(req, getSessionUser\)\)\)\s*\{?\s*return NextResponse\.json\(\{ error: "unauthorized" \}, \{ status: 401 \}\)/;

// Bỏ comment (khối + dòng) và mọi dòng import — chỉ đo mã chạy.
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.replace(/(^|[^:"'`])\/\/.*$/, "$1"))
    .filter((l) => !/^\s*import\s/.test(l))
    .join("\n");

export function checkDealsRoute(src) {
  const s = strip(src);
  const guard = s.match(GUARD);
  const query = s.indexOf("pool.query(");
  const ok = !!guard && query >= 0 && guard.index < query;
  return { ok, msg: DEALS_GUARD_MSG };
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readRoute = () => (existsSync(path.join(root, ROUTE)) ? readFileSync(path.join(root, ROUTE), "utf8") : "");

// Bốn đột biến dựng từ mã thật. Trả null khi chuỗi gốc không có — đột biến không áp được là TRƯỢT có tên.
const BLOCK = /\n[ \t]*if \(!\(await canCallOpsApi\(req, getSessionUser\)\)\) \{\n[^\n]*\n[ \t]*\}\n/;
export const MUTANTS = {
  "bỏ cổng (giữ dòng import)": (src) => (BLOCK.test(src) ? src.replace(BLOCK, "\n") : null),
  "cổng sau truy vấn": (src) => {
    const m = src.match(BLOCK);
    const q = src.indexOf("const { rows } = await pool.query(");
    const end = q >= 0 ? src.indexOf(");\n", q) : -1;
    if (!m || end < 0) return null;
    const without = src.replace(BLOCK, "\n");
    const at = without.indexOf(");\n", without.indexOf("const { rows } = await pool.query(")) + 3;
    return without.slice(0, at) + m[0].slice(1) + without.slice(at);
  },
  "gọi cổng không await": (src) =>
    src.includes("if (!(await canCallOpsApi(")
      ? src.replace("if (!(await canCallOpsApi(req, getSessionUser)))", "if (!canCallOpsApi(req, getSessionUser))")
      : null,
  "gọi cổng mà không return 401": (src) =>
    src.includes('return NextResponse.json({ error: "unauthorized" }, { status: 401 });')
      ? src.replace('return NextResponse.json({ error: "unauthorized" }, { status: 401 });', 'console.warn("unauthorized");')
      : null,
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const mode = process.argv[2] ?? "static";
  const fails = [];
  const check = (ok, msg) => {
    console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
    if (!ok) fails.push(msg);
  };
  const src = readRoute();
  if (mode === "static") {
    check(src.length > 0, `có tệp ${ROUTE}`);
    const r = checkDealsRoute(src);
    check(r.ok, r.msg);
  } else if (mode === "mutation") {
    const base = checkDealsRoute(src);
    check(base.ok, `bản nguyên ĐẠT — ${base.msg}`);
    for (const [name, mutate] of Object.entries(MUTANTS)) {
      const m = mutate(src);
      if (m === null) {
        check(false, `đột biến «${name}» không áp được lên route hiện tại`);
        continue;
      }
      const r = checkDealsRoute(m);
      check(!r.ok && r.msg === DEALS_GUARD_MSG, `đột biến «${name}» TRƯỢT với «${r.msg}»`);
    }
  } else {
    console.error(`chế độ lạ: ${mode} (static | mutation)`);
    process.exit(2);
  }
  console.log(fails.length === 0 ? `\ndeals-api ${mode}: ĐẠT` : `\ndeals-api ${mode}: ${fails.length} lỗi`);
  process.exit(fails.length === 0 ? 0 : 1);
}
