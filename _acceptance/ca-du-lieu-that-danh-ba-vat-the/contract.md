---
schema_version: 1
feature: "Ca dữ liệu thật của danh bạ vật thể xanh lại sau DA42, và ba mục ngoài hợp đồng của DA72 (DA73)"
slug: ca-du-lieu-that-danh-ba-vat-the
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-27T20:54:19Z
approved_by:
approved_at:
---

# Acceptance Contract: ca-du-lieu-that-danh-ba-vat-the

## Context

GS cắt 28/11, giao P1, ngay sau DA72 (#576, gộp 20:50Z). Đo 27/11 19:14Z trên bản chép máy thu: ba ca đỏ SẴN trên main, không do
DA72, và nằm NGOÀI mọi suite của làn — chỉ eval `da1_db` (hồ sơ danh-ba-vat-the-toan-quoc) và `s09_toa_db` (hồ sơ
nap-s09-toa-tang-vao-danh-ba) gọi chúng, nên chúng đỏ khi ghim lại hai hồ sơ ấy:

- `DA1-AC-4c` ghim «20/20 nút dự án ra ISO»: sau DA42 máy thu có 660 nút dự án (145 khu S09 area_ids rỗng, nút ứng viên S06…),
  ca soát mọi nút → 344 ra ISO, đỏ. Do dữ liệu sau DA42.
- `DA1-AC-7` đòi «DB của lượt chưa có 088»: bản chép máy thu đã áp 088 từ lâu. Tiền đề cũ, không do DA42.
- `DA42 E9` lấy «tệp của hàng» bằng `git diff origin/main...HEAD`: sau khi #555 gộp, diff rỗng → «tiền đề: phải có tệp của hàng
  để soát» đỏ trên main. Không do dữ liệu.

Kèm ba mục Ngoài hợp đồng của DA72 mà GS đưa vào phạm vi (cùng tệp, cùng người): kỳ vọng E4 tả sai cơ chế đối chứng; trục khu khai
hàng «đích nối S09 khu/S16» mà không có ca; `doi-chung.sh` dò «khong-co-tinh» trên toàn đầu ra.

**Số trên màn:** miễn — hàng nền (thước). Con số của hàng: ca đỏ sẵn của hai itest danh bạ vật thể trên bản chép máy thu 3 → 0.

## Criteria

- AC-1: Given bản chép máy thu sau DA42, When chạy `DA1-AC-4c`, Then ca soát đúng tập nút DV1 quản (nút dự án không phải
  `mot_loi_khai`), số nút ấy bằng số mục `pipeline/data/xa-nut-du-an.json` (20), mọi nút ra ISO, năm khu ghim đúng mã; đỏ khi
  số nút DV1 quản lệch tệp xã.
- AC-2: Given bản chép đã áp 088, When chạy `DA1-AC-7`, Then ca tạm đổi tên `iso_regions` để giả lập «chưa áp 088», đo hai vế
  hành vi (bước đêm theo meta.city, dựng khu chưa có toà bị chặn), đổi tên lại ở finally; vế «082 còn khoá hai mã» chỉ đo trên
  bản chép thật chưa 088 và in một dòng chẩn đoán khi không đo được.
- AC-3: Given main sau khi #555 gộp, When chạy `DA42 E9`, Then tập tệp soát = mọi tệp git đang theo dõi trong vùng `VUNG_E9`
  (bỏ ảnh), khác rỗng (đo 28/11: 29 tệp), và ca xanh.
- AC-4: Given khu đích nối S16 không dòng S08 (`vinhomes-smart-city`) đặt area_ids rỗng, When `dung`, Then dừng «khu
  vinhomes-smart-city: khong-co-tinh», không ghi toà (DA73-AC-2b) — phủ hàng «đích nối» của trục khu DA72.
- AC-5: Given mã gốc của DA72, When chạy `doi-chung.sh`, Then DA72-AC-1 và DA72-AC-3 phải đỏ VÌ «khong-co-tinh» xét trong khối
  lỗi của CHÍNH ca ấy (mục «failing tests»), không dò toàn đầu ra.

## Coverage

- Trục ca: DA1-AC-4c · DA1-AC-7 · DA42 E9 · DA73-AC-2b · doi-chung → AC-1..AC-5.
- Trục bản chép: có dữ liệu DA42 (máy thu) · chưa có (M5 26/11) → AC-1, AC-3 đúng cả hai; AC-2 giả lập trên cả hai.
- Never: sửa dữ liệu máy thu (area_ids 145 khu S09), sửa mã sản phẩm.

## Đường đo

- Thước: «hai itest danh bạ vật thể xanh trên bản chép máy thu» · số từ: `pipeline/scripts/danh-ba-vat-the-iso.itest.mjs`,
  `pipeline/scripts/danh-ba-s09-toa.itest.mjs`, `pipeline/scripts/danh-ba-vat-the-dem-khu-thieu-tinh.itest.mjs` · bảo đảm bởi
  AC-1..AC-4; đối chứng AC-5.

## Out of scope

- Kỳ vọng E4 của hồ sơ DA72 (đã máy-thông, không sửa chữ): eval E5 của hồ sơ này thay nó, tả đúng cơ chế worktree tạm + tệp ca
  hiện tại, xét theo từng ca.
- Ghim lại hồ sơ DA1, DA42 bằng làn eval — việc của GS xếp sau khi PR này gộp (tệp trong paths eval của chúng đổi).

## Notes

- Vế «082 còn khoá hai mã» của DA1-AC-7 không còn đo được trên bất kỳ bản chép máy thu nào (088 đã gỡ CHECK của 082): giới hạn ghi
  rõ, ca in dòng chẩn đoán thay vì xanh lặng.
- Known limits — GS định tuyến 28/11 sau S4 vòng 2 (làn V, máy-thông T2):
  - Ngoài-1: Hợp đồng và kỳ vọng E2 chỉ nhắc đổi tên `iso_regions`; ca còn đổi tên `stg_s09_danh_ba` và cấy một nút khu `mot_loi_khai` không dọn.
  - Ngoài-2: Chú thích khoá `da1_db` trong config vẫn ghi «bản chép chưa 088, áp 088 trong ca».
  - Ngoài-3: Lệnh cấy nút ở DA1-AC-7 nằm ngoài khối try/finally; nếu nó lỗi thì hai bảng giữ tên tạm và ca sau đỏ dây chuyền (chỉ trên DB lượt dùng một lần).
  - Ngoài-4: Phần soát tên nguồn trong tệp của DA42 E9 chưa có ca đối chứng cấy tên vào kênh tệp, và đọc tệp hỏng thì nuốt lỗi.
