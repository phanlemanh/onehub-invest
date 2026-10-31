---
schema_version: 2
feature_slug: chuan-hoa-o-duong
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ad585aac0de13dc42b987d01226c34a51aaabded
human_signoff:
---

# Evidence Report: chuan-hoa-o-duong

Round 2. Mười hai eval của hợp đồng đều mang từ round 1 (delta không chạm paths của eval). Lệnh suite `cd app && npm test` đỏ ở ON12-AC-7 (dữ liệu da-nang trên DB local, không gắn eval nào), nên verdict tổng là REJECT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-chuan-hoa-o-duong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-chuan-hoa-o-duong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-chuan-hoa-o-duong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-chuan-hoa-o-duong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-chuan-hoa-o-duong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-chuan-hoa-o-duong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-chuan-hoa-o-duong-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-chuan-hoa-o-duong-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_entity_duong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-chuan-hoa-o-duong-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.judge_luat
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-chuan-hoa-o-duong-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_phuong
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-chuan-hoa-o-duong-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-chuan-hoa-o-duong-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_so_song
  verified_at: 2026-10-31T09:37:09Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-31T10:13:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-chuan-hoa-o-duong-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-31T10:13:44Z

- cmd: cd app && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-10-31T10:13:44Z
  note: 758 ca, 757 qua, 1 hỏng. Ca hỏng là ON12-AC-7 «mọi giá trị đang có trên DB local có nhãn» (tests/ops-nhan-theo-context.test.tsx): trang /ops còn chữ thô «da-nang (chưa có tên Việt)». Lệnh này không gắn eval nào của hợp đồng; nguyên nhân là dữ liệu da-nang trên DB local, đã ghi đỏ hạ tầng ở commit ad585aac (đỏ sẵn trên main a404af39).

- cmd: cd pipeline && npm test
  run_id: minted-chuan-hoa-o-duong-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-31T10:13:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-chuan-hoa-o-duong-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-31T10:13:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-chuan-hoa-o-duong-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-31T10:13:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Field baseline cua tung eval ghi n-a.

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), cần xác nhận là regression-guard có chủ ý hoặc viết lại để assert hành vi mới:
- E9 — `cd agent && node --import tsx --test tests/judge-luat.test.ts`
- E10 — `cd app && node --import tsx --test tests/the-duyet-phuong-lech-gia.test.tsx`
- E11 — `cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx`
- E12 — `cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx`

Lệnh fail không gắn eval: `cd app && npm test` (thoát mã 1, do ON12-AC-7 nêu ở khối suite trên).

## Variance

none — mọi eval chạy một lần, không có eval nhiều lượt.

## Iterations

Round 1: S4 REJECT — 12/12 eval xanh, suite app đỏ ở ON12-AC-7 do dữ liệu da-nang trên DB local. Trả về triển khai.
Round 2: 12 eval mang từ round 1; suite app vẫn đỏ ở ON12-AC-7 (cùng nguyên nhân dữ liệu da-nang, đỏ sẵn trên main a404af39). REJECT.

