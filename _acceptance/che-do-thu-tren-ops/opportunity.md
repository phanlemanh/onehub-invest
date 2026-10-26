---
schema_version: 1
slug: che-do-thu-tren-ops
feature: /ops/sources hiện và đổi chế độ thu (Chờ · Bùng · Duy trì) của từng điểm thu — bật Bùng chỉ admin, bắt buộc hạn ≤ 14 đêm, máy tự hạ về Duy trì khi hết hạn và ghi ops_audit
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (LUAT.md 25/10 06:54) theo «Hỏi-1..4: theo khuyến nghị» của Mạnh cho kế hoạch vết dầu loang
decided_at: 2026-10-25T06:54:32Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Căn cứ: `docs/plan/vet-dau-loang-thu-thap-2510.md` §4 hàng C7 («`/ops/sources` hiện và đổi `mode` của từng điểm (admin). Bật
`bung` bắt buộc nhập hạn. Máy hạ thì ghi `ops_audit`.»), §1.4 (tăng tải thì người duyệt, giảm tải thì máy tự làm; BÙNG có
hạn) và §6 Hỏi-3 (Mạnh duyệt từng lần bật BÙNG; máy tự hạ về DUY TRÌ, có audit). Giám sát xếp hàng vào dãy P4 (ưu tiên 96).

Người vận hành (Mạnh, quyền admin) cần một chỗ để bật đợt BÙNG cho một điểm thu (đợt 1: TP.HCM) và thấy điểm nào đang ở chế
độ nào, hạn tới đâu. Hiện chế độ chỉ là ý trong kế hoạch: `source_groups.params` chưa có khoá `mode`, trang không hiện, không
có lối đặt; không có gì ngăn một đợt bùng chạy mãi.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] admin bật Bùng có hạn trên /ops/sources được không, người không phải admin có bị chặn không, và đợt bùng hết hạn có tự về Duy trì kèm dòng audit không?
- Kết quả nào là SỐNG: [đề xuất] bật/hạ đúng luật trên lược đồ tạm, mọi lần đổi có đúng một dòng ops_audit, bùng quá hạn về Duy trì ở lượt quét kế
- Kết quả nào là CHẾT: [đề xuất] còn một đường bật Bùng không hạn hoặc không phải admin, hoặc một lần đổi chế độ không để lại audit, khi hết timebox
- Timebox: trước đợt 1 TP.HCM (sau khi ZCode xong V1 đọc chế độ)
