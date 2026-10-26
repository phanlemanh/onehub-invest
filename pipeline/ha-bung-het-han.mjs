#!/usr/bin/env node
// ha-bung-het-han.mjs — máy hạ chế độ thu Bùng → Duy trì (C7 vết dầu loang, docs/plan/vet-dau-loang-thu-thap-2510.md
// §1.4: «giảm tải thì máy tự làm»; BÙNG có hạn, không để «bùng mãi»). Bước đầu của scripts/cloud-sync.sh (15′, máy thu).
//
//   haBungHetHan(client, { now }) — mọi điểm `params.mode = bung` mà `burst_until` trước hôm nay giờ VN (het-han) hoặc
//     thiếu/hỏng hạn (thieu-han) → duy_tri, mode_since = hôm nay, gỡ burst_until. Một giao dịch; mỗi điểm một dòng
//     ops_audit (machine:ha-bung-het-han, source-group:mode-auto). Audit hỏng → ROLLBACK cả lượt và ném lỗi.
//   haVeDuyTri(client, id, lyDo, { now }) — hạ một điểm đang Bùng với lý do cho trước (đạt kho, bão hoà, vấp rào): cửa
//     cho collector V1 (làn ZCode). Điểm không ở Bùng → false, không ghi gì.
// Hạn bùng là ngày cuối còn bùng (cùng luật app/src/lib/che-do-thu-luat.ts). Dòng in và detail audit chỉ mang mã nguồn +
// id — group_key của S05 là URL nhóm (tầng A). Không điểm nào bị hạ thì không in gì.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";
const ACTOR = "machine:ha-bung-het-han";
const NGAY = /^\d{4}-\d{2}-\d{2}$/;

/** Hôm nay giờ VN theo mốc `now`, tính ở DB để cùng một đồng hồ múi giờ với Postgres. */
async function homNayVN(client, now) {
  const { rows } = await client.query(
    `SELECT to_char($1::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') AS h`,
    [now.toISOString()],
  );
  return rows[0].h;
}

/** Ghi một lần hạ (params + audit) trong giao dịch đang mở của `client`. */
async function ha(client, { id: idDb, source_code, han }, lyDo, homNay) {
  const id = Number(idDb); // bigserial → pg trả chuỗi; id điểm nhỏ, cùng kiểu số với datCheDo
  await client.query(
    `UPDATE source_groups
        SET params = (params - 'burst_until') || jsonb_build_object('mode', 'duy_tri', 'mode_since', $2::text),
            updated_at = now()
      WHERE id = $1`,
    [id, homNay],
  );
  await client.query(
    `INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, 'source-group:mode-auto', 'local', $2::jsonb)`,
    [ACTOR, JSON.stringify({ id, source_code, from: "bung", to: "duy_tri", ly_do: lyDo, burst_until: han })],
  );
}

async function trongGiaoDich(client, fn) {
  await client.query("BEGIN");
  try {
    const r = await fn();
    await client.query("COMMIT");
    return r;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/**
 * @param {import("pg").Client} client
 * @param {{ now?: Date }} [opts]
 * @returns {Promise<{ id: number, source_code: string, ly_do: string, burst_until: string | null }[]>}
 */
export async function haBungHetHan(client, { now = new Date() } = {}) {
  const homNay = await homNayVN(client, now);
  return trongGiaoDich(client, async () => {
    const { rows } = await client.query(
      `SELECT id, source_code, params->>'burst_until' AS han
         FROM source_groups WHERE params->>'mode' = 'bung' ORDER BY id FOR UPDATE`,
    );
    const daHa = [];
    for (const r of rows) {
      const lyDo = !NGAY.test(r.han ?? "") ? "thieu-han" : r.han < homNay ? "het-han" : null;
      if (!lyDo) continue;
      await ha(client, r, lyDo, homNay);
      daHa.push({ id: Number(r.id), source_code: r.source_code, ly_do: lyDo, burst_until: r.han });
    }
    return daHa;
  });
}

/**
 * @param {import("pg").Client} client
 * @param {number} id
 * @param {string} lyDo
 * @param {{ now?: Date }} [opts]
 */
export async function haVeDuyTri(client, id, lyDo, { now = new Date() } = {}) {
  if (typeof lyDo !== "string" || !lyDo.trim()) throw new Error("haVeDuyTri: thiếu lý do hạ");
  const homNay = await homNayVN(client, now);
  return trongGiaoDich(client, async () => {
    const { rows } = await client.query(
      `SELECT id, source_code, params->>'burst_until' AS han
         FROM source_groups WHERE id = $1 AND params->>'mode' = 'bung' FOR UPDATE`,
      [id],
    );
    if (!rows[0]) return false;
    await ha(client, rows[0], lyDo, homNay);
    return true;
  });
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows } = await c.query("SELECT to_regclass('source_groups') IS NOT NULL AS ok");
    if (!rows[0].ok) return; // DB không có bảng điểm thu (cloud) — không có gì để hạ
    for (const x of await haBungHetHan(c)) {
      console.log(`hạ ${x.source_code}#${x.id} bung→duy_tri (${x.ly_do}, hạn ${x.burst_until ?? "—"})`);
    }
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
