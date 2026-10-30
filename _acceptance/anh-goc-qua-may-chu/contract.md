---
schema_version: 1
feature: Người duyệt vai Vận hành ở máy thu thấy ảnh tin chỉ có URL gốc (S06, S05) trên thẻ duyệt — ảnh đi qua máy chủ theo media_key, trình duyệt không nhận URL hay tên miền nguồn
slug: anh-goc-qua-may-chu
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, ui]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-anh-goc-qua-may-chu-design.md
---

# Acceptance Contract: anh-goc-qua-may-chu

## Context

Audit hàng duyệt 30/10 H5 (`docs/research/audit-hang-duyet-3010.md`): 182.852 ảnh S06 chỉ có URL gốc, vai `ops` thấy 0
ảnh trên thẻ ghép căn. Cổng Đáng: build, Mạnh («cho ảnh S06 đi qua máy chủ»), lộ trình HD10, dãy U1.

## Criteria

- AC-1: Given dòng `media` có `media_key` và chỉ có `media_url`, When phiên vai Vận hành gọi `GET /api/zalo-media?media=<khoá>` với bộ lấy ảnh giả trả ảnh hợp lệ, Then phản hồi 200 mang đúng byte và `content-type` ảnh, và thân, header phản hồi không chứa URL hay tên máy gốc.
- AC-2: Given ma trận 5 vai (khách, user, viewer, ops, admin) × 3 khoá (chỉ URL gốc, có `local_file`, không tồn tại), When gọi `?media=`, Then chỉ ops và admin nhận ảnh cho hai khoá có thật; mọi ô còn lại 404; khách, user, viewer không chạm DB hay mạng.
- AC-3: Given khoá sai khuôn, khoá không có dòng, hay DB không có bảng `media` (cloud), When gọi `?media=`, Then 404, không gọi mạng.
- AC-4: Given ma trận lỗi nguồn viết trước một-một từ bảng chặn của design doc — URL `http:`; tên máy phân giải ra địa chỉ riêng, loopback, link-local IPv4, IPv6 (fc00::/7, fe80::/10, ::1) và `::ffff:` ánh xạ; chuyển hướng tới địa chỉ riêng; quá 3 chuyển hướng; nguồn trả mã không phải 2xx; `content-type` không phải ảnh; quá 8 MB khai trước; quá 8 MB khi đếm lúc đọc; quá 8 giây — When lấy ảnh, Then mỗi ô bị chặn đúng mã của bảng và thân phản hồi không chứa URL hay tên máy. (cross-layer)
- AC-5: Given thẻ ghép căn có bên S06 chỉ có URL gốc, When loader ảnh thẻ chạy cho vai Vận hành và Quản trị, Then mỗi bên nhận ảnh `origin: "proxy"` với `src` dạng `/api/zalo-media?media=<khoá>`, `chiGoc` không đếm các ảnh ấy, ảnh mẫu `evidence.image_url` không có trong kết quả, và JSON trả về không chứa tên máy nào của `media_url` hay `evidence.image_url`. (cross-layer)
- AC-6: Given dòng `media` có `local_file` hợp lệ, When gọi `?media=`, Then phục vụ file local qua cùng hai lớp kiểm đường của chế độ `?snapshot=`, không gọi mạng.
- AC-7: Given DB máy thu thật (chỉ đọc) và một tin S06 có dòng `media`, When dựng dải ảnh thẻ cho vai Vận hành, Then có ≥ 1 ảnh `proxy` và HTML dải ảnh không chứa tên máy nào của các `media_url` của tin ấy; mọi `media_key` S03/S05/S06 đúng khuôn 32 hex và mọi `media_url` là `https`. (cross-layer)
- AC-8: Given sổ bề mặt API và bộ kiểm cổng, When chạy `check-api-surface.mjs static` và `check-portal-compliance.mjs`, Then xanh; ghi chú dòng `zalo-media` nêu chế độ `?media=` cho vai Vận hành trở lên; mục 6 có chiều đỏ cho bản route gọi bộ lấy ảnh trước khi kiểm vai.
- AC-9: Given dev server máy thu, When người chấm mở `/ops/review` một thẻ có bên S06 bằng tài khoản thử vai Vận hành, Then dải ảnh bên S06 hiện ảnh thật và toàn bộ mã trang (kể cả dữ liệu nhúng của trang) không chứa tên máy nào của `media_url` hay `evidence.image_url` của thẻ ấy (tập tên máy lấy từ DB).

## Coverage

- Trục A — Vai: khách | user | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`] → AC-2, AC-5.
- Trục B — Dòng media: chỉ URL gốc | có local_file | không có dòng | khoá sai khuôn [thước CE: cột của bảng `media` (053)] → AC-1, AC-2, AC-3, AC-6.
- Trục C — Lỗi nguồn: http · địa chỉ riêng · chuyển hướng xấu · quá nhiều chuyển hướng · không phải ảnh · quá cỡ · quá giờ [thước CE: bảng chặn của design doc] → AC-4.
- Trục D — Môi trường: máy thu | cloud thiếu bảng → AC-3, AC-7.

## Out of scope

- Ảnh trên cloud (TV9) — theo Hỏi-1.
- Lưu đệm ảnh đã lấy xuống đĩa.
- Đổi quyền chế độ `?path=` (OpenClaw).

## Notes

- Chọn «chỉ máy thu» ở Hỏi-1 thì lời hứa của ô cơ hội cho vai Vận hành **trên cloud** chưa thành ở vòng này: vai ops làm từ xa qua cloud vẫn thấy 0 ảnh S06 tới khi TV9 (`bai-goc-anh-len-cloud`) dùng lại bộ lấy ảnh này.

- Hỏi-1: nếu Mạnh chọn làm cả cloud ngay, thêm AC: trên cloud `?media=` đọc `media_url` từ bảng đã đồng bộ (cần đưa `media` lên cloud qua sync, sửa leak gate) — vòng lớn hơn.
