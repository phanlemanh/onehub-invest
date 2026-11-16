# CG10 — Giá tốt cấp dự án (`gia-tot-cap-du-an`) — thiết kế

Ngày 15/11/2026 · dãy N1 · hạng T3 (migration 106) · hàng CG10 `docs/plan/lo-trinh.json` · mốc MN1 «nhịp 1: người vận hành chọn
một dự án trên Ops và thấy căn xếp theo hạng giá». Căn cứ: ROADMAP §3 mục 42 (định nghĩa nhãn), mục 48 (mỏ neo 14/11, QĐ3, QĐ4,
QĐ9), mục 50 (đường găng MN1, «Có, cấp dự án» cho dải diện tích); Cổng Đáng Mạnh «build, ngưỡng như đề xuất» 15/11
(`_acceptance/gia-tot-cap-du-an/opportunity.md`). Bảng phủ ca đo chỉ đọc trên DB máy thu: ghi chú giám sát
`cg10-bang-phu-ca-va-phac-thiet-ke.md` (mục 2–7), tóm ở §6 dưới.

## 1. Bài toán

CG9 (#456, đã áp 104 lên máy thu 15/11) chấm mọi tin vào `offer_price_rank` nhưng chỉ ở cấp phường, nhãn «Rẻ trong phường». Ở cấp
phường p20 thấp hơn trung vị 17,6% chủ yếu vì khác dự án; ở cấp dự án chỉ 5,3% — nhãn «Giá tốt» chỉ đúng nghĩa từ cấp dự án (mục 42).
Tin đã mang dự án: 16.508 tin trên 335 dự án (S03 qua phát biểu `project_node_id` của DV6, S06 qua `s06_offer_project` của DA32), view
`offer_project` (migration 105, hàng DV7 `du-an-cua-tin-len-dinh-vi`) gom về một dự án mỗi tin. Thước MN1 hôm nay: 0 tin có hạng cấp
dự án trên màn.

## 2. Thiết kế

### 2.1 Chấm cấp dự án (pipeline, `pipeline/sql/420_price_rank.sql`)

Không DDL cho hạng: 104 đã cho `cap ∈ {phuong, du_an, phan_khu, toa}`, `nut text`, `nhan ∈ {re-trong-phuong, gia-tot}`. Một dòng mỗi
tin như CG9. Thêm cấp dự án vào đầu chuỗi chọn nhóm của CTE `chon` (chỗ 420 đã chừa):

- **Nguồn dự án**: `offer_project WHERE status = 'mot_du_an'` (một dự án gốc mỗi tin; `xung_dot` không lên cấp dự án). View quy lên nút
  `project` ĐẦU TIÊN khi đi lên cây — dự án con thì nhóm theo con.
- **Phiếu**: như CG9 (căn S06 nhỏ nhất trong `property_offers`, hoặc chính tin; giá tin thấy sau cùng). Phiếu dự án lấy riêng theo
  `(phiếu, dự án, loại, bán/thuê)` nên dự án trải nhiều phường (7 dự án, 5.784 tin; OP1 trải 7 phường) gom qua phường.
- **Nhóm dự án**: `dall|dự án|loại|bán/thuê`; chia PN `dpn|…|PN` khi nhóm cùng PN từ 10 phiếu (không thì lùi về `dall`, `ly_do =
  pn-duoi-10`); tin thuê thiếu m² có PN: `dth|dự án|loại|PN` theo giá tháng (QĐ4).
- **Chọn cấp** cho tin có dự án:
  1. nhóm dự án từ 10 phiếu → cấp `du_an`, `nut = <id dự án>`, nhãn `gia-tot` khi ≤ p20 và dưới trung vị từ 5%;
  2. nhóm dự án 5–9 phiếu và nhóm phường của tin từ 10 → lùi cấp phường (gắn được «Rẻ trong phường») — **Hỏi-1**;
  3. nhóm dự án 5–9 và nhóm phường dưới 10 → cấp `du_an`, có số, không nhãn, `ly_do = nhom-5-9`;
  4. nhóm dự án dưới 5 → chuỗi phường của CG9 y nguyên.
  Tin không dự án hay `xung_dot` → chuỗi phường của CG9 y nguyên (ma trận CG9 xanh không sửa ca).
- `can_xac_minh` giữ luật CG9 (dưới trung vị quá 35%, vẫn mang nhãn — QĐ3).

### 2.2 Dò view, môi trường thiếu view (`pipeline/xep-hang-gia.mjs`)

Dò `to_regclass('offer_project')` theo `search_path` (bài học #456: không ghi `public.`). Có view → chạy câu 420 bản đủ; không có
(DB máy thu trước khi áp 105, cloud) → chạy câu như CG9 (chỉ phường) và in một dòng «chưa có offer_project — chỉ chấm cấp phường»,
không ném. Có view mà chưa áp 106 → chấm đủ cấp dự án, bỏ dải diện tích, in «chưa áp 106 — bỏ dải diện tích» (gộp trước khi
áp 106 không làm hỏng bước chấm đêm). Test dựng view tạm từ thân 105 của nhánh DV7 (`a15c1d9f`) nên không chờ DV7 gộp; PR gộp sau DV7.

### 2.3 Dải diện tích suy ra (GC2, migration 106)

Bảng tổng hợp `project_area_band (project_node_id, bedrooms, p10, p50, p90, n, run_id, computed_at)` cho căn hộ: m² hợp lệ (CG9 khoảng)
của tin có dự án, nhóm dự án × PN từ 10 mẫu. Ghi cùng giao dịch của bước chấm (xoá trọn rồi chèn). Là phát biểu «suy ra» riêng
(mục 50): KHÔNG ghi `area_m2`, KHÔNG dùng để chia giá khi chấm. Đo: 359/891 nhóm dự án × PN đủ 10 mẫu; tin căn hộ thiếu m² có PN được
phủ: thuê 2.624/2.635, bán 505/508. Chỉ ở máy thu: **không chạm `sync-cloud.mjs`** — «cloud đi sau» là giới hạn có tên.

### 2.4 Màn Ops (`/ops/deals`, trang một căn)

- **Câu chứng minh theo cấp** (`deals-chi-tiet.ts` hôm nay viết cứng «cùng phường» ở `cauChungMinh`, `thuocCua`): cấp `du_an` →
  «So với N căn cùng dự án <tên dự án>, cùng loại (<loại>)[, cùng kPN]: thấp hơn trung vị X%, nằm trong 20% rẻ nhất — Giá tốt.»;
  tin thuê giá tháng → «… cùng kPN, theo giá thuê tháng …». Cấp phường giữ nguyên chữ CG9. Tên dự án đọc `asset_nodes.name` theo
  `nut` (bảng đã sync cloud), không đọc view.
- **Lọc dự án**: `/ops/deals?project=<id nút>` → chỉ tin cấp `du_an` có `nut = id`, giới hạn 300 dòng-căn (không cắt 30 — OP1 có 140);
  tiêu đề trang mang tên dự án và nút bỏ lọc; dự án có thật mà chưa nhóm nào đủ → «Dự án chưa đủ căn để xếp hạng»; id lạ → «Không tìm
  thấy dự án»; cả hai có «Bỏ lọc dự án». Tab đếm theo tập đang lọc. Danh sách vẫn chỉ tin bán — **Hỏi-2**.
- **Tab «Cần xác minh» đếm trên toàn tập** — **Hỏi-3**: hôm nay tab đếm trong 30 dòng đã cắt, và 5.106 tin thường che hết 2.452 tin
  cần xác minh (OP1: 159 / 2). Tab đọc một truy vấn riêng (cùng điều kiện, `can_xac_minh = true`, giới hạn riêng) nên luôn tới được.
- **Một dòng mỗi căn** — **Hỏi-4**: 100 dòng đầu hôm nay có 23 dòng thuộc 4 căn (`property_offers`), nhóm lớn nhất 14 tin S06 của
  một căn Sơn Trà đăng lại. Danh sách gom theo căn (tin thấy sau cùng làm đại diện), ghi «N tin»; tin không căn đứng một mình. Số
  hạng không đổi vì phiếu đã tính theo căn.
- **Dải diện tích**: trang một căn của tin căn hộ thiếu m² có PN hiện «≈ a–b m² · suy ra» (p10–p90) khi dự án × PN có dải; bảng
  vắng (cloud) thì không hiện, không lỗi.

### 2.5 API

`/v1/deals` (data-api) và `/api/v1/deals` (app) nhận `project=<id>`; `rank.level` đã có (`cap`), thêm `rank.node`. Trường cũ giữ đủ
tên và kiểu. Không đọc `offer_project` hay `project_area_band` (cloud không có) — chỉ `offer_price_rank` + `asset_nodes`.
`offer_price_rank` đã sync lên cloud từ CG9, nên dòng cấp dự án và nhãn «Giá tốt» tới Ops cloud và `/v1/deals` sau lượt đêm đầu tiên
khi đã áp — **Hỏi-5** (khó đảo: dữ liệu rời máy).

## 3. Lựa chọn và căn cứ

- Hỏi-1 nhóm dự án 5–9: khuyến nghị lùi phường khi phường gắn được nhãn (giữ số dự án ở dòng giải thích) · lối khác: giữ cấp dự án
  không nhãn — người vận hành mất nhãn ở 35 tin, câu giải thích đúng nghĩa hơn.
- Nhãn chữ cấp dự án: «Giá tốt» kèm tên dự án trong câu — máy quyết theo CONTEXT.md «Căn giá tốt» («nhãn «Giá tốt» chỉ từ cấp dự án
  trở xuống (CG10)»); đã có trong `NHAN_HANG`.
- Hỏi-2 danh sách có tin thuê không: khuyến nghị chưa (giữ lát; trang một căn thuê đã đọc được hạng) · lối khác: thêm tab thuê —
  thêm một màn lọc, kéo dài vòng.
- Hỏi-3 tab «Cần xác minh» đếm toàn tập, Hỏi-4 một dòng mỗi căn: như §2.4 (giám sát đã đồng ý khuyến nghị; chữ quyết của Mạnh).
- Hỏi-5 hạng cấp dự án lên cloud cùng `offer_price_rank`: khuyến nghị cho đi cùng (QĐ3 «lên Invest chưa dựng rào», mục 38 thông tin
  dự án công khai; sync đã chép bảng từ CG9, không sửa mã) · lối khác: lọc `cap = 'phuong'` ở sync tới nhịp 3 — phải sửa
  `sync-cloud.mjs`, Ops cloud thiếu nhãn cấp dự án tới đó.

## 4. Ngoài phạm vi

Cấp phân khu, toà, tầng (CG11 — nhịp 2); đẩy `project_area_band` lên cloud (cloud đi sau); «Giá tốt» trên cổng Invest (nhịp 3);
tin thuê trên danh sách Ops (CG3); sửa view 105 (DV7); áp 105 lên máy thu (DV7).

## 5. Áp lên máy thu (năm thứ, mục 50)

Lệnh áp 106 · số chạy thử trên bản chép (AC-9, `do-may-thu.md`) · sao lưu `pg_dump` trước áp · cách lùi (`DROP TABLE
project_area_band`; hạng chấm lại bằng bản 420 cũ) · lệnh kiểm sau áp. Ghi đủ ở `_acceptance/gia-tot-cap-du-an/ap-may-thu.md` ở S3.

## 6. Bảng phủ ca (tóm, đo 15/11)

Bán có dự án nhóm ≥10: 4.591 tin / 143 nhóm (chia PN 3.370) · nhóm 5–9: 862 / 106 · <5: 244 / 78 · bán thiếu m² 588 (không chấm,
không chia giá cho m² suy ra) · thuê thiếu m² có PN: 2.758 (nhóm dự án ≥10: 2.632 / 118) · thuê thiếu cả hai 44 · có dự án thiếu
loại 195 (không suy «căn hộ» từ dự án) · `xung_dot` 0 hôm nay (test dựng) · dự án con 0 (test dựng cây hai tầng) · tin 46–90 ngày
63 (danh sách lọc 45 ngày như CG9) · dự án trải nhiều phường 7 / 5.784 tin · S03 chỉ một phần bài có dự án 1.506 · DB/cloud thiếu
view (lối chỉ phường) · bộ lọc dự án · dải m² GC2 · PN lạ rơi nhóm không PN · tab cần xác minh · một căn nhiều tin.
Mô phỏng chỉ đọc luật §2.1 trên DB máy thu (15/11 07:10Z): 13.269 tin căn hộ có hạng cấp dự án (thước MN1); nhãn «Giá tốt»: bán
904, thuê giá/m² 1.175, thuê giá tháng 577; OP1: 724 tin bán cấp dự án, 141 lên danh sách (45 ngày, 5–35%), 199 tin thuê giá tháng ×
PN; 35 tin giữ cấp dự án 5–9 (phường không gắn được nhãn).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/deals` → chọn dự án (từ trang một căn «Xem cả dự án», hay `?project=<id>`) → danh sách tin bán «Giá tốt» của dự án,
  mỗi căn một dòng → bấm dòng mở sheet / trang một căn đọc «So với N căn cùng dự án …» (điểm ra: gọi người bán).
- Biên: dự án có tin nhưng chưa nhóm nào đủ 10 → trống «Dự án chưa đủ căn để xếp hạng»; tab «Cần xác minh» rỗng ở dự án.
- Lỗi & quay lại: id dự án lạ → trống + «Bỏ lọc dự án»; lỗi tải → khối lỗi có «Thử lại» (RegionError có sẵn).

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Căn giá tốt (`/ops/deals`) | chọn căn đáng gọi trong một dự án | menu Ops, trang một căn / trang một căn, sheet |
| Một căn (`/ops/deals/[offerId]`) | hiểu vì sao căn này giá tốt và gọi ai | danh sách / số điện thoại, «Xem cả dự án» |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-deals-loading | Căn giá tốt | `DealsSkeleton` có sẵn | chờ |
| ST-deals-du-an | Căn giá tốt | tiêu đề «Căn giá tốt · <tên dự án>», nút bỏ lọc, mỗi căn một dòng «N tin» | bấm dòng |
| ST-deals-du-an-trong | Căn giá tốt | Empty «Dự án chưa đủ căn để xếp hạng» | «Bỏ lọc dự án» |
| ST-deals-du-an-la | Căn giá tốt | Empty «Không tìm thấy dự án» | «Bỏ lọc dự án» |
| ST-deals-xac-minh | Căn giá tốt | tab «Cần xác minh <đếm toàn tập>» liệt kê tin cờ | bấm dòng |
| ST-deals-loi | Căn giá tốt | RegionError «Thử lại» | thử lại |
| ST-can-du-an | Một căn | câu «So với N căn cùng dự án <tên> …», badge «Giá tốt», «Xem cả dự án» | gọi / mở dự án |
| ST-can-thue-pn | Một căn | câu «… cùng kPN, theo giá thuê tháng …» | gọi |
| ST-can-dai-m2 | Một căn | «≈ a–b m² · suy ra» cạnh diện tích trống | — |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- `?project=` giữ khi đổi tab và bộ lọc; tab đếm theo tập đang lọc dự án.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| DealsGrid (data-grid + filters + Tabs) | mở rộng | thêm cột «N tin», tab đếm toàn tập |
| PageHeader | dùng | tiêu đề + stats có sẵn |
| Empty, Button | dùng | trạng thái trống có hành động |
| Badge `success-light` / `warning-light` | dùng | «Giá tốt», «Cần xác minh» |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ khuôn records-grid đang có của `/ops/deals` (bấm hàng mở sheet / trang một căn); việc chỉ thêm bộ lọc và cột, không đổi
luồng — không cần tra mẫu.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | người vận hành (vai ops) |
| Việc chính | chọn căn giá tốt trong một dự án để gọi người bán |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
