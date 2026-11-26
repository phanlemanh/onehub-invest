# Câu trả lời chấm bóng không bị cắt — kế hoạch thi công

**Goal:** lời gọi chấm bóng có trần token ra theo số ô; lời gọi chạm trần ghi lỗi `bi-cat`.
**Spec:** `docs/superpowers/specs/2026-11-22-cham-bong-cau-tra-loi-khong-bi-cat-design.md` · hợp đồng `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/contract.md`.

## Global Constraints

- Lời nhắc giữ `cb-v1` (khoá dùng lại không đổi). Không ghi DB. Trần 0,1 USD của E11 NB1 không đổi.

## Task 1 — bộ chạy (independent: false; phục vụ E1–E6, E9)

**Files:** `agent/src/enrich/cham-bong/doc.ts` (`tranTokenRa(soO) = 400 + 600 × soO`, `GoiModel(m, duong, p, maxRa) → { text, vao, ra, cat? }`,
`taoGoiModel(lop: LopGoi)`, `LOP_THAT`, `LOI_BI_CAT`, `LOI_JSON_HONG`; `docMot` truyền trần, `cat` → `bi-cat`) ·
`agent/src/enrich/cham-bong/chay.ts` (`uocDau` xuất khẩu, dùng `tranTokenRa`; `lyDoLoi`; `TongKet.loi_theo_ly_do`) ·
`agent/src/enrich/cham-bong/bao-cao.ts` (dòng «DỪNG VÌ TRẦN …», dòng «Lỗi theo lý do») ·
`agent/tests/cham-bong-cau-tra-loi-khong-bi-cat.test.ts` (ca mang mã AC, Truy giả, không DB).
**Verify:** `cd agent && npx tsc --noEmit && node --import tsx --test tests/cham-bong-cau-tra-loi-khong-bi-cat.test.ts` và bộ ca NB1
`bash ../db/db-thu.sh oneinvest_suite_agent --chay node --import tsx --test tests/cham-bong-bo-sung-tin.test.ts`.

## Task 2 — probe (independent: false; phục vụ E1–E9)

**Files:** `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/{cham.sh,dot-bien.mjs}` (ca xanh + đột biến đỏ có thông điệp ghim),
`tran-30.{sh,mjs}` (E7, DB máy thu chỉ đọc), `khoa-trung.{sh,mjs}` (E8, kho thật, DB chỉ đọc).
**Verify:** `bash probes/cham.sh AC-n` cho AC-1…AC-6, AC-8 thoát 0; E7, E8 chạy ở S4 với khoá s4.
