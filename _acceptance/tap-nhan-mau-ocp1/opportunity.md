---
schema_version: 1
slug: tap-nhan-mau-ocp1
feature: Tập nhãn mẫu sinh từ khuôn tin thật của Ocean Park 1, mang nhãn mẫu, nằm ngoài bảng canonical
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-30T03:30:00Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL8
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL8 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6`
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Tập nhãn mẫu sinh từ khuôn tin thật của Ocean Park 1, mang nhãn mẫu, nằm ngoài bảng canonical

Vì sao: PL9 cần nhãn trước khi đội gắn xong (việc vận hành). Sinh từ khuôn, không viết tay; tuyệt đối không vào bảng canonical (bài học L19).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Sinh lại hai lần ra cùng tập; 0 dòng mẫu trong sale_offers» chưa?
- Kết quả nào là SỐNG: [đề xuất] Sinh lại hai lần ra cùng tập; 0 dòng mẫu trong sale_offers
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Sinh lại hai lần ra cùng tập; 0 dòng mẫu trong sale_offers» khi hết timebox
- Timebox: …

## Cổng 0

- **decision = build** Căn cứ: Mạnh trong phiên P4 30/10: «P4 làm cả hai: nhan-gia-va-luu-loi-mang trước, rồi PL8»; giám sát P4-92 «Sau đó PL8 tap-nhan-mau-ocp1 (Cổng Đáng cùng câu)».
- **disposition = (không có bản mẫu)**
