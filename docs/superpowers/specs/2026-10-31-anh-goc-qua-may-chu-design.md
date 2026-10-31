# Thiết kế: ảnh tin chỉ có URL gốc đi qua máy chủ (anh-goc-qua-may-chu, HD10)

Hồ sơ: `_acceptance/anh-goc-qua-may-chu/` · hạng T3 (chạm lớp quyền xem ảnh, tầng A) · dãy U1 · nguồn: audit hàng duyệt
30/10 (`docs/research/audit-hang-duyet-3010.md` §2 H5, §5.1), lộ trình HD10.

## Vấn đề

Bảng `media` ở máy thu có 182.852 ảnh S06 và 85 ảnh S05, tất cả chỉ có `media_url` (URL gốc), không có `local_file`.
PL3/#208 chỉ đưa ảnh **đã tải** tới vai Vận hành; URL gốc mang tên miền nguồn thật (tầng A) nên chỉ tới Quản trị. Vì thế
vai `ops` mở thẻ ghép căn có tin S06 thấy 0 ảnh — hàng duyệt không giao được cho vai Vận hành.

## Cách làm

1. **Chế độ thứ ba của `/api/zalo-media`: `?media=<media_key>`.** Vai Vận hành trở lên (`xemNoiDungTin`). Máy chủ tra
   dòng `media` theo `media_key`:
   - có `local_file` → phục vụ file như chế độ `?snapshot=` (cùng hai lớp kiểm đường);
   - chỉ có `media_url` → máy chủ tự lấy ảnh rồi trả byte. Trình duyệt chỉ thấy `/api/zalo-media?media=<khoá>`.
   - khoá sai khuôn, không có dòng, hay DB không có bảng `media` (cloud) → 404.
2. **Khoá**: `media_key` đúng khuôn 32 ký tự hex (đo DB máy thu 31/10: 186.809/186.809 khoá đúng khuôn, 100% `media_url` là `https`).
3. **Bộ lấy ảnh (`app/src/lib/ops/lay-anh-goc.ts`)** — một hàm, nhận `fetch` và bộ tra DNS tiêm được để test:
   chỉ `https:`; tên máy phân giải ra địa chỉ riêng/loopback/link-local bị chặn (chống SSRF); theo tối đa 3 chuyển
   hướng, mỗi bước kiểm lại; thời gian chờ 8 giây; trần 8 MB; `content-type` phải là `image/*`. Lỗi trả 404/502/504 với
   thân chữ chung — không bao giờ chép URL hay tên miền vào phản hồi hay log.
   Bảng chặn của bộ lấy ảnh (AC-4):

   | Ca | Mã |
   |---|---|
   | URL không phải `https:` | 403 |
   | Tên máy phân giải ra địa chỉ riêng, loopback, link-local — IPv4, IPv6 (fc00::/7, fe80::/10, ::1) và IPv4 ánh xạ `::ffff:` | 403 |
   | Chuyển hướng tới URL bị chặn theo hai dòng trên | 403 |
   | Quá 3 chuyển hướng | 502 |
   | Nguồn trả mã không phải 2xx | 502 |
   | `content-type` không phải `image/*` | 502 |
   | Thân quá 8 MB khai trước ở `content-length` | 502 |
   | Thân quá 8 MB khi đếm trong lúc đọc (không khai, hay khai sai) | 502 |
   | Quá 8 giây | 504 |
4. **Loader thẻ duyệt (`review-media.ts`)**: ảnh chỉ có URL gốc thành `{ src: "/api/zalo-media?media=<khoá>",
   origin: "proxy" }` cho **mọi** vai được xem ảnh — kể cả Quản trị — nên HTML và JSON của `/ops/review` không còn tên
   miền nguồn. `chiGoc` chỉ còn đếm dòng không có `media_key`. Ảnh mẫu `evidence.image_url` (không có khoá) thôi đưa
   xuống trình duyệt ở mọi vai — nó là ảnh dự phòng cuối, mang URL gốc.
5. **Sổ bề mặt API và bộ kiểm cổng**: ghi chú dòng `zalo-media` thêm chế độ `?media=`; mục 6 của
   `check-portal-compliance.mjs` thêm kiểm `?media=` cũng chặn `xemNoiDungTin` trước mọi đọc DB/mạng.

## Phạm vi máy

Hỏi-1: chỉ máy thu (bảng `media` không lên cloud; đường cloud là TV9 dùng lại bộ lấy ảnh này) — khuyến nghị; hay làm cả
cloud ngay trong vòng.

## Phương án đã loại

- **Tải ảnh thu nhỏ S06 về máy thu** — 182.852 ảnh, việc của làn thu (ZCode) và TV9; không mở được hàng duyệt cho
  vai `ops` trong vòng này.
- **Đưa URL gốc xuống trình duyệt cho vai Vận hành** — lộ tên miền nguồn thật (tầng A), trái luật 6.

## Đặc tả UX

<!-- ux-spec:start -->
Không đổi bố cục: `ReviewPhotos` hiện ảnh `proxy` như ảnh local (thẻ `<img>` tới đường cùng origin). Ảnh lấy hỏng
(502/504) → trạng thái ảnh hỏng sẵn có của dải ảnh. Câu «chỉ có ở nguồn» chỉ còn khi tin không có `media_key`.
<!-- ux-spec:end -->

## Ngoài phạm vi

- Ảnh trên cloud (TV9), trừ khi Hỏi-1 chọn khác.
- Lưu đệm ảnh đã lấy xuống đĩa.
- Đổi quyền xem chế độ `?path=` (OpenClaw, chỉ admin).
