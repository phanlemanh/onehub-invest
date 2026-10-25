# Khoá an toàn và Máy móc trên máy chủ đọc số máy thu đẩy lên (ON23 · `lockdown-cloud-theo-facts`) — design

Hàng ON23 của `docs/plan/lo-trinh.json` (dãy P2, đợt `dot0-cam-mau`, sau ON3 `o-kpi-chi-do-local`, đứng trên ON22 + ON2).
Phủ OPS-3 (cao, an toàn Zalo; gốc G1 + G2). Ngưỡng (`bat_khi`): «Máy chủ không có số khoá an toàn: 8/8 lớp «Chỉ kiểm ở máy
thu», 0 lớp xanh; có số: Khoá an toàn và Máy móc cùng một trạng thái cho Kev gate và collector API».

Từ vựng theo `CONTEXT.md` (ON12): **máy thu** = máy local, **máy chủ** = bản cổng trên cloud, **Khoá an toàn** = lockdown.

## Hiện trạng (sau ON3, trên máy chủ)

- `/ops/collections` trên máy chủ chỉ dựng hàng ô số, lưới sức khoẻ nguồn, lưới Máy móc (khi có bản tin); lưới «Khoá an
  toàn & hạ tầng thu» không dựng — nằm trong Alert «Phần còn lại của trang chưa có số trên máy chủ» (ON3 lượt 3, sổ d-16).
- Ô «Khoá an toàn» trên máy chủ luôn «—» + badge «Chưa kiểm được trên máy chủ» (ON3 Hỏi-1 = A «tới khi ON23 đọc khối
  lockdown»), dù bản tin đã mang khối `lockdown` từ ON22.
- Lưới Máy móc trên máy chủ đọc khoá `jobs` cũ của bản tin (`scheduler()` trong `push-ops-facts.mjs`): Kev gate và
  collector API dò `http://127.0.0.1:8009/` và `:9210/`, còn khối `lockdown` dò `/v1/models` và `/agent-report` ở một lần
  khác — hai bảng có thể nói hai trạng thái cho cùng một cổng (đúng lỗi «hai bảng cùng trang mâu thuẫn» của OPS-3).
- Khối `lockdown` (`scripts/lib/ops-local.mjs` `readLockdown`, ON2 đã sửa «không kiểm được ≠ Ổn»): 8 lớp `{layer, desc,
  ok: true|false|null}`, `lastWatchdogAt`, `agentTurnsToday`; khối lỗi là `{measured_at, error}`.

## Cách làm

1. **Nguồn số** — `getCloudOpsView()` (`app/src/lib/ops-cloud.ts`) thêm `lockdown: {layers, lastWatchdogAt,
   agentTurnsToday, stale} | null` từ `blocks.lockdown`. Trạng thái tươi/cũ lấy theo `state` CỦA KHỐI (ADR-0014 §Ngưỡng
   trễ: theo `measured_at` của khối). Khối vắng, khối lỗi, hay hàng sai khuôn (thiếu `layer`/`desc`, `ok` ngoài
   true/false/null) → `null`.
2. **Lưới «Khoá an toàn & hạ tầng thu» dựng lại trên máy chủ** (bỏ «lớp khoá an toàn» khỏi danh sách vùng gom về Alert):
   - `lockdown` null → 8 hàng đúng 8 lớp (danh sách lớp dùng chung với `getLockdownStatus`), mỗi hàng trạng thái mới
     «Chỉ kiểm ở máy thu» — màu theo Hỏi-3 (máy khuyên `warning-light`, khớp ô ON3), mô tả lưới «Chưa có số từ máy thu».
     Riêng lưới này, `bat_khi` ON23 (8/8 hàng ghi «Chỉ kiểm ở máy thu») thắng luật «chữ chỉ-local đúng một lần mỗi trang»
     của ADR-0014 — luật ấy nói về thông báo đầu trang, không về nhãn từng hàng; khối lỗi theo Hỏi-4;
   - có khối → hàng đúng khối: `true` «Ổn», `false` «Hỏng», `null` «Chưa kiểm được»; mô tả «Bộ canh chạy cuối: …» như máy thu;
   - khối cũ → cùng hàng nhưng «Ổn» không tô xanh (`outline`).
3. **Ô «Khoá an toàn» trên máy chủ**: có khối → như máy thu (x/8 lớp Ổn, badge «N lượt tự trả lời» khi > 0, chân ô theo
   `agentTurnsToday`, thanh phân đoạn); khối cũ → số mờ, thanh không màu đạt; không khối → giữ «—» + «Chưa kiểm được trên
   máy chủ» (ON3 Hỏi-1 = A).
4. **Máy móc ↔ Khoá an toàn một trạng thái** (Hỏi-1 = A): trên máy chủ, hai hàng Kev gate (`kev`) và collector API
   (`collector-api`) của lưới Máy móc lấy trạng thái từ hai lớp «Hạ tầng» tương ứng của khối `lockdown` — một lần đo:
   `true` → «Sống», `false` → «Không phản hồi», `null` hay không khối → trạng thái mới «Chưa kiểm được». Khối cũ → giữ nhãn
   nhưng «Sống» không tô xanh (cùng cờ số cũ với lưới Khoá an toàn). Mỗi hàng đọc đúng lớp của cổng mình (Kev ← «Cổng Kev
   :8009», collector ← «Cổng nhận tin :9210»). Các hàng khác giữ khoá `jobs` (cùng hàng với trang ở máy thu).
5. **Máy thu không đổi**: không bản tin, không chữ «Chỉ kiểm ở máy thu», `getLockdownStatus` đo trực tiếp.

## Không làm

- Lưới Máy móc chuyển hẳn sang khối `jobs` (launchd) — hợp đồng mới đã mở ở ON3 (Ngoài-1/4), nếu Hỏi-1 = A.
- «Cần chú ý», luồng 7 ngày, ống/nhóm S03, xoay vòng trên máy chủ — ON4/ON5 (vẫn trong Alert gom của ON3).
- Sửa cách máy thu dò cổng (`scheduler()` và `readLockdown` dò hai URL khác nhau) — trên máy chủ đã một nguồn; ở máy thu
  là việc riêng (`push-ops-facts.mjs`, t3_paths).
- Cách tính lớp ở máy thu (ON2 đã ký), lọc dòng log (OPS-19, ON2).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: người trực mở `/ops/collections` trên máy chủ → ô «Khoá an toàn» x/8 + lưới 8 lớp từ bản tin, dòng «Số đo lúc
  … từ máy thu» → lớp «Hỏng» thì bấm «Xem các lớp» (`#lockdown`), Kev gate / collector API cùng trạng thái ở lưới Máy móc.
- Biên: máy chủ chưa có khối khoá an toàn (bản tin chưa có, khối lỗi) → 8 lớp «Chỉ kiểm ở máy thu», không lớp nào xanh.
- Lỗi & quay lại: máy thu im > 45′ → Alert vàng của ON3; lớp «Ổn» mất màu xanh → người trực kiểm ở máy thu.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| `/ops/collections` Thu thập (máy chủ) | khoá an toàn Zalo còn đứng không | nav Ops / `#lockdown`, cổng Ops trên máy thu |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-lockdown-none | `/ops/collections` | ô «Khoá an toàn» «—» + «Chưa kiểm được trên máy chủ»; lưới 8 hàng «Chỉ kiểm ở máy thu», 0 badge xanh | mở cổng Ops trên máy thu |
| ST-lockdown-fresh | `/ops/collections` | ô x/8 + badge lượt tự trả lời (nếu có); lưới 8 lớp Ổn/Hỏng/Chưa kiểm được đúng khối; Kev gate, collector API ở Máy móc cùng trạng thái | bấm «Xem các lớp» khi có «Hỏng» |
| ST-lockdown-stale | `/ops/collections` | Alert vàng 45′ (ON3), số mờ, «Ổn» viền xám, thanh không màu đạt; Kev gate, collector API ở Máy móc giữ nhãn, «Sống» không tô xanh | kiểm tác vụ đồng bộ ở máy thu |
| ST-lockdown-mixed | `/ops/collections` | khối có cả `true`, `false`, `null`: ba nhãn khác nhau, số trên từng tab = số lớp mỗi giá trị (proto `--mode mixed`) | đọc lớp «Hỏng» trước |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ngưỡng cũ 45′ theo `state` của khối (`FACTS_STALE_MS`, ON22) — không hằng mới; mốc đo theo bộ định dạng giờ VN (ON8).
- Ở 390px: lưới khoá an toàn cuộn trong khung lưới có sẵn, không thanh cuộn ngang ở trang.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `LockdownGrid` | mở rộng | thêm trạng thái «Chỉ kiểm ở máy thu» và cờ số cũ |
| `JobsGrid` | mở rộng | thêm trạng thái «Chưa kiểm được» cho Kev gate / collector API |
| `CollectionsTiles` (ô Khoá an toàn) | mở rộng | nhánh máy chủ có khối dùng lại nhánh máy thu |
| `Badge` (`@/components/reui/badge`) | dùng | `outline` cho trạng thái không kiểm, không màu trạng thái |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: luồng hiển nhiên — `/ops/collections` đã là Dashboard grid (`onehub-ui/routes.md`); vòng dựng lại một lưới có
sẵn trên máy chủ và đổi nguồn số, không đổi cấu trúc.
<!-- UX-SPEC-TEMPLATE>>> -->

## Hỏi-1 (chỉ người có — nghĩa của lưới Máy móc trên máy chủ)

Lưới Máy móc trên máy chủ đọc gì? `bat_khi` đòi Kev gate và collector API cùng trạng thái với Khoá an toàn.
- **A (máy khuyên)**: giữ hàng của máy thu (khoá `jobs` cũ — lịch chạy, dòng nhật ký cuối, cùng hàng với trang ở máy thu);
  riêng Kev gate và collector API lấy trạng thái từ khối `lockdown` — cùng một lần đo nên cùng trạng thái bằng cấu tạo.
  Chuyển hẳn sang khối `jobs` launchd để ở hợp đồng mới (ON3 Ngoài-1/4).
- B: chuyển cả lưới sang khối `jobs` (launchd: chạy hay không, mã thoát cuối, giờ nhật ký) trong vòng này — giá: hàng khác
  hàng ở máy thu (mất lịch chạy, dòng nhật ký cuối), hợp đồng thêm ~3 tiêu chí; Kev gate và collector API vẫn phải lấy từ
  khối `lockdown` mới cùng trạng thái.

## Hỏi-2 (chỉ người có — hạng rủi ro)

Lộ trình ghi ON23 hạng T3 (lúc cắt lượt dự kiến chạm `pipeline/push-ops-facts.mjs`). Thiết kế này chỉ đổi phía đọc trên
app — không tệp nào khớp `t3_paths`, máy suy T2.
- **A (máy khuyên)**: giữ T3 — tín hiệu an toàn Zalo sai trên máy chủ có thể che sự cố máy tự trả lời thật (OPS-3 cao);
  thêm một chốt duyệt kế hoạch (Gate 1.5) và mọi mục chấm bằng mắt cần anh xác nhận.
- B: T2 theo đường dẫn — giá: không có Gate 1.5; mục chấm bằng mắt chỉ cần anh khi hội đồng chưa chắc.

## Hỏi-3 (chỉ người có — màu của «Chỉ kiểm ở máy thu»)

Tám hàng «Chỉ kiểm ở máy thu» khi máy chủ không có số mang màu gì? Ô Khoá an toàn cùng trạng thái đang là badge vàng
`warning-light` «Chưa kiểm được trên máy chủ» (ON3 Hỏi-1 = A).
- **A (máy khuyên)**: `warning-light` — khớp ô ON3, một tín hiệu cho một trạng thái; vàng nhắc người trực kiểm ở máy thu.
- B: `outline` xám — giá: cùng trạng thái hai màu trên một trang; xám dễ đọc là trung tính.

Lớp `ok: null` trong khối có số giữ «Chưa kiểm được» `outline` như máy thu (ON2 đã ký) — không thuộc câu hỏi này.

## Hỏi-4 (chỉ người có — khối lockdown lỗi)

Bên ghi báo khối `lockdown` lỗi (máy thu cũng không đọc được khoá an toàn). Máy chủ hiện gì?
- **A (máy khuyên)**: gộp với «không có số» — 8/8 «Chỉ kiểm ở máy thu», ô «—»; một luật cho mọi lúc máy chủ không có số
  dùng được, khớp ON3 (khối lỗi → «—»).
- B: nhãn riêng «Máy thu không đọc được» cho cả 8 hàng — giá: thêm một trạng thái thứ ba; người trực biết ngay máy thu cũng
  mù, nhưng phải học thêm một nhãn.
