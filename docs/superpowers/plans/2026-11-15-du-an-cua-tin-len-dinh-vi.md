# DV7 du-an-cua-tin-len-dinh-vi — kế hoạch thi công (Gate 1.5, một trang)

Hợp đồng `_acceptance/du-an-cua-tin-len-dinh-vi/contract.md` (Mạnh duyệt 15/11, 11 AC) · thiết kế
`docs/superpowers/specs/2026-11-15-du-an-cua-tin-len-dinh-vi-design.md`. Làm tuần tự trong phiên chính (các task dùng chung
migration 105). Mọi test chạy trên DB thử của riêng lượt (`db/db-thu.sh`); DB máy thu chỉ đọc hoặc giao dịch lùi.

| # | Task | Tệp | Kiểm | Eval |
|---|---|---|---|---|
| 1 | Migration 105: view `offer_project` (CTE đệ quy quy nút về dự án gốc, nhánh bài S03/S05, nhánh `s06_offer_project`, một dòng mỗi tin); thay thân `offer_located` (EXISTS) và `data_level_units` (nối view theo tập, giữ chữ ký 087). Áp hai lần trên DB thử. | `db/migrations/105_offer_project.sql`, `pipeline/tests/offer-project.itest.mjs`, `_acceptance/config.yaml` (executor `dv7_db`, `dv7_lui`, `dv7_app`, `dv7_that_*`) | `bash db/check-idempotent.sh 105`; `dv7_db` ca AC-1–AC-4 | E1–E4 |
| 2 | 600: `dinh_vi_link` đọc view; thêm CTE rỗng `toa_link`, `locatedPending` = `ghi_toa AND NOT <khớp toà>`; ca AC-5 chạy tệp 600 thật trên fixture | `pipeline/sql/600_data_flow.sql`, itest task 1 | `dv7_db` ca AC-5 | E5 |
| 3 | App: câu bản ghi máy thu nối view (cloud giữ câu cũ, dò `to_regclass`); `SQL_DEM` của bac-roundtrip đọc view; TB-AC-8 theo thang mới; nhãn «Định vị (cấp dự án)» + gợi ý «chờ khớp toà» có số; thuật ngữ trong `CONTEXT.md` (sinh lại vocab nếu kho đòi) | `app/src/lib/data-flow-queries.ts`, `app/scripts/bac-roundtrip.ts`, `app/tests/thang-bac-db.itest.tsx`, `app/tests/offer-project-app.itest.tsx`, `app/src/components/ops/data-flow/{quality-grid.tsx,flow-sankey-data.ts,records-filter.tsx}`, `CONTEXT.md` | `cd app && npx tsc --noEmit && npm run lint`; `dv7_app`, `tb_app_db` | E8, E11 |
| 4 | Hồ sơ áp: `ap-may-thu/` năm tệp (README thứ tự năm bước + số dòng «len» dự kiến, `sao-luu.sh` ra `~/onehub-backups/db/`, `105-lui.sql` thay hàm trước rồi DROP không CASCADE, `kiem-sau.sql`, `so-chay-thu.md`); itest tệp lùi (ca 10b, 10c) | `_acceptance/du-an-cua-tin-len-dinh-vi/ap-may-thu/*`, `pipeline/tests/offer-project-lui.itest.mjs` | `dv7_lui` | E10 |
| 5 | Script dữ liệu thật: `--doc` (READ ONLY, so phép đếm độc lập), `--hieu-nang` và `--chay-thu` (một giao dịch, thân 600 bỏ đúng một BEGIN/COMMIT — còn COMMIT thì thoát 2 trước khi gửi câu; tải < 14; ROLLBACK; kiểm DB không đổi); chạy `--chay-thu` ghi `so-chay-thu.md` | `pipeline/scripts/offer-project-that.mjs` | chạy ba chế độ trên DB máy thu ngoài 17:00–18:00Z | E6, E7, E9 |
| 6 | `/verify` pipeline + app, `node --check` các .mjs đổi; trạng thái `implemented`; vào S4 | — | `cd pipeline && npm test` (DB thử), app build | — |

**Rủi ro và chốt:** (a) task 5 là lần duy nhất chạm DB máy thu, mỗi lượt một giao dịch lùi, giữ khoá vài giây — chạy lúc tải
< 14 và kiểm `to_regclass('offer_project') IS NULL` sau mỗi lượt; (b) nếu `data_level_units` theo tập vẫn > 2 s thì dừng,
báo GS trước khi nới trần; (c) vùng tệp đã khai với GS; `pipeline/scripts/**` thu về đúng `offer-project-that.mjs`.
