---
schema_version: 1
feature: Mỗi đêm scorecard ghi tỉ lệ thẻ ghép căn chờ duyệt có đủ dữ liệu hai bên (ảnh, đặc trưng nhà, người đăng, tin còn sống)
slug: do-the-duyet-du-du-lieu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-do-the-duyet-du-du-lieu-design.md
---

# Acceptance Contract: do-the-duyet-du-du-lieu

## Context

Hàng HD11 của `docs/plan/lo-trinh.json` (T2, dãy P4, đợt 3). Cổng Đáng `build`: Mạnh 30/10 «Các điều còn lại theo đề xuất»
(audit hàng duyệt §7). Căn cứ: `docs/research/audit-hang-duyet-3010.md` §0, §2.3, §3.1, §5.1. Hôm nay 7 thẻ ghép căn chờ.

## Criteria

- AC-1: Given thẻ `entity_match` đang chờ, When lệnh `do-the-duyet.mjs` đọc (giao dịch chỉ đọc), Then nó ra bốn kiểm đúng
  design §1.
  - `roi-kho`: thẻ có bên mà `offer_id` không còn trong `sale_offers`.
  - `anh-ops`: thẻ có bên không có dòng `media` mang `local_file`; `anh-admin`: thẻ có bên không có dòng `media` nào.
  - `do-day`: mỗi nguồn, số bên có giá trị ở từng trường trong 10 trường của bảng so cộng «người đăng»
    (`seller_phone_hash` hoặc `seller_name`), đọc từ `sale_offers` hiện tại; bên rời kho không vào mẫu số (đã đếm ở
    `roi-kho`) — Hỏi-2 chờ Mạnh, khuyến nghị đang ghi ở đây.
  - Thẻ không còn chờ và thẻ `agent_output` không được đếm.
- AC-2: Given một bản chép DB máy thu (DB thử), When chạy lệnh và câu đo độc lập viết lại trong phép đo (không nạp lệnh),
  Then mọi số trùng nhau; ma trận Δ viết trước: mỗi fixture thẻ chờ (bên rời kho · bên 0 ảnh local · bên 0 ảnh · bên thiếu
  trường) đổi đúng các ô viết trước, ô khác không đổi; thẻ đã quyết thêm vào không đổi ô nào.
- AC-3: Given `--write`, When ghi, Then mỗi (kiểm, đối tượng) một dòng `dq_check_results` của ngày hôm nay (giờ máy thu,
  kể cả khi phiên DB đặt UTC); chạy hai lần cùng ngày không nhân dòng; ba kiểm đầu `pass` khi bằng 0, `fail` khi không;
  `do-day` luôn `pass` (chỉ báo, Hỏi-1); `detail` chỉ số đếm (không offer_id, chữ tin, URL); lệnh chỉ ghi
  `dq_check_results`; dòng `fail` không đổi mã thoát (lượt `--write` có dòng `fail` vẫn thoát 0).
- AC-4: Given `scripts/cloud-sync.sh`, When job chạy, Then bước `do-the-duyet` (với `--write`) là `job_run` cuối, sau
  `do-danh-ba-sdt`; lệnh hỏng thì job ≠ 0 (Hỏi-3 chờ Mạnh: chỗ đặt cloud-sync hay SQL 450, khuyến nghị đang ghi ở đây).
- AC-5: Given các dòng `the-duyet:*`, When bảng «Kiểm chất lượng» trên `/ops/quality` đọc qua `app/src/lib/dq-labels.ts`,
  Then tên kiểm, đối tượng, chi tiết có nhãn tiếng Việt; ca ON12-AC-5 xanh trên DB thử sau một lượt `--write`; nhãn mới có
  thuật ngữ trong `CONTEXT.md`.
- AC-6: Given hôm nay, When chạy lệnh (không ghi) trên DB máy thu, Then in đủ dòng cho mọi thẻ chờ hiện có (7 thẻ lúc viết)
  và bảng số được chép vào bằng chứng; số `anh-ops`/`anh-admin` trùng số bên mà bộ đọc ảnh thật của app
  (`app/src/lib/ops/review-media.ts`, theo vai) trả 0 ảnh trên cùng các thẻ — thước ngoài lệnh và ngoài câu đo của probe.
- AC-7: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong: `pipeline/do-the-duyet.mjs`,
  `pipeline/do-the-duyet.test.mjs`, `pipeline/CLAUDE.md` (một dòng), `scripts/cloud-sync.sh` (một bước),
  `scripts/job-exit.test.mjs` (dãy bước ghim của cloud-sync), bản ghim lại của hồ sơ có `paths` chạm tệp đó (`evidence-report.md`,
  `run-log.jsonl` của `de-xuat-thanh-phat-bieu-bac`, `thoi-gian-va-hieu-luc`),
  `app/src/lib/dq-labels.ts`, `app/tests/dq-the-duyet-label.test.tsx`, `CONTEXT.md`, `_acceptance/config.yaml`, hồ sơ này,
  design doc, plan, tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`).
- AC-8: Given dòng `the-duyet:*` vừa ghi ở cuối một lượt cloud-sync, When lượt kế chạy `sync-cloud.mjs`, Then câu đọc
  thật của bước sync (bảng `dq_check_results` trong danh sách bảng của nó) mang đủ các dòng `the-duyet:*` của hôm nay —
  dòng lên cloud trễ đúng một lượt (≤ 15 phút).

## Coverage

- Trục **kiểm × đối tượng** (roi-kho, anh-ops, anh-admin × `entity_match`; do-day × nguồn) — AC-1, AC-2.
- Trục **trạng thái thẻ** (chờ; đã quyết; loại thẻ khác) — AC-1, AC-2.
- Trục **đường ra** (bảng in, `--write`, chạy lại trong ngày, cloud-sync, lên cloud ở lượt kế, `/ops/quality`) — AC-3,
  AC-4, AC-8, AC-5.
- Thước CE: câu đo độc lập trên cùng bản chép DB; fixture đổi đúng ô viết trước. Bản quét: `coverage-scan.md`.

## Đường đo

- Ngưỡng ở `opportunity.md` (bật khi): «Chạy hai lần cùng ngày không nhân dòng» — AC-3; «mỗi thành phần có tỉ lệ riêng» —
  AC-1/AC-3 (ba kiểm riêng + do-day từng trường); «thẻ không còn chờ không được đếm» — AC-1, AC-2.

## Out of scope

- Sửa các lỗi được đo (H1, H3, H5, H7, H8); thẻ `agent_output`.
- Ngưỡng đạt cho độ đầy; màn số riêng trên `/ops/quality`.

## Notes

- Số audit 30/10 (§2.3, §3.1) không dựng lại được: DB máy thu đã trôi (thẻ chờ 7, khác bộ thẻ audit đo). Thước ngoài
  thay thế là bộ đọc ảnh thật của app (AC-6); `roi-kho` và `do-day` chỉ có câu đo độc lập (AC-2) — giới hạn đã khai.
- «Người đăng» đo theo cột của tin (`seller_phone_hash`/`seller_name`); `seller_ref` S03/S05 là hằng số (H15) nên không dùng.
