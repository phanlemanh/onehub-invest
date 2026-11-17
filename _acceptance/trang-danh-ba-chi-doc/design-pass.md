---
slug: trang-danh-ba-chi-doc
at: 2026-11-16T23:20:00Z
context: product-real-data
reaction: nac-1-khong-dong-bo
url: http://localhost:3461/ops/registry
---

# Design pass — trang Danh bạ (bản bấm được trên nhánh, DB máy thu thật)

Bản chạy: dev server worktree U2 ở `http://localhost:3461` (tab Terminal «dev 3461 danh ba»), đăng nhập tài khoản thử
admin `scripts/dev-ops-account.mjs`. Chụp bằng `scripts/ui-capture-login.mjs` (che tầng A trước khi chụp).

## Ma trận chụp

| Màn | 1280 sáng | 1280 tối | 390 sáng |
|---|---|---|---|
| Danh bạ `/ops/registry` | design-pass/danh-ba-1280-sang.png | design-pass/danh-ba-1280-toi.png | design-pass/danh-ba-390-sang.png |
| Một dự án `/ops/registry/16` (Grand Park) | design-pass/du-an-1280-sang.png | design-pass/du-an-1280-toi.png | design-pass/du-an-390-sang.png |

## Findings (đã sửa trong lượt)

1. Cột «Căn», «Tin đang rao» bị khuất ở 1280 px vì tên tỉnh dài — rút tên tỉnh như `/ops` («Hồ Chí Minh»), ẩn cột
   Tỉnh/thành dưới lg, Phân khu dưới xl, thu bề rộng cột. Nay đủ tám cột ở 1280 px.
2. Hàng lá lệch thụt so với hàng mở được — thêm ô giữ chỗ bằng nút mở.
3. Tên toà trùng chỉ khác hoa/thường («BS10 · bs10») — gộp, giữ bản đầu; mã UUID của S09 không hiện ở dòng mã toà.

## Còn để người nhìn

- 390 px: bảng cuộn ngang trong khung (luật ReUI), trang không cuộn ngang; chỉ thấy tên + bậc ở khung đầu.
- Dự án «một lời khai» không có toà chiếm phần lớn bảng (324/344) — lọc «Chỗ thiếu» hay «Bậc» để thu.

## Nấc

- Ngữ cảnh: dữ liệu thật của máy thu, route thật trên nhánh.
- Phản ứng: không đồng bộ — gói gửi kèm thẻ Cổng Phạm vi; Mạnh mở link hay ảnh lúc rảnh.
