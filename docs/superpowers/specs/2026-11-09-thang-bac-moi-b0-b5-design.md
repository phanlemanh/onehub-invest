# Thang bậc mới B0–B5 chạy hằng ngày — design

Hàng `thang-bac-moi-b0-b5` (dãy N1, đợt dot0-cam-mau), việc V4 của bản tổng hợp «gắn căn» 08/11. Nguồn: FRAMING §3.4
(viết lại 08/11, hàng `gan-can-dinh-danh-duy-nhat` #377), quyết định Q1, Q2, Q5 của Mạnh 08/11, OOS-1 của hồ sơ
`gan-can-dinh-danh-duy-nhat`, trả lời P3-169 của giám sát (lệch sổ `data_level_change`, ca AC-3 của `trang-thai-chao`).
Số migration 087 do giám sát dành cho hàng này.

## 1. Vì sao

Từ 08/11 FRAMING nói B2 = Định vị (tin gắn vào dự án, toà, trục của danh bạ), B3 = Gắn căn (khớp đúng một căn của danh
bạ), B4 = Làm giàu, B5 = Sống; gom cụm không là bậc. Mã chạy hằng ngày vẫn theo thang 23/10: `offer_data_level` cho B2 khi
tin nằm trong một cụm `properties`, `property_data_level` coi cụm S06 tự dựng là căn. Số đo DB chung 09/11: 68.543 «căn»
B2 (toàn cụm S06), 3.459 tin lẻ B0, 1.698 tin lẻ B1. Phân bố bậc, dòng chuyển bậc DO1, báo cáo ngày và ngăn chi tiết một
tin vì thế vẫn báo cụm là gắn căn — lệch FRAMING và lệch trang Dòng chảy (đã đổi ở #377).

## 2. Mục tiêu · không phải mục tiêu · phản mục tiêu

**Mục tiêu**
1. Một định nghĩa bậc trong DB (087) đúng FRAMING §3.4; app (`levelOf`) đọc cùng luật.
2. Lần hạ một lần có tên: ngày đổi thang hiện trên `/ops/quality`; DO1 lập mốc lại ở ngày đó, không ghi 68.543 dòng tụt.
3. Nhãn bậc mới ở sổ từ vựng, `ref_lookup`, bảng sinh của CONTEXT.md; bộ kiểm sổ ↔ DB hết báo lệch oan.

**Không phải mục tiêu**: dựng bảng nối tin → nút danh bạ (GC0–GC3, V9); sửa kiểm phường cấp tỉnh (DF7
`phuong-that-trong-truong-loi`, làm ngay sau hàng này); sửa khoá cụm Stage A (V7); đổi tên bậc trong tài liệu mô hình và
DO2 (V10); áp 087 lên DB máy thu hay cloud.

**Phản mục tiêu**: chạy được mà vẫn hỏng nếu — một tin S06 lên B2 chỉ vì nằm trong cụm; ngày đổi thang đọc thành tụt bậc
(trên DO1 hay báo cáo ngày NS3); một tin đếm hai lần (vừa tin vừa căn); số B2/B3 khác 0 khi chưa có bảng nối.

## 3. Thiết kế

### 3.1 Vị từ chờ bảng nối (087)
Hai hàm SQL là chỗ cắm duy nhất của GC: `offer_located(p_offer_id text) → boolean` (hôm nay `false`) và
`offer_unit_key(p_offer_id text) → text` (khoá `units.unit_key` của 082; hôm nay `NULL`). Hàng GC chỉ thay thân hai hàm,
không đổi bên đọc. `600_data_flow.sql` giữ hai CTE rỗng của nó (DF7/GC đổi sau); hai bên cùng ra 0.

### 3.2 Bậc của tin — B0, B1, B2
`offer_data_level(kind, property_type, price_vnd, area_m2, area_id, p_located)` giữ đúng kiểu tham số (bên gọi ở cloud
không gãy), đổi nghĩa tham số cuối thành «đã định vị». Đủ năm trường lõi → B1; thêm định vị → B2. Chỗ kẹt: `truong-loi`
(B0) · `dinh-vi` (B1) · `gan-can` (B2). Cụm `properties` không vào hàm nữa. `levelOf` ở `app/src/lib/data-level.ts` đổi
`linked` thành `located`; các truy vấn app truyền `false` kèm chú thích (chưa có bảng nối) — cloud có thể chưa áp 087.

### 3.3 Bậc của căn — B3, B4, B5
`unit_data_level()` trả mỗi căn của danh bạ có ít nhất một tin gắn (`offer_unit_key` khác NULL), bậc cao nhất trên các tin
gắn:
- **B3 Gắn căn**: tin gắn đủ năm trường lõi.
- **B4 Làm giàu** (Hỏi-2, chờ Mạnh): khuyến nghị — mỗi trường lõi của tin đến từ cách đọc có số đo
  (`field_provenance.<k>.measured = true`, cờ bộ phân xử chỉ đặt khi cách đọc có số đo trên nhãn) hoặc từ nguồn sự thật
  (`tier = fact`), không đòi thêm xác nhận người; lối khác — thêm điều kiện căn có xác nhận của người có quyền (thang cũ đòi
  căn `verified`; bảng `units` của danh bạ chưa có cột ấy). Kế thừa trục · toà · dự án đi theo căn của danh bạ.
- **B5 Sống**: B4 + tin `offer_status = 'active'`, `last_seen` trong `freshness_window()` (059), và căn có ít nhất hai mốc
  giá (giữ luật Hỏi-3 của 059: một đổi giá, hoặc hai tin cùng căn).
Chỗ kẹt: `lam-giau` (B3) · `hieu-luc` (B4) · `giu-nhip` (B5). Hôm nay hàm trả rỗng. `property_data_level` (056/059) bị
DROP — mọi bên gọi chuyển sang `unit_data_level`.

### 3.4 Đơn vị đếm (610, DO1)
Một hàm `data_level_units()` của 087 trả tập đơn vị; 610 và `donViHienTai` của DO1 cùng đọc nó, nên hai bộ đếm không
lệch nhau. Tin (`unit = 'tin_le'`, khoá `tin:<offer_id>`): mọi tin S03/S05/S06 của `sale_offers` (view đã loại tin đã rút,
`retired_at`; tin ngừng rao vẫn đếm) chưa gắn căn — kể cả tin nằm trong cụm. Căn
(`unit = 'can'`, khoá `can:<unit_key>`): căn của danh bạ có tin gắn. Một tin gắn căn chỉ đếm ở căn. Phân khúc như cũ:
thị trường từ khu của tin (căn: khu của tin gắn sớm nhất), loại hình của tin.

### 3.4b Lược đồ chưa có 087 (cloud)
App chạy trên cloud trước khi Mạnh áp 087. Truy vấn app chỉ gọi `offer_data_level` sáu tham số (có từ 056) và đọc dòng
`dq_check_results`; không gọi hàm hay cột mới của 087. AC-11 đo điều đó trên lược đồ chưa có 087.

### 3.5 Đổi thang: hạ một lần, có ngày
087 thêm cột `scale text NOT NULL` vào `data_level_snapshot` và `data_level_unit`: dòng cũ nhận `thang-2310`, mặc định mới
`thang-0811` (CHECK hai giá trị). Ngày đổi thang = ngày nhỏ nhất có ảnh chụp `thang-0811` (đọc, không ghi tay).
- **DO1**: `data_level_unit` có dòng mà thang khác thang hiện hành → lập mốc lại: không ghi `data_level_change` ngày đó,
  một dòng `do1-chuyen-bac` `skip` với `ly_do: doi-thang`, số đơn vị, thang, ngày. Mọi dòng `do1-chuyen-bac` từ đó mang
  `thang: {ma, tu_ngay}`.
- **`/ops/quality`**: khối «Đo hằng ngày» hiện một dòng «Thang bậc 08/11 áp từ <ngày>…» khi dòng DO1 mang `thang`; ngày lập
  mốc đổi thang nói rõ đây là lần hạ một lần, không phải tụt bậc.
- **Báo cáo ngày** (`scripts/lib/bao-cao-ngay.mjs`): NS3 «ô bậc co lại» chỉ so hai ảnh chụp cùng thang; khác thang thì một
  dòng «đổi thang, không so». NS1, NS1b đọc thang mới (hôm nay 0 căn ở B3 trở lên — đúng FRAMING).

### 3.6 Nhãn và sổ từ vựng
`pipeline/mappings.yaml` trục `data_level`: B1 «Tin», B2 «Định vị», B3 «Gắn căn», B4 «Làm giàu» (B0, B5 giữ). Sinh lại
bằng `node pipeline/vocab.mjs --write` (ba tệp `vocab.generated` + khối VOCAB của CONTEXT.md); 087 cập nhật `ref_lookup`
(`ON CONFLICT DO UPDATE`). Thuật ngữ «Phân bố bậc» trong CONTEXT.md sửa đơn vị đếm.

### 3.7 Lệch sổ ↔ DB của `data_level_change` (P3-169)
`checkDb` (`pipeline/lib/vocab-core.mjs`) lấy CHECK ĐẦU TIÊN có tên cột và một chuỗi `'…'::text`; với `from_level` nó vớ
nhầm CHECK chéo `(huong = 'moi') = (from_level IS NULL)` và báo «thiếu B0–B5, thừa moi». Lỗi ở bộ đọc, không ở DDL: sửa
`checkDb` ưu tiên CHECK dạng danh sách của chính cột (`<cột> = ANY (ARRAY[…])` hoặc `<cột> IN (…)`), rơi về luật cũ khi
không có. Đổi thứ tự hay tên CHECK bằng DDL không chữa được vì `pg_constraint` không bảo đảm thứ tự. CHECK của
`from_level`, `to_level` trên DB đã là B0–B5, khớp sổ — 087 không cần đổi DDL ở bảng này. Danh sách trường viết tay của ca
AC-3 `trang-thai-chao.itest.mjs` là việc của P3 (giám sát gỡ tệp khỏi vùng N1); ca ấy chạy `checkDb` trên toàn sổ nên sau
hàng này nó cần nạp 087 trong giao dịch của nó.

### 3.8 Ngăn chi tiết và lọc bậc trên `/ops/data-flow`
`record-sheet.tsx` `LevelGate`: «Lên B2 cần định vị tin vào dự án, toà hoặc trục của danh bạ.» · «Lên B3 cần khớp đúng
một căn của danh bạ.» (thay hai câu cũ — đóng Known limit Ngoài-3 của #377). `records-filter.tsx` sửa chú thích đích
hiện tại. `data-flow-queries.ts` bỏ `linked` (EXISTS `property_offers`) khỏi bậc.

## 4. Quét không gian tiêu chí (morphological-scan, preset entity-feature)

Ngữ cảnh: thực thể «đơn vị đếm bậc» × «thang». Chân sản phẩm: FRAMING §3.4 [SUY-TỪ-REPO: docs/product/FRAMING.md]; chân
ngành: bậc trưởng thành dữ liệu kiểu «medallion» (bronze/silver/gold, [NGÀNH: Databricks medallion architecture]) — cùng ý
bậc gồm mọi điều bậc dưới, khác ở chỗ ta đếm theo đơn vị nghiệp vụ.

Trục:
- Đơn vị: tin chưa định vị · tin định vị · tin trong cụm · căn có tin gắn · tin đã nghỉ [thước CE: bảng số đo §1].
- Bậc: B0 · B1 · B2 · B3 · B4 · B5 [CE: FRAMING §3.4].
- Thời: trước đổi thang · ngày đổi thang · sau đổi thang [CE: DO1 `data_level_unit` hiện có 73.700 dòng thang cũ].
- Bề mặt: hàm SQL · 610 · DO1 · `/ops/quality` · báo cáo ngày · ngăn tin + lọc · sổ từ vựng [CE: bản đồ bên dùng].

Core: (tin trong cụm, B1, mọi thời) · (căn có tin gắn, B3–B5, fixture) · (mọi đơn vị, ngày đổi thang, DO1 + báo cáo) ·
(sổ ↔ DB, nhãn mới) · (ngăn tin, B1 → B2 → B3). Later: tin định vị thật (cần GC). Never: B2/B3 từ cụm — phản mục tiêu.

## 5. Ràng buộc

- Migration chỉ thử trên DB thử (BEGIN … ROLLBACK, hoặc `db/db-thu.sh`); không áp lên `oneinvest` dùng chung trước khi gộp.
  Áp lên DB máy thu và cloud là lời riêng của Mạnh, sau gộp, kèm pg_dump.
- Không đổi tên test có trong `scripts/ci-bo-qua.json`.
- Chuỗi `m.id IN (w.id, w.parent_id)` trong 610 giữ nguyên (s03-len-cong.itest thay nó).

## Đặc tả UX

Bỏ đặc tả UX đầy đủ (sổ quyết định): hàng chỉ đổi chữ trong hai thành phần có sẵn (một dòng ở khối «Đo hằng ngày», hai câu
ở ngăn chi tiết), không thêm vùng, không đổi bố cục. Trạng thái: khối DO1 đã có rỗng/tải/lỗi; dòng đổi thang chỉ hiện khi
dòng DO1 mang `thang`.
