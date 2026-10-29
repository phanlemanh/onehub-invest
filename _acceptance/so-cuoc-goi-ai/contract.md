---
schema_version: 1
feature: Người vận hành mở /ops và thấy chi phí, token, độ trễ của mọi cuộc gọi AI theo việc, model và ngày
slug: so-cuoc-goi-ai
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, api, cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-29
design_doc: docs/superpowers/specs/2026-10-29-so-cuoc-goi-ai-design.md
---

# Acceptance Contract: so-cuoc-goi-ai

## Context

Hàng PL29 (mã CM.1 của review kiến trúc phân loại §0.4): sổ cuộc gọi AI ở DB local, ghi tại agent runtime, và trang chi
phí trên /ops — để biết Qwen 27B đang tốn bao nhiêu token, bao lâu, trước khi đổi model (CM.2, CM.3). T3 vì có migration
mới và khối mới trong `pipeline/push-ops-facts.mjs`. Phạm vi đo, cách tính chi phí và chỗ hiện là ba câu Hỏi-1..3 trên thẻ
Cổng Phạm vi; hợp đồng này soạn theo khuyến nghị của cả ba.

## Criteria

- AC-1: Given DB local và lược đồ tạm, When áp migration mới hai lần, Then có bảng `ai_calls` (at, khach, viec, model,
  input_tokens, output_tokens, latency_ms, ok, loi, trace) và `ai_model_prices` (model, gia_vao, gia_ra, don_vi) với dòng
  giá của `qwen3.8-27b-local` = 0; lần áp thứ hai không lỗi, không nhân đôi dòng giá.
- AC-2 (cross-layer): Given `runAgent` chạy với model giả trả usage (vào 120, ra 30), When lượt chạy thành công, Then
  `ai_calls` có đúng một dòng mới: viec = tên agent, model = tên model, input_tokens 120, output_tokens 30,
  latency_ms > 0, ok = true, khach = 'pipeline'; dòng `final` của trace mang `usage` (vào 120, ra 30); kết quả trả về của
  `runAgent` không đổi so với trước. Đường mặc định (agent thật không tiêm gì ngoài model) cũng ghi dòng vào DB local.
- AC-3 (cross-layer): Given model giả ném lỗi, When `runAgent` chạy, Then `ai_calls` có một dòng ok = false, `loi` là
  tên lớp lỗi (không chép message, prompt hay đầu ra — kể cả khi lỗi mang chúng), và `runAgent` vẫn ném đúng lỗi gốc.
- AC-4: Given ghi sổ hỏng (DB không kết nối được), When `runAgent` chạy với model giả, Then `runAgent` vẫn trả kết quả như
  không có sổ, và trace của lượt có dòng `ai-call-log-error`.
- AC-5: Given tập dòng mồi viết trước (ma trận: model có giá khác 0, model giá 0, model chưa có giá; lượt ok và lỗi; ba
  ngày, có lượt sát nửa đêm), When chạy hàm tổng hợp dùng chung, Then mỗi nhóm ngày (giờ Việt Nam) × việc × model có đúng số cuộc, số lỗi, tổng token vào/ra,
  chi phí = vào × giá vào + ra × giá ra (đồng / triệu token), p50/p95 độ trễ; model chưa có giá → chi phí null (không 0).
- AC-6 (cross-layer): Given DB local có dòng mồi và người dùng Ops đã đăng nhập ở máy thu, When mở `/ops/ai-calls`, Then
  trang hiện ba ô tóm tắt (tổng cuộc, tổng token, tổng chi phí) và bảng ngày × việc × model khớp số của hàm tổng hợp; chi
  phí null hiện «chưa có giá».
- AC-7: Given `push-ops-facts --kho`, When dựng payload, Then `blocks.aiCalls` có mặt với các nhóm 30 ngày (chỉ số, tên
  việc, tên model, ngày), qua bộ soát tầng A, không có trường chữ tự do; trên cloud (`VERCEL=1`) trang đọc ĐÚNG khối do
  bước `--kho` ấy sinh (từ `ops_heartbeat`) và hiện cùng số với hàm tổng hợp; khối cũ → cảnh báo số cũ, khối vắng → «Chỉ đo ở máy thu».
- AC-8: Given `ai_calls` rỗng, lỗi truy vấn, hoặc đang tải, When mở trang, Then lần lượt thấy trạng thái trống có hướng dẫn
  «Chạy thử agent», Alert lỗi có Thử lại, và Skeleton — không trang trắng.
- AC-9: Given kho, When chạy test slug và soát menu, Then `CONTEXT.md` có thuật ngữ «Cuộc gọi AI» với `Slug URL: ai-calls`,
  test route-slugs xanh, menu Ops nhóm «Giám sát» có mục trỏ `/ops/ai-calls`, routes.md có dòng của trang.
- AC-10: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong `agent/src/runtime/`, `agent/tests/`,
  `db/migrations/052_ai_calls.sql`, `pipeline/push-ops-facts.mjs`, `pipeline/lib/ai-calls.mjs` (+ test),
  `app/src/app/ops/ai-calls/`, `app/src/components/ops/ai-calls/`, `app/src/lib/` (truy vấn + ops-facts),
  `app/src/components/shell/nav.tsx`, `app/tests/ai-calls.test.tsx`, `agent/package.json` + `agent/package-lock.json`,
  `_acceptance/config.yaml`, `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md`, hồ sơ này, design/plan, tệp máy sinh
  (`PRODUCT-MAP.md`, `LO-TRINH.html`); không chạm làn ZCode (collector/, pipeline/import-*, cron).

## Coverage

- Trục (từ review §0.4 + câu giao): **ghi** (AC-2 thành công, AC-3 lỗi, AC-4 sổ hỏng) · **lưu** (AC-1) · **tính** (AC-5 chi
  phí, nhóm, phân vị) · **hiện local** (AC-6) · **hiện cloud** (AC-7) · **trạng thái trang** (AC-8) · **đường tới trang**
  (AC-9) · **phạm vi/làn** (AC-10). Quét hình thái bỏ (dòng sổ descope) — các trục do review §0.4 chốt.

## Đường đo

- Ngưỡng ở `opportunity.md` (Hỏi-4): sau 7 ngày chạy enrich/judge, mỗi việc đã chạy có dòng trên trang và khớp trace.
  Số từ đâu: lệnh `node _acceptance/so-cuoc-goi-ai/probes/doi-chieu.mjs --ngay 7` đếm lượt `runAgent` theo trace
  (`agent/traces/*--<việc>.jsonl`, theo ngày giờ Việt Nam) và tổng token của dòng `final`, so với số dòng và tổng token
  của `ai_calls` theo việc × ngày. AC bảo đảm: AC-2 (trace mang `usage`, đường mặc định ghi sổ), AC-5 (nhóm theo ngày).

## Out of scope

- Kev-4B gate và mọi cuộc gọi AI ở làn ZCode (collector, pipeline import) — đề xuất GIAO riêng qua phiên liên làn.
- AI Gateway, ngân sách, dự phòng (CM.3); bộ đánh giá nhiều model (CM.2); chi phí đưa một căn lên bậc (CM.4).
- Sổ riêng cho trợ lý nhà đầu tư (cột `khach` có sẵn, chưa có người ghi giá trị khác `pipeline`).
- Ghi nội dung prompt hay đầu ra vào sổ.

## Notes

- Hỏi-1..3 (phạm vi đo, cách tính chi phí, chỗ lưu và hiện) và Hỏi-4 (ngưỡng nghiệm thu) chờ Mạnh ở Cổng Phạm vi; xem sổ
  quyết định, dòng `chi-nguoi`.
