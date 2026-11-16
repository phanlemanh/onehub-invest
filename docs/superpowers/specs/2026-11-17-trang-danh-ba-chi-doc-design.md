# Trang Danh bạ chỉ đọc trên Ops — thiết kế (`trang-danh-ba-chi-doc`)

Ngày 17/11/2026 · dãy U2 · hồ sơ `_acceptance/trang-danh-ba-chi-doc/` · lát đầu của DN2 `trang-do-phu-danh-ba`.

## Vì sao

Mạnh 17/11: «Hiện nay trên ops chưa có danh bạ căn và danh bạ dự án, vì tôi không thấy được nên gần như không quản lý
được». Cổng Đáng: «Cổng Đáng trang Danh bạ: build lát chỉ đọc ngay». Kho đã có cây dự án, toà, trục, căn trong DB máy thu
(ADR-0016, DA3–DA33) nhưng Ops không có trang nào để nhìn.

## Phạm vi

Một trang chỉ đọc `/ops/registry` (máy thu) và trang một dự án `/ops/registry/<id nút>`:

- Dải bốn ô số: dự án (đã xác minh, phân khu) · toà (có căn, trục) · căn · mã dự án nguồn chưa nối (theo nguồn).
- Bảng cây dự án → phân khu (bấm mở): tỉnh/thành, bậc danh mục, nguồn `S0x`, số phân khu, toà (kèm «chưa có căn»), căn,
  tin đang rao theo nguồn. Tìm theo tên hoặc bí danh (gấp dấu); lọc tỉnh/thành, nguồn, bậc, chỗ thiếu.
- Khung «Mã dự án nguồn chưa nối» theo nguồn (S06 · S08 · S09), mã, tên dự án ở nguồn, vì sao chưa nối.
- Trang một dự án: đầu trang (bậc, tỉnh, nguồn, bí danh, mã đã nối), bốn ô số, bảng toà → căn (tầng, trục, mã tại nguồn),
  tab «Chưa có căn».

Ngoài lát: số tin gắn từng toà/căn (Mốc 3), màn đối chiếu trường × nguồn, mọi thao tác sửa cây, lên cloud, migration hay
ghi dữ liệu.

## Bảng phủ ca (đếm trên DB máy thu :5433, 17/11 ~06:00 VN, chỉ SELECT)

| Chiều | Giá trị | Số trong ô | Ai đọc phía sau |
|---|---|---|---|
| Dự án × bậc × con × tin | `mot_loi_khai` · không phân khu · không toà · có tin | 324 | Mạnh (lọc «Một lời khai» để biết nút chưa ai xác minh); phiên duyệt thẻ nhóm |
| | `xac_minh` · không con · có tin | 10 | Mạnh (dự án chắc chắn mà thiếu toà — chỗ thiếu «Chưa có toà») |
| | `xac_minh` · không con · không tin | 8 | Mạnh (nút rỗng hẳn — «Chưa có tin đang rao») |
| | `xac_minh` · có phân khu · có toà · có tin | 2 (Ocean Park 1, Grand Park) | Mạnh, hàng nạp S16 (toà mới sẽ tự hiện ở đây) |
| | `suy_ra_manh` | 0 | — (CHECK cho phép; nhãn và màu badge có sẵn, không cần ca dữ liệu) |
| Phân khu | `subzone` | 31 (lồng tới hai cấp: Origami, Sapphire, Zenpark) | Mạnh; trang dự án |
| | nút `building` (là phân khu Grand Park — CONTEXT «Tòa nhà») | 3 | hiện nhãn «Phân khu», không đếm vào Toà |
| Toà | có căn | 69 | Mạnh; hàng nạp S16 |
| | chưa có căn | 129 (Ocean Park 1: 103, Grand Park: 26) | Mạnh — chỗ thiếu «Có toà chưa có căn», tab «Chưa có căn» |
| Căn · trục | căn đang dùng · trục | 1.748 (318 + 1.430) · 412 | trang dự án |
| Nguồn nối dự án | S06 nối · chưa nối | 341 · 8 (`khong-ten` 6, `khong-xa` 2) | Mạnh; phiên nối S06 |
| | S08 đã nạp · nối · chưa nối | 180 · 8 · 172 (142 có lý do `ngoai-lat`…, 30 chưa qua bước nối) | Mạnh; hàng nối S08 |
| | S09 đã nạp · nối | 344 · 0 (kho chưa có bảng nối dự án S09) | Mạnh; hàng nối S09 |
| | S10 | 0 nối (bảng có, rỗng) | — |
| Tin đang rao (`offer_project` `mot_du_an`) | S03 · S06 | 5.470 tin / 6 dự án · 11.883 tin / 334 dự án | Mạnh — cột «Tin đang rao» |
| Tỉnh/thành (gốc `areas` của khu vực đầu) | TP HCM · Hà Nội · Đà Nẵng · Hưng Yên | 310 · 11 · 20 · 3 | bộ lọc Tỉnh/thành |
| Môi trường | máy thu có bảng · cloud (`VERCEL=1`) · DB thiếu `buildings` · truy vấn lỗi | — | AC trạng thái |

Ô bỏ: «toà theo `iso_region`» — ngoài phạm vi, vì tỉnh lấy từ khu vực của dự án; toà luôn có dự án cha.

## Cách đọc dữ liệu

- `lib/ops/registry/doc.ts`: một câu đệ quy `to_tien` (tổ tiên mỗi nút, sâu ≤ 16 như `offer_project`) cộng toà/căn lên mọi
  tổ tiên; tỉnh = gốc `areas` của `area_ids[1]`; nguồn = bảng nối `noi` (S06 `project_links`, S08, S10) và `meta` S09; tin =
  `offer_project` nhóm theo nguồn — view đã quy mọi tin về dự án gốc (`project_node_id` luôn là gốc), nên phân khu không mang
  tin, cột tin chỉ ở dự án gốc và cộng trên các dự án gốc không đếm trùng. Dải số đếm độc lập bằng `count(*)` từng bảng. Đo: 1,5 giây trên máy thu.
- `lib/ops/registry/du-an.ts`: toà (tên = bí danh `ten`, mã = `ma_nguon`, nguồn = nguồn bí danh), căn (tầng, trục qua
  bí danh trục, mã căn tại nguồn). Số đếm của nút đi qua cùng `docDanhBa` nên hai trang không lệch nhau.
- `lib/ops/registry/cay.ts`: dựng cây, che tên nguồn (`maskSourceNames`) ở máy chủ, gắn chỗ thiếu. Không tính số.
- Chỉ SELECT; không đọc `source_registry` trong câu danh bạ (bộ che lấy danh sách tên qua `getSourceNameEntries` dùng chung).
- Toà có bí danh S09: ô «Mã nguồn chưa nối» thêm câu chú «S09 đã cấp tên N toà» (Hỏi-1, nháp theo khuyến nghị).
- Mọi chữ lấy từ nguồn (tên dự án, bí danh, tên toà, mã toà, trục, căn, mã đã nối, tên dự án nguồn chưa nối) qua
  `maskSourceNames` ở máy chủ.
- Không cần view hay cột mới.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: thanh bên Ops «Danh bạ» → `/ops/registry` (bốn ô số + bảng) → gõ tên/bí danh hoặc lọc chỗ thiếu → bấm tên dự án → `/ops/registry/<id>` → mở một toà xem căn (điểm ra: breadcrumb «Danh bạ»).
- Biên: dự án không có toà (tab rỗng kèm «Về danh bạ»); toà không có căn (badge «Chưa có căn»); nguồn S09 chưa có bảng nối (mọi mã hiện «Chưa qua bước nối»).
- Lỗi & quay lại: truy vấn lỗi → khung lỗi tại chỗ kèm «Thử lại»; id sai khuôn hay không phải dự án → 404; cloud → cảnh báo «Chỉ ở máy thu».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Danh bạ `/ops/registry` | Thấy danh bạ đang giữ gì và thiếu gì | Thanh bên Ops / trang một dự án |
| Một dự án `/ops/registry/<id>` | Thấy toà và căn của một dự án, toà nào chưa có căn | Bảng Danh bạ / breadcrumb về Danh bạ |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-danhba-loading | Danh bạ | Khung chờ: đầu trang, bốn ô, bảng | chờ |
| ST-danhba-empty | Danh bạ | «Danh bạ chưa có dự án» + lệnh `node pipeline/noi-du-an-s06.mjs` | chạy lệnh trên máy thu |
| ST-danhba-loc-rong | Danh bạ | «Không có dự án nào khớp bộ lọc.» + «Xoá lọc» | xoá lọc |
| ST-danhba-error | Danh bạ | «Không tải được danh bạ» + «Thử lại» | thử lại |
| ST-danhba-cloud | Danh bạ | «Chỉ ở máy thu» | mở Ops máy thu |
| ST-danhba-chuanoi-rong | Danh bạ | «Mọi mã dự án đã nạp đều đã nối.» | — |
| ST-duan-loading | Một dự án | Khung chờ cùng bố cục | chờ |
| ST-duan-khong-toa | Một dự án | «Dự án chưa có toà nào trong danh bạ.» + «Về danh bạ» | về danh bạ |
| ST-duan-du-can | Một dự án | tab «Chưa có căn»: «Mọi toà của dự án đều đã có căn.» | — |
| ST-duan-404 | Một dự án | trang 404 | về danh bạ |
| ST-duan-error | Một dự án | «Không tải được dự án» + «Thử lại» | thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Tìm gấp dấu, không phân biệt hoa thường, khớp cả tên/bí danh của phân khu con; đổi chữ tìm hay lọc về trang 1.
- Bảng phân trang 25 dự án; hàng con (phân khu, căn) không tính vào trang. Màn ≥ md có cột Tỉnh/thành và Nguồn; 390 px giữ tên, bậc, số.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `reui/data-grid` (cây `getSubRows` + `DataGridTableRowExpand`) | dùng | bảng của kho; cây là tính năng sẵn của data-grid |
| `reui/filters` | dùng | thanh chip lọc theo khuôn /ops/deals |
| `StatTiles`, `PageHeader` | dùng | khối KPI và đầu trang dùng chung của app |
| `reui/frame`, `ui/tabs`, `ui/empty`, `reui/badge` | ghép | khung, tab đếm, trống, bậc/nguồn |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: (ii) chọn thẳng — danh sách vài trăm dự án có lọc, bấm vào một dự án để xem toà/căn; cùng khuôn với `/ops/people` → `/ops/people/[partyKey]` đã được Mạnh ký (30/10), nên không tra thêm.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Mạnh (quản trị), người vận hành |
| Việc chính | Thấy danh bạ dự án, toà, căn đang có gì và còn thiếu gì để quản lý |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->

## Chuẩn UI

Nạp `reui` → `onehub-ui` (khoá `feature_loop.ui_standards_skill: onehub-ui`). Kế hoạch 7 dòng: bề mặt operational ·
archetype Table-backed management (+ Record detail cho trang dự án) · họ khung Frame cho bảng, StatTiles (Frame) cho ô số ·
dense · vùng: PageHeader → bốn ô → Frame «Dự án» (tìm + filters + data-grid cây + phân trang) → Frame «Mã dự án nguồn chưa
nối» (tab theo nguồn + data-grid) · trạng thái như bảng trên · motion: không.

## Ngoài vùng (xin chạm qua giám sát, U2-67)

`app/src/components/shell/nav.tsx` (mục «Danh bạ», nhóm Xử lý), `.claude/skills/onehub-ui/routes.md` (hai dòng route),
`.claude/skills/onehub-ui/catalog.md`, `docs/architecture/portals.md`, `_acceptance/config.yaml` (hai khoá executor).
