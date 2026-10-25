# Kế hoạch thi công — compare-saved-trang-thai (UI4, T2)

> Hồ sơ: `_acceptance/compare-saved-trang-thai/` (Cổng Phạm vi Mạnh duyệt 24/10, commit `b624563`).
> Design doc: `docs/superpowers/specs/2026-10-24-compare-saved-trang-thai-design.md`.
> Phần lớn code đã dựng ở S1 làm bản bấm được cho design-pass (Cổng Phạm vi duyệt UI trên bản chạy, không bằng chữ);
> kế hoạch này ghi đúng hiện trạng từng task và phần còn phải làm ở S3. Không task nào song song được (chung các tệp
> `compare/*`, `saved/*`, test chung một tệp) → `independent: false` cho cả bảng, chạy tuần tự trong vòng chính.

| # | Người dùng thấy gì khác | Đụng đâu | Phục vụ | Hiện trạng | independent |
|---|---|---|---|---|---|
| 1 | Link cũ /so-sanh tự sang /compare (301, giữ khu vực) | `app/next.config.ts`, `(app)/compare/page.tsx`, `route-slugs.test.mjs` | E1, E2 | xong ở S1 | false |
| 2 | Mọi nút/menu So sánh trỏ /compare | `shell/nav.tsx`, `insight-actions.tsx`, `marketing-navbar.tsx`, `saved-list.tsx`, `scripts/audit-all.sh` | E3 | xong ở S1 | false |
| 3 | Hai trang có đầu trang chuẩn, tải có khung chờ, lỗi báo tại vùng | `compare/compare-body.tsx`, `saved/saved-body.tsx`, `states/region-error.tsx`, `*-skeleton.tsx`, `saved-filter.tsx`, `compare-add-area.tsx` | E4–E7, E17, E18 | xong ở S1 | false |
| 4 | Đã lưu trống dùng khối bookmark (c-empty-11); So sánh trống không chú thích Ô xanh | `saved/saved-empty.tsx`, `compare/comparison.tsx` | E8, E9 | xong ở S1 | false |
| 5 | Ảnh đại diện khu vực trên So sánh + Đã lưu (góp ý Mạnh ở cổng) | `lib/queries.ts` (`getAreaThumbnails`), `page/area-thumbnail.tsx`, `saved-item.tsx`, `comparison.tsx` | E14, E19, E20 | xong ở S1 | false |
| 6 | Hết 4 vi phạm lint của nhóm trang | `eslint-suppressions.json`, `comparison.tsx`, `saved-item.tsx`, `saved-list.tsx` | E10, E11, E15, E16 | xong ở S1 | false |
| 7 | Tài liệu nói cùng một điều về /compare, trạng thái mới, ảnh đại diện | `routes.md`, `catalog.md`, `CONTEXT.md`, `portals.md` (2 nơi), `app/CLAUDE.md` | E12, E13 | **còn**: catalog thêm AreaThumbnail/getAreaThumbnails; routes.md ghi ảnh đại diện; CONTEXT.md thêm thuật ngữ «Ảnh đại diện»; design doc thêm mục ảnh | false |
| 8 | Phép đo mới có chiều đỏ | `scripts/smoke-compare-saved.mjs` | E1, E4, E5, E8 | **còn**: lượt phá-thử smoke (redirect 308 → smoke đỏ nêu «nhận 308») trên dev :3460, rồi hoàn lại | false |

## Verify từng task (luật kho: verify = typecheck + lint + test của module)

- Task 1–6: `cd app && npx tsc --noEmit && npm run lint && npm test && npm run test:lint-rules` + `BASE_URL=http://localhost:3460 node scripts/smoke-compare-saved.mjs`.
- Task 7: `cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`.
- Task 8: smoke trên config đã phá phải exit 1 với dòng `FAIL /so-sanh?areas=… → 301 … (nhận 308 …)`; hoàn lại rồi smoke exit 0.

## Xong S3 khi

Task 7–8 xong, `/verify` (skill kho) xanh, commit code, contract `status: implemented`, rồi S4.
