---
schema_version: 1
feature: S05 có đệm cửa sổ thu 5 ngày, khoá nạp không văng hay quay bận, bước thu lỗi có dòng ghim
slug: s05-khoa-nap
owner: manh.phan@onemount.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-11-02T02:08:02Z
approved_by:
approved_at:
---

# Acceptance Contract: s05-khoa-nap

## Context

Các điểm còn lại sau hồ sơ khoa-nap-s05 (claudedp-2510-31, `zcode/s05-khoa-nap` @ 87a3c1d5). Cửa sổ `4 days` vừa khít khoảng thứ Sáu đến thứ Ba; tệp `luc` hỏng làm `$(( ))` văng vòng chờ; `rm -rf` không xoá được thì quay bận vô hạn; bước thu lỗi chưa có dòng ghim chuẩn. Khoá dùng chung với `zalo-import-daily.sh`. S05 đang paused nên đây là chuẩn bị, chưa có tác dụng ngay.

Source input: GIAO claudedp-2510-31 + XONG của ZCode 22:19Z 01/11.

## Criteria

- AC-1: Given plist và mặc định bộ thu, When đọc, Then cả hai là `5 days`.
- AC-2: Given tệp `luc` không phải số, When script gặp khoá, Then gỡ như khoá cũ, không văng lỗi cú pháp; Given PID chết, Then gỡ.
- AC-3: Given khoá của tiến trình còn sống và `luc` còn mới, When script chờ, Then không gỡ, dừng sau trần lượt chờ — khoá khoẻ không bị cướp.
- AC-4: Given `rm -rf` không xoá được khoá, When script chờ, Then có trần và có nghỉ, không quay bận vô hạn.
- AC-5: Given bước thu lỗi, When chạy, Then có dòng ghim `JOB FAIL [apify-facebook-daily]` kèm mã và script trả khác 0 ở cuối lượt.
- AC-6: Given lịch và SLO S05, When chạy các test s05-b-lich, s05-slo, job-exit, Then xanh.

## Coverage

- Bỏ coverage-scan: các điểm đã liệt kê trong lời giao, kèm chiều không được kích hoạt ở AC-3.

## Out of scope

- Bật lại S05 và gọi Apify thật: nguồn đang paused, không gọi trong kiểm thử.
- `trap` không kiểm chủ khoá: giữ như giới hạn đã biết của hồ sơ trước.
- Cài lại plist: bước triển khai khi S05 bật lại.
