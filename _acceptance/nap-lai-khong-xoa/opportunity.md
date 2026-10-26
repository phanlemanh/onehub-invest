---
schema_version: 1
slug: nap-lai-khong-xoa
feature: "Nạp lại mọi nguồn không xoá hàng: khoá tin bền, retired_at thay DELETE, mọi khoá ngoại tới sale_offers và listings là RESTRICT"
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL14
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL14 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn — việc này chưa thuộc mốc nào của kế hoạch; gắn nó vào một mốc, hoặc ghi vì sao chưa.

Nạp lại mọi nguồn không xoá hàng: khoá tin bền, retired_at thay DELETE, mọi khoá ngoại tới sale_offers và listings là RESTRICT

Vì sao: L03: quyết định ghép căn đã mất thật; property_offers/candidates còn CASCADE; listings DELETE kéo theo lịch đêm.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất» khi hết timebox
- Timebox: …
