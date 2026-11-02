---
schema_version: 1
feature: S08 thu đúng một lượt mỗi tuần theo launchd và có SLO độ tươi 192 giờ
slug: s08-lich-tuan
owner: manh.phan@onemount.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-02T02:08:02Z
approved_by:
approved_at:
---

# Acceptance Contract: s08-lich-tuan

## Context

Chính sách Mạnh duyệt 24/10: S08 chỉ đọc, tối đa một lượt mỗi tuần, chỉ dùng nội bộ. ZCode (claudedp-3110-10, `zcode/s08-tuan` @ 0eac6516) thêm plist Chủ nhật 06:30, `scripts/s08-danh-muc/s08-weekly.sh` qua cổng vòng đời, và SLO S08 192 giờ ở cả `scripts/lib/freshness.mjs` lẫn `app/src/lib/freshness.ts`. Review 02/11 bắt fixture ops-facts thiếu `stg_s08_inventory`, ZCode đã sửa. Máy chủ không có bảng này: `freshnessLocalOnly` trả rỗng trước khi chạy probe.

Source input: GIAO claudedp-3110-10 + MỞ LẠI 02/11 + XONG của ZCode 01:07Z.

## Criteria

- AC-1: Given mốc thu S08 cách đây đúng 192 giờ và 193 giờ, When đo độ tươi, Then lần lượt là tươi và quá hạn — ma trận biên phủ S08.
- AC-2: Given lược đồ ops-facts và bản TS của độ tươi, When chạy test ops-facts và slo-mot-nguon, Then xanh — một định nghĩa độ tươi ở cả hai đường.
- AC-3: Given thiếu tệp cấu hình tầng A, When chạy `s08-weekly.sh`, Then exit 1 và không gọi bước thu.
- AC-4: Given cổng vòng đời trả 3 (không chạy), When chạy script, Then exit 0, in dòng bỏ qua, không gọi bước thu; Given cổng lỗi, Then exit 1, không gọi bước thu.
- AC-5: Given cổng cho chạy, When chạy script với bộ thu giả, Then gọi đúng một lần bộ thu với `--source s08-danh-muc` rồi nạp snapshot mới nhất; bước thu lỗi thì exit 1 và không nạp.
- AC-6: Given plist, When đọc, Then đúng một lịch: Chủ nhật 06:30, trỏ `s08-weekly.sh`.
- AC-7: Given danh sách bảng sync, When chạy sync-pii test, Then xanh — `stg_s08_inventory` không sync sang Máy chủ.

## Coverage

- Bỏ coverage-scan: việc hẹp; trục rủi ro liệt kê thẳng: biên SLO (AC-1), hai đường đo (AC-2), fail-closed (AC-3, AC-4), đường chạy (AC-5), nhịp theo chính sách (AC-6), tầng dữ liệu (AC-7).

## Out of scope

- Cài plist và chuyển tệp `s08-weekly.sh` untracked trong checkout chính: bước triển khai, đang chạy sẵn từ tệp đó, lần đầu 08/11 06:30.
- Gọi API thật của nguồn S08.
- Đích 200 dự án của S08: chưa đạt, báo riêng trong mục tiêu dữ liệu.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-02:
  - Ngoài-1: Chạy lần hai trong ngày vẫn báo xong dù không có bản thu mới; số độ tươi vẫn đo theo giờ thu thật.
  - Ngoài-2: Tệp lịch tuần còn nằm ngoài git ở máy chạy, phải chuyển trước lần cập nhật code sau merge và kiểm lại trước 08/11 06:30, nếu lỡ thì mất một lượt tuần.
  - Ngoài-3: Tên một ca kiểm còn ghi năm giá trị độ tươi trong khi ca đã kiểm đúng sáu giá trị.
