---
schema_version: 1
feature: link và mã thị trường cũ (32 mã dài vn-thanh-pho-*/vn-tinh-*) vẫn mở được sau khi migration 064 đổi sang mã ngắn vn-<x> — chuyển hướng vĩnh viễn có điều kiện ở các trang Invest, bí danh mã cũ ở API công khai của app và data-api, đúng ở cả hai trạng thái trước/sau 064
slug: chuyen-huong-ma-thi-truong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
design_doc: docs/superpowers/specs/2026-11-01-chuyen-huong-ma-thi-truong-design.md
approved_by: Mạnh
approved_at: 2026-11-01
---

# Acceptance Contract: chuyen-huong-ma-thi-truong

## Context

Migration 064 (hàng `s06-vung-moi-len-canonical`, PR #252) đổi khoá 32 thị trường cấp tỉnh từ `vn-(thanh-pho|tinh)-<x>`
sang `vn-<x>`. Mã ấy nằm trong URL công khai của cổng Invest và trong mã nhận/trả của API công khai. Cổng 2 của s06 ghi
Ngoài-1 «mở hợp đồng mới»; Mạnh 01/11 chọn «Chờ chuyển hướng» — 064 chỉ áp lên DB máy thu sau khi hàng này gộp. Giám sát
giao dãy N1 01/11 (yêu cầu N1-2 đã duyệt), ưu tiên cao vì đích ra mắt 05/11.

Thứ tự triển khai cố định (hàng này deploy trước, 064 áp sau) nên mọi chuyển hướng phải CÓ ĐIỀU KIỆN: trước 064 link cũ
mở như hôm nay, sau 064 link cũ chuyển sang mã ngắn. Lý do bỏ redirect tĩnh ở `next.config.ts`: design doc §Ràng buộc.

Source input: lời Mạnh 01/11 qua phiên này («Chờ chuyển hướng») + giám sát (N1-2) + design doc.

## Criteria

- AC-1: Given luật đổi mã của migration 064 (`regexp_replace(id,'^vn-(thanh-pho|tinh)-','vn-')`, đọc từ tệp 064) và 32 mã dài đọc từ DB máy thu, When gọi `maNgan` của app và bản chép của data-api, Then cả hai trả đúng kết quả của luật 064 cho cả 32 mã và cho ma trận mã không đổi (`vn-hanoi`, `vn-hcmc`, mã phường `vn-hanoi-<slug>`, `vn`, `vn-tinh` không có đuôi, chuỗi rỗng, mã chứa `thanh-pho` giữa chuỗi); hai bản cho cùng đầu ra trên mọi phần tử.
- AC-2: Given DB sau 064 (bản chép đã áp chính migration 064), When mở trang thị trường, trang listing của thị trường và trang phường bằng đường mã dài (vd `/vn/thanh-pho-da-nang`, `/vn/thanh-pho-da-nang/listings`, `/vn/<tỉnh>/<phường>` khi có phường), Then trang chuyển hướng vĩnh viễn (308, Hỏi-1) sang đúng đường mã ngắn tương ứng, giữ đoạn con và query, với cả 32 mã.
- AC-3: Given DB trước 064 (mã dài còn trong `areas`), When mở cùng các đường mã dài ở AC-2, Then trang hiện như hôm nay với mã nhận được — không chuyển hướng nào bắn.
- AC-4: Given mã dài không có đích (`/vn/tinh-khong-co`) ở cả hai trạng thái, và mã không mang tiền tố dài (`/vn/hanoi`, `/vn/hcmc`, trang phường Hà Nội), When mở các trang đó, Then mã dài không đích trả 404 như hôm nay (không chuyển hướng tới chỗ không có), mã khác hiện như hôm nay không chuyển hướng.
- AC-5: Given DB sau 064, When mở Finder `/vn?market=thanh-pho-da-nang`, Ước tính lợi suất `/yield?area=vn-thanh-pho-da-nang` (cũng là đích của link cũ `/vn/thanh-pho-da-nang/dau-tu`) và So sánh `/compare?areas=vn-thanh-pho-da-nang,vn-hanoi`, Then trang chọn đúng thị trường mã ngắn như khi gõ mã ngắn; với DB trước 064 cùng các URL ấy chọn đúng thị trường mã dài như hôm nay.
- AC-6: Given DB sau 064, When gọi API công khai của app `/api/v1/listings?market=`, `/api/v1/asset-stats?market=` và `?area=`, `/api/v1/deals?market=`, `/api/v1/offers?area=` bằng mã dài, Then kết quả trùng từng byte với lời gọi cùng route bằng mã ngắn, và kết quả ấy không rỗng (DB thử có phường, tin và số liệu dưới thị trường mã ngắn như sau khi nạp phường).
- AC-7: Given DB sau 064, When gọi data-api `/v1/markets/<mã dài>`, `/submarkets`, `/insights`, và `?market=`/`?area=` của `/v1/listings`, `/v1/asset-stats`, `/v1/deals` bằng mã dài, Then kết quả trùng lời gọi bằng mã ngắn và không rỗng, và chi tiết thị trường trả `id` là mã ngắn.
- AC-8: Given DB trước 064 có cùng bộ phường, tin và số liệu như AC-6 nhưng nằm dưới mã dài, hoặc mã dài không có đích, When gọi mọi route ở AC-6 và AC-7 bằng mã đó, Then mã còn trong `areas` trả kết quả không rỗng mang chính mã dài (không đổi sang mã ngắn chưa tồn tại), mã không đích trả đúng như hôm nay (404 ở `/v1/markets/:id`, danh sách rỗng ở route lọc), và mã không mang tiền tố dài không phát sinh truy vấn nào ngoài số truy vấn của route trước thay đổi.
- AC-9: Given thay đổi của hàng, When chạy typecheck + lint + bộ test của app, luật slug route và typecheck data-api, Then typecheck, lint, luật slug và typecheck data-api xanh, bộ test app không thêm ca đỏ nào so với gốc của hàng (ca đỏ sẵn ở gốc in tên); không thêm route mới, không chạm `app/src/proxy.ts` hay `data-api/src/middleware/**`.

## Coverage

- Trục A — dạng mã: mã dài có đích (32, đọc từ DB) · mã dài không đích · mã ngắn có sẵn (`vn-hanoi`, `vn-hcmc`) · mã phường · mã biên (`vn`, `vn-tinh`, rỗng, `thanh-pho` giữa chuỗi). [thước CE: luật regex của migration 064; danh sách 32 mã từ DB máy thu]
- Trục B — bề mặt: trang theo đường (thị trường, listing, phường) · trang theo tham số (Finder, Lợi suất + `/dau-tu`, So sánh) · API app (4 route) · data-api (3 route markets + 3 route lọc). [thước CE: `find app/src/app -name page.tsx` có `[market]`; `grep searchParams.get("area"|"market")` trong `app/src/app/api/v1`; mọi `c.req.param`/`c.req.query("area"|"market")` trong `data-api/src/routes`]
- Trục C — trạng thái DB: trước 064 (AC-3, AC-5, AC-8) · sau 064 (AC-2, AC-5, AC-6, AC-7).
- Trục D — chiều: dương (AC-2, AC-5, AC-6, AC-7) · không được bắn (AC-3, AC-4, AC-8).
- `/map` đi qua Finder, `/dau-tu` đi qua Lợi suất — phủ gián tiếp ở AC-5.

## Out of scope

- Áp 064 lên DB máy thu (cần Mạnh duyệt riêng sau khi hàng này gộp).
- Gỡ nhánh tra mã dài thừa trong `marketNameOf` (Ngoài-2 của s06) — làm sau khi 064 áp.
- Trang `/ops/**` — nội bộ, link sinh từ DB nên tự đúng sau 064.
- Bản đồ trang (sitemap) — app chưa có.
- Kiểm HTTP thật qua dev server hay Vercel: ca đo gọi thẳng hàm trang và handler route; mã 308 đọc từ lỗi chuyển hướng của Next.
- Mã 301 đúng nghĩa (đòi đi qua `app/src/proxy.ts`, đường T3 của cổng auth).

## Notes

- Thứ tự triển khai: gộp #252 → gộp hàng này → Mạnh duyệt áp 064 (sau lệnh đếm `--cloud` ra 0).
- Cổng Phạm vi 01/11 (Mạnh «duyệt»): Hỏi-1 = 308 vĩnh viễn; Hỏi-2 = giữ bí danh mã cũ ở API không hạn, không cơ chế hết hạn.
