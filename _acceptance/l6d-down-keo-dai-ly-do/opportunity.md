---
schema_version: 1
slug: l6d-down-keo-dai-ly-do
feature: Heartbeat S03 cảnh báo L6(d) khi DOWN từ hai nhịp liền và ghi lý do DOWN (phiên mất hiệu lực hay kênh dừng) — hàng VHZ1
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-17T06:17:00Z     # ISO UTC — lời gõ ở phiên U2, trước merge 1e2af6487 (06:18:01Z)
lo_trinh_ma: VHZ1
lo_trinh_tep: docs/plan/lo-trinh.json
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sự cố 13/11–14/11: kênh S03 ngừng thu 34 giờ. Phiên mất hiệu lực nhưng `channels status` vẫn in «linked», nên lớp L6(c)
của bộ canh không bắn lần nào; heartbeat ghi «DOWN» vào log mà không ai đọc, và không phân biệt «kênh dừng» (khởi động lại
gateway là đủ) với «phiên mất hiệu lực» (phải quét QR). Người gặp: Mạnh và đội vận hành — mất 34 giờ dữ liệu S03.

## Quyết định

- **14/11** — Mạnh «Theo khuyến nghị» cho cả sáu việc ở §7 của `docs/ops/de-xuat-van-hanh-on-dinh-1411.md` (ROADMAP §3
  mục 49, vận hành ổn định sau sự cố S03 đứt 34 giờ); D3 (heartbeat phân biệt lý do + L6(d)) là hàng VHZ1, làn thu; D3–D8
  trong quyền giám sát tự xếp.
- **17/11, khoảng 06:17Z** — Mạnh gõ ở phiên U2: «Làm VHZ1 trước rồi VHZ2».

## Ngưỡng chết / ngưỡng UAT

Hàng nền vận hành — miễn con số trên màn (AGENTS.md «Hàng nền … ghi rõ là miễn»).

- Câu hỏi phép đo trả lời: sau gộp, heartbeat trên máy thu có ghi dòng đúng khuôn mỗi 15′ và, khi DOWN, có lý do?
- Kết quả nào là SỐNG: dòng `heartbeat zalouser` mới trong 15′ sau gộp; lần DOWN kế có `reason=` và cảnh báo L6(d) từ nhịp 2.
- Kết quả nào là CHẾT: heartbeat ngừng ghi dòng, hoặc một lần DOWN ≥ 30′ mà alerts log không có L6(d).
- Lệnh đo: `grep 'heartbeat zalouser' ~/.openclaw/logs/oneinvest-zalo-pipe.log | tail -1`;
  `grep 'heartbeat zalouser DOWN' ~/.openclaw/logs/oneinvest-zalo-pipe.log | tail -1`.
