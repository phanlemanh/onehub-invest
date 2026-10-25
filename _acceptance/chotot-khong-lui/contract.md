---
schema_version: 1
feature: nạp lại một snapshot Chợ Tốt cũ hơn không làm lùi giá, tiêu đề và nội dung của tin đã có bản mới
slug: chotot-khong-lui
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T09:27:03Z
approved_by:
approved_at:
---

# Acceptance Contract: chotot-khong-lui

## Context

Ở Cổng Bằng chứng của `giu-captured-at` (PR #87), Mạnh tách Ngoài-1 thành việc riêng. Lỗi: nạp lại một snapshot S06 cũ hơn
sau bản mới thì `snapshot_id` và `captured_at` không lùi, nhưng giá, tiêu đề, payload vẫn bị ghi đè bằng bản cũ. Tin trên
sản phẩm hiện giá cũ mà mốc thu lại là mốc mới. Lời giao `claudedp-2510-6`; ZCode XONG ở `zcode/chotot-khong-lui-noi-dung`
@ 8bb54ae: điều kiện `WHERE EXCLUDED.captured_at >= stg_chotot_ads.captured_at` chặn trọn lệnh cập nhật. Nhánh nghiệm thu
= 8bb54ae gộp `origin/main` 08afadf.

## Criteria

- AC-1: Given một tin đã nạp từ snapshot mới, When nạp tiếp một snapshot cũ hơn chứa cùng tin với giá và tiêu đề khác, Then dòng tin không đổi gì (giá, tiêu đề, payload, snapshot_id, captured_at giữ bản mới).
- AC-2: Given một tin đã nạp từ snapshot cũ, When nạp snapshot mới hơn, Then mọi cột tiến theo bản mới cùng nhau và tin chỉ có ở bản mới được thêm.
- AC-3: Given đã nạp một snapshot, When nạp lại đúng snapshot đó, Then không nhân dòng, không dòng nào đổi; và snapshot khác có cùng mốc thu thì vẫn cập nhật như trước.
- AC-4: Given mọi cách nạp ở trên, When đối chiếu bảng, Then `captured_at` của mỗi dòng bằng giờ thu của snapshot mà dòng đang trỏ tới.
- AC-5: Given nhánh, When chạy lại kiểm của `giu-captured-at` (Chợ Tốt), test của ZCode và bộ test `scripts/` (gồm check-freshness dùng importer thật), Then tất cả xanh.
- AC-6: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có importer Chợ Tốt, test của nó, harness và hồ sơ này.

## Coverage

- Bỏ coverage-scan — một lệnh SQL; trục: thứ tự nạp (mới→cũ / cũ→mới / cùng snapshot / khác snapshot cùng mốc), bất biến
  mốc thu, hồi quy importer và đo độ tươi, phạm vi tệp.

## Out of scope

- Dòng cũ có `captured_at` NULL sẽ không được cập nhật (so sánh với NULL) — sau lượt khôi phục 2510-7 không còn dòng nào như vậy.
- Hai snapshot khác nhau cùng mốc thu: bản nạp sau thắng — chấp nhận (cùng một lượt thu).
- `import-airbnb` (S03/S05) giữ luật LEAST của 2410-1 — không đổi ở vòng này.
- Khôi phục dữ liệu đã bị lùi trước vòng này — chưa có số đo cho thấy cần; mở việc riêng nếu có.

## Notes

- Harness `scripts/chotot-khong-lui/acceptance.mjs` dựng DB TẠM `acc_ckl_*` (pg_dump -s), fixture snapshot trong thư mục tạm,
  xoá khi xong; không ghi DB oneinvest. Trên importer của main: khong-lui đỏ (giá lùi về 1.000.000.000), tien và idempotent xanh.
