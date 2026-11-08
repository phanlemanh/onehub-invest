# Kế hoạch thi công — OD1 ops-duyet-nhip-va-chu

Hợp đồng: `_acceptance/ops-duyet-nhip-va-chu/contract.md` (Mạnh duyệt 08/11). Thiết kế:
`docs/superpowers/specs/2026-11-08-ops-duyet-nhip-va-chu-design.md`. Mã của các việc 1–6 đã viết trên nhánh trước Cổng Phạm vi
để chạy design-pass trên route thật (host-embedded); kế hoạch này ghi lại đúng các việc đó và việc còn lại.

| # | Việc | Tệp | Kiểm từng việc | Phục vụ | Độc lập |
|---|---|---|---|---|---|
| 1 | Hạng mục duyệt + nhãn đáp án (hàm thuần) | `app/src/lib/ops/review-hang-muc.ts`, `review-queue.ts` | ca `OD1-AC-3`, `OD1-AC-8` | E3, E8 | có |
| 2 | Route decide ghi nhịp (`elapsed_ms`, `since_prev_seconds`, `category`) | `app/src/app/api/v1/ops/review/[id]/decide/route.ts` | ca `OD1-AC-1-ROUTE`, `OD1-AC-2` | E1, E2 | sau 1 |
| 3 | Đồng hồ thẻ ở trình duyệt, nhãn trạng thái theo đáp án | `review-card.tsx`, `review-card-nguoi.tsx`, `review/review-badges.tsx` | ca `OD1-AC-1-UI`, `OD1-AC-8` | E1, E8 | sau 1 |
| 4 | Bảng «Nhịp duyệt 7 ngày», bộ nạp, `?card=` | `lib/ops/review-nhip.ts`, `review-nap.ts`, `review/review-nhip.tsx`, `review-content.tsx`, `review/review-queue.tsx`, `app/ops/review/page.tsx` | ca `OD1-AC-4`, `OD1-AC-10`, `OD1-AC-10-DB`, `OD1-AC-8-NHANH` | E4, E10, E8 | sau 2 |
| 5 | Thẻ sạch: gọt điểm, so trên số hiện, ảnh hỏng một dòng | `review-queue.ts`, `review-can-cu.ts`, `review-photos.tsx` | ca `OD1-AC-5`, `OD1-AC-5-DB`, `OD1-AC-6`, `OD1-AC-7` | E5, E6, E7, E14 | có |
| 6 | Căn giá tốt báo căn chờ ghép | `lib/ops/review-cho-ghep.ts`, `deal-cho-ghep.tsx`, `deals-grid.tsx`, `deal-sheet.tsx`, `deal-body.tsx`, `app/ops/deals/**` | ca `OD1-AC-9` | E9 | có |
| 7 | Từ vựng + bản đồ trang | `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md` | `npm run test:lint-rules` | E13 | có |
| 8 | Test cũ theo hành vi mới | `app/tests/review-*.test.tsx`, `the-duyet-du-can-cu.test.tsx`, `ops-nhan/visible-strings.ts` | `npm test` của app | E12 | sau 1–6 |
| 9 | ROADMAP §2 as-built + §4 trạng thái | `docs/ROADMAP.md` | đọc lại | — | có |

Kiểm cả vòng: `cd app && npx tsc --noEmit && npm run lint && npm test` (đỏ sẵn trên nền: E4b đo tốc độ DB máy thu, ghi ở
`duong-nen.md`).
