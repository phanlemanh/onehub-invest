# che-do-thu-tren-ops — thiết kế (C7, vết dầu loang)

Căn cứ: `docs/plan/vet-dau-loang-thu-thap-2510.md` §1.4, §3.4, §4 C7, §6 Hỏi-3 (Mạnh trả lời 25/10 «theo khuyến nghị»).
Hồ sơ: `_acceptance/che-do-thu-tren-ops/`.

## Mục tiêu

Mỗi điểm thu (một dòng `source_groups`) có một **chế độ thu**: Chờ (`cho`), Bùng (`bung`), Duy trì (`duy_tri`). Trên
`/ops/sources`, admin thấy chế độ và hạn bùng của từng điểm và đổi được chế độ. Bật Bùng bắt buộc có hạn, tối đa 14 đêm. Máy
tự hạ một đợt bùng quá hạn về Duy trì. Mọi lần đổi chế độ, dù người hay máy, ghi đúng một dòng `ops_audit` trong cùng giao
dịch với lần ghi `params`.

Vòng này không làm collector đọc chế độ (V1 của ZCode) và không thêm dòng S01.

## Dữ liệu (không migration)

Các khoá mới trong `source_groups.params` (jsonb). Khoá có sẵn (`region_v2`, `cityCode`, ngân sách) giữ nguyên:

| khoá | giá trị | luật |
|---|---|---|
| `mode` | `cho` · `bung` · `duy_tri` | vắng = «Chưa đặt» (dòng cũ) |
| `burst_until` | `YYYY-MM-DD` (ngày VN) | có **khi và chỉ khi** `mode = bung` |
| `mode_since` | `YYYY-MM-DD` (ngày VN) | ngày vào chế độ hiện tại (chỉ số ⑦); gia hạn bùng không đổi nó |

Hạn bùng là ngày cuối còn bùng, tính cả hai đầu. Bật hôm nay H thì hạn hợp lệ là H … H+13: tối đa 14 đêm, khớp «hạn 14 đêm»
của Hỏi-1. «Hôm nay» lấy theo giờ `Asia/Ho_Chi_Minh` ở cả hai phía (TS: `Intl`; SQL: `AT TIME ZONE`).

## Người đổi — `datCheDo` (app/src/lib/che-do-thu.ts)

- Lối gọi: `POST /api/v1/ops/source-groups` `{ action: "set-mode", id, mode, burstUntil? }`. Route giữ cổng chung
  (Bearer hoặc phiên ops), rồi trao cho `datCheDo(body, getSessionUser)` (tham số thứ ba `{ db, now }` cho phép đo). Action
  `add` chỉ nhận `regionV2`/`cityCode` như cũ — không có lối nào khác ghi `mode`/`burst_until`. Hàm này **chỉ nhận phiên admin**: Bearer máy
  (không phiên) và phiên `ops` đều trả 403. Lý do: «tăng tải thì người duyệt» — một token máy không được bật Bùng.
- Kiểm `kiemCheDo(mode, burstUntil, homNay)`, hàm thuần, trước khi đụng DB. Trả 400 khi chế độ lạ, khi Bùng thiếu hạn, khi
  hạn sai khuôn hoặc không phải ngày có thật, khi hạn đã qua, hoặc khi hạn quá H+13. Thông điệp nêu hạn tối đa.
- Ghi trong một giao dịch: `SELECT … FOR UPDATE` theo `id` (vắng thì 404). Cùng chế độ và cùng hạn thì không ghi gì, trả
  `unchanged`. Khác thì `UPDATE params`: gỡ `burst_until` khi rời Bùng, đặt `mode_since` khi đổi chế độ. Kèm `INSERT
  ops_audit` (`actor = user:<id>`, `action = source-group:mode`, `detail = {id, source_code, from, to, burst_until,
  burst_until_cu}`) rồi `COMMIT`. Detail không mang `group_key`/`name` (tầng A: URL nhóm S05).
- `auditOpsWrite` (ghi bất đồng bộ, lỗi bỏ qua) không dùng ở đây: một lần bật Bùng là một lần Mạnh duyệt, dấu vết phải chắc
  chắn có.

## Máy hạ — `pipeline/ha-bung-het-han.mjs`

- `haBungHetHan(client, { now })`: một giao dịch. Mọi dòng `mode = bung` mà `burst_until` trước hôm nay VN (`het-han`),
  hoặc thiếu hạn hay hạn hỏng (`thieu-han` — chặn «bùng mãi»), chuyển sang `duy_tri`, `mode_since` = hôm nay, gỡ hạn. Mỗi
  dòng ghi một `ops_audit` (`actor = machine:ha-bung-het-han`, `action = source-group:mode-auto`, `detail = {id,
  source_code, from: "bung", to: "duy_tri", ly_do, burst_until}`). Chạy lại thì không đổi gì.
- `haVeDuyTri(client, id, lyDo, { now })`: hạ một điểm đang Bùng với lý do cho trước (đạt kho, bão hoà, vấp rào). Đây là
  cửa cho collector V1 của ZCode. Điểm không ở Bùng thì không làm gì, trả `false`.
- CLI in mỗi lần hạ một dòng theo mã: `hạ S06#7 bung→duy_tri (het-han, hạn 2026-11-07)`. Không in tên hay khoá nhóm.
  Thiếu bảng `source_groups` thì in «bỏ qua» và thoát 0.
- Lịch: thêm bước đầu `job_run cloud-sync ha-bung-het-han` vào `scripts/cloud-sync.sh`, chạy mỗi 15′ trên máy thu. Bước hỏng
  không chặn hai bước sau (luật AU13). Dựng một tác vụ launchd riêng phải qua triển khai ở checkout chính; cloud-sync đã chạy
  sẵn trên máy thu, nên lắp vào đó gọn hơn.

## Giao diện — `/ops/sources`

- `sources-content.tsx` đọc thêm `params->>'mode'`, `'burst_until'`, `'mode_since'` và truyền `homNay = homNayVN(new Date())`
  (máy chủ, giờ VN) xuống `SourceGroups` → hộp thoại, để min/max ô ngày không theo múi giờ trình duyệt.
- Bảng nhóm (`source-groups.tsx`) thêm cột «Chế độ» dạng Badge: Bùng `warning-light` «Bùng · đến dd/mm», Duy trì
  `success-light`, Chờ `outline`, chưa đặt «Chưa đặt» chữ mờ. Cột thao tác thêm nút «Đổi chế độ thu».
- Hộp thoại mới `mode-dialog.tsx` (Dialog): chọn chế độ bằng ToggleGroup ba nút (ba lựa chọn thấy cùng lúc); khi chọn Bùng thì hiện ô ngày «Hạn bùng» với
  `min = hôm nay`, `max = hôm nay + 13`, kèm câu «tối đa 14 đêm, máy tự về Duy trì khi hết hạn». Nút «Lưu» khoá khi chọn
  Bùng mà chưa có hạn. Lỗi máy chủ hiện ngay trong hộp. Lưu xong thì cập nhật dòng và báo toast.
- Nhãn lấy từ `CONTEXT.md`: thêm thuật ngữ «Chế độ thu» và «Hạn bùng».

## Phép đo

- `app/tests/che-do-thu.test.tsx` (ca `CD-AC-n`) chạy trên lược đồ tạm: `source_groups` và `ops_audit` chép khuôn LIKE từ
  public, dòng viết trước có id tường minh. Ca này gọi `datCheDo` với người giả (null / ops / admin), gọi
  `haBungHetHan`/`haVeDuyTri` thật, và vẽ `SourceGroups` trong jsdom.
- `scripts/job-exit.test.mjs` (AU13) đổi chuỗi bước cloud-sync thành ba bước. Bản đột biến bỏ `job_run` ở bước mới phải bị
  bắt.
- Chụp `/ops/sources` có phiên ops thử (`scripts/ui-capture.sh`, che tầng A) ở sáng, tối và 390.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/sources` → lưới nhóm thu của một nguồn → nút «Đổi chế độ thu» ở hàng → hộp thoại: chọn Bùng, nhập hạn →
  «Lưu» → hộp đóng, Badge hàng đổi thành «Bùng · đến dd/mm», toast «Đã đổi chế độ thu» (điểm ra: vẫn ở lưới).
- Biên: hàng chưa đặt chế độ hiện «Chưa đặt»; chọn Bùng mà chưa nhập hạn thì «Lưu» khoá; chọn lại đúng chế độ đang có thì
  lưu không ghi gì, toast «Không có gì thay đổi»; trên cloud trang dừng ở LocalOnlyAlert (đã có), không có lưới.
- Lỗi & quay lại: máy chủ trả 400/403/404 → chữ lỗi (Alert destructive) hiện trong hộp, hộp giữ nguyên lựa chọn để sửa; lỗi
  mạng → cùng chỗ, chữ «Lỗi mạng»; «Huỷ» hoặc Esc đóng hộp, không ghi gì.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Lưới nhóm thu (`source-groups.tsx`, có sẵn) | thấy chế độ và hạn của từng điểm | PageHeader `/ops/sources` / hộp đổi chế độ |
| Hộp «Chế độ thu» (`mode-dialog.tsx`, mới) | đặt chế độ của một điểm | nút hàng / lưới |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-luoi-che-do | Lưới nhóm thu | Badge «Chờ» (outline) · «Bùng · đến 07/11» (warning-light) · «Duy trì» (success-light) · «Chưa đặt» (chữ mờ) | bấm «Đổi chế độ thu» |
| ST-luoi-trong | Lưới nhóm thu | Empty có sẵn của StatusGrid (không đổi) | «Thêm nhóm» |
| ST-hop-chon | Hộp chế độ thu | ba chế độ, chế độ hiện tại chọn sẵn; tiêu đề ghi mã nguồn + id điểm («S06 · điểm #7»), không tên nhóm | chọn rồi «Lưu» |
| ST-hop-bung-thieu-han | Hộp chế độ thu | ô «Hạn bùng» (date, min H, max H+13) trống, câu «Tối đa 14 đêm; hết hạn máy tự về Duy trì.», «Lưu» khoá | nhập hạn |
| ST-hop-dang-luu | Hộp chế độ thu | «Lưu» khoá kèm Spinner | chờ |
| ST-hop-loi | Hộp chế độ thu | Alert destructive chữ lỗi máy chủ (vd «hạn bùng đã qua») | sửa rồi lưu lại / Huỷ |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Ô ngày dùng `Input type="date"` với `min`/`max` của trình duyệt; máy chủ vẫn kiểm lại (kiểu ngày gõ tay qua được `max`).
- Rời Bùng thì ô hạn ẩn và hạn không gửi đi. Focus về nút hàng khi hộp đóng (Dialog lo).
- Nút hàng là icon-sm có `aria-label="Đổi chế độ thu"` + `aria-describedby` trỏ tên nhóm (khuôn nút xoá có sẵn); tên tầng
  A không vào aria-label.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `StatusGrid` + cột Badge (`@/components/reui/badge`) | mở rộng | thêm một cột vào lưới đã chuyển thể từ solution-dev-ops-6 |
| `ui/dialog` + `ui/field` + `ui/toggle-group` + `ui/input` + `@/components/reui/alert` | ghép | hộp sửa một bản ghi — Dialog là chủ của modal; ba chế độ là ToggleGroup một lựa chọn; trường theo khuôn `new-group-sheet.tsx` |
| `mode-dialog.tsx` | tạo | không block nào khớp «đặt chế độ có hạn»; < 200 dòng |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: luồng hiển nhiên — lưới có sẵn là danh sách, hộp thoại sửa một hàng là chi tiết; cùng khuôn với nút xoá/thêm của
chính bảng này, không tra mẫu.
<!-- UX-SPEC-TEMPLATE>>> -->
