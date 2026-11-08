# Thiết kế — OD2 ops-duyet-hop-hang-muc

Hàng lộ trình **OD2** (`docs/plan/lo-trinh.json`): «Người duyệt chọn một hạng mục và quyết liền từng thẻ bằng phím, quyết
xong tự sang thẻ kế, hoàn tác được trong 5 giây, xem lại quyết định gần đây». Gộp ĐC3 (đầu trang + hộp hạng mục), ĐC4
(chế độ duyệt + phím), ĐC5 (hoàn tác 5 giây + quyết định gần đây) và câu Q4 (lý do) của `docs/research/soat-ops-0711.md`
§(f), Mạnh duyệt 07/11 (f4: «Đồng ý, tôi đã đăng nhập lại Reui pro»). Dựng trên OD1 (#372): Hạng mục duyệt
(`reviewCategory`), đồng hồ thẻ (`elapsed_ms`), bảng Nhịp duyệt.

## Vì sao

Hàng duyệt có hơn 600 thẻ chờ trong một bảng lọc bằng hai ô thả xuống. Mỗi thẻ: bấm hàng → sheet mở → gõ lý do → bấm →
đóng sheet → tìm hàng kế. Báo cáo §e0 đo phần lớn thời gian nằm ở các bước quanh thẻ, không ở việc đọc thẻ. OD1 vừa
có số trước (giây/thẻ theo hạng mục); OD2 rút các bước quanh thẻ, rồi OD1 đo lại.

## Phạm vi

1. **Đầu trang** (ĐC3): `PageHeader` với ba số: Chờ duyệt · Quá 3 ngày · Đã quyết hôm nay (giờ Việt Nam, mọi người).
2. **Hộp hạng mục** (ĐC3, khuôn `@reui/solution-agents-9`): Frame «Danh sách thẻ» thêm cột trái liệt các Hạng mục duyệt
   có thẻ (chờ hay đã quyết — mục hết thẻ chờ vẫn lọc được thẻ đã quyết), mỗi mục: nhãn, số thẻ chờ, dòng «cũ nhất n ngày ·
   trung vị x giây» (hết thẻ chờ: «hết thẻ chờ · trung vị x») (trung vị giây ở thẻ 7 ngày của
   OD1). Mục «Tất cả» đứng đầu. Bấm mục → lọc bảng theo hạng mục, URL `?category=<mã>`. Màn hẹp: cột trái thành dải
   cuộn ngang trên bảng. Bỏ ô lọc «Loại thẻ» (hạng mục thay nó); giữ ô «Trạng thái».
3. **Chế độ duyệt** (ĐC4): nút «Duyệt liền» trên hộp (hay bấm một thẻ chờ) mở sheet ở thẻ chờ đầu tiên của hạng mục
   đang chọn. Đầu sheet có thanh «12/133 · <hạng mục>», nút Trước/Sau và nút «Phím tắt». Quyết xong, sheet **không
   đóng**: thẻ kế cùng hạng mục hiện ngay (thẻ quyết rồi rời danh sách đi). Hết thẻ: thân sheet là Empty «Hết thẻ chờ
   ở hạng mục này» + nút sang hạng mục kế còn thẻ. Thứ tự thẻ: Hỏi-1. Ô lọc «Loại thẻ» bỏ: hộp thay nó (thẻ Người ở mục
   «Gộp Người»).
4. **Phím** (ĐC4, bảng phím khuôn `@reui/c-dialog-9`): `J`/`↓` thẻ sau, `K`/`↑` thẻ trước, `1`–`4` theo thứ tự nút
   đáp án ở chân thẻ (số `Kbd` đứng cạnh nút, nút mang `aria-keyshortcuts` và giữ nguyên chữ đáp án; Hỏi-2: một phím quyết luôn, hay chọn rồi `⌘↵`/`Ctrl↵` gửi), `R` vào ô lý do, `?` mở bảng phím,
   `Esc` đóng sheet (mặc định của Sheet). Phím chữ và số chỉ chạy khi tiêu điểm không ở ô nhập; trong ô lý do chỉ
   `⌘↵`/`Ctrl↵` và `Esc` chạy. Không trùng `⌘K`/`⌘F` của vỏ Ops. Mỗi nút đáp án mang `Kbd` số của nó.
5. **Hoàn tác 5 giây** (ĐC5, Q7): bấm đáp án → lệnh gửi giữ ở trình duyệt 5 giây; toast `sonner` «Đã ghi #id · <nhãn
   đáp án>» có nút «Hoàn tác»; sheet sang thẻ kế ngay. Hoàn tác trong 5 giây → không gửi gì, sheet quay về thẻ đó, lý do
   đã gõ còn nguyên. Hết 5 giây → gửi route decide như OD1 (`elapsed_ms` đo tới lúc **bấm**, không tính 5 giây chờ).
   Gửi lỗi → toast lỗi kèm nút «Mở thẻ», thẻ trở lại danh sách chờ. «Hoàn tác» bấm sau khi lệnh đã gửi (toast còn hiện vì
   chuột đè lên) không đưa thẻ trở lại. Rời trang (đóng tab: `pagehide`; chuyển route trong app: hàng duyệt bị gỡ) khi còn
   lệnh chờ → gửi ngay bằng `fetch(…, { keepalive: true })`, không bỏ quyết định nào.
6. **Quyết định gần đây** (ĐC5, khuôn `recent-decisions` của `solution-agents-5` đã cài): Frame bên dưới danh sách, 20
   lượt `review.decide` gần nhất trong 7 ngày (Hỏi-3: của chính người duyệt, hay mọi người): #id · tiêu đề thẻ · nhãn
   đáp án · lý do · giờ; bấm #id → `?card=<id>` mở thẻ (thẻ đã quyết, xem lại). Đảo quyết định sau 5 giây là lệnh đảo
   ADR-0015 — ngoài phạm vi.
7. **Lý do** (Q4): ô «Lý do» thôi bắt buộc. Để trống thì trình duyệt gửi nhãn đáp án làm lý do (vd «Khác căn»), nên
   route decide và luật «lý do ghi cùng giao dịch» (PL3) giữ nguyên, `decision_note` không bao giờ rỗng. Riêng «Bỏ» ở
   thẻ Bổ sung tin vẫn bắt gõ lý do: Q4 giữ lý do gõ tay cho việc bác một đề xuất ghi đè, mà thẻ chưa phân được ghi đè
   với điền ô trống (OD4).

Không đổi route decide (`app/src/app/api/v1/ops/review/**` là đường T3 của kho), không migration, không API mới:
quyết định gần đây đọc `ops_audit` ở lớp nạp trang như bảng Nhịp duyệt.

## Ngoài phạm vi

- Đáp án theo câu hỏi cho từng hạng mục, chip lý do soạn sẵn (`Q`/`W`/`E`) — OD3.
- Tách Bổ sung tin thành điền/ghi đè/trùng — OD4; bắt lý do chỉ cho ghi đè chờ OD4.
- Đảo quyết định sau 5 giây (lệnh đảo ADR-0015, trang `/ops/audit` theo `solution-dev-ops-2`).
- Tải trước ảnh thẻ kế: dữ liệu mọi thẻ đã nạp sẵn với trang; ảnh tải trước chỉ làm khi số giây cho thấy chờ ảnh.
- Bỏ Frame «Nhịp duyệt 7 ngày» của OD1: hồ sơ OD1 đã ký trên Frame đó; hộp hạng mục chỉ mượn số trung vị.
- Duyệt hàng loạt (GD10 đã loại).

## Thiết kế kỹ thuật

- **Trạng thái chế độ duyệt** ở client trong `ReviewQueue`: `category` (từ `?category=`), `openId`, hàng chờ gửi
  `pendingSends: Map<id, {timer, body}>`. Danh sách thẻ chờ của hạng mục = thẻ `pending` khớp hạng mục **trừ** thẻ đang
  trong hàng chờ gửi. «Thẻ kế» = phần tử sau thẻ vừa quyết trong danh sách đó tính lúc bấm.
- **Hàng chờ gửi** tách thành hook `useHangGui` (`components/ops/review/use-hang-gui.ts`): `xep(id, body, nhan)` đặt
  `setTimeout(5000)`; `huy(id)`; `guiNgay()` cho `pagehide`. `useDecide` của OD1 thôi tự `fetch`: nó gọi `xep` khi có hàng
  chờ gửi (chế độ duyệt), giữ đường gửi thẳng khi thẻ dựng đứng riêng (test cũ, nơi khác). Sau khi gửi xong →
  `router.refresh()`.
- **Phím** trong hook `usePhimDuyet` (`components/ops/review/use-phim-duyet.ts`): một `keydown` ở `window` khi sheet mở;
  bỏ qua khi `event.target` là `input`, `textarea`, `select` hay `[contenteditable]` (trừ `⌘↵`/`Ctrl↵`); bỏ qua khi có
  `metaKey`/`ctrlKey`/`altKey` với phím chữ. Nút đáp án đăng ký qua thuộc tính `data-review-answer="<n>"` theo thứ tự
  hiện ở chân thẻ; phím số bấm đúng nút đó (`.click()`), nên luật «nút tắt khi chưa chọn bên» của thẻ xung đột giữ nguyên.
- **Đồng hồ thẻ** (OD1): `ReviewCard` dựng theo `key={item.id}`, nên sang thẻ kế trong sheet là đặt lại `t0`. Hoàn tác
  quay về thẻ cũ cũng đặt lại `t0` (giây ở thẻ của lượt đó đo từ lúc quay về) — ghi trong Notes.
- **Ba số đầu trang** tính từ `items` đã nạp (chờ, chờ có `created_at` cũ hơn 3 ngày) cộng một câu đếm `review_queue`
  `decided_at` trong ngày giờ Việt Nam (`lib/ops/review-dau-trang.ts`).
- **Hộp hạng mục**: `hopHangMuc(items, pace)` thuần (`lib/ops/review-hop-hang-muc.ts`): mỗi hạng mục có thẻ chờ → `{ ma,
  nhan, cho, cuNhatNgay, trungViGiay }`, xếp theo thứ tự `REVIEW_CATEGORIES`. Thành phần `review/review-hop-hang-muc.tsx`
  chuyển thể cột trái của `solution-agents-9` (bỏ thanh độ tự tin, bỏ ghim/quên — Q9).
- **Quyết định gần đây**: `loadRecentDecisions(actor | null, q)` (`lib/ops/review-gan-day.ts`) đọc `ops_audit`
  `review.decide` 7 ngày, nối `review_queue` lấy tiêu đề; chịu bảng vắng như `loadReviewPace`. Thành phần
  `review/review-gan-day.tsx` chuyển thể `recent-decisions` (Card → Frame theo họ khung trang; timeline giữ nguyên).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/review` → bấm hạng mục «Bổ sung tin» ở hộp trái → «Duyệt liền» → sheet mở thẻ đầu, thanh «1/218» →
  đọc, bấm `2` (hay nút «Đã bỏ») → toast «Đã ghi #… · Đã bỏ» + «Hoàn tác», thẻ 2 hiện ngay → … → hết thẻ: «Hết thẻ chờ
  ở hạng mục này» + «Sang Đối chiếu ý định» (điểm ra: hạng mục kế, hay đóng sheet về danh sách).
- Biên: hạng mục chỉ có một thẻ; hàng duyệt rỗng (Empty «Hàng duyệt trống» như cũ); `?category=` lạ (bỏ qua, về «Tất
  cả»); thẻ đang mở bị quyết ở tab khác (route 409 → toast lỗi, thẻ rời danh sách); vai Người xem (không có hộp, không
  sheet, như OD1); cloud (LocalOnlyAlert như cũ).
- Lỗi & quay lại: bấm nhầm → «Hoàn tác» trong 5 giây, quay về thẻ; quá 5 giây → mở thẻ ở «Quyết định gần đây» để xem
  lại (đảo là việc sau); gửi lỗi → toast lỗi + «Mở thẻ».

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Hàng duyệt (`/ops/review`) | Chọn hạng mục để duyệt liền | Nav Ops nhóm Xử lý, liên kết `?card=` / sheet chế độ duyệt |
| Sheet chế độ duyệt | Quyết từng thẻ của một hạng mục, nối tiếp | Hộp hạng mục, bấm thẻ / đóng về danh sách |
| Bảng phím | Nhắc phím của chế độ duyệt | Phím `?`, nút «Phím tắt» / `Esc` |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-hang-duyet-loading | Hàng duyệt | Skeleton đầu trang + hộp + bảng (giữ tiêu đề) | Chờ |
| ST-hang-duyet-empty | Hàng duyệt | Empty «Hàng duyệt trống» + «Xem thu thập» | Sang thu thập |
| ST-hang-duyet-error | Hàng duyệt | RegionError «hàng duyệt» + Thử lại | Thử lại |
| ST-hop-chon | Hàng duyệt | Mục đang chọn tô nền, bảng lọc theo mục, URL `?category=` | «Duyệt liền» |
| ST-hop-khong-cho | Hàng duyệt | Hộp chỉ còn «Tất cả 0»; bảng mặc định «Không còn thẻ chờ duyệt» + «Xem thẻ đã quyết» | Xem thẻ đã quyết |
| ST-sheet-the | Sheet | Thanh «n/N · hạng mục», Trước/Sau, Phím tắt; thân thẻ; chân nút có `Kbd` số | Bấm/phím đáp án |
| ST-sheet-cho-gui | Sheet + toast | Thẻ kế đã hiện; toast «Đã ghi #id · nhãn» + «Hoàn tác» đếm 5 giây | Hoàn tác hoặc tiếp |
| ST-sheet-het | Sheet | Empty «Hết thẻ chờ ở hạng mục này» + «Sang <hạng mục kế>» (không còn mục → «Đóng») | Sang mục kế / đóng |
| ST-sheet-loi-gui | Toast | «Không ghi được #id: <lỗi>» + «Mở thẻ» | Mở lại thẻ |
| ST-gan-day-empty | Quyết định gần đây | Empty «Chưa có quyết định nào trong 7 ngày» + «Duyệt liền» | Bắt đầu duyệt |
| ST-bang-phim | Dialog | Hai cột phím (Đi lại · Quyết) | `Esc` |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Phím chữ/số không chạy khi tiêu điểm ở ô nhập; `⌘↵`/`Ctrl↵` chạy cả trong ô lý do; `Esc` trong ô lý do bỏ tiêu điểm
  trước, lần hai mới đóng sheet (mặc định Sheet).
- Ô lý do tối đa 1.000 ký tự như PL3; trống → gửi nhãn đáp án; «Bỏ» ở Bổ sung tin vẫn đòi gõ.
- Toast hoàn tác 5 giây (`duration: 5000`), một toast mỗi lệnh; hai lệnh liền → hai toast, hoàn tác riêng từng cái.
- Màn ≥ `md`: hộp hạng mục là cột trái 14–16rem; dưới `md`: dải cuộn ngang trên bảng. Sheet toàn bề ngang dưới `sm`.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `@reui/solution-agents-9` (cột trái) | ghép | Khuôn hộp hạng mục Mạnh duyệt ở f4; chỉ lấy rail, lưới giữ `data-grid` hiện có |
| `@reui/c-dialog-9` | dùng | Bảng phím Mạnh duyệt ở f4 (Dialog nhỏ, không Sheet chồng) |
| `recent-decisions` (`solution-agents-5`, đã cài) | ghép | Card → Frame theo họ khung; dữ liệu thật từ `ops_audit` |
| `PageHeader` | dùng | Bắt buộc theo `routes.md`, ba số |
| `ui/kbd` | dùng | Gợi ý phím trên nút; tiến độ là chữ «n/N», không thanh tiến độ |
| `sonner` | dùng | Toast hoàn tác (khuôn agents-5, dialog-16) |
| Hook phím, hàng chờ gửi | tạo (logic) | ReUI không có khối phím tắt hay gửi lùi (f2 đã tra) |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: báo cáo §f2/f4 đã tra Mobbin (Superhuman, Notion Mail, Plain, Front): người chọn loại việc ở cột trái rồi làm
liền từng mục ở khung chi tiết, đi bằng `J`/`K`, `?` mở bảng phím; giữ sheet hiện có làm khung chi tiết.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người duyệt vai Vận hành ở máy thu |
| Việc chính | Quyết liền các thẻ cùng một câu hỏi |
| Tần suất | mỗi ngày nhiều lần |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->

## Câu hỏi cho Mạnh (Cổng Phạm vi)

- **Hỏi-1 — thứ tự thẻ trong chế độ duyệt.** Khuyên: cũ nhất trước (thẻ chờ lâu nhất được quyết trước; hộp ghi «cũ
  nhất n ngày» nên thứ tự khớp số đó). Lối khác: mới nhất trước như bảng hiện nay — thẻ cũ có thể nằm mãi cuối hàng.
- **Hỏi-2 — một phím hay hai phím.** Khuyên: một phím quyết luôn (`1`–`4` gửi ngay vào hàng chờ 5 giây; hoàn tác bù
  cho bấm nhầm — đúng lý do Q7). Lối khác: `1`–`4` chỉ chọn, `⌘↵` mới gửi (bảng e9) — chắc tay hơn, thêm một phím mỗi
  thẻ. Hai nguồn của báo cáo nói khác nhau (e9 «1–4 chọn, ⌘↵ gửi»; Gói G và Q7 «một phím») nên cần Mạnh chốt.
- **Hỏi-3 — «Quyết định gần đây» của ai.** Khuyên: của chính người đang duyệt (đúng việc «xem lại mình vừa quyết gì»,
  không lộ ai quyết gì cho người khác). Lối khác: mọi người, kèm tên người duyệt — hợp khi nhiều người cùng duyệt.

## Đường đo

- Trung vị giây ở thẻ và giữa hai lượt theo hạng mục: bảng Nhịp duyệt của OD1 (`loadReviewPace`, `ops_audit.detail`),
  so 7 ngày trước khi OD2 gộp với 7 ngày sau. OD2 không thêm thước; AC-7 bảo đảm mọi lượt quyết trong chế độ duyệt vẫn
  ghi `seconds` và `since_prev_seconds`.
- «0 lần đóng sheet giữa hai thẻ»: tính chất của chế độ duyệt, đo bằng test (AC-3), không bằng số chạy thật.
