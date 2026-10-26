// so-nhom-fixture.mjs — lược đồ tạm cho phép đo PL12 `so-nhom-mot-noi` (pipeline/scripts/so-nhom.itest.mjs,
// app/tests/so-nhom.test.tsx). Dựng trên khuôn trước 047 của vong-doi-fixture rồi chạy nguyên tệp 047 và 048 — public
// chỉ được áp 048 sau gộp. `admin` là pg client đã kết nối (bên gọi tự mang pg).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chay047, dungKhuonTruoc } from "./vong-doi-fixture.mjs";

export const MIGRATION_048 = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "db", "migrations", "048_so_nhom_mot_noi.sql");

/** Dấu của mọi khoá, tên và dòng ops_audit của fixture PL12. */
export const DAU_SN = "sn-thu";

/** Mã nguồn có trong sổ của fixture; real_name mang dấu (không phải tên thật). */
export const NGUON_MAU = ["S01", "S02", "S03", "S05", "S06"];

/** Thị trường, phân khu và hai node viết trước cho ca kiểm tham chiếu (Hỏi-3: chỉ khu đô thị). */
export const THAM_CHIEU = { market: "vn-sn-m1", submarket: "vn-sn-s1", project: 9001, building: 9002 };

/** Chạy nguyên tệp 048 bằng một lời gọi. `client` đã trỏ search_path lược đồ tạm. */
export async function chay048(client) {
  await client.query(readFileSync(MIGRATION_048, "utf8"));
}

/** Chạy một khối SQL với search_path chỉ gồm lược đồ `S`, trả search_path về như cũ. */
async function trongLuocDo(admin, S, fn) {
  await admin.query(`SET search_path TO "${S}"`);
  try {
    await fn();
  } finally {
    await admin.query("RESET search_path");
  }
}

/** Nguồn mẫu vào source_registry của `S` (khoá ngoại của sổ). */
export async function nguonMau(admin, S) {
  for (const code of NGUON_MAU) {
    await admin.query(
      `INSERT INTO "${S}".source_registry (code, real_name, label_vi) VALUES ($1, $2, 'thử') ON CONFLICT DO NOTHING`,
      [code, `${DAU_SN}-ten-${code}`],
    );
  }
}

/** Bảng areas và asset_nodes tối giản cho kiểm tham chiếu. */
export async function bangThamChieu(admin, S) {
  await admin.query(`CREATE TABLE "${S}".areas (id text PRIMARY KEY, region_type text NOT NULL, name text NOT NULL)`);
  await admin.query(`CREATE TABLE "${S}".asset_nodes (id bigint PRIMARY KEY, node_type text NOT NULL, name text NOT NULL)`);
  await admin.query(`INSERT INTO "${S}".areas VALUES ($1, 'market', 'Thị trường thử'), ($2, 'submarket', 'Phường thử')`,
    [THAM_CHIEU.market, THAM_CHIEU.submarket]);
  await admin.query(`INSERT INTO "${S}".asset_nodes VALUES ($1, 'project', 'Khu đô thị thử'), ($2, 'building', 'Tòa thử')`,
    [THAM_CHIEU.project, THAM_CHIEU.building]);
}

/** Chạy 047 rồi 048 trên lược đồ `S` (đã dựng khuôn trước 047). */
export async function chay047Va048(admin, S) {
  await trongLuocDo(admin, S, async () => {
    await chay047(admin);
    await chay048(admin);
  });
}

/** Lược đồ `S` ở khuôn SAU gộp: khuôn trước 047 + nguồn mẫu + 047 + 048 (+ bảng tham chiếu khi `thamChieu`). */
export async function dungSauGop(admin, S, { thamChieu = false } = {}) {
  await dungKhuonTruoc(admin, S);
  await nguonMau(admin, S);
  if (thamChieu) await bangThamChieu(admin, S);
  await chay047Va048(admin, S);
}
