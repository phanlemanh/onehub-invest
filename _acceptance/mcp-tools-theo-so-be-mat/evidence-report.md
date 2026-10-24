---
schema_version: 2
feature_slug: mcp-tools-theo-so-be-mat
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9b4eddaf73341a473c62a238aa83f210c35036e0
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: mcp-tools-theo-so-be-mat

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-mcp-tools-theo-so-be-mat-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mcp_tools_static
  verified_at: 2026-10-24T10:39:22Z
  output: |
    mcp-tools static: ĐẠT

- eval: E2
  run_id: minted-mcp-tools-theo-so-be-mat-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mcp_tools_historic
  verified_at: 2026-10-24T10:39:22Z
  output: |
    mcp-tools historic: ĐẠT

- eval: E3
  run_id: minted-mcp-tools-theo-so-be-mat-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mcp_tools_mutation
  verified_at: 2026-10-24T10:39:22Z
  output: |
    mcp-tools mutation: ĐẠT

- eval: E4
  run_id: minted-mcp-tools-theo-so-be-mat-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mcp_tools_mutation
  verified_at: 2026-10-24T10:39:22Z
  output: |
    mcp-tools mutation: ĐẠT

- eval: E5
  run_id: minted-mcp-tools-theo-so-be-mat-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-24T10:39:22Z
  output: |
    portal-compliance: ĐẠT

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-mcp-tools-theo-so-be-mat-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-24T10:39:22Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-mcp-tools-theo-so-be-mat-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-24T10:39:22Z

- cmd: cd app && npm test
  run_id: minted-mcp-tools-theo-so-be-mat-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-24T10:39:22Z

- cmd: cd pipeline && npm test
  run_id: minted-mcp-tools-theo-so-be-mat-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-24T10:39:22Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-mcp-tools-theo-so-be-mat-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-24T10:39:22Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ không phải feature; cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý):
- E5 (`node scripts/check-portal-compliance.mjs`)

Baseline không đo:
- node scripts/check-mcp-tools.mjs static: bo qua baseline: tep scripts/check-mcp-tools.mjs co o cay dang kiem nhung chua co o merge-base 1c6389bfd6aded1447f39d265e8380453d5a727f — eval moi, chay tren code cu khong phan biet gi
- node scripts/check-mcp-tools.mjs historic: bo qua baseline: tep scripts/check-mcp-tools.mjs co o cay dang kiem nhung chua co o merge-base 1c6389bfd6aded1447f39d265e8380453d5a727f — eval moi, chay tren code cu khong phan biet gi
- node scripts/check-mcp-tools.mjs mutation: bo qua baseline: tep scripts/check-mcp-tools.mjs co o cay dang kiem nhung chua co o merge-base 1c6389bfd6aded1447f39d265e8380453d5a727f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Judge

Đề xuất của hội đồng cho E6 (AC-5): PASS. `human_override` để trống cho người quyết ở Cổng 2.

- eval: E6
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  human_override:  # chi nguoi ghi

Phiếu từng judge:
- domain-correctness: PASS — Cả hai tệp nêu đủ ba ý. (a) Tệp nào cũng bảo sửa `mcp-tools.json` cùng commit, cho cả đổi chế độ route lẫn thêm công cụ MCP; portals.md còn lấy ví dụ mở lại `/api/v1/offers`. (b) Cả hai nói khoá `auth` của công cụ là một trong năm chế độ sổ và bằng chế độ của route nó gọi; portals.md có bảng năm chế độ và hai ví dụ cụ thể. (c) Cả hai nêu `scripts/check-mcp-tools.mjs` chạy trong làn `portal_static`, tức `check-portal-compliance.mjs`.
- operational-feasibility: PASS — Cả hai tệp nêu đủ ba ý. (a) Đổi chế độ route có công cụ MCP hoặc thêm công cụ mới thì sửa `mcp-tools.json` cùng commit: `api-surface.ts` dòng 15-17, `portals.md` dòng 242-244, và `portals.md` lấy chính ví dụ mở lại `/api/v1/offers`. (b) Khoá `auth` của mỗi công cụ là một trong năm chế độ của sổ và bằng chế độ route nó gọi: `api-surface.ts` dòng 17-18, `portals.md` dòng 244-246. (c) `check-mcp-tools.mjs` chạy trong làn `portal_static`, tức `check-portal-compliance.mjs`: `api-surface.ts` dòng 18-19, `portals.md` dòng 246-247.
- spec-alignment: PASS — Cả hai tệp đều nêu đủ ba ý: (a) sửa app/docs/api/mcp-tools.json cùng commit cho cả đổi chế độ route (vd mở lại /api/v1/offers) lẫn thêm công cụ MCP mới; (b) khoá auth mỗi công cụ là một trong năm chế độ và bằng chế độ route nó gọi; (c) scripts/check-mcp-tools.mjs chạy trong làn portal_static, tức check-portal-compliance.mjs. Ví dụ ở portals.md cũng khớp với sổ: oneinvest_get_asset_stats là public, oneinvest_get_offers là ops.

## Iterations

Round 1: E1–E6 đều đạt; không trả về implementation.
