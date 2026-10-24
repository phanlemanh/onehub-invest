# Kế hoạch — o-kpi-chi-do-local (ON3, T2)

Hợp đồng: `_acceptance/o-kpi-chi-do-local/contract.md` (Cổng Phạm vi duyệt 24/10; Hỏi-1 = A — ô Lockdown cloud «—» kèm
badge warning «Chưa kiểm được trên cloud»). Design: `docs/superpowers/specs/2026-10-24-o-kpi-chi-do-local-design.md`.
**Điều kiện mở S3:** ON8 `gio-ops-gio-vn` đã vào main (bộ định dạng giờ VN, `lib/freshness.ts`) — gộp main trước task 1.
Sáu task tuần tự (chung `components/ops/**`).

| Người trực thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| (chưa thấy gì) Một chỗ dựng số cloud cho ba trang từ bản tin máy local | `app/src/lib/ops-cloud.ts` | AC-2…AC-6 (số đúng khối) |
| Dòng «Số đo lúc …» và cảnh báo «Máy local không đẩy số từ …» giống nhau ở mọi trang | `app/src/components/ops/facts-status.tsx` | AC-2, AC-4 (mốc đo, số cũ), AC-8 (chữ) |
| Tổng quan trên cloud có số thật, hết «Quá hạn 0» xanh | `app/src/app/ops/page.tsx`, `components/ops/overview/overview-tiles.tsx` | AC-1, AC-2, AC-4, AC-6 |
| Thu thập trên cloud có «Bản ghi 24h» thật, ô Lockdown hết đỏ giả | `app/src/app/ops/collections/page.tsx`, `collections-view.tsx`, `collections-tiles.tsx` | AC-1, AC-3, AC-4, AC-6 |
| Review trên cloud hiện «N thẻ đang chờ» | `components/ops/review-content.tsx` | AC-1, AC-5 |
| Bản bấm được ba trạng thái + phép đo | `scripts/ops-cloud-proto.mjs`, `app/tests/o-kpi-chi-do-local.test.tsx` | AC-1…AC-7, AC-10 |

## Task 1 — nguồn số cloud + dòng trạng thái

- Files: `app/src/lib/ops-cloud.ts` — `getCloudOpsView()`: một lần `readOpsFacts()` → `{state, measuredAt, coverage, feeds,
  pending}` (khối lỗi/vắng → `null`); `app/src/components/ops/facts-status.tsx` — `FactsStamp`, `FactsStaleAlert` (giờ VN
  qua bộ của ON8; ReUI `Alert variant="warning"`).
- Verify: `cd app && npx tsc --noEmit && npm run lint`. `independent: false`.

## Task 2 — Tổng quan

- Files: `ops/page.tsx` (cloud: số từ `getCloudOpsView`, stats bỏ câu chỉ-local), `overview/overview-tiles.tsx` (giá trị «—»,
  cờ `stale` làm số mờ và tắt badge `success`).
- Verify: như task 1 + render thử. `independent: false`.

## Task 3 — Thu thập

- Files: `collections/page.tsx`, `collections-view.tsx` (bỏ Alert 30′, dùng `FactsStaleAlert`), `collections-tiles.tsx`
  (Sức khoẻ nguồn, Bản ghi 24h từ khối; Lockdown cloud = «—» + `Badge variant="warning-light"` «Chưa kiểm được trên cloud»).
- Verify: như task 1. `independent: false`.

## Task 4 — Review

- Files: `review-content.tsx` (cloud: «N thẻ đang chờ» + `Badge variant="outline"` theo loại, trên `LocalOnlyAlert`).
- Verify: như task 1. `independent: false`.

## Task 5 — phép đo + bản bấm được

- Files: `app/tests/o-kpi-chi-do-local.test.tsx` (AC-1…AC-7; bản tin thật qua `capture-ops-facts` + handler ingest; lược
  đồ như cloud bằng `pipeline/scripts/ops-facts-fixture.mjs`, review_queue local để so đếm), `scripts/ops-cloud-proto.mjs`
  (lược đồ `ops_cloud_proto` ba chế độ none/fresh/stale cho dev server + E10).
- Verify: `cd app && npm test`; phá thử từng ca. Sau đó nghi thức design-pass trên bản bấm được (ảnh 8 trạng thái, sáng,
  tối, 390px). `independent: false`.

## Task 6 — tài liệu

- Files: `docs/ops/runtime-map.md` (mục số tổng hợp: ba trang đọc gì), ROADMAP một dòng, `onehub-ui/routes.md` (ghi chú ba
  dòng trang). `independent: true`, làm cuối.
