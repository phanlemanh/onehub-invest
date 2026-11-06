#!/usr/bin/env node
/**
 * bao-cao-ngay.mjs — báo cáo số liệu hằng ngày theo bảng mục tiêu (`scripts/bao-cao-ngay/muc-tieu.json`).
 *
 * CHỈ ĐỌC: mọi truy vấn chạy trong một giao dịch READ ONLY rồi ROLLBACK; không gọi model trả tiền; không đọc tên
 * nguồn thật (độ tươi dùng đúng `scripts/lib/freshness.mjs`, vốn chỉ in mã S0x). Thứ duy nhất được ghi
 * là ảnh chụp số của ngày (JSON) vào thư mục trạng thái gitignored, để hôm sau so.
 *
 * Số đọc lại từ chỗ đã có, không đo lại: `data_level_snapshot` (bậc), `data_flow_snapshot` (phễu, job đêm),
 * `dq_check_results`, `silver_labels`/`ai_calls`/`ai_model_prices`, `review_queue`, `eval_labels`, độ tươi của
 * liên lạc (lib freshness), mốc GCM1 (lo-trinh.json + _acceptance/).
 *
 * Dùng:
 *   node scripts/bao-cao-ngay.mjs                 # in markdown, lưu ảnh chụp ngày
 *   node scripts/bao-cao-ngay.mjs --json          # in JSON {ngay, so, bang, goiY, ...}
 *   node scripts/bao-cao-ngay.mjs --out <tệp.md>  # ghi markdown ra tệp
 *   --audit        chạy thêm scripts/audit-all.sh, lấy dòng tổng kết + dòng FAIL
 *   --no-save      không lưu ảnh chụp ngày
 *   --state-dir    thư mục ảnh chụp (mặc định <checkout chính>/state/bao-cao-ngay)
 */
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isBad, readFreshness } from "./lib/freshness.mjs";
import { chamBang, dungMarkdown, goiY, oBacGiam } from "./lib/bao-cao-ngay.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const TZ = "Asia/Ho_Chi_Minh";

export function ngayVN(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Thư mục trạng thái mặc định: state/ của checkout chính (worktree dùng chung), như audit-all.sh tìm gốc log. */
export function stateDirMacDinh() {
  try {
    const chung = execFileSync("git", ["-C", ROOT, "rev-parse", "--path-format=absolute", "--git-common-dir"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (path.basename(chung) === ".git") return path.join(path.dirname(chung), "state", "bao-cao-ngay");
  } catch {
    /* không phải kho git — dùng cây hiện tại */
  }
  return path.join(ROOT, "state", "bao-cao-ngay");
}

const pct = (a, b) => (b > 0 ? Math.round((1000 * a) / b) / 10 : null);
const num = (v) => (v === null || v === undefined ? null : Number(v));

/** Gom mọi số trong một giao dịch chỉ đọc. Trả { so, ngu, lat, oGiam, homQuaSnap }. */
export async function gom(client, { now = new Date() } = {}) {
  const q = async (sql, args = []) => (await client.query(sql, args)).rows;
  const so = {};
  const ngu = {};
  await client.query("BEGIN READ ONLY");
  try {
    await client.query("SET LOCAL statement_timeout = '180s'");

    // North star — hai ảnh chụp bậc gần nhất.
    const snaps = (await q(`SELECT DISTINCT snap_date::text d FROM data_level_snapshot ORDER BY 1 DESC LIMIT 2`)).map((r) => r.d);
    const lay = (d) => q(`SELECT market_id, property_type, unit, data_level, n FROM data_level_snapshot WHERE snap_date = $1`, [d]);
    const sau = snaps[0] ? await lay(snaps[0]) : [];
    const truoc = snaps[1] ? await lay(snaps[1]) : [];
    ngu.snapNgay = snaps[0] ?? null;
    ngu.snapTruoc = snaps[1] ?? null;
    const capB = (lv) => Number(String(lv).slice(1));
    so.NS1 = sau.filter((r) => capB(r.data_level) >= (r.property_type === "apartment" ? 5 : 3)).reduce((s, r) => s + r.n, 0);
    so.NS1b = sau.filter((r) => capB(r.data_level) >= 3).reduce((s, r) => s + r.n, 0);
    ngu.tongDonVi = sau.reduce((s, r) => s + r.n, 0);
    ngu.phanBo = Object.fromEntries(["B0", "B1", "B2", "B3", "B4", "B5"].map((b) => [b, sau.filter((r) => r.data_level === b).reduce((s, r) => s + r.n, 0)]));
    const oGiam = truoc.length ? oBacGiam(truoc, sau) : { nghi: [], roi: [] };
    so.NS3 = truoc.length ? oGiam.nghi.length : null;

    const [g] = await q(`SELECT count(DISTINCT po.offer_id)::int n FROM property_offers po JOIN sale_offers o USING (offer_id) WHERE o.source = 'S03'`);
    so.NS2 = g.n;

    // Phễu — data_flow_snapshot (job đêm, ngày theo giờ VN). «Ngày đủ gần nhất» = ngày < hôm nay.
    const homNay = ngayVN(now);
    const [df] = await q(`SELECT facts->'days' days, computed_at::text c FROM data_flow_snapshot WHERE time_window = '7d' ORDER BY computed_at DESC LIMIT 1`);
    const days = (df?.days ?? []).filter((d) => d.day < homNay);
    const lastDay = (src) => days.filter((d) => d.source === src).sort((a, b) => (a.day < b.day ? 1 : -1));
    const s03 = lastDay("S03");
    const s06 = lastDay("S06");
    ngu.phieuNgay = s03[0]?.day ?? null;
    so.F1 = s03[0] ? num(s03[0].received) : null;
    so.F2 = s03[0] ? num(s03[0].offers) : null;
    if (s06.length) {
      const tb = s06.slice(1, 8).reduce((s, d) => s + Number(d.received), 0) / Math.max(1, Math.min(7, s06.length - 1));
      so.P3 = tb > 0 ? pct(Number(s06[0].received), tb) : null;
      ngu.s06Nhan = Number(s06[0].received);
    }

    // Tin S03 sống: bậc, thiếu diện tích, tới phường.
    const [t] = await q(`
      SELECT count(*)::int tong,
             count(*) FILTER (WHERE l.data_level = 'B1')::int b1,
             count(*) FILTER (WHERE o.area_m2 IS NULL OR o.area_m2 <= 0)::int thieu_dt,
             count(*) FILTER (WHERE a.region_type = 'submarket')::int co_phuong
        FROM sale_offers o
        LEFT JOIN areas a ON a.id = o.area_id
       CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, false) l
       WHERE o.source = 'S03' AND o.retired_at IS NULL`);
    so.F3 = pct(t.b1, t.tong);
    so.F3b = pct(t.thieu_dt, t.tong);
    so.F5 = pct(t.co_phuong, t.tong);
    so.P2b = t.tong;

    // Lượng theo kênh (định nghĩa bảng mục tiêu ra mắt 31/10).
    const [v] = await q(`
      SELECT (SELECT count(*) FROM sale_offers WHERE source = 'S06' AND kind = 'sale' AND retired_at IS NULL)::int s06,
             (SELECT count(*) FROM listing_records)::int s01,
             (SELECT count(DISTINCT project_id) FROM stg_s08_inventory)::int s08`);
    so.P2a = v.s06;
    so.P2c = v.s01;
    so.P2d = v.s08;

    // Độ tươi — đọc lại định nghĩa của liên lạc, không đo lại.
    const fr = await readFreshness(client, { now });
    const bad = fr.filter(isBad);
    so.P1 = bad.length;
    ngu.freshnessBad = bad.map((r) => `${r.code}/${r.city} ${r.ageHours ?? "?"}h>${r.sloHours}h`);

    // DQ: trạng thái mới nhất mỗi (check, entity) trong 26 giờ — chỉ tên kiểm + entity, không in detail.
    const dq = await q(`
      SELECT DISTINCT ON (check_name, entity) check_name, entity, status
        FROM dq_check_results WHERE checked_at >= now() - interval '26 hours'
       ORDER BY check_name, entity, checked_at DESC`);
    const dqDo = dq.filter((r) => r.status === "fail").map((r) => `${r.check_name}:${r.entity}`);
    so.Q1 = dqDo.length;
    ngu.dqDo = dqDo;

    // Đọc tin — silver_labels của ngày VN gần nhất có số (trước hôm nay).
    const [sl] = await q(`
      WITH d AS (SELECT max((labeled_at AT TIME ZONE '${TZ}')::date) d FROM silver_labels
                  WHERE (labeled_at AT TIME ZONE '${TZ}')::date < $1::date)
      SELECT d.d::text ngay, count(s.*)::int n,
             round(100.0 * avg((NOT coalesce(s.json_ok, false))::int), 2)::float json_hong,
             round(100.0 * avg((s.quote_ok IS FALSE)::int), 2)::float trich_sai,
             coalesce(sum(s.cost_usd), 0)::float usd
        FROM d LEFT JOIN silver_labels s ON (s.labeled_at AT TIME ZONE '${TZ}')::date = d.d GROUP BY d.d`, [homNay]);
    ngu.docTinNgay = sl?.ngay ?? null;
    ngu.docTinN = sl?.n ?? 0;
    so.D3a = sl?.n ? sl.json_hong : null;
    so.D3b = sl?.n ? sl.trich_sai : null;
    so.C1 = sl?.n ? Math.round(sl.usd * 1000) / 1000 : null;
    so.C2 = sl?.n ? Math.round((sl.usd / sl.n) * 100000) / 100000 : null;

    const [c4] = await q(`
      SELECT count(DISTINCT a.model)::int n FROM ai_calls a LEFT JOIN ai_model_prices p USING (model)
       WHERE a.at >= now() - interval '7 days' AND (p.model IS NULL OR (coalesce(p.gia_vao, 0) = 0 AND coalesce(p.gia_ra, 0) = 0))
         AND a.model NOT LIKE '%local%' AND a.model NOT LIKE 'mtplx:%'`);
    so.C4 = c4.n;

    // Công người.
    const [h] = await q(`
      SELECT count(*) FILTER (WHERE status = 'pending')::int cho,
             count(*) FILTER (WHERE decided_at >= now() - interval '24 hours')::int quyet,
             count(*) FILTER (WHERE created_at >= now() - interval '24 hours')::int vao
        FROM review_queue`);
    so.H1 = h.cho;
    so.H1b = h.quyet;
    ngu.theVao24h = h.vao;
    const [e] = await q(`
      SELECT count(DISTINCT item_id)::int the,
             count(*) FILTER (WHERE (labeled_at AT TIME ZONE '${TZ}')::date = ($1::date - 1))::int hom_qua
        FROM eval_labels`, [homNay]);
    so.D2 = e.the;
    so.H2 = e.hom_qua;

    // Lát: phường của tin S03, dự án, toà.
    const s03Phuong = await q(`
      SELECT coalesce(CASE WHEN a.region_type = 'submarket' THEN a.name END, 'chưa tới phường') ten,
             count(*)::int n, count(*) FILTER (WHERE l.data_level = 'B1')::int b1
        FROM sale_offers o LEFT JOIN areas a ON a.id = o.area_id
       CROSS JOIN LATERAL offer_data_level(o.kind, o.property_type, o.price_vnd, o.area_m2, o.area_id, false) l
       WHERE o.source = 'S03' AND o.retired_at IS NULL
       GROUP BY 1 ORDER BY 2 DESC LIMIT 8`);
    const [lt] = await q(`
      SELECT (SELECT count(*) FILTER (WHERE project_node IS NOT NULL) FROM properties)::int can_co_du_an,
             (SELECT count(*) FROM properties)::int tong_can,
             (SELECT count(*) FROM asset_nodes WHERE node_type = 'building')::int toa,
             (SELECT count(*) FROM sale_offers WHERE source = 'S03' AND retired_at IS NULL AND block_raw IS NOT NULL)::int s03_toa`);
    const lat = { s03Phuong, canCoDuAn: lt.can_co_du_an, tongCan: lt.tong_can, toaDanhMuc: lt.toa, s03CoChuToa: lt.s03_toa };

    return { so, ngu, lat, oGiam };
  } finally {
    await client.query("ROLLBACK");
  }
}

/** Mốc GCM1: số hàng có contract status signed-off trong _acceptance/. */
export function demHangGCM1(root = ROOT) {
  const lt = JSON.parse(readFileSync(path.join(root, "docs/plan/lo-trinh.json"), "utf8"));
  const moc = lt.moc.find((m) => m.ma === "GCM1");
  if (!moc) return null;
  const rows = {};
  (function w(o) {
    if (Array.isArray(o)) return o.forEach(w);
    if (o && typeof o === "object") {
      if (o.ma && o.slug) rows[o.ma] = o;
      Object.values(o).forEach(w);
    }
  })(lt.hang);
  let ky = 0;
  for (const ma of moc.hang) {
    const slug = rows[ma]?.slug;
    const f = slug && path.join(root, "_acceptance", slug, "contract.md");
    if (f && existsSync(f) && /status:\s*signed-off/.test(readFileSync(f, "utf8"))) ky++;
  }
  return { ky, tong: moc.hang.length };
}

/** Ảnh chụp gần nhất trước `ngay` trong thư mục trạng thái. */
export function docHomQua(dir, ngay) {
  if (!existsSync(dir)) return null;
  const f = readdirSync(dir).filter((x) => /^\d{4}-\d{2}-\d{2}\.json$/.test(x) && x.slice(0, 10) < ngay).sort().pop();
  return f ? JSON.parse(readFileSync(path.join(dir, f), "utf8")) : null;
}

function chayAudit() {
  let out = "";
  try {
    out = execFileSync("bash", [path.join(ROOT, "scripts/audit-all.sh")], { encoding: "utf8", timeout: 300000, stdio: ["ignore", "pipe", "ignore"] });
  } catch (e) {
    out = e.stdout ?? "";
  }
  const lines = out.split("\n");
  const tong = lines.find((l) => l.includes("TỔNG KẾT")) ?? "không đọc được dòng tổng kết";
  const fails = lines.filter((l) => l.includes("❌")).map((l) => `- ${l.replace("❌", "").trim()}`);
  return [tong.trim(), ...fails].join("\n");
}

function parseArgs(argv) {
  const a = { json: false, out: null, save: true, audit: false, stateDir: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === "--json") a.json = true;
    else if (k === "--out") a.out = argv[++i];
    else if (k === "--no-save") a.save = false;
    else if (k === "--audit") a.audit = true;
    else if (k === "--state-dir") a.stateDir = argv[++i];
    else throw new Error(`cờ lạ: ${k}`);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const require = createRequire(new URL("../app/package.json", import.meta.url));
  const pg = require("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await client.connect();
  const now = new Date();
  let kq;
  try {
    kq = await gom(client, { now });
  } finally {
    await client.end();
  }
  const gcm = demHangGCM1();
  kq.so.H3 = gcm ? gcm.ky : null;

  const mucTieu = JSON.parse(readFileSync(path.join(HERE, "bao-cao-ngay/muc-tieu.json"), "utf8"));
  const ngay = ngayVN(now);
  const stateDir = args.stateDir ?? stateDirMacDinh();
  const homQua = docHomQua(stateDir, ngay);
  const bang = chamBang(kq.so, homQua?.so ?? null, mucTieu);
  const ctxNgu = { ...kq.ngu, mucTieuTrangThai: mucTieu.trang_thai };
  const gy = goiY(bang, ctxNgu);
  const doLuc = new Intl.DateTimeFormat("vi-VN", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(now);
  const ctx = {
    ngay,
    doLuc,
    mucTieuTrangThai: mucTieu.trang_thai,
    homQuaNgay: homQua?.ngay ?? null,
    bang,
    goiY: gy,
    lat: kq.lat,
    oGiam: kq.oGiam,
    audit: args.audit ? chayAudit() : null,
  };
  const md = dungMarkdown(ctx);
  if (args.save) {
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(path.join(stateDir, `${ngay}.json`), JSON.stringify({ ngay, do_luc: now.toISOString(), so: kq.so, ngu: kq.ngu }, null, 2));
  }
  if (args.out) writeFileSync(args.out, md);
  process.stdout.write(args.json ? JSON.stringify({ ngay, so: kq.so, ngu: kq.ngu, bang, goiY: gy, lat: kq.lat, oGiam: kq.oGiam }, null, 2) + "\n" : md + "\n");
}

const isMain = (() => {
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();
if (isMain) {
  main().catch((e) => {
    console.error(`bao-cao-ngay: ${e.message}`);
    process.exit(1);
  });
}
