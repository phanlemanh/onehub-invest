---
schema_version: 2
feature_slug: link-nguoi-ban-s03
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 91ea75c994e0f155347830981f164fa5f2ac6282
human_signoff:
---

# Evidence Report: link-nguoi-ban-s03

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11a | AC-11 | script | PASS |
| E11b | AC-11 | judgment | PENDING-JUDGMENT |

## Evidence

- eval: E1
  run_id: minted-link-nguoi-ban-s03-E1-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tra
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs tra
    __EXIT=0

- eval: E2
  run_id: minted-link-nguoi-ban-s03-E2-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_dung
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs dung
    __EXIT=0

- eval: E3
  run_id: minted-link-nguoi-ban-s03-E3-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_thu
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs thu
    __EXIT=0

- eval: E4
  run_id: minted-link-nguoi-ban-s03-E4-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ranh_gioi
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs ranh-gioi
    __EXIT=0

- eval: E5
  run_id: minted-link-nguoi-ban-s03-E5-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_api
  verified_at: 2026-11-10T04:37:42Z
  output: |
    duration_ms 110289.783084
    __EXIT=0

- eval: E6
  run_id: minted-link-nguoi-ban-s03-E6-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_db
  verified_at: 2026-11-10T04:37:42Z
  output: |
    ok   E6-nap view moi_nhat giữ dòng mới nhất mỗi mã — username=umoi1794285862149
    __EXIT=0

- eval: E7
  run_id: minted-link-nguoi-ban-s03-E7-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_lien_lac
  verified_at: 2026-11-10T04:37:42Z
  output: |
    lien-lac: 18 đạt · 0 hỏng
    __EXIT=0

- eval: E8
  run_id: minted-link-nguoi-ban-s03-E8-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_chon
  verified_at: 2026-11-10T04:37:42Z
  output: |
    chon: 14 đạt · 0 hỏng
    __EXIT=0

- eval: E9
  run_id: minted-link-nguoi-ban-s03-E9-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tien_kiem
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs tien-kiem
    __EXIT=0

- eval: E10
  run_id: minted-link-nguoi-ban-s03-E10-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ten_nguon
  verified_at: 2026-11-10T04:37:42Z
  output: |
    ten-nguon: 13 đạt · 0 hỏng
    __EXIT=0

- eval: E11a
  run_id: minted-link-nguoi-ban-s03-E11a-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tai_lieu
  verified_at: 2026-11-10T04:37:42Z
  output: |
    node scripts/link-nguoi-ban-s03/acceptance.mjs tai-lieu
    __EXIT=0

### Judgment

- eval: E11b
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — panel giu nguyen tu round 5, inputs khong doi, khong cham lai; rationale xem round do
  proposal: PASS
  votes:
    - domain-correctness: PASS (r5)
    - operational-feasibility: PASS (r5)
    - spec-alignment: PASS (r5)
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bb6271-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-link-nguoi-ban-s03-SUITE-lint-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

- cmd: cd app && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bd9a35-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

- cmd: cd pipeline && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__13563d-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-link-nguoi-ban-s03-SUITE-test_lint_rules-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-link-nguoi-ban-s03-SUITE-node_scripts_check_portal_compliance_mjs-r6
  exit_code: 0
  verified_at: 2026-11-10T04:37:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Khong co eval nao duoc liet ke la khong-phan-biet.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 4: BLOCKED do ha tang, chay lai.
Round 5: E8 failed — ca doi chung thieu nguoi gui tin gan day; E8 tu dung du lieu. Returned to implementation.
Round 6: moi eval may deu xanh; con E11b cho nguoi chot o Cong 2.
