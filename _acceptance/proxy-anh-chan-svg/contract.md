---
schema_version: 1
feature: Proxy ảnh tin /api/zalo-media chỉ phục vụ ảnh raster an toàn (jpeg/png/webp/gif); SVG và kiểu ảnh lạ trả 415; mọi phản hồi ảnh mang nosniff + CSP sandbox
slug: proxy-anh-chan-svg
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api]
status: approved
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-proxy-anh-chan-svg-design.md
---

# Acceptance Contract: proxy-anh-chan-svg

## Context

Ngoài-1+3 của HD10 `anh-goc-qua-may-chu`: bộ lấy ảnh gốc trả nguyên mọi `image/*` (kể cả SVG) trên origin của app, không
`nosniff`, không CSP — mở thẳng ảnh ở tab mới là XSS lưu trữ trong phiên Ops. Cổng Đáng: build, Mạnh («mở hợp đồng mới» 31/10).

## Criteria

- AC-1: Given nguồn trả ảnh `image/jpeg`, `image/png`, `image/webp`, `image/gif`, và các biến thể `image/jpg`, `IMAGE/PNG`, `image/jpeg; charset=binary`, When bộ lấy ảnh chạy, Then 200 đúng byte và `content-type` phản hồi là đúng một trong bốn kiểu chuẩn (biến thể quy về kiểu chuẩn), không chép nguyên chuỗi của nguồn.
- AC-2: Given nguồn trả `image/svg+xml`, `image/svg+xml; charset=utf-8`, `IMAGE/SVG+XML`, `image/x-icon`, `image/bmp`, `image/tiff`, `image/avif`, When bộ lấy ảnh chạy, Then 415, thân là đúng chữ chung «định dạng ảnh không được phép» (không chứa tên máy, đường dẫn hay query của URL nguồn), không đọc thân của nguồn.
- AC-3: Given nguồn trả `text/html` hay không có `content-type`, When bộ lấy ảnh chạy, Then vẫn 502 như bảng chặn của HD10 (không đổi thành 415).
- AC-4: Given bất kỳ phản hồi nào của bộ lấy ảnh (200, 403, 415, 502, 504), When đọc header, Then có `X-Content-Type-Options: nosniff` và `Content-Security-Policy` chứa `sandbox`.
- AC-5: Given vai Vận hành gọi `/api/zalo-media` ở ba nhánh phục vụ ảnh — `?media=` lấy hộ, `?media=` có `local_file`, `?snapshot=` — When phản hồi 200, Then cả ba mang `X-Content-Type-Options: nosniff` và CSP `sandbox`, và route `/api/zalo-media` trả nguyên phản hồi của lõi (không dựng phản hồi mới làm rơi header). (cross-layer)
- AC-6: Given dòng `media` chỉ có URL gốc mà nguồn trả SVG, When vai Vận hành gọi `GET /api/zalo-media?media=<khoá>`, Then 415, thân và header không chứa tên máy gốc. (cross-layer)
- AC-7: Given bộ test của HD10 (`app/tests/anh-goc-qua-may-chu.test.tsx`), When chạy sau thay đổi, Then xanh trọn và tệp test HD10 không đổi so với commit gộp HD10 (`6b610913`) — bảng chặn SSRF, quyền theo vai, khoá và loader không đổi.

## Coverage

- Trục A — Kiểu nội dung nguồn: bốn kiểu cho phép | biến thể của chúng (bí danh, chữ hoa, tham số) | SVG và biến thể | ảnh raster khác | không phải ảnh / vắng [thước CE: bảng `MIME` của `app/src/lib/ops/zalo-media.ts` + danh sách giám sát giao U1-84] → AC-1, AC-2, AC-3.
- Trục B — Nhánh phục vụ: lấy hộ | `?media=` local | `?snapshot=` [thước CE: ba chế độ trong `serveZaloMedia`] → AC-5, AC-6.
- Trục C — Kết cục phản hồi: 200 | 403 | 415 | 502 | 504 [thước CE: bảng chặn của design doc HD10 + mã 415 mới] → AC-4.

## Out of scope

- Soi byte đầu (magic bytes) của ảnh — `nosniff` + danh sách raster đã chặn đường chạy script.
- Cho phép `image/avif`, `image/heic` — phạm vi giao chỉ bốn kiểu.
- Đổi bảng chặn SSRF (Ngoài-2 của HD10, đã ghi Known limits).

## Notes

- Ảnh nguồn dùng avif/heic sẽ hiện «ảnh hỏng» trên thẻ duyệt sau thay đổi này.
- Thẻ duyệt hiện ảnh bằng `<img>`: mọi mã không phải 200 (415 hay 502) đều rơi vào trạng thái «ảnh hỏng» sẵn có của dải ảnh — không cần đổi loader.
