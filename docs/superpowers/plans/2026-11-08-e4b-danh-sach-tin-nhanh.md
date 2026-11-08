# E4b — danh sách tin công khai nhanh (kế hoạch)

Thiết kế: `docs/superpowers/specs/2026-11-08-e4b-danh-sach-tin-nhanh-design.md`. Hồ sơ: `_acceptance/e4b-danh-sach-tin-nhanh/`.
Các task phụ thuộc nhau theo thứ tự, làm tuần tự trong phiên.

## T1 — Đổi câu trang của `getPublicOffers` (`app/src/lib/offers-public.ts`)
- Hàm `nhieuTen(them)` sinh thân CTE đếm tên; `NHIEU_TEN = WITH ${nhieuTen()}` giữ đúng chữ cũ cho trang tin.
- Câu trang: CTE `khoa` (offer_id, seller_ref, total và with_phone theo hàm cửa sổ) → `nhieu_ten` giới hạn `seller_ref IN khoa`
  → nối lại `sale_offers` theo `offer_id`, cùng `ORDER`.
- Trang rỗng: offset 0 → total 0, withPhone 0; offset > 0 → câu đếm cũ.

## T2 — Test DB máy thu (`app/tests/tin-rao-doi-chieu.test.tsx`)
- `pool.end()` dời sang `after` để các ca sau dùng chung pool.
- E4B-AC-3: câu cũ viết tay (CTE toàn bảng + trang, câu đếm song song) xen kẽ với `getPublicOffers`, ba lượt, lấy nhanh nhất.
- E4B-AC-4: 16 tổ hợp viết trước, so dãy offerId, cờ nhiều tên, total, withPhone; đối chứng dương số dòng nhiều tên; bản phá
  đếm trong trang đỏ `LECH CAU CU`.
- E4B-AC-7: đọc chính tệp, ghim chữ của khối đo thời gian E4b; bản chữ đổi trần đỏ `TRAN BI NOI`.

## T3 — Test lược đồ tạm (`app/tests/tin-rao-cong-khai.test.tsx`)
- Viết lại bản phá «đếm sau lọc» theo câu mới; thêm bản phá «đếm trong trang» đỏ `NHIEU TEN`.
- E4B-AC-6: năm tin hiện, hai có số, một tin ẩn; trang đầu, offset vượt cuối, lọc rỗng; bản phá bỏ câu đếm dự phòng đỏ
  `TOTAL TRANG RONG`.

## T4 — Phá thử
Mỗi phép đo mới chạy một lần trên bản phá để thấy đỏ đúng thông điệp ghim; ghi bảng vào mục dưới.

## Phá thử

(điền sau T4)
