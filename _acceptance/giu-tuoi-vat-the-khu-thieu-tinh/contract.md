---
schema_version: 1
feature: "Đêm giữ tươi danh bạ vật thể không gãy vì khu thiếu tỉnh (DA72, hàng sửa lỗi sau áp DA42)"
slug: giu-tuoi-vat-the-khu-thieu-tinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: verified
veto_state: mo
veto_opened_at: 2026-11-27T19:16:15Z
approved_by:
approved_at:
---

# Acceptance Contract: giu-tuoi-vat-the-khu-thieu-tinh

## Context

Hàng sửa lỗi sau áp DA42 (GS cắt 28/11, giao P1). Đêm 28/11 00:00 VN bước `refresh-bait-gap` của `zalo-import-daily` thoát 1:
lượt đêm giữ tươi danh bạ vật thể (`buocVatTheDem` → `dung` trên MỌI khu đã có toà, `khuDaDung`) gặp một trong 145 nút khu
S09 mà lượt dựng DA42 tạo (area_ids rỗng) → `isoCuaKhu` trả `khong-co-tinh` → `LoiGoi` → cả giao dịch giữ tươi lùi (gồm 5
khu S08/S16 cũ và bước S09 gói 1). Bait gap và danh bạ Người không mất (giao dịch riêng). Mọi lượt gọi bước này (S03 15′ từ 07:00
VN, chotot-daily 05:30 và 14:00, apify-facebook-daily, zalo 00:00) sẽ đỏ tới khi sửa.

**Số trên màn:** JOB FAIL `refresh-bait-gap` mỗi lượt 1 → 0; dòng «danh-ba-vat-the: đêm {khu: N}» có lại; danh bạ vật thể tươi
lại (lượt đêm chạy hết khu, không lùi).

**Căn cứ, lỗ thước của DA42:** diễn tập `dien-tap.sh` của DA42 chạy «dựng lần hai» bằng `danh-ba-vat-the.mjs` với `--khu`
mặc định (Ocean Park 1, Grand Park), không đi đường đêm `khuDaDung` sau khi có toà S09; eval của DA42 cũng không. Hai lượt diễn
tập 27/11 (10:40Z, 14:14Z) vì vậy đều ĐẠT mà không thấy lỗi này.

Lối sửa GS chọn: `dung()` chỉ đòi ISO cho khu ISO được dùng; khu khác thiếu tỉnh thì bỏ ISO, đếm một dòng. Không đụng dữ liệu
đã áp, không lọc `khuDaDung` (S09 gói 1 vẫn được giữ tươi).

## Criteria

- AC-1: Given DB của lượt có một khu dự án đã có toà mà area_ids rỗng và không dòng S08 (hình dạng 145 nút khu S09 của DA42), When
  chạy `buocVatTheDem`, Then không ném, in «danh-ba-vat-the: khu không suy được tỉnh, bỏ ISO (không dòng S08): K» với K ≥ 1, và
  dòng «danh-ba-vat-the: đêm {khu: N}» có N = số khu của `khuDaDung`; số toà không giảm.
- AC-2: Given khu CÓ dòng S08 (Grand Park) bị đặt area_ids rỗng, When `dung` với khu ấy và khu cấy, Then dừng «khu
  vinhomes-grand-park: khong-co-tinh», không ghi toà nào — luật cũ giữ nguyên ở chỗ ISO được dùng (dòng s08, khu đích nối S09
  khu, S16).
- AC-3: Given cùng DB lượt, When chạy thật `node refresh-bait-gap.mjs`, Then thoát 0, có «danh-ba-vat-the: đêm {"khu":…», không
  có «khong-co-tinh».
- AC-4: Given mã trước sửa (origin/main dad1be620), When chạy cùng tệp ca, Then AC-1 và AC-3 đỏ «khong-co-tinh» (đối chứng: ca
  tái hiện đúng sự cố).

## Coverage

- Trục khu: có dòng S08 · đích nối S09 khu/S16 · không dòng S08 (S09 gói 1, khu cấy) × tỉnh: một · không · nhiều → AC-1, AC-2;
  «nhiều tỉnh» ở khu có S08 đã có ca DA1-AC-4b (giữ nguyên).
- Trục đường gọi: `dung` trực tiếp · `buocVatTheDem` · `refresh-bait-gap.mjs` thật → AC-1, AC-2, AC-3.
- Trục mã: trước sửa · sau sửa → AC-4.
- Never: sửa dữ liệu đã áp (area_ids của 145 nút khu S09), lọc `khuDaDung`.

## Đường đo

- Thước: «lượt đêm có khu thiếu tỉnh không dòng S08 → refresh-bait-gap thoát 0, dòng đêm đủ khu» · số từ:
  `pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs` · bảo đảm bởi: AC-1, AC-3, AC-4.
- Sau gộp: log `zalo-import.log`/`s03-nap-15phut.log` lượt kế có `JOB STEP … refresh-bait-gap mã 0` và dòng «đêm».

## Out of scope

- Gắn khu vực (area_ids) cho 145 nút khu S09 — việc dữ liệu riêng.
- Các ca đỏ SẴN trên main do dữ liệu thật đổi sau DA42 (DA1-AC-4c «20/20 nút», DA1-AC-7, DA42 E9) — đo 27/11 19:14Z trên mã
  gốc và mã sửa: không ca mới đỏ; DA1-AC-5 từ đỏ thành xanh nhờ bản sửa. Báo GS cắt hàng riêng.
- Luật «mọi lời gọi hỏng» của doc-gop (GS ghi nợ HT riêng).

## Notes

- Đo tại máy thu 27/11 19:12–19:14Z dưới khoá s4 (qua giu-nhip), DB của lượt chép từ máy thu (có sẵn 145 nút khu S09): mã gốc
  ba ca đỏ («khu s09-ecohome-3-…: khong-co-tinh»), mã sửa ba ca xanh. Đầu ra: `evidence/`.
