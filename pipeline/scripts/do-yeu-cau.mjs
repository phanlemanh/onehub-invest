#!/usr/bin/env node
// do-yeu-cau.mjs — thước lớp bài Yêu cầu (YC0 bang-yeu-cau-noi-lai, AC-9 / E9; lệnh đo của «Đường đo»).
//   node pipeline/scripts/do-yeu-cau.mjs          chỉ đọc: số dòng inquiries (S03), chờ duyệt, nghỉ, theo nguồn ý định — dùng được
//                                                  trên DB máy thu sau khi áp 136 (lệnh kiểm sau); chưa áp 136 thì in một dòng, thoát 0
//   node pipeline/scripts/do-yeu-cau.mjs --kiem   trên bản chép dữ liệu thật (DB thử oneinvest_<…>, lệnh yc0_do_that): một giao dịch
//                                                  ROLLBACK — nạp 045 + 136, transform-zalo, đối chiếu tập bài sống ∪ chờ duyệt với
//                                                  tập đếm độc lập (luật qua nhanhCuaBai ∪ nhãn qua SQL silver_labels, lọc Hỏi-1),
//                                                  sàn 90% mốc từng nguồn, lượt hai không đổi, source chỉ S0x, danh sách bảng sync-cloud
// Đỏ → thoát 1 gọi tên. Phần đánh giá là hàm thuần (danhGia) — do-yeu-cau.test.mjs đo chiều đỏ.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

// Mốc toàn bộ đếm 26/11 trên DB máy thu (design doc «Bảng phủ ca»): luật ∧ model · luật một mình · chỉ model, parsePost không ra loại.
export const MOC = Object.freeze({ luat_va_model: 4946, luat_mot_minh: 18329, chi_model: 1243 });
export const SAN = 0.9;
const NGUON = Object.keys(MOC);
const BANG_YC = ["inquiry_post_records", "inquiries"];

/** Nguồn ý định của một dòng theo phát biểu sống: có luật? nhãn Haiku nói inquiry? */
export function nguonYDinh({ luat, nhanYeuCau }) {
  if (luat && nhanYeuCau) return "luat_va_model";
  if (luat) return "luat_mot_minh";
  if (nhanYeuCau) return "chi_model";
  return "khac";
}

/**
 * Đánh giá thuần. Trả danh sách lỗi (rỗng = xanh), mỗi lỗi một dòng gọi tên.
 * @param {{ trongBang: Map<string, {source: string, nguon: string}>, docLap: Set<string>, lan2: Map<string, string>|null,
 *   lan1: Map<string, string>|null, dsSync: string[], moc?: Record<string, number>, san?: number }} d
 *   trongBang: post_id sống ∪ chờ duyệt → nguồn; docLap: tập đếm độc lập; lan1/lan2: post_id → trạng thái sau lượt một/hai;
 *   dsSync: tên bảng trong FILL ∪ CLOUD_ALLOW của sync-cloud
 */
export function danhGia({ trongBang, docLap, lan1 = null, lan2 = null, dsSync, moc = MOC, san = SAN }) {
  const loi = [];
  const vang = [...docLap].filter((id) => !trongBang.has(id)).sort();
  const thua = [...trongBang.keys()].filter((id) => !docLap.has(id)).sort();
  if (vang.length) loi.push(`VANG ${vang.length} bài (vd ${vang.slice(0, 3).join(", ")})`);
  if (thua.length) loi.push(`THUA ${thua.length} bài (vd ${thua.slice(0, 3).join(", ")})`);
  const dem = Object.fromEntries(NGUON.map((n) => [n, 0]));
  for (const { nguon } of trongBang.values()) if (nguon in dem) dem[nguon]++;
  for (const n of NGUON) {
    if (dem[n] < Math.ceil(moc[n] * san)) loi.push(`DUOI SAN ${n}: ${dem[n]} < ${Math.ceil(moc[n] * san)} (${san * 100}% mốc ${moc[n]})`);
  }
  const nguonLa = [...new Set([...trongBang.values()].map((r) => r.source))].filter((s) => !/^S0\d$/.test(s));
  if (nguonLa.length) loi.push(`SOURCE KHONG PHAI S0x: ${nguonLa.join(", ")}`);
  if (lan1 && lan2) {
    const doi = [...new Set([...lan1.keys(), ...lan2.keys()])].filter((id) => lan1.get(id) !== lan2.get(id)).sort();
    if (doi.length) loi.push(`LAN HAI DOI ${doi.length} bài (vd ${doi.slice(0, 3).join(", ")})`);
  }
  if (!dsSync.includes("sale_offers")) loi.push("SYNC: không đọc được danh sách bảng (thiếu sale_offers — đối chứng dương)");
  for (const b of BANG_YC) if (dsSync.includes(b)) loi.push(`SYNC CO ${b}`);
  return { loi, dem };
}

/** Bảng mà sync-cloud đẩy lên: FILL ∪ khoá CLOUD_ALLOW. */
export async function dsSyncCloud() {
  const { CLOUD_ALLOW, FILL } = await import("../sync-cloud.mjs");
  return [...new Set([...FILL, ...Object.keys(CLOUD_ALLOW)])];
}

/** Dòng Yêu cầu sống ∪ chờ duyệt (chưa nghỉ) của S03 kèm nguồn ý định đọc từ phát biểu sống. */
export async function docBang(c) {
  const { rows } = await c.query(`
    SELECT r.originating_system_key AS post_id, r.source, r.intent_status,
           EXISTS (SELECT 1 FROM field_assertions f WHERE f.subject_key = r.inquiry_id AND f.field = 'listing_intent'
                     AND f.retracted_at IS NULL AND f.rule_id = 'yeu-cau-luat') AS luat,
           EXISTS (SELECT 1 FROM field_assertions f WHERE f.subject_key = r.inquiry_id AND f.field = 'listing_intent'
                     AND f.retracted_at IS NULL AND f.method = 'e2_llm' AND f.value = 'inquiry') AS nhan_yeu_cau
      FROM inquiry_post_records r
     WHERE r.retired_at IS NULL AND r.source = 'S03'`);
  return new Map(rows.map((r) => [r.post_id, { source: r.source, trangThai: r.intent_status, nguon: nguonYDinh({ luat: r.luat, nhanYeuCau: r.nhan_yeu_cau }) }]));
}

/**
 * Tập đếm độc lập (không qua bộ ghi): bài S03 thật (loadStgPosts gạt bài thử) có chữ mà luật nhận (nhanhCuaBai = yeu-cau) ∪ bài mà
 * nhãn Haiku hợp lệ mới nhất (câu SQL viết riêng ở đây) nói inquiry và parsePost không ra loại (Hỏi-1).
 */
export async function docLapTap(c) {
  const { loadStgPosts } = await import("../lib/test-posts.mjs");
  const { NHANH, nhanhCuaBai } = await import("../lib/nhanh-bai-s03.mjs");
  const { laChiAnh } = await import("../lib/gop-anh.mjs");
  const { parsePost } = await import("../transform-zalo.mjs");
  const { posts } = await loadStgPosts(c, "zalo");
  const { rows } = await c.query(`
    WITH hop_le AS (
      SELECT post_id, listing_intent, row_number() OVER (PARTITION BY post_id ORDER BY labeled_at DESC, label_id DESC) AS rn
        FROM silver_labels
       WHERE source_code = 'S03' AND json_ok AND listing_intent IS NOT NULL AND lower(model) LIKE '%haiku%')
    SELECT post_id FROM hop_le WHERE rn = 1 AND listing_intent = 'inquiry'`);
  const nhan = new Set(rows.map((r) => r.post_id));
  const out = new Set();
  const trong = new Set();
  for (const p of posts) {
    if (laChiAnh(p.text)) continue;
    if (nhanhCuaBai(p, trong) === NHANH.yeuCau) out.add(p.post_id);
    else if (nhan.has(p.post_id) && !parsePost(p.text ?? "").kind) out.add(p.post_id);
  }
  return out;
}

const trangThai = (m) => new Map([...m].map(([k, v]) => [k, v.trangThai]));
const im = async (fn) => { const log = console.log; console.log = () => {}; try { return await fn(); } finally { console.log = log; } };

async function chiDoc(c) {
  const { rows: [co] } = await c.query("SELECT to_regclass('inquiry_post_records') IS NOT NULL AS co");
  if (!co.co) { console.log("do-yeu-cau: chưa áp 136 — chưa có bảng Yêu cầu"); return 0; }
  const { rows: [r] } = await c.query(`SELECT
      (SELECT count(*) FROM inquiries WHERE source = 'S03')::int AS song,
      count(*) FILTER (WHERE retired_at IS NULL AND intent_status = 'cho-duyet')::int AS cho_duyet,
      count(*) FILTER (WHERE retired_at IS NOT NULL)::int AS nghi
      FROM inquiry_post_records WHERE source = 'S03'`);
  const bang = await docBang(c);
  const dem = {};
  for (const { nguon } of bang.values()) dem[nguon] = (dem[nguon] ?? 0) + 1;
  console.log(`inquiries S03: ${r.song} · chờ duyệt ${r.cho_duyet} · nghỉ ${r.nghi}`);
  console.log(`theo nguồn ý định (sống ∪ chờ duyệt): ${JSON.stringify(dem)} · mốc toàn bộ ${JSON.stringify(MOC)}`);
  return 0;
}

async function kiem(c, url) {
  if (!/\/oneinvest_[a-z0-9_]+(\?.*)?$/.test(url)) {
    console.error("do-yeu-cau --kiem: chỉ chạy trên DB thử oneinvest_<…> (db/db-thu.sh), không chạy trên oneinvest");
    return 2;
  }
  const { napPhatBieu } = await import("../lib/nap-045.mjs");
  const { napYeuCau } = await import("../lib/nap-136.mjs");
  const { runTransformZalo } = await import("../transform-zalo.mjs");
  await c.query("BEGIN");
  try {
    await c.query("SELECT pg_advisory_xact_lock(33033)");
    await napPhatBieu(c);
    await napYeuCau(c);
    let t = Date.now();
    const l1 = await im(() => runTransformZalo(c));
    console.log(`lượt một: ${((Date.now() - t) / 1000).toFixed(1)} giây · ${JSON.stringify(l1.yeuCau)}`);
    const bang1 = await docBang(c);
    t = Date.now();
    const l2 = await im(() => runTransformZalo(c));
    console.log(`lượt hai: ${((Date.now() - t) / 1000).toFixed(1)} giây · ${JSON.stringify(l2.yeuCau)}`);
    const bang2 = await docBang(c);
    const docLap = await docLapTap(c);
    const { loi, dem } = danhGia({ trongBang: bang2, docLap, lan1: trangThai(bang1), lan2: trangThai(bang2), dsSync: await dsSyncCloud() });
    const song = [...bang2.values()].filter((r) => r.trangThai === "song").length;
    console.log(`bài sống ${song} · chờ duyệt ${bang2.size - song} · đếm độc lập ${docLap.size}`);
    console.log(`theo nguồn: ${JSON.stringify(dem)} · sàn ${SAN * 100}% của ${JSON.stringify(MOC)}`);
    if (l2.yeuCau && (l2.yeuCau.them || l2.yeuCau.themPhatBieu)) loi.push(`LAN HAI THEM ${l2.yeuCau.them} dòng, ${l2.yeuCau.themPhatBieu} phát biểu`);
    for (const x of loi) console.error(`  ${x}`);
    return loi.length ? 1 : 0;
  } finally {
    await c.query("ROLLBACK").catch(() => {});
  }
}

async function main() {
  const url = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  let code;
  try {
    code = process.argv.includes("--kiem") ? await kiem(c, url) : await chiDoc(c);
  } finally {
    await c.end();
  }
  if (process.argv.includes("--kiem")) console.log(code ? "do-yeu-cau: ĐỎ" : "do-yeu-cau: xanh");
  process.exit(code);
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
