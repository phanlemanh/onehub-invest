---
schema_version: 2
feature_slug: ui-standards-reui
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f9d5904ebcbdeba1dd81be5b1a89237d2f6d0a3e
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: ui-standards-reui

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: ui-standards-reui-E1-20261022T223204Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_mcp_config
  verified_at: 2026-10-22T22:32:04Z
  output: |
    [ui-standards-reui] mcp-config
      OK  .mcp.json có server reui → https://mcp.reui.io/api/mcp
      OK  5 file cấu hình agent đã commit sạch (.claude/settings.json, .cursor/mcp.json, .gemini/settings.json, .mcp.json, opencode.json)
    PASS

- eval: E2
  run_id: ui-standards-reui-E2-20261022T223205Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_mcp_connected
  verified_at: 2026-10-22T22:32:05Z
  output: |
    [ui-standards-reui] mcp-connected
        | reui: https://mcp.reui.io/api/mcp (HTTP) - ✔ Connected
      OK  reui phạm vi dự án Connected, không trùng phạm vi local
    PASS

- eval: E3
  run_id: ui-standards-reui-E3-20261022T223206Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_lint_should_fire
  verified_at: 2026-10-22T22:32:06Z
  output: |
    OK    luật onehub-ui/no-arbitrary-text-size được phủ ít nhất một mẫu
    OK    luật onehub-ui/no-banned-motion được phủ ít nhất một mẫu
    OK    luật onehub-ui/no-aschild được phủ ít nhất một mẫu
    OK    luật onehub-ui/no-emoji-icons được phủ ít nhất một mẫu
    OK    luật onehub-ui/require-disable-reason được phủ ít nhất một mẫu
    OK    số mẫu = 16 (cần >= 14)
    OK    check-bare-disables báo `/* eslint-disable */` trần
    PASS

- eval: E4
  run_id: ui-standards-reui-E4-20261022T223208Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-22T22:32:08Z
  output: |
    ✔ phủ đúng mọi page.tsx dưới app/src/app (không thiếu, không thừa, không trùng)
    ✔ routes.md của skill onehub-ui
    ℹ tests 141
    ℹ suites 47
    ℹ pass 141
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E5
  run_id: ui-standards-reui-E5-20261022T223208Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_lint_should_not_fire
  verified_at: 2026-10-22T22:32:08Z
  output: |
    OK    đối chứng: file thường vẫn bị no-hardcoded-color (cấu hình bản đồ là ngoại lệ có chủ đích)
    OK    src/components/ui/__selftest__.tsx → 0 báo cáo onehub-ui
    OK    src/components/examples/__selftest__.tsx → 0 báo cáo onehub-ui
    OK    src/components/reui/__selftest__.tsx → 0 báo cáo onehub-ui
    OK    src/components/blocks/__selftest__.tsx → 0 báo cáo onehub-ui
    PASS

- eval: E6
  run_id: ui-standards-reui-E6-20261022T223213Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-22T22:32:13Z
  output: |
    (tsc --noEmit sạch, rồi npm run lint)
    src/components/user-event-beacon.tsx  51:6  warning  react-hooks/exhaustive-deps
    src/hooks/use-file-upload.ts  266:5  warning  react-hooks/exhaustive-deps
    ✖ 3 problems (0 errors, 3 warnings)

- eval: E7
  run_id: ui-standards-reui-E7-20261022T223221Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_baseline_guard
  verified_at: 2026-10-22T22:32:21Z
  output: |
    OK    thêm 1 <table/> vào src/app/ops/page.tsx (vượt số đếm suppress) → lint đỏ như kỳ vọng, in onehub-ui/no-raw-table
    OK    +1 count ở onehub-ui/no-arbitrary-text-size → check-baseline-growth đỏ như kỳ vọng
    OK    đổi tên khoá giữ nguyên số đếm → check-baseline-growth xanh như kỳ vọng
    OK    giảm 1 count → xanh như kỳ vọng
    OK    cây làm việc (git status --porcelain) không đổi sau khi chạy
    OK    src/app/ops/page.tsx thật không bị sửa
    PASS

- eval: E8
  run_id: ui-standards-reui-E8-20261022T223224Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_hook_selftest
  verified_at: 2026-10-22T22:32:24Z
  output: |
    OK    nền sạch (chưa đổi file) → hook cho qua
    OK    file có <table /> → hook chặn (mã chặn của hook Stop)
    OK    output in onehub-ui/no-raw-table
    OK    file sạch (chỉ thêm chú thích) → hook cho qua
    OK    worktree tạm đã gỡ
    OK    git worktree list sạch
    OK    cây làm việc thật không đổi

- eval: E9
  run_id: ui-standards-reui-E9-20261022T223235Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-22T22:32:35Z
  output: |
    ✔ phủ đúng mọi page.tsx dưới app/src/app (không thiếu, không thừa, không trùng)
    ✔ routes.md của skill onehub-ui
    ℹ tests 1
    ℹ pass 1
    ℹ fail 0

- eval: E10
  run_id: ui-standards-reui-E10-20261022T223235Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_kit_sockets
  verified_at: 2026-10-22T22:32:35Z
  output: |
    OK  resolveConfigKey(feature_loop.ui_standards_skill) = onehub-ui
    OK  resolveConfigKey(design_pass.ds_skill) = onehub-ui
    OK  .claude/skills/onehub-ui/SKILL.md có frontmatter name: onehub-ui
    PASS

- eval: E11
  run_id: ui-standards-reui-E11-20261022T223235Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_pointers
  verified_at: 2026-10-22T22:32:35Z
  output: |
    OK  AGENTS.md nhắc onehub-ui
    OK  app/CLAUDE.md nhắc onehub-ui
    OK  app/DESIGN_RULES.md nhắc onehub-ui
    OK  .claude/rules/ui.md nhắc onehub-ui
    OK  AGENTS.md có đúng 1 khối reui-agent-rules (BEGIN/END)
    OK  IA §3.3: không dặn loading.tsx cấp segment, có nhắc Suspense
    PASS

- eval: E12
  run_id: ui-standards-reui-E12-20261022T223235Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_baseline_doc
  verified_at: 2026-10-22T22:32:35Z
  output: |
    lint:ui-report = 138 · eslint-suppressions.json = 138 · tài liệu = 138 (hàng bảng: 138, 138)
    OK  cả ba bằng 138
    PASS

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline khong do: lane baseline (diffBase) không được yêu cầu trong lượt verify độc lập này; mọi eval để baseline n-a. Không có eval nào được khẳng định là phân biệt hay không phân biệt so với cây cũ.

Ghi chú phương pháp: không có eval ui-check hay judgment (bề mặt config, ci, docs), nên không có trường network_observed hay screenshot. Cây làm việc chỉ đổi thêm `run-log.jsonl` (chưa theo dõi) sau khi chạy; E7 và E8 tự kiểm cây làm việc không đổi và worktree tạm đã được gỡ.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1-E12 đều xanh trên commit 50ea40b573faebf006ee099f7b4f511de74214b8; không cần quay lại triển khai.

### Re-pin lần 1 — 2026-10-22, do merge main sau PR #3 + #5: đổi khoá baseline /deals, route map
run_id: repin-20261022T230905Z-93242
sha: e8df8884dbc412061421845f9b5961b74f25e275 · suites: 2 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-27, do ui-standards-reui-thuoc-loi-thoi: E12 thay bởi #AC-2 (đã ký), thước baseline-guard sửa
run_id: repin-20261027T064351Z-37781
sha: 94e8dee93a9f7fffef89981f45d40241d08cefa3 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E12 · thay bởi hồ sơ đã ký: E12→ui-standards-reui-thuoc-loi-thoi#AC-2 · AC không có chốt máy: AC-10

### Re-pin lần 3 — 2026-10-27, do ghim lại sau gộp main vào #162
run_id: repin-20261027T064650Z-97189
sha: f9d5904ebcbdeba1dd81be5b1a89237d2f6d0a3e · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · không chạy theo hồ sơ: E12 · thay bởi hồ sơ đã ký: E12→ui-standards-reui-thuoc-loi-thoi#AC-2 · AC không có chốt máy: AC-10
