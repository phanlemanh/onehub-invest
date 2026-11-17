# TG1 — Thẻ địa chỉ nhóm S03 (thiết kế)

Hàng TG1 (lát l01, mốc MS1), hạng T3. Cổng Đáng: Mạnh «build, giữ ngưỡng đề xuất» 15/11. Ô cơ hội:
`_acceptance/the-dia-chi-nhom-s03/opportunity.md`. Bảng phủ ca: `_acceptance/the-dia-chi-nhom-s03/discovery/bang-phu-ca.md`.

## Vấn đề

ROADMAP §3 mục 51 (Mạnh 15/11): bài nằm trong nhóm nào là dữ kiện; thẻ địa chỉ của nhóm (dự án, phường và tỉnh, phân khu mặc
định, bán hay thuê) là mặc định cho tin của nhóm, chữ bài nêu rõ dự án khác thì chữ bài thắng; đóng dấu lên tin ở bước nạp là
hàng TG2. Hôm nay sổ nhóm (`collection_units`) chỉ có `project_node_ids` và `market_codes`; theo khoá thật, 27 nhóm S03 có bài,
13 nhóm sổ ghi đúng một dự án, 14 nhóm thiếu (9 chưa ghi, 3 ghi nhiều dự án, 2 chưa có trong sổ). Chỉ khoảng 6% bài (8.529) đã
qua bước đọc có ô `o`.

## Thiết kế

### Dữ liệu — migration 108 (chỉ máy thu)

- `group_address_cards`: một dòng mỗi **nhóm thật** (khoá `khoaNhomThat` của `pipeline/lib/eval-labels.mjs`). Cột: `group_key`
  (khoá thật — tầng A, không rời hàm đọc), `unit_code` (mã sổ đại diện, NULL khi nhóm chưa có trong sổ), `card_code` (mã thẻ
  máy cấp `TN-001…`, dùng ở API và giao diện thay khoá nhóm), `status` (`nhap` · `da_duyet` · `bac`), bốn ô —
  `project_node_ids bigint[]` (0–3 nút dự án), `area_id` (phường), `iso_region` (tỉnh), `subzone_node_id`, `purpose`
  (`ban` · `thue` · `ca_hai`) — cùng `evidence jsonb` (mỗi ô: nguồn căn cứ, số bài căn cứ, số bài đã đọc của nhóm), `version`,
  `drafted_at`, `decided_by`, `decided_at`, `decision_note`.
- `group_address_card_history`: mỗi lần dựng nháp, nhận, sửa, bác một dòng — `card_code`, `version`, `action`, `actor`, `at`,
  `before`, `after`. Chỉ thêm, không sửa.
- Trigger kiểm tham chiếu: dự án là nút `project`, phân khu là nút `subzone`/`building`, phường là `areas` cấp phường.
- Không vào `sync-cloud` — thẻ chỉ ở máy thu; cloud đi sau, cần lời riêng.
- Hồ sơ áp năm thứ ở `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/` như DV7.

### Máy dựng nháp — `pipeline/scripts/the-dia-chi-nhom.mjs` + hàm thuần `pipeline/lib/the-dia-chi-nhom.mjs`

Chỉ đọc nhãn đã có (`silver_labels`), sổ và danh bạ — **không gọi model**. Mỗi nhóm thật có bài mà thẻ chưa `da_duyet`/`bac`:

| Ô | Luật (theo thứ tự) | Căn cứ ghi kèm |
|---|---|---|
| Dự án | sổ ghi đúng một dự án → nút đó; không thì tên dự án trong nhãn khớp tên/bí danh nút `project` (cùng bộ khớp của `du-an-ten-bai`), giữ nút có ≥ 3 bài và ≥ 10% số bài nêu tên, tối đa 3 nút xếp theo số bài | `so` hoặc `nhan`; số bài mỗi nút |
| Phường + tỉnh | một dự án có phường (danh bạ) → phường đó; nhiều dự án cùng một phường → phường đó; không thì phường chiếm ≥ 60% tin của nhóm có `area_id`; tỉnh suy từ phường | `du_an` hoặc `tin`; số tin |
| Phân khu | nhãn `subzone` khớp nút phân khu thuộc dự án đã chọn, ≥ 3 bài và ≥ 50% bài nêu phân khu | `nhan`; số bài |
| Bán/thuê | `silver_labels.kind`: một phía ≥ 80% → `ban`/`thue`; cả hai ≥ 20% → `ca_hai`; dưới 5 bài đọc → để trống | `nhan`; số bài mỗi phía |

Ô không đủ căn cứ để trống kèm số bài đã đọc — người vận hành thấy vì sao. Chạy lại không đổi thẻ đã duyệt/bác; nháp chỉ đổi khi
căn cứ đổi (mỗi lần đổi một dòng lịch sử). Lệnh không ghi `collection_units`, `field_assertions` hay tin.

### Duyệt — `/ops/sources`, khu «Sổ đơn vị thu», lưới «Nhóm S03»

- Đầu lưới: «Thẻ địa chỉ: x/27 nhóm có thẻ · n chờ duyệt».
- Cột «Thẻ địa chỉ»: badge `Nháp` / `Đã duyệt` / `Bác` / `Chưa có`; nút «Duyệt thẻ» mở hộp.
- Hộp: bốn ô, mỗi ô giá trị nháp + dòng căn cứ («từ 676 bài đọc ra tên, 3 tên»); sửa bằng combobox như hộp «Khai thị trường,
  dự án»; ba nút **Nhận** (giữ nháp), **Lưu sửa**, **Bác** (đòi lý do).
- Nhóm chưa có trong sổ hiện ở cuối lưới với nhãn «Chưa có trong sổ» và thẻ của nó — không có mã sổ, chỉ mã thẻ.
- API: `POST /api/v1/ops/group-cards` { cardCode, version, card: nhan|sua|bac, values?, note? } — quyền mới
  `unit.card_decide` (vai `ops`), ghi thẻ + lịch sử + `ops_audit` cùng giao dịch, `version` lệch → 409.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: `/ops/sources` → khu «Sổ đơn vị thu», tab Nhóm S03 → «Duyệt thẻ» ở một nhóm → xem bốn ô kèm căn cứ → Nhận (điểm ra:
  hàng đổi badge «Đã duyệt», bộ đếm tăng).
- Biên: nhóm chưa có trong sổ (không mã sổ) · ô trống vì thiếu căn cứ · thẻ đã duyệt mở lại để sửa · viewer chỉ xem.
- Lỗi & quay lại: lưu lỗi (409 thẻ đã đổi, 400 tham chiếu sai) → hộp giữ nguyên chữ đã nhập, thông báo nêu lý do, nút «Tải lại thẻ».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Lưới Nhóm S03 (khu Sổ đơn vị thu) | Thấy nhóm nào đã có thẻ, nhóm nào chờ duyệt | `/ops/sources` / hộp duyệt thẻ |
| Hộp duyệt thẻ | Nhận, sửa hay bác thẻ của một nhóm | Nút «Duyệt thẻ» / về lưới |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-luoi-loading | Lưới | Skeleton của lưới sổ | chờ |
| ST-luoi-empty | Lưới | «Chưa có thẻ nào — chạy lệnh dựng nháp» kèm lệnh chép được | chép lệnh |
| ST-luoi-error | Lưới | Alert lỗi đọc thẻ + «Thử lại» | thử lại |
| ST-luoi-cho-duyet | Lưới | Bộ đếm «x/27 · n chờ duyệt», badge Nháp | mở «Duyệt thẻ» |
| ST-hop-nhap | Hộp | Bốn ô nháp + căn cứ, ba nút | Nhận / sửa / Bác |
| ST-hop-o-trong | Hộp | Ô trống + «chưa đủ căn cứ (k bài đã đọc)» | điền tay hay bỏ trống |
| ST-hop-luu-loi | Hộp | Alert lý do (thẻ đã đổi / giá trị sai), giữ chữ | Tải lại thẻ / sửa |
| ST-hop-chi-xem | Hộp | Viewer: ô chỉ đọc, không nút ghi | đóng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Bác bắt buộc lý do (≥ 3 ký tự). Dự án tối đa 3. Esc đóng hộp khi chưa sửa; đã sửa thì hỏi bỏ thay đổi.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| StatusGrid của sổ | dùng | lưới Nhóm S03 đã có |
| Hộp «Khai thị trường, dự án» (`so-don-vi-dialog.tsx`) | mở rộng | cùng combobox dự án; thêm ô phường, phân khu, bán/thuê, dòng căn cứ |
| Badge, Alert ReUI | dùng | trạng thái theo token |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: lưới sổ đã là danh sách; duyệt từng nhóm là chi tiết trong hộp — luồng hiển nhiên, cùng khuôn với hộp khai sổ hiện có.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (vai ops), Mạnh |
| Việc chính | Nhận, sửa hay bác thẻ địa chỉ do máy dựng cho từng nhóm S03 |
| Tần suất | hiếm (một buổi đầu, sau đó khi có nhóm mới) |
| Số bản ghi | vài chục |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

- Đóng dấu thẻ lên tin lúc nạp, tính lại tin cũ khi sửa thẻ — TG2.
- Tiêu đề chuẩn hoá và mô tả nhóm (ON19), sửa sổ từ cloud (ON20) — kết quả riêng; RM2 (mục đích nhóm) gom vào ô bán/thuê.
- Gọi model đọc thêm bài để tăng căn cứ — không, chỉ nhãn đã có.
- Ghi thẻ đã duyệt vào `collection_units.project_node_ids` — xem câu hỏi Hỏi-2.
- Đưa thẻ lên cloud.
