---
schema_version: 1
feature: Danh bạ đủ 3.321 xã, phường, đặc khu theo mã 5 số của Cục Thống kê trong areas dưới đúng 34 tỉnh; 10.033 tên xã cũ thành bí danh (441 xã cũ bị tách trả «cần chọn xã»); tin S03, S06 khớp tên xã hiện hành và tên xã cũ an toàn ở mọi tỉnh; reassign không xoá xã danh bạ; đo tin có xã trước/sau theo tỉnh
slug: danh-ba-phuong-xa-toan-quoc
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [config, cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-08-danh-ba-phuong-xa-toan-quoc-design.md
---

# Acceptance Contract: danh-ba-phuong-xa-toan-quoc

## Context

PX1: `areas` có 34 thị trường cấp tỉnh nhưng chỉ 511 khu vực con ở 4 thành phố; 30 tỉnh không có xã nào. Vòng này nạp
danh bạ chính thức của Cục Thống kê (dữ liệu chép từ kho `onehub-quy-hang`, kèm băm), gắn mã vào khu vực con đang có mà
giữ `id`, chèn xã còn thiếu, ghi bí danh tên xã cũ, cho transform S03/S06 khớp tên trên danh bạ, giữ `reassign-areas`
khỏi xoá xã danh bạ, và đo tin có xã trước/sau theo tỉnh. Mạnh ký Cổng Đáng 08/11 «build», ngưỡng theo đề xuất.

Source input: `_acceptance/danh-ba-phuong-xa-toan-quoc/opportunity.md` (hàng PX1 của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given `pipeline/data/dvhc/` chứa `xa.json`, `xa-cu.json`, `tinh-cu.json`, `tinh.json` và `NGUON.json`, When bộ nạp
  chạy, Then nó băm lại từng tệp và chỉ ghi khi mọi băm khớp `NGUON.json`; `NGUON.json` ghi sha256 từng tệp, commit nguồn
  của kho quy-hang, văn bản và ngày tham chiếu; một tệp lệch một byte làm bộ nạp thoát 2 mà không ghi dòng nào.
- AC-2: Given DB thử có 34 thị trường `vn-*`, When bộ nạp chạy, Then 34 mã tỉnh ánh xạ đúng 34 thị trường theo bảng cố
  định (tên khớp), mỗi thị trường mang `admin_code` 2 số; có đúng 3.321 khu vực con mang `admin_code` 5 số, mã duy nhất,
  mỗi khu vực nằm dưới thị trường của mã tỉnh trong danh bạ, số theo từng tỉnh bằng số xã của tỉnh trong danh bạ; thiếu
  một thị trường hay tên lệch thì thoát 1 mà không ghi gì.
- AC-3: Given 511 khu vực con có sẵn (500 phường OSM, 11 khu `airbnb-discovery`), When bộ nạp chạy, Then khớp theo tên CÓ
  dấu, chỉ bỏ tiền tố cấp xã và hậu tố «(…)», ưu tiên phường OSM: khu khớp được gắn mã mà giữ nguyên `id`, `name`, `geom`,
  `meta.source`; 11 khu `airbnb-discovery` (7 tên quận cũ, 4 tên phường cũ) không mang mã và được in tên; xã không khớp
  được chèn với `id` `<thị trường>-<slug>` (xã chung slug trong tỉnh mang hậu tố `-<mã>`), `name` không tiền tố như danh
  bạ, `geom` rỗng, `meta.source = 'dvhc'`, `meta.loai` là loại đơn vị; khớp hai khu cùng hạng làm bộ nạp thoát 1; báo
  cáo in theo tỉnh số xã, khớp sẵn, chèn mới, có ranh giới.
- AC-4: Given danh bạ xã cũ, When bộ nạp chạy, Then `area_aliases` có đúng 10.033 dòng, mỗi dòng mang mã cũ, tên, huyện
  cũ, mã tỉnh và các mã xã mới, đúng 441 dòng có `split = true`; bộ tra tên cũ theo khoá (tỉnh mới, tên) trả một xã chỉ khi
  mọi xã cũ mang khoá ấy cùng vào đúng một xã mới, còn lại trả «cần chọn xã» kèm danh sách mã, không bao giờ chọn hộ; báo
  cáo in số khoá mỗi lớp.
- AC-5: Given bộ nạp đã chạy một lần, When chạy lần hai trên cùng dữ liệu, Then lần hai báo 0 dòng đổi và băm nội dung
  `areas` (id, parent, tên, mã, meta) cùng `area_aliases` bằng hệt sau lần một; 084 áp lần hai không đổi lược đồ.
- AC-6: Given danh bạ đã nạp, When `reassign-areas` chạy cho Hà Nội, TP.HCM và Đà Nẵng (cả lượt thường lẫn
  `--xoa-khu-vuc-lac`), Then không khu vực nào mang `admin_code` bị xoá, kể cả xã chèn mới chưa có tin (Hưng Long, Hoàng
  Sa); phường OSM upsert lại giữ `admin_code`; bước xoá khu vực không phải phường OSM vẫn xoá khu vực không mã, không tham
  chiếu như trước.
- AC-7: Given danh bạ đã nạp bằng bộ nạp thật, When transform S06 và S03 gán khu vực theo tên xã hiện hành với danh sách
  tên đọc từ DB, Then tin S06 của mọi thị trường có xã danh bạ khớp `ward_name_v3` vào xã; tin S03 của nhóm khai thị
  trường khớp xã của thị trường đó; nhóm S03 chưa khai thị trường vẫn chỉ đối chiếu các thị trường có phường OSM như trước;
  point-in-polygon vẫn chỉ dùng phường OSM có ranh giới.
- AC-8: Given bí danh tên cũ, When transform gán khu vực mà tên hiện hành không khớp, Then S06 khớp `ward_name` cũ qua bí
  danh an toàn; S03 chỉ nhận tên cũ khi bài gọi đích danh «phường/xã/thị trấn/P./X. <tên>»; tên cũ bị tách, trùng tên một
  xã hiện hành cùng tỉnh, hay trỏ hai xã mới khác nhau thì không gắn xã nào và được đếm theo lý do.
- AC-9: Given bản chép DB máy thu trên DB thử, When thước đo trước/sau chạy, Then «trước» là `area_id` đang lưu của tin
  nối được với stg (S06 theo `list_id`, S03 theo bài đơn), «sau» là hàm gán mới sau khi nạp; hàm gán mới chạy trước khi nạp
  cho đúng `area_id` đang lưu ở mọi tin nối được; bảng tỉnh × (tin, có xã trước, có xã sau, mất xã, đổi xã, gắn mới qua
  tên hiện hành, gắn mới qua bí danh) được in kèm tin mẫu; không tỉnh nào giảm, không tin nào mất xã hay đổi xã ngoài
  danh sách khai trước; vi phạm thì thoát 1 gọi tên tỉnh; DB thử không đổi sau thước.
- AC-10: Given DB thử dừng ở migration 083 (chưa có `admin_code`, `area_aliases`), When transform S03, S06 và
  `reassign-areas` chạy bằng code mới, Then chúng chạy không lỗi, in một dòng «chưa áp 084», và kết quả gán khu vực bằng
  hệt code của nhánh chính trên cùng dữ liệu.

## Coverage

Quét không gian (entity-feature, tự dựng trục): chân sản phẩm `[SUY-TỪ-REPO: docs/superpowers/specs/2026-11-08-danh-ba-phuong-xa-toan-quoc-design.md]`;
chân ngành: danh mục DVHC của Cục Thống kê (danhmuchanhchinh.nso.gov.vn, QĐ 19/2025) làm nguồn chuẩn, và cách OSM giữ tên
cũ bằng khoá `old_name` `[NGÀNH: OSM old_name]`.

- Trục A — Đơn vị đích: khớp sẵn phường OSM | khớp khu khác có sẵn | chèn mới | chung slug trong tỉnh | khu cũ không khớp
  xã nào [thước CE: khớp thử 08/11 trên 511 khu vực con — HP 114/114, ĐN 93/94, HCM 167/168, HN 126/126 +4 khu tên cũ] →
  AC-2, AC-3.
- Trục B — Đường tên vào: tên hiện hành có cấu trúc (S06 `ward_name_v3`) | tên cũ có cấu trúc (S06 `ward_name`) | chữ tự
  do tên hiện hành (S03) | chữ tự do tên cũ (S03); bí danh: trọn | tách | trùng tên hiện hành | nhiều đích [thước CE: bảng
  chuyển đổi 10.033 dòng, 441 tách] → AC-4, AC-7, AC-8.
- Trục C — Phạm vi thị trường của tin: nhóm khai thị trường | nhóm chưa khai (4 thành phố) | thị trường S06 theo mã [thước
  CE: `transform-zalo.mjs` N1 Hỏi-1, `lib/thi-truong.mjs`] → AC-7, AC-9.
- Trục D — Lượt chạy: nạp lần đầu | nạp lần hai | reassign sau nạp | dữ liệu nguồn lệch băm | code mới trên DB chưa áp
  084 → AC-1, AC-5, AC-6, AC-10.

Core: các ô trên. Later: S05 (chỉ HN/HCM), listing Airbnb theo tên, hiện xã trên Ops/Invest, thu OSM cho 30 tỉnh. Never:
đoán xã cho tên cũ bị tách.

## Đường đo

- Thước: đủ 3.321 đơn vị gắn đúng tỉnh · số từ: đếm `areas` theo `admin_code` và thị trường, so bảng rút từ danh bạ · bảo đảm bởi: AC-2
- Thước: 10.033 bí danh, 441 xã cũ «cần chọn xã» · số từ: đếm `area_aliases` và bộ tra theo khoá · bảo đảm bởi: AC-4
- Thước: tin có xã trước/sau theo tỉnh, tin gắn mới qua tên hiện hành và qua bí danh · số từ: `pipeline/scripts/nap-dvhc-do.mjs` trên bản chép DB máy thu · bảo đảm bởi: AC-9
- Thước: chạy lại bộ nạp không đổi dòng nào · số từ: báo cáo lần hai của bộ nạp và băm nội dung · bảo đảm bởi: AC-5
- Thước: 511 khu vực con cũ giữ nguyên id · số từ: so tập id trước/sau nạp · bảo đảm bởi: AC-3

## Out of scope

- OOS-1: Thu ranh giới OSM cấp 6 cho 30 tỉnh — làn ZCode, gửi bằng việc phụ.
- OOS-2: Hiện xã, bí danh, «cần chọn xã» trên Ops hay Invest; API tra xã.
- OOS-3: S05 và listing Airbnb gắn theo tên; xoá khu `airbnb-discovery`.
- OOS-4: Áp 084 và chạy bộ nạp trên DB máy thu; đưa cột mới lên cloud — lời riêng của Mạnh, sao lưu trước.
- OOS-5: Chạy lại transform trên toàn bộ kho tin — lượt đêm tự làm sau khi nạp.

## Notes

- Thước AC-9 dùng chính hàm gán khu vực của transform (`ganPhuongS06`, `matchPhuongThiTruong`, `ganKhuVuc`, bộ khớp bí
  danh) trên toàn bộ tin stg, không chạy trọn transform + phân xử (S06 gần 2 giờ trên DB thử); bù lại có đối chứng code
  với `area_id` đang lưu. Tin S03 gộp nhiều bài không vào so sánh (bài nào thắng do bước gom quyết, ngoài hàm gán).
- Gộp PR không kéo theo áp 084: code chạy được trên DB chưa áp (AC-10); áp 084 và chạy bộ nạp trên máy thu là lời riêng.
