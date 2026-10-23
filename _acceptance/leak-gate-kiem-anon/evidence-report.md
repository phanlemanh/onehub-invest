---
schema_version: 2
feature_slug: leak-gate-kiem-anon
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 547e5a5c577fb3ebc2604ac07e7dd6cb79c4a99a
human_signoff: Mạnh 2026-10-23
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
| E18 | AC-10 | judgment | PASS (Mạnh chốt Đạt 2026-10-23; hội đồng đề xuất PASS) |
| E19 | AC-11 | script | PASS |

## Evidence

Round 2: các eval E1..E17 và E19 được mang sang từ round 1 (delta không chạm paths của eval), mỗi khối ghi nguyên run_id và verified_at của lượt gốc. Riêng E18 (judgment) được chấm lại vì tài liệu vận hành đã đổi.

- eval: E1
  run_id: minted-leak-gate-kiem-anon-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E2
  run_id: minted-leak-gate-kiem-anon-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E3
  run_id: minted-leak-gate-kiem-anon-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E4
  run_id: minted-leak-gate-kiem-anon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E5
  run_id: minted-leak-gate-kiem-anon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E6
  run_id: minted-leak-gate-kiem-anon-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E7
  run_id: minted-leak-gate-kiem-anon-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E8
  run_id: minted-leak-gate-kiem-anon-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

- eval: E9
  run_id: minted-leak-gate-kiem-anon-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && npm test

- eval: E10
  run_id: minted-leak-gate-kiem-anon-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_atomic
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs atomic
    check-cloud-sync atomic: OK

- eval: E11
  run_id: minted-leak-gate-kiem-anon-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_fail
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs fail
    check-cloud-sync fail: OK

- eval: E12
  run_id: minted-leak-gate-kiem-anon-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_fidelity
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs fidelity
    check-cloud-sync fidelity: OK

- eval: E13
  run_id: minted-leak-gate-kiem-anon-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_keep
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs keep
    check-cloud-sync keep: OK

- eval: E14
  run_id: minted-leak-gate-kiem-anon-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_pii
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs pii
    check-cloud-sync pii: OK

- eval: E15
  run_id: minted-leak-gate-kiem-anon-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_stage
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs stage
    check-cloud-sync stage: OK

- eval: E16
  run_id: minted-leak-gate-kiem-anon-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_overlap
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs overlap
    check-cloud-sync overlap: OK

- eval: E17
  run_id: minted-leak-gate-kiem-anon-E17-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_allow
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs allow
    check-cloud-sync allow: OK

- eval: E19
  run_id: minted-leak-gate-kiem-anon-E19-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_sync_anon
  verified_at: 2026-10-23T11:31:23Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd pipeline && node scripts/check-cloud-sync.mjs anon
    check-cloud-sync anon: OK

### Judgment (E18, T3 — mọi mục judgment cần người)

Hội đồng đề xuất, chưa phải quyết định: T3 nên người phải tự chốt ở Gate 2 rồi điền human_override. Hội đồng được chấm lại ở round 2 vì tài liệu docs/ops/supabase-lock-anon-rls.md đã đổi; cả ba thấu kính cùng đề xuất PASS, không có ý kiến bất đồng.

- eval: E18
  judged_by: judge panel (fresh context) — domain-correctness, operational-feasibility, spec-alignment
  proposal: PASS
  verified_at: 2026-10-23T11:38:52Z
  votes:
    - domain-correctness: PASS — Mục «Leak gate kiểm anon» có đủ bốn điều và khớp code. (1) Thứ tự là áp 037, chạy `--kiem-anon` thấy sạch (mã 0), rồi merge, và nêu hệ quả đảo ngược là mọi lượt sync dừng đỏ ở pha `gate`; code ném `PhaseError("gate", …)` trong `gateAnon` và sau tráo. (2) Khuôn dòng đỏ khớp `anonReadable` và `runMain`: `SYNC FAIL [gate]`, `LEAK GATE FAIL (trước khi gửi|sau tráo)`, `<role> đọc được public.<rel> (<loại>, <đường cấp>; gỡ: <lệnh>)`. Năm loại quan hệ, năm đường cấp, thứ tự ưu tiên cấp thẳng, PUBLIC, qua role, cấp cột, thông điệp thiếu role anon và nhánh «không rõ đường cấp» (lời dặn, không phải SQL) đều đúng như code. (3) và (4) Cách gỡ là chạy nguyên văn lệnh sau `gỡ:` và không nới gate. Ba quan hệ `spatial_ref_sys`, `geometry_columns`, `geography_columns` trùng `PUBLIC_READ_ALLOW`, kèm điều kiện thành viên extension postgis. Tài liệu ghi sửa quyền trên prod là việc của Mạnh, agent chỉ đọc log và chỉ ra lệnh.
    - operational-feasibility: PASS — Mục «Leak gate kiểm anon» đủ bốn điều và khớp `pipeline/sync-cloud.mjs`. (1) Thứ tự áp 037, chạy `--kiem-anon` thấy sạch (mã 0, dòng `kiem-anon: sạch`), rồi mới merge, và hệ quả "mọi lượt sync dừng đỏ ở pha gate" khớp `gateAnon` và `PhaseError("gate", …)`. (2) Khuôn dòng `SYNC FAIL [gate] … LEAK GATE FAIL (trước khi gửi/sau tráo): <role> đọc được public.<rel> (<loại>, <đường cấp>; gỡ: <lệnh>)`, năm loại quan hệ, năm đường cấp, thứ tự ưu tiên và nhánh `không rõ đường cấp` (lời dặn, không phải SQL) đều giống code. (3) Tài liệu dặn chạy nguyên văn lệnh gỡ, cấm tắt hay nới gate, và nói rõ agent chỉ chỉ ra lệnh còn việc sửa quyền prod là của Mạnh. (4) Ba quan hệ `spatial_ref_sys`, `geometry_columns`, `geography_columns` và điều kiện là thành viên extension postgis khớp `PUBLIC_READ_ALLOW` cùng truy vấn `pg_depend`/`pg_extension`.
    - spec-alignment: PASS — Mục «Leak gate kiểm anon» có đủ bốn điều và khớp code. (1) Thứ tự áp 037, chạy `--kiem-anon`, rồi merge khớp `main()`/`runKiemAnon`; hệ quả ngược lại khớp `gateAnon`, vốn ném `PhaseError("gate")` ở bước 1b nên mọi lượt dừng đỏ. (2) Khuôn dòng báo, `LEAK GATE FAIL (trước khi gửi|sau tráo): <role> đọc được public.<rel> (<loại>, <đường cấp>; gỡ: <lệnh>)`, năm đường cấp, thứ tự ưu tiên và lời dặn không phải SQL ở đường thứ năm đều trùng `anonReadable`. (3) Gỡ bằng lệnh in trong thông điệp, không tắt hay nới gate, agent chỉ đọc log và chỉ lệnh; không câu nào bảo agent tự sửa quyền prod. (4) Ba quan hệ `spatial_ref_sys`, `geometry_columns`, `geography_columns` trùng `PUBLIC_READ_ALLOW`, kể cả điều kiện là thành viên extension postgis và lý do supabase_admin làm chủ.
  required_evidence:
    - (không có — cả ba thấu kính cùng đề xuất PASS; người đọc lại mục «Leak gate kiểm anon» trong docs/ops/supabase-lock-anon-rls.md đối chiếu pipeline/sync-cloud.mjs trước khi điền human_override)
  human_override: Mạnh 2026-10-23 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-leak-gate-kiem-anon-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-leak-gate-kiem-anon-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

- cmd: cd app && npm test
  run_id: minted-leak-gate-kiem-anon-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

- cmd: cd pipeline && npm test
  run_id: minted-leak-gate-kiem-anon-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-leak-gate-kiem-anon-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-leak-gate-kiem-anon-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-23T11:38:52Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không-phân-biệt (xanh ở cả HEAD lẫn baseline diffBase ở lượt đo round 1 — chứng minh harness, không chứng minh feature; cần viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- E9 (cd pipeline && npm test)
- E10 (cd pipeline && node scripts/check-cloud-sync.mjs atomic)
- E11 (cd pipeline && node scripts/check-cloud-sync.mjs fail)
- E12 (cd pipeline && node scripts/check-cloud-sync.mjs fidelity)
- E13 (cd pipeline && node scripts/check-cloud-sync.mjs keep)
- E14 (cd pipeline && node scripts/check-cloud-sync.mjs pii)
- E15 (cd pipeline && node scripts/check-cloud-sync.mjs stage)
- E16 (cd pipeline && node scripts/check-cloud-sync.mjs overlap)
- E17 (cd pipeline && node scripts/check-cloud-sync.mjs allow)

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic).

## Iterations

Round 1: mọi eval máy xanh; E18 (judgment, T3) hội đồng ba thấu kính cùng đề xuất FAIL vì tài liệu docs/ops/supabase-lock-anon-rls.md chưa nêu nhánh `không rõ đường cấp`. Verdict PENDING-JUDGMENT, chờ người quyết ở Gate 2. Ba mục ngoài hợp đồng xem review-findings.md.
Round 2: tài liệu đã được sửa; sáu lệnh suite chạy lại đều xanh, E1..E17 và E19 mang sang từ round 1 (delta không chạm paths của eval). E18 chấm lại, hội đồng ba thấu kính cùng đề xuất PASS. Verdict PENDING-JUDGMENT vì T3 cần người chốt E18 ở Gate 2; hai mục ngoài hợp đồng mới (cùng gốc chuỗi role lồng nhau) và ba mục mang từ round 1 xem review-findings.md.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do gộp main (PL2 sửa sync-cloud.mjs phần chặn tụt, ZCode collector) sau chữ ký
run_id: repin-20261023T145040Z-80433
sha: 547e5a5c577fb3ebc2604ac07e7dd6cb79c4a99a · suites: 6 lệnh exit 0 · evals: 18/18 eval máy đạt kỳ vọng · ngoài làn máy: E18 · diff chạm vật đo ngoài làn máy: E18 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-10
