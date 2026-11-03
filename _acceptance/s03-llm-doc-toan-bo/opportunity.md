---
schema_version: 1
slug: s03-llm-doc-toan-bo
feature: LLM đọc toàn bộ chữ S03 ở lớp đề xuất, tự áp loại hình và ý định khi trích dẫn có thật và qua luật; giá, diện tích chỉ đối chiếu; bất đồng lên /ops/review
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build        # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-02T15:41:12Z    # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: LS1
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mạnh chốt «Chốt, chuyển việc» lúc 15:41:12Z ngày 02/11 ở phiên MT, trên kế hoạch `docs/plan/ra-mat-0511-so-luong-chat-luong.md` §3 việc 4; thợ đã đối chiếu nhật ký phiên. Đường ghi của LLM và tiền vẫn chờ Mạnh duyệt ở Cổng Phạm vi (§5 mục 3).

Mở từ hàng LS1 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` — chưa có trang: trang đợt ke-hoach-ra-mat-0211, mã V4
Mốc: Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống — 04/11/2026.

LLM đọc toàn bộ chữ S03 ở lớp đề xuất, tự áp loại hình và ý định khi trích dẫn có thật và qua luật; giá, diện tích chỉ đối chiếu; bất đồng lên /ops/review

Vì sao: Chỉ số AI của kế hoạch ra mắt: hiện ≤ 8,5% tin S03 có đề xuất, 4,1% có AI đã áp. Đích này để chứng minh mô hình AI, chưa đo được khả thi.

> Nếu Hỏi-1 được duyệt: «tự áp» chỉ gồm loại hình; ý định đối chiếu rồi lên /ops/review.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «≥ 90% tin S03 có đề xuất; ≥ 50% có AI đã áp; lệnh chạy trọn toàn bộ tin; giá, diện tích không bị AI ghi đè; chi cloud không quá 5 USD/ngày» chưa?
- Kết quả nào là SỐNG: [đề xuất] ≥ 90% tin S03 có đề xuất; ≥ 50% có AI đã áp; lệnh chạy trọn toàn bộ tin; giá, diện tích không bị AI ghi đè; chi cloud không quá 5 USD/ngày
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «≥ 90% tin S03 có đề xuất; ≥ 50% có AI đã áp; lệnh chạy trọn toàn bộ tin; giá, diện tích không bị AI ghi đè; chi cloud không quá 5 USD/ngày» khi hết timebox
- Timebox: [đề xuất] 2026-11-04 (mốc Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống)
