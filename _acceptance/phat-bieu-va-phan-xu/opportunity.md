---
schema_version: 1
slug: phat-bieu-va-phan-xu
feature: Bảng phát biểu append-only và bộ phân xử ba lớp dựng cột canonical kèm provenance, chạy lại ra y nguyên
owner: phanlemanh@gmail.com
stage: decided                # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P2-64) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị» (gói lát OCP1, làn A)
decided_at: 2026-10-26T15:32:48Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL15
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL15 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/phan-loai-2310.md#207e19a6bf1b5a1b08cf1f0316966df0fa292fa6` — chưa có trang: mã C2.1b
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Bảng phát biểu append-only và bộ phân xử ba lớp dựng cột canonical kèm provenance, chạy lại ra y nguyên

Vì sao: §0.2 T3+T7: thay ghi thẳng + fill-gap (L02, L12).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Xoá cột canonical rồi dựng lại: kết quả trùng từng ô» chưa?
- Kết quả nào là SỐNG: [đề xuất] Xoá cột canonical rồi dựng lại: kết quả trùng từng ô
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Xoá cột canonical rồi dựng lại: kết quả trùng từng ô» khi hết timebox
- Timebox: một vòng feature-loop, tối đa 3 lượt chấm S4; hết trần mà chưa đạt thì dừng ở trần lượt (thu phạm vi hay chấm thêm do Mạnh chọn).
