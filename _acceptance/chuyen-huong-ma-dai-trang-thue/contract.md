---
schema_version: 1
feature: link cũ chứa mã thị trường dài kèm query mở đúng trang Cho thuê, có ca đo tự động và đột biến làm đỏ
slug: chuyen-huong-ma-dai-trang-thue
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-11-02T22:10:33Z
design_doc: docs/superpowers/specs/2026-11-03-chuyen-huong-ma-dai-trang-thue-design.md
approved_by:
approved_at:
---

# Acceptance Contract: chuyen-huong-ma-dai-trang-thue

## Context

Ngoài-24 của hồ sơ `tin-rao-tren-invest`: sau khi tách trang, ma trận chuyển hướng mã dài chỉ phủ `listings/sale`. Mạnh chọn
«mở hợp đồng mới» ở Cổng Bằng chứng 02/11. Vòng này chỉ thêm phép đo, không đổi mã sản phẩm.

Source input: dòng `d-20261102T094427Z-71` trong `_acceptance/tin-rao-tren-invest/decisions.jsonl` + lời giao của phiên P3·TR1.

## Criteria

- AC-1: Given DB thử sau 064 và 32 mã dài đọc từ DB máy thu, When mở `/vn/<mã dài>/listings/rent` không query, Then cả 32 mã chuyển 308 sang `/vn/<mã ngắn>/listings/rent` và đích mở được với `marketId` là mã ngắn, loại `rent_lt`; ở DB thử trước 064, cả 32 mã hiện trang với `marketId` là mã nhận được và không chuyển hướng.
- AC-2: Given mã `thanh-pho-da-nang`, When mở trang rent với từng query `{}`, `tab=x`, `term=short`, `term=short&tab=x`, Then sau 064 cả 4 ô chuyển 308 sang mã ngắn, giữ nguyên query, đích hiện đúng loại tin (`rent_lt`, hoặc `rent_st` khi có `term=short`); trước 064 cả 4 ô hiện đúng loại tin (`rent_lt`, hoặc `rent_st` khi có `term=short`). Ma trận trang × query của hồ sơ gốc có thêm hàng rent, đủ 8 ô: 4 trang (thị trường, Bán, Cho thuê, phường) × 2 query (`{}`, `tab=x`).
- AC-3: Given đường cũ `/vn/thanh-pho-da-nang/listings?kind=rent_lt` và `?kind=rent_st`, có và không có `tab=x`, When theo chuyển hướng, Then nhịp một sang `/listings/rent` dưới mã nhận được (`rent_st` thành `term=short`), nhịp hai sau 064 sang mã ngắn giữ query, trước 064 hiện đúng loại tin.
- AC-4: Given mã dài không đích `tinh-khong-co` và mã thường `hanoi`, `hcmc`, When mở trang rent ở cả hai trạng thái DB, Then mã không đích trả 404, mã thường hiện đúng thị trường và loại tin, `/vn/hanoi/listings/rent` có số truy vấn bằng mốc gốc hàng; mã dài sau 064 tra thêm ít nhất một truy vấn so với mốc, trước 064 bằng mốc; đột biến tra mã đổi cả khi thị trường có sẵn làm ca đếm đỏ.
- AC-5: Given ca dương `term=short` xanh trên DB thử sau 064, When chạy lại đúng ca trên bản chép có đột biến: trang rent truyền `segment: "sale"`, bỏ nhánh chuyển hướng ở `ListingsRoute`, chuyển hướng làm rơi query, Then cả ba đỏ với thông điệp ghim: «chuyển sai đích» với đích thực nhận `/vn/da-nang/listings/sale?term=short`, «không chuyển hướng: /vn/thanh-pho-da-nang», «chuyển sai đích» với đích thực nhận `/vn/da-nang/listings/rent` (mất `term=short`); và `acceptance.mjs` đỏ khi đầu ra thiếu dòng của một nhóm ô.

## Coverage

Bỏ quét không gian: bài toán là thêm một hàng vào ma trận đã có trục (mã · trang · query · trạng thái DB), xem dòng `bỏ coverage-scan` trong sổ quyết định.

## Out of scope

- Sửa mã chuyển hướng hay trang Cho thuê: chuyển hướng đã có; nếu đo ra lỗi thì báo, không sửa trong vòng này.
- Kiểm trên cloud: giám sát báo riêng sau khi áp catch-up và sync.
- Trang bản đồ, data-api: không có đường `listings/rent`.
- Chụp màn hình: chuyển hướng không có giao diện để nhìn.
- Đo qua URL thật trên máy chủ Next: hồ sơ gốc đo bằng hàm trang, vòng này giữ cùng cách; proxy hay Next chặn trước route thì không thấy ở đây.
- Hạn dùng của bộ kiểm khi 064 áp lên DB máy thu: `maDai()` đọc 32 mã từ DB đó, là việc của hồ sơ gốc.

## Notes
