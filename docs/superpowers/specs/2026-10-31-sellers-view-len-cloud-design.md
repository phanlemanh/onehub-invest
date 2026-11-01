# sellers-view-len-cloud — phần cloud của 060 không làm gãy sync (Ngoài-2 của SD3)

Hồ sơ: `_acceptance/sellers-view-len-cloud/` · hàng P4 (giám sát giao 31/10, chuyển từ P2) · sau `sdt-luu-goc-e164` (#247).

## Vấn đề

060 (SD3) đổi `sellers` ở máy thu thành VIEW trên bí danh `sdt` + tin. Trên Supabase, `sellers` là ĐÍCH GHI của
`pipeline/sync-cloud.mjs`: lượt tráo `DELETE FROM public.sellers` rồi chèn qua `jsonb_populate_record(NULL::public.sellers, …)`.
View trên cloud lại đọc `registry_aliases`, `sale_offer_records` — hai bảng chỉ ở máy thu. Ai áp nguyên 060 lên cloud thì
câu tạo view lỗi, hoặc (nếu dựng được) lượt tráo gãy và `/ops/quality` trên cloud mất số người bán. Header 060 không ghi
«không áp lên Supabase» (Ngoài-9, đã chấp nhận) và migration đã commit không sửa được.

## Lệ của kho

Migration không áp nguyên văn lên Supabase: mỗi migration có phần cloud riêng ở `docs/ops/cloud-schema-catchup-<ngày>-<số>.sql`
(khối ĐO TRƯỚC chỉ đọc + khối ÁP, Mạnh duyệt rồi mới chạy) — tiền lệ 043, 050; 053 (media) ghi rõ «không cần áp lên Supabase».

## Thiết kế

1. **Cloud giữ `sellers` là bảng; sync đổ từ view máy thu** — đúng như hôm nay sau khi 060 áp máy thu (lượt sync đọc view bằng
   `localReadSql`, ghi bảng cloud). Không đổi tên bảng cloud: `/ops/quality` trên cloud đọc `count(*) FROM sellers`.
2. **Chốt trong sync (pha catalog):** mọi bảng đích của FILL trên cloud phải là bảng thường (`relkind` `r` hoặc `p`). Gặp view
   hay materialized view → dừng ở pha catalog, TRƯỚC khi gửi dòng nào lên staging, với thông điệp gọi tên bảng và trỏ tệp
   catch-up 060. Hàm thuần `dichKhongPhaiBang(rows)` để test được không cần DB.
3. **Tệp catch-up cloud của 060** `docs/ops/cloud-schema-catchup-2026-10-31-060.sql`: ĐO TRƯỚC (cloud `sellers` là bảng, đúng
   cột của CLOUD_ALLOW, cloud không có `registry_aliases`) + khối ÁP rỗng có chủ ý — phần cloud của 060 chỉ là khoá băm đổi
   giá trị (Hỏi-1 SD3: đổi một lần), đi qua lượt sync kế; KHÔNG chạy `db/migrations/060_sdt_e164.sql` trên Supabase.

## Ngoài phạm vi

- Áp gì lên Supabase (vẫn cần Mạnh duyệt riêng sau khi gộp); sửa header 060 (đã commit).
- Đổi tên bảng cloud hay thêm bảng cloud mới; đưa số gốc lên cloud.

## Đặc tả UX

Bỏ — không đổi giao diện.
