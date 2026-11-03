---
schema_version: 1
feature: hai test app chạy trên DB chung thôi đỏ vì mã vùng dài cũ và thôi treo khi có DDL xếp hàng
slug: test-app-tren-db-chung
owner: phanlemanh@gmail.com
risk_tier: T1      # sửa test và một phép tra tên vùng thuần; hành vi sản phẩm chỉ đổi ở chỗ dòng kiểm cũ có tên vùng trên /ops/quality; không đổi dữ liệu, quyền hay luồng
surfaces: [cli]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: test-app-tren-db-chung

## Context

Hồ sơ có mặt vì PR chạm `app/` (ngoài `t1_skip_globs`). Hai lỗi cùng chặn các lượt ghim lại, vì suite app chạy trên DB chung.

`ON12-AC-5` đỏ: `dq_check_results` còn dòng ghi từ trước migration 064 mang mã dài `vn-tinh-*`, `vn-thanh-pho-*`, trong khi `areas`
đã sang mã ngắn, nên `marketNameOf` không ra tên.

`tin-rao-doi-chieu.test.tsx` (E4b) giữ giao dịch đọc trong lúc chờ `pool.query`. DDL xếp hàng giữa hai bên thì cả ba treo, Postgres
không thấy deadlock, và các phiên khác kẹt theo.

**`maNgan` chuyển từ `ma-thi-truong.ts` sang `market-names.ts`**, vì `market-names.ts` chạy ở client còn `ma-thi-truong.ts` có `pool`.
`ma-thi-truong.ts` xuất lại hàm, các chỗ đang dùng không đổi.

**Eval E1 của `chuyen-huong-ma-thi-truong` chưa chạy được** trên bản này: bộ kiểm đòi đủ 32 mã dài từ DB máy thu, mà DB đã áp 064 nên còn 0
mã. Thay vào đó mới gọi thử `maNgan` qua `ma-thi-truong.ts` với ba mã, và `ma-thi-truong-dai.test.tsx` đo qua `marketNameOf`.

## Criteria

- AC-1: Given DB có dòng kiểm mang mã dài từ trước 064, When chạy `ON12-AC-5` trong `app/tests/ops-nhan-theo-context.test.tsx`, Then mọi dòng được diễn giải; trên main `e90094dd` ca này đỏ.
- AC-2: Given `areas` chỉ có mã ngắn, When `marketNameOf` nhận mã dài, Then ra tên của mã ngắn; bản hàm bỏ bước tra này làm `app/tests/ma-thi-truong-dai.test.tsx` đỏ với thông điệp ghim.
- AC-3: Given `sale_offers` bị giữ khoá độc quyền trên DB thử, When chạy `app/tests/tin-rao-doi-chieu.test.tsx`, Then đỏ sau khoảng 30 giây với `lock timeout`; bản trước vẫn treo ở mốc cắt 45 giây.
- AC-4: Given DB máy thu không có khoá chặn, When chạy `app/tests/tin-rao-doi-chieu.test.tsx`, Then các phép đo E4b giữ nguyên và xanh.

## Out of scope

- OOS-1: Ghim lại `chuyen-huong-ma-thi-truong` hay sửa bộ kiểm của nó để chạy được sau 064: không thuộc bản sửa này.
- OOS-2: Dựng lại đúng ca có DDL xếp hàng giữa hai bên: AC-3 chỉ đo `lock_timeout`; việc bỏ giao dịch được chứng bằng đọc mã.
