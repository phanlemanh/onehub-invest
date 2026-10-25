---
schema_version: 1
slug: zalo-import-so-phan-nap-khong-do-gia
feature: Phép so «phần nạp của zalo-import-daily.sh giữ nguyên» (ZJ-AC-5) chứng lời hứa của vòng trước trên hai commit cố định của vòng ấy, không báo đỏ giả khi làn ZCode sửa hợp lệ phần nạp sau này
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: giám sát đợt dot0-cam-mau (P4-35) theo lựa chọn «Ngoài-4: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng transform-zalo-boc-job-run
decided_at: 2026-10-25T06:43:54Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Sinh từ hồ sơ `transform-zalo-boc-job-run`: ở Cổng Bằng chứng 25/10 Mạnh ký «Ngoài-4: mở hợp đồng mới» (sổ
`_acceptance/transform-zalo-boc-job-run/decisions.jsonl`). Giám sát biến thành hàng của P4 (ưu tiên 95) ở P4-35.

Ca ZJ-AC-5 trong `scripts/zalo-import-job.test.mjs` so phần nạp của `scripts/zalo-import-daily.sh` với bản ở
`git merge-base HEAD origin/main`. Sau khi PR #96 vào main, mọi nhánh `zcode/*` sửa hợp lệ phần nạp (làn ZCode) sẽ làm ca
này đỏ — bộ `scripts/*.test.mjs` chung báo đỏ oan và cản việc gộp của làn ZCode.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] nhánh sửa hợp lệ phần nạp có còn làm tệp test job Zalo đỏ không, và phép so còn chứng được rằng PR #96 không đổi phần nạp không?
- Kết quả nào là SỐNG: [đề xuất] cây có phần nạp đã sửa → tệp test xanh; cặp giả có phần nạp đổi → phép so đỏ, nêu ZJ-AC-5, tệp bọc và rev
- Kết quả nào là CHẾT: [đề xuất] còn một cây sửa hợp lệ phần nạp mà tệp test đỏ, khi hết timebox
- Timebox: …
