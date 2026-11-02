---
schema_version: 1
feature: bộ thu S06 nhận mã tỉnh params.region bên cạnh region_v2, để bật được vùng mà mã cũ không hoạt động
slug: s06-region-tinh
owner: manh.phan@onemount.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-02T02:08:02Z
approved_by:
approved_at:
---

# Acceptance Contract: s06-region-tinh

## Context

Đích ra mắt 05/11 của S06 là 5 vùng, nhưng `region_v2` của Hải Phòng, Bình Dương, Khánh Hoà trong `collection_units` là mã cũ và bộ thu chỉ biết tham số này. ZCode (claudedp-0111-2, `zcode/s06-region-tinh` @ 33034195) thêm `params.region` (mã tỉnh) được ưu tiên; vùng chỉ có `region_v2` giữ nguyên hành vi. `stg_chotot_ads.region_v2` là NOT NULL nên phải kiểm cả chiều nạp: ZCode báo payload của API vẫn trả `region_v2` nên importer không đổi.

Source input: GIAO claudedp-0111-2 (liên làn, 01/11) + XONG của ZCode 21:51Z.

## Criteria

- AC-1: Given vùng có `params.region`, When bộ thu chạy với API giả, Then mọi lời gọi mang `region=<mã>`, meta mang `region`; khi vùng có cả hai mã thì `region` thắng.
- AC-2: Given vùng chỉ có `region_v2` (như Hà Nội, TP.HCM, Đà Nẵng), When bộ thu chạy, Then lời gọi và meta vẫn là `region_v2`, không có `region=` — vùng đang chạy không đổi hành vi.
- AC-3: Given vùng active thiếu cả hai mã, When bộ thu chạy, Then in một dòng `params-hong`, 0 lời gọi cho vùng đó, các vùng khác vẫn chạy.
- AC-4: Given item chế độ `region` có `region_v2` trong payload, When nạp bằng importer thật vào lược đồ tạm, Then exit 0, dòng có `region_v2` lấy từ payload và `city_code` lấy từ meta.
- AC-5: Given item chế độ `region` KHÔNG có `region_v2` trong payload, When nạp, Then importer dừng khác 0 và không có dòng nào được ghi — không có dòng thiếu mã vùng lọt vào.
- AC-6: Given cổng vòng đời, When chạy bộ test cong-tac-that, Then xanh — vùng không `active` vẫn không được thu.

## Coverage

- Bỏ coverage-scan: đổi hẹp một tham số; trục rủi ro liệt kê thẳng: chế độ mới (AC-1), không đổi cái đang chạy (AC-2), dữ liệu cấu hình hỏng (AC-3), biên nạp (AC-4, AC-5), cổng (AC-6).

## Out of scope

- Bật Hải Phòng, Bình Dương trong DB và thu bù: bước triển khai sau merge, có GIAO riêng; Khánh Hoà 0 tin nên không bật.
- Chốt `cityCode` của Bình Dương (đã sáp nhập TP.HCM) và đưa vùng mới lên canonical: thuộc `s06-vung-moi-len-canonical`.
- Gọi API thật của nguồn: số đo tin từng tỉnh là của ZCode, không chấm lại ở đây.
- Form thêm vùng trên `/ops/sources` nhận `region`: chưa cần, cấu hình qua triển khai.
