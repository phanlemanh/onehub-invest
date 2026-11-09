---
schema_version: 1
slug: bai-nhan-tru-bai-chi-anh
feature: Người vận hành mở /ops/data-flow và thấy chặng «Bài nhận → Đọc được» của S03 tính trên bài có chữ: tin nhắn chỉ có ảnh đã ghép vào tin không còn nằm trong mẫu số, và bài Yêu cầu mua/thuê là một nhánh riêng trên Sankey
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh duyệt 09/11 qua phiên DA «Truy kẹt S03: trường lõi + tin không ảnh» («Đồng ý»); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-08T23:40:36Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Đo 09/11 (snapshot 22:42Z 08/11): 43.828/110.089 bài nhận S03 (39,8%) chỉ là tin nhắn URL ảnh, bị đếm vào mẫu số nên tỉ lệ đọc được hiện 43%; bỏ chúng thì 71,5%. 11.360 bài Yêu cầu bị loại đúng nhưng hiện như rơi.

Hàng DF4 trong `docs/plan/lo-trinh.json` (PR #379). Mạnh duyệt 09/11 qua phiên DA truy kẹt S03. Bài chỉ-ảnh chưa ghép vào tin (trong cửa sổ PL28, sau này GT0) vẫn tính là rơi, ghi lý do «ảnh chưa ghép». Đi trước DF5 vì cùng tệp 600.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Số bài chỉ-ảnh bị bỏ khỏi mẫu số khớp đếm SQL độc lập; tổng các nhánh bằng số bài nhận; S06 và S05 không đổi số; nhánh Yêu cầu khớp số bài Yêu cầu?
- Kết quả nào là SỐNG: [đề xuất] tỉ lệ «Đọc được» của S03 tính trên bài có chữ, khớp đếm SQL độc lập; nhánh Yêu cầu tách riêng; S06, S05 không đổi số
- Kết quả nào là CHẾT: [đề xuất] mẫu số vẫn lẫn bài chỉ-ảnh, hoặc tổng nhánh không bằng số bài nhận
- Timebox: một vòng
