---
schema_version: 1
slug: mo-rong-luat-yeu-cau
feature: Luật nhận Yêu cầu bắt thêm các bài viết tắt («khách thuê 1pn…», «tìm 2pn…», «cần thuê gấp…») mà không kéo tin rao vào nhánh Yêu cầu; nhánh Yêu cầu trên Sankey DF6 đổi số theo
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh trả lời 5 câu Bảng Yêu cầu 10/11 ở phiên phân tích (PR #396); giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-10T00:26:09Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Đo 10/11: khoảng 1.300 bài Yêu cầu nằm trong 7.441 bài bị bỏ vì luật hiện có không bắt cách viết tắt; đọc tay 20 mẫu gần như đều là Yêu cầu thật, chưa đo precision.

Hàng YC2 trong `docs/plan/lo-trinh.json` (PR #396, bản phạm vi `docs/plan/pham-vi-bang-yeu-cau-1011.md`). Chồng vùng với GT8 (bài tìm về Yêu cầu trước khi gom) và DV4, DV5 ở transform-zalo.mjs; lịch xếp nối tiếp. Không cần YC0: đổi luật có hiệu lực cả trên DF6.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Trên nhãn bạc PL30 và một mẫu đọc tay 200 bài: precision của luật mới không thấp hơn luật cũ, recall tăng; số bài chuyển từ tin rao sang Yêu cầu và ngược lại có danh sách kèm câu trích; nhánh Yêu cầu của DF6 khớp đếm SQL?
- Kết quả nào là SỐNG: [đề xuất] Trên nhãn bạc PL30 và một mẫu đọc tay 200 bài: precision của luật mới không thấp hơn luật cũ, recall tăng; số bài chuyển từ tin rao sang Yêu cầu và ngược lại có danh sách kèm câu trích; nhánh Yêu cầu của DF6 khớp đếm SQL
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
