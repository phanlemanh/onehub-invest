---
schema_version: 1
feature: "Phép so phần nạp của zalo-import-daily.sh (ZJ-AC-5) chứng trên hai commit cố định của vòng transform-zalo-boc-job-run, không báo đỏ giả khi làn ZCode sửa hợp lệ phần nạp"
slug: zalo-import-so-phan-nap-khong-do-gia
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T07:46:46Z
design_doc: docs/superpowers/specs/2026-10-25-zalo-import-so-phan-nap-khong-do-gia-design.md
approved_by:
approved_at:
---

# Acceptance Contract: zalo-import-so-phan-nap-khong-do-gia

## Context

Ca ZJ-AC-5 của `scripts/zalo-import-job.test.mjs` so phần nạp của tệp bọc ở cây làm việc với bản ở merge-base; sau khi
PR #96 vào main, mọi sửa hợp lệ phần nạp của làn ZCode làm bộ `scripts/*.test.mjs` đỏ oan. Vòng này cho ca ấy so tác động ròng
của PR #96 lên main (merge commit `e962e78`: `e962e78^1` → `e962e78`). Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-35) theo lựa chọn
«Ngoài-4: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng `transform-zalo-boc-job-run`.

Source input: `_acceptance/zalo-import-so-phan-nap-khong-do-gia/opportunity.md`.

## Criteria

- AC-1: Given lịch sử có merge commit `e962e78` của PR #96, When chạy ZJ-AC-5, Then ca so phần nạp (từ đầu tệp tới hết
  khối «nạp hỏng thì thoát 1») của `e962e78^1` và `e962e78` lấy bằng `git show`: mốc có ở cả hai bản, phần cắt chứa
  `for try in 1 2 3 4 5`, hai phần bằng nhau từng byte; ca vẫn xanh khi tệp bọc ở cây làm việc bị xoá và không dùng
  merge-base.
- AC-2: Given một cây làm việc tạm từ HEAD có phần nạp của tệp bọc bị sửa (mô phỏng làn ZCode sửa hợp lệ), When chạy
  `scripts/zalo-import-job.test.mjs` hiện tại trong cây ấy, Then thoát 0.
- AC-3: Given cùng cây tạm ấy, When chạy bản `zalo-import-job.test.mjs` của main trước vòng (12b8942), Then thoát khác 0 và
  có dòng «ZJ-AC-5 phần nạp của tệp bọc đã đổi» — đối chứng rằng mô phỏng tái hiện đúng lỗi đỏ giả.
- AC-4: Given (a) một cặp (trước, sau) giả mà `import_one` đổi một ký tự, (b) ca trỏ một rev không có, (c) một bản clone
  nông (`git clone --depth 1`), When chạy ZJ-AC-5, Then (a) báo lệch với thông điệp nêu «ZJ-AC-5», tệp bọc và rev; (b), (c)
  đỏ với «thiếu lịch sử git».
- AC-5: Given main hiện tại, When chạy `scripts/zalo-import-job.test.mjs`, Then mọi ca xanh và ZJ-AC-5 chạy thật (không bỏ
  qua).

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — cây đang đo: main · nhánh ZCode sửa phần nạp · cây làm việc thiếu tệp bọc · bản clone nông → AC-1, AC-2, AC-4, AC-5
- Trục B — chiều đỏ: bản test cũ · cặp commit giả · thiếu lịch sử → AC-3, AC-4
- Trục C — nguồn so: commit cố định (không cây làm việc, không merge-base) → AC-1
- Later: ZJ-AC-3 ghim hành vi nạp làn ZCode.
- Never: đổi tệp bọc zalo-import-daily.sh.

## Đường đo

- Thước: «cây sửa hợp lệ phần nạp → tệp test xanh; phép so còn chứng được PR #96 không đổi phần nạp» · số từ:
  `scripts/zalo-import-job-lan.test.mjs` · bảo đảm bởi: AC-2, AC-3, AC-4
- CHẾT = AC-2 đỏ ở lượt chấm cuối của vòng (timebox = vòng này, tối đa 3 lượt chấm S4).

## Out of scope

- ZJ-AC-3 ghim hành vi nạp (số lần thử, state) — đổi hành vi nạp là đổi hợp đồng.
- Đổi `scripts/zalo-import-daily.sh`.
- Rào làn cho vòng làn Claude tương lai sửa phần nạp — xem dòng `descope` «bỏ rào làn tương lai».

## Notes
