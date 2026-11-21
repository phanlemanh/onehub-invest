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

/** Tên DB thử được phép nhận 122 qua ap122NeuThieu (bản chép của db/db-thu.sh). */
export const DB_THU = /^oneinvest_(suite|dbv)_[a-z0-9_]+$/;

/** Test đọc DB THẬT qua bản chép của riêng lượt (db/db-thu.sh --chay): bản chép từ máy thu chưa áp 122 thì áp CHÍNH tệp
 *  db/migrations/122_*.sql vào public của bản chép — đúng trạng thái máy thu sau áp. Sổ đã có cột → không làm gì (mọi DB, kể cả
 *  DB chung sau khi áp: lời gọi thành phép không). Sổ thiếu cột mà DB không phải DB thử (oneinvest, tên lạ) → NÉM LỖI, không
 *  lặng lẽ bỏ qua. Hàng hạ tầng sau chuyển máy sẽ gỡ các lời gọi này (Known limits NK1). Trả true khi đã áp. */
export async function ap122NeuThieu(c) {
  const { rows: [r] } = await c.query(
    `SELECT current_database() AS db,
            EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = to_regclass('public.source_registry') AND attname = 'cadence_hours'
                    AND NOT attisdropped) AS co`,
  );
  if (r.co) return false;
  if (!DB_THU.test(r.db))
    throw new Error(`ap122NeuThieu: từ chối áp 122 vào DB «${r.db}» — chỉ bản chép DB thử (oneinvest_suite_*, oneinvest_dbv_*)`);
  // Nhiều tệp test cùng bản chép (app chạy song song) → một bên áp, bên kia chờ rồi gặp 122 idempotent.
  await c.query("SELECT pg_advisory_lock(122122)");
  try {
    await c.query(`SET search_path TO public; ${doc122()}; RESET search_path`);
  } finally {
    await c.query("SELECT pg_advisory_unlock(122122)");
  }
  return true;
}

/** Lược đồ test tự dựng bảng sổ theo khuôn migration cũ (vd «khuôn sau gộp» của pipeline/scripts/so-nhom-fixture.mjs, dừng ở
 *  048): chạy CHÍNH tệp 122 trong lược đồ đó để sổ có cột mới như sau gộp. Chỉ lược đồ tạm — từ chối public. Bảng cần khoá chính
 *  (ON CONFLICT (code) của 122). */
export async function ap122VaoSchema(c, schema) {
  if (!schema || schema === "public") throw new Error("ap122VaoSchema: chỉ lược đồ tạm, không public");
  await c.query(`SET search_path TO "${schema}"; ${doc122()}; RESET search_path`);
}
