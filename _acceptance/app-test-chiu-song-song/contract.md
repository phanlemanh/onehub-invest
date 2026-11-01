---
schema_version: 1
feature: Test «Căn giá tốt» và «Kiểm chất lượng dữ liệu mới nhất» chịu chạy song song — mỗi ca dựng lược đồ riêng, không xếp hàng khoá tư vấn dùng chung
slug: app-test-chiu-song-song
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-01
---

# Acceptance Contract: app-test-chiu-song-song

## Context

Hàng P4 do giám sát giao (01/11, sau `sd3-test-chiu-song-song`): ba tệp test DB còn xếp hàng khoá tư vấn 33033 dùng chung
và ghi lên bảng dùng chung trong giao dịch — `app/tests/deals-phi-ly.test.tsx` (DP-AC-4/5 hết giờ 120 s khi bộ app chạy
song song với pipeline và agent), `pipeline/scripts/deals-phi-ly.test.mjs` (DP-AC-2 refreshBaitGap hết giờ 180 s: chạy
bước đêm trên toàn bộ tin thật) và `app/tests/dq-moi-nhat.test.tsx` (`DELETE FROM dq_check_results` cả bảng). Ca deals
của app còn `UPDATE sale_offers` mọi tin thật, `DROP TABLE stg_zalo_posts` và `ALTER TABLE … DROP COLUMN` trên public —
khoá ACCESS EXCLUSIVE chặn mọi job khác tới hết ca. Khuôn sửa đã chứng ở `sd3-test-chiu-song-song` (đã ký): lược đồ riêng
trong giao dịch. Hàng này rút khuôn đó thành thư viện dùng chung `pipeline/lib/luoc-do-rieng.mjs`.

## Criteria

- AC-1: Given một phiên khác đang giữ khoá tư vấn 33033 và khoá dòng trên `sale_offer_records` + `dq_check_results` trong
  giao dịch mở, When chạy ba tệp test cùng lúc, Then cả ba xanh đủ số ca dưới 30 giây; given một phiên giữ ACCESS EXCLUSIVE
  trên ba bảng nguồn 3 giây rồi nhả, Then cả ba xanh sau khi chờ đúng lúc đó (≥ 2,5 giây và dài hơn lượt không bị chặn ≥ 2 giây, dưới 30 giây, không
  deadlock); given một phiên giữ ACCESS SHARE suốt lượt trên mọi bảng và view public mà ba tệp nhắc tên, Then cả ba xanh dưới
  30 giây (không câu nào của tệp xin khoá độc quyền trên public); bản merge-base của từng tệp dưới phiên chặn đầu thì treo vì
  chờ khoá của chính phiên ấy (đối chứng).
- AC-2: Given lược đồ riêng mà từng tệp khai (danh sách bảng rút nguyên văn từ tệp) cùng phần việc của ca (refresh-bait-gap,
  đọc view tin/thước/sellers/tin gốc, ghi rồi đọc kết quả kiểm), When đo khoá của phiên, Then không khoá tư vấn nào, không
  khoá nào mạnh hơn ACCESS SHARE trên đối tượng schema `public`, không khoá nào trên view `public`.
- AC-3: Given ba tệp test trước và sau, When so thông điệp assert, Then giống hệt trừ đúng một câu mỗi tệp deals: «không
  phường nào có thước» (đọc thước thật) thành «thước bịa không ra đúng một phường»; ba ca đối chứng đỏ trong tệp còn nguyên.
- AC-4: Given `pipeline/lib/luoc-do-rieng.mjs`, When chạy test của nó, Then 3 ca xanh (bản chép rỗng đủ ràng buộc/chỉ mục,
  dãy riêng không đẩy dãy dùng chung, search_path trỏ bản riêng; từ chối view; hai phiên dựng song song không chờ nhau, không
  giữ 33033, ROLLBACK không để lại lược đồ); ba bản đột biến của thư viện (giữ 33033, bỏ ràng buộc, dãy dùng chung) đều đỏ
  đúng lý do.
- AC-5: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ ba tệp test, thư viện + test của nó, hồ sơ này,
  `_acceptance/config.yaml`, tệp sinh và bản ghim lại của bốn hồ sơ đã ký trỏ các tệp test ấy — ở bốn hồ sơ đó chỉ dòng
  ghim của làn máy (thêm dòng `repin`, đổi `verified_commit`, thêm mục «Re-pin»); probe không gọi Supabase.

## Coverage

- Trục **nguồn chờ** (khoá tư vấn dùng chung · khoá dòng bảng dùng chung · khoá DDL lúc chép bảng · vòng chờ với ca DDL ·
  DDL/UPDATE của chính ca trên public) — AC-1, AC-2.
- Trục **giữ lời hứa cũ** (thông điệp assert · đối chứng đỏ trong ca) — AC-3.
- Trục **thư viện dùng chung** (cấu trúc bản chép · dãy · song song · dọn) — AC-4.
- Thước CE: log S4 hết giờ DP-AC-4/5 (120 s) và DP-AC-2 (180 s) của các vòng trước; số đo pg_locks 01/11 của hồ sơ sd3.

## Out of scope

- Năm tệp app còn khoá 33033 (`sellers-chip`, `hieu-chuan`, `ty-le-listing-gop`, `people-che-so-loader`,
  `finder-ranh-gioi`), các test pipeline khác và `agent/tests/helpers/db.ts`; chuyển `bait-gap-sellers.test.mjs` sang thư viện
  (đang ở nhánh sd3 chưa gộp); nới timeout.

## Notes

- Thước «Căn giá tốt» của ca nay tính trên năm căn bịa của chính ca qua view 034 thật, không đọc thước của phường thật — ca
  không còn đỏ khi DB không phường nào có thước, và không còn phụ thuộc dữ liệu máy thu.
- DP-AC-5 (bản cloud) mạnh hơn: sau khi xoá cột PII, search_path chỉ còn lược đồ riêng — câu cloud không với tới bảng nào
  của public (trước đây `stg_zalo_posts` bị DROP thật trên public trong giao dịch).
- Bản rỗng KHÔNG chép trigger, khoá ngoại, RLS, dữ liệu (như sd3).
- Probe E1 chạy trên DB thử riêng (khoá tư vấn chỉ tranh nhau trong cùng database); mọi phiên probe đặt hạn phía máy chủ
  (idle_in_transaction 30 s, statement 60 s, lock 3 s), cả probe trần 900 giây gồm dựng DB thử, đóng phiên ở finally.
- Đường nền so sánh của probe ghim sha d96640c6 (đỉnh nhánh chính lúc hàng rẽ), không dùng merge-base trôi.
- Mã viết trước hồ sơ (commit 2a4d7b4d) — hồ sơ chốt phạm vi trên mã đã có; ghi ở sổ quyết định.
