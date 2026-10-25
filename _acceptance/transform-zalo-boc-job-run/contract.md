---
schema_version: 1
feature: "Job nạp Zalo hằng đêm thoát khác 0 khi bước transform-zalo hoặc refresh-bait-gap hỏng, mỗi bước hỏng in một dòng JOB FAIL; phần nạp giữ nguyên"
slug: transform-zalo-boc-job-run
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: draft
design_doc: docs/superpowers/specs/2026-10-25-transform-zalo-boc-job-run-design.md
approved_by:
approved_at:
---

# Acceptance Contract: transform-zalo-boc-job-run

## Context

`scripts/zalo-import-daily.sh` (job launchd `com.oneinvest.zalo-import`) chạy trần `transform-zalo` rồi
`refresh-bait-gap` ở cuối một tệp không `set -e`, nên transform hỏng mà refresh lành thì job vẫn thoát 0. Vòng này bọc
hai bước làn Claude bằng `job_run` của `scripts/lib/job-step.sh` như `apify-facebook-daily.sh` (AU3). Cổng Đáng `build`:
giám sát đợt `dot0-cam-mau` (P4-33) theo lựa chọn «Ngoài-3: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng AU3.

Source input: `_acceptance/transform-zalo-boc-job-run/opportunity.md`.

## Criteria

- AC-1: Given cây tạm có một snapshot Zalo mới và mọi bước lành, When chạy tệp bọc thật, Then job thoát 0, gọi đúng thứ
  tự import-airbnb → transform-zalo → refresh-bait-gap, và stderr không có dòng «JOB FAIL».
- AC-2: Given ma trận viết trước ba tổ hợp hỏng — chỉ transform-zalo (mã 3), chỉ refresh-bait-gap (mã 4), cả hai (3 và 5)
  —, When chạy tệp bọc, Then job thoát bằng mã của bước hỏng đầu (3, 4, 3), cả hai bước đều được gọi, và stderr có đúng
  một dòng «JOB FAIL [zalo-import-daily] bước <nhãn> mã <n>» cho mỗi bước hỏng, không dòng nào cho bước lành.
- AC-3: Given bước nạp import-airbnb hỏng (lỗi không phải ECONNREFUSED), When chạy tệp bọc, Then job thoát 1 như trước
  vòng, transform-zalo và refresh-bait-gap không được gọi, không có dòng «JOB FAIL», và tệp state không nhảy qua snapshot
  hỏng.
- AC-4: Given bản tệp bọc ở main trước vòng (146eca2), When chỉ transform-zalo hỏng (mã 3), Then bản ấy thoát 0 — đối
  chứng: phép đo AC-2 biết báo đỏ trên lỗi cũ.
- AC-5: Given bản tệp bọc sau vòng, When so với bản ở main trước vòng, Then mọi dòng từ đầu tệp tới hết khối «nạp hỏng thì
  thoát 1» giữ nguyên từng byte (phần nạp làn ZCode không đổi).
- AC-6: Given phép đo chạy, When dựng cây tạm, Then PATH chỉ gồm node giả và /usr/bin:/bin, HOME là thư mục tạm,
  DATABASE_URL trỏ cổng đóng, và mọi lời gọi node giả đều nằm trong ba nhãn import-airbnb/transform-zalo/refresh-bait-gap.
- AC-7: Given người vận hành đọc `docs/ops/runtime-map.md`, When tra bảng «Job đêm báo lỗi thật», Then có dòng
  `com.oneinvest.zalo-import` (`scripts/zalo-import-daily.sh`) ghi «thoát ≠ 0 (mã của bước hỏng đầu)» và cách grep dòng
  JOB FAIL trong log của job.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — trạng thái hai bước làn Claude: lành · chỉ transform hỏng · chỉ refresh hỏng · cả hai hỏng → AC-1, AC-2
- Trục B — bước nạp hỏng → AC-3
- Trục C — bản cũ (đối chứng) · bản mới · phần nạp không đổi → AC-4, AC-5
- Trục D — rào phép đo, tài liệu vận hành → AC-6, AC-7
- Later: cảnh báo chủ động khi job đỏ.
- Never: phép đo chạy node thật, DB thật hay chạm OpenClaw.

## Đường đo

- Thước: «mọi tổ hợp hỏng của hai bước → mã thoát khác 0 và dòng JOB FAIL» (SỐNG của ô cơ hội) · số từ:
  `scripts/zalo-import-job.test.mjs` · bảo đảm bởi: AC-2, AC-4
- CHẾT = một dòng ma trận AC-2 thoát 0 ở lượt chấm cuối của vòng (timebox = vòng này, tối đa 3 lượt chấm S4).

## Out of scope

- Đoạn nạp (`import_one`, state, khoá) — làn ZCode.
- Dừng chuỗi khi transform hỏng (refresh vẫn chạy như cũ).
- Plist launchd và cảnh báo khi job đỏ.

## Notes
