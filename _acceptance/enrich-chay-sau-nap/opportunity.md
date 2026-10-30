---
schema_version: 1
slug: enrich-chay-sau-nap
feature: Enrich chạy theo lịch sau mỗi lượt nạp S03/S05, mỗi tin một giao dịch ngắn, lỗi LLM có đếm, ghi đề xuất và áp luật xác định
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T06:00:48Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

Mở từ yêu cầu `hang-moi` U2-15 của dãy U2 (đợt dot0-cam-mau). Hàng chưa có trong `docs/plan/lo-trinh.json`; giám sát
xếp vào hàng việc của đợt.
Mốc: chưa gắn — hàng phát sinh từ điều tra 30/10, giám sát gắn mốc khi cập nhật lộ trình.

## Vấn đề & ai gặp

Người vận hành mở `/ops/review` và `/ops/data-flow` thì không thấy đề xuất enrich nào. Khâu Enrich của dòng chảy
Thu thập → Phân loại → Enrich đứng yên. Bằng chứng: `docs/research/enrich-ngung-2610.md` (PR #196).
- Enrich chưa từng có lịch chạy; `enrich-run` chỉ chạy tay đúng một lần (lượt thử sáng 23/10).
- 394 tin S03/S05 thiếu trường đang chờ.
- `enrich-run` gói cả lượt trong một giao dịch, kể cả các lời gọi LLM (TD9), nên không đặt lịch được như hiện tại.

Cổng Đáng: build — Mạnh duyệt 30/10 «Đồng ý như đề xuất» (giám sát chuyển lời). Làm ngay ở U2, không đứng trên NT6:
hàng tự mang phần giao dịch ngắn mỗi tin của TD9.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Chuỗi enrich trên `main` (sau 044/045) còn chạy được | Phải sửa chuỗi trước khi lên lịch | `LIMIT=5 enrich-run --dry` trên :5433 (chỉ đọc) | Đã thử 30/10: 5/5 tin ra đề xuất E1 |
| 2 | LLM local sống lúc 00:00 | Lượt chỉ có E1, phần LLM rơi | Đếm lỗi LLM trong dòng tổng kết của lượt | Chưa thử |
| 3 | 50 tin mỗi lượt chạy xong trong vài phút | Job đêm kéo dài, giữ chỗ | Đo giờ chạy lượt trên DB thử | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] sau một đêm chạy, bảng đề xuất có dòng mới của lượt job và log job có dòng tổng kết enrich chưa?
- Kết quả nào là SỐNG: [đề xuất] mỗi đêm có một lượt enrich-run; đề xuất mới vào bảng; số lỗi LLM nằm trong dòng tổng kết; không thẻ nào bị treo bởi giao dịch dài
- Kết quả nào là CHẾT: [đề xuất] sau 3 đêm vẫn 0 đề xuất mới, hoặc job đêm đỏ vì bước enrich mà không gọi tên lỗi
- Timebox: …
