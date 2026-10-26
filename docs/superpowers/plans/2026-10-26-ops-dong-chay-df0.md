# Kế hoạch thi công — ops-dong-chay-df0

Hồ sơ: `_acceptance/ops-dong-chay-df0/` (Cổng Phạm vi Mạnh duyệt 26/10, 10 tiêu chí). Mã proto + DF0 đã có ở
`c9794e3d`, `8a54fcdc`; kế hoạch này chỉ phủ phần còn thiếu để các eval chạy được.

| Task | Việc | Files | Verify | Phục vụ | independent |
|---|---|---|---|---|---|
| T1 | Nút tiêu đề hàng không tự mở sheet (cú bấm đi lên onRowClick) | `app/src/components/ops/data-flow/records-grid.tsx` | tsc + bấm chuột thật trên bản chạy | E6 | false |
| T2 | Bộ nạp ảnh tin theo quyền (`loadFlowMedia`: chỉ admin, S03/S05 theo `post_ids`, gọi `buildOfferImages`, 42P01 → {}) + trang truyền media + hồ sơ tin hiện `ReviewPhotos`, câu S06 | `app/src/lib/data-flow-queries.ts`, `app/src/app/ops/data-flow/page.tsx`, `app/src/components/ops/data-flow/{data-flow-view,records-grid,record-sheet}.tsx` | tsc + lint | E15, E16, E7 | false |
| T3 | Tệp test `app/tests/ops-dong-chay.test.tsx`: DF-AC-1/2/3/5/6/8/10, mỗi ca có chiều đỏ (đột biến cùng fixture, thông điệp ghim); lược đồ tạm `df0_<pid>` LIKE public.* | `app/tests/ops-dong-chay.test.tsx` | `cd app && node --import tsx --test tests/ops-dong-chay.test.tsx` | E1–E3, E5, E6, E8, E15, E16 | false |
| T4 | Cấu hình `app-3461` trong `.claude/launch.json` cho bản chạy dãy U2 (E7) | `.claude/launch.json` | `preview_start app-3461` | E7 | true |

Thứ tự: T1 → T2 → T3 (T3 dùng API của T2); T4 lúc nào cũng được. Mỗi đột biến chạy trong ca test bằng bản sao hàm
(hoặc câu SQL) đổi đúng một vế — không sửa mã thật.
