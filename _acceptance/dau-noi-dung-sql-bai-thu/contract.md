---
schema_version: 1
feature: Các bản SQL chép định nghĩa bài thử (Luồng 7 ngày ở pipeline và app, Dòng chảy dữ liệu, thước dư lượng tin giả) nhận dấu noi-dung như testMarker, để số Ops và lệnh kiểm tin giả khớp tập transform đọc
slug: dau-noi-dung-sql-bai-thu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, api]
status: verified
approved_by: Mạnh
approved_at: 2026-11-10
design_doc: docs/superpowers/specs/2026-11-10-dau-noi-dung-sql-bai-thu-design.md
---

# Acceptance Contract: dau-noi-dung-sql-bai-thu

## Context

GN2 (`lay-mau-khu-trung-theo-tin`) thêm dấu bài thử thứ tư `noi-dung` (link `trycloudflare.com` hoặc chữ «[Tên sàn]») vào
`testMarker` ở `pipeline/lib/test-posts.mjs`. Transform đã gạt các bài này. Bốn bản SQL chép định nghĩa bài thử thì chưa:
- `S03_POSTS_SQL` (`pipeline/lib/ops-flow.mjs`) và bản chép nguyên văn ở `app/src/lib/collections-queries.ts` — cột «Bài nhận»
  của Luồng 7 ngày;
- đoạn `IS_TEST` của `pipeline/sql/600_data_flow.sql` — trang Dòng chảy dữ liệu;
- câu đếm độc lập `offers_from_test_sql` của `pipeline/scripts/test-data-residue.mjs` — thước dư lượng tin giả.

Hệ quả: số Ops đếm cả bài thử của Mạnh, và `test-data-residue --simulate` báo lệch giả khi có tin sinh từ bài noi-dung.

Source input: hàng GN5 của `docs/plan/lo-trinh.json`. Căn cứ: GN2 Ngoài-4, 5, 7, 8 (Mạnh «mở hợp đồng mới» 07/11), Cổng Đáng
GN5 «Build» (Mạnh 10/11).

## Criteria

- AC-1: Given ma trận bài viết trước, When chạy `testMarker` và bốn bản SQL trên cùng các dòng, Then:
  - bốn bản là `S03_POSTS_SQL` của `ops-flow.mjs`, bản chép của nó trong `app/src/lib/collections-queries.ts`, câu đếm độc lập
    của `test-data-residue`, đoạn `IS_TEST` của `600_data_flow.sql`;
  - ma trận có mỗi dấu một dòng dương: nguồn snapshot thử, tác tử thử, nhóm TEST, link `trycloudflare.com`, «[Tên sàn]»,
    «[TÊN SÀN]» viết hoa, «[Tên sàn]» dạng NFD;
  - ma trận có các dòng gần trúng mà là bài thật: chữ «tên sàn» không ngoặc, «[Tên sàn mới]», link ảnh thường, nhóm
    «TESTING ROOM», bài không chữ;
  - mỗi bản cho kết quả bài thử hay bài thật khớp `testMarker` ở TỪNG dòng (mỗi dòng một ngày, không so tổng);
  - chuỗi regex SQL của dấu noi-dung chỉ viết ở `test-posts.mjs`; `ops-flow.mjs` và `test-data-residue.mjs` dùng hằng ấy.
- AC-2: Given lược đồ thử có bài S03 mang dấu noi-dung, When tính Luồng 7 ngày ở bên ghi (khối `luong7`) và ở trang máy thu
  (`getFlowDays`, bản chép trong app), Then:
  - cột «Bài nhận» không đếm các bài ấy;
  - hai bên vẫn bằng nhau từng ngày.
- AC-3: Given lược đồ thử có bài S03 mang dấu noi-dung, When làm tươi `data_flow_snapshot` bằng `600_data_flow.sql`, Then:
  - các bài ấy không vào «Bài nhận» (`received`);
  - chúng vào «bài thử bị loại» (`test_rejected`).
- AC-4: Given tin rao sinh từ một bài mang dấu noi-dung, When `test-data-residue` đo dư lượng, Then:
  - câu đếm SQL độc lập (`offers_from_test_sql`) đếm tin ấy, bằng đúng số `offers_from_test` của phép đếm qua `testMarker`;
  - `test-data-residue --simulate` trên DB máy thu thoát 0 (mọi ghi trong giao dịch rồi ROLLBACK).

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: các trục liệt kê đủ từ ô và mã.

- Bản chép: `S03_POSTS_SQL` · bản app · `IS_TEST` của 600 · câu đếm của `test-data-residue` (AC-1, AC-2, AC-3, AC-4).
- Dấu: nguồn snapshot · tác tử · nhóm · noi-dung (AC-1).
- Chữ: thường · hoa · NFD · gần trúng không ngoặc · không chữ (AC-1).
- Nơi người thấy số: Luồng 7 ngày (cloud + máy thu) · Dòng chảy dữ liệu · lệnh kiểm tin giả (AC-2, AC-3, AC-4).

## Đường đo

- «`test-data-residue --simulate` xanh ngay sau gộp» — lệnh `--simulate` trên DB máy thu, ROLLBACK · AC-4.
- «"Bài nhận" Luồng 7 ngày không đếm bài thử của Mạnh» — khối `luong7` và `getFlowDays` trên lược đồ thử có bài noi-dung · AC-2.
- «trang Dòng chảy dữ liệu không đếm bài thử» — `received` / `test_rejected` của 600 trên lược đồ thử · AC-3.

## Out of scope

- Đổi `testMarker` hay regex JS của dấu bài thử; tập bài transform đọc giữ nguyên.
- Dọn bài hay tin thử khỏi DB máy thu.
- Khoá cũ `zaloFlow` của bản tin (lọc `LIKE '%zalo-agent%'`, giữ cho bản app cũ).
- Hàm SQL dùng chung qua migration.
- Importer bỏ bài thử từ gốc (làn ZCode).

## Notes

- Test DB: các bài kiểm pipeline chạy trong giao dịch ROLLBACK; bài kiểm app chạy trên lược đồ tạm. `--simulate` đọc DB máy thu,
  mọi ghi ROLLBACK. Không áp migration nào.
