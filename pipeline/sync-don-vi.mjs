#!/usr/bin/env node
// sync-don-vi.mjs — PL12 `so-nhom-mot-noi`: đưa đơn vị thu S03 (nhóm) và S02 (market) vào sổ collection_units.
// Chạy tay ở máy thu: node pipeline/sync-don-vi.mjs [--chi S02|S03]. KHÔNG chạy ở cloud (sổ là tầng A, chưa lên cloud).
//
// S03: đọc tệp cấu hình gateway CHỈ ĐỌC (readFile — luật 8: không ghi, không gọi lệnh gateway nào), lấy mọi nhóm có hiệu
// lực theo readS03Groups. Bật → active; có mà tắt → paused «tắt ở gateway»; vắng khỏi cấu hình → paused «không còn ở
// gateway» (Hỏi-4: giữ dòng, giữ mã; quay lại → active trên CÙNG dòng). Không chạm đơn vị retired/completed. Trạng thái
// S03 trong sổ là bản soi của gateway — bật/tắt nhóm từ sổ là việc của TV6.
// S02: mỗi market một đơn vị; market_codes lấy từ area_sources (nguồn S02) CHỈ khi dòng đang rỗng — khai tay thắng.
//
// Tệp cấu hình thiếu hay hỏng → thoát 1 trước khi mở DB (sổ không đổi). Cả lượt một giao dịch; lỗi DB → thoát 2.
// stdout chỉ in số đếm — không khoá nhóm, không tên.
import { readFile } from "node:fs/promises";
import { realpathSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readS03Groups } from "../scripts/lib/ops-local.mjs";

export const LY_DO_TAT = "tắt ở gateway";
export const LY_DO_VANG = "không còn ở gateway";
export const TEN_CHUA_CO = "Nhóm S03 chưa có tên"; // tiêu đề chuẩn là ON19
const CUOI = ["retired", "completed"];

/** Đường tệp cấu hình gateway; biến môi trường để phép đo trỏ sang tệp tạm. */
export function duongCauHinh() {
  return process.env.ONEHUB_GATEWAY_CONFIG ?? path.join(homedir(), ".openclaw", "openclaw.json");
}

/** Nhóm S03 từ tệp cấu hình — ném khi tệp vắng, JSON hỏng hay thiếu khối kênh. */
export async function docNhomGateway(file = duongCauHinh()) {
  const cfg = JSON.parse(await readFile(file, "utf8"));
  const z = cfg?.channels?.zalouser;
  if (!z || typeof z !== "object") throw new Error("cấu hình gateway thiếu khối kênh S03");
  return readS03Groups(z);
}

/** Upsert đơn vị S03 theo danh sách nhóm. `client` đang trong giao dịch của bên gọi. */
export async function dongBoS03(client, nhom) {
  const dem = { them: 0, doi: 0, giu: 0 };
  const { rows } = await client.query(
    `SELECT id, group_key, status, reason FROM collection_units WHERE source_code = 'S03' FOR UPDATE`,
  );
  const cu = new Map(rows.map((r) => [r.group_key, r]));
  const datTrangThai = async (r, status, reason) => {
    if (CUOI.includes(r.status) || (r.status === status && (r.reason ?? null) === reason)) {
      dem.giu++;
      return;
    }
    await client.query(
      `UPDATE collection_units SET status = $2, reason = $3, resume_when = NULL, updated_at = now() WHERE id = $1`,
      [r.id, status, reason],
    );
    dem.doi++;
  };
  for (const { key, enabled } of nhom) {
    const status = enabled ? "active" : "paused";
    const reason = enabled ? null : LY_DO_TAT;
    const r = cu.get(key);
    if (r) {
      await datTrangThai(r, status, reason);
      cu.delete(key);
    } else {
      await client.query(
        `INSERT INTO collection_units (source_code, group_key, name, status, reason) VALUES ('S03', $1, $2, $3, $4)`,
        [key, TEN_CHUA_CO, status, reason],
      );
      dem.them++;
    }
  }
  for (const r of cu.values()) await datTrangThai(r, "paused", LY_DO_VANG);
  return dem;
}

/** Upsert một đơn vị mỗi market S02. Khoá đơn vị = khoá chính của bảng market (đọc từ catalog, không viết tay). */
export async function dongBoS02(client) {
  const dem = { them: 0, doi: 0, giu: 0 };
  const bang = "airdna_markets";
  const { rows: pk } = await client.query(
    `SELECT a.attname FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
      WHERE i.indrelid = $1::regclass AND i.indisprimary`,
    [bang],
  );
  if (pk.length !== 1) throw new Error("bảng market S02 không có khoá chính một cột");
  const { rows: markets } = await client.query(
    `SELECT to_jsonb(m) ->> $1 AS khoa, coalesce(m.name, to_jsonb(m) ->> $1) AS ten,
            coalesce(array_agg(DISTINCT s.area_id ORDER BY s.area_id)
                     FILTER (WHERE a.region_type = 'market'), '{}') AS thi_truong
       FROM ${bang} m
       LEFT JOIN area_sources s ON s.source = 'S02' AND s.source_area_key = to_jsonb(m) ->> $1
       LEFT JOIN areas a ON a.id = s.area_id
      GROUP BY 1, 2 ORDER BY 1`,
    [pk[0].attname],
  );
  const { rows } = await client.query(
    `SELECT id, group_key, market_codes FROM collection_units WHERE source_code = 'S02' FOR UPDATE`,
  );
  const cu = new Map(rows.map((r) => [r.group_key, r]));
  for (const m of markets) {
    const r = cu.get(m.khoa);
    if (!r) {
      await client.query(
        `INSERT INTO collection_units (source_code, group_key, name, status, market_codes) VALUES ('S02', $1, $2, 'active', $3)`,
        [m.khoa, m.ten, m.thi_truong],
      );
      dem.them++;
    } else if (r.market_codes.length === 0 && m.thi_truong.length > 0) {
      await client.query(`UPDATE collection_units SET market_codes = $2, updated_at = now() WHERE id = $1`, [r.id, m.thi_truong]);
      dem.doi++;
    } else dem.giu++;
  }
  return dem;
}

const dong = (code, d) => `${code}: thêm ${d.them} · đổi ${d.doi} · giữ ${d.giu}`;

async function main(argv) {
  const i = argv.indexOf("--chi");
  const chi = i >= 0 ? argv[i + 1] : null;
  if (i >= 0 && !["S02", "S03"].includes(chi)) {
    console.error("cách dùng: node pipeline/sync-don-vi.mjs [--chi S02|S03]");
    return 2;
  }
  let nhom = null;
  if (chi !== "S02") {
    try {
      nhom = await docNhomGateway();
    } catch (e) {
      console.error(`sync-don-vi: không đọc được cấu hình gateway (${e.code ?? e.name}) — sổ không đổi`);
      return 1;
    }
  }
  const pg = (await import("pg")).default;
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  try {
    await client.connect();
    await client.query("BEGIN");
    const ra = [];
    if (nhom) ra.push(dong("S03", await dongBoS03(client, nhom)));
    if (chi !== "S03") ra.push(dong("S02", await dongBoS02(client)));
    await client.query("COMMIT");
    for (const l of ra) console.log(l);
    return 0;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(`sync-don-vi: lỗi DB (${e.code ?? e.message}) — sổ không đổi`);
    return 2;
  } finally {
    await client.end().catch(() => {});
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await main(process.argv.slice(2));
}
