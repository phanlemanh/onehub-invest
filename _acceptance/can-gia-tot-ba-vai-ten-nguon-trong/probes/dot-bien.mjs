#!/usr/bin/env node
// dot-bien.mjs AC-n — chạy ca AC-n trên mã thật (phải xanh), rồi trên từng bản đột biến chép ra thư mục tạm (phải đỏ, thông điệp ghim).
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const GOC = path.join(import.meta.dirname, "../../..");
const HELPER = path.join(GOC, "scripts/can-gia-tot-ba-vai-ten-nguon.mjs");
const SCRIPT = path.join(GOC, "scripts/can-gia-tot-ba-vai.mjs");
const AC = process.argv[2];
if (!/^AC-\d+$/.test(AC ?? "")) { console.error("dùng: dot-bien.mjs AC-n"); process.exit(2); }

/** [AC, tên, tệp gốc (helper|script), chuỗi tìm, chuỗi thay, thông điệp ghim] */
const DB = [
  ["AC-1", "bỏ lọc dòng không tên", "helper", ".filter((t) => t.length > 0);", ";", /dòng NULL: ra \[""\]/],
  ["AC-1", "không cắt khoảng trắng", "helper", "r.real_name.trim().toLowerCase()", "r.real_name.toLowerCase()", /dòng chỉ khoảng trắng: ra \["   "\]/],
  ["AC-2", "so phân biệt hoa thường", "helper", "const thap = String(s).toLowerCase();", "const thap = String(s);", /tên NguonGiaA viết hoa không bị bắt/],
  ["AC-2", "giữ tên rỗng trong danh sách", "helper", ".filter((t) => t.length > 0);", ".filter((t) => t !== undefined);", /bị báo lộ tên nguồn giả/],
  ["AC-3", "script đọc sổ nguồn trực tiếp, real_name.toLowerCase()", "script", "const nap = await napTenNguon(c);", 'const nap = { ten: (await c.query("SELECT real_name FROM source_registry")).rows.map((r) => r.real_name.toLowerCase()), bo: 0 };', /script không đọc sổ nguồn qua napTenNguon/],
  ["AC-3", "soát trang bằng includes trực tiếp", "script", "const coTenNguon = (s) => coTenNguonTrong(tenNguon, s);", "const coTenNguon = (s) => tenNguon.some((t) => s.includes(t));", /script không soát trang qua coTenNguonTrong/],
  ["AC-3", "bỏ chặn danh sách rỗng trong script", "script", "try { tenNguon = batBuocCoTen(nap); } catch (e) { dungLai(e.message); }", "tenNguon = nap.ten;", /script không chặn danh sách tên rỗng/],
  ["AC-4", "không chặn danh sách rỗng", "helper", "if (!ten.length) throw", "if (false) throw", /danh sách rỗng không bị chặn/],
];

function chay(env) {
  const r = spawnSync(process.execPath, ["--test", `--test-name-pattern=^${AC} `, path.join(GOC, "scripts/can-gia-tot-ba-vai-ten-nguon.test.mjs")],
    { cwd: GOC, env: { ...process.env, ...env }, encoding: "utf8" });
  return { code: r.status, out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const soCa = (out) => Number(/ℹ pass (\d+)/.exec(out)?.[1] ?? 0) + Number(/ℹ fail (\d+)/.exec(out)?.[1] ?? 0);

const goc = chay({});
if (goc.code !== 0 || soCa(goc.out) === 0) { console.log(`ĐỎ ${AC} trên mã thật (thoát ${goc.code}, ${soCa(goc.out)} ca):\n${goc.out.slice(-2000)}`); process.exit(1); }
console.log(`xanh ${AC} trên mã thật: ${soCa(goc.out)} ca`);
let hong = 0;
for (const [ac, ten, loai, tim, thay, ghim] of DB.filter((d) => d[0] === AC)) {
  const tam = mkdtempSync(path.join(tmpdir(), "cg20-"));
  try {
    const nguon = loai === "helper" ? HELPER : SCRIPT;
    const s = readFileSync(nguon, "utf8");
    if (s.split(tim).length !== 2) throw new Error(`đột biến «${ten}»: không thấy đúng một chỗ «${tim.slice(0, 60)}»`);
    const ban = path.join(tam, path.basename(nguon));
    writeFileSync(ban, s.replace(tim, thay));
    const r = chay(loai === "helper" ? { CG20_SRC: ban } : { CG20_SCRIPT: ban });
    if (r.code === 0) { console.log(`HỎNG đột biến «${ten}»: thước vẫn xanh`); hong++; }
    else if (!ghim.test(r.out)) { console.log(`HỎNG đột biến «${ten}»: đỏ nhưng thiếu thông điệp ghim ${ghim}\n${r.out.slice(-1500)}`); hong++; }
    else console.log(`đỏ đúng ${ac} «${ten}»: ${ghim.exec(r.out)[0]}`);
  } finally { rmSync(tam, { recursive: true, force: true }); }
}
process.exit(hong ? 1 : 0);
