---
schema_version: 1
feature: Test người bán theo SĐT (SD3) chịu chạy song song — mỗi ca dựng lược đồ riêng, không xếp hàng khoá tư vấn dùng chung
slug: sd3-test-chiu-song-song
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
---

# Acceptance Contract: sd3-test-chiu-song-song

## Context

Hàng P4 do giám sát giao (01/11, ưu tiên 0): hai ca SD-AC-1 và SD-AC-7 của `pipeline/scripts/bait-gap-sellers.test.mjs`
(SD3, f0fd1989) treo đúng 120 giây khi `cd pipeline && npm test` chạy song song với bộ app và agent trong lượt S4; chạy
một mình thì xanh. P2 đỏ ba vòng S4 vì hai ca này. Đo 01/11 (ba bộ chạy song song, lấy mẫu pg_locks mỗi giây): ca chờ khoá
tư vấn 33033 tới 123 giây, và một ca giữ khoá đó tới 112–126 giây (thước hình học, resolve_offer_fields, ALTER nights) —
mọi ca của tệp này xếp hàng sau chúng rồi vượt trần 120 giây. `boc-sdt.test.mjs` không chạm DB và không có ca SD-AC-7 —
không đổi.

## Criteria

- AC-1: Given một phiên khác đang giữ khoá tư vấn 33033 và khoá dòng trên `sale_offer_records` trong giao dịch mở (như ca
  dài của bộ app), When chạy `bait-gap-sellers.test.mjs`, Then cả 7 ca xanh trong trần 30 giây; bản tệp của nhánh chính
  dưới cùng phiên chặn thì vượt trần (đối chứng: phép đo phân biệt được cái treo).
- AC-2: Given một lượt chạy tệp test, When đo khoá của phiên test sau khi dựng lược đồ riêng, nạp 060 và chạy
  refresh-bait-gap, Then không có khoá tư vấn nào và không có khoá nào mạnh hơn ACCESS SHARE trên đối tượng của schema
  `public`.
- AC-3: Given tệp test trước và sau, When so các câu `assert`, Then mọi thông điệp assert giữ nguyên, chỉ hai câu đọc
  schema đổi từ `public` sang lược đồ riêng; ca đối chứng đỏ SD-AC-1 vẫn bắt bản chép 060 sai.
- AC-4: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ `pipeline/scripts/bait-gap-sellers.test.mjs`, hồ sơ
  này, `_acceptance/config.yaml`, tệp sinh và bản ghim lại của hồ sơ đã ký trỏ tệp ấy; probe không chạy trên Supabase.

## Coverage

- Trục **nguồn chờ** (khoá tư vấn dùng chung · khoá dòng bảng dùng chung · khoá DDL lúc chép bảng) — AC-1, AC-2.
- Trục **giữ lời hứa cũ** (thông điệp assert · đối chứng đỏ) — AC-3.
- Thước CE: số đo pg_locks 01/11 ở Context; log S4 đỏ ba vòng của P2.

## Out of scope

- Đổi khoá 33033 của các test khác (app, agent, write-offers); nới timeout; sửa `boc-sdt.test.mjs`.

## Notes

- Lược đồ riêng là bản rỗng (`LIKE … INCLUDING DEFAULTS CONSTRAINTS GENERATED` + chỉ mục cùng tên) tạo trong giao dịch
  rồi ROLLBACK; `CREATE TABLE … LIKE` vẫn cần ACCESS SHARE trên bảng gốc nên vẫn chờ ngắn khi một ca khác đang ALTER bảng ấy.
