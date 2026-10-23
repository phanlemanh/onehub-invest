---
schema_version: 2
feature_slug: cloud-sync-atomic
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 19aba28053275f747bcc178d8dfa8d0a281fc1a8
human_signoff:
---

# Evidence Report: cloud-sync-atomic

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8a | AC-8 | test | PASS |
| E8b | AC-8 | script | PASS |
| E9 | AC-9 | judgment | PASS (đề xuất của hội đồng judge, chờ người chốt) |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng judge, chờ người chốt) |
| E11 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-cloud-sync-atomic-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_atomic
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs atomic
    check-cloud-sync atomic: OK

- eval: E2
  run_id: minted-cloud-sync-atomic-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_fail
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs fail
    check-cloud-sync fail: OK

- eval: E3
  run_id: minted-cloud-sync-atomic-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_fidelity
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs fidelity
    check-cloud-sync fidelity: OK

- eval: E4
  run_id: minted-cloud-sync-atomic-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_keep
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs keep
    check-cloud-sync keep: OK

- eval: E5
  run_id: minted-cloud-sync-atomic-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_pii
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs pii
    check-cloud-sync pii: OK

- eval: E6
  run_id: minted-cloud-sync-atomic-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_stage
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs stage
    check-cloud-sync stage: OK

- eval: E7
  run_id: minted-cloud-sync-atomic-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_overlap
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs overlap
    check-cloud-sync overlap: OK

- eval: E8a
  run_id: minted-cloud-sync-atomic-E8a-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T03:21:11Z

- eval: E8b
  run_id: minted-cloud-sync-atomic-E8b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sync_pii_mutation
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/sync-pii-mutation.mjs
    MUTATION PASS

- eval: E11
  run_id: minted-cloud-sync-atomic-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-23T03:21:11Z
  output: |
    $ cd pipeline && node scripts/check-cloud-sync.mjs allow
    check-cloud-sync allow: OK

### Mục judgment (đề xuất của hội đồng, người chốt ở Cổng 2)

Hội đồng đề xuất PASS cho cả hai mục. Đây chỉ là đề xuất: `human_override` để TRỐNG, người điền tên và ngày ở Cổng 2. Mọi mục judgment đều chờ người trực tiếp xác nhận.

- eval: E9
  judged_by: hội đồng judge 3 lens (fresh context): domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba lens cùng thấy chú thích đầu sync-cloud.mjs và mục «Ranh giới dữ liệu» của docs/ops/cloud-sync-atomic.md nói đúng luật AC-9, và khớp code. Chi tiết từng lens ở dưới.
  human_override:  # chi nguoi ghi

  Phiếu từng lens:
  - domain-correctness: PASS — Chú thích đầu sync-cloud.mjs (dòng 19-33) và mục «Ranh giới dữ liệu» trong docs/ops/cloud-sync-atomic.md (dòng 25-36) đều nói đúng luật AC-9. Cả hai xếp định danh người bán vào tầng C và chỉ xếp vào tầng A tên nguồn thật (kể cả lẫn trong giá trị cột), hồ sơ người dùng, user_events/user_profile và review_queue. Cả hai ghi PII_EXCLUDE được giữ vì phạm vi sản phẩm, không vì luật. Mô tả khớp code: CLOUD_ALLOW cho ba bảng, SELLER_REF_EXPR cho `S0x:<số>` (không có số thì NULL), soát tên nguồn từ source_registry và dừng khi danh sách rỗng, SOURCE_EXCLUDE cho listing_url/photos, và leak gate dùng SELLER_REF_RE. Không câu nào còn gọi SĐT hay tên người bán là tầng A.
  - operational-feasibility: PASS — Chú thích đầu sync-cloud.mjs (dòng 19-33) và mục «Ranh giới dữ liệu» của docs/ops/cloud-sync-atomic.md (dòng 25-36) đều ghi định danh người bán là tầng C. Cả hai đều ghi tầng A chỉ còn tên nguồn thật (kể cả lẫn trong giá trị cột), hồ sơ người dùng, user_events/user_profile và review_queue, và đều giải thích PII_EXCLUDE giữ vì phạm vi sản phẩm chứ không vì luật. Các mô tả khớp code: CLOUD_ALLOW cho ba bảng, SOURCE_EXCLUDE cho listing_url và photos, SELLER_REF_EXPR cùng leak gate dùng regex `^S0[1-9]:[0-9]+$`, và pha scan đọc token từ source_registry rồi dừng khi trúng. Không còn câu nào gọi SĐT hay tên người bán là tầng A.
  - spec-alignment: PASS — Chú thích đầu sync-cloud.mjs (dòng 19-33) và mục «Ranh giới dữ liệu» của cloud-sync-atomic.md (dòng 25-36) nói đúng luật ở AC-9. Cả hai xếp định danh người bán (tên, SĐT, ID tài khoản) vào tầng C. Tầng A chỉ gồm tên nguồn thật (kể cả lẫn trong giá trị cột), hồ sơ người dùng app, user_events/user_profile và review_queue. Cả hai nói PII_EXCLUDE giữ vì phạm vi sản phẩm chứ không vì tầng A. Hành vi mô tả khớp code: CLOUD_ALLOW và SOURCE_EXCLUDE trong selectList, SELLER_REF_EXPR đổi seller_ref thành «S0x:<số>» hoặc NULL, bước soát scanSourceNames bằng token đọc từ source_registry rồi dừng, và leakGate kiểm SELLER_REF_RE. Tôi không thấy câu nào còn gọi SĐT hay tên người bán là tầng A.

- eval: E10
  judged_by: hội đồng judge 3 lens (fresh context): domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Cả ba lens cùng thấy docs/ops/cloud-sync-atomic.md đủ các ý AC-10 và khớp migration 038 cùng pha catalog của sync-cloud.mjs. Chi tiết từng lens ở dưới.
  human_override:  # chi nguoi ghi

  Phiếu từng lens:
  - domain-correctness: PASS — Tài liệu `cloud-sync-atomic.md` đủ các ý AC-10: vì sao, thứ tự (Mạnh áp migration 038 trước merge), lệnh áp, lệnh kiểm với kết quả mong đợi `t|f|f`, lượt thử có đo bằng `cloud-sync-watch` (kể cả `saved_markets` không đổi), cách lùi, và câu "không bước nào giao agent tự áp DDL". SQL và code khớp lời hướng dẫn. Migration 038 tạo đúng `sync_stage.rows` và `sync_stage.swaps` rồi thu quyền của PUBLIC, anon và authenticated, nên câu kiểm ra `t|f|f`. Trong `sync-cloud.mjs`, pha `catalog` chỉ gửi câu đọc `to_regclass`, sau đó ném lỗi "cloud chưa có sync_stage" trước mọi câu ghi, và lỗi in dạng `SYNC FAIL [catalog]`.
  - operational-feasibility: PASS — `docs/ops/cloud-sync-atomic.md` có đủ các phần AC-10 hỏi: «Vì sao» (cửa sổ trống, xoá `saved_markets`, lệch ngày), «Thứ tự (bắt buộc)» (Mạnh áp 038 trước khi merge), lệnh áp (dán `038_sync_stage.sql` vào SQL Editor), lệnh kiểm (kết quả phải là `t | f | f`), lượt thử có đo (`cloud-sync-watch` kèm `sync-cloud.mjs`, có cách đọc kết quả và `saved_markets`), cách lùi (`git revert`) và câu chốt cuối rằng không có bước nào để agent tự đổi schema prod. SQL được trỏ khớp lời hướng dẫn. `038` chỉ tạo schema `sync_stage` với 2 bảng `rows` và `swaps` rồi thu quyền của `PUBLIC`, `anon` và `authenticated`, nên lệnh kiểm trả đúng `t|f|f`. `syncOnce` ở pha `catalog` chỉ chạy `SELECT to_regclass` trước, rồi ném `PhaseError("catalog", "cloud chưa có sync_stage …")` và thoát ≠ 0, chưa gửi câu ghi hay DDL nào, khớp mô tả «dừng, không đụng dữ liệu».
  - spec-alignment: PASS — Hướng dẫn `docs/ops/cloud-sync-atomic.md` nêu đủ lý do, thứ tự bắt buộc (Mạnh áp 038 TRƯỚC khi merge), lệnh áp (dán file vào SQL Editor), lệnh kiểm (kết quả mong đợi `t | f | f`), lượt thử có đo bằng `cloud-sync-watch` (kèm `saved_markets` không đổi) và cách đọc kết quả, cách lùi bằng `git revert`. Câu cuối của tài liệu ghi rõ không bước nào giao agent đổi schema production. SQL và code khớp lời hướng dẫn. `038_sync_stage.sql` chỉ tạo schema `sync_stage` với 2 bảng, chạy lại được, và thu quyền của PUBLIC, `anon`, `authenticated`. Lệnh kiểm dùng `to_regclass` và `has_schema_privilege`. Trong `sync-cloud.mjs`, pha `catalog` chạy trước mọi câu ghi, chỉ đọc `to_regclass`, rồi ném lỗi "cloud chưa có sync_stage" và in `SYNC FAIL [catalog]`, nên dữ liệu prod giữ nguyên.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-cloud-sync-atomic-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T03:21:11Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-cloud-sync-atomic-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T03:21:11Z

- cmd: cd app && npm test
  run_id: minted-cloud-sync-atomic-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-23T03:21:11Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-cloud-sync-atomic-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T03:21:11Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-cloud-sync-atomic-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-23T03:21:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried từ round 1 — baseline không đo lại round này

Baseline không đo: evals.yaml không đổi từ lần baseline cuối (round 1), nên round này không chạy lại trên diffBase. Field `baseline:` của từng eval máy ghi n-a.

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ không chứng minh feature; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):
- E8a (`cd pipeline && npm test`)
- E8b (`cd pipeline && node scripts/sync-pii-mutation.mjs`)

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, xác định, không có phương sai)

## Iterations

Round 1: E1 và E2 đỏ, E3 vắng kết quả (agent bị bỏ qua), lệnh lint của app đỏ; tổng kết round BLOCKED. Trả về triển khai (commit 8b556ad: pool dừng khi mẻ gãy, soát tên nguồn fail-closed, thước chạy trong container tạm).
Round 2: toàn bộ eval máy (E1-E7, E8a, E8b, E11) xanh và cả 5 lệnh suite xanh trên commit đã ghim; E9 và E10 hội đồng judge đề xuất PASS nhưng chờ người chốt ở Cổng 2, nên verdict là PENDING-JUDGMENT.
