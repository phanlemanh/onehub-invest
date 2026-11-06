-- dau-luoc-do.sql — dấu lược đồ của DB chung cho bản mẫu DB thử (db/db-thu.sh --chay, --dau; test scripts/db-thu.test.mjs đọc cùng tệp).
-- Chỉ đọc catalog. Đổi một đối tượng dưới đây thì dấu đổi và bản mẫu dựng lại ngay, không chờ hết tuổi 24 giờ (hồ sơ dau-luoc-do-ban-mau).
-- Phủ: schema, extension, quan hệ (RLS, quyền), cột (kiểu đầy đủ, NOT NULL, DEFAULT, generated, identity, collation), constraint (cả của domain),
-- index, trigger (cả bật/tắt), policy, view, enum, domain, sequence (định nghĩa, không giá trị hiện tại), hàm (chữ ký, quyền, thân).
-- Bỏ: schema hệ thống, đối tượng thuộc extension (đã có dòng extension), schema tên đuôi _<số> — schema rác test tạo, mang pid.
-- Không phủ: comment, owner (pg_dump --no-owner nên owner của bản mẫu luôn là oneinvest).
WITH ns AS (
  SELECT n.oid, n.nspname FROM pg_namespace n
  WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema' AND n.nspname !~ '_[0-9]+$'
    AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_namespace'::regclass AND d.objid = n.oid AND d.deptype = 'e')
), ext AS (
  SELECT classid, objid FROM pg_depend WHERE deptype = 'e'
), rel AS (
  SELECT c.oid, ns.nspname || '.' || c.relname AS ten, c.relkind, c.relrowsecurity, c.relforcerowsecurity, c.relacl
  FROM pg_class c JOIN ns ON ns.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'v', 'm', 'f', 'c')
    AND NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_class'::regclass AND ext.objid = c.oid)
), typ AS (
  SELECT t.oid, ns.nspname || '.' || t.typname AS ten, t.typtype, t.typbasetype, t.typtypmod, t.typnotnull, t.typdefault
  FROM pg_type t JOIN ns ON ns.oid = t.typnamespace
  WHERE t.typtype IN ('e', 'd') AND NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_type'::regclass AND ext.objid = t.oid)
)
SELECT md5(string_agg(x, '|' ORDER BY x)) FROM (
  SELECT 's' || nspname AS x FROM ns
  UNION ALL SELECT 'x' || extname || ' ' || extversion FROM pg_extension
  UNION ALL SELECT 'r' || ten || ':' || relkind::text || ':' || relrowsecurity || ':' || relforcerowsecurity || ':' || coalesce(relacl::text, '') FROM rel
  UNION ALL SELECT 'c' || r.ten || '.' || a.attname || ':' || format_type(a.atttypid, a.atttypmod) || ':' || a.attnotnull || ':' || a.attidentity::text
      || ':' || a.attgenerated::text || ':' || coalesce(co.collname, '') || ':' || coalesce(pg_get_expr(ad.adbin, ad.adrelid), '')
    FROM rel r JOIN pg_attribute a ON a.attrelid = r.oid AND a.attnum > 0 AND NOT a.attisdropped
    LEFT JOIN pg_attrdef ad ON ad.adrelid = a.attrelid AND ad.adnum = a.attnum
    LEFT JOIN pg_collation co ON co.oid = a.attcollation
  UNION ALL SELECT 'k' || coalesce(r.ten, ty.ten) || '.' || k.conname || ':' || pg_get_constraintdef(k.oid)
    FROM pg_constraint k LEFT JOIN rel r ON r.oid = k.conrelid LEFT JOIN typ ty ON ty.oid = k.contypid
    WHERE r.oid IS NOT NULL OR ty.oid IS NOT NULL
  UNION ALL SELECT 'i' || r.ten || ':' || pg_get_indexdef(i.indexrelid) FROM pg_index i JOIN rel r ON r.oid = i.indrelid
  UNION ALL SELECT 't' || r.ten || ':' || pg_get_triggerdef(t.oid) || ':' || t.tgenabled::text
    FROM pg_trigger t JOIN rel r ON r.oid = t.tgrelid WHERE NOT t.tgisinternal
  UNION ALL SELECT 'p' || r.ten || '.' || p.polname || ':' || p.polcmd::text || ':' || p.polpermissive || ':' || p.polroles::text
      || ':' || coalesce(pg_get_expr(p.polqual, p.polrelid), '') || ':' || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')
    FROM pg_policy p JOIN rel r ON r.oid = p.polrelid
  UNION ALL SELECT 'v' || ten || md5(pg_get_viewdef(oid)) FROM rel WHERE relkind IN ('v', 'm')
  UNION ALL SELECT 'e' || ty.ten || ':' || string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder)
    FROM typ ty JOIN pg_enum e ON e.enumtypid = ty.oid GROUP BY ty.ten
  UNION ALL SELECT 'd' || ten || ':' || format_type(typbasetype, typtypmod) || ':' || typnotnull || ':' || coalesce(typdefault, '') FROM typ WHERE typtype = 'd'
  UNION ALL SELECT 'q' || ns.nspname || '.' || c.relname || ':' || format_type(s.seqtypid, NULL) || ':' || s.seqstart || ':' || s.seqincrement
      || ':' || s.seqmin || ':' || s.seqmax || ':' || s.seqcycle || ':' || coalesce(c.relacl::text, '')
    FROM pg_sequence s JOIN pg_class c ON c.oid = s.seqrelid JOIN ns ON ns.oid = c.relnamespace
    WHERE NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_class'::regclass AND ext.objid = c.oid)
  UNION ALL SELECT 'f' || ns.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || '):'
      || coalesce(pg_get_function_result(p.oid), '') || ':' || coalesce(p.proacl::text, '') || ':' || md5(p.prosrc)
    FROM pg_proc p JOIN ns ON ns.oid = p.pronamespace
    WHERE NOT EXISTS (SELECT 1 FROM ext WHERE ext.classid = 'pg_proc'::regclass AND ext.objid = p.oid)
) t
