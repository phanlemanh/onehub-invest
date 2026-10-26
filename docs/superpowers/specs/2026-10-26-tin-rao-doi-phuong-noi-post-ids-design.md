# Thước tin rao đổi/mất phường nối qua bài đăng — thiết kế

Hàng `tin-rao-doi-phuong-noi-post-ids` (P3, Ngoài-4/6 của `tin-rao-gan-khu-vuc-dung`).

## 1. Hiện trạng

`scripts/kiem-tin-rao-gan-khu-vuc.mjs` (AC-8 của hàng trước) chụp `sale_offers` S03/S05/S06 trước và sau một lượt
transform trong transaction; `lech(truoc, sau)` chỉ xét tin còn cùng `offer_id` sau lượt. Mã tin S06 là băm của
`list_id` (bền), mã tin S03/S05 băm cả phường (transform-zalo, transform-fb) — đổi phường là đổi mã, mã cũ bị
`reconcile_stale_offers` loại. Thước vì vậy mù với S03/S05.

## 2. Thiết kế

1. **Hàm thuần `lechTheoBai(truoc, sau)`** trong `scripts/lib/doi-phuong.mjs` (không DB). Vào: hai `Map<offer_id,
   {offer_id, source, area_id, hop_le, post_ids}>`. Ra: `{ lech: [{offer_id, post_id|null, loai: "mat-phuong"|
   "doi-phuong", truoc, sau}], khongCon: [{offer_id, post_id|null, source}] }`. Luật, với mỗi tin `o` có phường hợp lệ
   trước lượt — so **theo từng bài**:
   - `o.post_ids` khác rỗng (S03/S05): với MỖI bài `p` của `o`, tìm tin sau lượt chứa `p` (bản đồ bài → tin của lần
     chụp sau): có → so `area_id` với `o.area_id` (NULL → `mat-phuong`, khác → `doi-phuong`, kèm `post_id`); không tin
     nào chứa `p` → `khongCon` (kèm `post_id`). Tin còn cùng mã nhưng một phần bài đã sang tin khác vẫn bị so từng bài.
   - `o.post_ids` rỗng (S06, mã băm `list_id` bền): so theo `offer_id`; mã không còn → `khongCon`.
2. **Phép đo dùng hàm mới** (`scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu`), một transaction:
   chụp 0 (dữ liệu thật) → chèn hai bài mồi (S03 qua `stg_zalo_posts`, S05 qua agent `apify-facebook`) nhắc tên một
   phường hợp lệ mồi → chạy ba transform (lượt A) → chụp 1 → đánh dấu `lac` phường mồi → chạy ba transform (lượt B) →
   chụp 2 → ROLLBACK.
   - Dòng chính: `lechTheoBai(chụp 0, chụp 1)` — tác dụng của bước gán mới lên tin thật — phải 0 lệch.
   - Đối chứng qua CÙNG hàm: `lechTheoBai(chụp 1, chụp 2)` phải bằng ĐÚNG hai bài mồi loại `mat-phuong` và 0 tin thật.
   - `khongCon` của cả hai lần so: mỗi bài phải không còn trong `stg_zalo_posts`; còn → thước đỏ «nối hỏng» gọi bài.
   - Các dòng hiện có (khu vực không hợp lệ trước/sau, khu vực lạc mồi, ROLLBACK) giữ nguyên, so chụp 0 với chụp 1.
