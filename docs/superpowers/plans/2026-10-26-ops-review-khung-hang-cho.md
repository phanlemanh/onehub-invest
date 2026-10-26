# Kế hoạch thi công — ops-review-khung-hang-cho (UI1)

Hợp đồng: `_acceptance/ops-review-khung-hang-cho/contract.md` (Mạnh duyệt 26/10). Bản bấm được đã dựng ở S1 (commit
5cbab14e): `components/ops/review/*`, `lib/ops/review-queue.ts`, `review-card.tsx`, `review-content.tsx`, `page.tsx`.
S3 chỉ còn phép đo, cấu hình, tài liệu UI. Mọi task chạm cùng vùng → tuần tự (`independent: false`).

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Máy chấm có lệnh chạy smoke trình duyệt và design gate cho trang mới | `_acceptance/config.yaml` | E2, E6, E9, E10, E17, E19 (đo trên bản chạy thật) |
| Bảng, lọc, ngăn chi tiết, ảnh, quyết định, trạng thái vùng được kiểm trong jsdom | `app/tests/review-queue.test.tsx` | AC-1…AC-6, AC-8, AC-9 (ca RQ-AC-n) |
| Ca test cũ của thẻ khớp Q9 và nhãn nút mới | `app/tests/review-card.test.tsx` | AC-6 (Hỏi-1 đã duyệt), AC-5 |
| Trang chạy thật được kiểm số dòng, ảnh, không độ tự tin, 390 px, bấm quyết định với đường ghi bị chặn | `scripts/smoke-review-queue.mjs` | AC-1, AC-4, AC-5, AC-6, AC-7 |
| Bản đồ trang và danh mục khối nói đúng khung mới | `.claude/skills/onehub-ui/routes.md`, `catalog.md` | AC-10 (tài liệu UI nhất quán) |
| Baseline lint giảm theo phần vi phạm đã dọn | `app/eslint-suppressions.json` | AC-10 (lint sạch) |

## Task 1 — cấu hình executor (independent: false)
- Files: `_acceptance/config.yaml` (thêm `executors.script.review_queue_smoke`, `executors.script.review_queue_design_gate`;
  không đổi khoá cũ — yêu cầu U1-25).
- Verify: `node -e` đọc YAML thấy hai khoá; `grep` khoá cũ không đổi.
- Phục vụ: E2, E6, E9, E10, E17, E19.

## Task 2 — test jsdom (independent: false)
- Files: `app/tests/review-queue.test.tsx` (mới), `app/tests/review-card.test.tsx` (vế 85% → vắng «%»; nhãn nút bỏ emoji).
- Verify: `cd app && node --import tsx --test tests/review-queue.test.tsx tests/review-card.test.tsx`; phá-thử từng chiều
  đỏ đã khai trong evals (bỏ lọc mặc định, «Loại khác» khớp entity_match, sheet đọc media sai thẻ, trả lại fmtConfidence,
  sheet tra danh sách đã lọc, Suspense → Fragment, nút thoát về mặc định) → ca đỏ đúng thông điệp ghim, rồi hoàn lại.
- Phục vụ: E1, E3, E4, E5, E7, E8, E11, E12.

## Task 3 — smoke trình duyệt (independent: false)
- Files: `scripts/smoke-review-queue.mjs` (mới; Playwright mượn từ `app/node_modules`; host `ui1.localhost` mặc định
  vì `127.0.0.1` không hydrate trên dev Next 16; tài khoản thử admin + tài khoản ops thử tạo/xoá trong lượt; route
  decide chặn bằng `page.route`).
- Verify: `BASE_URL=http://ui1.localhost:3460 node scripts/smoke-review-queue.mjs` exit 0; phá-thử: tắt chặn route →
  script phải FAIL trước khi bấm (rào an toàn), và đổi bộ đếm ảnh kỳ vọng → FAIL có tên.
- Phục vụ: E2, E6, E9, E10, E19.

## Task 4 — tài liệu UI + baseline (independent: false)
- Files: `routes.md` dòng `/ops/review`, `catalog.md` dòng `@reui/solution-agents-5`, `app/eslint-suppressions.json`
  (`npx eslint . --prune-suppressions`).
- Verify: `cd app && npx tsc --noEmit && npm run lint`; `node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs`;
  design gate `review-queue.tsx`.
- Phục vụ: E14, E16, E17, E18.
