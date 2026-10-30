---
schema_version: 1
slug: eval-classify-wilson
feature: Người vận hành dữ liệu chạy eval:classify và nhận độ đúng từng (cách đọc × trường × phân khúc) theo cận dưới Wilson so với ngưỡng F3, ghi vào dq_check_results
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T10:00:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL9
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL9 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C1.4
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Người vận hành dữ liệu chạy eval:classify và nhận độ đúng từng (cách đọc × trường × phân khúc) theo cận dưới Wilson so với ngưỡng F3, ghi vào dq_check_results

Vì sao: L05: không tầng nào có tập nhãn; số cũ là độ phủ hoặc đo trên mock. Tiêu chí cần nhãn thật thành ô bỏ qua có tên.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] một lệnh có cho người vận hành độ đúng của từng ô (cách đọc × trường × phân khúc) theo cận dưới Wilson so với ngưỡng F3, ghi vào dq_check_results, không đếm tay?
- Kết quả nào là SỐNG: [đề xuất] `eval:classify` trên lát OCP1 ghi đủ một dòng mỗi ô, số cận dưới khớp bảng cỡ tập của F3, ô chưa có nhãn người hay chưa có cách đọc là «bỏ qua» có tên lý do
- Kết quả nào là CHẾT: [đề xuất] còn phải đếm tay, hoặc có ô thiếu dòng / ô trống không lý do khi hết timebox
- Timebox: …

## Cổng 0

- **decision = build** Căn cứ: Mạnh trong phiên P4 30/10 trả lời yêu cầu P4-99 (Cổng Đáng PL9): «build».
- **disposition = (không có bản mẫu)**
