# Plan — listings-filters-store-locator (UI6)

Hợp đồng đã duyệt 2026-10-26 (Mạnh, Hỏi-1..5 theo khuyến nghị). Bản bấm được dựng ở S1 đã là code thật trên nhánh, nên
S3 chỉ còn rà và chốt — không có việc mới nào ngoài hợp đồng.

| # | Task | Files | Verify | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Vendor mapcn + registry + ngoại lệ lint + CSS [data-mapcn] (đã có) | `app/components.json`, `app/src/components/ui/map.tsx`, `app/eslint.config.mjs`, `app/src/app/globals.css` | `node --import tsx --test tests/listings-browse.test.tsx` (LB-AC-1) | E1 | false |
| 2 | Cây lọc thuần + thanh chip + ngăn lọc (đã có) | `listing/listing-filter-query.ts`, `listings-filter-bar.tsx`, `listings-filter-sheet.tsx` | LB-AC-2..4 + phá-thử gte/facetCounts/rest | E2–E6 | false |
| 3 | Bản đồ mapcn + lọc vùng + popup (đã có) | `listing/listings-map.tsx` | smoke `scripts/smoke-listings-browse.mjs` | E7–E9 | false |
| 4 | Ảnh thẻ + truy vấn photoUrls (đã có) | `listing/listing-card.tsx`, `lib/queries.ts`, `listing/listing-tables.tsx` | LB-AC-8 + smoke ảnh | E10–E12 | false |
| 5 | Vùng tải/trống/lỗi (đã có) | `listings-page-body.tsx`, `listings-region.tsx`, `listings-explorer.tsx`, `page.tsx` | LB-AC-9 | E13 | false |
| 6 | Tài liệu chuẩn UI + ROADMAP §2/§4 | `.claude/skills/onehub-ui/{routes,catalog,SKILL}.md`, `docs/ROADMAP.md` | `npm run test:lint-rules` (routes map) | E15, E16 | false |
| 7 | Kiểm máy toàn app | — | `cd app && npx tsc --noEmit && npm run lint && npm test` | E14 | false |

Không task nào độc lập để chạy song song (cùng thư mục `listing/`, task 7 cần tất cả) → S3 tuần tự trong phiên.
