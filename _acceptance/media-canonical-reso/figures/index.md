# Hình tại điểm quyết định — media-canonical-reso (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Dòng chảy ảnh: bảng nạp → bên ghi → bảng `media` → hai loader → hai màn (design §2) | 5 bước nối tiếp | `dong-chay-anh` |
| Hỏi-1: thay năm ô đã ký bằng tiêu chí NH1, hay giữ đường đọc bài song song (design §2.4) | 2 nhánh rẽ | `hoi-1-thay-tieu-chi` |
| Hỏi-2: ngưỡng + timebox 3 ngày | dưới ngưỡng: 1 lựa chọn một chiều | — |
| Bảng chỉ ở máy thu (không lên cloud) | dưới ngưỡng: 1 bước | — |

## Đề bài `dong-chay-anh`

- Loại: luồng dữ liệu trái → phải, hai làn (S06 trên, S03/S05 dưới) nhập vào một bảng.
- Nút: `stg_chotot_ads.images` (S06) · `stg_zalo_posts.media_files + media` (S03/S05, theo `post_ids`) → `transform-media.mjs` (job_run sau transform mỗi nguồn) → bảng `media` (RESO Media, khoá `offer_id`) → `loadOfferMedia` + `buildMediaImages` → `/ops/review` (dải ảnh thẻ) và hồ sơ tin `/ops/data-flow`.
- Một ranh giới đứt nét «máy thu | cloud»: bảng `media` ở phía máy thu; mũi tên tới cloud bị chặn, nhãn «không vào FILL, leak gate đếm».
- AC: AC-2, AC-3, AC-5, AC-6, AC-9.

## Đề bài `hoi-1-thay-tieu-chi`

- Loại: cây hai nhánh từ một câu hỏi.
- Gốc: «Hai hồ sơ đã ký ghim điều NH1 đổi».
- Nhánh A (máy khuyên): năm ô cũ (`review-media-backend` E6, E7, E8 · `ops-dong-chay-df0` E15, E16) → `not-run + superseded_by` → AC-5, AC-6, AC-7 của NH1 · E5 giữ làm thước đối chiếu · một nguồn sự thật.
- Nhánh B: giữ đường đọc bài song song → hai nguồn sự thật cho dải ảnh · S06 vẫn không ảnh ở đường cũ.
- AC: AC-5, AC-6, AC-7, AC-10.
