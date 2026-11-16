// s07-nap-that.mjs — phép đo AC-9 của hàng thu-danh-muc-s07: nạp MỌI snapshot S07 thật của máy thu vào một lược đồ tạm trên
// DB thử, so số dòng với số đếm độc lập trên raw, nạp lại, soát tên miền và nhãn nguồn. Chỉ chạy ở máy có raw.
//
//   bash ../db/db-thu.sh oneinvest_suite_s07 --chay node scripts/s07-nap-that.mjs [--goc <thư mục snapshot>] [--doi-chung]
//
// Mã thoát: 0 đạt · 1 lệch (in từng dòng lệch) · 2 từ chối («TỪ CHỐI: DB chung» / «KHÔNG CÓ SNAPSHOT S07»).
// Số đếm độc lập viết riêng ở tệp này, KHÔNG gọi hàm bóc của bộ nạp. Lệnh không in tên miền hay nhãn của nguồn.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";
import pg from "pg";
import { BANG_093, TEP_093 } from "../lib/s07-luoc-do.mjs";

const DAY = dirname(fileURLToPath(import.meta.url));
const KHO = join(DAY, "../..");
const IMPORTER = join(DAY, "../import-s07-danh-muc.mjs");
const TEP_VONG = ["db/migrations/093_stg_s07.sql", "pipeline/import-s07-danh-muc.mjs", "pipeline/lib/s07-danh-muc.mjs", "pipeline/lib/s07-luoc-do.mjs",
  "pipeline/scripts/s07-danh-muc.test.mjs", "pipeline/scripts/s07-danh-muc-db.test.mjs", "pipeline/scripts/s07-fixture.mjs", "pipeline/scripts/s07-nap-that.mjs"];
const args = process.argv.slice(2);
const DOI_CHUNG = args.includes("--doi-chung");
const gocArg = args.includes("--goc") ? args[args.indexOf("--goc") + 1] : null;

// ——— nhận DB theo TÊN cơ sở dữ liệu, không theo chuỗi máy chủ ———
const DB_Q = process.env.DATABASE_URL ?? "";
let tenDb = "";
try { tenDb = decodeURIComponent(new URL(DB_Q).pathname.replace(/^\//, "")); } catch { /* URL hỏng → từ chối */ }
if (!/^oneinvest_[a-z0-9_]+$/.test(tenDb)) {
  console.log("TỪ CHỐI: DB chung — lệnh chỉ chạy trên DB thử tên oneinvest_<…> (dùng db/db-thu.sh --chay)");
  process.exit(2);
}

// ——— gốc snapshot: tham số, mặc định suy từ thư mục git chung của vị trí lệnh ———
function gocMacDinh() {
  const r = spawnSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd: DAY, encoding: "utf8" });
  if (r.status !== 0) return null;
  return join(dirname(r.stdout.trim()), "collector/snapshots/vn");
}
const GOC = gocArg ?? gocMacDinh();
const snapshot = GOC && existsSync(GOC)
  ? readdirSync(GOC).filter((d) => /^[a-z]+__s07-danh-muc__\d{4}-\d{2}-\d{2}T\d{6,9}(-\d+)?$/.test(d) && existsSync(join(GOC, d, "manifest.json"))).sort()
  : [];
if (!snapshot.length) {
  console.log("KHÔNG CÓ SNAPSHOT S07 — không đo trên tập rỗng");
  process.exit(2);
}

// ——— đếm độc lập trên raw ———
function demRaw() {
  const mong = { the: 0, du_an: 0, sitemap: 0 };
  const bo = { dang_nhap: 0, lap: 0, trang_rong: 0, the_khong_du_an: 0, kind_la: 0, nguon_khac: 0 };
  const mien = new Set(); const khoaDangNhap = [];
  for (const s of snapshot) {
    const man = JSON.parse(readFileSync(join(GOC, s, "manifest.json"), "utf8"));
    const thay = { the: new Set(), du_an: new Set(), sitemap: new Set() };
    for (const f of man.files.filter((x) => x.name.startsWith("items-"))) {
      for (const it of JSON.parse(gunzipSync(readFileSync(join(GOC, s, f.name))).toString("utf8"))) {
        if (it.source !== "s07-danh-muc") { bo.nguon_khac++; continue; }
        const co = it.meta?.sessionLoggedIn;
        const can = typeof it.payload?.canonical === "string" && it.payload.canonical.match(/^https?:\/\/([a-z0-9.-]+)/i);
        if (can) mien.add(can[1].toLowerCase().replace(/^www\./, ""));
        const dem = (loai, id) => { if (thay[loai].has(id)) bo.lap++; else { thay[loai].add(id); mong[loai]++; } };
        if (it.kind === "project_list_page") {
          if (co !== false) { bo.dang_nhap++; continue; }
          for (const k of String(it.payload?.listHtml ?? "").split('<div class="js__project-card').slice(1)) {
            const href = (k.match(/<a\b[^>]*\bhref="([^"]*)"/) || [])[1] ?? "";
            const m = href.split(/[?#]/)[0].match(/-pj(\d+)$/);
            if (!m) bo.the_khong_du_an++; else dem("the", m[1]);
          }
        } else if (it.kind === "project_catalog") {
          const m = String(it.meta?.path ?? "").match(/-pj(\d+)$/);
          if (co !== false) { bo.dang_nhap++; if (m) khoaDangNhap.push([s, Number(m[1])]); continue; }
          if (typeof it.payload?.mainHtml !== "string" || !m) { bo.trang_rong++; continue; }
          dem("du_an", m[1]);
        } else if (it.kind === "project_sitemap") {
          if (co === true) { bo.dang_nhap++; continue; }
          for (const l of String(it.payload?.xml ?? "").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) {
            const m = l[1].match(/-pj(\d+)$/);
            if (m) dem("sitemap", m[1]);
          }
        } else bo.kind_la++;
      }
    }
  }
  return { mong, bo, mien: [...mien], khoaDangNhap };
}

const SCHEMA = `s07_that_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const DB = `${DB_Q}${DB_Q.includes("?") ? "&" : "?"}options=-csearch_path%3D${SCHEMA}`;
const BANG = { the: "stg_s07_project_card", du_an: "stg_s07_project", sitemap: "stg_s07_sitemap_url" };
const nap = (goc) => {
  const r = spawnSync("node", [IMPORTER, "--json", goc], { encoding: "utf8", env: { ...process.env, DATABASE_URL: DB }, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`bộ nạp thoát ${r.status}: ${(r.stderr || "").trim().split("\n").at(-1)}`);
  return JSON.parse(r.stdout.trim().split("\n").at(-1));
};

/** So trạng thái DB với số đếm độc lập. Trả danh sách dòng lệch (rỗng = đạt). */
async function soSanh(c, raw, lan1, lan2, nhan) {
  const lech = [];
  const so = {};
  for (const [k, b] of Object.entries(BANG)) {
    so[k] = (await c.query(`SELECT count(*)::int n FROM ${b}`)).rows[0].n;
    if (so[k] !== raw.mong[k]) lech.push(`LỆCH ${b}: bảng ${so[k]} dòng, đếm độc lập trên raw ${raw.mong[k]}`);
  }
  for (const k of Object.keys(raw.bo)) if (lan1.bo[k] !== raw.bo[k]) lech.push(`LỆCH phần bỏ «${k}»: bộ nạp báo ${lan1.bo[k]}, đếm độc lập ${raw.bo[k]}`);
  if (raw.bo.kind_la !== 0) lech.push(`KIND LẠ: ${raw.bo.kind_la} item ngoài ba kind của hợp đồng`);
  if (lan2.snapshot !== 0) lech.push(`ĐỌC LẠI ${lan2.snapshot} snapshot ở lần nạp hai (mong 0 — mọi snapshot đã có dấu)`);
  if (lan2.the + lan2.du_an + lan2.sitemap !== 0) lech.push(`NHÂN DÒNG: lần nạp hai ghi ${lan2.the} thẻ, ${lan2.du_an} trang dự án, ${lan2.sitemap} đường dẫn`);
  const dau = (await c.query(`SELECT count(*)::int n FROM airbnb_snapshots`)).rows[0].n;
  if (dau !== snapshot.length) lech.push(`LỆCH dấu snapshot: ${dau} dòng dấu, ${snapshot.length} snapshot`);
  for (const [s, id] of raw.khoaDangNhap) {
    const n = (await c.query(`SELECT count(*)::int n FROM stg_s07_project WHERE snapshot_id = $1 AND pj_id = $2`, [s, id])).rows[0].n;
    if (n) lech.push(`PHIÊN ĐĂNG NHẬP trong stg_s07_project: ${s} pj ${id}`);
  }
  let hostConLai = new Set(), dongConNhan = 0;
  for (const b of BANG_093) {
    for (const m of raw.mien) {
      const n = (await c.query(`SELECT count(*)::int n FROM ${b} t WHERE row_to_json(t)::text ILIKE $1`, [`%${m}%`])).rows[0].n;
      if (n) lech.push(`TÊN MIỀN trong ${b}: ${n} dòng`);
    }
    const h = await c.query(`SELECT DISTINCT lower(m[1]) AS h FROM ${b} t, regexp_matches(row_to_json(t)::text, 'https?://([a-z0-9.-]+)', 'gi') AS m`);
    for (const r of h.rows) hostConLai.add(r.h);
    for (const nh of nhan) dongConNhan += (await c.query(`SELECT count(*)::int n FROM ${b} t WHERE row_to_json(t)::text ILIKE $1`, [`%${nh}%`])).rows[0].n;
  }
  const hostNhan = [...hostConLai].filter((h) => nhan.some((nh) => h.includes(nh))).length;
  if (hostNhan) lech.push(`MÁY CHỦ MANG NHÃN NGUỒN: ${hostNhan} máy chủ còn lại trong stg`);
  return { lech, so, hostConLai: hostConLai.size, dongConNhan };
}

function soatTep(raw, nhan) {
  const lech = [];
  const cam = [...raw.mien, ...nhan];
  const doc = (p) => readFileSync(join(KHO, p), "utf8").toLowerCase();
  for (const p of TEP_VONG) if (cam.some((x) => doc(p).includes(x))) lech.push(`NHÃN NGUỒN trong tệp ${p}`);
  const dc = doc("collector/docs/DATA-CONTRACT.md");
  const a = dc.indexOf("## nguồn s07"), b = dc.indexOf("\n## ", a + 5);
  if (a < 0) lech.push("DATA-CONTRACT thiếu mục «Nguồn S07»");
  else if (cam.some((x) => dc.slice(a, b < 0 ? undefined : b).includes(x))) lech.push("NHÃN NGUỒN trong tệp collector/docs/DATA-CONTRACT.md (mục S07)");
  return lech;
}

const raw = demRaw();
if (!raw.mien.length) { console.log("LỆCH: không suy được tên miền từ raw (chưa có trang dự án nào) — không soát được tầng A"); process.exit(1); }
const nhan = [...new Set(raw.mien.map((m) => m.split(".")[0]).filter((x) => x.length >= 5))];
const gocChup = mkdtempSync(join(tmpdir(), "s07-that-"));
for (const s of snapshot) symlinkSync(realpathSync(join(GOC, s)), join(gocChup, s)); // chụp tập snapshot lúc bắt đầu — thu vẫn chạy song song
const c0 = new pg.Client({ connectionString: DB_Q });
await c0.connect();
let ma = 0;
try {
  await c0.query(`CREATE SCHEMA "${SCHEMA}"`);
  await c0.query(`CREATE TABLE "${SCHEMA}".airbnb_snapshots (LIKE public.airbnb_snapshots INCLUDING ALL)`);
  const c = new pg.Client({ connectionString: DB });
  await c.connect();
  try {
    await c.query(readFileSync(TEP_093, "utf8"));
    const lan1 = nap(gocChup), lan2 = nap(gocChup);
    const kq = await soSanh(c, raw, lan1, lan2, nhan);
    const lech = [...kq.lech, ...soatTep(raw, nhan)];
    console.log(JSON.stringify({ goc: realpathSync(GOC), snapshot: snapshot.length, bang: kq.so, dem_doc_lap: raw.mong, bo_doc_lap: raw.bo, bo_bo_nap: lan1.bo,
      nap_lai: { snapshot: lan2.snapshot, the: lan2.the, du_an: lan2.du_an, sitemap: lan2.sitemap }, may_chu_con_lai_trong_stg: kq.hostConLai,
      dong_stg_con_nhan_nguon_trong_van_ban: kq.dongConNhan, lech: lech.length }));
    for (const l of lech) console.log(l);
    if (lech.length) ma = 1;

    if (DOI_CHUNG && !lech.length) {
      const thieu = [];
      const mong = async (ten, phai, pha, hoan, lan2x = () => lan2) => {
        await pha();
        const r = await soSanh(c, raw, lan1, await lan2x(), nhan);
        if (!r.lech.some((l) => l.startsWith(phai))) thieu.push(`${ten}: không thấy «${phai}»`);
        await hoan();
        const sach = await soSanh(c, raw, lan1, lan2, nhan);
        if (sach.lech.length) thieu.push(`${ten}: hoàn lại chưa sạch`);
      };
      await mong("(1) xoá một dòng thẻ", "LỆCH stg_s07_project_card",
        () => c.query(`CREATE TABLE _dc AS SELECT * FROM stg_s07_project_card LIMIT 1; DELETE FROM stg_s07_project_card t USING _dc d WHERE t.snapshot_id = d.snapshot_id AND t.pj_id = d.pj_id`),
        () => c.query(`INSERT INTO stg_s07_project_card SELECT * FROM _dc; DROP TABLE _dc`));
      await mong("(2) chèn dòng mang tên miền", "TÊN MIỀN trong stg_s07_project",
        () => c.query(`INSERT INTO stg_s07_project (snapshot_id, pj_id, captured_at, path, scale_raw) VALUES ('doi-chung', -1, now(), '/x', $1)`, [`xem ${raw.mien[0]}`]),
        () => c.query(`DELETE FROM stg_s07_project WHERE snapshot_id = 'doi-chung'`));
      let dauBo = null;
      await mong("(3) mất một dòng dấu", "ĐỌC LẠI 1 snapshot",
        async () => { dauBo = (await c.query(`DELETE FROM airbnb_snapshots WHERE snapshot_id = (SELECT min(snapshot_id) FROM airbnb_snapshots) RETURNING snapshot_id`)).rows[0].snapshot_id; },
        async () => { /* lần nạp trong lan2x đã ghi lại dòng dấu */ },
        async () => nap(gocChup));
      if (!dauBo) thieu.push("(3): không xoá được dòng dấu nào");
      // (4) (5): chính lệnh đo phải từ chối
      const soLuocDo = async () => (await c0.query(`SELECT count(*)::int n FROM information_schema.schemata`)).rows[0].n;
      const truoc = await soLuocDo();
      const con = (env, them = []) => spawnSync("node", [fileURLToPath(import.meta.url), ...them], { encoding: "utf8", env: { ...process.env, ...env } });
      for (const may of ["localhost", "127.0.0.1"]) {
        const u = new URL(DB_Q); u.hostname = may; u.pathname = "/oneinvest";
        const r = con({ DATABASE_URL: u.toString() });
        if (r.status !== 2 || !r.stdout.includes("TỪ CHỐI: DB chung")) thieu.push(`(4) DB chung qua ${may}: thoát ${r.status}, không thấy «TỪ CHỐI: DB chung»`);
      }
      if ((await soLuocDo()) !== truoc) thieu.push("(4): số lược đồ của DB thử đổi sau khi lệnh từ chối");
      const rong = mkdtempSync(join(tmpdir(), "s07-rong-"));
      const r5 = con({}, ["--goc", rong]);
      rmSync(rong, { recursive: true, force: true });
      if (r5.status !== 2 || !r5.stdout.includes("KHÔNG CÓ SNAPSHOT S07")) thieu.push(`(5) gốc rỗng: thoát ${r5.status}, không thấy «KHÔNG CÓ SNAPSHOT S07»`);
      if (thieu.length) { for (const t of thieu) console.log("ĐỐI CHỨNG KHÔNG ĐỎ — " + t); ma = 1; }
      else console.log("ĐỐI CHỨNG ĐỎ ĐÚNG: năm cách phá đều được báo đúng tên (LỆCH stg_s07_project_card · TÊN MIỀN trong stg_s07_project · ĐỌC LẠI 1 snapshot · TỪ CHỐI: DB chung ×2 · KHÔNG CÓ SNAPSHOT S07)");
    }
  } finally { await c.end(); }
} finally {
  await c0.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {});
  await c0.end();
  rmSync(gocChup, { recursive: true, force: true });
}
process.exit(ma);
