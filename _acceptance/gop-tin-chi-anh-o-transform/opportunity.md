---
schema_version: 1
slug: gop-tin-chi-anh-o-transform
feature: Transform gộp tin chỉ có ảnh vào tin chữ liền trước hoặc liền sau cùng nhóm, cùng người gửi, cách nhau dưới 2 phút; raw giữ nguyên từng event
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T05:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL28
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL28 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã Z3.1
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Transform gộp tin chỉ có ảnh vào tin chữ liền trước hoặc liền sau cùng nhóm, cùng người gửi, cách nhau dưới 2 phút; raw giữ nguyên từng event

Vì sao: L06: 59/80 tin bị bỏ là tin chỉ ảnh. ZCode đề xuất gộp ở transform (làn Claude) để raw giữ đúng event (§6). Cần L20 sửa trước để tin ảnh không mất lúc ingest.

Cổng Đáng: build, Mạnh duyệt 30/10 ~05:00Z bằng câu «Xếp theo bốn làn» (luật đợt dot0-cam-mau, mục «Bốn làn lõi»: PL28 nằm trong danh sách Cổng Đáng = build, dãy P1 đọc tin S03 làm nối tiếp sau s03-gia-ty-sau-khoang-trang); giám sát xác nhận ở P1-60.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: mọi tin chỉ-ảnh có tin chữ cùng người trong 2 phút ở hai phía có được gộp vào tin chữ gần nhất, và offer S03 có ảnh đạt ngưỡng chưa?
- Kết quả nào là SỐNG: offer S03 có ảnh ≥ 45% (Mạnh chọn ở Cổng Phạm vi 30/10, Hỏi-1: quy tắc gần nhất); mẫu một ngày mọi tin chỉ-ảnh có tin chữ cùng người trong 2 phút ở hai phía đều gộp vào tin chữ gần nhất; raw không đổi
- Kết quả nào là CHẾT: offer S03 có ảnh dưới 45%, hoặc ảnh gắn sang tin chữ không phải gần nhất, hoặc raw đổi
- Timebox: một vòng T2.
