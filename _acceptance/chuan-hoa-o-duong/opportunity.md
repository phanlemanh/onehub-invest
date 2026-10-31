---
schema_version: 1
slug: chuan-hoa-o-duong
feature: Luật ghép căn và bảng so thẻ duyệt không còn kết luận «đường khác» khi một tin ghi ngõ/ngách/số nhà hay tên dự án vào ô đường còn tin kia chỉ ghi tên phố
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-10-31T09:00:00Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Hàng phát sinh `chuan-hoa-o-duong` (dãy U2, sau HD2), không có trong `docs/plan/lo-trinh.json`; giám sát duyệt hàng ở
yêu cầu U2-44. Nguồn: Ngoài-1 của Cổng Bằng chứng HD2 vòng 2 (`_acceptance/judge-luat-loai-tru-dac-trung/review-findings.md`),
Mạnh «Tách việc riêng» (31/10).
Cổng Đáng: build — Mạnh «Đồng ý như khuyến nghị» (31/10, giám sát chuyển lời); khuyến nghị là BUILD vì luật «đường khác»
tách nhầm ~6% tin do ô đường ghi ngõ/số nhà/tên dự án; phạm vi judge-entity + bảng so thẻ duyệt.

Người duyệt hàng ghép căn: hai tin của cùng một căn, một tin ghi «Ngõ 254 Minh Khai», tin kia «Minh Khai», bị luật kết
luận «khác căn» và thẻ hiện «Lệch» ở dòng đường. Trên DB máy thu 31/10: 496/8.219 giá trị `street_raw` bắt đầu bằng
ngõ/ngách/hẻm/kiệt hoặc chữ số.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] mọi ô đường thật có cụm vị trí đầu chuỗi so «Khớp» với chính tên đường của nó, và không thẻ «Cùng căn» nào người đã quyết mang lý do «đường khác».
