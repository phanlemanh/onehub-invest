/**
 * so-nguon-122.mjs — bộ đọc migration 122 (NK1 so-nguon-kho-khai-bao) cho TEST: nhịp đo của từng mã chỉ ghi ở tệp migration,
 * test cần nhịp (lược đồ cấy, client giả) đọc nó ở đây thay vì chép số tay — chép tay là tạo lại chỗ ghi nhịp thứ hai.
 * Mã chạy thật (scripts/lib/freshness.mjs, app/src/lib/freshness.ts) KHÔNG import tệp này: chúng đọc nhịp từ sổ trong DB.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const TEP_122 = fileURLToPath(new URL("../../db/migrations/122_source_registry_family_cadence.sql", import.meta.url));

const khoi = (sql, ten) => {
  const m = sql.match(new RegExp(`-- <<<${ten}\\n([\\s\\S]*?)-- ${ten}>>>`));
  if (!m) throw new Error(`so-nguon-122: không thấy khối ${ten} trong migration 122`);
  return m[1];
};

/** Toàn văn migration 122 (mặc định đọc tệp trong kho; `sql` để test truyền bản đột biến). */
export const doc122 = () => readFileSync(TEP_122, "utf8");

/** Khối thêm cột của 122 — chạy được trong schema tạm (search_path) để lược đồ cấy có đủ cột như sổ sau áp. */
export const khoiCot122 = (sql = doc122()) => khoi(sql, "COT-122");

/** { mã: { family, cadence_hours } } từ bảng VALUES của khối NHIP-122. Rỗng hay dòng sai khuôn thì ném. */
export function nhip122(sql = doc122()) {
  const out = {};
  const rows = [...khoi(sql, "NHIP-122").matchAll(/\('(S\d{2})',\s*'(flow|stock)',\s*(\d+|NULL)\)/g)];
  for (const [, code, family, n] of rows) out[code] = { family, cadence_hours: n === "NULL" ? null : Number(n) };
  if (rows.length === 0) throw new Error("so-nguon-122: bảng nhịp của migration 122 rỗng");
  return out;
}

/** { mã: giờ } chỉ các mã có nhịp — dạng bảng SLO cũ để test so. */
export const cadenceMap122 = (sql) =>
  Object.fromEntries(Object.entries(nhip122(sql)).filter(([, v]) => v.cadence_hours !== null).map(([k, v]) => [k, v.cadence_hours]));

/** Thêm cột của 122 vào `<schema>.source_registry` của lược đồ cấy (bảng dựng bằng LIKE public.source_registry — DB chưa
 *  áp 122 thì thiếu cột, đã áp thì ADD COLUMN IF NOT EXISTS bỏ qua). Không đụng bảng public. */
export async function themCot122(c, schema, sql) {
  const ddl = khoiCot122(sql).replaceAll("ALTER TABLE source_registry", `ALTER TABLE "${schema}".source_registry`);
  if (/ALTER TABLE source_registry/.test(ddl)) throw new Error("so-nguon-122: còn ALTER chưa gắn schema");
  await c.query(ddl);
}

/** Lược đồ cấy dựng sổ bằng LIKE/AS SELECT rồi tự chèn dòng: thêm cột 122 và điền nhịp, họ theo migration 122 cho dòng còn
 *  trống nhịp — đúng như sổ sau áp, không đổi trạng thái, thị trường hay dòng nào khác. */
export async function nhipFixture122(c, schema, sql) {
  await themCot122(c, schema, sql);
  const n = nhip122(sql);
  const codes = Object.keys(n);
  await c.query(
    `UPDATE "${schema}".source_registry r SET cadence_hours = v.c, family = coalesce(r.family, v.f)
       FROM unnest($1::text[], $2::text[], $3::int[]) AS v(code, f, c)
      WHERE r.code = v.code AND r.cadence_hours IS NULL`,
    [codes, codes.map((k) => n[k].family), codes.map((k) => n[k].cadence_hours)],
  );
}

/** Test đọc DB THẬT qua bản chép của riêng lượt (db/db-thu.sh --chay): bản chép từ máy thu chưa áp 122 thì áp vào public
 *  của chính bản chép — đúng trạng thái máy thu sau áp. Không bao giờ chạm DB chung `oneinvest` (trả false, để nguyên). */
export async function ap122NeuThieu(c) {
  const { rows: [r] } = await c.query(
    `SELECT current_database() AS db,
            EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('public.source_registry') AND attname = 'cadence_hours'
                    AND NOT attisdropped) AS co`,
  );
  if (r.co || r.db === "oneinvest") return false;
  // Nhiều tệp test cùng bản chép (app chạy song song) → một bên áp, bên kia chờ rồi thấy đã có cột.
  await c.query("SELECT pg_advisory_lock(122122)");
  try {
    await c.query(`SET search_path TO public; ${doc122()}; RESET search_path`);
  } finally {
    await c.query("SELECT pg_advisory_unlock(122122)");
  }
  return true;
}

/** Sổ chép bằng `CREATE TABLE … AS SELECT * FROM public.source_registry` (không khoá chính): dựng khoá chính rồi chạy CHÍNH
 *  migration 122 trong schema đó — sổ chép thành sổ sau áp (bản chép đã áp thì 122 không đổi ô nào). */
export async function ap122VaoSchema(c, schema) {
  const { rows: [k] } = await c.query(
    `SELECT EXISTS (SELECT 1 FROM pg_index WHERE indrelid = to_regclass($1) AND indisprimary) AS co`, [`"${schema}".source_registry`],
  );
  if (!k.co) await c.query(`ALTER TABLE "${schema}".source_registry ADD PRIMARY KEY (code)`);
  await c.query(`SET search_path TO "${schema}"; ${doc122()}; RESET search_path`);
}
