---
schema_version: 1
slug: so-tu-vung-mot-nguon
feature: Một sổ từ vựng sinh bảng ref_*, hằng TS/JS, enum prompt và nhãn tiếng Việt; lint đỏ khi có enum viết tay ngoài sổ
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P2-56) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị» (gói lát OCP1)
decided_at: 2026-10-26T00:25:30Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: PL6
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng PL6 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Mốc: chưa gắn mốc trong `lo-trinh.json`; thuộc lát dọc OCP1, làn A, mốc L1 «Nền + đo» (`.acceptance-runs/dieu-phoi-dot0-cam-mau/lat-ocp1-huong-tiep-can-2610.md` §3, Mạnh duyệt 26/10).

Một sổ từ vựng sinh bảng ref_*, hằng TS/JS, enum prompt và nhãn tiếng Việt; lint đỏ khi có enum viết tay ngoài sổ

Vì sao: L07/L08: từ vựng loại BĐS ở 12 chỗ; thiếu listing_intent, offer_status, mã căn, price_basis, giá khoảng (F1).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Cấy một enum viết tay: lint đỏ; mọi CHECK của 025 VALIDATE được» chưa?
- Kết quả nào là SỐNG: [đề xuất] Cấy một enum viết tay: lint đỏ; mọi CHECK của 025 VALIDATE được
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Cấy một enum viết tay: lint đỏ; mọi CHECK của 025 VALIDATE được» khi hết timebox
- Timebox: …
