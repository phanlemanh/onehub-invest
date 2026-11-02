---
schema_version: 2
feature_slug: guard-edits-goc-theo-tep
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5","E8","E10","E6"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 16bfd9f3bfa660f662ec9b0970f427059ca821f5
human_signoff:
---

# Evidence Report: guard-edits-goc-theo-tep

Round 1. Nội dung này thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | FAIL |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | script | FAIL |

Lệnh fail không gắn eval riêng: không có. Hai lệnh fail đều đã gắn eval: `bash .claude/hooks/tests/guard-edits.selftest.sh` (E1, E2, E3, E4, E5, E8, E10) và `bash _acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh` (E6). Cả hai chung một nguyên nhân: kiểm cuối của selftest «worktree tạm còn trong git worktree list» báo đỏ; mọi ca khác của selftest đều OK.

## Evidence

- eval: E1
  run_id: minted-guard-edits-goc-theo-tep-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    migration đã commit, worktree anh em → exit 2 (và các ca worktree lồng, notebook_path, không có CLAUDE_PROJECT_DIR, thông điệp nêu đường theo worktree chứa tệp đều OK)
    OK    thư mục tạm đã gỡ
    FAIL  worktree tạm còn trong git worktree list
    OK    cây làm việc thật không đổi
    FAIL (1 kiểm hỏng)
    Dòng cuối 'PASS' mà eval đòi không xuất hiện.

- eval: E2
  run_id: minted-guard-edits-goc-theo-tep-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    migration đã commit, qua đường symlink (như ~/dev/one-invest) → exit 2
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)

- eval: E3
  run_id: minted-guard-edits-goc-theo-tep-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    migration chỉ commit ở HEAD của worktree anh em → exit 2
    OK    cùng tên đó ở worktree của phiên, HEAD không có → exit 0
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)

- eval: E4
  run_id: minted-guard-edits-goc-theo-tep-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    migration mới chưa commit, worktree anh em → exit 0
    OK    thư mục chưa tồn tại, ngoài db/migrations → exit 0
    OK    tệp ngoài mọi kho git → exit 0
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)

- eval: E5
  run_id: minted-guard-edits-goc-theo-tep-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    migration đã commit, ngay worktree của phiên → exit 2
    OK    snapshot ở worktree anh em → exit 2
    OK    .airdna-profile ở worktree anh em → exit 2
    OK    thư mục chưa tồn tại, đường cũ vẫn chặn snapshot → exit 2
    OK    snapshot, thư mục chưa tồn tại, worktree anh em → exit 2
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)

- eval: E6
  run_id: minted-guard-edits-goc-theo-tep-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_dot_bien
  verified_at: 2026-11-02T23:16:18Z
  output: |
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)
    ban truoc khi sua: do, ghim co «migration đã commit, worktree anh em» (đủ tám ca)
    dot bien pwd -L: do, ghim co «migration đã commit, qua đường symlink»
    dot bien bo luat airdna: do, ghim co «.airdna-profile ở worktree anh em»
    duong do: khong con worktree tam cua selftest
    duong do: khong con worktree tam cua dau do
    duong do: khong con ref tam
    Các dòng đột biến đều đỏ đúng như eval đòi; đầu dò dừng sớm vì 'ban lanh: PASS' không đạt (bản lành chạy selftest và gặp kiểm worktree tạm đỏ giả).

- eval: E7
  run_id: minted-guard-edits-goc-theo-tep-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.geg_pham_vi
  verified_at: 2026-11-02T23:16:18Z
  output: |
    PHAM-VI OK

- eval: E8
  run_id: minted-guard-edits-goc-theo-tep-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    thư mục tạm đã gỡ
    FAIL  worktree tạm còn trong git worktree list
    OK    cây làm việc thật không đổi
    FAIL (1 kiểm hỏng)

- eval: E9
  run_id: minted-guard-edits-goc-theo-tep-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.geg_pham_vi
  verified_at: 2026-11-02T23:16:18Z
  output: |
    PHAM-VI OK

- eval: E10
  run_id: minted-guard-edits-goc-theo-tep-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.geg_selftest
  verified_at: 2026-11-02T23:16:18Z
  output: |
    OK    kho git khác, migration đã commit → exit 2
    OK    kho git khác, snapshot → exit 2
    FAIL  worktree tạm còn trong git worktree list
    FAIL (1 kiểm hỏng)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-guard-edits-goc-theo-tep-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-guard-edits-goc-theo-tep-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

- cmd: cd app && npm test
  run_id: minted-guard-edits-goc-theo-tep-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

- cmd: cd pipeline && npm test
  run_id: minted-guard-edits-goc-theo-tep-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-guard-edits-goc-theo-tep-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-guard-edits-goc-theo-tep-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T23:16:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating (xanh cả hai phía): none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline không đo:
- bash .claude/hooks/tests/guard-edits.selftest.sh: bỏ qua baseline: tệp .claude/hooks/tests/guard-edits.selftest.sh có ở cây đang kiểm nhưng chưa có ở merge-base 21de52206b3de6c7721051ebf8a46a21783a5752 — eval mới, chạy trên code cũ không phân biệt gì
- bash _acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh: bỏ qua baseline: tệp _acceptance/guard-edits-goc-theo-tep/probes/dot-bien.sh có ở cây đang kiểm nhưng chưa có ở merge-base 21de52206b3de6c7721051ebf8a46a21783a5752 — eval mới, chạy trên code cũ không phân biệt gì
- bash _acceptance/guard-edits-goc-theo-tep/probes/pham-vi.sh: bỏ qua baseline: tệp _acceptance/guard-edits-goc-theo-tep/probes/pham-vi.sh có ở cây đang kiểm nhưng chưa có ở merge-base 21de52206b3de6c7721051ebf8a46a21783a5752 — eval mới, chạy trên code cũ không phân biệt gì

Nguyên nhân gốc của các eval đỏ: kiểm cuối của selftest (`git worktree list | grep -q "onehub-guard-selftest"`, dòng 125) khớp worktree tạm của bất kỳ lần chạy nào trên kho dùng chung, không riêng lần này. Chi tiết ở review-findings.md, mục «Trong hợp đồng» (AC-8).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4, E5, E8, E10, E6 failed — kiểm «worktree tạm còn trong git worktree list» của selftest báo đỏ giả (đếm cả worktree của phiên khác trên kho dùng chung), kéo theo mọi eval dùng selftest và bản lành của đầu dò đột biến. Returned to implementation.

