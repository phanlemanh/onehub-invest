// so-lenh-fixture.mjs — lược đồ tạm cho phép đo TV4 `so-lenh-bo-ap` (pipeline/scripts/so-lenh.itest.mjs,
// pipeline/scripts/lenh.test.mjs, app/tests/so-lenh.test.tsx). Hai khuôn DB:
//   - máy thu: source_registry khuôn trước 047 rồi chạy 047 (vòng đời TV2a), ops_audit LIKE public;
//   - cloud: chỉ ops_heartbeat đúng khuôn cloud (không source_registry, không ops_audit — 091 tạo ops_audit).
// Danh sách loại lệnh, trạng thái và khoá cấm RÚT từ ADR-0015 (không chép tay) để thước không lệch nguồn.
// 091 chỉ chạy trên lược đồ tạm — public áp sau gộp (Hỏi-1).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chay047, dungKhuonTruoc } from "./vong-doi-fixture.mjs";

const GOC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const MIGRATION_091 = path.join(GOC, "db", "migrations", "091_so_lenh.sql");
export const ADR_0015 = path.join(GOC, "docs", "adr", "0015-duong-lenh-keo-mot-chieu.md");

/** Cột ops_audit của 018 (khuôn route ghi). */
export const COT_OPS_AUDIT = ["action", "actor", "at", "detail", "env", "id"];

/** Đoạn của mục đánh số `n.` trong phần «Quyết định» của ADR-0015, tới mục kế. */
function mucAdr(n) {
  const s = readFileSync(ADR_0015, "utf8");
  const dau = s.indexOf(`\n${n}. **`);
  if (dau < 0) throw new Error(`ADR-0015 không có mục ${n}`);
  const sau = s.indexOf(`\n${n + 1}. **`, dau + 1);
  return s.slice(dau, sau < 0 ? undefined : sau);
}
const ma = (doan) => [...doan.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

/** 14 loại lệnh của ADR-0015 §4 (theo thứ tự trong văn bản). */
export function loaiTuAdr() {
  return ma(mucAdr(4)).filter((t) => /^[a-z_]+\.[a-z_]+$/.test(t));
}

/** 9 trạng thái của máy trạng thái ADR-0015 §5 (theo thứ tự xuất hiện, không lặp). */
export function trangThaiTuAdr() {
  const out = [];
  for (const span of ma(mucAdr(5)).filter((t) => t.includes("→"))) {
    for (const w of span.split("→").map((x) => x.trim())) if (w && !out.includes(w)) out.push(w);
  }
  return out;
}

/** 11 khoá cấm của ADR-0015 §7, gạch «Khoá cấm» — nguyên dạng văn bản (`agents.*` giữ `.*`). */
export function khoaCamTuAdr() {
  const muc = mucAdr(7);
  const dau = muc.indexOf("**Khoá cấm**");
  const cuoi = muc.indexOf("UI không có ô", dau);
  return ma(muc.slice(dau, cuoi));
}

/** Lược đồ `S` kiểu máy thu: source_registry đã chạy 047, ops_audit khuôn public. `admin` đã kết nối. */
export async function dungMayThu(admin, S, schemaClient) {
  await dungKhuonTruoc(admin, S, { coGroups: true });
  await admin.query(`CREATE TABLE "${S}".ops_audit (LIKE public.ops_audit INCLUDING ALL)`);
  if (schemaClient) await chay047(schemaClient);
}

/** Lược đồ `S` kiểu cloud: chỉ ops_heartbeat như cloud đang chạy. */
export async function dungCloud(admin, S) {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
  await admin.query(`CREATE SCHEMA "${S}"`);
  await admin.query(`CREATE TABLE "${S}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`);
}

/** Chạy nguyên tệp 091 (hoặc `sql` thay thế) bằng một lời gọi — giao thức simple, dừng ở lỗi đầu. */
export async function chay091(client, sql = readFileSync(MIGRATION_091, "utf8")) {
  await client.query(sql);
}

export const docMigration091 = () => readFileSync(MIGRATION_091, "utf8");
