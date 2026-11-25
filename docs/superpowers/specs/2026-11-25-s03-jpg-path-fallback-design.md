# ZC16 · s03-jpg-path-fallback — thiết kế

Hàng ZC16 (dãy ZT), xếp trên ZC15 (cùng `media-fetch.ts`). Nhánh làn thu `zcode/s03-jpg-path-fallback` @f6dcdf3fe gộp vào
nhánh hồ sơ, gộp tay với ZC15.

## Bài toán

Từ khoảng 19–20/11 link ảnh S03 có đoạn `/jpg/` trong đường dẫn; CDN trả 400 cho biến thể này, bỏ `/jpg/` thì 200 (làn thu
đo 10/10, ZT đo 6/6 ngày 25/11). Header của URL thay thế ghi `image/jxl` nhưng byte là JPEG (`FF D8`). Đo DB máy thu: bài mất
hết ảnh có ảnh 400 `/jpg/` 22/11 1.201 · 23/11 856 · 24/11 1.069; tỉ lệ mất hết 24/11 27,5%.

## Thay đổi

1. `fetchMessageMedia`: tải ra `http-400` và `pathname` có `/jpg/` → thử ĐÚNG MỘT lần URL bỏ đoạn `/jpg/` đầu tiên (cùng
   host — đã qua danh sách cho phép, và kiểm host cuối sau chuyển hướng vẫn áp như mọi lần tải). Thử lại lỗi thì giữ lỗi gốc.
2. Tên tệp băm theo URL ĐÃ TẢI. `meta.mediaFiles` giữ đúng năm khoá (`url` = URL gốc nguyên văn, `file`, `sha256`, `bytes`,
   `error`) — không ghi `urlFetched` (phán GS 25/11): DATA-CONTRACT, `schemaVersion`, bộ nạp S03 không đổi. URL đã tải tính
   lại được từ `url` theo luật thử lại tất định.
3. Đuôi tệp theo byte (luật ZC15 `isJpegXl`): byte JPEG XL → `.jxl`; còn lại theo đuôi trong đường dẫn đã tải, mặc định
   `.jpg`. Không đoán theo `content-type` (URL thay thế nói `image/jxl` mà byte là JPEG).

## Không làm

`urlFetched` (hàng riêng nếu làn thu cần, kèm tăng schemaVersion + bộ nạp) · tải bù bài cũ · lỗi 400 không có `/jpg/`, 404 ·
đọc/thu nhỏ JPEG XL phía sau (HT22 của P3).

## Áp lên máy thu

Chung một lần với ZC15: build `collector/dist` từ `main`, khởi động lại `com.oneinvest.collector-api` (**lời riêng của Mạnh**).
Chi tiết: `_acceptance/s03-jpg-path-fallback/ap-may-thu/README.md`.
