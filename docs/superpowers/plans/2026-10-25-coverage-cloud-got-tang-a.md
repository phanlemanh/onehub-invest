# Kế hoạch — coverage-cloud-got-tang-a (AU12, T3)

Hợp đồng: `_acceptance/coverage-cloud-got-tang-a/contract.md` (Cổng Phạm vi duyệt 25/10; Hỏi-1 = A giữ T3, Hỏi-2 = A
`rows: null` khi không có số). Design: `docs/superpowers/specs/2026-10-25-coverage-cloud-got-tang-a-design.md`. Nhánh
`claude/coverage-cloud-got-tang-a`, đã gộp main 3e60cfb. Ba task tuần tự.

| Máy đọc thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Trên máy chủ route trả độ tươi thật từ khối `freshness`, kèm cờ tươi / cũ; không có số thì `rows: null` + «Chỉ đo ở máy thu», không 500 | `app/src/app/api/v1/ops/coverage/route.ts` | AC-1, AC-3, AC-4, AC-5, AC-6 |
| Phép đo trên route thật: bản tin thật, quét tên nguồn thật, bốn ca không có số, auth, máy thu | `app/tests/coverage-cloud-got-tang-a.test.tsx` | AC-1…AC-6 (chiều xanh + chiều đỏ) |
| Tài liệu bề mặt máy | `app/src/lib/api-surface.ts`, `docs/ops/runtime-map.md`, `docs/ROADMAP.md` | — |

## Task 1 — route đọc khối độ tươi trên máy chủ

- Files: `app/src/app/api/v1/ops/coverage/route.ts` — giữ auth (session ops hoặc `Bearer OPS_API_TOKEN`). Nhánh theo
  `freshnessLocalOnly()` (suy từ lược đồ, không giả lập):
  - máy thu → `{ generatedAt, source: "local", state: "live", measuredAt: generatedAt, rows: getCoverageOverview() }`;
  - máy chủ → `readOpsFacts()`; khối `freshness` có `state` `fresh`/`stale` và `data.rows` là mảng mà mỗi hàng có `code`
    chữ → `{ source: "facts", state: <state khối>, measuredAt: <measuredAt khối>, rows: toCoverageRows(rows) }`; không
    bản tin / khối vắng / lỗi / sai khuôn (bắt cả lỗi ném từ phép chuyển) → `{ source: "facts", state: "none",
    measuredAt: null, rows: null, note: "Chỉ đo ở máy thu" }` (Hỏi-2 = A). Bảng `ops_heartbeat` vắng (42P01) = chưa có
    bản tin.
  - Phản hồi chỉ mang trường của `CoverageRow` + cờ — không chép khối hay bản tin.
- Verify: `cd app && npx tsc --noEmit && npm run lint`. `independent: false`.

## Task 2 — phép đo

- Files: `app/tests/coverage-cloud-got-tang-a.test.tsx` — lược đồ như máy chủ (ops_heartbeat + ops_audit), bản tin
  `captureOpsFacts` THẬT qua handler ingest thật, gọi `GET` của route THẬT với `Request` mang header token.
  - AC-1: rows = `toCoverageRows(blocks.freshness.rows)` của chính bản tin, state fresh, measuredAt = khối; in chế độ.
  - AC-2: danh sách tên = `real_name` của `public.source_registry` + registry lược đồ bên ghi; in số (≥ 1); quét khoá + giá
    trị của phản hồi ba trạng thái bằng `findSourceNames` (bộ dò NT2); đối chứng dương cấy từng tên.
  - AC-3: lùi `measured_at` khối 46′. AC-4: không bản tin · khối lỗi bên ghi thật (bản sao `push-ops-facts` ném ở khối
    freshness) · gỡ khối · rows không mảng / hàng thiếu `code` · khối tươi mà rows rỗng thật.
  - AC-5: không token / token sai → 401; token đúng → 200. AC-6: máy thu (tạo bảng thô) + bộ bắt truy vấn ops_heartbeat.
  - Chiều đỏ: bản sao route (tệp ẩn `.au12-mut-*`, import động) — trả `getCoverageOverview` như cũ; lấy measuredAt của bản
    tin; bỏ trạng thái khối; trả `[]` khi không có số; không kiểm khuôn; chép nguyên bản tin.
- Verify: `cd app && npm test`; phá thử từng ca đỏ. `independent: false`.

## Task 3 — tài liệu

- `app/src/lib/api-surface.ts` (ghi chú route), `docs/ops/runtime-map.md` (dòng route trên máy chủ), `docs/ROADMAP.md`
  một dòng. `independent: true`, làm cuối.

## Rủi ro

- Máy đọc ngoài kho coi `rows` là mảng sẽ gặp `null` khi máy chủ chưa có số (Hỏi-2 = A đã nhận giá này).
