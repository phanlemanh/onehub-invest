# Kế hoạch — lockdown-cloud-theo-facts (ON23, T3)

Hợp đồng: `_acceptance/lockdown-cloud-theo-facts/contract.md` (Cổng Phạm vi duyệt 25/10; Hỏi-1…4 = A). Design:
`docs/superpowers/specs/2026-10-25-lockdown-cloud-theo-facts-design.md`. Nhánh `claude/lockdown-cloud-theo-facts` cắt từ
main 33adaa4 (đã có ON3). Năm task tuần tự (chung `components/ops/collections/**`, `lib/ops-cloud.ts`).

| Người trực thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| (chưa thấy gì) Máy chủ đọc được khối Khoá an toàn của bản tin, tươi/cũ theo chính khối | `app/src/lib/ops-cloud.ts`, `app/src/lib/ops-queries.ts` | AC-1…AC-5 (nguồn số một chỗ) |
| Lưới Khoá an toàn hiện lại trên máy chủ: 8 lớp đúng bản tin, hoặc 8/8 «Chỉ kiểm ở máy thu» vàng khi chưa có số | `collections/lockdown-grid.tsx`, `collections-view.tsx` | AC-1, AC-2, AC-3, AC-4 (lưới theo khối) |
| Ô Khoá an toàn trên máy chủ ghi x/8 và số lượt máy tự trả lời, mờ khi số cũ | `collections/collections-tiles.tsx` | AC-1, AC-3, AC-4 (ô theo khối) |
| Kev gate và collector API ở Máy móc luôn cùng trạng thái với Khoá an toàn | `app/src/app/ops/collections/page.tsx`, `collections/jobs-grid.tsx`, `lib/collections-queries.ts` (kiểu) | AC-4, AC-5 (một lần đo) |
| Phép đo trên trang thật + bản bấm được bốn trạng thái | `app/tests/lockdown-cloud-theo-facts.test.tsx`, `scripts/ops-cloud-proto.mjs` | AC-1…AC-6, AC-9 (chiều xanh + chiều đỏ, ảnh) |

## Task 1 — nguồn số khối Khoá an toàn

- Files: `app/src/lib/ops-queries.ts` — tách hằng `LOCKDOWN_LAYERS` (8 cặp lớp + mô tả) dùng chung cho `getLockdownStatus`
  và nhánh máy chủ; `app/src/lib/ops-cloud.ts` — `CloudOpsView.lockdown: {layers, lastWatchdogAt, agentTurnsToday, stale} |
  null` từ `blocks.lockdown` (state của KHỐI; lỗi / vắng / sai khuôn → `null`, kiểm từng hàng `layer`, `desc`, `ok`).
- Verify: `cd app && npx tsc --noEmit && npm run lint`. Phục vụ AC-1…AC-5. `independent: false`.

## Task 2 — lưới và ô Khoá an toàn trên máy chủ

- Files: `collections/lockdown-grid.tsx` — trạng thái mới «Chỉ kiểm ở máy thu» (`Badge variant="warning-light"`, Hỏi-3),
  cờ `stale` («Ổn» → `outline`), mô tả «Chưa có số từ máy thu» khi không khối; `collections-view.tsx` — nhánh máy chủ dựng
  `LockdownGrid` (bỏ «lớp khoá an toàn» khỏi `MACHINE_ONLY_REGIONS`), không khối → 8 hàng từ `LOCKDOWN_LAYERS`;
  `collections-tiles.tsx` — nhánh máy chủ có khối dùng lại nhánh máy thu (x/8, badge lượt tự trả lời, thanh), số mờ +
  thanh không màu đạt khi cũ; không khối giữ «—» + «Chưa kiểm được trên máy chủ».
- Verify: như task 1. Phục vụ AC-1…AC-4, AC-7, AC-8. `independent: false`.

## Task 3 — Máy móc cùng trạng thái

- Files: `lib/collections-queries.ts` — `JobStatus.alive` thêm `"unchecked"`; `collections/jobs-grid.tsx` — nhãn «Chưa
  kiểm được» (`outline`); `app/src/app/ops/collections/page.tsx` — nhánh máy chủ: hàng `kev` ← lớp «Cổng Kev :8009»,
  `collector-api` ← lớp «Cổng nhận tin :9210» của khối (true → `yes`, false → `no`, null / không khối → `unchecked`); cờ
  `stale` theo khối Khoá an toàn cho hai hàng.
- Verify: như task 1. Phục vụ AC-4, AC-5. `independent: false`.

## Task 4 — phép đo + bản bấm được

- Files: `app/tests/lockdown-cloud-theo-facts.test.tsx` — AC-1…AC-6 trên trang `/ops/collections` THẬT ở chế độ máy chủ
  (`VERCEL=1`), bản tin thật qua `capture-ops-facts` + handler ingest; khối lỗi bằng bản sao bên ghi (`mutantPush`); ma
  trận ok 3 × 2 + ca chéo chỉ đổi `ok` của bản tin thật; chiều đỏ bằng bản sao component (`mutantChain` như ON3);
  `scripts/ops-cloud-proto.mjs` — thêm `--mode mixed` (bản tin thật, khối lockdown đủ true / false / null). Sửa test ON3
  (`o-kpi-chi-do-local.test.tsx`) ở chỗ ON3 hứa «tới khi ON23»: ô Khoá an toàn có khối không còn «—», lưới Khoá an toàn
  dựng lại trên máy chủ.
- Verify: `cd app && npm test`; phá thử từng ca đỏ. Phục vụ AC-1…AC-6, AC-9. `independent: false`.

## Task 5 — tài liệu

- Files: `docs/ops/runtime-map.md` (bảng «Ba trang Ops trên máy chủ đọc gì»: dòng Khoá an toàn, Máy móc), ROADMAP một
  dòng, `.claude/skills/onehub-ui/routes.md` (ghi chú dòng `/ops/collections`). `independent: true`, làm cuối.
