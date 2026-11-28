// sinh-129.mjs — dựng db/migrations/129_ghi_tam_lo.sql và probes/lui-129.sql từ 129-tay.sql.
// Hai hàm có sẵn (revert_enrichment, unit_data_level) KHÔNG chép thân từ tệp migration nào: DB máy thu chạy thân khác bản
// mới nhất trong kho (066 chưa áp ở máy thu — probe M5 @6bf262503). Migration vá ĐÚNG MỘT khối trên thân hàm ĐANG CHẠY
// (pg_get_functiondef → replace → EXECUTE), bỏ qua khi đã vá, dừng khi không thấy khối cũ. Khối lùi vá ngược.
// Chuỗi thay đi qua hàm (không phải chuỗi) — String.replace với chuỗi thay nuốt «$$» thành «$» (probe M5 @b191078df).
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const goc = process.argv[2];

const VA = [
  {
    ham: "revert_enrichment(bigint[],text,text)",
    dau: "129 (NB10 Hỏi-4)",
    cu: `  IF p_actor IS NULL OR p_actor !~ '^hitl:.+' THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>), nhận: %', p_actor;
  END IF;`,
    moi: `  -- 129 (NB10 Hỏi-4): người (hitl:) như cũ; actor máy may:ghi-tam:<lý do> CHỈ khi mọi id thuộc một lô ghi tạm còn cờ.
  IF p_actor IS NULL OR NOT (
       p_actor ~ '^hitl:.+'
       OR (p_actor ~ '^may:ghi-tam:.+'
           AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p_ids, '{}'::bigint[])) AS x(id)
                             LEFT JOIN enrichment_proposals e ON e.id = x.id
                            WHERE e.id IS NULL OR e.lo_id IS NULL OR NOT e.ghi_tam))) THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>); actor máy may:ghi-tam: chỉ cho đề xuất thuộc lô ghi tạm, nhận: %', p_actor;
  END IF;`,
  },
  {
    ham: "unit_data_level()",
    dau: "129 (NB10 AC-8)",
    cu: "SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)",
    moi: `SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)
       -- 129 (NB10 AC-8): loại hình đến từ giá trị ghi tạm còn sống chưa phải «đã đo» — tin không làm căn lên B3–B5.
       AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep
                        WHERE ep.offer_id = g.offer_id AND ep.field = 'property_type'
                          AND ep.status = 'applied' AND ep.ghi_tam)`,
  },
];
for (const v of VA) for (const k of ["cu", "moi"]) assert.ok(!v[k].includes("$q$"), `${v.ham}.${k} chứa dấu bọc $q$`);

/** Khối DO vá `tu` → `den` trên thân hàm đang chạy. `daVa` = chuỗi chỉ có khi đã vá (bỏ qua). */
const khoiVa = (v, tu, den, daVa, ten) => `DO $va$
DECLARE
  d text := pg_get_functiondef('${v.ham}'::regprocedure);
  tu text := $q$${tu}$q$;
  den text := $q$${den}$q$;
BEGIN
  IF ${daVa === null ? "false" : `position($q$${daVa}$q$ IN d) > 0`} THEN
    RAISE NOTICE '${ten}: ${v.ham} đã vá — bỏ qua';
    RETURN;
  END IF;
  IF position(tu IN d) = 0 THEN
    RAISE EXCEPTION '${ten}: thân ${v.ham} đang chạy không có khối cần vá — dừng, không đổi gì';
  END IF;
  IF length(d) - length(replace(d, tu, '')) <> length(tu) THEN
    RAISE EXCEPTION '${ten}: khối cần vá xuất hiện hơn một lần trong ${v.ham} — dừng, không đổi gì';
  END IF;
  EXECUTE replace(d, tu, den);
END $va$;`;

const vaToi = VA.map((v) => khoiVa(v, v.cu, v.moi, v.dau, "129")).join("\n\n");
// Lùi: vá ngược; chưa vá (không có dấu) thì bỏ qua.
const vaLui = VA.map((v) => khoiVa(v, v.moi, v.cu, null, "lùi 129").replace(
  "IF false THEN", `IF position($q$${v.dau}$q$ IN d) = 0 THEN`).replace("đã vá — bỏ qua", "chưa vá — bỏ qua")).join("\n\n");

const tay = readFileSync(new URL("./129-tay.sql", import.meta.url), "utf8");
assert.ok(tay.includes("-- @@VA_HAM@@"), "129-tay.sql thiếu chỗ giữ @@VA_HAM@@");
const ra = tay.replace("-- @@VA_HAM@@", () => vaToi);
assert.ok(!ra.includes("@@"), "còn chỗ giữ chưa thay");
for (const m of ["AS $$", "$va$"]) assert.ok(ra.includes(m));
assert.equal((ra.match(/AS \$\$/g) ?? []).length, (ra.match(/END \$\$;/g) ?? []).length, "số AS $$ và END $$; lệch");
writeFileSync(`${goc}/db/migrations/129_ghi_tam_lo.sql`, ra);
console.log("đã ghi 129_ghi_tam_lo.sql", ra.split("\n").length, "dòng");

const lui = `-- lui-129.sql — khối lùi của migration 129 (NB10), SINH bằng probes/sinh-129.mjs cùng lúc với 129 (không sửa tay): gỡ ba
-- hàm mới; vá ngược revert_enrichment và unit_data_level trên thân đang chạy (chỉ khi có dấu vá của 129); gỡ hai cột, hai bảng.
-- Một giao dịch. Áp trên máy thu chỉ theo lời Mạnh (ap-may-thu.md mục «Cách lùi»).
BEGIN;
DROP FUNCTION IF EXISTS xet_han_ghi_tam();
DROP FUNCTION IF EXISTS ghi_ket_qua_do_bu(text, text, text);
DROP FUNCTION IF EXISTS rut_lo_ghi_tam(text, text, text, boolean);
${vaLui}

ALTER TABLE enrichment_proposals DROP COLUMN IF EXISTS lo_id, DROP COLUMN IF EXISTS ghi_tam;
DROP TABLE IF EXISTS ghi_tam_o;
DROP TABLE IF EXISTS ghi_tam_lo;
COMMIT;
`;
writeFileSync(`${goc}/_acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql`, lui);
console.log("đã ghi probes/lui-129.sql");
