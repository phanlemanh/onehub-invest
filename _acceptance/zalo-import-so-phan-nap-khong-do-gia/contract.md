---
schema_version: 1
feature: "Phép so phần nạp của zalo-import-daily.sh (ZJ-AC-5) chứng trên hai commit cố định của vòng transform-zalo-boc-job-run, không báo đỏ giả khi làn ZCode sửa hợp lệ phần nạp"
slug: zalo-import-so-phan-nap-khong-do-gia
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: draft
design_doc: docs/superpowers/specs/2026-10-25-zalo-import-so-phan-nap-khong-do-gia-design.md
approved_by:
approved_at:
---

# Acceptance Contract: zalo-import-so-phan-nap-khong-do-gia

## Context

Ca ZJ-AC-5 của `scripts/zalo-import-job.test.mjs` so phần nạp của tệp bọc ở cây làm việc với bản ở merge-base; sau khi
PR #96 vào main, mọi sửa hợp lệ phần nạp của làn ZCode làm bộ `scripts/*.test.mjs` đỏ oan. Vòng này cho ca ấy so hai commit
cố định của vòng trước (`ec71694^` → `ec71694`). Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-35) theo lựa chọn
«Ngoài-4: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng `transform-zalo-boc-job-run`.

Source input: `_acceptance/zalo-import-so-phan-nap-khong-do-gia/opportunity.md`.

## Criteria

- AC-1: Given lịch sử có commit `ec71694` và cha của nó, When chạy ZJ-AC-5, Then ca so phần nạp (từ đầu tệp tới hết khối
  «nạp hỏng thì thoát 1») của hai bản lấy bằng `git show` và thấy bằng nhau từng byte; ca không đọc tệp bọc ở cây làm việc
  và không dùng merge-base.
- AC-2: Given một cây làm việc tạm từ HEAD có phần nạp của tệp bọc bị sửa (mô phỏng làn ZCode sửa hợp lệ), When chạy
  `scripts/zalo-import-job.test.mjs` hiện tại trong cây ấy, Then thoát 0.
- AC-3: Given cùng cây tạm ấy, When chạy bản `zalo-import-job.test.mjs` của main trước vòng (12b8942), Then thoát khác 0 và
  có dòng «ZJ-AC-5 phần nạp của tệp bọc đã đổi» — đối chứng rằng mô phỏng tái hiện đúng lỗi đỏ giả.
- AC-4: Given một cặp (trước, sau) giả mà `import_one` đổi một ký tự, When chạy hàm so của ZJ-AC-5, Then báo lệch; thiếu
  commit `ec71694` trong lịch sử thì ca đỏ với «thiếu lịch sử git».
- AC-5: Given main hiện tại, When chạy `scripts/zalo-import-job.test.mjs`, Then mọi ca xanh và ZJ-AC-5 chạy thật (không bỏ
  qua).

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — cây đang đo: main · nhánh ZCode sửa phần nạp → AC-2, AC-5
- Trục B — chiều đỏ: bản test cũ · cặp commit giả · thiếu lịch sử → AC-3, AC-4
- Trục C — nguồn so: commit cố định (không cây làm việc, không merge-base) → AC-1
- Later: ZJ-AC-3 ghim hành vi nạp làn ZCode.
- Never: đổi tệp bọc zalo-import-daily.sh.

## Đường đo

- Thước: «cây sửa hợp lệ phần nạp → tệp test xanh; phép so còn bắt được thay đổi phần nạp» · số từ:
  `scripts/zalo-import-job-lan.test.mjs` · bảo đảm bởi: AC-2, AC-3, AC-4
- CHẾT = AC-2 đỏ ở lượt chấm cuối của vòng (timebox = vòng này, tối đa 3 lượt chấm S4).

## Out of scope

- ZJ-AC-3 ghim hành vi nạp (số lần thử, state) — đổi hành vi nạp là đổi hợp đồng.
- Đổi `scripts/zalo-import-daily.sh`.

## Notes
