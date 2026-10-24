---
schema_version: 2
feature_slug: so-be-mat-api
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5707f2859cb45d92760d48a82cd59d72f8a3bae2
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: so-be-mat-api

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E12 | AC-3 | script | PASS |
| E13 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | judgment | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-7 | script | PASS |
| E11 | AC-8 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-so-be-mat-api-E1-r2
  exit_code: 0
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-23T11:51:34Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-so-be-mat-api-E2-r2
  exit_code: 0
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:51:34Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-so-be-mat-api-E3-r2
  exit_code: 0
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T11:51:34Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-so-be-mat-api-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_surface_mutation
  verified_at: 2026-10-23T15:15:58Z
  output: |
    api-surface mutation: ĐẠT

- eval: E12
  run_id: minted-so-be-mat-api-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_matrix_smoke
  verified_at: 2026-10-23T15:15:58Z
  output: |
    api-matrix: ĐẠT

- eval: E13
  run_id: minted-so-be-mat-api-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.api_matrix_tu_thu
  verified_at: 2026-10-23T15:15:58Z
  output: |
    api-matrix tu-thu: ĐẠT

- eval: E5
  run_id: minted-so-be-mat-api-E5-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — scripts/audit-all.sh dòng 108-114: offers được gọi hai lần. Gọi không token chỉ tính pass khi trả 401, gọi kèm Bearer CTOKEN chỉ tính pass khi trả 200. Offers không còn kiểm như API công khai (chú thích ghi «tạm đóng (sổ bề mặt: ops)»); chỉ asset-stats còn được kiểm là công khai. Tiêu đề mục «E. PUBLIC APIs» vẫn còn nhưng không ảnh hưởng cách tính đạt hay không.
    - operational-feasibility: PASS — mục E của audit-all.sh (dòng 108-114) gọi offers không token và chỉ tính ĐẠT khi trả 401, gọi kèm bearer CTOKEN và chỉ tính ĐẠT khi trả 200. Offers nằm trong vòng lặp riêng cùng deals, có nhãn «khách → 401 (tạm đóng)». Chỉ asset-stats còn được kiểm là công khai với 200.
    - spec-alignment: PASS — dòng 108-114: gọi không token tính ĐẠT khi trả đúng 401, gọi kèm Bearer tính ĐẠT khi trả 200. Offers không còn bị kỳ vọng 200 cho khách; chỉ asset-stats còn được kiểm theo chế độ công khai (dòng 106-107). Tiêu đề mục E ghi «PUBLIC APIs» chỉ là nhãn còn sót.
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-so-be-mat-api-E7-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-so-be-mat-api-E8-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-so-be-mat-api-E9-r1
  exit_code: 0
  verifier: config:executors.script.api_surface_smoke
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-so-be-mat-api-E10-r1
  exit_code: 0
  verifier: config:executors.script.deals_smoke_local_guard
  verified_at: 2026-10-23T11:44:00Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: |
    - domain-correctness: PASS — mục 5.10 của portals.md nêu sổ ở app/src/lib/api-surface.ts, mỗi route một dòng (đường, phương thức, chế độ) cùng commit; bảng năm chế độ ghi ai gọi được và cổng trong mã; luật public không được đọc sale_offers kể cả gián tiếp qua thư viện; nêu check-api-surface.mjs chạy trong CI và ví dụ /offers, /deals ở chế độ ops.
    - operational-feasibility: PASS — mục 5.10 nêu vị trí sổ, thêm route thì thêm dòng cùng commit, CI đỏ khi sai; bảng năm chế độ kèm cổng trong mã; luật cấm public đọc sale_offers được ghi rõ. Người thêm route mới làm đúng được.
    - spec-alignment: PASS — mục 5.10 nêu sổ nằm ở đâu kèm rào CI, bảng năm chế độ với cổng trong mã (canCallOpsApi, canAccessOps, isAdmin, if (!user) return 204), chế độ public không đọc sale_offers kể cả gián tiếp, cùng luật «sổ rộng bằng hoặc hơn mã» và ví dụ /api/v1/offers ở chế độ ops.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-be-mat-api-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

- cmd: cd app && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

- cmd: cd pipeline && npm test
  run_id: minted-so-be-mat-api-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-be-mat-api-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-be-mat-api-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-23T15:15:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:

- node scripts/check-api-surface.mjs mutation: bo qua baseline: tep scripts/check-api-surface.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi
- BASE_URL=${BASE_URL:-http://localhost:3456} node scripts/smoke-api-matrix.mjs: bo qua baseline: tep scripts/smoke-api-matrix.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi
- BASE_URL=${BASE_URL:-http://localhost:3456} node scripts/smoke-api-matrix.mjs --tu-thu: bo qua baseline: tep scripts/smoke-api-matrix.mjs co o cay dang kiem nhung chua co o merge-base 40b18d5b92046a4f5e3e1d905bffbe4e9bde02f5 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval máy đạt (E1-E5, E7-E10) và hai judgment đề xuất PASS (E6, E11) — không cần quay lại implementation.
Round 2: sau bản fix S4-r1 (chế độ chỉ-phiên cấm nhánh bearer, khai lại 6 route ops), chạy lại E1-E4 cùng các lệnh suite, tất cả đạt; E5, E7-E10 mang sang từ round 1 vì delta không chạm paths của chúng; hai judgment E6, E11 chấm lại và vẫn đề xuất PASS.
Round 3: đổi khuôn AC-3 sang ma trận hành vi — chạy E4 cùng hai eval mới E12, E13 và các lệnh suite, tất cả đạt; E1-E3 mang sang từ round 2, E5, E7-E10 mang sang từ round 1 vì delta không chạm paths của chúng; hai judgment E6, E11 giữ đề xuất PASS.

### Re-pin lần 1 — 2026-10-23, do gộp origin/main (PR #34–#43) sau chữ ký NT4
run_id: repin-20261023T153007Z-19028
sha: 2fd4f70c8f7478bfa3621e91c63a1d12113be3f8 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E6 (E6 không khai paths), E11 (E11 không khai paths) · AC không có chốt máy: AC-8

### Re-pin lần 2 — 2026-10-23, do gộp origin/main (PR #44) — giải xung đột bản đồ
run_id: repin-20261023T153400Z-61531
sha: 3d4d488a29461ac1852be7782ec16f8adfb73360 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E6 (E6 không khai paths), E11 (E11 không khai paths) · AC không có chốt máy: AC-8

### Re-pin lần 3 — 2026-10-23, do gộp origin/main (PR #45 audit-all) trước merge
run_id: repin-20261023T153759Z-67252
sha: 5707f2859cb45d92760d48a82cd59d72f8a3bae2 · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E6 (E6 không khai paths), E11 (E11 không khai paths) · AC không có chốt máy: AC-8
