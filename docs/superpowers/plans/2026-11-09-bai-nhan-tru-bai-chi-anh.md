# Kế hoạch thi công — bai-nhan-tru-bai-chi-anh (DF6)

Hồ sơ `_acceptance/bai-nhan-tru-bai-chi-anh/` (Cổng Phạm vi Mạnh duyệt 09/11). Phần mã đã dựng trước Cổng Phạm vi làm bản
bấm được cho design-pass; kế hoạch này chốt phần còn lại. Verify per-task theo quy ước kho (tsc + lint + bộ thử của task).

| # | Task | Files | Verify | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Mã nhánh bài + 600 + bộ chạy (đã dựng, rà lại theo hợp đồng đã duyệt) | `pipeline/lib/nhanh-bai-s03.mjs`, `pipeline/refresh-data-flow.mjs`, `pipeline/sql/600_data_flow.sql` | `node pipeline/refresh-data-flow.mjs` trên DB thử `oneinvest_p4_df4` | E1–E4, E10 | false |
| 2 | Trang: Sankey hai đầu ra, lưới, Chặng theo ngày (đã dựng) | `app/src/components/ops/data-flow/**`, `app/src/lib/data-flow-queries.ts` | `cd app && npx tsc --noEmit && npx eslint src/components/ops/data-flow src/lib/data-flow-queries.ts` | E4–E8, E11 | false |
| 3 | Bộ thử DF6 (ca `DF6-AC-1..8`, chiều đỏ trên bản chép tạm) | `app/tests/data-flow-bai-chi-anh.test.tsx` | `config:executors.test.df4_app` | E1–E8 | false (cần 1, 2) |
| 4 | Thước dữ liệu thật | `pipeline/scripts/do-nhanh-bai-s03.mjs` | `config:executors.script.df4_that` + ba `--doi-chung-hong` | E10 | false |
| 5 | Hồi quy bộ dòng chảy có sẵn | — | `config:executors.test.df4_cu` | E9 | false |
| 6 | Dọn: bỏ cấu hình :3465 cục bộ khỏi `.claude/launch.json`, `/verify` các module đổi | `.claude/launch.json` | `git diff --stat` | — | false |

Thứ tự tuần tự 1 → 6 (mọi task chung vùng `data-flow`). Không migration, không route mới.
