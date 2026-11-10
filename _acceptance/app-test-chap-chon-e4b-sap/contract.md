---
schema_version: 1
feature: Bộ test app chung bỏ bốn ca đo thời gian theo tải (E4B-AC-3, E4B-AC-4, E4B-AC-7, CGT-DC) — chúng chỉ chạy riêng qua executor của hồ sơ mình, nguyên trần đã ký
slug: app-test-chap-chon-e4b-sap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-10-app-test-chap-chon-e4b-sap-design.md
approved_by:
approved_at:
---

# Acceptance Contract: app-test-chap-chon-e4b-sap

## Context

Làn trước chữ ký của PL34 lượt 3 (09/11) đỏ ở bộ test app chung vì hai ca đo thời gian thật trên DB thật: E4B-AC-3
(bản mới dưới 700 ms, lời đã ký buộc đo cả trong suite tám tệp song song) và CGT-DC (đối chiếu 1.935 tin P1 bán, một
mình ≈ 450 giây, trong suite quá trần ca). Phần chập chờn do mã test đã sửa ở #393. Known limits Ngoài-1 của
`e4b-danh-sach-tin-nhanh` (Mạnh 08/11) đã định gỡ E4B-AC-3/4/7 khỏi bộ kiểm chung; AC-7 của `can-gia-tot-sua-ba-loi`
đã đo CGT-DC «một mình». Số đo và bảng thay lời: `design_doc`.

## Acceptance criteria

### AC-1: Bộ chung bỏ đúng bốn ca, nói rõ vì sao
- **Given** bộ test app chung (`cd app && npm test`, tám tệp song song, DB của riêng lượt)
- **When** chạy trọn bộ
- **Then** thoát 0; bốn ca E4B-AC-3, E4B-AC-4, E4B-AC-7 và «CGT-DC đối chiếu DB máy thu chỉ đọc» báo bỏ qua với lý do
  gọi tên executor riêng của nó; ca «E4b đối chiếu DB máy thu» và ca bộ đếm CGT-DC vẫn chạy và đạt

### AC-2: Chạy riêng thì bốn ca chạy thật, nguyên trần
- **Given** executor riêng `tir_doi_chieu` và `can_gia_tot_doi_chieu` trên DB máy thu
- **When** chạy từng executor
- **Then** bốn ca chạy, không ca nào bỏ qua, với nguyên trần đã ký (700 ms mỗi sort, 20 tổ hợp, khối trần E4b giống
  hệt, đủ mọi tin P1); không hằng trần nào trong hai tệp test đổi so với `main` trước vòng; bản đột biến bỏ qua cả khi
  chạy riêng thì đỏ `BO QUA KHI CHAY RIENG`

### AC-3: Lời mới của E4B-AC-3
- **Given** bảng thay lời trong `design_doc`
- **When** người đọc tiêu chí E4B-AC-3 sau vòng này
- **Then** điều kiện đo là chạy riêng trên DB máy thu, bản mới dưới 700 ms ở cả bốn kiểu sắp; vế «trong suite app»
  thôi là điều kiện; CGT-DC giữ nguyên lời AC-7 của `can-gia-tot-sua-ba-loi`

## Coverage

Bỏ quét không gian — một trục (ca đo theo tải: chạy trong bộ chung · chạy riêng), quét đủ ở AC-1 và AC-2; lời đã ký
bị chạm ở AC-3.

## Out of scope

- Làm câu nhanh hơn: index 085 `sale_offer_records (seller_ref, seller_name)` (T3) cho E4b; tăng tốc `getDeal` cho
  CGT-DC — hàng sản phẩm riêng.
- Nới bất kỳ trần nào (700 ms, 1000 ms, 600 giây).
- Đổi lời `can-gia-tot-sua-ba-loi` AC-7.

## Notes

- Câu chỉ người biết (sổ, Hỏi-1, Hỏi-2): đổi lời tiêu chí đã ký E4B-AC-3; cho CGT-DC rời bộ chung.
