# Đếm «đề xuất làm giàu» đúng trạng thái chờ — design (df0-dem-de-xuat-lam-giau)

Ngày 26/10/2026 · Hàng U2 2.2 của đợt dieu-phoi-dot0-cam-mau · Ngoài-7 của `ops-dong-chay-df0` (Mạnh chọn «mở hợp đồng
mới» ở Cổng Bằng chứng, `_acceptance/ops-dong-chay-df0/decisions.jsonl`).

## Vấn đề

Đầu trang `/ops/data-flow` ghi «N đề xuất làm giàu». `getDataFlow` (`app/src/lib/data-flow-queries.ts`) đếm
`enrichment_proposals WHERE status = 'pending'`, nhưng bảng không có trạng thái đó: ràng buộc CHECK (migration 036) chỉ
cho `queued · applied · rejected · superseded · skipped · reverted`, và đề xuất mới sinh ra với mặc định `queued`
(migration 033). Nên số luôn là 0 dù hàng đợi đang có việc — người vận hành tưởng không còn gì chờ xử lý.

## Cách sửa

- Một hằng câu đếm `ENRICH_PENDING_SQL` trong `data-flow-queries.ts`: đếm `status = 'queued'` — đề xuất chưa được áp,
  bác, thay hay bỏ qua. Theo khuyến nghị Hỏi-1: mọi tuyến (direct/corroborated/review) — quy mô hàng đợi làm giàu.
- `getDataFlow` dùng hằng đó; số «thẻ chờ duyệt» (`review_queue` `pending`) giữ nguyên.
- Không đổi giao diện: đầu trang vẫn ghi `${fmtInt(flow.enrichPending)} đề xuất làm giàu`, chỉ giá trị đổi.

## Đo

Tệp test riêng `app/tests/df0-dem-de-xuat.test.tsx` (không chạm tệp test của `ops-dong-chay-df0`):

- Lược đồ tạm `dem_<pid>`: bảng `enrichment_proposals` và `review_queue` LIKE public (kèm default + CHECK). Danh sách
  trạng thái và tuyến RÚT TỪ ràng buộc CHECK của bảng thật (bên ghi), không viết tay; tập trạng thái rút ra phải BẰNG
  bảng phân loại ghim trước (`queued` đếm, năm trạng thái kia không) — trạng thái mới chưa phân loại thì đỏ. Mỗi cặp
  (trạng thái × tuyến) có dòng; số dòng mỗi trạng thái là luỹ thừa 2 riêng nên mọi tập con cho tổng khác nhau.
- `getDataFlow` chạy THẬT với hàm `query` tiêm: câu chạm `enrichment_proposals` hay `review_queue` chạy trên lược đồ tạm,
  câu khác trả rỗng → `enrichPending` = tổng `queued` mọi tuyến, `reviewPending` = số thẻ `pending`.
- Đường trang: `page.tsx` đưa kết quả `getDataFlow` thẳng vào `DataFlowView` — judgment trên hai tệp (AC-6). Không ghi đề
  xuất giả vào bảng thật để chụp trang: `enrich-run` có thể áp nó vào `sale_offers`.
- Hỏi-1 (Cổng Phạm vi): đếm mọi `queued` (khuyến nghị) hay bỏ tuyến review đã có thẻ để không đếm trùng với «thẻ chờ
  duyệt».
- Chiều đỏ trên cùng fixture: câu đếm đột biến về `'pending'` → 0, ca đỏ ghim thông điệp.
- Dựng `DataFlowView` với flow vừa đọc → đầu trang có «N đề xuất làm giàu» (N = số `queued`).

## Ngoài phạm vi

- Tách số theo tuyến (tự áp / cần duyệt) — nhãn mới, cần thuật ngữ `CONTEXT.md`.
- Precompute số ở `pipeline/sql` (DF1).
- Số «thẻ chờ duyệt» — giữ nguyên.
