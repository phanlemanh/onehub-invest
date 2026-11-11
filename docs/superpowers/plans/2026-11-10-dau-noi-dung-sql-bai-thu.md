# Kế hoạch: dau-noi-dung-sql-bai-thu (GN5)

Hợp đồng: `_acceptance/dau-noi-dung-sql-bai-thu/contract.md` (duyệt 10/11, Hỏi-1 giữ ở mã). Design:
`docs/superpowers/specs/2026-11-10-dau-noi-dung-sql-bai-thu-design.md`.

Mọi task tuần tự (cùng chạm định nghĩa bài thử); `independent: false`.

## Task 1 — hằng NOI_DUNG_SQL + hai bản pipeline dùng hằng

- Files: `pipeline/lib/test-posts.mjs` (xuất `noiDungSql(col)`), `pipeline/lib/ops-flow.mjs` (`S03_POSTS_SQL` thêm vế
  `AND NOT (<noi-dung>)` sau điều kiện nhóm), `pipeline/scripts/test-data-residue.mjs` (xuất `TEST_POST_SQL_T` — vị từ bài thử
  của câu đếm độc lập, thêm vế noi-dung; câu đếm dùng hằng).
- Verify: `node --test pipeline/lib/test-posts.test.mjs` + `node -e` nạp hai module.
- Phục vụ: E1, E4. independent: false.

## Task 2 — 600_data_flow.sql và bản chép app

- Files: `pipeline/sql/600_data_flow.sql` (CTE `p`, `t` đọc `text`; đoạn `IS_TEST` thêm vế noi-dung), `app/src/lib/collections-queries.ts`
  (chép nguyên văn `S03_POSTS_SQL` mới).
- Verify: `cd app && npx tsc --noEmit`; chạy 600 trên DB thử (bộ ops-dong-chay).
- Phục vụ: E1, E2, E3. independent: false.

## Task 3 — ma trận khớp + dư lượng (pipeline)

- Files: `pipeline/scripts/dau-bai-thu-sql.test.mjs` mới: ca `DND-AC-1` (ma trận × bốn bản, mỗi dòng một ngày, bảng tạm che
  `stg_zalo_posts` trong ROLLBACK, đột biến từng bản + đột biến bù trừ), ca `DND-AC-4` (bảng tạm che `stg_zalo_posts`,
  `sale_offers`, `sellers`; `measureResidue`; đột biến câu đếm).
- Verify: `config:executors.test.dnd_khop`, `config:executors.test.dnd_du_luong` (lượt phá-thử nằm trong ca).
- Phục vụ: E1, E4. independent: false.

## Task 4 — hai bộ app

- Files: `app/tests/luong-7-ngay-dung-so.test.tsx` (fixture thêm bài noi-dung; `DND-AC-2` hai ca), `app/tests/ops-dong-chay.test.tsx`
  (+ fixture nếu cần; `DND-AC-3` hai ca).
- Verify: `config:executors.test.dnd_luong7`, `config:executors.test.dnd_dong_chay`, rồi cả hai tệp đầy đủ (ca cũ xanh).
- Phục vụ: E2, E3. independent: false.

## Task 5 — chạy lại bộ cũ chạm định nghĩa + tài liệu

- Chạy: `pipeline/scripts/gop-trung-s03.itest.mjs` (GT-AC-5), `test-data-residue --simulate` (E5), `pipeline` và `app` npm test ở S4.
- Files: `pipeline/CLAUDE.md` (dòng `scripts/test-data-residue.mjs` nhắc vế SQL dùng hằng).
- Phục vụ: E5. independent: false.
