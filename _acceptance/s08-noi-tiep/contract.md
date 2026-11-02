---
schema_version: 1
feature: bộ thu và bộ nạp S08 không nuốt lỗi token, không trùng sourceId danh mục, không đọc nhầm số
slug: s08-noi-tiep
owner: manh.phan@onemount.com
risk_tier: T2
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-11-02T02:08:02Z
approved_by:
approved_at:
---

# Acceptance Contract: s08-noi-tiep

## Context

Năm điểm còn lại sau khi S08 chạy thật (claudedp-2610-22, `zcode/s08-noi-tiep` @ b0a13449): envelope lỗi của danh mục bị nuốt thành 0 khu đô thị, `sourceId` item danh mục trùng item detail, importer cảnh báo sai «state lạ», `s08Num` nhận `0x10` thành 16, và chú thích test nói nhầm fixture là dữ liệu thật. Phải vào main và build `dist` trước lượt 08/11 06:30.

Source input: GIAO claudedp-2610-22 + XONG của ZCode 23:01Z 01/11.

## Criteria

- AC-1: Given API danh mục trả `code≠1`, When thu, Then ném lỗi nêu mã; Given `code=1` và trang rỗng, Then kết thúc bình thường, không ném.
- AC-2: Given item danh mục và item detail của cùng khu đô thị, When thu, Then `sourceId` khác nhau.
- AC-3: Given chuỗi `' '`, `'0x10'`, `'1.500.000'`, `'1 500'`, When đổi bằng `s08Num`, Then đều null; Given `' 100,5 '`, Then 100.5.
- AC-4: Given snapshot giả có item catalog và detail, When nạp bằng importer thật hai lần, Then không có cảnh báo state lạ, log đếm số bỏ, lần hai không nhân dòng.
- AC-5: Given đường S08, When chạy các chế độ kiểm `nguon-duy-nhat`, `khong-lo-nguon`, `thieu-env`, Then đều đạt — không lộ tên nguồn, thiếu cấu hình thì dừng.

## Coverage

- Bỏ coverage-scan: năm điểm đã liệt kê trong lời giao, mỗi điểm một tiêu chí, kèm chiều không được kích hoạt.

## Out of scope

- Viết lại snapshot cũ mang `sourceId` trùng: bất biến, giữ nguyên.
- Dọn `trap` không kiểm chủ khoá và các việc ngoài năm điểm.
- Gọi API thật của nguồn S08; build `dist` trên checkout chính là bước triển khai.
