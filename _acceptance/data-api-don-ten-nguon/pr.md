<!-- Soạn trên M5 cho GS mở PR hộ (gh trên M5 không có token). Nhánh: fix/data-api-don-ten-nguon → main. -->

# Tiêu đề

fix(data-api): PB5 dọn tên nguồn thật khỏi lược đồ mẫu công khai, dùng mã S0x (data-api-don-ten-nguon)

# Thân

## Vì sao

`data-api/` đi kho công khai `onehub-data-api` qua `tools/sync-public.sh`. Lược đồ mẫu dưới `data-api/db/` và `seed.sql`
còn mang tên nguồn thật (tầng A, AGENTS.md luật 6) trong chú thích, dữ liệu mẫu `source_registry` và một tên tệp.
PB5 là điều kiện để `data-api` được đẩy ra kho công khai (gs-2511-5).

## Đổi gì

- Lược đồ mẫu `data-api/db/**`, `data-api/seed.sql`: chú thích, dữ liệu mẫu `source_registry`, tên tệp dùng mã `S0x`.
  Tên bảng/cột mang tên nguồn (89 cụm) giữ nguyên — nợ lược đồ, đổi là migration + DDL cloud (ngoài phạm vi, OOS-1).
- Thước mới `scripts/data-api-ten-nguon.mjs` (+ test, + `scripts/data-api-ten-nguon-db.sh`): quét mọi tệp chữ dưới
  `data-api/`, xếp từng cụm tên theo chỗ đứng (chú thích · chuỗi · định danh · tên tệp), chỉ cho định danh lược đồ đã biết;
  dựng lược đồ mẫu trên PostGIS dùng một lần và so quan hệ `source_registry`, mặc định cột với trước khi dọn.
- `data-api/test/dong-ba-route.test.ts` (HT19, vào nhánh qua gộp `main`): tên bảng nguồn qua hằng định danh, câu báo đổi
  chữ — nghĩa kiểm không đổi (GS phán 27/11, mở rộng vùng tệp ghi ở Notes).
- Ba khoá lệnh `pb5_*` trong `_acceptance/config.yaml`.

## Bằng chứng

- S4 vòng 1 (chạy lại) trên M5 @678c08ec5: **PASS 5/5 eval** — `_acceptance/data-api-don-ten-nguon/evidence-report.md`.
- Soát M5 lượt `678c08ec5-20261127T094256`: `data-api` xanh, `scripts` 668/688 pass, 0 đỏ, 18 bỏ qua.
- 8 mục ngoài hợp đồng (đều đề xuất ghi Known limits) — Mạnh quyết ở Cổng Bằng chứng; xem `review-findings.md`.

## Áp sau gộp

Không có migration, không ghi dữ liệu, không đổi cloud. Không triển khai Vercel, không `sync-public` (chỉ Mạnh gọi).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
