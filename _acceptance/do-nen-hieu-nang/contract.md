---
schema_version: 1
feature: đo nền hiệu năng DB local + 5 trang chính (Invest, Ops) trên build prod — số nền vào docs/research, ngưỡng chỉ đề xuất
slug: do-nen-hieu-nang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-27-do-nen-hieu-nang-design.md
---

# Acceptance Contract: do-nen-hieu-nang

## Context

Căn cứ: hàng `do-nen-hieu-nang` của đợt dieu-phoi-dot0-cam-mau (P4, Mạnh giao 27/10): bật pg_stat_statements ở DB local, đo
p50/p95 thời gian tải 5 trang chính (Invest + Ops) và 10 truy vấn chậm nhất, ghi số nền vào docs/research; sau đó mới trình
ngưỡng để đưa vào luật. Hàng ĐO, không đặt luật. Khởi động lại DB đã làm theo lối an toàn Mạnh chọn (design doc).

## Criteria

- AC-1: Given DB local :5433 sau khởi động lại, When đọc cấu hình, Then `max_connections` = 200, `shared_preload_libraries` có
  `pg_cron` và `pg_stat_statements`, extension `pg_stat_statements` tồn tại; bản sao lưu tại đường ghi trong design doc tồn tại,
  sha256 khớp đúng chuỗi ghi trong design doc, `pg_restore -l` đọc được ≥ 285 mục dữ liệu bảng; `db/docker-compose.yml` không đổi.
- AC-2: Given app đã `next build`, When chạy `node scripts/do-nen-hieu-nang/do.mjs`, Then 5 trang (3 Invest, 2 Ops) mỗi trang 20/20
  lượt đúng trang (HTTP 200 và `<title>` đúng trang), in p50/p95 TTFB và tổng; trang Ops đăng nhập bằng tài khoản đo riêng, băm
  mật khẩu của `ops-test@local.test` trước = sau lượt đo; bản sao script đổi dấu tiêu đề của một trang thành sai → đỏ
  «TRANG KHONG DUNG».
- AC-3: Given `docs/research/do-nen-hieu-nang-2610.md` và `.json`, When đối chiếu, Then bảng 5 trang trong tài liệu khớp từng số
  p50/p95 của JSON, tài liệu liệt 10 truy vấn theo tổng thời gian và 10 theo trung bình khớp JSON (số lần gọi, tổng ms, trung bình
  ms); phía sinh số: JSON có mốc reset pg_stat_statements trước lượt làm nóng đầu, mỗi danh sách đủ 10 dòng xếp giảm dần đúng khoá,
  danh sách trung bình mọi dòng gọi ≥ 3, mọi số gọi là bội của (lượt + 2); có mục máy + cỡ dữ liệu + cách đo + giới hạn đo; bản
  chép tài liệu đổi một số p50 → đỏ nêu trang lệch; bản chép JSON đảo hai dòng hoặc bỏ mốc reset → đỏ.
- AC-4: Given ảnh chụp thống kê 15 bảng lớn nhất trong JSON đo (cỡ, `n_live_tup`, `reltuples`, lần ANALYZE), When đối chiếu tài
  liệu, Then mọi bảng `public` > 50 MB có `n_live_tup` = 0 và chưa ANALYZE (ít nhất một bảng, không thì đỏ «CA KHONG DO») đều được
  nêu tên kèm cỡ và gốc (bộ đếm thống kê bị xoá; bảng không ghi thêm nên không tự ANALYZE); kết luận khớp số: các bảng ấy có
  `reltuples` > 0 thì tài liệu ghi planner không mù, và nêu `nights` phình; bản chép bỏ tên một bảng hoặc đổi thành «planner mù» → đỏ.
- AC-5: Given tài liệu, When soát, Then có mục «Đề xuất ngưỡng» tách riêng, ghi rõ là đề xuất chờ Mạnh; `AGENTS.md` không đổi; dòng
  nhánh thêm ở mọi tệp đổi so merge-base (cùng danh sách AC-6) cộng tài liệu + JSON không chứa tên nguồn thật (bộ quét tầng A, tên rút
  từ `source_registry` lúc chạy → 0; đối chứng dương: bản chép `do.mjs` chèn một tên thật → bắt, nêu tệp, không in tên).
- AC-6: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có `scripts/do-nen-hieu-nang/`,
  `docs/research/do-nen-hieu-nang-2610.*`, hồ sơ này, cấu hình, tệp máy sinh, design/plan.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — câu giao nêu đích danh phép đo; trục: hạ tầng đo (AC-1), đo trang (AC-2), số trong tài liệu
  khớp số đo (AC-3), thống kê bảng (AC-4), không đặt luật + không lộ tầng A (AC-5), phạm vi (AC-6).

## Out of scope

- Đặt ngưỡng vào AGENTS.md hay luật — chỉ đề xuất, Mạnh quyết.
- ANALYZE các bảng thiếu thống kê, dọn lược đồ tạm test — đề xuất, không làm ở hàng đo.
- Chuyển dữ liệu DB vào volume, sửa `db/docker-compose.yml` — hàng riêng.
- Đo tải đồng thời nhiều client.

## Notes

- Hỏi-1 ở Cổng Phạm vi (sổ quyết định, dòng `chi-nguoi`) đã trả lời 29/10 theo khuyến nghị: thước «thời gian tải» là HTML phía
  server trên build prod, 20 lượt cho 5 trang `/vn`, `/vn/hanoi`, `/vn/hanoi/listings`, `/ops`, `/ops/data-flow`; LCP trong trình
  duyệt là hàng riêng.
