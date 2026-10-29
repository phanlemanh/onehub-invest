# Kế hoạch — so-cuoc-goi-ai (PL29 · CM.1, T3)

Hợp đồng: `_acceptance/so-cuoc-goi-ai/contract.md` (Mạnh duyệt Cổng Phạm vi 29/10, Hỏi-1..4 theo khuyến nghị). Thiết kế:
`docs/superpowers/specs/2026-10-29-so-cuoc-goi-ai-design.md`. Migration 052 do phiên liên làn cấp.

Mọi task chạy TUẦN TỰ trong phiên chính (tệp chồng nhau qua bảng và hàm tổng hợp). Mỗi phép đo mới có cặp hai chiều trên
cùng fixture (xanh trên vật lành, đỏ với thông điệp ghim trên bản đột biến).

| # | Task | Tệp | Kiểm per-task | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Migration `052_ai_calls.sql`: bảng `ai_calls` (10 cột, chỉ mục `at`, `viec`) + `ai_model_prices` (seed `qwen3.8-27b-local` = 0, `ON CONFLICT DO NOTHING`), không sync cloud; đầu dò áp hai lần trên lược đồ tạm trong ROLLBACK | `db/migrations/052_ai_calls.sql`, `_acceptance/so-cuoc-goi-ai/probes/migration.mjs` | `node …/probes/migration.mjs` → «MIGRATION OK»; bản chép bỏ `latency_ms` → «THIEU COT latency_ms» | E1 | true |
| 2 | Hàm tổng hợp dùng chung: câu SQL nhóm ngày (giờ Việt Nam) × việc × model + chi phí theo bảng giá + p50/p95 (`percentile_cont`), và hàm thuần cùng phép tính cho test | `pipeline/lib/ai-calls.mjs`, `pipeline/lib/ai-calls.test.mjs` | `node --test pipeline/lib/ai-calls.test.mjs` (ma trận 3 model × 2 kết quả × 3 ngày, lượt sát nửa đêm; đột biến null→0 đỏ) | E5 | true |
| 3 | Ghi sổ ở agent runtime: `agent/src/runtime/ai-call-log.ts` (writer pg, `DATABASE_URL`), `runAgent` nhận tham số tiêm `{ model?, recordCall? }`, đo độ trễ, đọc `totalUsage`, ghi cả đường lỗi (`loi` = tên lớp lỗi), fail-soft + dòng trace `ai-call-log-error`, dòng `final` mang `usage` | `agent/src/runtime/loop.ts`, `agent/src/runtime/ai-call-log.ts`, `agent/tests/ai-call-log.test.ts`, `agent/package.json` (nếu thiếu `pg`) | `cd agent && node --import tsx --test tests/ai-call-log.test.ts` + `npx tsc --noEmit`; đột biến: recordCall rỗng, writer mặc định no-op, ghi `err.message` | E2, E3, E4, E13 | false (sau 1) |
| 4 | Khối `aiCalls` trong `push-ops-facts` (đọc qua hàm tổng hợp, 30 ngày, chỉ số + tên việc/model/ngày) + `"aiCalls"` vào `OPS_FACT_BLOCKS` | `pipeline/push-ops-facts.mjs`, `app/src/lib/ops-facts.ts` | `node pipeline/push-ops-facts.mjs --kho` có khối, soát tầng A qua | E8 | false (sau 1, 2) |
| 5 | Trang `/ops/ai-calls`: truy vấn app (bản chép nguyên văn câu SQL của task 2, có test so chuỗi), chế độ local/cloud theo `VERCEL`, ba ô tóm tắt + data-grid ReUI, trống/lỗi/đang tải, mục menu nhóm «Giám sát», thuật ngữ «Cuộc gọi AI» + `Slug URL: ai-calls` trong `CONTEXT.md`, dòng `routes.md` | `app/src/lib/ai-calls-queries.ts`, `app/src/app/ops/ai-calls/page.tsx`, `app/src/components/ops/ai-calls/*`, `app/src/components/shell/nav.tsx`, `app/tests/ai-calls.test.tsx`, `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md` | `cd app && npx tsc --noEmit && npm run lint && npm test`; route-slugs + routes-map test; design-gate trên tệp mới | E6, E7, E9, E10, E11 | false (sau 2, 4) |
| 6 | Đầu dò còn lại: `trang.mjs` (mồi `sca-mau-*`, so render server với hàm tổng hợp), `facts.mjs` (khối từ `--kho` thật, render cloud ba trạng thái), `duong.sh`, `pham-vi.sh`, `doi-chieu.mjs` (đường đo ngưỡng 7 ngày), `seed.mjs` cho ui-check | `_acceptance/so-cuoc-goi-ai/probes/*` | chạy từng đầu dò: xanh trên vật thật, đỏ với thông điệp ghim trên bản đột biến | E7, E8, E11, E12, Đường đo | false (sau 5) |

Sau task 6: sàn thiết kế S3, đặt `implemented`, xin lượt S4.

**Chỗ áp migration (giám sát trả lời 29/10, theo LUAT đợt).** KHÔNG áp 052 lên DB `oneinvest` :5433 trước khi gộp.
Lượt chấm và đầu dò dùng DB thử riêng `oneinvest_p4_so_cuoc_goi_ai` (`bash db/db-thu.sh oneinvest_p4_so_cuoc_goi_ai`,
chép lược đồ + dữ liệu của oneinvest), áp 052 vào DB thử, rồi trỏ `DATABASE_URL` của test, đầu dò và dev server dùng cho
ui-check E6 (cổng riêng, `DATABASE_URL` của DB thử) vào đó. E1 vẫn áp 052 vào lược đồ tạm trong ROLLBACK. Áp 052 lên DB
máy thu là bước TRIỂN KHAI sau khi gộp: `pg_dump` trước, rồi chạy theo `/new-migration`. Xong lượt chấm thì xoá DB thử
(`db-thu.sh … --xoa`).
