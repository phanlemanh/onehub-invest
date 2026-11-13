# du-an-tren-tin-s03-tu-nhom-va-ten Implementation Plan

**Goal:** lệnh ghi phát biểu `project_node_id` lên bài S03 từ sổ nhóm một-dự-án và nhãn bạc `chu_bai` có trích, mặc định chỉ đếm.

**Spec:** `docs/superpowers/specs/2026-11-13-du-an-tren-tin-s03-tu-nhom-va-ten-design.md` · hợp đồng
`_acceptance/du-an-tren-tin-s03-tu-nhom-va-ten/` (Cổng Phạm vi 13/11: Hỏi-1…4 theo khuyến nghị).

## Global Constraints

- Không migration; mã trường/lớp/phương pháp qua `pipeline/lib/vocab.generated.mjs` (VL-AC-5).
- Chỉ import `pg`, `node:*`, `pipeline/lib/*`; không gọi model, mạng.
- `rule_id`: `du-an-nhom-mot-du-an` (inferred · e1_rule), `du-an-ten-bai` (observed · e2_llm); `method_version`
  `du-an-tren-tin-s03@1`; lý do rút `xet-lai-so-nhom-danh-ba`; tập căn cứ nhãn mặc định `{chu_bai + trich_ok}`.
- Test DB: `oneinvest_dbv_dat_<pid>_<khoa>` qua `pipeline/scripts/db-thu-dbv.mjs`; ca DB bỏ khi thiếu DATABASE_URL.

## Review Focus

- Khoá nhóm hai dạng trên bài và trên sổ (`khoaNhomThat`).
- Bài thuộc hai tin, một tin mâu thuẫn → bài không ghi.
- Chạy lại cùng dữ liệu: 0 chèn, 0 rút.
- Phát biểu của phương pháp khác không bị rút.
- `trich_ok` dạng chuỗi hay boolean trong JSON.

### Task 1: lib thuần `tinhDuAn` (independent: false)

Files: `pipeline/lib/du-an-tren-tin-s03.mjs`. Exports: `RULE`, `METHOD_VERSION`, `LY_DO_RUT`, `CAN_CU_NHAN`,
`tinhDuAn({nhom, bai, nhan, nut, tin, tangCao, canCu}) → {dong, mauThuan, dem}`, `docDuLieu(client)`.
Phục vụ E1–E5, E7, E8. Verify: ca thuần trong tệp test.

### Task 2: lệnh `du-an-tren-tin-s03.mjs` (independent: false)

Files: `pipeline/scripts/du-an-tren-tin-s03.mjs`. `chay(client, {ghi, bangMauThuan, json})`; thoát 2 khi thiếu bảng/ô 096;
`--ghi` = BEGIN, `writeAssertions(replaceOwn)`, rút phần thừa của hai rule_id, COMMIT. Biến `DAT_LOI_SAU_LO` (chỉ test)
tiêm lỗi sau lô đầu. Phục vụ E3, E4, E6, E7.

### Task 3: test `du-an-tren-tin-s03.test.mjs` (independent: false)

Ca DAT-AC-1…8, AC-7b; chiều đỏ bằng bản chép tạm `pipeline/lib` + tệp lệnh, đột biến một chuỗi. Verify:
`cd pipeline && npm test` xanh; từng đột biến làm ca đúng tên đỏ.
