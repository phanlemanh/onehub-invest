# Ô KPI Ops trên cloud đọc số máy local đẩy lên (ON3 · `o-kpi-chi-do-local`) — design

Hàng ON3 của `docs/plan/lo-trinh.json` (dãy P2, đợt `dot0-cam-mau`, chuỗi ADR-0014 … → ON22 → **ON3**). Phủ OPS-4, OPS-5,
OPS-20, YC6, QD2a (gốc G2: trang vẽ xanh hay 0 khi không đo được). Ngưỡng (`bat_khi`): «Không facts (lược đồ như cloud): 0
ô KPI xanh hay số 0 trên ba trang, «Chỉ đo ở máy local» một lần mỗi trang; facts tươi: ô hiện đúng số của khối và mốc đo giờ
VN; facts cũ 46′: Alert «Máy local không đẩy số từ …», 0 badge xanh; /ops/review cloud: «N thẻ đang chờ» bằng số đếm ở local».

**Thứ tự (giám sát duyệt P2-31):** phần chữ S1 làm ngay; bản bấm được (S1-D) và code chờ ON8 `gio-ops-gio-vn` merge — hàng
dùng bộ định dạng giờ VN của ON8 và chung `lib/freshness.ts`.

## Hiện trạng (trên cloud, `source_registry` / `review_queue` vắng)

- `/ops`: `getCoverageOverview()` trả `[]` → ô «Quá hạn» hiện **0** kèm badge xanh «Không có», «Chưa có snapshot 0»,
  «Snapshot mới nhất —»; `LocalOnlyAlert` + chữ «chỉ đo ở local» trong ô và stats của PageHeader (lặp — OPS-20).
- `/ops/collections`: `getSourceFeedHealth()` trả `[]` → «Sức khoẻ nguồn 0/0», «Bản ghi 24h **0**» dù dữ liệu vẫn chảy
  (OPS-5); Alert «Máy thu có thể offline» ngưỡng 30′ theo `pushedAt` (lệch ngưỡng 45′ của ADR-0014); ô Lockdown tính từ
  probe chạy ngay trên Vercel → «0/8», dải «Hỏng» đỏ giả.
- `/ops/review`: chỉ `LocalOnlyAlert` «Hàng chờ duyệt chỉ có ở máy local», không có số thẻ đang chờ (QD2a).
- Từ ON22: `readOpsFacts()` (`app/src/lib/ops-facts.ts`) trả `{state: none|fresh|stale, measuredAt, blocks}`; khối
  `freshness` (hàng như `check-freshness`), `records24h`, `reviewQueue`, `lockdown`, `jobs`; khối lỗi có `state: "error"`.

## Cách làm

1. **Chế độ cloud = bảng tầng A vắng** (đúng điều kiện trang đang dùng: `freshnessLocalOnly()` cho `/ops`,
   `/ops/collections`; `localOnlyTable("review_queue")` cho `/ops/review`). Ở máy local trang giữ nguyên đường đo trực
   tiếp, không đọc facts.
2. **Nguồn số trên cloud** — một hàm `getCloudOpsView()` (`app/src/lib/ops-cloud.ts`) gọi `readOpsFacts()` một lần mỗi
   request và dựng:
   - `coverage: CoverageRow[]` từ `blocks.freshness.rows` (cùng phép chuyển của `getCoverageOverview`, bỏ `no-slo`);
   - `feeds: SourceFeedHealth[]` cho hai ô đầu của Thu thập — độ tươi từ `freshness`, `items24h` từ `records24h`;
   - `pending: {byType, total}` từ `reviewQueue`;
   - `stamp: {state, measuredAt}` của cả bản tin.
   Khối `error` hay vắng → phần đó `null` (trang hiện «—», không 0).
3. **Một dòng mốc đo + một Alert số cũ, dựng một lần** (`app/src/components/ops/facts-status.tsx`), ON2/ON4/ON5 dùng lại:
   - `FactsStamp`: «Số đo lúc YYYY-MM-DD HH:MM (GMT+7) từ máy local» (bộ định dạng ON8, sổ d-13) — chữ `text-xs` dưới PageHeader, khi `state` = `fresh` hoặc `stale`.
   - `FactsStaleAlert`: `Alert variant="warning"` «Máy local không đẩy số từ YYYY-MM-DD HH:MM (GMT+7)» + một dòng «Số dưới đây là lần
     đo cuối — kiểm cloud-sync ở máy thu.» khi `state` = `stale`.
   - `state` = `none`: không dòng mốc; `LocalOnlyAlert` (đã có) là chỗ DUY NHẤT mang chữ «Chỉ đo ở máy local» của trang.
   Giờ VN qua bộ định dạng của ON8.
4. **Ô KPI không số 0 trấn an, không badge xanh khi không đo được**:
   - Không có số (facts `none`, khối lỗi) → giá trị «—», không badge, không dải phân đoạn, chú thích chân ô «Chưa có số»
     (không lặp chữ chỉ-local; stats của PageHeader cũng bỏ câu «chỉ đo ở local»).
   - Ô Lockdown trên cloud trước ON23 → theo Hỏi-1.
   - Facts `stale` → số vẫn hiện nhưng `text-muted-foreground`, không badge `success-light` nào.
   - Facts `fresh` → ô như ở máy local.
5. **`/ops/review` trên cloud**: thêm dòng «N thẻ đang chờ» (+ theo loại, `Badge variant="outline"`) phía trên
   `LocalOnlyAlert` của nội dung thẻ; không có số → «—». Alert giữ mô tả cũ, đổi tiêu đề thành chữ chỉ-local duy nhất của trang.
6. **Gộp cảnh báo cũ**: Alert «Máy thu có thể offline» 30′ của Thu thập thay bằng `FactsStaleAlert` (ngưỡng 45′ một chỗ của ON22).

## Không làm

- Lưới lockdown và ô Lockdown đọc khối `lockdown` — ON23 (ô hiện theo Hỏi-1 tới lúc đó).
- Lưới job, luồng 7 ngày, nhóm S03 trên cloud — ON4/ON5.
- `/api/v1/ops/coverage` — AU12. Định dạng giờ VN — ON8. Trang `/ops/quality`, `/ops/deals` — không đổi.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: người trực mở `/ops` trên cloud → thấy «Số đo lúc 2026-10-24 19:45 (GMT+7) từ máy local» + ô số → bấm «Thu thập» / «Review»
  (điểm ra: trang con hoặc máy thu).
- Biên: chưa từng có bản tin (cloud mới) → «—» + một Alert «Chỉ đo ở máy local»; một khối đo lỗi → ô của khối đó «—».
- Lỗi & quay lại: máy local im > 45′ → Alert vàng nêu giờ đẩy cuối → người trực kiểm `cloud-sync` ở máy thu; lượt đẩy kế
  tiếp làm Alert tự mất.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops` Tổng quan | nguồn nào đang quá hạn | nav Ops / Thu thập, lưới mục tiêu |
| `/ops/collections` Thu thập | hôm nay chảy vào gì | nav / `#nguon`, `#luong` |
| `/ops/review` Review | còn bao nhiêu thẻ chờ | nav nhóm Xử lý / máy thu |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-ops-none | `/ops` | 4 ô «—», 1 Alert info «Chỉ đo ở máy local», lưới mục tiêu trống | mở Ops ở máy thu |
| ST-ops-fresh | `/ops` | «Số đo lúc YYYY-MM-DD HH:MM (GMT+7) từ máy local» (bộ định dạng ON8, sổ d-13), 4 ô số của khối độ tươi | đọc, bấm vào nguồn quá hạn |
| ST-ops-stale | `/ops` | Alert vàng «Máy local không đẩy số từ YYYY-MM-DD HH:MM (GMT+7)», số mờ, 0 badge xanh | kiểm cloud-sync ở máy thu |
| ST-collections-none | `/ops/collections` | ô «Sức khoẻ nguồn», «Bản ghi 24h», «Lockdown» = «—», 1 Alert info | mở Ops ở máy thu |
| ST-collections-fresh | `/ops/collections` | dòng mốc đo, «Bản ghi 24h» = tổng khối 24h, «Sức khoẻ nguồn» = x/y của khối độ tươi | đọc |
| ST-collections-stale | `/ops/collections` | Alert vàng 45′ (thay Alert 30′ cũ), số mờ, 0 badge xanh | kiểm cloud-sync |
| ST-review-count | `/ops/review` | «N thẻ đang chờ» + theo loại, Alert info «Hàng chờ duyệt chỉ có ở máy local» | duyệt ở máy thu |
| ST-review-none | `/ops/review` | «—», cùng Alert | mở Ops ở máy thu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Mốc giờ hiện theo giờ VN có ghi múi (ON8); ngưỡng cũ 45′ đọc từ `FACTS_STALE_MS` (ON22) — không hằng mới.
- Ở 390px: dòng mốc đo xuống dòng dưới tiêu đề; ô KPI 1 cột (lưới có sẵn).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `Alert` (`@/components/reui/alert`) | dùng | cảnh báo số cũ, variant `warning` |
| `LocalOnlyAlert` | dùng | chữ chỉ-local đã có (PR #53) — chỗ duy nhất mỗi trang |
| `Badge` (`@/components/reui/badge`) | dùng | đếm thẻ theo loại, `outline` (không màu trạng thái) |
| `FactsStamp`, `FactsStaleAlert` | ghép | một dòng mốc đo + Alert dùng lại ở ON2/ON4/ON5 |
| `OverviewTiles`, `CollectionsTiles` | mở rộng | nhận giá trị «—» và cờ số cũ |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — ba trang đã là Dashboard grid / Table-backed theo `onehub-ui/routes.md`; vòng chỉ đổi nguồn số
và trạng thái ô, không đổi cấu trúc.
<!-- UX-SPEC-TEMPLATE>>> -->

## Hỏi-1 (chỉ người có — an toàn Zalo)

Từ lúc merge tới ON23, ô Lockdown của `/ops/collections` trên cloud hiện gì? Hiện nay nó tính từ probe chạy ngay trên Vercel
nên luôn ra dải «Hỏng» đỏ giả. Bốn lối:
- **A (máy khuyên)**: «—» kèm `Badge variant="warning-light"` «Chưa kiểm được trên cloud» — không xanh, không đỏ giả, vẫn là
  tông cảnh báo nhắc người trực kiểm ở máy thu (đúng tinh thần ON2: không bao giờ «Ổn» cho lớp không kiểm).
- B: «—» trung tính — giá: người trực trên cloud không còn tín hiệu nào về lockdown cho tới ON23.
- C: ẩn ô trên cloud — giá: như B, lại mất chỗ cho ON23 cắm số.
- D: làm ON23 trước ON3 — giá: ON3 (ô số chính của ba trang) chờ thêm một vòng.
