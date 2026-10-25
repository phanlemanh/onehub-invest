# Kế hoạch thi công — slo-mot-nguon (AU6, T2)

Hợp đồng: `_acceptance/slo-mot-nguon/contract.md` (Mạnh duyệt 24/10, Hỏi-1 = A). Thiết kế:
`docs/superpowers/specs/2026-10-23-slo-mot-nguon-design.md`. Các task chạy tuần tự (cùng chạm `ops-queries.ts`).

| # | Task | Files | Kiểm | Phục vụ |
|---|---|---|---|---|
| 1 | Định nghĩa trong app: `SLO_HOURS`, `TIME_SOURCE`, `PROBES`, `readFreshness`, `summarizeFreshness`, `fmtAge` (TS thuần, không import lúc chạy) | `app/src/lib/freshness.ts` | `npx tsc --noEmit` | E1, E4, E6 |
| 2 | Test khớp hai bản + chiều đỏ (bản sao TS đổi SLO S03) | `scripts/freshness-parity.test.mjs` | `node --test scripts/freshness-parity.test.mjs` | E1 |
| 3 | `getCoverageOverview` + `getSourceFeedHealth` đọc `readFreshness(pool)`; `CoverageRow` thêm `ageHours`/`sloHours` (giữ `ageDays`/`sloDays`); feed thêm trạng thái độ tươi | `app/src/lib/ops-queries.ts`, `app/src/components/ops/collections/feed-status.ts` | tsc | E2, E3, E7, E9 |
| 4 | UI `/ops`: đầu trang + ô «Đạt SLO» in `x/y nguồn đạt SLO` (`data-slo-summary`), lưới/ô quá hạn dùng `fmtAge` | `app/src/app/ops/page.tsx`, `components/ops/overview/{overview-tiles,objectives-grid,status}.tsx` | tsc + lint | E5, E6 |
| 5 | UI `/ops/collections`: tách `CollectionsView`; đầu trang + ô «Sức khoẻ nguồn» cùng chuỗi; lưới nguồn + «Cần chú ý» dùng `fmtAge`, trạng thái mới | `app/src/app/ops/collections/page.tsx`, `components/ops/collections/{collections-view,collections-tiles,section,feeds-grid,attention-list}.tsx` | tsc + lint | E3, E5, E6 |
| 6 | Test app trên lược đồ tạm DB local (AC-2…AC-7, AC-9), chiều đỏ từng AC | `app/tests/slo-mot-nguon.test.tsx` | `cd app && npm test` | E2–E7, E9 |
| 7 | Hướng dẫn ops-check | `.claude/skills/ops-check/SKILL.md` | đọc | E8 |
| 8 | `/verify` app + scripts → contract `implemented` → S4 | — | — | — |
