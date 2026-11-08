#!/usr/bin/env node
// do3-dung-thu.mjs — DO3 do-lam-giau: dựng số trên DB thử để chụp khối «Làm giàu» của /ops/quality ở S4 (E8). Số bịa, không gọi
// model: tin, bài, Người, liên lạc mang mã do3dt<lượt>, ghi bằng bên ghi thật (writeAssertions, retractRule, ganSdtQuaNguoi), rồi
// chạy doLamGiau thật với write: true cho ngày D−7 (lập mốc + kiểm ngược tuần trước), D−1 và D (giờ VN, D = hôm nay).
//   DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_do3 node pipeline/scripts/do3-dung-thu.mjs
// CHỈ chạy trên DB tên oneinvest_p2_* (từ chối mọi DB khác, nhất là oneinvest dùng chung). DB thử phải đã áp 086.
// Chạy lại được: dọn dòng do3-*, ảnh chụp và dòng đổi rồi dựng lại với mã lượt mới (bản ghi bịa của lượt cũ thành phần nền,
// không xoá tin — luật NL-AC-8). Khối có: hai đường có số (số qua người đăng, quy ước nhóm), hai đường «Chưa chạy», kiểm ngược
// tuần này và tuần trước.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { doLamGiau } from "../do-lam-giau.mjs";
import { retractRule, writeAssertions } from "../lib/assert.mjs";
import { ngayVn } from "../lib/do-hang-ngay.mjs";
import { daCoLamGiau } from "../lib/do-lam-giau-db.mjs";
import { ganSdtQuaNguoi } from "../lib/gan-sdt-qua-nguoi.mjs";
import { SQL_LL } from "../lib/lien-lac-nguoi.mjs";
import { LOAI_HINH_VERSION } from "../transform-zalo.mjs";

const DB_THU = /^oneinvest_p2_[a-z0-9_]+$/;
const CROCK = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const yen = { out: () => {} };

/** Tên DB trong chuỗi nối (kiểm trước khi nối). */
function tenDb(url) {
  try { return decodeURIComponent(new URL(url).pathname.replace(/^\//, "")); } catch { return ""; }
}
/** Chỉ DB thử oneinvest_p2_*. */
const laDbThu = (ten) => DB_THU.test(ten ?? "");

const congNgay = (ngay, n) => { const d = new Date(`${ngay}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/**
 * Dựng số DO3 bịa trong giao dịch của người gọi (không BEGIN/COMMIT): dọn dòng do3-* và ảnh chụp, ghi tin/Người/phát biểu bịa
 * bằng bên ghi thật, chạy doLamGiau ngày DW (lập mốc), D1, D với write: true. Test DO3-AC-7 gọi hàm này trong giao dịch ROLLBACK.
 * @param {import("pg").Client} c @param {{ D?: string, D1?: string, DW?: string, log?: (s: string) => void }} [o]
 */
export async function dungThu(c, { D = ngayVn(Date.now()), D1 = congNgay(D, -1), DW = congNgay(D, -7), log = console.log } = {}) {
  const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
  if (db === "oneinvest") throw new Error("do3-dung-thu: không dựng số bịa trên DB oneinvest dùng chung");
  if (!(await daCoLamGiau(c))) throw new Error("do3-dung-thu: DB thử chưa áp 086 — áp trước (db/migrations/086_lam_giau.sql)");
  const luot = Date.now().toString(36).slice(-6);
  let seq = 0;
  const ma26 = () => { let x = parseInt(luot, 36) * 100 + ++seq, s = ""; for (let i = 0; i < 21; i++) { s = CROCK[x % 32] + s; x = Math.floor(x / 32); } return `D03DT${s}`; };
  const so = (i) => `+84399${String((parseInt(luot, 36) * 10 + i) % 1e6).padStart(6, "0")}`;
  const tag = `do3dt${luot}`;

  // Dọn số DO3 cũ (DB thử) và mở cổng cắt chuyển nếu bản chép chưa có.
  await c.query("DELETE FROM dq_check_results WHERE check_name LIKE 'do3-%'");
  await c.query("DELETE FROM enrichment_value_state; DELETE FROM enrichment_value_change");
  await c.query(`INSERT INTO ops_audit (actor, action, env, detail) SELECT 'do3-dung-thu', 'phat-bieu:cat-chuyen', 'local', '{"db_thu": true}'::jsonb
                  WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  const snap = `hanoi__${tag}__2099-01-01T000000`;
  await c.query(`INSERT INTO airbnb_snapshots (snapshot_id, city, source, manifest) VALUES ($1, 'hanoi', 'do3-dung-thu', '{}') ON CONFLICT DO NOTHING`, [snap]);
  const { rows: phuong } = await c.query("SELECT id FROM areas WHERE region_type = 'submarket' AND id LIKE 'vn-hanoi-%' ORDER BY id LIMIT 3");
  const area = (i) => phuong.length ? phuong[i % phuong.length].id : null;

  const tin = async (ma, { sender = null, i = 0 } = {}) => {
    const pid = `${tag}${ma}`, oid = `offer_${pid}`;
    await c.query(`INSERT INTO stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, sender_id, sender_name)
                   VALUES ($1, $2, 'openclaw-hook', 'Nhóm thử DO3', $3, now(), $4, $5) ON CONFLICT DO NOTHING`,
    [pid, snap, `[thử DO3] bán căn ${ma} 2pn 62m2 giá 3,4 tỷ`, sender, sender ? "Người thử DO3" : null]);
    await c.query(`INSERT INTO sale_offer_records (offer_id, originating_system_key, kind, price_vnd, area_m2, area_id, first_seen, last_seen, post_ids,
                     source, seller_ref, seller_name)
                   VALUES ($1, $2, 'sale', 3400000000, 62, $3, now(), now(), ARRAY[$2], 'S03', $4, $5) ON CONFLICT (offer_id) DO NOTHING`,
    [oid, pid, area(i), sender, sender ? "Người thử DO3" : null]);
    return { oid, sk: `S03:${pid}` };
  };
  const nguoi = async (sender) => {
    const pk = `pty_${ma26()}`;
    await c.query("INSERT INTO parties (party_key, source) VALUES ($1, 'S03')", [pk]);
    await c.query("INSERT INTO registry_aliases (object_key, kind, value, source) VALUES ($1, 'tai_khoan_nguon', $2, 'S03')", [pk, sender]);
    return pk;
  };
  const lienLac = async (pk, sdt) => Number((await c.query(
    `INSERT INTO party_contacts (party_key, kind, value, evidence_tier, method, rule_id, evidence, run_id)
     VALUES ($1, 'sdt', $2, 'observed', 'parser', 'so_trong_bai', '{}', 'do3-dung-thu') RETURNING id`, [pk, sdt])).rows[0].id);
  const pbNhom = (sk, value = "apartment") => ({ subject_key: sk, field: "property_type", value, evidence_tier: "inferred",
    method: "e1_rule", method_version: LOAI_HINH_VERSION, rule_id: "loai-hinh-nhom" });
  const ghiNhom = (rows) => writeAssertions(c, rows, { replaceOwn: true });
  const tom = (kq) => kq.dq.map((r) => `${r.check_name}:${r.entity}=${r.status}${r.detail.ly_do ? `(${r.detail.ly_do})` : ""}`).join(" ");

  // Nền: số qua người đăng của bản chép ổn định trước lần lập mốc.
  await ganSdtQuaNguoi(c, yen);
  log(`do3-dung-thu ${DW}: ${tom(await doLamGiau(c, { ngay: DW, write: true }))}`);

  // Ngày D−1: 3 tin nhận số qua người đăng, 6 phát biểu quy ước nhóm mới.
  const ll = {}, pk = {};
  for (const [i, x] of ["A", "B", "C"].entries()) {
    pk[x] = await nguoi(`${tag}s${x}`);
    ll[x] = await lienLac(pk[x], so(i + 1));
    await tin(`s${x}`, { sender: `${tag}s${x}`, i });
  }
  await ganSdtQuaNguoi(c, yen);
  const nhom = [];
  for (let i = 1; i <= 6; i++) nhom.push(await tin(`n${i}`, { i }));
  await ghiNhom(nhom.map((t) => pbNhom(t.sk)));
  log(`do3-dung-thu ${D1}: ${tom(await doLamGiau(c, { ngay: D1, write: true }))}`);

  // Ngày D: số — A mất số (máy rút), C đổi số, D nhận số; nhóm — n1 đổi loại hình, n2 người thay, n3 máy rút, n7 mới.
  await c.query(SQL_LL.rut, [[ll.A], "so-chung"]);
  await c.query(SQL_LL.rut, [[ll.C], "so-chung"]);
  await lienLac(pk.C, so(4));
  pk.D = await nguoi(`${tag}sD`);
  await lienLac(pk.D, so(5));
  await tin("sD", { sender: `${tag}sD`, i: 1 });
  await ganSdtQuaNguoi(c, yen);
  await ghiNhom([pbNhom(nhom[0].sk, "house")]);
  await retractRule(c, [nhom[1].sk], "property_type", "loai-hinh-nhom", "hitl-thay");
  await retractRule(c, [nhom[2].sk], "property_type", "loai-hinh-nhom", "thay-boi-luot");
  const n7 = await tin("n7", { i: 2 });
  await ghiNhom([pbNhom(n7.sk)]);
  log(`do3-dung-thu ${D}: ${tom(await doLamGiau(c, { ngay: D, write: true }))}`);
  return { tag, D, D1, DW, areas: phuong.map((r) => r.id) };
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  if (!laDbThu(tenDb(url))) {
    console.error(`do3-dung-thu: chỉ chạy trên DB thử oneinvest_p2_*, không phải «${tenDb(url) || "(trống)"}»`);
    process.exit(2);
  }
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    const { rows: [{ db }] } = await c.query("SELECT current_database() AS db");
    if (!laDbThu(db)) throw new Error(`do3-dung-thu: chỉ chạy trên DB thử oneinvest_p2_*, không phải «${db}»`);
    await c.query("BEGIN");
    await c.query("SELECT pg_advisory_xact_lock(56086)");
    const kq = await dungThu(c);
    await c.query("COMMIT");
    console.log(`do3-dung-thu: ${db} — lượt ${kq.tag}; khối «Làm giàu» có ngày ${kq.D1}, ${kq.D} và kiểm ngược hai tuần`);
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally { await c.end(); }
}
const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
