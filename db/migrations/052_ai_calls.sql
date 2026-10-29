-- 052_ai_calls.sql — PL29 `so-cuoc-goi-ai` (CM.1): sổ cuộc gọi AI + bảng đơn giá model.
-- Nguồn: design docs/superpowers/specs/2026-10-29-so-cuoc-goi-ai-design.md · hồ sơ _acceptance/so-cuoc-goi-ai
-- (Mạnh duyệt 29/10) · review docs/architecture/classification-enrich-review.md §0.4. Số 052 do phiên liên làn cấp
-- (sổ SO-MIGRATION). Bảng vận hành, ngoài RESO.
--
-- `ai_calls`: một dòng mỗi lượt agent runtime (agent/src/runtime/loop.ts → ai-call-log.ts) — việc, model, token vào/ra,
-- độ trễ, thành công hay lỗi (`loi` chỉ là tên lớp lỗi, KHÔNG chép prompt/đầu ra). `khach` tách sổ pipeline với trợ lý nhà
-- đầu tư (review §0.4); hiện mọi dòng là 'pipeline'. `ai_model_prices`: đơn giá đồng / triệu token, chi phí tính lúc đọc
-- (pipeline/lib/ai-calls.mjs); model không có dòng giá → chi phí NULL, không phải 0.
--
-- KHÔNG sync cloud: hai bảng chỉ ở máy thu (không vào FILL của pipeline/sync-cloud.mjs); cloud chỉ nhận số tổng hợp
-- (khối `aiCalls` của push-ops-facts). Áp lên DB local :5433 dùng chung CHỈ sau khi gộp (lời dặn của giám sát).
-- Tên không mang tiền tố lược đồ: phép đo chạy tệp này trên lược đồ tạm mà không chạm bảng thật.

CREATE TABLE IF NOT EXISTS ai_calls (
  id            bigserial PRIMARY KEY,
  at            timestamptz NOT NULL DEFAULT now(),
  khach         text NOT NULL DEFAULT 'pipeline' CHECK (khach IN ('pipeline', 'tro-ly')),
  viec          text NOT NULL,
  model         text NOT NULL,
  input_tokens  integer CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens integer CHECK (output_tokens IS NULL OR output_tokens >= 0),
  latency_ms    integer NOT NULL CHECK (latency_ms >= 0),
  ok            boolean NOT NULL,
  loi           text CHECK (loi IS NULL OR length(loi) <= 80),
  trace         text
);

CREATE INDEX IF NOT EXISTS ai_calls_at_idx ON ai_calls (at);
CREATE INDEX IF NOT EXISTS ai_calls_viec_model_idx ON ai_calls (viec, model);

COMMENT ON TABLE ai_calls IS
  'PL29: sổ cuộc gọi AI — một dòng mỗi lượt agent runtime (việc, model, token, độ trễ, ok/lỗi). Chỉ ở máy thu.';

CREATE TABLE IF NOT EXISTS ai_model_prices (
  model    text PRIMARY KEY,
  gia_vao  numeric NOT NULL CHECK (gia_vao >= 0),
  gia_ra   numeric NOT NULL CHECK (gia_ra >= 0),
  don_vi   text NOT NULL DEFAULT 'VND/1M token' CHECK (don_vi = 'VND/1M token'),
  ghi_chu  text
);

COMMENT ON TABLE ai_model_prices IS
  'PL29: đơn giá model (đồng / triệu token). Model local giá 0; model không có dòng → chi phí NULL.';

INSERT INTO ai_model_prices (model, gia_vao, gia_ra, ghi_chu)
VALUES ('qwen3.8-27b-local', 0, 0, 'Qwen 27B chạy local qua MTPLX — không tốn tiền theo token')
ON CONFLICT (model) DO NOTHING;
