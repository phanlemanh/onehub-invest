---
schema_version: 2
feature_slug: gan-can-dinh-danh-duy-nhat
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 35d19c03ad0fe0e53174690fb535e4e776801116
human_signoff:
---

# Evidence Report: gan-can-dinh-danh-duy-nhat

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
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-3 | test | PASS |

## Evidence

- eval: E12
  run_id: minted-gan-can-dinh-danh-duy-nhat-E12-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-08T18:10:30Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 707415.988417

- eval: E1
  run_id: minted-gan-can-dinh-danh-duy-nhat-E1-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-gan-can-dinh-danh-duy-nhat-E2-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-gan-can-dinh-danh-duy-nhat-E3-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-gan-can-dinh-danh-duy-nhat-E4-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-gan-can-dinh-danh-duy-nhat-E5-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-gan-can-dinh-danh-duy-nhat-E6-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-gan-can-dinh-danh-duy-nhat-E7-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-gan-can-dinh-danh-duy-nhat-E8-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-gan-can-dinh-danh-duy-nhat-E9-r1
  exit_code: 0
  verifier: config:executors.test.ggc_app
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-gan-can-dinh-danh-duy-nhat-E10-r1
  exit_code: 0
  verifier: ui-check:E10
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (sáng): Sankey 5 cột Nguồn, Bài nhận 187.811, Đọc được 121.426 64,7%, Tin rao mới 79.676, cột cuối «Gắn căn 0,0% 16.439 chờ khớp» (đỏ) với hai nút Gom cụm 14.633 (xanh lam nhạt) và Chưa định vị 65.043 (đỏ); nhãn không đè nhau. step2/2b (sáng): lưới «Chất lượng từng chặng», sau «Có phường» là Gom cụm · Định vị · Gắn căn; ô Định vị S03 có dòng phụ «2.671 chờ khớp», Gắn căn S03 «156 chờ khớp»; S06 549 và 16.283 chờ khớp; chữ gọn, không đè. step3/3b/3c (tối): cùng bố cục, nền tối, chữ rõ, Gom cụm hổ phách và Chưa định vị đỏ phân biệt rõ, chú giải đủ Đang chảy/Gắn căn/Định vị/Gom cụm/Gộp trùng/Rơi khỏi ống. step4/4b (390 sáng): Sankey cuộn trong khung riêng, lưới cuộn trong khung riêng, không tràn ngang trang. step5: ngăn chi tiết tin S03 mở, dòng «Mức nhận diện — Chưa định vị · ghi toà/trục, chờ khớp». Khớp Expected.
  network_observed: n-a (driver)

- eval: E11
  run_id: minted-gan-can-dinh-danh-duy-nhat-E11-r1
  exit_code: 0
  verifier: config:executors.design.ggc_gate
  verified_at: 2026-11-08T16:50:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-08T18:10:30Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-08T18:10:30Z

- cmd: cd app && npm test
  run_id: buc9yf9oz
  exit_code: 0
  verified_at: 2026-11-08T18:10:30Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-08T18:10:30Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gan-can-dinh-danh-duy-nhat-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-08T18:10:30Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: bộ ứng dụng E1–E11 xanh nhưng lượt bị chặn ở bước chạy bộ pipeline do ca TRG-AC-7 chưa nhận 600_data_flow.sql là «mien»; sửa ở commit 1e07c7a6.
Round 2: thêm E12 (bộ pipeline đầy đủ, long_running 60) và chạy lại các lệnh suite; E1–E11 mang từ round 1 vì delta không chạm paths của chúng. Kết quả PASS.
