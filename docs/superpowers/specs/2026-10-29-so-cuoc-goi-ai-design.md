# so-cuoc-goi-ai — sổ cuộc gọi AI và trang chi phí trên /ops (PL29 · CM.1)

Nguồn: hàng PL29 của lộ trình (`docs/plan/lo-trinh.json`), mã CM.1 của review kiến trúc phân loại
(`docs/architecture/classification-enrich-review.md` §0.4: «Sổ cuộc gọi AI (bảng local + ghi ở `getModel`) + trang chi
phí trên `/ops`», làn C). Cổng Đáng: build (giám sát đợt dieu-phoi-dot0-cam-mau, P4-73, theo kế hoạch đợt Mạnh đã duyệt).

## Vấn đề

Qwen 27B local chậm và chưa đo độ đúng. Muốn đổi model (CM.2, CM.3) thì trước hết phải biết mỗi việc đang tốn bao nhiêu
token, bao lâu, và (khi có model cloud) bao nhiêu tiền. Hiện agent runtime (`agent/src/runtime/loop.ts`) chỉ ghi trace
JSONL từng lượt, không ghi `usage` của AI SDK, không có chỗ nào cộng dồn theo việc × model × ngày.

## Cách làm (soạn theo khuyến nghị — Hỏi-1..3 trên thẻ Cổng Phạm vi)

1. **Phạm vi đo (Hỏi-1):** mọi cuộc gọi qua agent runtime (`runAgent`: `judge-entity`, `enrich-text`, `smoke-echo`).
   Kev-4B gate gọi HTTP ở pipeline import và collector — làn ZCode — không đi qua `runAgent`; đề xuất một việc GIAO riêng
   qua phiên liên làn để ghi cùng bảng sau.
2. **Chi phí (Hỏi-2):** ghi token vào/ra (từ `result.totalUsage` của AI SDK), độ trễ, model, việc. Chi phí tính lúc đọc
   = token vào × đơn giá vào + token ra × đơn giá ra, đơn giá lấy từ bảng `ai_model_prices` (đồng / triệu token). Model
   local (`qwen3.8-27b-local`) giá 0. Model chưa có giá → chi phí trống, trang ghi «chưa có giá», không ghi 0 giả.
3. **Lưu và hiện (Hỏi-3):**
   - Migration `052_ai_calls.sql` (số do phiên liên làn cấp, sổ SO-MIGRATION 29/10): bảng `ai_calls` (một dòng một lượt `runAgent`: `at`, `khach`, `viec`,
     `model`, `input_tokens`, `output_tokens`, `latency_ms`, `ok`, `loi`, `trace`) và `ai_model_prices` (`model`,
     `gia_vao`, `gia_ra`, `don_vi`, seed Qwen local = 0). Chỉ ở máy thu, không vào FILL của `sync-cloud`.
     `khach` mặc định `pipeline` (review §0.4: pipeline và trợ lý nhà đầu tư tách sổ từ đầu).
   - Ghi sổ trong `runAgent` (một chỗ, cả đường thành công lẫn đường lỗi), **fail-soft**: ghi sổ hỏng thì agent vẫn trả kết
     quả / ném đúng lỗi gốc, trace có dòng `ai-call-log-error`.
   - Trang `/ops/ai-calls` (nhóm «Giám sát»): bảng tổng hợp 30 ngày theo ngày × việc × model — số cuộc, số lỗi, token
     vào, token ra, chi phí, độ trễ p50 / p95. Ở máy thu đọc thẳng `ai_calls`; trên cloud đọc khối `aiCalls` trong
     `ops_heartbeat` do `push-ops-facts` đẩy (chỉ số và tên việc/model, không nội dung prompt; qua bộ soát tầng A).

## Phép đo

- Test agent (node --test) với model giả của AI SDK (`MockLanguageModelV4` trong `ai/test` (AI SDK 7), truyền qua tham số tiêm phụ thuộc của `runAgent`) và DB local trong giao
  dịch ROLLBACK: lượt thành công ghi đúng một dòng có token khớp `usage` giả; lượt lỗi ghi `ok=false`; DB ghi sổ hỏng →
  agent vẫn trả kết quả. Mỗi ca có chiều đỏ (bản đột biến bỏ lời ghi sổ → test đỏ, thông điệp ghim).
- Hàm tổng hợp dùng chung (`pipeline/lib/ai-calls.mjs`) cho cả trang local lẫn khối cloud: test số cuộc, tổng token, chi
  phí, p50/p95 trên tập mồi viết trước (ma trận đủ), ca «chưa có giá».
- `push-ops-facts --kho`: khối `aiCalls` có mặt, qua bộ soát tầng A, không có trường chữ tự do.
- Trang: ui-check trên bản chạy (local có dữ liệu mồi, trống, cloud cũ) + test route-slugs + nav.

## Đặc tả UX

- Bề mặt: `/ops/ai-calls`, Shell Ops, nhóm «Giám sát», archetype «Table-backed management» (như `/ops/data-flow`),
  container Frame, chữ `text-sm`, bảng ReUI `data-grid`.
- Đầu trang: PageHeader «Cuộc gọi AI» + một dòng giải thích «Token, độ trễ và chi phí của mọi cuộc gọi qua agent runtime,
  30 ngày gần nhất». Ba ô tóm tắt: tổng cuộc (30 ngày), tổng token, tổng chi phí (đồng; «0 đ — model local» khi toàn local).
- Bảng: cột Ngày · Việc · Model · Cuộc · Lỗi · Token vào · Token ra · Chi phí · Trễ p50 · Trễ p95; sắp ngày giảm dần.
- Trạng thái: đang tải → Skeleton; trống → «Chưa có cuộc gọi AI nào trong 30 ngày» + hành động «Chạy thử agent»
  (chỉ dẫn lệnh `npm run smoke` trong `agent/`); lỗi → Alert destructive + Thử lại; cloud: số cũ → FactsStaleAlert,
  chưa đẩy → «Chỉ đo ở máy thu».
- Khuôn IA: bảng tổng hợp có ô tóm tắt (khuôn có tên «summary + detail table»), chọn vì đã có mẫu `/ops/data-flow`.

## Lối đã loại

- Ghi ở `getModel` thay vì `runAgent`: `getModel` trả đối tượng model, không thấy kết quả gọi (token, độ trễ) — phải
  bọc middleware AI SDK; `runAgent` là chỗ duy nhất gọi `generateText` hiện nay nên ghi ở đó đơn giản hơn. Khi CM.3
  thêm gateway, chuyển ghi sổ vào middleware.
- Đẩy cả bảng `ai_calls` lên cloud qua `sync-cloud`: không cần chi tiết từng lượt trên cloud, và tránh rủi ro chở chữ.
