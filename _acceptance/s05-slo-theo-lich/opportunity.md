---
schema_version: 1
slug: s05-slo-theo-lich
feature: check-freshness và /ops đo S05 theo nhịp 2 lượt/tuần — SLO_HOURS.S05 từ 12 lên 96 giờ ở cả hai bản chép, giữ parity với /ops
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-36) theo «Hỏi-1..5: theo khuyến nghị» của Mạnh cho đánh giá observability S05
decided_at: 2026-10-25T06:57:51Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Căn cứ: `docs/plan/danh-gia-observability-s05-2510.md` §4 hàng C1 và §5 việc P3 (làn Claude, xong trước 6/11). Từ 7/11 S05
chuyển sang lịch 2 lượt/tuần (thứ Ba + thứ Sáu); SLO hiện 12 giờ khiến S05 đỏ vĩnh viễn trên `check-freshness` và `/ops`.
Hàng chưa có trong `docs/plan/lo-trinh.json`; giám sát giao P4 (ưu tiên 94) và duyệt Cổng Đáng ở P4-36.

Người vận hành đọc `check-freshness` (CLI) và đèn độ tươi trên `/ops`: nguồn S05 chạy đúng lịch vẫn báo quá hạn, đèn đỏ
thành nhiễu nền, che mất lần S05 hỏng thật.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] với lịch 2 lượt/tuần chạy đúng, S05 có xanh ở mọi giờ trên cả CLI lẫn /ops không, và quá 96 giờ có báo quá hạn không?
- Kết quả nào là SỐNG: [đề xuất] quét từng giờ hai tuần theo lịch → luôn xanh; tuổi 97 giờ → quá hạn; hai bản chép khớp
- Kết quả nào là CHẾT: [đề xuất] còn một giờ trong lịch đúng mà S05 đỏ, hoặc hai bản lệch, khi hết timebox
- Timebox: trước 6/11
