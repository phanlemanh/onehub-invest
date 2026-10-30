---
schema_version: 1
slug: loc-enrich-thu-ops-audit
feature: Nhật ký thao tác Ops không bị dấu «đã thử» của enrich (enrich:thu) đẩy thao tác của người ra khỏi 100 dòng gần nhất
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T08:29:25Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

Mở từ mục Ngoài-4 của Cổng Bằng chứng `enrich-chay-sau-nap` (PR #201): Mạnh chọn «mở hợp đồng mới» khi ký 30/10
(sổ `_acceptance/enrich-chay-sau-nap/decisions.jsonl`, dòng `d-20261030T082925Z-25`). Giám sát xếp vào hàng việc của dãy U2.
Mốc: chưa gắn — hàng phát sinh từ Cổng 2, giám sát gắn mốc khi cập nhật lộ trình.

## Vấn đề & ai gặp

Người vận hành (vai admin) đọc nhật ký thao tác qua `GET /api/v1/ops/audit` — 100 dòng `ops_audit` mới nhất, không lọc.
Từ 31/10, job đêm `zalo-import-daily` ghi mỗi tin enrich đã thử một dòng `enrich:thu` (tối đa 50 dòng/đêm, `ENRICH_LIMIT`).
Sau một hai đêm, 100 dòng gần nhất gần như toàn dấu máy; thao tác của người (duyệt, hoàn tác, đổi chế độ thu…) bị đẩy ra.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Chỉ API admin này đọc ops_audit theo kiểu «N dòng gần nhất không lọc» | Còn chỗ khác bị lấn | grep `FROM ops_audit` trong app/ | Đã thử 30/10: chỉ route `api/v1/ops/audit` |
| 2 | Dấu `enrich:thu` không cần cho người đọc nhật ký | Người mất dấu vết enrich | Dấu vẫn nằm trong bảng; enrich-run in tổng kết vào log job | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] sau một đêm enrich chạy, 100 dòng nhật ký thao tác có còn đủ thao tác của người không?
- Kết quả nào là SỐNG: [đề xuất] nhật ký mặc định không có dòng `enrich:thu`; thao tác của người hiện như trước đêm enrich
- Kết quả nào là CHẾT: [đề xuất] dòng `enrich:thu` vẫn chiếm chỗ trong 100 dòng mặc định
- Timebox: …
