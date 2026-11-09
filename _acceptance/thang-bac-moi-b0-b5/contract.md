---
schema_version: 1
feature: Thang bậc mới B0–B5 chạy hằng ngày — 087 viết lại bậc theo FRAMING §3.4 (B1 Tin · B2 Định vị · B3 Gắn căn · B4 Làm giàu · B5 Sống), cụm properties không cho bậc nào, đơn vị đếm là tin và căn của danh bạ, đổi thang là lần hạ một lần có ngày trên /ops/quality, DO1 lập mốc lại, nhãn bậc mới ở sổ từ vựng, bộ kiểm sổ ↔ DB hết báo lệch oan ở data_level_change
slug: thang-bac-moi-b0-b5
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-11-09-thang-bac-moi-b0-b5-design.md
approved_by: Mạnh
approved_at: 2026-11-09T09:17:00Z
---

# Acceptance Contract: thang-bac-moi-b0-b5

## Context

FRAMING §3.4 viết lại 08/11 (Mạnh «Đồng ý và viết lại Framing», «Đồng ý đổi» B2 thành Định vị, cụm S06 tự dựng không còn
là B2): B0 Có lời khai · B1 Tin · B2 Định vị · B3 Gắn căn · B4 Làm giàu · B5 Sống; B0–B2 đếm tin, B3–B5 đếm căn; «Đổi thang
08/11 là lần hạ một lần … Ghi ngày đổi thang trên `/ops/quality` … dòng chuyển bậc (DO1) tính từ ngày đổi». Mã chạy hằng
ngày (056, 059, 610, DO1, `levelOf`) vẫn theo thang 23/10: DB chung 09/11 có 68.543 «căn» B2, toàn cụm S06. Hàng này là
V4 của bản tổng hợp 08/11 (OOS-1 của `gan-can-dinh-danh-duy-nhat`), cộng phần giám sát giao ở P3-169: lệch sổ ↔ DB ở
`data_level_change` và ca AC-3 của `trang-thai-chao.itest.mjs`. Migration 087 do giám sát dành.

## Criteria

- AC-1: Given `pipeline/mappings.yaml` và 087 nạp trên DB thử, When đọc trục `data_level` ở sổ, ở ba tệp `vocab.generated`,
  ở bảng sinh của `CONTEXT.md` và ở `ref_lookup`, Then sáu nhãn là B0 «Có lời khai» · B1 «Tin» · B2 «Định vị» · B3 «Gắn
  căn» · B4 «Làm giàu» · B5 «Sống» ở cả năm chỗ; `node pipeline/vocab.mjs --check` thoát 0; `checkDb` không báo lệch nào ở
  trục `data_level`.
- AC-2: Given ma trận năm trường lõi (có/thiếu từng trường) × định vị (có/không) × nằm trong cụm `properties` (có/không),
  When gọi `offer_data_level` của 087 và `levelOf` của app trên cùng ô, Then hai bên ra cùng bậc ở mọi ô: thiếu một trường →
  B0 (`truong-loi`); đủ → B1 (`dinh-vi`); đủ và định vị → B2 (`gan-can`); nằm trong cụm không đổi bậc ở ô nào.
- AC-3: Given fixture trong giao dịch thay `offer_unit_key` để gắn tin vào căn của danh bạ (082), When gọi
  `unit_data_level()`, Then căn có tin gắn đủ trường lõi ở B3 (`lam-giau`); đạt điều kiện B4 theo câu trả lời Hỏi-2 (mặc
  định: mọi trường lõi `measured` hoặc `fact`, không đòi xác nhận người) → B4 (`hieu-luc`); thêm tin đang chào, thấy trong cửa sổ độ tươi và hai mốc giá → B5 (`giu-nhip`); quá cửa sổ → B4; không fixture
  (087 nguyên) → hàm trả rỗng; `property_data_level` không còn.
- AC-4: Given lược đồ thử có tin S03, S05, S06 (tin lẻ, tin trong cụm S06, tin gắn căn qua fixture), When `610_data_level.sql`
  chạy, Then mỗi tin chưa gắn căn đếm đúng một lần ở đơn vị tin (kể cả tin trong cụm, ở B1 khi đủ trường); mỗi căn có tin gắn
  đếm một lần ở đơn vị căn và tin của nó không đếm ở đơn vị tin; dòng ảnh chụp mang `scale = thang-0811`; không fixture thì
  không có dòng B2 trở lên; trên cùng fixture (thêm một tin đã nghỉ mỗi nguồn) tập khoá đơn vị của 610 và của DO1 bằng nhau
  (cả hai đọc một hàm `data_level_units()` của 087).
- AC-5: Given `data_level_unit` còn dòng thang cũ (`thang-2310`, căn là cụm), When DO1 chạy lần đầu sau 087, Then không ghi
  dòng `data_level_change` nào cho ngày đó, có đúng một dòng `do1-chuyen-bac` `skip` `ly_do: doi-thang` kèm số đơn vị, mã
  thang và ngày áp (ngày nhỏ nhất có ảnh chụp thang mới); `data_level_unit` nay toàn thang mới; lần chạy ngày kế ghi dòng chuyển như thường và dòng DO1 mang
  `thang: {ma, tu_ngay}`.
- AC-6: Given hai ảnh chụp liền nhau khác thang (ngày trước `thang-2310`, ngày sau `thang-0811`), When báo cáo ngày tính NS3,
  Then không báo ô nào «co lại» hay «rời ô» giữa hai ngày đó, có một dòng «đổi thang, không so»; hai ảnh chụp cùng thang vẫn
  so như cũ; NS1, NS1b đếm theo thang mới.
- AC-7: (cross-layer) Given dòng DO1 mang `thang` do `pipeline/do-hang-ngay.mjs --write` thật ghi vào `dq_check_results`, When `/ops/quality` dựng khối «Đo hằng ngày», Then có một dòng nêu thang bậc 08/11 và
  ngày áp; ngày lập mốc đổi thang nói đây là lần hạ một lần, không phải tụt bậc; dòng DO1 không mang `thang` (đời trước) thì
  không hiện dòng ấy và không lỗi.
- AC-8: (cross-layer) Given ngăn chi tiết một tin và bộ lọc bậc ở `/ops/data-flow`, When mở, Then chữ lên bậc nói «Lên B2 cần định vị tin
  vào dự án, toà hoặc trục của danh bạ.» và «Lên B3 cần khớp đúng một căn của danh bạ.»; không chữ nào còn «Lên B2 cần gắn
  được tin về một căn»; truy vấn bản ghi thật của `data-flow-queries.ts` trên DB thử có 087 trả tin trong cụm S06 ở B1 và lọc
  B2 rỗng.
- AC-9: Given 087 nạp trên DB thử, When chạy `checkDb` với sổ thật, Then `checkDb` đọc CHECK danh sách của chính cột
  `from_level`, `to_level` (không vớ CHECK chéo với `huong`) và không báo lệch nào ở hai cột ấy; chiều đỏ: thêm một mã bậc
  giả vào sổ thì `checkDb` báo lệch ở đúng cột `data_level_change.from_level`, thông điệp không nhắc `moi`.
- AC-10: (ui) Given bản chạy đăng nhập vai quản trị, When xem `/ops/quality` (khối «Đo hằng ngày») và ngăn chi tiết một tin ở
  `/ops/data-flow` ở 1280 px sáng, 1280 px tối và 390 px, Then thấy dòng thang bậc 08/11 và hai câu lên bậc mới, không chữ đè,
  không cuộn ngang toàn trang.
- AC-11: (cross-layer) Given lược đồ chưa áp 087 (như cloud tới khi Mạnh áp), When các truy vấn app của `/ops/data-flow` (bản
  ghi tin, lọc bậc) và `/ops/quality` (khối «Đo hằng ngày») chạy, Then không lỗi, mọi tin ra B0 hoặc B1 và khối DO1 không hiện
  dòng đổi thang.

## Coverage

Trục (morphological-scan, preset entity-feature; thực thể «đơn vị đếm bậc» × «thang» — design doc §4):
- Đơn vị: tin chưa định vị · tin định vị · tin trong cụm · căn có tin gắn · tin đã nghỉ → AC-2, AC-3, AC-4, AC-5.
- Bậc: B0 · B1 · B2 · B3 · B4 · B5 → AC-2, AC-3, AC-4.
- Thời: trước đổi thang · ngày đổi thang · sau đổi thang → AC-5, AC-6, AC-7.
- Bề mặt: hàm SQL · 610 · DO1 · `/ops/quality` · báo cáo ngày · ngăn tin + lọc · sổ từ vựng → AC-1 … AC-10.
- Lược đồ: có 087 (máy thu sau khi áp) · chưa có 087 (cloud tới khi Mạnh áp) → AC-11.
Thước CE: số đo DB chung 09/11 ở design doc §1 (68.543 căn B2 toàn cụm, 73.700 đơn vị DO1 thang cũ); bản đồ bên dùng bậc
(35 tệp) ở design doc §3; chân ngành [NGÀNH: Databricks medallion architecture] — bậc gồm mọi điều bậc dưới.

## Out of scope

- OOS-1: Bảng nối tin → nút danh bạ (V9, chuỗi GC0–GC3). Tới khi có, B2 và B3 trở lên bằng 0 ở mọi nguồn; hàng GC chỉ thay
  thân `offer_located`, `offer_unit_key`.
- OOS-2: Kiểm phường cấp tỉnh trong trường lõi (DF7 `phuong-that-trong-truong-loi`, làm ngay sau hàng này) — B1 của S03
  hôm nay còn nhận khu cấp tỉnh.
- OOS-3: `600_data_flow.sql` giữ hai CTE rỗng của nó; đổi sang hai vị từ của 087 là việc của DF7 hoặc GC.
- OOS-4: Đổi tên bậc trong `docs/architecture/mo-hinh-pipeline-mot-can-nha.md` và DO2 (V10); khoá cụm Stage A (V7).
- OOS-5: Áp 087 lên DB máy thu và cloud — lời riêng của Mạnh sau gộp, kèm pg_dump; vòng này chỉ thử trên DB thử.

## Notes

- Tham số cuối của `offer_data_level` giữ kiểu boolean để bên gọi ở cloud (chưa áp 087) không gãy; app truyền `false` tới
  khi có bảng nối.
