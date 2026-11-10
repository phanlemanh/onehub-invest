---
schema_version: 1
feature: Danh bạ vật thể dựng được toà ở cả 34 tỉnh/thành — mã tỉnh ISO qua bảng tra trong migration, UPI nhận mọi mã, chủ đầu tư ghi đúng phương pháp nguồn
slug: danh-ba-vat-the-toan-quoc
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-10-danh-ba-vat-the-toan-quoc-design.md
approved_by: Mạnh
approved_at: 2026-11-10
---

# Acceptance Contract: danh-ba-vat-the-toan-quoc

## Context

Hàng DA1 (DR1 + DB1c, Mạnh chốt gói danh bạ dự án 09/11). 082 chỉ nhận VN-HN, VN-SG và lệnh dựng đọc ISO từ `meta.city`,
chặn PX2 dựng toà ở 150 dự án toàn quốc và sẽ đúc UPI sai cho ba khu Hưng Yên mang `city=hanoi`. Lệnh tay ghi
`builder_name` lớp hitl không có người. Migration 088 (giám sát cấp). Thiết kế:
`docs/superpowers/specs/2026-11-10-danh-ba-vat-the-toan-quoc-design.md`.

## Criteria

### AC-1 — Bảng tra đủ 34 tỉnh
Given migration 088 đã áp trên DB có danh bạ xã PX1,
When đọc `iso_regions`,
Then có đúng 34 dòng, một dòng cho mỗi mã tỉnh của `pipeline/data/dvhc/tinh.json`, mỗi `iso_region` khác nhau và bằng
mã ISO 3166-2:VN cũ của tỉnh mang tên được giữ, rút bằng máy từ bản chụp ISO có ngày đọc (Huế → VN-26); mọi thị trường `areas` có `admin_code` 2 số có dòng.

### AC-2 — Toà nhận mọi mã ISO, mã lạ bị từ chối
Given 088 đã áp,
When chèn một toà với mỗi `iso_region` của bảng (UPI đúng khuôn), và với mã không có trong bảng,
Then 34 toà được nhận; mã lạ (vd `VN-03` Hà Giang cũ, `VN-99`) và UPI lệch `iso_region` bị từ chối.

### AC-3 — 088 chạy lại không đổi, toà sẵn có còn hợp lệ
Given DB chép từ máy thu có 69 toà,
When áp 088 hai lần,
Then lần hai không lỗi, lược đồ và dữ liệu bằng sau lần một; mọi toà sẵn có còn nguyên `upi`, `iso_region`.

### AC-4 — ISO của toà suy từ khu vực của khu, không từ meta.city
Given khu có mã khu vực thuộc một tỉnh,
When suy ISO,
Then ra ISO của tỉnh đó qua `iso_regions` (Hà Nội → VN-HN, TP.HCM → VN-SG, Hưng Yên → VN-66 dù `meta.city = hanoi`);
mã khu vực không có trong `areas` bị bỏ qua; khu không có tỉnh nào, hay thuộc hai tỉnh, ra lỗi gọi tên và lệnh dựng
thoát 2 không ghi.

### AC-5 — Dựng lại hai khu không đổi UPI
Given DB chép từ máy thu, đã áp 088,
When dựng lại danh bạ cho Ocean Park 1 và Grand Park,
Then số toà, trục, căn bằng trước và 0 UPI đổi; một khu ở tỉnh thứ ba (Ocean Park 2, Hưng Yên) dựng được toà mang
`iso_region` VN-66.

### AC-6 — Chủ đầu tư ghi phương pháp nguồn
Given tệp từ điển chủ đầu tư,
When chạy lệnh dựng với `--tu-dien`,
Then phát biểu `builder_name` mang `method = source_field`, bằng chứng nêu tệp và băm; chạy lại không thêm dòng; sau
lượt có 0 phát biểu `hitl` với `changed_by` trống.

### AC-7 — DB chưa áp 088 vẫn chạy như cũ
Given DB chưa có `iso_regions`,
When chạy bước đêm của danh bạ vật thể,
Then bước chạy xong, ISO theo `meta.city` như trước cho khu đã có toà, in đúng dòng «chưa áp 088 — ISO theo meta.city»;
dựng lần đầu một khu chưa có toà bị từ chối với lý do «chưa áp 088 — chỉ dựng lại khu đã có toà», 0 toà mới.

### AC-8 — Tài liệu và hồi quy
Given `pipeline/CLAUDE.md`, `docs/ROADMAP.md` và bộ test `pipeline`,
When đọc và chạy,
Then tài liệu ghi 088 và cách suy ISO; bộ test `pipeline` xanh.

## Coverage

Trục (preset entity-feature cho «mã tỉnh của toà»):
- Tỉnh: 2 thành phố đã có toà · 32 tỉnh chưa có · mã lạ. [thước CE: 34 dòng `tinh.json` của PX1 — AC-1, AC-2]
- Nguồn ISO của khu: khu vực cấp xã · cấp tỉnh · mã không còn trong areas · nhiều tỉnh · không tỉnh. [AC-4]
- Trạng thái DB: chưa áp 088 · đã áp · áp lại. [AC-3, AC-7]
- Bên dùng: UPI toà sẵn có · toà mới · chủ đầu tư. [AC-5, AC-6]

Core → AC-1…AC-7. Later: PX2 dựng toà toàn quốc. Never: đọc ISO từ `meta.city` khi đã có bảng tra.

## Out of scope

- Áp 088 lên DB máy thu — lời riêng của Mạnh sau Cổng Bằng chứng (`pg_dump` trước); `buildings` không lên cloud.
- Sửa `meta.city` của ba khu Hưng Yên; dựng toà ngoài Ocean Park 1, Grand Park (PX2).

## Notes

- Mã ISO cũ lấy từ ISO 3166-2:VN (bản 2020-11-24, chưa có bản mới sau sáp nhập 2025).
