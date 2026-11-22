---
schema_version: 1
feature: Hai ca test app (DO3-AC-7, SD-AC-6) đúng trên dữ liệu máy — không còn đỏ vì dữ liệu thật đổi, vẫn đỏ đúng khi điều chúng canh bị phá
slug: hai-ca-app-dung-tren-du-lieu-may
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-22T06:21:38Z
design_doc: docs/superpowers/specs/2026-11-22-hai-ca-app-dung-tren-du-lieu-may-design.md
approved_by:
approved_at:
---

# Acceptance Contract: hai-ca-app-dung-tren-du-lieu-may

## Context

Hàng HT3 (GS cắt 22/11). Trên main b28bdbd3d với DB thử chép dữ liệu máy, hai ca app đỏ — cả ở main 21/11 (3c529c0b4), nên
không do mã mới mà do dữ liệu. CI xanh vì job `app` bỏ qua cả hai (không `DATABASE_URL`; SD-AC-6 tự bỏ khi `CI`). Mọi lượt chấm
có suite `app_ui` đều vấp hai ca này. Nguyên nhân đo được:

- DO3-AC-7 «ô chưa gắn luôn hiện»: bảng lát phường phân trang 10 dòng, xếp ô theo số, ô chưa gắn đứng cuối. Dữ liệu máy hôm nay
  có 28 ô phường có số → ô chưa gắn rơi sang trang 3; ca đọc DOM trang 1. Ô chưa gắn VẪN có trong dữ liệu (phanRa luôn gán).
- SD-AC-6: ca đọc dealsSql với trần 500 và đòi MỌI tin có SĐT có số tin người bán. Tin S03 mang số suy («s03-qua-nguoi-dang»)
  không có dòng người bán khi số chưa có người. Đọc không trần: 170 tin bán P1 số suy, 149 có số tin (số ấy đã có người trong
  danh bạ qua tin trực tiếp khác), 21 null. Tin tự cấy của ca cũ mang loại hình «unknown» nên chưa bao giờ vào dealsSql.

Hai phép đếm số suy (đo 22/11 trên DB máy thu, chỉ đọc): 170 tin = mọi tin bán P1 số suy có `bait_gap_pct` (149 có số tin, 21
null). Lọc dần theo đúng điều kiện của `dealsSql`: có thước cùng phường × loại hình → 170; thấy trong 45 ngày → 170; mức giảm
0–50% dưới thước → **65** (54 có số tin, 11 null). 105 tin bị loại vì `bait_gap_pct` âm (giá cao hơn thước) hoặc trên 50% (thước
mỏng) — không phải tin Căn giá tốt, màn không hiện. Ca in 67 = 65 + hai tin số suy tự cấy (55 = 54 + 1, 12 = 11 + 1). Vậy ca
soát ĐÚNG tập tin màn Căn giá tốt hiện (dealsSql không trần), không bỏ sót tin nào trên màn; 105 tin ngoài tập không có chip để
soát.

## Acceptance Criteria

- **AC-1** Given DB thử chép dữ liệu máy, When chạy `tests/do-lam-giau.test.tsx`, Then thoát 0; ca DO3-AC-7 soát ô chưa gắn
  trên mô hình dòng của bảng lát (`latThayDoi`, mọi trang) và đỏ ghim «DO3-AC-7 ô chưa gắn không có trong bảng lát» khi dữ liệu
  lát bỏ ô ấy (chiều đỏ trong ca); kèm assert hiện trạng: >10 ô có số thì ô chưa gắn không ở trang 1 (đổi hiện trạng → đỏ ghim
  «DO3-AC-7 hiện trạng đổi»).
- **AC-2** Given DB thử chép dữ liệu máy, When chạy `tests/sellers-chip.test.tsx`, Then thoát 0; SD-AC-6 soát toàn dữ liệu
  dealsSql (không trần) theo luật hiển thị: tin số thật có SĐT → có số tin người bán; tin số suy → số tin bằng số tin của số
  ấy trong danh bạ, null khi số chưa có người. Ca tự cấy ba dòng (số thật; số suy trùng số đã có người → có số tin; số suy mới →
  null) và có hai chiều đỏ: view người bán nối khoá băm cũ → «SD-AC-6 tin có SĐT thiếu số tin người bán»; tin số suy mới bị gán
  số tin → «SD-AC-6 số suy hiện số tin khác danh bạ của số».
- **AC-3** Given thế CI (`CI=true`, không `DATABASE_URL`), When chạy hai tệp, Then thoát 0, hai ca DB bỏ qua có tên, 0 đỏ.
- **AC-4** Given diff của nhánh, Then chỉ đổi `app/tests/do-lam-giau.test.tsx`, `app/tests/sellers-chip.test.tsx`, hồ sơ này,
  bản thiết kế, `_acceptance/config.yaml`, và phần HT4 gộp vào theo GS (`pipeline/scripts/nap-dvhc-cu.test.mjs`, hồ sơ
  `px1-ac-10-so-dung-tin-gan-theo-ten` cùng bản thiết kế của nó); không sửa `dealsSql`, không khai vào `ci-can-du-lieu`/`do_san_tren_nen`.

## Out of scope

- Ghim ô chưa gắn lên đầu bảng lát (đổi `lam-giau-bang.tsx`) — hàng giao diện riêng.
- Ba câu về số suy cho dãy N1 (mục Ngoài hợp đồng dưới).
- Sửa `dealsSql` hay thêm cột số suy vào nó.

## Coverage

- Trục nguồn dữ liệu: DB thử chép dữ liệu máy · DB CI (bỏ qua) [thước CE: câu giao GS] — AC-1, AC-2, AC-3.
- Trục nhóm số (SD-AC-6): số thật · số suy đã có người · số suy chưa có người [thước CE: đo 22/11] — AC-2.
- Trục phân trang (DO3-AC-7): ≤10 ô · >10 ô [thước CE: pageSize 10 của BangLuoi] — AC-1.

## Đường đo

Hàng nền (test): miễn số trên màn. Thước thay: hai ca xanh trên DB thử chép dữ liệu máy — AC-1, AC-2.

## Ngoài hợp đồng (ghi cho dãy N1 và hàng giao diện)

- N1 (1): có dựng hồ sơ người bán TỪ tin số suy không (hôm nay danh bạ bỏ tin số suy — TIN_VAO_DANH_BA).
- N1 (2): màn Căn giá tốt hiện SĐT suy y như SĐT thật, không nhãn «số suy/chưa xác minh» — có cần nhãn không.
- N1 (3): tin số suy hiện số tin của số trong danh bạ (149/170 tin hôm nay) — có cần nhãn phân biệt không.
- Giao diện: ô chưa gắn bị đẩy khỏi trang 1 khi >10 phường có số (hôm nay 28 ô có số, trang 1 hiện 10) — có ghim lên đầu không.

## Notes
