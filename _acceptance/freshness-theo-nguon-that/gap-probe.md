---
slug: freshness-theo-nguon-that
at: 2026-10-23T11:05:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + sổ d-1 | SLO S01/S02/S03 là việc người chốt mà sổ ghi máy quyết; câu trích ops-queries.ts chỉ đỡ S05/S06 và ngược với ba số kia [enrich-hau-ky#F1] | Ngưỡng «chỉ S05» đạt nhờ chọn bảng ADR-0007 mà chưa ai duyệt; theo bảng app thì S01 đang đứng | Dòng Hỏi thay d-1 cho S01/S02/S03, kèm số đo hai lối | human-gate1: Hỏi-1 (dòng sổ mới); S05/S06 tách thành dòng máy quyết riêng thay d-1; design §2.4 có bảng hai lối + số lỗi DB 23/10; Notes của contract ghi hai bảng SLO lệch tới AU6 |
| P1 | evals E7/E8 | Mã thoát của CLI thật chưa đo — chỉ gọi runCheck | Vỏ CLI nuốt mã → cron và audit-all mất báo động mà E7/E8 xanh | Tiến trình con CLI thật, đối chứng dương thoát 0 | fixed: AC-7 chạy CLI thật trên schema tạm (`--schema`, `--now`) đo thoát 0/1; AC-8 đòi cả hai CLI thoát 1 trên DB lúc chấm |
| P1 | contract AC-7 | SPL chỉ kiểm âm tính trên stdout/json, không đo webhook, không đối chứng dương | Tên nguồn thật đi vào body webhook mà E7 xanh; fixture rỗng làm phép «không chứa» hằng đúng | Webhook về máy chủ HTTP local + chuỗi canh có-trước-vắng-sau | fixed: AC-7 thêm webhook local (đúng một body có S05/hanoi) + chuỗi canh REALNAME-CANARY kiểm có trong registry trước khi kiểm vắng ở stdout/stderr/json/body |
| P2 | evals E8 | Chỉ ghim chuỗi S05/hanoi; vế «đứng từ 21/10» không đo; không ghi giờ chấm | S05 lấy sai hàng vẫn đạt; chấm muộn thì S01/hcmc đỏ vì lý do ngoài feature | In status + last + giờ chấm; lệch do nguồn thật đổi → ngoài hợp đồng | fixed: AC-8/E8 đòi status stale + last 2026-10-21T14:02 ±1′ + giờ chấm; lệch do nguồn thật ghi ngoài hợp đồng |
| P2 | contract AC-7 | Dòng chữ chỉ kiểm có-mặt; lời hứa là quan hệ tuổi/SLO đúng hàng | In S05/hanoi kèm SLO của S06 vẫn xanh | now cố định, S05 = now − 13 giờ, đòi 13 / 12 ở dòng chữ và cùng hàng json | fixed: AC-7(b) ghim tuổi 13 giờ, SLO 12 giờ cho đúng hàng S05/hanoi ở cả dòng chữ và --json |
