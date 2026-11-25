---
schema_version: 2
feature_slug: street-raw-khong-mang-ten-nguon
verdict: BLOCKED
failed_evals: ["E1","E2","E3"]
reason: Lệnh `node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'` chạy quá 40 phút chưa xong (eval khai long_running 40 trong _acceptance/street-raw-khong-mang-ten-nguon/evals.yaml, không phải bị công cụ giết). Không có exit code thật nên không kết luận PASS hay FAIL cho suite này.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f9274d9b6787fdb6a6893a0646a4468ba4a870ec
human_signoff:
---

# Evidence Report: street-raw-khong-mang-ten-nguon

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |

Ghi chú: E1, E2, E3 cùng chạy trong một lệnh `probes/ban-chep.sh`, lệnh này kết thúc đỏ 1 ca. Ca đỏ là dòng «chỉ đúng các ô mang tên nguồn đổi» (thuộc E1): ô đổi giữa lượt đột biến và lượt thật là 4 ô, trong đó có `offer_ba52ee3409d223e3.street_raw` mà phép đo kỳ vọng chưa nằm trong tập đổi. Các dòng của E2 và E3 in ✔ nhưng cả lệnh không về 0 nên máy chấm chung E1, E2, E3 là không đạt. Round này còn BLOCKED vì suite `pipeline_a` chưa có exit code thật.

## Evidence

- eval: E1
  run_id: minted-street-raw-khong-mang-ten-nguon-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T13:13:58Z
  output: |
    ✔ log bỏ ghi street_raw = 3 (đếm độc lập trên stg)
    ✔ log bỏ ghi block_raw = 2 (đếm độc lập trên stg)
    ✔ log bỏ ghi district_raw = 1 (đếm độc lập trên stg)
    ✔ log bỏ ghi phuong_raw = 1 (tin N)
    ✔ log rút 3 chủ thể (đếm độc lập phát biểu sống trúng: A, B)
    ô chữ đổi giữa lượt đột biến và lượt thật: 4 (139449 tin S06 × 4 cột)
    ✖ chỉ đúng các ô mang tên nguồn đổi: offer_34f57d13db5dc0b1.block_raw, offer_34f57d13db5dc0b1.street_raw, offer_66279e14cfb4fc28.street_raw, offer_ba52ee3409d223e3.street_raw
    ✔ các ô đổi không còn trúng bộ dò: 3 về NULL, 1 về phát biểu sạch còn lại
    ✔ tin mới N: đường, toà, phường, quận về NULL
    KẾT QUẢ: đỏ 1 ca

- eval: E2
  run_id: minted-street-raw-khong-mang-ten-nguon-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T13:13:58Z
  output: |
    ✔ ca phá: bỏ luật thì bộ soát sync-cloud dừng ở sale_offers.street_raw
    ✔ ca phá: tin A mang đường và toà trúng bộ dò sau lượt đột biến
    ✔ ca phá: tin B lấy đường từ phát biểu legacy trúng bộ dò sau lượt đột biến
    ✔ bộ soát sync-cloud qua trọn sale_offers, sellers, properties sau transform thật và duong-can (không trúng)
    KẾT QUẢ: đỏ 1 ca (ca đỏ nằm ở dòng của E1, cùng lệnh)

- eval: E3
  run_id: minted-street-raw-khong-mang-ten-nguon-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh
  verified_at: 2026-11-25T13:13:58Z
  output: |
    thời gian: lượt đột biến 950.9 s · lượt thật 303.7 s (tỉ lệ 0.319, một mẫu, chỉ tham khảo) · chi phí riêng của luật 1.57 s = 0.52% lượt thật
    ✔ chi phí riêng của luật không quá 5% thời gian lượt transform
    KẾT QUẢ: đỏ 1 ca (ca đỏ nằm ở dòng của E1, cùng lệnh)

- eval: E4
  run_id: minted-street-raw-khong-mang-ten-nguon-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-25T13:13:58Z
  output: |
    lệnh: cd pipeline && node --test tests/street-raw-ten-nguon.test.mjs scripts/ops-nhan-ma-nguon.test.mjs scripts/soat-tang-a.test.mjs scripts/ops-facts-so-tong-hop.test.mjs
    ℹ duration_ms 64889.914167

- eval: E5
  run_id: minted-street-raw-khong-mang-ten-nguon-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test
  verified_at: 2026-11-25T13:13:58Z
  output: |
    cùng lệnh với E4 (một lần chạy phủ cả hai eval)
    ℹ duration_ms 64889.914167

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_a-r1
  exit_code: không có (BLOCKED — chạy quá 40 phút chưa xong, không bị công cụ giết)
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-25T13:13:58Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-street-raw-khong-mang-ten-nguon-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-25T13:13:58Z

Nhận xét lệnh suite đỏ (không gắn eval nào):
- `agent`: các tệp test trong `agent/tests/` đỏ ngay từ lúc nạp (judge-pair, judge-run, parsers, vlm-anh-s03…), chưa có bằng chứng liên quan đến nhánh này.
- `app`: `tsc` báo thiếu kiểu `LayoutProps` / `PageProps` ở sáu tệp layout, page; nhánh này không chạm các tệp đó.
- `app_ui`: lỗi `Cannot find package 'pg'` khi nạp `data-api/src/db/client.ts` trong worktree (thiếu node_modules), lỗi môi trường.
- `pipeline_b`: 727/729 đạt, đỏ 1 ca `SG-AC-5` trong `scripts/so-ghep-s06.test.mjs` (khoá bảng `source_registry` giữa giao dịch); chưa xác định có liên quan nhánh này hay không.
- `pipeline_a`: BLOCKED như ghi ở frontmatter; cần chạy lại với timeout dài hơn.

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

Baseline khong do:
- bash _acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»
- cd pipeline && node --test tests/street-raw-ten-nguon.test.mjs scripts/ops-nhan-ma-nguon.test.mjs scripts/soat-tang-a.test.mjs scripts/ops-facts-so-tong-hop.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/street-raw-khong-mang-ten-nguon, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isola»

none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: baseline không đo được ở round này (cả hai lệnh feature đều n-a), nên danh sách eval không-phân-biệt không đo được ở round này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3 failed — lệnh `probes/ban-chep.sh` đỏ 1 ca «chỉ đúng các ô mang tên nguồn đổi» (4 ô đổi, trong đó có `offer_ba52ee3409d223e3.street_raw` ngoài tập kỳ vọng); suite `pipeline_a` BLOCKED vì chạy quá 40 phút chưa có exit code thật. Returned to implementation.

