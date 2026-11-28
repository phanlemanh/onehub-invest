# DA67 — Danh bạ Ops, đợt 1 của audit: gộp câu S16 và sửa nhãn

Nguồn: audit màn Danh bạ 27/11 (`research-local/audit-danh-ba-2711/BAO-CAO.md`, gitignored), mục 4 «Soát lại» và mục 5
«Đợt 1». Hàng DA67, GS giao 27/11. Chỉ `app/`, không migration, không đổi `pipeline/`.

## 1. Vấn đề

- Trang một dự án có toà (`/ops/registry/<id>`, 5/344 dự án) chạy hai câu thuộc tính S16 song song: `SQL_CAN` và
  `SQL_PHU` của `app/src/lib/ops/thuoc-tinh-can.ts`. Cả hai dựng lại trọn `v_unit_thuoc_tinh` và `v_s16_gia_cdt`
  (MATERIALIZED), mỗi câu ≈3,3–3,4 s. Phần riêng của ô phủ (`da`, `snap`, `khoa`, `mo_ho`, `bi_danh`) chỉ mất 66 ms.
  Ba số `co_thuoc_tinh`, `co_gia`, `lan_thu` của ô phủ lấy được từ chính kết quả câu thuộc tính.
- `MATERIALIZED` có chủ ý (chú thích dòng 42–43, đo 18/11): đẩy danh sách căn vào view có hàm cửa sổ thì planner chạy
  vòng lặp lồng hàng phút. Giữ nguyên.
- Nhãn sai nghĩa: nút mở hàng đọc «Expand row» ở mọi bảng cây (`DATA_GRID_VI` thiếu `expandRow`/`collapseRow`, 15 tệp
  dùng); dự án 0 toà ghi «Mọi toà đã có căn»; mã nút sai rơi vào 404 chung của Invest («Xem thị trường Việt Nam»).
- Danh sách: dòng phụ của 329/344 dự án gốc chỉ nhắc lại tên viết thường (đếm trên DB máy thu 27/11, bí danh có
  `fold(bí danh) = fold(tên)`); ở 375 px cột Bậc chiếm chỗ của Căn, Tin.

## 2. Thiết kế

### 2.1 Một câu thuộc tính cho cả lưới lẫn ô phủ

Hàm mới `docThuocTinhDuAn(toaKeys, q)` chạy MỘT câu `SQL_GOP`:

```sql
WITH can AS MATERIALIZED (…units của toaKeys…),
v AS MATERIALIZED (SELECT * FROM v_unit_thuoc_tinh),
g AS MATERIALIZED (SELECT * FROM v_s16_gia_cdt),
ket AS MATERIALIZED (SELECT can.unit_key, …cột thuộc tính…, v.unit_key IS NOT NULL AS co_v, g.unit_key IS NOT NULL AS co_g,
               v.observed_at FROM can LEFT JOIN v … LEFT JOIN g …),
phu AS (SELECT count(*) AS trong_danh_ba, count(*) FILTER (WHERE co_v) AS co_thuoc_tinh,
               count(*) FILTER (WHERE co_g) AS co_gia, max(observed_at) FILTER (WHERE co_v) AS lan_thu FROM ket),
da / snap / khoa / mo_ho / bi_danh  -- nguyên văn SQL_PHU
SELECT phu.*, so_du_an, chua_vao_danh_ba, ket.* FROM phu CROSS JOIN (…) p LEFT JOIN ket ON ket.co_v OR ket.co_g
```

Ô phủ cần `trong_danh_ba` = mọi căn của toà, kể cả căn không có thuộc tính, còn lưới chỉ cần căn có thuộc tính hoặc giá.
Vì vậy số của ô phủ là hàm gộp trên chính `ket` (một lượt dựng view, `ket` MATERIALIZED dùng hai lần), và dòng lưới là
`ket` đã lọc `co_v OR co_g`, `LEFT JOIN` sau `phu` để câu luôn có ít nhất một dòng mang số ô phủ — kể cả khi không căn
nào có thuộc tính. Audit gợi ý hàm cửa sổ (`count(…) OVER ()`) trên kết quả đã lọc; cách đó mất `trong_danh_ba` và mất
dòng số khi kết quả rỗng, nên dùng hàm gộp trên `ket` — cùng mục đích: một lượt dựng view, số vẫn đếm ở SQL.
`so_du_an` và `chua_vao_danh_ba` giữ nguyên câu con của `SQL_PHU`. Mọi số vẫn đếm ở SQL (luật 10); TypeScript chỉ tách
dòng.

`docThuocTinhCan` và `docPhuThuocTinh` giữ chữ ký, thành lớp mỏng gọi `docThuocTinhDuAn`. Test DA40 hiện có
(`app/tests/thuoc-tinh-can.test.tsx`) đo cả hai qua đúng đường mới, nên tiền đề TTC-AC-9/10 giữ nguyên: một khối bắt lỗi,
chuỗi cấy lỗi `GROUP BY … HAVING count(DISTINCT c.toa) = 1` và `WHERE b.value IS NULL AND m.gia_tri IS NULL` còn đúng một
lần. `du-an-content.tsx` gọi một hàm thay hai. `ONEHUB_TTC_LOI_THU=1`, dự án 0 toà, DB chưa áp 113 đi đúng như cũ.

### 2.2 Nhãn và trạng thái

- `DATA_GRID_VI.labels`: `expandRow: "Mở hàng"`, `collapseRow: "Thu gọn hàng"`. Một chỗ, 15 bảng nhận cùng lúc.
- Ô «Toà» của trang dự án: `soToa = 0` → chân ô «Chưa có toà»; `toaChuaCan > 0` → «N toà chưa có căn»; còn lại «Mọi toà
  đã có căn».
- `app/src/app/ops/registry/[nodeId]/not-found.tsx`: `Empty` có viền, tiêu đề «Không có dự án này trong danh bạ», một dòng
  giải thích, nút «Về danh bạ» → `/ops/registry`. Khuôn theo `(app)/listing/[id]/not-found.tsx`.

### 2.3 Danh sách dễ quét

- `registry-grid.tsx`: dòng phụ bỏ bí danh có `fold(bí danh) === fold(tên)` (`fold` của `lib/mask-source-names.ts`, cùng
  hàm ô tìm đang dùng); các bí danh khác vẫn hiện, tối đa 3. Ô tìm vẫn khớp theo mọi bí danh (`timKiem` không đổi).
- Cột Bậc: `hidden md:table-cell`, giống cách Tỉnh/thành, Nguồn đang ẩn. Căn, Tin đang rao không đổi.

### 2.4 Ngoài phạm vi

Đếm «Tin đang rao» tính sẵn (DA68, đợt 2) · tải căn theo toà (đợt 3) · tính sẵn S16 (đợt 4) · `FramePanel
p-0! shadow-none!` (chờ khuôn ReUI) · bí danh ở mô tả đầu trang dự án · tốc độ danh sách `/ops/registry`.

## 3. Đo

- Lớp đọc: trên DB máy thu (chỉ đọc), với 5 dự án có toà (16, 1, 4, 2, 3), kết quả của hàm mới bằng đúng kết quả của bản
  `main` (lưới và ô phủ), và tổng thời gian câu đọc thuộc tính trên dự án 16 (trung vị 3 lần) giảm từ hai lượt dựng view
  xuống một. Probe `_acceptance/danh-ba-ops-gop-cau-s16-va-nhan/probes/so-s16.mts`.
- Màn: thời gian tải `/ops/registry/16` trước → sau, đo bằng Navigation Timing trên dev server của worktree (cùng cách
  audit, máy có tải nên chỉ so tương đối); số «trước» đo trên bản `main` cùng lúc.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Danh bạ `/ops/registry` → bấm tên dự án → trang dự án (ô số + lưới toà, căn) (điểm ra: quay lại danh bạ).
- Biên: dự án 0 toà (339/344) → ô Toà «Chưa có toà», lưới toà trống có «Về danh bạ»; màn 375 px → bảng danh sách thấy
  Tên, Toà, Căn, Tin không cần cuộn ngang tới cột Bậc.
- Lỗi & quay lại: mã nút sai (`abc`, số không có, nút không phải dự án gốc) → trang «Không có dự án này trong danh bạ» →
  «Về danh bạ»; lỗi đọc thuộc tính S16 → Alert nội tuyến «Thử lại», lưới toà vẫn hiện.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/registry` | tìm một dự án và xem nó có bao nhiêu toà, căn, tin | thanh bên Ops / trang dự án |
| `/ops/registry/[nodeId]` | xem phủ toà, căn, thuộc tính của một dự án | danh bạ / danh bạ |
| `/ops/registry/[nodeId]` (404) | báo mã sai và đưa về danh bạ | đường dẫn sai / danh bạ |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-registry-du-an-khong-toa | `/ops/registry/[nodeId]` | ô Toà «0», chân «Chưa có toà»; lưới toà trống có «Về danh bạ» | về danh bạ |
| ST-registry-du-an-co-toa | `/ops/registry/[nodeId]` | ô phủ thuộc tính (một câu đọc), lưới toà → căn | mở toà |
| ST-registry-du-an-loi-s16 | `/ops/registry/[nodeId]` | Alert «Không tải được thuộc tính căn» + «Thử lại», lưới vẫn hiện | thử lại |
| ST-registry-du-an-404 | `/ops/registry/[nodeId]` | Empty «Không có dự án này trong danh bạ» + «Về danh bạ» | về danh bạ |
| ST-registry-danh-sach-hep | `/ops/registry` | 375 px: Tên, Toà, Căn, Tin; Bậc ẩn | bấm tên |
| ST-registry-mo-hang | mọi bảng cây | nút mở hàng đọc «Mở hàng» / «Thu gọn hàng» | mở hàng |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Breakpoint: cột Bậc ẩn dưới `md` (768 px), như Tỉnh/thành ẩn dưới `lg`, Nguồn dưới `md`.
- Nút mở hàng: `aria-label` theo trạng thái («Mở hàng» khi đóng, «Thu gọn hàng» khi mở), focus và `aria-expanded` không đổi.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ui/empty` + `ui/button` (trang 404) | ghép | khuôn sẵn của `(app)/listing/[id]/not-found.tsx` |
| `reui/data-grid` i18n | dùng | nhãn qua `DATA_GRID_VI`, không sửa vendor |
| `StatTiles` | dùng | chỉ đổi chữ chân ô |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: màn đã có, `routes.md` dòng 68–69 ghi «Table-backed management» → «Record detail»; vòng này không đổi luồng.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | đội vận hành (vai ops) trên máy thu |
| Việc chính | kiểm phủ toà, căn, thuộc tính của một dự án |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm trở lên (344 dự án; tới 38.138 căn mỗi dự án) |
| Thiết bị | cả hai (chủ yếu máy tính) |
<!-- UX-SPEC-TEMPLATE>>> -->
