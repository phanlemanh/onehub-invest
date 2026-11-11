---
schema_version: 1
slug: dau-noi-dung-sql-bai-thu
feature: Các bản SQL chép định nghĩa bài thử (ops-flow, truy vấn collections của app, test-data-residue, 600_data_flow) nhận dấu noi-dung như testMarker, để số Ops và lệnh kiểm tin giả khớp tập transform đọc
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build           # Mạnh «Build» ở phiên giám sát dot0-cam-mau, Cổng Đáng GN5 (10/11)
decided_by: Mạnh
decided_at: 2026-11-10T11:00:00Z
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: GN5
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng GN5 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt gan-nhan-s03-0611, mã GN5
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Các bản SQL chép định nghĩa bài thử (ops-flow, truy vấn collections của app, test-data-residue, 600_data_flow) nhận dấu noi-dung như testMarker, để số Ops và lệnh kiểm tin giả khớp tập transform đọc

Vì sao: GN2 Ngoài-4, 5, 7, 8 — Mạnh ký «mở hợp đồng mới» ở Cổng Bằng chứng 07/11 (gộp một hàng, cùng gốc).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «test-data-residue --simulate xanh ngay sau gộp; «Bài nhận» Luồng 7 ngày và trang Dòng chảy dữ liệu không đếm bài thử của Mạnh» chưa?
- Kết quả nào là SỐNG: [đề xuất] test-data-residue --simulate xanh ngay sau gộp; «Bài nhận» Luồng 7 ngày và trang Dòng chảy dữ liệu không đếm bài thử của Mạnh
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «test-data-residue --simulate xanh ngay sau gộp; «Bài nhận» Luồng 7 ngày và trang Dòng chảy dữ liệu không đếm bài thử của Mạnh» khi hết timebox
- Timebox: …
