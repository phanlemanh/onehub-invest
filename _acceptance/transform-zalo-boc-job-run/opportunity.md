---
schema_version: 1
slug: transform-zalo-boc-job-run
feature: Job nạp Zalo hằng đêm (scripts/zalo-import-daily.sh) thoát khác 0 khi bước transform-zalo hoặc refresh-bait-gap hỏng — hai bước làn Claude bọc job_run như các job đêm khác
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-33) theo lựa chọn của Mạnh ở Cổng Bằng chứng AU3
decided_at: 2026-10-25T05:39:02Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `au3-nap-bao-loi` (AU3): ở Cổng Bằng chứng 25/10 Mạnh ký «Ngoài-3: mở hợp đồng mới» (sổ
`_acceptance/au3-nap-bao-loi/decisions.jsonl`, dòng `d-20261025T045838Z-3`). Hàng chưa có trong `docs/plan/lo-trinh.json`;
giám sát chuyển từ dãy P3 sang P4 (P4-32, ưu tiên 93) và duyệt Cổng Đáng ở P4-33.

Người vận hành xem trạng thái job launchd `zalo-import` để biết offer Zalo đêm qua có cập nhật không. Cuối
`scripts/zalo-import-daily.sh`, `transform-zalo.mjs` và `refresh-bait-gap.mjs` chạy trần trong một tệp không `set -e`:
transform hỏng mà refresh lành thì job thoát 0 — offer mới ngừng cập nhật mà không ai biết.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] bước transform-zalo hoặc refresh-bait-gap hỏng thì job có thoát khác 0 và in dòng JOB FAIL nêu bước không?
- Kết quả nào là SỐNG: [đề xuất] mọi tổ hợp hỏng của hai bước → mã thoát của bước hỏng đầu, mỗi bước hỏng một dòng JOB FAIL; đủ hai bước vẫn chạy; phần nạp không đổi
- Kết quả nào là CHẾT: [đề xuất] còn một tổ hợp bước hỏng mà job thoát 0 khi hết timebox
- Timebox: …
