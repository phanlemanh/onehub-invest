// doi-chung.mjs — hồ sơ vocab-db-itest-xanh-tren-main AC-3 (E3). Bốn phép đo trên cùng DB:
// (1) bản vocab-db.itest.mjs của main 82a53e0a (trước sửa) đỏ — tập ca đỏ chứa đủ bốn ca đã biết;
// (2) bản hiện tại xanh ba lượt liền (chập chờn đã thấy một lần — đo lại, không tự ghi nhận);
// (3) tập tên ca và số lời gọi assert giữa hai bản giống hệt (sửa thước không được nới assertion);
// (4) định nghĩa mọi ràng buộc *_chk và số dòng ref_* của DB trước = sau (mọi ghi nằm trong BEGIN … ROLLBACK).
// Bản cũ chép tạm cạnh tệp thật (đường import tương đối giữ nguyên), xoá trong finally.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PIPE = path.join(ROOT, "pipeline");
const pg = createRequire(path.join(PIPE, "package.json"))("pg");
const GOC = "82a53e0a";
const DO_KY_VONG = ["VD-AC-7 áp 043 trên tiền đề lần đầu", "VD-AC-8 --check-db", "VD-AC-7 emitSeed(sổ)", "VD-IQ-3 050 sau 043"];
const LUOT = 3;
const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const chay = (tep) => spawnSync(process.execPath, ["--test", "--test-concurrency=1", tep], { cwd: PIPE, encoding: "utf8", timeout: 600_000 });
const caDo = (out) => [...new Set([...out.matchAll(/^✖ (.+?) \(\d/gm)].map((m) => m[1]))];
const tenCa = (src) => [...src.matchAll(/^test\("([^"]+)"/gm)].map((m) => m[1]);
const soAssert = (src) => (src.match(/\bassert\.\w+\(/g) ?? []).length;

async function chupDb() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: chk } = await c.query(`SELECT conname, pg_get_constraintdef(oid) AS d FROM pg_constraint WHERE conname LIKE '%\\_chk' ORDER BY conname`);
    const { rows: [n] } = await c.query(`SELECT (SELECT count(*) FROM ref_lookup)::int AS l, (SELECT count(*) FROM ref_field_lookup)::int AS f`);
    return createHash("sha256").update(JSON.stringify({ chk, n })).digest("hex");
  } finally { await c.end(); }
}

const cu = spawnSync("git", ["show", `${GOC}:pipeline/scripts/vocab-db.itest.mjs`], { cwd: ROOT, encoding: "utf8" });
if (cu.status !== 0) { console.error(`vocab-db đối chứng: không đọc được bản ${GOC}: ${cu.stderr}`); process.exit(2); }
const moi = readFileSync(path.join(PIPE, "scripts", "vocab-db.itest.mjs"), "utf8");
const tam = path.join(PIPE, "scripts", `.vocab-db-cu-${process.pid}.itest.mjs`);
const hong = [];
const truoc = await chupDb();
try {
  writeFileSync(tam, cu.stdout);
  const r1 = chay(tam);
  const do1 = caDo(r1.stdout + r1.stderr);
  const thieu = DO_KY_VONG.filter((d) => !do1.some((x) => x.startsWith(d)));
  console.log(`vocab-db đối chứng: bản cũ đỏ ${do1.length} ca, chứa đủ ${DO_KY_VONG.length - thieu.length}/${DO_KY_VONG.length} ca đã biết`);
  if (r1.status === 0 || thieu.length) hong.push(`bản cũ thiếu ca đỏ: ${thieu.join(", ")}`);

  let xanh = 0;
  for (let i = 1; i <= LUOT; i++) {
    const r = chay("scripts/vocab-db.itest.mjs");
    const d = caDo(r.stdout + r.stderr);
    if (r.status === 0 && d.length === 0) xanh++;
    else console.error(`  lượt ${i} đỏ: ${d.join(" · ")}\n${(r.stdout + r.stderr).split("✖ failing tests:")[1]?.slice(0, 2000) ?? ""}`);
  }
  console.log(`vocab-db đối chứng: bản hiện tại xanh ${xanh}/${LUOT} lượt`);
  if (xanh !== LUOT) hong.push(`bản hiện tại xanh ${xanh}/${LUOT} lượt`);

  const giongTen = JSON.stringify(tenCa(cu.stdout)) === JSON.stringify(tenCa(moi));
  console.log(`vocab-db đối chứng: tên ca ${giongTen ? "giống hệt" : "KHÁC"} · lời gọi assert ${soAssert(cu.stdout)} → ${soAssert(moi)}`);
  if (!giongTen || soAssert(cu.stdout) !== soAssert(moi)) hong.push("tên ca hoặc số assert đổi so với bản trước sửa");
} finally {
  rmSync(tam, { force: true });
}
const sau = await chupDb();
console.log(`vocab-db đối chứng: ràng buộc *_chk + số dòng ref_* ${truoc === sau ? "trước = sau" : "ĐỔI"}`);
if (truoc !== sau) hong.push("DB thật đổi sau lượt đo");
if (hong.length) { console.error(`vocab-db đối chứng: lệch — ${hong.join("; ")}`); process.exit(1); }
