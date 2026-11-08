# OD1 · ops-duyet-nhip-va-chu — Hàng duyệt ghi nhịp, chữ khớp quyết định, thẻ sạch, Căn giá tốt báo căn chờ ghép

Hàng OD1 của `docs/plan/lo-trinh.json` (T2). Căn cứ: `docs/research/soat-ops-0711.md` mục (f) — ĐC6 (đi đầu để có số
trước/sau), ĐC1, ĐC2, ĐC7 — và ROADMAP §3 mục 35 (Mạnh duyệt 07/11: «Đồng ý, tôi đã đăng nhập lại Reui pro»).

## 1. Vì sao

Hàng duyệt có 671 thẻ chờ (đo 08/11, DB máy thu), quyết 0 thẻ từ 05/11. Đợt điều chỉnh OD2–OD7 hứa giảm giây/thẻ theo
hạng mục, nhưng hôm nay không có số giây/thẻ nào: không ai biết một thẻ Ghép căn mất 30 hay 90 giây. OD1 ghi giờ mở và
giờ quyết của từng thẻ để OD2 có số trước, và dọn bốn chỗ làm người duyệt hiểu sai: điểm Stage B lộ trên tiêu đề, cột So
nói «Lệch» khi hai số bằng nhau, ảnh hỏng chiếm nửa sheet, nhãn mã thô `data_quality` và chữ trạng thái không khớp nút.
Thêm một nối: căn ở Căn giá tốt đang là một vế của thẻ Ghép căn chờ thì người gọi điện phải biết.

## 2. Phạm vi

| ĐC | Làm gì trong OD1 | Không làm (hàng sau) |
|---|---|---|
| ĐC6 Nhịp | Ghi `opened_at`, `decided_at`, `category`, `seconds` vào `ops_audit.detail` của `review.decide`; bảng «Nhịp duyệt 7 ngày» trên `/ops/review` | Rail hạng mục, ba số đầu trang, PageHeader (OD2 · ĐC3) |
| ĐC1 Chữ | Nhãn «Người» cho thẻ Người; nhãn trạng thái theo đáp án đã bấm; chữ trung tính; chữ nhánh cloud; CONTEXT.md | Liên kết hồ sơ trên thẻ Người (OD5); xưng hô màn Gắn nhãn (OD7) |
| ĐC2 Thẻ sạch | Gọt điểm Stage B khỏi tiêu đề và `evidence`; so Giá, Giá/m² trên số đã làm tròn; ảnh hỏng gom một dòng | Thẻ trước → sau từng trường (OD4) |
| ĐC7 Nối | Badge «Đang chờ ghép» + liên kết `?card=` ở lưới, sheet, trang một căn của Căn giá tốt; `/ops/review?card=<id>` mở thẳng thẻ | Phím tắt, tự sang thẻ kế, hoàn tác (OD2) |

## 3. Thiết kế

### 3.1 Ghi nhịp (ĐC6)

- **Đồng hồ ở trình duyệt, đơn điệu.** Sheet chi tiết dựng `ReviewCard` theo `key={item.id}`; hook `useDecide` ghi
  `performance.now()` lúc thẻ dựng. Bấm quyết → body gửi thêm `elapsed_ms = performance.now() − t0` (số nguyên). Không gửi
  giờ tuyệt đối của máy khách: đồng hồ máy khách lệch thì giờ mở sai, còn khoảng đơn điệu thì không lệch.
- **Máy chủ quy ra giờ.** Route decide giữ nguyên mọi luật cũ (lý do bắt buộc, 400 trước BEGIN, 409, 422 HD9). Thêm:
  `elapsed_ms` nguyên, 1…86 400 000 → `detail` có `decided_at` (= `now()` của giao dịch, cùng thời điểm với `decided_at`
  của `review_queue`), `opened_at` = `decided_at − elapsed`, `seconds` = elapsed/1000 làm tròn một chữ số; vắng, sai kiểu,
  ngoài khoảng → quyết vẫn ghi, `detail.timing = "khong-do"`, không có `opened_at`. Không bao giờ chặn một quyết định vì
  thiếu số đo (luật 7 — quyết định của người là việc chính, đo là phụ).
- **Hai số mỗi lượt (Hỏi-3, khuyến nghị).** `seconds` là thời gian ở thẻ (từ lúc thẻ dựng). Máy chủ ghi thêm
  `since_prev_seconds` = giây từ dòng `review.decide` gần nhất trước đó của cùng `actor` (một truy vấn trong giao dịch; vắng
  khi chưa có hay cách quá 24 giờ) — phần OD2 hứa rút (chọn thẻ kế, đóng/mở sheet) nằm ở số này. Đồng hồ thẻ chạy cả khi tab
  ẩn; lượt quá 30 phút loại khỏi trung vị (Hỏi-2).
- **Hạng mục suy lúc quyết, từ chính thẻ.** Hàm thuần `reviewCategory(item)` ở `app/src/lib/ops/review-hang-muc.ts`, dùng
  chung route (ghi `detail.category`) và trang (đếm thẻ chờ theo hạng mục):

  | Mã (`category`) | Nhãn | Điều kiện (theo thứ tự, điều kiện đầu khớp thắng) | Hạng mục báo cáo |
  |---|---|---|---|
  | `unit_match` | Ghép căn | `item_type = entity_match` | H9 |
  | `party_merge` | Gộp Người | `data_quality` + `item_id` bắt đầu `nguoi:` | H8 |
  | `rule_vs_ai` | Luật và AI khác nhau | `agent_output`, có trường `conflict` | H7 |
  | `fill` | Bổ sung tin | `agent_output`, có trường đề xuất | H4 + H5 + H6 |
  | `intent_check` | Đối chiếu ý định | `agent_output`, chỉ khối đối chiếu, loại đầu `y_dinh` | H1 |
  | `price_check` | Đối chiếu giá | như trên, loại đầu `gia` | H2 |
  | `area_check` | Đối chiếu diện tích | như trên, loại đầu `dien_tich` | H3 |
  | `other` | Loại khác | còn lại | — |

  «Loại đầu» theo thứ tự cố định `y_dinh → gia → dien_tich`, không theo thứ tự trong JSON. H4/H5/H6 gộp vì tách cần giá trị
  đang lưu của tin, mà thẻ chưa đọc giá trị đó — OD4 làm «trước → sau» (ghi Known limits).
- **Đọc số.** `loadReviewPace(days = 7)` ở `app/src/lib/ops/review-nhip.ts`: một truy vấn `ops_audit` (`action =
  'review.decide'`, `at > now() − 7 ngày`, `detail ? 'seconds'`), nhóm theo `detail->>'category'`: số quyết có đo, trung vị
  giây (`percentile_cont(0.5)`), số lượt dài hơn 30 phút (đếm riêng, không vào trung vị — Hỏi-2). Thẻ chờ theo hạng mục đếm
  từ danh sách thẻ đã tải (cùng hàm `reviewCategory`), không truy vấn thêm.
- **Hiện số.** Frame «Nhịp duyệt 7 ngày» đặt trên Frame «Danh sách thẻ» (cùng họ khung của trang), thân là `ui/table`
  dày: Hạng mục · Thẻ chờ · Đã quyết có đo · Trung vị ở thẻ · Trung vị giữa hai lượt · Quá 30 phút. Hàng theo thứ tự bảng hạng mục; hạng mục
  không có thẻ chờ và không có lượt đo thì ẩn. Chưa có lượt đo nào → một dòng trống kèm nút «Mở thẻ chờ cũ nhất»
  (`?card=<id thẻ chờ cũ nhất>`). Chỉ ở nhánh máy thu, vai Vận hành trở lên (nhánh viewer và cloud giữ như cũ).

### 3.2 Chữ và nhãn (ĐC1)

- `reviewKind(item)` thay cho tra `item_type` trần: `entity_match` · `agent_output` · `nguoi` · `other`. Badge loại hiện
  «Người» (`warning-light`) cho thẻ Người; bộ lọc «Loại thẻ» thêm «Người»; «Loại khác» không còn nhận thẻ Người.
- Nhãn trạng thái sau khi quyết = nhãn nút đã bấm (Hỏi-1, khuyến nghị):

  | Loại | approved | rejected | deferred |
  |---|---|---|---|
  | Ghép căn | Cùng căn | Khác căn | Không chắc |
  | Bổ sung tin | Đã áp | Đã bỏ | Để sau |
  | Bổ sung tin, chỉ đối chiếu | Đã ghi | Đã bỏ | Để sau |
  | Người | Đã gộp | Giữ tách | Hoãn |
  | Loại khác | Đã duyệt | Từ chối | Hoãn |

  Badge trạng thái ở danh sách, đầu sheet và `DoneState` đọc cùng một bảng (`reviewStatusLabel(item)`). Bộ lọc trạng thái
  giữ «Chờ duyệt · Đã quyết · Tất cả». Thông báo sau khi bấm cũng đọc bảng này (hết «Đã duyệt» cho nút «Áp dụng»).
  Thẻ Người giữ `NGUOI_DONE_LABEL` hiện có (nút «Gộp thành một Người · Giữ tách · Hoãn»), dời vào bảng chung.
- Chữ trung tính: «Máy đề xuất, người duyệt quyết — mọi quyết định được ghi nhật ký.»; ô Lý do «Vì sao quyết như vậy —
  ghi vào nhật ký cùng quyết định».
- Nhánh cloud: «Hàng duyệt chưa lên máy chủ — việc duyệt trên cloud là hàng TV13. Duyệt ở cổng Ops trên máy thu.»
- `CONTEXT.md`: sửa «Hàng duyệt» (loại thẻ, có thẻ Người, có hạng mục), «Ảnh tin» (vai Vận hành thấy ảnh đã tải, URL gốc
  chỉ quản trị, cloud theo ADR-0007 sửa 26/10), «Gắn nhãn» (24 ô, máy nháp + người feedback, gắn mù hoãn tới PL21); thêm
  «Hạng mục duyệt», «Nhịp duyệt», «Đang chờ ghép», tham số URL `card`. Sửa chú thích chữ «Mã thẻ» cũ ở `review-queue.ts`.

### 3.3 Thẻ sạch (ĐC2)

- `toReviewItem` gọt thêm: `evidence.stage_b_score` bỏ khỏi thẻ gửi xuống; tiêu đề Ghép căn dựng lại từ `evidence`:
  «Cùng căn? <phường> · <dt A> m² và <dt B> m²» (phường lấy `offer_b.phuong` — tên có dấu — rồi tới `offer_a.phuong`);
  thiếu dữ liệu dựng thì gọt vế «(score …)» khỏi tiêu đề gốc. Mọi loại thẻ khác: gọt mọi vế `score <số>` khỏi tiêu đề.
  Cột `title` trong DB không đổi (cùng cách Q9 giữ `ai_confidence` trong DB để hiệu chỉnh) — writer `judge-run` nằm ở
  `agent/`, ngoài vùng hàng.
- So trên số hiện: hàng Giá so chuỗi `fmtGia`, Giá/m² so chuỗi `fmtGiaM2`; Diện tích giữ so theo trị (ô hiện nguyên trị).
- Ảnh hỏng: `ReviewPhotos` không còn ô «Ảnh hỏng»; ảnh lỗi rời dải, một dòng «<n> ảnh không còn tải được» (chữ
  `text-xs` muted, cùng dáng dòng «chỉ có ở nguồn»). Hết ảnh tốt → chỉ còn dòng đó. Áp cả hai dáng (dải nhỏ và lưới lớn
  của trang một căn), hộp phóng to chỉ duyệt ảnh tốt.

### 3.4 Căn giá tốt ↔ Ghép căn (ĐC7)

- `loadPendingUnitMatches(offerIds)` ở `app/src/lib/ops/review-cho-ghep.ts`: `review_queue` vắng (cloud) → `{}`; còn lại
  một truy vấn thẻ `entity_match` `pending` có `item_id` khuôn `pair:<A>|<B>` mà A hoặc B thuộc danh sách → `offerId →
  [reviewId…]` (cũ nhất trước).
- `/ops/deals` (trang server) gọi hàm sau `getDeals`, chuyển bảng xuống `DealsGrid` thành prop `choGhep`; cột «Căn» hiện
  `Badge warning-light` «Đang chờ ghép» dưới dòng phường; sheet và `/ops/deals/[offerId]` hiện cùng badge kèm nút
  `Button variant="link"` «Mở thẻ ghép #<id>» tới `/ops/review?card=<id>`. Hiện cho mọi vai vào được trang (không lộ nội
  dung thẻ); liên kết đưa viewer tới trang chỉ có số đếm như cũ.
- `/ops/review?card=<id>`: trang đọc `searchParams.card`, truyền `moBanDau` xuống `ReviewQueue`; bộ nạp của trang
  (`loadReviewQueue`, tách sang `lib/ops/review-nap.ts`) đọc mọi thẻ của `review_queue`, không LIMIT; thẻ có trong hàng duyệt →
  sheet mở sẵn (bất kể trang và bộ lọc); không có → danh sách như thường + `Alert` warning «Không tìm thấy thẻ #<id>».
  Tham số tiếng Anh theo `CONTEXT.md` (báo cáo ghi `?the=`, đổi theo luật URL).

## 4. Không đổi

Không migration (`ops_audit.detail` là jsonb). Không đổi API ngoài một trường tuỳ chọn của body route decide. Không đổi
nút, thứ tự nút hay luật lý do (Q4 «lý do không bắt cho Hoãn» là OD2). Không gửi điểm, độ tự tin tới trình duyệt.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: `/ops/review` → đọc «Nhịp duyệt 7 ngày» → bấm một thẻ → sheet mở (đồng hồ chạy) → gõ lý do, bấm đáp án →
  badge trạng thái đổi sang nhãn đáp án; lượt quyết vào bảng nhịp ở lần tải sau (điểm ra: thẻ kế hoặc đóng sheet).
- Suôn sẻ 2: `/ops/deals` → hàng mang «Đang chờ ghép» → mở sheet căn → «Mở thẻ ghép #id» → `/ops/review?card=id` sheet mở
  sẵn thẻ đó.
- Biên: chưa có lượt đo nào; thẻ `?card=` đã quyết (vẫn mở, hiện nhãn đáp án); `?card=` lạ; cloud (không có hàng duyệt,
  không badge); vai Người xem (không thấy bảng nhịp).
- Lỗi & quay lại: truy vấn nhịp hỏng → RegionError của vùng hàng duyệt + Thử lại (cùng vùng tải với danh sách); route trả
  lỗi → thông báo cũ trong chân sheet, lý do giữ nguyên, đồng hồ không đặt lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/review` | Chọn thẻ để quyết, thấy nhịp đang đi | nav Xử lý, liên kết `?card=` / sheet thẻ |
| Sheet thẻ duyệt | Quyết một thẻ | hàng của danh sách, `?card=` / đóng về danh sách |
| `/ops/deals` (lưới, sheet) | Chọn căn để gọi | nav / trang một căn, thẻ ghép |
| `/ops/deals/[offerId]` | Xem một căn | lưới / thẻ ghép |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-review-loading | `/ops/review` | Skeleton khung «Nhịp duyệt 7 ngày» + bảng (trong Suspense của vùng) | chờ |
| ST-review-pace-empty | `/ops/review` | «Chưa có lượt quyết nào được đo trong 7 ngày.» + nút «Mở thẻ chờ cũ nhất» | mở thẻ |
| ST-review-pace-filled | `/ops/review` | bảng Hạng mục · Thẻ chờ · Đã quyết có đo · Trung vị ở thẻ · Trung vị giữa hai lượt · Quá 30 phút | đọc, chọn thẻ |
| ST-review-error | `/ops/review` | Alert «Không tải được hàng duyệt» + Thử lại (RegionError) | Thử lại |
| ST-review-card-missing | `/ops/review?card=` | Alert warning «Không tìm thấy thẻ #<id>» trên danh sách | chọn thẻ khác |
| ST-review-card-open | `/ops/review?card=` | sheet thẻ mở sẵn | quyết |
| ST-sheet-decided | sheet | badge + DoneState mang nhãn đáp án (vd «Khác căn»), lý do | đóng |
| ST-photos-broken | sheet, trang một căn | «3 ảnh không còn tải được», không ô ảnh hỏng | đọc tiếp |
| ST-deals-waiting | lưới, sheet, trang một căn | Badge «Đang chờ ghép» (+ «Mở thẻ ghép #id» ở sheet, trang) | mở thẻ ghép |
| ST-deals-cloud | `/ops/deals` cloud | không badge (máy chủ chưa có hàng duyệt) | như cũ |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Đồng hồ thẻ: đặt lại khi sheet dựng thẻ khác (`key`), không dừng khi tab ẩn (khoảng ngồi máy là thật; lượt > 30 phút
  đếm riêng). Không đổi focus, phím, breakpoint nào.
- Badge «Đang chờ ghép» không đổi chiều cao hàng lưới ở 375 px (nằm cùng dòng phường, xuống dòng khi thiếu chỗ).

### 5. Xuất xứ component

| Component | Nấc | Vì sao (1 dòng) |
|---|---|---|
| `reui/frame` + `ui/table` (Nhịp duyệt) | ghép | cùng họ Frame của trang; bảng nhỏ ≤ 8 hàng không cần data-grid |
| `reui/badge` warning-light (Người, Đang chờ ghép) | dùng | khuôn ĐC1, ĐC7 của báo cáo f2 |
| `reui/alert` warning (thẻ không có) | dùng | trạng thái lỗi tại chỗ như các trang Ops |
| `ui/button` variant link (Mở thẻ ghép) | dùng | khuôn ĐC7 |
| `ui/empty` (nhịp trống) | dùng | luật trống có hành động |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ khuôn của trang (UI1 «Table-backed management» + Sheet, `routes.md`); OD1 chỉ thêm một Frame số phía trên và
một liên kết sâu — không cần tra mẫu, rail hạng mục (khuôn khác) là OD2.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | vai Vận hành (Mạnh, đội vận hành) |
| Việc chính | quyết thẻ duyệt và biết mỗi hạng mục đang tốn bao nhiêu giây/thẻ |
| Tần suất | mỗi ngày nhiều lần |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính · điện thoại |
<!-- UX-SPEC-TEMPLATE>>> -->

## 5. Kiểm

Một tệp test mới `app/tests/ops-duyet-nhip.test.tsx` (ca `OD1-AC-n`, lược đồ tạm như `the-duyet-du-can-cu.test.tsx`, route
thật, component thật trong jsdom); mỗi phép đo có chiều đỏ ghim thông điệp. Một lượt ui-check trên dev server :3463 nối DB
thử `oneinvest_od1` (chép bằng `db/db-thu.sh`), chụp theo phần tử, không chụp thân thẻ hay cột liên hệ.
