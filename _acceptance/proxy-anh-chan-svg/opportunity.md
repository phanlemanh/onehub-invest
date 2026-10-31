---
schema_version: 1
slug: proxy-anh-chan-svg
feature: Proxy ảnh tin /api/zalo-media chỉ phục vụ ảnh raster an toàn (jpeg/png/webp/gif); SVG và kiểu lạ bị chặn, mọi phản hồi ảnh mang nosniff + CSP sandbox
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build           # Mạnh chọn «mở hợp đồng mới» cho Ngoài-1+3 khi ký Cổng Bằng chứng HD10 31/10; giám sát xếp U1 ngay sau HD10 (U1-84)
decided_by: Mạnh
decided_at: 2026-10-30T23:53:12Z
prototype:
  base_commit:
  disposition:
lo_trinh_ma: HD16
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Phát sinh từ Cổng Bằng chứng của HD10 `anh-goc-qua-may-chu` (mục Ngoài-1 và Ngoài-3, `_acceptance/anh-goc-qua-may-chu/review-findings.md`).

Bộ lấy ảnh gốc (`app/src/lib/ops/lay-anh-goc.ts`) nhận mọi `image/*` rồi trả nguyên `content-type` của nguồn trên cùng origin với `/ops`, không có `X-Content-Type-Options: nosniff` hay CSP. Nguồn tin rao (dữ liệu bên ngoài) trả về `image/svg+xml` có script thì người vận hành mở thẳng ảnh ở tab mới sẽ chạy script trong phiên Ops (XSS lưu trữ). Người gặp: vai Vận hành và Quản trị ở máy thu.

Vì sao: lỗ bảo mật trên route mang dữ liệu tầng A; giám sát xếp ưu tiên ngay sau HD10.

## Ngưỡng chết / ngưỡng UAT

- Không có phiên nghiệm thu: việc sửa bảo mật, nghiệm thu bằng phép đo máy (không có ngưỡng người dùng).
