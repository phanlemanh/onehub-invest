# Kế hoạch: bi-danh-viet-tat-phan-khu (DA51)

Thiết kế: `docs/superpowers/specs/2026-11-20-bi-danh-viet-tat-phan-khu-design.md`. Hợp đồng: `_acceptance/bi-danh-viet-tat-phan-khu/contract.md`.
Các task phụ thuộc nhau (lõi → lệnh → test → thước thật), chạy tuần tự trong phiên chính.

| Task | Tệp | Lệnh kiểm từng task | Phục vụ | independent |
|---|---|---|---|---|
| T1 Lõi thuần: bảng tên tắt, chọn đích, băm, thẻ, giao diện đọc `docTenPhanKhu`, từ điển + khớp chữ luật GT5, đếm trước/sau | `pipeline/lib/phan-khu-s16-bi-danh.mjs` | `node --check`; BDV-1, BDV-2, BDV-6, BDV-9 | E1, E2, E6 | false |
| T2 Lệnh: `--the`, `--ap`, `--dao`, `--kiem`, `--do`; áp trong giao dịch khoá `project_link_rules`, meta theo mã luật | `pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs` | `--the`, `--do` chỉ đọc trên DB máy thu (`PGOPTIONS=-c default_transaction_read_only=on`) | E2, E3, E4, E8 | false |
| T3 Test DB thử BDV-1..9 (khung DB thử của DA46), gồm thứ tự với `apNoi`/`daoNoi` thật và lượt dựng đêm `dung` | `pipeline/scripts/bi-danh-viet-tat-phan-khu.itest.mjs` | `node --test --test-concurrency=1 …itest.mjs` 9/9; phá thử từng nhánh (`_acceptance/bi-danh-viet-tat-phan-khu/pha-thu.md`) | E1–E8 | false |
| T4 Thước dữ liệu thật trên bản chép DB máy thu | `pipeline/scripts/bi-danh-viet-tat-phan-khu-that.mjs` | chạy dưới khoá s4 trước lượt chấm | E9 | false |
| T5 Khoá executor `bdv_*` | `_acceptance/config.yaml` | `s4-args.mjs` giải được mọi `config:` | E1–E9 | false |
