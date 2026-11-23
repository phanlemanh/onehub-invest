---
schema_version: 1
feature: Hai ca test app (DO3-AC-7, SD-AC-6) đúng trên dữ liệu máy — không còn đỏ vì dữ liệu thật đổi, vẫn đỏ đúng khi điều chúng canh bị phá
slug: hai-ca-app-dung-tren-du-lieu-may
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-22T08:47:53Z
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

- **AC-5** (PX1-AC-10, gộp từ HT4 của P2) Given bản chép DB máy thu đưa về «chưa 084», When chạy ca so trong
  `pipeline/scripts/nap-dvhc-cu.test.mjs`, Then tin S06 so với cột như cũ, tin S03 so với G (giá trị nguồn ghi của 099), lệch 0;
  ca in số tin đem so (S06, S03, S03 so với G), số tin trỏ xã danh bạ đã gỡ (không so) và số tin S03 sống có cột bị đè theo nhãn;
  tập S03 đem so ≥ 1.500 và tập so với G ≥ 1.300 (≈ 70% số đo 22/11), dưới sàn thì đỏ nêu số; so với cột như cũ thì mọi tin lệch
  đều thuộc tập bị đè (đối soát 22/11: lệch 1.900 = tập bị đè 1.900, ngoài 0); mọi tin có nhãn đè phải còn khoá `goc` (NULL hợp
  lệ), thiếu khoá thì đỏ nêu số tin.
- **AC-6** (PX1-AC-10) Given cùng bản chép, When phá ánh xạ tên → khu, gọi so với tập rỗng, hay so với cột như cũ, Then lần lượt:
  lệch > 0; ném «PX1-AC-10 tập so rỗng»; cắt tập S03 còn 10 tin thì ném «tập so S03 10 dưới sàn 1500»; so với cột (bỏ G) lệch > 0
  với tập so với G đủ sàn; xoá khoá `goc` của một tin có nhãn thì bộ đọc nêu đúng tin đó.
- **AC-7** (PX1-AC-10) Given DB dựng từ migration (thế CI, < 34 thị trường), When chạy tệp ca, Then mọi ca PX1-AC-10 bỏ qua với lý
  do «không có bản chép thật», 0 đạt, 0 đỏ.

## Out of scope

- Ghim ô chưa gắn lên đầu bảng lát (đổi `lam-giau-bang.tsx`) — hàng giao diện riêng.
- Ba câu về số suy cho dãy N1 (mục Ngoài hợp đồng dưới).
- Sửa `dealsSql` hay thêm cột số suy vào nó.
- Phép đo AC-9 của PX1 (`pipeline/scripts/nap-dvhc-do.mjs`) cũng so với cột, sẽ lệch giả tương tự — việc kế (P2 nêu).
- 4 tin có phường dấu nhóm khác phường kế thừa — hành vi phân xử của DA45, không thuộc ca PX1-AC-10.

## Coverage

- Trục nguồn dữ liệu: DB thử chép dữ liệu máy · DB CI (bỏ qua) [thước CE: câu giao GS] — AC-1, AC-2, AC-3.
- Trục nhóm số (SD-AC-6): số thật · số suy đã có người · số suy chưa có người [thước CE: đo 22/11] — AC-2.
- Trục phân trang (DO3-AC-7): ô chưa gắn trong · ngoài 10 dòng đầu [thước CE: pageSize 10 của BangLuoi] — AC-1.
- Trục PX1-AC-10 (gộp HT4): tin S06 · S03 không bị đè · S03 bị đè · xã danh bạ đã gỡ; chiều đỏ ánh xạ hỏng · tập rỗng · bỏ G ·
  nhãn thiếu goc; thế CI [thước CE: hồ sơ HT4 của P2, phụ lục phu-luc-ht4-*] — AC-5, AC-6, AC-7.

## Đường đo

Hàng nền (test): miễn số trên màn. Thước thay: hai ca xanh trên DB thử chép dữ liệu máy — AC-1, AC-2.

## Ngoài hợp đồng (ghi cho dãy N1 và hàng giao diện)

- N1 (1): có dựng hồ sơ người bán TỪ tin số suy không (hôm nay danh bạ bỏ tin số suy — TIN_VAO_DANH_BA).
- N1 (2): màn Căn giá tốt hiện SĐT suy y như SĐT thật, không nhãn «số suy/chưa xác minh» — có cần nhãn không.
- N1 (3): tin số suy hiện số tin của số trong danh bạ (149/170 tin hôm nay) — có cần nhãn phân biệt không.
- Giao diện: ô chưa gắn bị đẩy khỏi trang 1 khi >10 phường có số (hôm nay 28 ô có số, trang 1 hiện 10) — có ghim lên đầu không.

## Notes

- HT4 (px1-ac-10-so-dung-tin-gan-theo-ten, P2) gộp vào hàng này theo GS 22/11 vì hai hàng khoá chéo (HT3 vấp PX1-AC-10, HT4
  vấp SD-AC-6/DO3-AC-7). Sổ và gap-probe của HT4 giữ làm phụ lục (`phu-luc-ht4-*`); thiết kế ở
  `docs/superpowers/specs/2026-11-22-px1-ac-10-so-dung-tin-gan-theo-ten-design.md`. Vì sao lọt (P2): ca đỏ ngầm từ 18–21/11 vì
  CI bỏ qua và bản mẫu DB thử dựng trước khi TG2, DA45 ghi khu vào dữ liệu thật.
- Ngoài-1 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Người chấm ở bước nghiệm thu có thể đọc kết quả mong đợi ghi sai chữ so với những gì test in ra. Màn hình người dùng không bị ảnh hưởng. — `_acceptance/hai-ca-app-dung-tren-du-lieu-may/evals.yaml`
- Ngoài-2 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Một lượt chấm sau có thể bỏ sót ba tiêu chí mới hoặc chạy lệnh kiểm phạm vi cũ. Người dùng cuối không thấy gì. — `_acceptance/hai-ca-app-dung-tren-du-lieu-may/s4-args.json`
- Ngoài-3 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Trong môi trường thiếu nhánh gốc, bước kiểm phạm vi thay đổi có thể báo đạt mà không kiểm gì. Người dùng cuối không bị ảnh hưởng. — `_acceptance/config.yaml`
- Ngoài-4 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Hồ sơ nghiệm thu mô tả sai chữ test in ra, có thể làm người chấm hiểu nhầm. Người dùng cuối không bị ảnh hưởng. — `_acceptance/hai-ca-app-dung-tren-du-lieu-may/evals.yaml`
- Ngoài-5 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Một số tin lệch vì lý do khác có thể không bị phép đối soát phát hiện. Người dùng cuối không thấy ngay. — `pipeline/scripts/nap-dvhc-cu.test.mjs`
- Ngoài-6 (máy định tuyến 2026-11-22, đề xuất S4 known-limits): Nếu máy thật không có tin số suy, bài kiểm vẫn báo đạt nhờ dòng tự cấy. Màn hình người dùng không đổi. — `app/tests/sellers-chip.test.tsx`
