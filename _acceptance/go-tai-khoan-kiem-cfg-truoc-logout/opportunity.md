---
schema_version: 1
slug: go-tai-khoan-kiem-cfg-truoc-logout
feature: Gỡ tài khoản Zalo trên /ops/sources kiểm bản cấu hình sau khi gỡ TRƯỚC lệnh openclaw logout — cấu hình phạm bất biến bộ canh thì từ chối mà không đăng xuất phiên nào
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-26) theo lựa chọn của Mạnh ở Cổng Bằng chứng ON24
decided_at: 2026-10-25T03:34:05Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `nhom-moi-requiremention` (ON24): ở Cổng Bằng chứng 25/10 Mạnh ký «Ngoài-1: mở hợp đồng mới» (sổ
`_acceptance/nhom-moi-requiremention/decisions.jsonl`, dòng `d-20261025T012441Z-7`). Hàng chưa có trong
`docs/plan/lo-trinh.json`; giám sát giao P4 25/10 (ưu tiên 89 — an toàn Zalo) và duyệt Cổng Đáng ở P4-26.

Người vận hành bấm gỡ một tài khoản thu trên `/ops/sources` khi `openclaw.json` đang phạm bất biến bộ canh (vd một nhóm
khác `requireMention:false`). `deleteZaloAccount` gọi `openclaw channels logout` TRƯỚC, rồi mới tới `writeCfg` — nơi bước
kiểm chặn ghi. Kết quả: lỗi 400, tài khoản vẫn còn trong cấu hình nhưng phiên Zalo của nó đã bị đăng xuất (gỡ nửa chừng).

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] gỡ tài khoản trên cấu hình phạm bất biến (phần còn lại sau khi gỡ) có còn gọi lệnh logout nào không?
- Kết quả nào là SỐNG: [đề xuất] cấu hình phạm → 400, openclaw giả nhận 0 lệnh, cấu hình giữ nguyên byte; cấu hình sạch → logout đúng một lần rồi gỡ
- Kết quả nào là CHẾT: [đề xuất] còn một ca cấu hình phạm mà lệnh logout vẫn chạy khi hết timebox
- Timebox: …
