---
schema_version: 1
feature: Job cloud-sync thoát khác 0 khi bất kỳ bước nào hỏng, và push-ops-facts kết nối theo DATABASE_URL
slug: cloud-sync-bao-loi-that
owner: phanlemanh@gmail.com
risk_tier: T3      # scripts/cloud-sync.sh + pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [pipeline, docs]
status: approved
design_doc: docs/superpowers/specs/2026-10-24-cloud-sync-bao-loi-that-design.md
approved_by: Mạnh
approved_at: 2026-10-24
---

# Acceptance Contract: cloud-sync-bao-loi-that

## Context

Hàng AU13, mở đầu chuỗi số tổng hợp Ops trên cloud (ADR-0014: AU13 → ON7 → NT2 → ON22). `scripts/cloud-sync.sh`
(launchd 15′) không gom mã thoát: `sync-cloud` hỏng mà `push-ops-facts` lành thì launchd ghi 0. `push-ops-facts.mjs`
viết cứng chuỗi kết nối `localhost:5433`, không đi theo `DATABASE_URL`, nên không đo được bằng cổng chết. Việc này
cho cloud-sync dùng bộ chạy bước `job_run` của AU3 và cho push-ops-facts đọc `DATABASE_URL` (vắng thì giữ chuỗi cũ);
thước là hai ô `todo` P3-3 mà AU3 để sẵn trong `scripts/job-exit.test.mjs`, nay thành ca thật.

Căn cứ: _acceptance/job-bao-loi-that/contract.md Out of scope `P3-3` (Hỏi-1 A, Mạnh 23/10); docs/plan/lo-trinh.json AU13;
docs/adr/0014-ops-cloud-doc-so-tong-hop.md (chuỗi AU13 → ON7 → NT2 → ON22); docs/plan/BOI-CANH.md §4 (AU13 ↔ NT2, AU12, AU1).

## Criteria

- AC-1: Given cây tạm của cloud-sync (tệp bọc thật + `scripts/lib/job-step.sh`, `node` giả), When `sync-cloud` hỏng
  còn `push-ops-facts` lành, Then job thoát ≠ 0, stderr có đúng một dòng `JOB FAIL [cloud-sync] bước sync-cloud mã 1`,
  và `push-ops-facts` vẫn được gọi (dãy lời gọi `sync-cloud`, `push-ops-facts`) — kể cả khi tệp bọc được gọi như
  launchd: qua một symlink tới gốc cây, thư mục làm việc khác gốc cây.
- AC-2: Given cùng cây tạm, When `push-ops-facts` hỏng còn `sync-cloud` lành, Then job thoát ≠ 0 với đúng một dòng
  `JOB FAIL [cloud-sync] bước push-ops-facts mã 1`; khi cả hai hỏng với mã 3 và 5 thì job thoát đúng 3 (mã hỏng đầu
  tiên) và stderr có hai dòng ghim theo thứ tự `… sync-cloud mã 3`, `… push-ops-facts mã 5`; khi mọi bước lành thì
  thoát 0, dãy lời gọi đủ hai bước.
- AC-3: Given bản đột biến tệp bọc bỏ `job_run` ở một bước (gọi `node` trần như trước vòng — bản đột biến phải khác
  bản gốc đúng ở bước đó), When bước đó hỏng, Then phép đo AC-1/AC-2 bắt được và gọi tên bước — mỗi bước một bản.
- AC-4: Given `push-ops-facts.mjs` THẬT chạy trong hộp cát của AU3 với env trắng và `DATABASE_URL` trỏ một cổng canh,
  When chạy, Then thoát ≠ 0, cổng canh ghi nhận ≥ 1 lần nối, hộp cát không phải chặn lần nối hay `fetch` nào; ca đếm
  của AU3 nay khẳng định đủ 11 bước thật, không còn `todo` P3-3.
- AC-5: Given hộp cát như AC-4, When (a) chạy bản sao push-ops-facts viết cứng `localhost:5433` có `DATABASE_URL`, và
  (b) chạy push-ops-facts thật KHÔNG có `DATABASE_URL`, Then (a) hộp cát chặn kết nối tới `:5433`, cổng canh không
  thấy lần nối, phép đo AC-4 đỏ; (b) hộp cát chặn đúng `:5433` — mặc định cũ (plist không đặt biến) còn nguyên.
- AC-6: Given `docs/ops/runtime-map.md` sau vòng, When người vận hành đọc mục job đêm, Then thấy cloud-sync nay thoát
  ≠ 0 khi bất kỳ bước nào hỏng (dòng `JOB FAIL [cloud-sync] …` để tìm trong log), hai bước vẫn chạy cả hai,
  push-ops-facts theo `DATABASE_URL` (vắng thì chuỗi cũ), và P3-3 không còn là việc chờ. (judgment)

## Coverage

Bỏ quét morphological đầy đủ — bài toán hẹp, AU3 đã quét và để lại đúng hai ô này (sổ d-…-descope).

- Trục bước hỏng: sync-cloud (AC-1) · push-ops-facts (AC-2) · cả hai lành (AC-2) · DB tắt hẳn (ma trận AC-3 của AU3, giữ).
- Trục cách chứng: tệp bọc + node giả (AC-1, AC-2) · đột biến tệp bọc (AC-3) · bước thật trong hộp cát (AC-4) · đột
  biến/vắng biến chuỗi kết nối (AC-5) · tài liệu (AC-6).

## Đường đo

- Ngưỡng «sync-cloud hỏng (leak gate đỏ) khi push-ops-facts lành: cloud-sync.sh thoát khác 0» ← `node --test
  scripts/*.test.mjs` (AC-1; đột biến AC-3). PROXY hai mắt xích: (a) tệp bọc với `node` giả thoát ≠0 cho bước
  sync-cloud — vòng này đo; (b) `sync-cloud.mjs` thật thoát 1 khi leak gate đỏ — đã chứng ở hồ sơ
  `leak-gate-kiem-anon` E19 (`runMain` trả 1 và in `SYNC FAIL [gate] …` khi anon đọc được bảng; `main()` đặt
  `process.exitCode` bằng mã đó). Vòng này không chạy leak gate thật.
- Ngưỡng «DATABASE_URL trỏ cổng chết: push-ops-facts thoát khác 0» ← cùng lệnh (AC-4; chiều đỏ AC-5).

## Out of scope

- Sửa plist launchd (làn ZCode) — plist không cần `DATABASE_URL`, mặc định giữ nguyên.
- Đẩy cảnh báo job hỏng lên `/ops` (ON22/ON23) hay watchdog (ZC3).
- Sửa hồ sơ AU3 đã ký — `expected` E3/E5 của `job-bao-loi-that` mô tả trạng thái `todo` trước vòng này.
- Chạy cloud-sync thật hay chạm DB chung :5433 khi đo.

## Notes

- `pipeline/push-ops-facts.mjs` chung với ON2 (dãy P3, hàm `scheduler()`) — diff giữ một dòng, gộp main trước khi xin merge.
