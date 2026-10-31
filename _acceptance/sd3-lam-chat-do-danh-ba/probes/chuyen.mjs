// chuyen.mjs — hồ sơ sd3-lam-chat-do-danh-ba: phép đo trên DB THỬ chép máy thu (db-thu-chac.sh của SD3, xoá khi xong).
//   node chuyen.mjs n6    E4 — N6 của bộ đo trục SĐT trước 060 (không đạt) và sau 060 + dựng danh bạ (đạt); đỏ 'N6 KHONG BAT'
//   node chuyen.mjs anh   E5 — ánh xạ người → tập số trước/sau 060 bằng nhau, đếm sdt_bam mồ côi; đỏ 'LECH ANH', 'MO COI KHONG DEM'
//   node chuyen.mjs ten   E6 — tên người bán cũ nằm ở bí danh ten của đúng người đã có trước 060; đỏ 'TEN SAI NGUOI'
// Không bao giờ chạy trên DB `oneinvest`; mọi số in là số đếm, không in SĐT.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import assert from "node:assert/strict";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const pg = createRequire(path.join(ROOT, "pipeline/package.json"))("pg");
const MIG = readFileSync(path.join(ROOT, "db/migrations/060_sdt_e164.sql"), "utf8");
const PHAN = process.argv[2];
const TEN = `oneinvest_p4_ldb_${String(PHAN).replace(/-/g, "_")}`;
const DB_URL = `postgres://oneinvest:oneinvest@localhost:5433/${TEN}`;
if (!/^oneinvest_p4_ldb_[a-z0-9_]+$/.test(TEN)) throw new Error("tên DB thử sai khuôn");
const ok = (s) => console.log(`ok ${s}`);
const bam = (s) => createHash("sha256").update(s).digest("hex").slice(0, 32);
const e164 = (so0) => "+84" + so0.slice(1);
const SO0 = /^0[35789]\d{8}$/;

function dbThu(xoa = false) {
  const r = xoa
    ? spawnSync("bash", ["db/db-thu.sh", TEN, "--xoa"], { cwd: ROOT, encoding: "utf8" })
    : spawnSync("bash", ["_acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh", TEN], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0 && !xoa) throw new Error(`db-thu lỗi: ${r.stderr.slice(-300)}`);
}
const node = (args) =>
  spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATABASE_URL: DB_URL }, timeout: 600_000 });
async function moi() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  return c;
}
async function thu(c, fn) {
  await c.query("BEGIN");
  try { return await fn(); } finally { await c.query("ROLLBACK"); }
}
function dungNguoi() {
  const r = node(["pipeline/dung-nguoi.mjs"]);
  assert.equal(r.status, 0, `dung-nguoi thoát ${r.status}: ${r.stderr.slice(-300)}`);
}

/** Bước đêm ĐỜI TRƯỚC (refresh-bait-gap + dựng danh bạ của main ngay trước merge SD3): bung pipeline/ + db/ ra thư mục
 *  tạm, mượn node_modules — để danh bạ cũ khớp mọi tin trước khi chụp (gap-probe P1). */
function buocDemCu() {
  const merge = spawnSync("git", ["log", "--merges", "--format=%H", "-1", "--grep=feat/sdt-luu-goc-e164", "origin/main"], { cwd: ROOT, encoding: "utf8" }).stdout.trim();
  assert.match(merge, /^[0-9a-f]{40}$/, "không tìm được merge SD3 trên origin/main");
  const tam = mkdtempSync(path.join(os.tmpdir(), "ldb-dem-cu-"));
  try {
    const bung = spawnSync("bash", ["-c", `git archive ${merge}^1 pipeline db | tar -x -C "${tam}"`], { cwd: ROOT, encoding: "utf8" });
    assert.equal(bung.status, 0, `bung bản đời trước lỗi: ${bung.stderr.slice(-300)}`);
    symlinkSync(path.join(ROOT, "pipeline/node_modules"), path.join(tam, "pipeline/node_modules"));
    const r = node([path.join(tam, "pipeline/refresh-bait-gap.mjs")]);
    assert.equal(r.status, 0, `bước đêm đời trước thoát ${r.status}: ${r.stderr.slice(-300)}`);
  } finally { rmSync(tam, { recursive: true, force: true }); }
}

/** Khoá băm cũ (dạng 0…) → E.164, theo nguồn, từ bản ghi tin còn dạng cũ (trước 060). */
async function anhXa(c) {
  const { rows } = await c.query(`SELECT DISTINCT seller_phone s FROM sale_offer_records WHERE seller_phone IS NOT NULL`);
  const m = new Map();
  for (const { s } of rows) if (SO0.test(s)) m.set(bam(s), e164(s));
  return m;
}

// ------------------------------------------------------------------------------------------------------------ n6 (E4)
function n6Cua(stdout) {
  const kq = {};
  for (const l of stdout.split("\n")) {
    const m = /^danh-ba-sdt:n6 (S0\d) (pass|fail) trung=(\d+) thua=(\d+) thieu=(\d+) tong=(\d+)$/.exec(l);
    if (m) kq[m[1]] = { status: m[2], trung: +m[3], thua: +m[4], thieu: +m[5], tong: +m[6] };
  }
  return kq;
}
async function n6() {
  const c = await moi();
  try {
    const truoc = node(["pipeline/do-danh-ba-sdt.mjs"]);
    assert.equal(truoc.status, 0, `do-danh-ba-sdt trước 060 thoát ${truoc.status}: ${truoc.stderr.slice(-300)}`);
    const t = n6Cua(truoc.stdout);
    assert.deepEqual(Object.keys(t).sort(), ["S03", "S05"], "thiếu dòng n6");
    const { rows: coSo } = await c.query(`SELECT DISTINCT source FROM sale_offers WHERE source IN ('S03','S05') AND seller_phone IS NOT NULL`);
    for (const { source } of coSo) {
      assert.equal(t[source].status, "fail", `N6 KHONG BAT: trước 060 ${source} đạt dù chưa có bí danh sdt`);
      assert.ok(t[source].thieu > 0);
    }
    ok(`trước 060: n6 không đạt ở ${coSo.map((r) => `${r.source} thieu=${t[r.source].thieu}`).join(", ")} (đối chứng dương)`);
    await c.query(MIG);
    dungNguoi();
    const sau = node(["pipeline/do-danh-ba-sdt.mjs"]);
    assert.equal(sau.status, 0, `do-danh-ba-sdt sau 060 thoát ${sau.status}: ${sau.stderr.slice(-300)}`);
    const s = n6Cua(sau.stdout);
    for (const nguon of ["S03", "S05"]) {
      assert.deepEqual([s[nguon].status, s[nguon].trung, s[nguon].thua, s[nguon].thieu], ["pass", 0, 0, 0], `n6 sau 060 ${nguon}: ${JSON.stringify(s[nguon])}`);
    }
    assert.ok(s.S03.tong + s.S05.tong > 0, "sau 060 không có bí danh sdt nào — phép đo rỗng");
    ok(`sau 060 + dựng danh bạ: n6 đạt — S03 tong=${s.S03.tong}, S05 tong=${s.S05.tong}`);
    // Đối chứng đỏ: dữ liệu đọc thật, đột biến trong bộ nhớ (chỉ mục duy nhất chặn chèn thật), qua tinhSo thật.
    const bo = await import(pathToFileURL(path.join(ROOT, "pipeline/do-danh-ba-sdt.mjs")).href);
    const du = await bo.docDuLieu(c);
    const goc = du.biDanh.find((b) => b.kind === "sdt" && !b.retired_at);
    assert.ok(goc, "không có bí danh sdt để đột biến");
    du.biDanh.push({ ...goc, object_key: "pty_DOT_BIEN" });
    const kq = bo.tinhSo(du)[goc.source].n6;
    if (!(kq.trung >= 1 && bo.xepTrangThai("n6", kq) === "fail")) throw new Error("N6 KHONG BAT: một số gán hai người mà n6 vẫn đạt");
    ok(`đối chứng đỏ: một số gán thêm người thứ hai (${goc.source}) → n6 trung=${kq.trung}, không đạt`);
    console.log("N6 OK");
  } finally { await c.end(); }
}

// ----------------------------------------------------------------------------------------------------------- anh (E5)
/** So hai ánh xạ party_key → Set số: cùng khoá, cùng tập (bằng nhau, không tập con). */
export function soAnh(truoc, sau) {
  const chiTruoc = [...truoc.keys()].filter((k) => !sau.has(k));
  const chiSau = [...sau.keys()].filter((k) => !truoc.has(k));
  if (chiTruoc.length || chiSau.length) throw new Error(`LECH ANH: khoá chỉ trước ${chiTruoc.length}, chỉ sau ${chiSau.length}`);
  let lech = 0;
  for (const [k, a] of truoc) {
    const b = sau.get(k);
    if (a.size !== b.size || [...a].some((x) => !b.has(x))) lech++;
  }
  if (lech) throw new Error(`LECH ANH: ${lech} người lệch tập số`);
  return truoc.size;
}
/** sdt_bam còn hiệu lực không khớp khoá băm của số nào trên bản ghi tin: số bí danh và tập người CHỈ mang chúng. */
async function demMoCoi(c, map) {
  const { rows } = await c.query(`SELECT object_key k, value v FROM registry_aliases WHERE kind = 'sdt_bam' AND retired_at IS NULL`);
  const coKhop = new Set(rows.filter((r) => map.has(r.v)).map((r) => r.k));
  const moCoi = rows.filter((r) => !map.has(r.v));
  return { biDanh: moCoi.length, nguoiChi: new Set(moCoi.map((r) => r.k).filter((k) => !coKhop.has(k))), tatCa: new Set(rows.map((r) => r.k)) };
}
async function anh() {
  const c = await moi();
  try {
    buocDemCu();
    const map = await anhXa(c);
    const { rows: bamRows } = await c.query(`SELECT object_key k, value v FROM registry_aliases WHERE kind = 'sdt_bam' AND retired_at IS NULL`);
    const truoc = new Map();
    for (const { k, v } of bamRows) {
      const so = map.get(v);
      if (!so) continue;
      if (!truoc.has(k)) truoc.set(k, new Set());
      truoc.get(k).add(so);
    }
    const mc = await demMoCoi(c, map);
    assert.equal(mc.tatCa.size, truoc.size + mc.nguoiChi.size, `MO COI KHONG DEM: người trước ${mc.tatCa.size} ≠ khớp ${truoc.size} + mồ côi ${mc.nguoiChi.size}`);
    // Đối chứng: một sdt_bam mồ côi chèn trong giao dịch → đếm mồ côi tăng đúng 1.
    await thu(c, async () => {
      await c.query(`INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZMC01', 'S03')`);
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZMC01', 'sdt_bam', $1, 'S03')`, [bam("khong-phai-so")]);
      const mc2 = await demMoCoi(c, map);
      if (mc2.biDanh !== mc.biDanh + 1 || mc2.nguoiChi.size !== mc.nguoiChi.size + 1) throw new Error("MO COI KHONG DEM: chèn một mồ côi mà số đếm không tăng");
    });
    ok(`trước 060: ${mc.tatCa.size} người mang sdt_bam = ${truoc.size} khớp số trên tin + ${mc.nguoiChi.size} chỉ mang bí danh mồ côi (${mc.biDanh} bí danh mồ côi); đối chứng chèn một mồ côi được đếm`);
    await c.query(MIG);
    dungNguoi();
    const { rows: sdtRows } = await c.query(`SELECT object_key k, value v, source FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL`);
    const sau = new Map();
    const moiSo = new Map();
    for (const { k, v, source } of sdtRows) {
      if (!sau.has(k)) sau.set(k, new Set());
      sau.get(k).add(v);
      const kh = `${source}|${v}`;
      moiSo.set(kh, (moiSo.get(kh) ?? new Set()).add(k));
    }
    const nhieu = [...moiSo.values()].filter((s) => s.size > 1).length;
    assert.equal(nhieu, 0, `${nhieu} (nguồn, số) thuộc hơn một người`);
    // Người theo SĐT mới sinh cho số không có sdt_bam trước 060 (số chỉ có trên tin chưa qua bước đêm) — sau buocDemCu phải là 0.
    const n = soAnh(truoc, sau);
    assert.equal(truoc.size, sau.size, "LECH ANH: số người hai bên");
    ok(`sau 060 + dựng danh bạ: ${n} người, ánh xạ người → tập số bằng nhau (khoá một phía 0, tập lệch 0), mỗi (nguồn, số) một người; người chỉ mang mồ côi mất bí danh SĐT: ${mc.nguoiChi.size}`);
    const [k0] = sau.keys();
    const themSo = new Map([...sau].map(([k, v]) => [k, new Set(k === k0 ? [...v, "+84999999999"] : v)]));
    assert.throws(() => soAnh(truoc, themSo), /LECH ANH/);
    const boNguoi = new Map([...sau].filter(([k]) => k !== k0));
    assert.throws(() => soAnh(truoc, boNguoi), /LECH ANH/);
    ok("đối chứng đỏ qua soAnh: thêm một số lạ → 'LECH ANH'; bỏ một người → 'LECH ANH'");
    console.log("ANH OK");
  } finally { await c.end(); }
}

// ----------------------------------------------------------------------------------------------------------- ten (E6)
/** Mỗi tên cũ: người ĐÃ CÓ trước 060 nay mang sdt của số ấy — khác rỗng, mỗi người có ten còn hiệu lực đúng tên. */
async function kiemTen(c, cu) {
  const { rows: sdt } = await c.query(`SELECT object_key k, value v FROM registry_aliases WHERE kind = 'sdt' AND retired_at IS NULL`);
  const { rows: ten } = await c.query(`SELECT object_key k, value v FROM registry_aliases WHERE kind = 'ten' AND retired_at IS NULL`);
  const nguoiSo = new Map();
  for (const { k, v } of sdt) nguoiSo.set(v, (nguoiSo.get(v) ?? new Set()).add(k));
  const tenCua = new Set(ten.map((r) => `${r.k}|${r.v}`));
  let soNguoi = 0;
  let moiSinh = 0;
  for (const { so, name, nguoiCu } of cu) {
    const dangMang = nguoiSo.get(so) ?? new Set();
    const kiem = [...dangMang].filter((k) => nguoiCu.has(k));
    moiSinh += [...dangMang].filter((k) => !nguoiCu.has(k)).length;
    if (kiem.length === 0) throw new Error(`TEN SAI NGUOI: không người cũ nào mang số của tên`);
    for (const k of kiem) if (!tenCua.has(`${k}|${name}`)) throw new Error(`TEN SAI NGUOI: người cũ thiếu bí danh ten còn hiệu lực`);
    soNguoi += kiem.length;
  }
  return { soTen: cu.length, soNguoi, moiSinh };
}
async function tenPhan() {
  const c = await moi();
  try {
    buocDemCu();
    const map = await anhXa(c);
    const { rows: s } = await c.query(`SELECT phone_hash h, btrim(name) name FROM sellers WHERE btrim(coalesce(name, '')) <> ''`);
    const { rows: bamRows } = await c.query(`SELECT object_key k, value v FROM registry_aliases WHERE kind = 'sdt_bam' AND retired_at IS NULL`);
    const nguoiBam = new Map();
    for (const { k, v } of bamRows) nguoiBam.set(v, (nguoiBam.get(v) ?? new Set()).add(k));
    const cu = s.filter((r) => map.has(r.h) && nguoiBam.has(r.h)).map((r) => ({ so: map.get(r.h), name: r.name, nguoiCu: nguoiBam.get(r.h) }));
    ok(`chụp trước 060: ${s.length} tên người bán khác rỗng, ${cu.length} tên có số dạng cũ và người mang sdt_bam (${s.length - cu.length} tên không có người cũ — không thuộc miền kiểm)`);
    assert.ok(cu.length > 0, "không tên nào để kiểm — phép đo rỗng");
    // Đối chứng đỏ 1: bản chép 060 chép tên sang người khác — áp và dựng danh bạ trong giao dịch.
    const sai = MIG.replace("SELECT DISTINCT a.object_key, 'ten', btrim(s.name), a.source",
      "SELECT DISTINCT (SELECT min(p.party_key) FROM parties p WHERE p.party_key <> a.object_key), 'ten', btrim(s.name), a.source");
    assert.notEqual(sai, MIG, "bản chép 060 không đổi được — mẫu thay đã lệch mã");
    const { dungNguoi: dungTrongTx } = await import(pathToFileURL(path.join(ROOT, "pipeline/lib/danh-ba-nguoi.mjs")).href);
    await thu(c, async () => {
      await c.query(sai);
      await dungTrongTx(c, { runId: "ldb-ten-do", out: () => {} });
      await assert.rejects(kiemTen(c, cu), /TEN SAI NGUOI/);
    });
    ok("đối chứng đỏ: bản chép 060 chép tên sang người khác → 'TEN SAI NGUOI'");
    await c.query(MIG);
    dungNguoi();
    const kq = await kiemTen(c, cu);
    ok(`sau 060 + dựng danh bạ: ${kq.soTen} tên, ${kq.soNguoi} người cũ đều có bí danh ten đúng tên; ${kq.moiSinh} người mới sinh sau 060 mang số ấy (không tính)`);
    await thu(c, async () => {
      await c.query(`UPDATE registry_aliases SET retired_at = now() WHERE kind = 'ten' AND retired_at IS NULL AND object_key = ANY ($1)`, [[...cu[0].nguoiCu]]);
      await assert.rejects(kiemTen(c, cu), /TEN SAI NGUOI/);
    });
    ok("đối chứng đỏ: nghỉ bí danh tên của người cũ → 'TEN SAI NGUOI'");
    await thu(c, async () => {
      await c.query(`INSERT INTO parties (party_key, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZMS01', 'S06')`);
      await c.query(`INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ('pty_01HZZZZZZZZZZZZZZZZZZZMS01', 'sdt', $1, 'S06')`, [cu[0].so]);
      const k2 = await kiemTen(c, cu);
      assert.equal(k2.moiSinh, kq.moiSinh + 1, "người mới không được đếm riêng");
    });
    ok("đối chứng dương: người mới sinh sau 060 mang số ấy, không bí danh ten → không đỏ, được đếm riêng");
    console.log("TEN OK");
  } finally { await c.end(); }
}

const BUOC = { n6, anh, ten: tenPhan };
if (!BUOC[PHAN]) { console.error(`chuyen.mjs: phần lạ «${PHAN}»`); process.exit(2); }
dbThu();
try { await BUOC[PHAN](); } finally { dbThu(true); }
