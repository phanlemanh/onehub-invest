# Thẻ duyệt Người cho ca nhiều–nhiều (HD17) — thiết kế

Hồ sơ: `_acceptance/the-duyet-nguoi-nhieu-nhieu/` · hàng HD17 của `docs/plan/lo-trinh.json` · sinh từ Hỏi-1 của Cổng
Phạm vi HD13 (`nguoi-noi-theo-sdt`, dòng sổ `d-20261031T125036Z-10`).

## Vấn đề

HD13 gộp người theo SĐT vào người theo tài khoản cùng nguồn khi cặp nối một–một. Ca nhiều–nhiều được đếm (`nhieu_nhieu` của
`dungNguoi`) nhưng không gộp: một SĐT nhiều tài khoản gửi (môi giới đăng hộ, hay một người nhiều tài khoản), một tài khoản
nhiều SĐT. Đo 31/10: khoảng 9 SĐT dùng chung và 5 người nhiều số. Không có chỗ nào để người quyết các ca này.

## Cách làm

**Đơn vị thẻ — nhóm liên thông.** Trong từng nguồn S03/S05, dựng đồ thị hai phía tài khoản ↔ SĐT trên tin sống (cùng
`rutDinhDanh` của HD13). Nhóm liên thông có ≥ 2 tài khoản hoặc ≥ 2 SĐT là một ca nhiều–nhiều; mỗi nhóm đúng một thẻ. Thẻ hỏi
một câu cho cả nhóm: gộp mọi tài khoản và SĐT của nhóm thành một Người, hay giữ tách (Hỏi-1).

**Thẻ ở `review_queue`.** `item_type = 'data_quality'`, `item_id = 'nguoi:<S0x>:<16 hex đầu sha256 của danh sách thành viên đã
xếp>'` — theo tiền lệ `agent_output` + `enrich:` của route decide (Hỏi-3: loại thẻ mới cần migration). `evidence` mang mã nguồn,
tài khoản (ID, tên, số tin sống), SĐT E.164 (số tin), tối đa 5 tin mẫu. `ai_suggestion` rỗng: không model nào gợi ý.

**Sinh thẻ ở bước dựng danh bạ** (`dungNguoi`, chạy đêm qua `refresh-bait-gap`). Mỗi lượt: thẻ mới cho nhóm chưa từng có thẻ
(bất kể trạng thái); thẻ chờ của nhóm đã đổi thành viên (item_id không còn trong lượt) đóng `deferred` với ghi chú trỏ thẻ mới,
người làm `dung-nguoi`. Không thẻ nào bị xoá.

**Áp quyết định — luật xác định ở bước dựng, không ở route.** Route decide giữ nguyên (đường chung: ghi trạng thái + lý do +
`ops_audit`). Lượt dựng kế đọc thẻ `approved` chưa có sự kiện `the-duyet:<id>`: mọi Người của nhóm (người tài khoản và người theo
SĐT, lấy người cuối của chuỗi `merged_into`) gộp vào người tài khoản có `party_key` nhỏ nhất (ULID — cũ nhất). Mỗi lần gộp một
dòng `registry_events` loại `gop` lý do `the-duyet:<id> <S0x>`. Người `split` không bị gộp. Áp cả khi công tắc gộp tự động tắt
(Hỏi-2). Thẻ `rejected`/`deferred`: không gộp. Đảo bằng `dung-nguoi.mjs --tach` của HD13; thẻ đã áp không áp lại (sự kiện đã có).

**Bất biến HD13 (AC-7 của HD13).** «Không người cuối nào mang hai SĐT khác nhau» đổi thành «… trừ khi chuỗi gộp có sự kiện
`the-duyet:`» — đúng chữ ngưỡng hàng HD13 «không Người nào gộp hai SĐT khác nhau mà không có bí danh nối». Sửa ở thước
`pipeline/scripts/nap-lai-nguoi.mjs`, ghi một dòng sổ `fix` vào hồ sơ HD13. Bộ test đã ký của HD13 không sửa.

**Thẻ trên `/ops/review`.** Component mới `app/src/components/ops/review-card-nguoi.tsx` (`NguoiCard`); `ReviewCard` rẽ nhánh khi
`data_quality` + `nguoi:`. Dùng lại `useDecide`, `PendingActions`, `DoneState` (xuất từ `review-card.tsx`).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX
### 1. Luồng
- Suôn sẻ: /ops/review (lọc «Loại khác» hay «Mọi loại») → thẻ «Gộp Người?» → đọc bảng tài khoản/SĐT + tin mẫu → ghi lý do →
  «Gộp thành một Người» / «Giữ tách» / «Hoãn» (điểm ra: thẻ đổi sang đã quyết, danh sách làm mới)
- Biên: nhóm 2 tài khoản 1 SĐT · 1 tài khoản 3 SĐT · nhóm lớn (≥ 6 thành viên — bảng cuộn, không cắt); vai viewer không thấy nội dung
- Lỗi & quay lại: route trả lỗi → dòng «Lỗi: …» cạnh nút, lý do giữ nguyên, bấm lại được
### 2. Kiểm kê màn
| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Thẻ Gộp Người (trong /ops/review) | quyết nhóm tài khoản–SĐT là một người hay nhiều | danh sách thẻ / về danh sách |
### 3. Bảng trạng thái
<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-nguoi-cho | Thẻ Gộp Người | bảng tài khoản, SĐT, tin mẫu; ô lý do; ba nút tắt khi lý do trống | ghi lý do rồi bấm một nút |
| ST-nguoi-dang-gui | Thẻ Gộp Người | nút tắt trong lúc gửi | chờ |
| ST-nguoi-loi | Thẻ Gộp Người | «Lỗi: <thông điệp route>» cạnh nút, lý do giữ nguyên | bấm lại |
| ST-nguoi-da-gop | Thẻ Gộp Người | badge «Đã gộp» + «Lý do: …» | không |
| ST-nguoi-giu-tach | Thẻ Gộp Người | badge «Giữ tách» + lý do | không |
| ST-nguoi-hoan | Thẻ Gộp Người | badge «Hoãn» + lý do | không |
<!-- UX-STATE-TABLE>>> -->
### 4. Hành vi
- Lý do bắt buộc (`lyDoHopLe` sẵn có). SĐT hiện dạng số gốc (tầng C). Mã nguồn chỉ `S0x`.
### 5. Xuất xứ component
| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| ReviewReason, PendingActions, DoneState, useDecide | dùng | khung thẻ duyệt sẵn có |
| ui/table, reui/badge, ui/button | dùng | bảng thành viên, nhãn, nút |
| NguoiCard | ghép | thân thẻ mới từ các phần trên |
### 6. Khuôn IA đã chọn + căn cứ
Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: thẻ nằm trong danh sách thẻ duyệt sẵn có của /ops/review — không tra thêm, luồng hiển nhiên.
<!-- UX-SPEC-TEMPLATE>>> -->

## Ngoài phạm vi

- Gộp một phần nhóm (chọn từng cặp tài khoản–SĐT).
- Ca khác nguồn (S06 chưa có SĐT — HD12).
- Thẻ trên cloud (`review_queue` là bảng tầng A ở `sync-cloud.mjs`, chỉ local).
