// nap-045.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (PL15): nạp migration 045 và mở cổng «chưa cắt chuyển»
// trong giao dịch, để transform / writeOffers / apply_enrichment chạy được bất kể DB local đã áp 045 hay đã cắt chuyển.
// KHÔNG dùng ngoài giao dịch sẽ ROLLBACK: dòng ops_audit mở cổng không được ở lại DB thật (cắt chuyển thật là lệnh
// pipeline/phat-bieu-cat-chuyen.mjs).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { napLai061 } from "./nap-061.mjs";

const MIG = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/045_phat_bieu_va_phan_xu.sql"), "utf8");
/** Phần hàm của 045 (mục 6–8): nạp lại khi DB đã áp, tránh ALTER bảng dùng chung (khoá độc quyền) trong test. */
const HAM = MIG.slice(MIG.indexOf("-- 6. Bộ phân xử"));

// PL19: 059 thay apply_enrichment + resolve_offer_fields của 045 (observed_at bắt buộc, trạng thái chào) và đổi trục
// field_assertions.field. Nạp lại 045 trên DB đã áp 059 sẽ đè các hàm và dòng sổ ấy → nạp lại phần tương ứng của 059
// (dòng sổ + hàm §3–§5, không DDL bảng) ngay sau.
const TEP_059 = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/059_thoi_gian_hieu_luc.sql");
const MIG_059 = existsSync(TEP_059) ? readFileSync(TEP_059, "utf8") : "";
export const SAU_045_CUA_059 = MIG_059
  ? MIG_059.slice(MIG_059.indexOf("-- Sổ từ vựng (node pipeline/vocab.mjs --emit-seed, các dòng của trục/cột mới)"),
    MIG_059.indexOf("-- 6. Lịch sử giá"))
  : "";

// 063 thay apply_enrichment (bản 059) và revert_enrichment (bản 045): phân xử lại mọi tin chung post. Nạp lại 045/059
// đè hai hàm ấy → nạp lại phần hàm của 063 (trước mục 4 sửa dữ liệu — mục ấy không chạy trong test) ngay sau 059.
const TEP_063 = join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/063_phat_bieu_theo_bai_dang.sql");
const MIG_063 = existsSync(TEP_063) ? readFileSync(TEP_063, "utf8") : "";
export const HAM_063 = MIG_063 ? MIG_063.slice(0, MIG_063.indexOf("-- 4. Sửa dữ liệu một lần")) : "";

/** Gọi ngay sau mọi lần nạp lại 045 trong giao dịch: DB đã áp 059 → nạp lại phần 059 mà 045 vừa đè, rồi hàm 063. */
export async function napLai059(client) {
  if (!SAU_045_CUA_059) return;
  const { rows } = await client.query("SELECT to_regclass('history_transactional') IS NOT NULL AS co");
  if (!rows[0].co) return;
  await client.query(SAU_045_CUA_059);
  if (HAM_063) await client.query(HAM_063);
}

/**
 * @param {import("pg").Client} client đang ở trong giao dịch
 * @param {{ moCong?: boolean }} [opts] moCong=false: chỉ nạp 045, để cổng như DB (ca đo cổng)
 */
export async function napPhatBieu(client, { moCong = true } = {}) {
  const { rows } = await client.query("SELECT to_regclass('field_assertions') IS NOT NULL AS co");
  await client.query(rows[0].co ? HAM : MIG);
  await napLai059(client);
  await napLai061(client);
  if (moCong) {
    await client.query(`INSERT INTO ops_audit (actor, action, env, detail)
      SELECT 'test:phat-bieu', 'phat-bieu:cat-chuyen', 'local', '{"giao_dich_thu": true}'::jsonb
       WHERE NOT EXISTS (SELECT 1 FROM ops_audit WHERE action = 'phat-bieu:cat-chuyen')`);
  }
}
