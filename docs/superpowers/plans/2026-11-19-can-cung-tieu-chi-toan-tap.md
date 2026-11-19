# Kế hoạch thi công: Căn cùng tiêu chí trên toàn tập (CG17)

Hồ sơ `_acceptance/can-cung-tieu-chi-toan-tap/` (approved 19/11). Thiết kế: `docs/superpowers/specs/2026-11-19-can-cung-tieu-chi-toan-tap-design.md`.
Mọi task phụ thuộc nhau (cùng `deals.ts`), làm tuần tự trong vòng chính.

## T1 — Lõi so cùng tiêu chí trên tập nhẹ (`app/src/lib/deals-chi-tiet.ts`, `app/src/lib/deals.ts`)

- Hàm thuần `locCungTieuChi(d, tap, chiPhuong)` trên dòng nhẹ (mã căn, mã phường, loại hình, m², xác minh, mức giảm, mã tin): cùng `area_id`,
  cùng loại hình, ±25% (ứng viên thiếu trường bị loại khi căn đang xem có trường), loại chính căn theo `can_key`; xếp xác minh cuối, giảm
  nhiều trước, mã căn tăng dần. `canCungTieuChi` cũ giữ cho danh sách lùi.
- `getDealsTrang` thêm `trang.cungTieuChi[offerId] = { tieuChi, phuong }` cho các căn của trang, đếm trên `nhe` (không thêm SQL).
- `getCanCungTieuChi(offerId, thamSo, chiPhuong)`: đọc lại tập nhẹ theo `kind/type/location/project`, lọc, cắt 20, đọc đầy đủ bằng
  `dealsTheoMaSql`, trả `{ moTa, bo, tong, rows }`.
- `trangCuaCan(offerId)`: tìm căn trong tập nhẹ theo `kind` của căn, trả `{ kind, page }` cỡ mặc định, hay null; thay `dealTrongDanhSach`.
- Phục vụ E1, E2, E3, E4, E5, E13. Verify: `cd app && npx tsc --noEmit`.

## T2 — Server action (`app/src/app/ops/deals/actions.ts`)

- `"use server"`; kiểm phiên + `canAccessOps`; vai theo `xemNoiDungTin`; lọc `dealTheoVai` + `dealHang`; trả `{ tong, moTa, bo, can }` hay ném lỗi.
- Phục vụ E7. Verify: tsc.

## T3 — Giao diện (`deal-sheet.tsx`, `deal-similar.tsx`, `deals-grid.tsx`)

- Nhãn tab đọc `trang.cungTieuChi`; `DealSimilar` nhận `tai` (gọi action) khi có `trang`: Skeleton, lỗi + «Thử lại», bỏ kết quả về muộn,
  «Hiện 20 / N căn cùng tiêu chí», nút «Xem mọi căn trong phường (M)»; căn ngoài trang → `/ops/deals/<mã>`.
- Phục vụ E2, E3, E6, E8. Verify: tsc + lint app.

## T4 — Crumb trang một căn (`app/src/app/ops/deals/[offerId]/page.tsx`)

- Crumb dùng `trangCuaCan`: `/ops/deals?kind=…&page=…&can=…` hay `/ops/deals`. Phục vụ E13.

## T5 — Ca đo + đo máy thu (`app/tests/can-cung-tieu-chi*.test.tsx`, `_acceptance/can-cung-tieu-chi-toan-tap/probes/`)

- `doc.sh AC-n` chạy ca theo tên `CG17-AC-n `; fixture dựng như CG3 (DB riêng từ migration), kỳ vọng viết tay; mỗi phép đo có đối chứng
  dương và đột biến đỏ đúng thông điệp.
- `do-may-thu.sh`: DB máy thu chỉ đọc, một snapshot, lệnh đếm độc lập không import hàm của màn; đo thời gian riêng.
- Phục vụ E1–E9, E13.
