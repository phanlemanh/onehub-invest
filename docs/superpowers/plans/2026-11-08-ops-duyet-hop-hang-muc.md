# Kế hoạch thi công — OD2 ops-duyet-hop-hang-muc

Hợp đồng: `_acceptance/ops-duyet-hop-hang-muc/contract.md` (Mạnh duyệt 08/11, nhận khuyến nghị Hỏi-1..3). Thiết kế:
`docs/superpowers/specs/2026-11-08-ops-duyet-hop-hang-muc-design.md`. Mã của việc 1–6 đã viết trước Cổng Phạm vi để chạy
design-pass trên route thật (host-embedded); kế hoạch ghi lại đúng các việc đó và việc còn lại.

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | Độc lập |
|---|---|---|---|---|---|
| 1 | Ba số đầu trang | `lib/ops/review-dau-trang.ts`, `review-content.tsx` | ca `OD2-AC-1` | E1 | có |
| 2 | Hộp hạng mục + `?category=` | `lib/ops/review-hop-hang-muc.ts`, `review/review-hop-hang-muc.tsx`, `review/review-queue.tsx`, `app/ops/review/page.tsx` | ca `OD2-AC-2`, `OD2-AC-2-DB` | E2, E10, E11 | có |
| 3 | Chế độ duyệt (thẻ kế trong cùng sheet, hết thẻ) | `review/review-queue.tsx`, `review/review-detail-sheet.tsx` | ca `OD2-AC-3-UI`, `OD2-AC-3-DB` | E3, E8 | sau 2 |
| 4 | Phím + bảng phím | `review/use-phim-duyet.ts`, `review/review-phim-tat.tsx`, `review-card.tsx` (`NutDapAn`) | ca `OD2-AC-4` | E4, E9 | sau 3 |
| 5 | Hoàn tác 5 giây, xả khi rời trang hay bị gỡ | `review/hang-gui.tsx`, `review-card.tsx` (`useDecide`) | ca `OD2-AC-5`, `OD2-AC-5-DB` | E5 | sau 3 |
| 6 | Quyết định gần đây | `lib/ops/review-gan-day.ts`, `review/review-gan-day.tsx` | ca `OD2-AC-6` | E6 | có |
| 7 | Lý do mặc định theo đáp án | `review-card.tsx`, `review-card-nguoi.tsx`, `lib/ops/review-hang-muc.ts` (`batGoLyDo`), `review/review-reason.tsx` | ca `OD2-AC-7`, `OD2-AC-7-DB` | E7 | có |
| 8 | Bộ test OD2 với chiều đỏ ghim (bản chép đột biến `tests/.od2-cu-*`) | `app/tests/ops-duyet-hop-hang-muc.test.tsx` | `cd app && npm test` | E1–E7 | sau 1–7 |
| 9 | Từ vựng, bản đồ trang, danh mục khuôn, ROADMAP | `CONTEXT.md`, `routes.md`, `catalog.md`, `docs/ROADMAP.md` | `npm run test:lint-rules` | E10 | có |

Kiểm cả vòng: `cd app && npx tsc --noEmit && npm run lint && npm test`.
