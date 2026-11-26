// sinh-129.mjs — dựng db/migrations/129_ghi_tam_lo.sql: phần viết tay + hai hàm chép nguyên thân bản mới nhất (066, 087),
// mỗi hàm chỉ đổi đúng một chỗ, kiểm bằng assert để không lệch lặng lẽ.
import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const goc = process.argv[2];
const mig = (f) => readFileSync(`${goc}/db/migrations/${f}`, "utf8");

const lay = (text, dau) => {
  const i = text.indexOf(dau);
  assert.ok(i >= 0, `không thấy: ${dau}`);
  const j = text.indexOf("$$;", text.indexOf("AS $$", i)) + 3;
  return text.slice(i, j);
};

// revert_enrichment bản 066 — đổi đúng khối kiểm actor.
const rev066 = lay(mig("066_can_theo_tin.sql"), "CREATE OR REPLACE FUNCTION revert_enrichment");
let rev = rev066;
const kiemCu = `  IF p_actor IS NULL OR p_actor !~ '^hitl:.+' THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>), nhận: %', p_actor;
  END IF;`;
assert.ok(rev.includes(kiemCu), "thân 066 đổi khối kiểm actor");
rev = rev.replace(kiemCu, () => `  -- 129: người (hitl:) như cũ; actor máy may:ghi-tam:<lý do> CHỈ khi mọi id thuộc một lô ghi tạm còn cờ (NB10, Hỏi-4).
  IF p_actor IS NULL OR NOT (
       p_actor ~ '^hitl:.+'
       OR (p_actor ~ '^may:ghi-tam:.+'
           AND NOT EXISTS (SELECT 1 FROM unnest(COALESCE(p_ids, '{}'::bigint[])) AS x(id)
                             LEFT JOIN enrichment_proposals e ON e.id = x.id
                            WHERE e.id IS NULL OR e.lo_id IS NULL OR NOT e.ghi_tam))) THEN
    RAISE EXCEPTION 'revert_enrichment: chỉ người được hoàn tác (actor hitl:<tên>); actor máy may:ghi-tam: chỉ cho đề xuất thuộc lô ghi tạm, nhận: %', p_actor;
  END IF;`);

// unit_data_level bản 087 — tin có loại hình từ ghi tạm còn sống không vào `du` (AC-8).
const udl087 = lay(mig("087_thang_bac_moi.sql"), "CREATE OR REPLACE FUNCTION unit_data_level");
let udl = udl087;
const duCu = "SELECT * FROM gan g WHERE offer_core_complete(g.kind, g.property_type, g.price_vnd, g.area_m2, g.area_id)";
assert.ok(udl.includes(duCu), "thân 087 đổi CTE du");
udl = udl.replace(duCu, () => `${duCu}
       -- 129 (NB10 AC-8): loại hình đến từ giá trị ghi tạm còn sống chưa phải «đã đo» — tin không làm căn lên B3–B5.
       AND NOT EXISTS (SELECT 1 FROM enrichment_proposals ep
                        WHERE ep.offer_id = g.offer_id AND ep.field = 'property_type'
                          AND ep.status = 'applied' AND ep.ghi_tam)`);

const tay = readFileSync(new URL("./129-tay.sql", import.meta.url), "utf8");
const ra = tay.replace("-- @@REVERT_ENRICHMENT@@", () => rev).replace("-- @@UNIT_DATA_LEVEL@@", () => udl);
// Mỗi thân hàm phải mở và đóng bằng $$ — chuỗi thay của String.replace từng nuốt «$$» thành «$» (soát M5 @b191078df).
assert.equal((ra.match(/AS \$\$/g) ?? []).length, (ra.match(/\$\$;/g) ?? []).length, "số AS $$ và $$; lệch");
assert.ok(!/AS \$\n/.test(ra) && !/\$;\n/.test(ra.replace(/\$\$;/g, "")), "còn thân hàm bọc bằng một dấu $");
assert.ok(!ra.includes("@@"), "còn chỗ giữ chưa thay");
writeFileSync(`${goc}/db/migrations/129_ghi_tam_lo.sql`, ra);
console.log("đã ghi 129_ghi_tam_lo.sql", ra.split("\n").length, "dòng");
const lui = `-- lui-129.sql — khối lùi của migration 129 (NB10), SINH bằng script cùng lúc với 129 (không sửa tay): gỡ ba hàm mới, hai cột,
-- hai bảng; nạp lại NGUYÊN VĂN revert_enrichment bản 066 và unit_data_level bản 087. Một giao dịch. Áp trên máy thu chỉ theo
-- lời Mạnh (ap-may-thu.md mục «Cách lùi»).
BEGIN;
DROP FUNCTION IF EXISTS xet_han_ghi_tam();
DROP FUNCTION IF EXISTS ghi_ket_qua_do_bu(text, text, text);
DROP FUNCTION IF EXISTS rut_lo_ghi_tam(text, text, text, boolean);
${rev066}

${udl087}

ALTER TABLE enrichment_proposals DROP COLUMN IF EXISTS lo_id, DROP COLUMN IF EXISTS ghi_tam;
DROP TABLE IF EXISTS ghi_tam_o;
DROP TABLE IF EXISTS ghi_tam_lo;
COMMIT;
`;
writeFileSync(`${goc}/_acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql`, lui);
console.log("đã ghi probes/lui-129.sql");
