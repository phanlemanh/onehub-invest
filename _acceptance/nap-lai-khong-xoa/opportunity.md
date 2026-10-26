---
schema_version: 1
slug: nap-lai-khong-xoa
feature: "Nạp lại mọi nguồn không xoá hàng: khoá tin bền, retired_at thay DELETE, mọi khoá ngoại tới sale_offers và listings là RESTRICT"
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P2-60) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị» (gói lát OCP1, làn A)
decided_at: 2026-10-26T07:37:28Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL14
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL14 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn mốc trong `lo-trinh.json`; thuộc lát dọc OCP1, làn A, mốc L1 «Nền + đo» (nạp lại 3 lần, 0 quyết định người mất). Lưu ý giám sát: CASCADE → RESTRICT và DELETE → retired_at chạm cả sync-cloud và cloud — đo cloud trước, không tự áp.

Nạp lại mọi nguồn không xoá hàng: khoá tin bền, retired_at thay DELETE, mọi khoá ngoại tới sale_offers và listings là RESTRICT

Vì sao: L03: quyết định ghép căn đã mất thật; property_offers/candidates còn CASCADE; listings DELETE kéo theo lịch đêm.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất» chưa?
- Kết quả nào là SỐNG: [đề xuất] Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Ba lượt nạp lại liên tiếp: 0 quyết định người mất, 0 liên kết mất» khi hết timebox
- Timebox: …
