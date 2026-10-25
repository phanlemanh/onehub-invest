# Luồng 7 ngày đếm đúng (ON5 · `luong-7-ngay-dung-so`) — thiết kế

Hàng ON5 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `ops-luong`, hạng T3, đứng trên ON22). Câu giao:
«Người vận hành đọc «Luồng 7 ngày qua» trên /ops/collections thấy mỗi cột đếm đúng thứ nhãn nói: tin rao đúng nguồn,
đủ 7 ngày từ số máy local đẩy lên (ADR-0014), cột không có dữ liệu trên cloud ghi «chỉ local»». Ngưỡng (`bat_khi`):
«Ngày có tin S03 qua cổng: cột tin rao bằng số tin S03 của ngày đó, không lớn hơn số post; facts có 7 khoá ngày; cột
thô trên cloud ghi «chỉ local»». Gốc OPS-8 (G1 + G4).

## 1. Hiện trạng (main 8731f81, DB local đo 25/10)

`getFlowDays` (`app/src/lib/collections-queries.ts:93`) dựng 7 dòng ngày giờ VN (ON8) với 6 cột; trên máy chủ
`/ops/collections` không dựng bảng — ON3 gom «Luồng 7 ngày» vào Alert «Phần còn lại của trang chưa có số trên máy chủ».

| Cột (nhãn) | Đếm gì hôm nay | Sai |
|---|---|---|
| S03 — tin rao (đã đọc) | `sale_offers` MỌI nguồn theo ngày `first_seen` | ngày 23/10: 2761 tin (S06 2660) — lớn hơn số bài S03 |
| S03 — bài thô | `stg_zalo_posts` MỌI dòng (kể cả mock) theo ngày `captured_at` | `captured_at` là giờ nạp: bài đăng 22:49 vào ngày hôm sau; 18–19/10 đếm 1260 bài mock |
| S01 — snapshot | `airbnb_snapshots` | bảng thô không đồng bộ lên máy chủ (`sync-cloud.mjs:23`) — trên máy chủ luôn 0 |
| S01 — listing tươi | `listings.last_seen` | đồng bộ lên máy chủ — đếm được ở cả hai nơi |
| S02 — thị trường / listing | `airdna_*` (máy chủ: `ref_calib_*`) | số S02 ngoài `/ops/quality` là ON6 (OPS-14) |

Bản tin máy thu (`push-ops-facts.mjs`) có khoá cũ `zaloFlow` (`pipeline/lib/ops-flow.mjs:69`): chỉ những ngày có dòng,
tin rao mọi nguồn, bài theo `captured_at` — không có mốc đo, không qua khuôn khối của ON22.

Đo trên DB local, theo cùng đồng hồ ngày đăng (`posted_at` của bài, `first_seen` của tin): tin rao S03 ≤ bài S03 ở mọi
ngày (vd 23/10: 101 ≤ 1366); 232/232 tin S03 có `first_seen` đúng bằng giờ đăng bài sớm nhất trong `post_ids`.

## 2. Thiết kế

1. **Một định nghĩa cho hai cột S03** (`pipeline/lib/ops-flow.mjs`, hàm mới `luong7`; app dùng đúng SQL đó):
   - «bài thô» = bài S03 thật (`snapshot_id` của tác tử thu `zalo-agent`, không mock) theo ngày VN của `posted_at`;
   - «tin rao (đã đọc)» = `sale_offers` có `source = 'S03'` theo ngày VN của `first_seen`.
   Hai cột cùng đồng hồ «ngày đăng», nên tin rao không vượt bài của cùng ngày. Mô tả bảng đổi thành «Số bản ghi theo
   nguồn, theo ngày (giờ VN); S03 tính theo ngày đăng bài» (bỏ chữ «giờ máy» cũ, sai từ ON8).
2. **Khối `luong7` trong `blocks` của bản tin** (khuôn ON22): `{measured_at, days:[{day, s03Posts, s03Offers}]}`, ĐÚNG 7
   khoá ngày VN tính tới lúc đo, ngày không có dòng ghi 0. Đo hỏng → `{measured_at, error}`. Khoá cũ `zaloFlow` giữ
   nguyên cho bản app đang chạy, không ai đọc nữa sau vòng này.
3. **Máy chủ dựng lại bảng** (bỏ «Luồng 7 ngày» khỏi Alert của ON3 khi đã có bản tin):
   - hai cột S03 đọc khối `luong7` (qua `readOpsFacts` của ON22); khối vắng hoặc lỗi → ô «—», không 0;
   - «S01 — listing tươi» đếm trên bảng `listings` đã đồng bộ (ADR-0014 §4 chỉ cấm tự đo thứ chỉ có ở máy thu);
   - «S01 — snapshot» (bảng thô, không lên máy chủ) → mọi ô ghi «Chỉ ở máy thu» (nhãn «Máy thu» của `CONTEXT.md`, thay
     cho chữ «chỉ local» của câu giao);
   - hai cột S02 không dựng trên máy chủ (luật 5; ON6 gỡ hẳn ở mọi nơi);
   - bản tin cũ quá 45′ → số S03 mờ (`text-muted-foreground`), như ô KPI của ON3; chưa có bản tin → không dựng bảng,
     «Luồng 7 ngày» vẫn nằm trong Alert.
4. **Máy thu giữ đủ 6 cột** — chỉ hai cột S03 đổi định nghĩa và mô tả đổi chữ.

Lối đã loại: đẩy luôn số snapshot S01 vào khối (máy chủ có đủ số) — trái ngưỡng đã duyệt «cột thô trên cloud ghi «chỉ
local»»; đếm tin rao theo ngày nạp (`captured_at`) — `sale_offers` không có giờ nạp, `first_seen` là giờ đăng.

## 3. Phép đo

1. **Định nghĩa ở máy thu** (`app/tests/luong-7-ngay-dung-so.test.tsx`, lược đồ tạm từ `ops-facts-fixture.mjs`): bài
   mock, bài nạp sau nửa đêm, tin S06 cùng ngày, tin S03 lúc 23:59 và 00:01 giờ VN → từng ô đúng số viết trước; mỗi ô có
   bản sao đỏ (đếm mọi nguồn / đếm theo `captured_at`) báo đúng ngày và số.
2. **Khối bản tin** (cùng tệp, bên ghi thật qua `captureOpsFacts`): 7 khoá ngày VN liên tiếp tới ngày đo, ngày rỗng = 0,
   có `measured_at`; khối bằng `getFlowDays` của app ở máy thu trên cùng lược đồ; bộ soát tầng A vẫn xanh.
3. **Máy chủ** (SSR `CloudCollections` với bản tin tổng hợp): ô S03 lấy từ khối, 7 ô snapshot «Chỉ ở máy thu», không
   cột S02, Alert không còn «Luồng 7 ngày»; khối vắng → «—»; bản tin cũ → mờ; chưa có bản tin → không bảng.
   Vòng trọn: bản tin do bên ghi thật dựng trên lược đồ tạm được ghi vào `ops_heartbeat` của lược đồ đó, máy chủ đọc
   qua `readOpsFacts` rồi mới SSR — 14 ô S03 so với số viết trước, đọc lớp mờ theo từng ô (ô «Chỉ ở máy thu» vốn mờ).
4. **Ngưỡng trên dữ liệu thật** (`scripts/luong-7-ngay-do.mjs`, DB local): mỗi ngày trong 7 ngày, `s03Offers` của khối
   bằng số tin S03 đếm theo đường độc lập (ngày đăng của bài sớm nhất trong `post_ids`) và ≤ `s03Posts`; phải có ít
   nhất một ngày có tin S03, không thì thoát đỏ.
5. **Trình duyệt** (`scripts/smoke-luong-7-ngay.mjs`, theo khuyến nghị Hỏi-2): `next dev` với cờ máy chủ, DB trỏ lược
   đồ tạm có `ops_heartbeat` riêng (bảng còn lại đọc `public`), Chromium 1280/390 ở ba trạng thái tươi · cũ · thiếu
   khối, chụp ảnh từng ô trạng thái × khổ; dòng `ops_heartbeat` thật của DB local không đổi.

## Hỏi

- **Hỏi-1 — «cột thô trên cloud ghi «chỉ local»» là cột nào?** Câu ngưỡng không nói; cột mang chữ «thô» là «S03 — bài
  thô». Máy khuyên: chỉ «S01 — snapshot» ghi «Chỉ ở máy thu», «S03 — bài thô» hiện số từ khối — để người trực so
  «tin rao ≤ bài» ngay trên máy chủ. Lối khác: (b) cả hai cột ghi «Chỉ ở máy thu» — mất phép so; (c) đẩy luôn số
  snapshot — không cột nào «Chỉ ở máy thu», câu ngưỡng phải sửa.
- **Hỏi-2 — phần nhìn trên trình duyệt.** Máy khuyên: thêm smoke Chromium có ảnh chụp (AC-9) và vẫn bỏ eval `ui-check`
  có tên. Lối khác: (b) eval `ui-check` do tác tử chấm tự dựng app chế độ máy chủ — thêm một lượt dựng; (c) chỉ SSR —
  người ký không thấy bảng.

## 4. Không làm

- Gỡ số S02 khỏi trang Thu thập ở máy thu (ON6). Biểu đồ luồng và panel Rotation (ON6).
- Bỏ khoá `zaloFlow` khỏi bản tin — để vòng sau khi chắc không bản app nào còn đọc.
- Đổi lưới job, nhóm S03, lockdown trên máy chủ (ON4, ON23).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: người trực mở `/ops/collections` trên máy chủ → cuộn tới «Luồng 7 ngày qua» → đọc 7 ngày (điểm ra: Thu thập ở
  máy thu khi cần cột snapshot).
- Biên: máy thu đẩy bản tin đời cũ (chưa có khối `luong7`) → hai cột S03 «—»; ngày không có bài → 0 (đã đo, không có
  dòng).
- Lỗi & quay lại: bản tin cũ quá 45′ → Alert vàng của ON3 + số S03 mờ → người trực kiểm đồng bộ ở máy thu.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` (vùng `#luong`) | 7 ngày qua chảy vào bao nhiêu, theo nguồn | nav Ops / Thu thập ở máy thu |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-luong-local | `/ops/collections` máy thu | đủ 6 cột, hai cột S03 theo định nghĩa mới | đọc |
| ST-luong-cloud-fresh | `/ops/collections` máy chủ | 4 cột: listing tươi, snapshot «Chỉ ở máy thu», bài thô, tin rao | đọc |
| ST-luong-cloud-stale | `/ops/collections` máy chủ | như trên, hai cột S03 mờ, Alert vàng của ON3 ở đầu trang | kiểm đồng bộ ở máy thu |
| ST-luong-cloud-thieu-khoi | `/ops/collections` máy chủ | hai cột S03 «—» | đợi lượt đẩy kế |
| ST-luong-cloud-none | `/ops/collections` máy chủ | không bảng; «Luồng 7 ngày» trong Alert «Phần còn lại…» | mở Thu thập ở máy thu |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ô «Chỉ ở máy thu» canh phải như ô số, `text-muted-foreground`; ở 390px bảng cuộn ngang trong khung như hiện nay.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `InsightGrid` / `FlowTable` | mở rộng | thêm chế độ máy chủ (ẩn S02, ô «Chỉ ở máy thu», ô «—», số mờ) |
| `LocalOnlyAlert` | dùng | Alert của ON3, bỏ «Luồng 7 ngày» khỏi danh sách khi đã có bản tin |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — `/ops/collections` đã là Dashboard grid theo `onehub-ui/routes.md`; vòng chỉ đổi nguồn số
của một bảng có sẵn.
<!-- UX-SPEC-TEMPLATE>>> -->
