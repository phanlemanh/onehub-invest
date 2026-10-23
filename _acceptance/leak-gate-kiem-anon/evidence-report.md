---
schema_version: 2
feature_slug: leak-gate-kiem-anon
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2b090afa044cd07c07127d589b63bc83666f8174
human_signoff:
---

# Evidence Report: leak-gate-kiem-anon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | script | PASS |
| E14 | AC-9 | script | PASS |
| E15 | AC-9 | script | PASS |
| E16 | AC-9 | script | PASS |
| E17 | AC-9 | script | PASS |
| E18 | AC-10 | judgment | PENDING-JUDGMENT (hội đồng đề xuất FAIL, chờ người ở Gate 2) |
| E19 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-leak-gate-kiem-anon-E1-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E2
  run_id: minted-leak-gate-kiem-anon-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E3
  run_id: minted-leak-gate-kiem-anon-E3-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E4
  run_id: minted-leak-gate-kiem-anon-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E5
  run_id: minted-leak-gate-kiem-anon-E5-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E6
  run_id: minted-leak-gate-kiem-anon-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E7
  run_id: minted-leak-gate-kiem-anon-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E8
  run_id: minted-leak-gate-kiem-anon-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E9
  run_id: minted-leak-gate-kiem-anon-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 402.202167

- eval: E10
  run_id: minted-leak-gate-kiem-anon-E10-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_atomic
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs atomic
    check-cloud-sync atomic: OK

- eval: E11
  run_id: minted-leak-gate-kiem-anon-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_fail
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs fail
    check-cloud-sync fail: OK

- eval: E12
  run_id: minted-leak-gate-kiem-anon-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_fidelity
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs fidelity
    check-cloud-sync fidelity: OK

- eval: E13
  run_id: minted-leak-gate-kiem-anon-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_keep
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs keep
    check-cloud-sync keep: OK

- eval: E14
  run_id: minted-leak-gate-kiem-anon-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_pii
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs pii
    check-cloud-sync pii: OK

- eval: E15
  run_id: minted-leak-gate-kiem-anon-E15-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_stage
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs stage
    check-cloud-sync stage: OK

- eval: E16
  run_id: minted-leak-gate-kiem-anon-E16-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_overlap
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs overlap
    check-cloud-sync overlap: OK

- eval: E17
  run_id: minted-leak-gate-kiem-anon-E17-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs allow
    check-cloud-sync allow: OK

- eval: E19
  run_id: minted-leak-gate-kiem-anon-E19-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  output: |
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

### Judgment (E18, T3 — mọi mục judgment cần người)

Hội đồng đề xuất, chưa phải quyết định: T3 nên người phải tự chốt ở Gate 2 rồi điền human_override.

- eval: E18
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  proposal: FAIL
  run_id: minted-leak-gate-kiem-anon-E18-r1
  verified_at: 2026-10-23T11:31:23Z
  votes:
    - domain-correctness: FAIL — Mục khớp code ở bốn phần: thứ tự triển khai và hệ quả mọi lượt sync dừng đỏ, khuôn dòng báo đỏ, ba quan hệ PostGIS được chừa, và việc agent không tự sửa quyền prod. Nhưng tài liệu viết «Đường cấp là một trong» bốn loại và bảo chạy NGUYÊN VĂN lệnh sau `gỡ:`. Trong khi đó `anonReadable` còn nhánh thứ năm `không rõ đường cấp` với `gỡ: kiểm tay quyền và chủ sở hữu của quan hệ` (sync-cloud.mjs dòng 425), không phải lệnh SQL chạy được. Tài liệu nói khác code ở chỗ này.
    - operational-feasibility: FAIL — Mục «Leak gate kiểm anon» khớp code ở thứ tự triển khai và hệ quả (đỏ ở pha gate), khuôn dòng SYNC FAIL, cách gỡ, ba quan hệ PostGIS được chừa, và không câu nào bảo agent tự sửa prod. Nhưng tài liệu nói đường cấp «là một trong» bốn loại và bảo chạy NGUYÊN VĂN lệnh sau `gỡ:`. Code `anonReadable` còn nhánh thứ năm, `không rõ đường cấp`, kèm `gỡ: kiểm tay quyền và chủ sở hữu của quan hệ`, vốn không phải lệnh SQL chạy được.
    - spec-alignment: FAIL — Bốn nội dung phần lớn khớp code: thứ tự 037 → --kiem-anon → merge, hệ quả gate đỏ, khuôn thông điệp, ba quan hệ PostGIS chỉ chừa khi thuộc extension postgis, và không có câu nào bảo agent tự sửa prod. Nhưng tài liệu nói «Đường cấp là một trong» bốn loại, còn `anonReadable` (sync-cloud.mjs dòng 425) có đường thứ năm «không rõ đường cấp». Ở đường đó phần «gỡ:» là «kiểm tay quyền và chủ sở hữu của quan hệ», không phải lệnh chạy được, nên chỉ dẫn «chạy NGUYÊN VĂN lệnh sau gỡ:» không áp dụng được. Tài liệu vì thế nói khác code.
  required_evidence:
    - (domain-correctness) Mục «Đọc dòng báo đỏ» và «Gỡ đúng» trong docs/ops/supabase-lock-anon-rls.md được sửa để nêu nhánh thứ năm `không rõ đường cấp` (sync-cloud.mjs dòng 425): lúc đó phần sau `gỡ:` là lời dặn kiểm tay quyền và chủ sở hữu quan hệ, không phải lệnh SQL để chạy nguyên văn. Lấy bằng cách đọc lại hai mục đó trong tệp sau khi sửa.
    - (operational-feasibility) Mục «Đọc dòng báo đỏ» trong docs/ops/supabase-lock-anon-rls.md liệt kê thêm đường cấp thứ năm `không rõ đường cấp`. Nếu có, verdict đổi sang PASS ở điểm (2). Nguồn đối chiếu: pipeline/sync-cloud.mjs dòng 425, nhánh else cuối của anonReadable.
    - (operational-feasibility) Mục «Gỡ đúng» cùng file nói rõ ngoại lệ: với `không rõ đường cấp`, phần sau `gỡ:` là chỉ dẫn kiểm tay chứ không phải lệnh để dán. Phải nói cả việc dòng này cần Mạnh tự điều tra chủ sở hữu và quyền của quan hệ, agent không tự chạy gì trên prod. Nếu có, điểm (3) khớp code.
    - (operational-feasibility) Danh sách loại quan hệ ở đầu mục (bảng, view, materialized view, bảng phân vùng) thêm `bảng ngoại` (relkind 'f'), hoặc nói rõ gate bắt cả foreign table như pipeline/sync-cloud.mjs dòng 380 và 392. Đây là mục phụ, nhưng cần khớp để tài liệu không nói khác code.
    - (spec-alignment) Mục «Đọc dòng báo đỏ» trong docs/ops/supabase-lock-anon-rls.md liệt kê thêm đường cấp thứ năm «không rõ đường cấp» đúng như pipeline/sync-cloud.mjs dòng 425, kèm hướng xử lý: đây không phải lệnh chạy được, Mạnh kiểm tay quyền và chủ sở hữu của quan hệ.
    - (spec-alignment) Mục «Gỡ đúng» cùng tài liệu ghi ngoại lệ cho trường hợp «không rõ đường cấp», để câu «chạy NGUYÊN VĂN lệnh sau gỡ:» không mâu thuẫn với dòng báo đỏ mà code thật sinh ra. Cách lấy: đọc lại hai mục này trong docs/ops/supabase-lock-anon-rls.md.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-leak-gate-kiem-anon-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T11:31:23Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-leak-gate-kiem-anon-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T11:31:23Z

- cmd: cd app && npm test
  run_id: minted-leak-gate-kiem-anon-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T11:31:23Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-leak-gate-kiem-anon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T11:31:23Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-leak-gate-kiem-anon-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T11:31:23Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline diffBase — chứng minh harness, không chứng minh feature; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- E9 (cd pipeline && npm test)
- E10 (check-cloud-sync atomic)
- E11 (check-cloud-sync fail)
- E12 (check-cloud-sync fidelity)
- E13 (check-cloud-sync keep)
- E14 (check-cloud-sync pii)
- E15 (check-cloud-sync stage)
- E16 (check-cloud-sync overlap)
- E17 (check-cloud-sync allow)

Các eval feature E1..E8 và E19 đều red trên baseline (có phân biệt). Baseline không đo: none.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: mọi eval máy xanh; E18 (judgment, T3) hội đồng ba thấu kính cùng đề xuất FAIL vì tài liệu docs/ops/supabase-lock-anon-rls.md chưa nêu nhánh `không rõ đường cấp`. Verdict PENDING-JUDGMENT, chờ người quyết ở Gate 2. Ba mục ngoài hợp đồng xem review-findings.md.
