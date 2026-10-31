# Thiết kế: proxy ảnh tin chặn SVG (proxy-anh-chan-svg)

Hồ sơ: `_acceptance/proxy-anh-chan-svg/` · hạng T3 (route mang dữ liệu tầng A) · dãy U1 · hàng HD16 · nguồn: Ngoài-1+3 của HD10 (Mạnh chọn «mở hợp đồng mới» 31/10).

## Vấn đề

`layAnhGoc` chỉ kiểm `content-type` bắt đầu bằng `image/` rồi trả nguyên kiểu của nguồn. `image/svg+xml` là tài liệu có thể chứa
script; phục vụ nó trên origin của app, không `nosniff`, không CSP, thì mở thẳng `/api/zalo-media?media=<khoá>` ở tab mới chạy
script trong phiên Ops. Nhánh ảnh đã tải (`sendImage`) đã giới hạn theo đuôi tệp (jpeg/png/webp/gif) nhưng cũng thiếu hai header.

## Cách làm

1. **Danh sách cho phép** trong `lay-anh-goc.ts`: `image/jpeg`, `image/png`, `image/webp`, `image/gif` — cùng tập với bảng `MIME`
   của `zalo-media.ts`. Kiểu so sau khi bỏ tham số và hạ chữ thường; `image/jpg` (bí danh không chuẩn mà CDN hay gửi) quy về
   `image/jpeg`. Phản hồi 200 mang kiểu ĐÃ CHUẨN HOÁ, không chép chuỗi của nguồn.
2. **Mã lỗi**: `image/*` ngoài danh sách (SVG, x-icon, bmp, tiff, avif, heic…) → **415** thân chữ chung; không phải `image/*` vẫn
   502 như bảng chặn của HD10 (không đổi).
3. **Header an toàn chung** `HEADER_ANH_AN_TOAN` (xuất từ `lay-anh-goc.ts`): `X-Content-Type-Options: nosniff` và
   `Content-Security-Policy: sandbox; default-src 'none'`. Gắn vào: phản hồi 200 của bộ lấy ảnh, mọi phản hồi lỗi của bộ lấy
   ảnh, và phản hồi 200 của `sendImage` (nhánh `?media=` có `local_file` và nhánh `?snapshot=`).
4. Không đổi quyền, khoá, bảng chặn SSRF, hay loader thẻ duyệt.

## Phương án đã loại

- **Soi byte đầu (magic bytes) thay vì tin `content-type`** — chặt hơn nhưng to hơn; với `nosniff` + danh sách raster, một tệp
  SVG khai là `image/png` sẽ bị trình duyệt hiển thị như ảnh hỏng, không chạy script. Ghi Notes.
- **Cho qua `image/avif`** — định dạng raster hợp lệ, nhưng phạm vi giám sát giao chỉ bốn kiểu; ảnh avif sẽ hiện «ảnh hỏng».

## Ngoài phạm vi

- Soi byte đầu của ảnh.
- Cho phép avif/heic.
- Đổi bảng chặn SSRF (Ngoài-2 của HD10, đã ghi Known limits).
