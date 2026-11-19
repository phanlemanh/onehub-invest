---
schema_version: 1
slug: watchdog-tu-khoi-dong-gateway
feature: Watchdog tự khởi động lại gateway OpenClaw khi kênh S03 treo (trần 1 lần mỗi 6 giờ, chỉ khi lockdown xanh, không lượt agent dở; phiên chết thì báo cần QR) — hàng VHZ2
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh
decided_at: 2026-11-17T06:17:00Z     # ISO UTC — lời gõ ở phiên U2 «Làm VHZ1 trước rồi VHZ2»
lo_trinh_ma: VHZ2
lo_trinh_tep: docs/plan/lo-trinh.json
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Bộ tự khởi động lại kênh của OpenClaw treo 3/10 lần (07/11, 09/11, 13/11): kênh S03 trong tiến trình gateway đã chết mà
launchd không biết, nên không ai khởi động lại tới khi người phát hiện — sự cố 09/11 đứt 23 giờ, 13/11 đứt 34 giờ. Người gặp:
Mạnh và đội vận hành — mất dữ liệu S03 cho tới khi có người can thiệp tay.

## Quyết định

- **14/11** — Mạnh «Theo khuyến nghị» cho sáu việc §7 của `docs/ops/de-xuat-van-hanh-on-dinh-1411.md` (ROADMAP §3 mục 49);
  P1 là hàng VHZ2: cho phép watchdog khởi động lại gateway với trần 1 lần mỗi 6 giờ, chỉ khi lockdown xanh và không lượt
  agent dở; không bao giờ tự quét QR, không đổi cấu hình.
- **17/11, khoảng 06:17Z** — Mạnh gõ ở phiên U2: «Làm VHZ1 trước rồi VHZ2». VHZ1 đã gộp (#480, d7f6badcc).
- Giám sát 17/11: «báo qua bộ đẩy» ngoài phạm vi theo tên, chờ VH1 (làn P3); cảnh báo của vòng này dừng ở alerts log +
  thông báo màn hình.

## Ngưỡng chết / ngưỡng UAT

Hàng nền vận hành — miễn con số trên màn (AGENTS.md «Hàng nền … ghi rõ là miễn»).

- Câu hỏi phép đo trả lời: sau gộp, khi kênh S03 treo kiểu 09/11, watchdog có tự khởi động lại gateway đúng một lần và ghi sổ?
- Kết quả nào là SỐNG: lần treo kế có dòng tự khởi động trong `pipeline/logs/zalo-watchdog-p1.log` và kênh có snapshot mới
  trong 15′ sau đó; lần phiên chết có cảnh báo «CẦN QUÉT QR», không khởi động lại lặp.
- Kết quả nào là CHẾT: kênh treo ≥ 30′ mà không có dòng tự khởi động lẫn cảnh báo; hoặc hơn 1 lần khởi động trong 6 giờ.
- Lệnh đo: `tail -1 pipeline/logs/zalo-watchdog-p1.log` (lần tự khởi động gần nhất).
