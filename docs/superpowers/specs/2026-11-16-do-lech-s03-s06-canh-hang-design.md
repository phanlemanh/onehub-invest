# Độ lệch S03 so mặt bằng S06 cạnh hạng cấp dự án — thiết kế (CG15)

Hàng CG15 (`docs/plan/lo-trinh.json`, lát l03, mốc MS2). Cổng Đáng: Mạnh «build, ngưỡng như đề xuất» 16/11.
Căn cứ: ROADMAP §3 mục 51 (S03 là nguồn lõi, S06 là mặt bằng so sánh, thước đếm trên S03), trang tri thức
`dot/dat-lai-lo-trinh-1511.md` (MS2 «tin S03 có hạng giá cấp dự án trên Ops, kèm độ lệch so mặt bằng S06»; mục «Chưa đo»).
Nền: CG10 (#466, đã áp máy thu 15/11) chấm `offer_price_rank` có `cap = du_an`; nhóm dự án gom tin MỌI nguồn.

## 1. Vấn đề

Hạng cấp dự án của CG10 so một tin với trung vị chung của mọi nguồn trong nhóm. Người vận hành không biết tin S03 (môi giới nói với
nhau) đang đắt hay rẻ hơn mặt bằng rao công khai S06 cùng nhóm bao nhiêu. Số phủ đo 15/11 trên máy thu (tin thấy trong 45 ngày):
thuê 3.271 tin S03, 83% nằm ở nhóm có ≥ 5 tin S06; bán 1.660 tin S03, 68%.

## 2. Thiết kế

### 2.1 Bảng `project_source_baseline` (migration 107, chỉ máy thu)

Một dòng mỗi nhóm cấp dự án của CG10 — khoá `(nut, kind, property_type, thuoc, pn_nhom)` đúng như các dòng `offer_price_rank`
có `cap = 'du_an'` (pn_nhom NULL cho nhóm dall; khoá duy nhất qua `coalesce(pn_nhom, -1)`). Cột:
`n_s03`, `trung_vi_s03`, `n_s06`, `trung_vi_s06`, `lech_pct` (`round((trung_vi_s03 / trung_vi_s06 - 1) * 100, 1)`, dương = S03 cao hơn
mặt bằng S06), `trang_thai` (`du` · `thieu-s03` · `thieu-s06` · `thieu-hai`), `run_id`, `computed_at`.

- Mẫu số là PHIẾU như CG10 (căn S06 trong `property_offers` lấy căn nhỏ nhất, tin S03 là phiếu riêng), tách theo nguồn của tin:
  phiếu × nguồn lấy tin thấy sau cùng. Giá trị là `offer_price_rank.gia_tri` (giá/m² ở thước `gia-m2`, giá tháng ở `gia-thang-pn`).
- Chỉ tin đã vào nhóm (`cap = du_an`, `ly_do` không phải lý do loại) mới góp; tin phi lý, ngoài khoảng không vào mẫu.
- Một bên đủ khi từ 5 phiếu (Hỏi-1); thiếu thì dòng vẫn ghi với `trang_thai` tương ứng, `trung_vi` của bên thiếu vẫn ghi khi có
  ≥ 1 phiếu, `lech_pct` NULL.
- S02, S05 và nguồn khác không vào bảng (mục 51 so S03 với S06).

### 2.2 Bước ghi

`pipeline/sql/423_project_source_baseline.sql` chạy trong `pipeline/xep-hang-gia.mjs`, CÙNG giao dịch, SAU 422: xoá trọn bảng rồi
chèn (chạy lại cùng ngày không nhân dòng). Bảng vắng (DB chưa áp 107, cloud) → bỏ bước, in «xep-hang-gia: chưa áp 107 — bỏ mặt bằng
hai nguồn». Không view 105 → không có dòng cấp dự án nên bảng rỗng.

### 2.3 Đường đọc (app)

- `app/src/lib/deals.ts`: `dealsSql` thêm LEFT JOIN bảng (chỉ khi `to_regclass('project_source_baseline')` có) theo khoá nhóm của
  dòng hạng — chỉ gắn cho tin S03 có `cap = du_an`; `DealRow.matBang` = `{ nS03, medianS03, nS06, medianS06, lechPct, trangThai }`.
  Trang một căn đọc cùng bằng hàm `matBangCua(d)` (như `daiM2Cua` của CG10).
- Danh sách `/ops/deals`: ô «Giảm so thước» của dòng S03 cấp dự án thêm một dòng phụ theo trạng thái (đơn vị là CĂN = phiếu,
  cùng nghĩa «So với N căn» của CG10 — Hỏi-3):
  - `du`: «S06 <trung vị> · <n_s06> căn · S03 <±x,x%>»
  - `thieu-s06`: «S06 chưa đủ để so (<n_s06> căn)»
  - `thieu-s03`: «S03 chưa đủ để so (<n_s03> căn) · S06 <trung vị> · <n_s06> căn»
  - `thieu-hai`: «Chưa đủ căn hai nguồn để so (S03 <n_s03> · S06 <n_s06>)»
- Trang một căn / sheet (`deal-body.tsx`): khối «Vì sao giá tốt» thêm hàng «Mặt bằng S06 cùng dự án» ghi trung vị hai nguồn, số căn
  mỗi bên và độ lệch; thiếu bên dùng đúng câu của trạng thái như danh sách.
- Tin S06, tin cấp phường, tin không dự án: không hiện gì mới.

### 2.4 Đo trên máy thu

`pipeline/scripts/do-lech-s03-s06-do.mjs` + `do-lech-s03-s06-db.sh do` trên bản chép DB máy thu (db/db-thu.sh, như AC-9 của CG10):
áp 107, chấm hai lần, đếm nhóm `du`/thiếu theo bán/thuê × thước, số tin S03 có mặt bằng, tính lại độc lập (lech = 0), lần hai = lần
một; hai đối chứng (đếm theo tin thay phiếu · bỏ lọc nguồn) phải đỏ.

## 3. Ngoài phạm vi

- UI10 (bảng `/ops/deals` theo block data-grid, đủ trạng thái): cùng màn nhưng 9 tiêu chí riêng; gom vượt cỡ hợp đồng. Vòng này
  chỉ thêm dòng phụ vào cột có sẵn.
- Đưa bảng lên cloud và API `/v1/deals` (Hỏi-2: đề xuất «cloud đi sau» như 106).
- Đổi hạng hay nhãn: hạng CG10 giữ nguyên, mặt bằng S06 chỉ là dữ kiện đọc kèm.
- Mặt bằng cấp phường, cấp toà; nguồn S05.

## Đặc tả UX

<!-- ux-spec:start -->
- Người dùng & việc: người vận hành Ops, đang xem một dự án trên Căn giá tốt, muốn biết tin S03 đang lệch mặt bằng S06 bao nhiêu.
- Khuôn IA đã chọn + căn cứ: giữ khuôn danh sách records-grid đang có của `/ops/deals` và khối chi tiết của `deal-body` — thêm dữ
  kiện vào ô có sẵn, không màn mới (luồng hiển nhiên, không tra mẫu).
- Thẻ việc: đọc độ lệch hai nguồn cạnh hạng của tin.
- Trạng thái: đủ hai bên (trung vị + số tin + %) · thiếu một bên («chưa đủ để so», nêu số tin bên có) · bảng vắng (cloud, chưa áp
  107): không hiện dòng phụ, không lỗi · tin không phải S03 cấp dự án: không hiện.
- Chữ: «S06 58 tr/m² · 92 căn · S03 −4,1%»; thuê giá tháng: «S06 12 tr/tháng · 40 căn · S03 +3,0%». Dấu «−» = S03 rẻ hơn mặt bằng.
  Bốn câu theo trạng thái ở §2.3.
<!-- ux-spec:end -->
