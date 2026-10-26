// vong-doi-fixture.mjs — lược đồ tạm cho phép đo TV2a `vong-doi-nguon` (pipeline/scripts/vong-doi.itest.mjs,
// vong-doi-local.itest.mjs, app/tests/vong-doi-nguon.test.tsx). Hai bảng dựng ở KHUÔN TRƯỚC migration 047 (cột của
// 012 + 013 + 024); ca VD-KHUON đối chiếu khuôn này với public để fixture không lệch bảng thật. `admin` là pg client đã
// kết nối (bên gọi tự mang pg). 047 chỉ chạy trên lược đồ tạm — public áp sau gộp.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MIGRATION_047 = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "db", "migrations", "047_vong_doi_nguon.sql");

/** Cột 047 thêm — khuôn trước = cột public trừ các cột này. */
export const COT_047 = { source_registry: ["reason", "resume_when"], source_groups: ["status", "reason", "resume_when"] };

/** Dựng lược đồ `S` với hai bảng khuôn trước 047. */
export async function dungKhuonTruoc(admin, S, { coRegistry = true, coGroups = true } = {}) {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
  await admin.query(`CREATE SCHEMA "${S}"`);
  if (coRegistry) {
    await admin.query(`CREATE TABLE "${S}".source_registry (
      code text PRIMARY KEY, real_name text NOT NULL, label_vi text NOT NULL,
      status text NOT NULL DEFAULT 'active', since date NOT NULL DEFAULT current_date, retired_at date,
      source_ids text[] NOT NULL DEFAULT '{}', note text)`);
  }
  if (coGroups) {
    await admin.query(`CREATE TABLE "${S}".source_groups (
      id bigserial PRIMARY KEY, source_code text NOT NULL ${coRegistry ? `REFERENCES "${S}".source_registry(code)` : ""},
      group_key text NOT NULL, name text NOT NULL, enabled boolean NOT NULL DEFAULT true,
      params jsonb NOT NULL DEFAULT '{}'::jsonb, note text,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (source_code, group_key))`);
  }
}

/** Chạy nguyên tệp 047 bằng một lời gọi (giao thức simple: dừng ở lỗi đầu). `client` đã trỏ search_path lược đồ tạm. */
export async function chay047(client) {
  await client.query(readFileSync(MIGRATION_047, "utf8"));
}

/** Dấu của mọi khoá nhóm trong fixture — đếm dòng ops_audit mang dấu này ở public (job đêm ghi ops_audit thật nên không
 * so tổng số dòng). */
export const DAU = "vd-thu";

/** Ảnh chụp public để chứng không ca nào chạm nó: cột hai bảng, hàm/trigger/ràng buộc của lược đồ public, số dòng
 * ops_audit mang dấu fixture. */
export async function chupPublic(admin) {
  const q = async (sql) => (await admin.query(sql)).rows;
  return {
    cot: await q(`SELECT table_name, column_name, is_nullable, column_default FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name IN ('source_registry', 'source_groups') ORDER BY 1, 2`),
    ham: (await q(`SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                   WHERE n.nspname = 'public' AND p.proname LIKE 'source_%' ORDER BY 1`)).map((r) => r.proname),
    trigger: (await q(`SELECT t.tgname FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
                       WHERE n.nspname = 'public' AND NOT t.tgisinternal AND c.relname IN ('source_registry', 'source_groups') ORDER BY 1`)).map((r) => r.tgname),
    rang_buoc: (await q(`SELECT c.conname FROM pg_constraint c JOIN pg_namespace n ON n.oid = c.connamespace
                         WHERE n.nspname = 'public' AND c.conrelid IN ('public.source_registry'::regclass, 'public.source_groups'::regclass) ORDER BY 1`)).map((r) => r.conname),
    ops_audit_dau: (await q(`SELECT count(*)::int AS n FROM public.ops_audit WHERE detail::text LIKE '%${DAU}%'`))[0].n,
  };
}

export async function xoaLuocDo(admin, S) {
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`);
}
