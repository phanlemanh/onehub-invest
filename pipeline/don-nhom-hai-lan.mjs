// don-nhom-hai-lan.mjs — hồ sơ _acceptance/nhom-hai-lan-s03-xu-goc: dọn dòng sổ của nhóm S03 đăng ký hai lần (Hỏi-1, lối A).
//   node don-nhom-hai-lan.mjs [--ghi]               mặc định chỉ in; --ghi chuyển dòng phụ sang `retired`, giữ dòng và mã
//   node don-nhom-hai-lan.mjs --hoan-lai [--ghi]    trả dòng đã dọn về trạng thái cũ theo ops_audit
// Một giao dịch. Stdout và nhật ký chỉ mang số đếm, mã đơn vị: không khoá nhóm, không tên nhóm.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { donViTheoNhomThat } from "./lib/eval-labels.mjs";

const ACTOR = "machine:don-nhom-hai-lan";
const DON = "unit.retire_duplicate";
const HOAN = "unit.restore_duplicate";
const CUOI = ["retired", "completed"];
const hieuLuc = (r) => !CUOI.includes(r.status);
const cungTap = (a, b) => [...new Set(a)].sort().join("\n") === [...new Set(b)].sort().join("\n");

/**
 * Xét từng nhóm thật có nhiều dòng. Nhóm đã hết dòng phụ hiệu lực thì không có gì để dọn. Nhóm không dọn được vì dọn sẽ mất thông
 * tin hoặc để nhóm không còn dòng hiệu lực thì vào `bo_qua` kèm lý do.
 * @param {{ unit_code: string, group_key: string, status: string, note: string|null, market_codes: string[], project_node_ids: (string|number)[] }[]} so
 */
export function xetNhomHaiLan(so) {
  const theoMa = new Map(so.map((r) => [r.unit_code, r]));
  const don = [];
  const bo_qua = [];
  for (const { khoa, khoa_dai_dien, unit_code, gop_tu } of donViTheoNhomThat(so).gop) {
    const dai = theoMa.get(unit_code);
    const phu = gop_tu.map((m) => theoMa.get(m));
    const conPhu = phu.filter(hieuLuc);
    if (conPhu.length === 0) continue;
    const lyDo = khoa_dai_dien !== khoa ? "khong co dong khoa tran"
      : !hieuLuc(dai) ? "dai dien da go"
      : phu.some((r) => (r.note ?? "") !== (dai.note ?? "")) ? "lech the"
      : phu.some((r) => !cungTap(r.market_codes, dai.market_codes)) ? "lech thi truong"
      : phu.some((r) => !cungTap(r.project_node_ids.map(String), dai.project_node_ids.map(String))) ? "lech du an"
      : null;
    if (lyDo) bo_qua.push({ unit_code, gop_tu, ly_do: lyDo });
    else don.push({ dai_dien: unit_code, phu: conPhu });
  }
  return { don, bo_qua };
}

/** Thân ghi trong SAVEPOINT: lỗi ở bất kỳ dòng nào thì không dòng nào đổi. Người gọi giữ giao dịch. */
async function trongDiemLui(client, viec) {
  await client.query("SAVEPOINT don_nhom");
  try {
    await viec();
    await client.query("RELEASE SAVEPOINT don_nhom");
  } catch (e) {
    await client.query("ROLLBACK TO SAVEPOINT don_nhom").catch(() => {});
    throw e;
  }
}

export async function donNhomHaiLan(client, { ghi = false, out = console.log } = {}) {
  const { rows: so } = await client.query(
    `SELECT id, unit_code, group_key, status, reason, resume_when, note, market_codes, project_node_ids
       FROM collection_units WHERE source_code = 'S03' ORDER BY unit_code FOR UPDATE`);
  const { don, bo_qua } = xetNhomHaiLan(so);
  for (const { dai_dien, phu } of don) out(`don: giu ${dai_dien}, phu ${phu.map((r) => r.unit_code).join(", ")}`);
  for (const { unit_code, gop_tu, ly_do } of bo_qua) out(`bo qua: ${unit_code}, ${gop_tu.join(", ")}: ${ly_do}`);
  if (ghi) {
    await trongDiemLui(client, async () => {
      for (const { dai_dien, phu } of don) for (const r of phu) {
        await client.query(
          "UPDATE collection_units SET status = 'retired', reason = $2, resume_when = NULL, updated_at = now() WHERE id = $1",
          [r.id, `Đăng ký hai lần, gộp về ${dai_dien}`]);
        await client.query(
          "INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, $2, 'local', $3::jsonb)",
          [ACTOR, DON, JSON.stringify({ unit_code: r.unit_code, dai_dien, status_cu: r.status, reason_cu: r.reason, resume_when_cu: r.resume_when })]);
      }
    });
  }
  const so_phu = don.reduce((n, x) => n + x.phu.length, 0);
  const dem = { nhom_don: don.length, dong_phu: so_phu, bo_qua: bo_qua.length, da_ghi: ghi ? so_phu : 0 };
  out(JSON.stringify(dem));
  return dem;
}

/** Trả dòng đã dọn về trạng thái cũ. Dòng nhật ký mới nhất của từng mã quyết định, nên hoàn lại hai lần không đổi gì thêm. */
export async function hoanLaiDon(client, { ghi = false, out = console.log } = {}) {
  const { rows } = await client.query(
    `SELECT * FROM (
       SELECT DISTINCT ON (detail->>'unit_code') action, detail FROM ops_audit
        WHERE actor = $1 AND action = ANY ($2) ORDER BY detail->>'unit_code', id DESC) t
      WHERE action = $3 ORDER BY detail->>'unit_code'`, [ACTOR, [DON, HOAN], DON]);
  for (const { detail } of rows) out(`hoan lai: ${detail.unit_code} ve ${detail.status_cu}`);
  if (ghi) {
    await trongDiemLui(client, async () => {
      for (const { detail: d } of rows) {
        await client.query(
          "UPDATE collection_units SET status = $2, reason = $3, resume_when = $4, updated_at = now() WHERE source_code = 'S03' AND unit_code = $1",
          [d.unit_code, d.status_cu, d.reason_cu, d.resume_when_cu]);
        await client.query(
          "INSERT INTO ops_audit (actor, action, env, detail) VALUES ($1, $2, 'local', $3::jsonb)",
          [ACTOR, HOAN, JSON.stringify({ unit_code: d.unit_code })]);
      }
    });
  }
  const dem = { dong_hoan: rows.length, da_ghi: ghi ? rows.length : 0 };
  out(JSON.stringify(dem));
  return dem;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN");
    const viec = process.argv.includes("--hoan-lai") ? hoanLaiDon : donNhomHaiLan;
    await viec(client, { ghi: process.argv.includes("--ghi") });
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
