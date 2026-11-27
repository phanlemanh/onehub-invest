# ON25 — Ops hiện đúng chặng S03 (`ops-hien-dung-chang-s03`)

Ngày: 2026-11-28 · Dãy U1 · Tầng T2 · Căn cứ: báo cáo điều tra chỉ đọc `research-local/audit-s03-vao-kho-2811/BAO-CAO.md`
(mục 1, 5, việc 5–6; tệp ở máy thu, gitignored) và lời giao của giám sát 28/11.

## Vấn đề

Mạnh nhìn Ops thấy «tin vào kho» của S03 rất thấp. Điều tra 28/11 cho thấy phần lớn là dữ liệu thật, nhưng hai chỗ trên màn
làm số trông tệ hơn thực tế:

1. `/ops/data-flow`: số mốc «Khớp toà» luôn 0 vì `pipeline/sql/600_data_flow.sql:97` viết cứng
   `toa_link AS (SELECT NULL::text AS offer_id WHERE false)`. Bảng gắn toà đã có từ PL20: `offer_building` (view, migration 117)
   có 3.167 tin S03 `status='gan' AND muc='toa'` (đo 28/11, 0,54 giây). Cùng CTE rỗng làm ô «chờ khớp» của cột Định vị đếm cả tin
   đã khớp toà: 5.308 thay vì 2.308 (cửa sổ «all»).
2. `/ops/collections` → «Luồng 7 ngày», tab S03: chuỗi «S03 — tin rao vào kho» chỉ đếm tin **mới** (`first_seen` trong ngày):
   187–366 tin/ngày (21–27/11). Mỗi ngày có 713–1.013 tin khác nhau có bài đăng — 2/3 là tin cũ đăng lại, không hiện ở đâu. Đặt
   cạnh cột «bài thô» (đếm cả bài đăng lại, 9–11 nghìn/ngày) thì tỉ lệ trông như 3%. Nhãn trên màn cũng lệch từ vựng:
   `CONTEXT.md` (mục **Bài**) đã chốt 27/10 «S03 — bài nhận» và «S03 — tin rao mới», ghi «bài thô (làm nhãn cột đếm)» là
   `_Avoid_`, nhưng `sync-activity.tsx:36-37` vẫn in «tin rao vào kho» / «bài thô».

## Thiết kế

### Phần 1 — «Khớp toà» đọc `offer_building` (`pipeline/sql/600_data_flow.sql`)

- `toa_link AS MATERIALIZED (SELECT offer_id FROM offer_building WHERE status = 'gan' AND muc = 'toa')` thay CTE rỗng.
  Cùng điều kiện mà `offer_unit` của PL36 (migration 131/138) dùng để chọn tin mức toà — một định nghĩa «tin khớp toà».
- Hệ quả trên màn (cả hai đều do `toa_khop`, không có cột mới):
  - `facts.milestones[].building_linked` của ngày làm tươi: 0 → 3.167 (đo lại lúc làm). Dòng `s03-moc-ngay` của các ngày đã
    ghi giữ nguyên số 0 (bảng chỉ ghi ngày hôm nay) — đường «Khớp toà» trên biểu đồ xu hướng nhảy đúng ngày gộp.
  - `locatedPending` (= tin ghi toà/trục AND NOT `toa_khop`): S03 «all» 5.308 → 2.308; 7d 879 → còn ít hơn. Nghĩa «chờ khớp»
    trong `CONTEXT.md` mục **Định vị (cấp dự án)** đúng chữ hơn sau sửa; câu «Cấp toà, trục chưa có» được sửa thành «Khớp toà
    đọc bảng gắn toà từ 28/11».
- «Có hạng cấp toà» (`building_ranked`) **không** đổi: nó đọc `offer_price_rank.cap = 'toa'`, không đọc `toa_link`. Máy thu 28/11
  có 0 dòng hạng cấp toà (chỉ `du_an` 7.568, `phuong` 75) — bước xếp hạng chưa xếp ở cấp toà. Lời giao dự kiến 0 → 3.167 cho cả
  hai ô; số thật chỉ đổi ở «Khớp toà». Ngoài phạm vi, vì bộ xếp hạng là việc riêng.
- S05/S06 không có dòng `offer_building` (view chỉ dựng cho S03) — `building_linked` vẫn chỉ của S03 như SM1 đã khai.
- Test SM1 `pipeline/tests/so-moc-s03.itest.mjs` dựng chiều dương bằng đột biến trên chuỗi `toa_link … WHERE false` (dòng 261).
  Chuỗi ấy hết tồn tại; ca được viết lại: lược đồ tạm có **bảng** `offer_building` (bốn cột `offer_id, status, muc,
  building_key`), 600 chạy trần đọc nó (tên không tiền tố lược đồ). Đột biến «đặt cứng rỗng» trở thành chiều đỏ.

### Phần 2 — «Luồng 7 ngày» tab S03 (`pipeline/lib/ops-flow.mjs` + `app/src/lib/collections-queries.ts`)

- Câu mới `S03_ACTIVE_OFFERS_SQL` (một định nghĩa ở `ops-flow.mjs`, app chép nguyên văn như hai câu ON5):
  `SELECT <ngày VN của p.posted_at> d, count(DISTINCT o.offer_id)::int n FROM sale_offers o CROSS JOIN LATERAL unnest(o.post_ids)
  AS u(post_id) JOIN <bảng bài nạp S03> p ON p.post_id = u.post_id WHERE o.source = 'S03' AND p.posted_at >= $1 GROUP BY 1`.
  Đo 28/11: 848 · 713 · 769 · 740 · 1.013 · 1.002 · 897 (21–27/11), 0,5 giây. `post_id` của bảng bài nạp S03 là khoá chính nên mỗi bài
  một dòng.
- Cùng gốc `sale_offers` (tin đang sống) với `S03_OFFERS_SQL`: `first_seen` là giờ bài sớm nhất của tin, nên mọi tin mới của
  ngày D đều có bài ngày D → **tin rao mới ≤ tin có bài hôm đó** mỗi ngày. Đếm trên `sale_offer_records` thì hai chuỗi lệch tập
  và bất biến này gãy.
- Khối `luong7` của bản tin thêm khoá `s03ActiveOffers` mỗi ngày (`luong7()` trả thêm trường; `push-ops-facts.mjs` không đổi — nó
  gói nguyên kết quả `luong7`). Cloud (`ops-cloud.ts` → `getCloudFlowDays`) đọc khoá; bản tin cũ thiếu khoá → `null`, ô hiện «—»,
  không 0. Hàng này **không ghi cloud**: lượt đẩy đầu tiên của máy thu sau khi gộp là bằng chứng hình khối mới.
- `FlowDay` thêm `s03ActiveOffers`; `CloudFlowDay` thêm `s03ActiveOffers: number | null`. Trường mới mang mã nguồn `S03`, không
  theo tiền tố tên nguồn thật của hai trường cũ — không thêm định danh mang tên nguồn thật vào kho công khai (luật 6, SPL).
- Biểu đồ (`sync-activity.tsx`): tab S03 có ba chuỗi «S03 — bài nhận», «S03 — tin rao mới», «S03 — tin có bài hôm đó». Tab S03
  **không chồng cột**: tin rao mới là tập con của tin có bài, chồng lên nhau là đếm trùng (cột chồng hôm nay cũng đang cộng bài
  với tin). Ba cột đứng cạnh nhau mỗi ngày (Hỏi-1). Dòng mô tả thôi cộng hai đơn vị khác nhau: «7 ngày: <a> bài nhận · <b> tin
  rao mới; mỗi ngày <c>–<d> tin có bài». Tab Listing giữ nguyên.
- Màu: «tin có bài hôm đó» là khối lượng đã vào kho như tin mới → cùng họ `opsVolume`; cần một khoá Ops thứ ba trong
  `app/src/components/charts/palette.ts` (vd `opsVolumeActive`) khai theo `data-color.md` mục Ops — không hex thô.
- Từ vựng (`CONTEXT.md`, cùng commit với nhãn): thêm thuật ngữ **Tin có bài hôm đó** (nhãn · code `s03ActiveOffers` ·
  định nghĩa · `_Avoid_`: «tin hoạt động», «tin vào kho»); sửa câu mục **Bài** cho ba cột.
- Test ghim chữ trang Thu thập `app/tests/tu-ngu-collections.test.tsx` (TN-AC-7, so markup với bản chụp sau ba cặp thay): thêm
  cặp thay nhãn mới vào danh sách đã duyệt; bản chụp không chép lại.

### Phần 3 — «Gom cụm», «Gắn căn» của S03: ngoài phạm vi

- «Gắn căn» (`gan_can_link … WHERE false`) chỉ nối được khi có bảng gắn căn thật. PL36 (`ghep-tin-vao-truc-can`, PR #571) dựng
  view `offer_unit` (migration 131 + 138) nhưng 28/11 PR còn mở, máy thu chưa có `offer_unit` (`to_regclass` trả rỗng). Một câu
  600 tham chiếu view chưa có thì lượt làm tươi sập. Nối sau khi 131 + 138 áp trên máy thu — đề nghị một hàng riêng.
- «Gom cụm» đọc `property_offers`; máy thu có 146.581 dòng, tất cả S06 — chưa có bộ dựng căn cho S03 (việc 7 của báo cáo, lớn,
  cần bảng phủ ca). Mã đúng, dữ liệu chưa có.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/collections` → «Luồng 7 ngày» → bấm tab S03 → thấy ba cột mỗi ngày: bài nhận, tin rao mới, tin có bài hôm đó (điểm ra: di chuột xem số từng cột).
- Suôn sẻ: `/ops/data-flow` → biểu đồ số mốc → đường «Khớp toà» có số ngày hôm nay; cột Định vị «chờ khớp» nhỏ lại.
- Biên: bản tin cloud cũ chưa có khoá mới → cột «tin có bài hôm đó» không vẽ, chú giải vẫn có, tooltip «—».
- Lỗi & quay lại: không đổi — vùng đã có trạng thái trống/lỗi của trang.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` «Luồng 7 ngày» | Thấy khối lượng thu và vào kho theo ngày | thanh bên Ops / tab Listing |
| `/ops/data-flow` số mốc S03 | Thấy tiến độ định vị, khớp toà theo ngày | thanh bên Ops |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-luong7-s03-du | collections | Ba cột cạnh nhau, chú giải ba nhãn | Di chuột đọc số |
| ST-luong7-s03-khoi-cu | collections (cloud) | Hai cột; tooltip «tin có bài hôm đó: —» | Chờ lượt đẩy kế |
| ST-luong7-trong | collections | Empty «Chưa có luồng» (đã có) | Đổi tab |
| ST-moc-khop-toa | data-flow | Đường «Khớp toà» có điểm ngày hôm nay | Đọc xu hướng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Tab S03 không chồng cột; tab Listing giữ nguyên.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `SyncActivity` (chuyển thể @reui/solution-dev-ops-6) | mở rộng | Thêm một chuỗi và bỏ `stackId` ở tab S03 |
| `ChartContainer`/`Bar` (ui/chart, recharts) | dùng | Có sẵn |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: hai màn Ops đã là bảng điều khiển; hàng chỉ đổi số và một chuỗi trong vùng có sẵn — luồng hiển nhiên, không tra mẫu.
### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Mạnh và vai ops |
| Việc chính | Biết hôm nay S03 thu bao nhiêu bài và vào kho bao nhiêu tin |
| Tần suất | mỗi ngày |
| Số bản ghi | vài chục (7 ngày × 3 chuỗi) |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->

## Phạm vi tệp

`pipeline/sql/600_data_flow.sql` · `pipeline/tests/so-moc-s03.itest.mjs` · `pipeline/lib/ops-flow.mjs` ·
`app/src/lib/collections-queries.ts` · `app/src/lib/ops-cloud.ts` · `app/src/components/ops/collections/sync-activity.tsx` ·
`app/src/components/charts/palette.ts` · `app/tests/luong-7-ngay-dung-so.test.tsx` · `app/tests/tu-ngu-collections.test.tsx` ·
`CONTEXT.md` · `_acceptance/ops-hien-dung-chang-s03/**`. Không migration, không `push-ops-facts.mjs`, không ghi cloud.

## Nhánh

Phần 2 chạm cùng trang với KEV2 (#554). Hồ sơ S1 viết trên nhánh `feat/ops-hien-dung-chang-s03` cắt từ `origin/main` a94013aaf;
mã S3 bắt đầu sau khi KEV2 gộp, bằng một lần gộp `origin/main` vào nhánh (lời giám sát 28/11).
