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
  dài của bộ app), When chạy `bait-gap-sellers.test.mjs`, Then cả 7 ca xanh dưới 30 giây; given một phiên giữ ACCESS
  EXCLUSIVE trên hai bảng nguồn 3 giây rồi nhả (ca DDL ngắn), Then cả 7 ca xanh sau khi chờ đúng lúc đó (≥ 2,5 giây, không
  vượt trần, không deadlock); bản tệp của nhánh chính dưới phiên chặn đầu thì treo tới trần (đối chứng).
- AC-2: Given một lượt chạy tệp test, When đo khoá của phiên test sau khi dựng lược đồ riêng, nạp 060 và chạy
  refresh-bait-gap, Then không có khoá tư vấn nào, không khoá nào mạnh hơn ACCESS SHARE trên đối tượng của schema `public`,
  không khoá nào trên view `public` (sale_offers, sellers, view thước), và mặc định `nextval` của bản rỗng trỏ dãy riêng.
- AC-3: Given tệp test trước và sau, When so các câu `assert`, Then mọi thông điệp assert giữ nguyên, chỉ hai câu đọc
  schema đổi từ `public` sang lược đồ riêng; ca đối chứng đỏ SD-AC-1 vẫn bắt bản chép 060 sai.
- AC-4: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ `pipeline/scripts/bait-gap-sellers.test.mjs`, hồ sơ
  này, `_acceptance/config.yaml`, tệp sinh và bản ghim lại của hồ sơ đã ký trỏ tệp ấy; probe không chạy trên Supabase.

## Coverage

- Trục **nguồn chờ** (khoá tư vấn dùng chung · khoá dòng bảng dùng chung · khoá DDL lúc chép bảng · vòng chờ hai chiều với
  ca DDL — deadlock) — AC-1, AC-2.
- Trục **giữ lời hứa cũ** (thông điệp assert · đối chứng đỏ) — AC-3.
- Thước CE: số đo pg_locks 01/11 ở Context; log S4 đỏ ba vòng của P2.

## Out of scope

- Đổi khoá 33033 của các test khác (app, agent, write-offers); nới timeout; sửa `boc-sdt.test.mjs`.

## Notes

- Lược đồ riêng là bản rỗng dựng từ catalog (cột, kiểu, NOT NULL, mặc định, CHECK/PK/UNIQUE, chỉ mục cùng tên, dãy riêng)
  trong giao dịch rồi ROLLBACK. Đọc định nghĩa cần ACCESS SHARE trên bảng gốc: xin một lượt NOWAIT, bị ca DDL chặn thì nhả
  hết và thử lại sau 100 ms — chờ đúng lúc ca DDL chạy, không giữ-trong-khi-chờ nên không vào vòng deadlock.
- Bản rỗng KHÔNG chép trigger (lịch sử tin, luật chỉ-thêm), khoá ngoại, RLS — ca không còn thử luật đó trên dữ liệu thật.
- Ca «SD3 sellers là view sau 060» nay kiểm view trong lược đồ riêng (do chính 060 dựng), không còn báo trạng thái DB máy
  thu; SD-AC-2 chạy refresh-bait-gap trên thước rỗng (0 tin được tính lại) — nó còn chứng view sellers không đổi qua hai
  lượt, không chứng câu UPDATE bait_gap_pct trên dữ liệu thật.
- Lời tả «dưới khoá advisory 33033, chạy trên dữ liệu máy thu» trong evals của hồ sơ đã ký `sellers-them-dong-lai` nay lỗi
  thời (bản rỗng thay dữ liệu thật); hồ sơ ấy được ghim lại, lời tả không sửa (hồ sơ đã ký).
- Probe E1 giữ khoá 33033 tổng chừng 20 giây trên DB dùng chung (phiên A, A2), mỗi phiên chặn mở-đo-đóng. Sự cố 01/11: một
  lượt probe bản trước bị bỏ lại giữ 33033 + khoá dòng ~1 giờ, chặn sync đêm (giám sát dừng). Mọi phiên probe nay đặt hạn phía
  máy chủ (idle_in_transaction 30 s, statement 60 s, lock 3 s), cả probe trần 180 s, đóng phiên ở finally; đo: giết -9 giữa
  chừng → khoá nhả ngay.
