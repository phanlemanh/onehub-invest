---
schema_version: 2
feature_slug: viewer-khong-thay-the-duyet
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f1971a7f4fd64414f3230b8963e54e76580c07a7
human_signoff:
---

# Evidence Report: viewer-khong-thay-the-duyet

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
| E9 | AC-9 | ui-check | PASS |
| E10 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-viewer-khong-thay-the-duyet-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-viewer-khong-thay-the-duyet-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-viewer-khong-thay-the-duyet-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-viewer-khong-thay-the-duyet-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T09:07:09Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-4' xanh (một lần chạy chung với E5, E6)
    ℹ duration_ms 2891.072625

- eval: E5
  run_id: minted-viewer-khong-thay-the-duyet-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T09:07:09Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-5' xanh (một lần chạy chung với E4, E6)
    ℹ duration_ms 2891.072625

- eval: E6
  run_id: minted-viewer-khong-thay-the-duyet-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T09:07:09Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ca 'VT-AC-6' xanh (một lần chạy chung với E4, E5)
    ℹ duration_ms 2891.072625

- eval: E7
  run_id: minted-viewer-khong-thay-the-duyet-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T09:07:09Z
  output: |
    cd app && npm test
    cả bộ test app chạy một tiến trình, kết thúc xanh
    ℹ duration_ms 43636.431792

- eval: E8
  run_id: minted-viewer-khong-thay-the-duyet-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-29T08:28:56Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-viewer-khong-thay-the-duyet-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-29T09:07:09Z
  screenshot: evidence/E9-step1.png
  observed: |
    E9-step1 (viewer /ops/review): tieu de «Hàng duyệt», dong «11 thẻ đang chờ», chip «entity_match: 11», Alert «Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.»; khong co bang/hang the nao; thanh duoi ben trai ghi viewer-test@local.test, vai «Người xem». Khop Expected.
    E9-step2 (viewer /ops/data-flow): trang Dong chay du lieu, badge «11 thẻ chờ duyệt», duong ong Sankey S03/S06; khong co phan nao bat thuong.
    E9-step3 (viewer): bang «Tin mới nhất» 28/328 tin sau khi loc Nguon la «S05 · Mạng xã hội», 10 dong dau deu S05, bac B0.
    E9-step4 (viewer sheet S05 «Bán · 50 tỷ ₫ · 72 m²»): cac muc Truong loi, Phan loai, Truong da doc, Lam giau va can; muc «Ảnh tin» ghi «Ảnh tin chỉ hiện cho quản trị viên.»; chua thay khoi trich bai.
    E9-step5 (viewer sheet cuon xuong): cuoi sheet co tieu de «Bài gốc» va cau «Bài gốc chỉ hiện cho vai Vận hành trở lên.»; khong co doan trich bai. Khop Expected.
    E9-step6 (admin /ops/review): «Danh sách thẻ — 11 thẻ», bo loc «Mọi loại»/«Chờ duyệt», bang cot Thẻ/Loại/Trạng thái/Tạo lúc voi 11 hang («Cùng căn? binh-thanh 52m² ↔ 60m²»… #24…#14), badge Ghep can / Cho duyet; khong co cau chan cua viewer. Khop Expected.
    E9-step7 (admin data-flow): cung bang S05 28 tin, chip Nguon la S05, vai «Quản trị» (ops-test@local.test).
    E9-step8 (admin sheet S05): cung ban ghi, muc «Ảnh tin» bat dau hien khung anh.
    E9-step9 (admin sheet cuon): «Ảnh tin» voi 4+ o «Ảnh hỏng» (anh CDN het han, khong tai duoc), roi khoi «Bài gốc» voi ten nhom «Nhóm BẤT ĐỘNG SẢN HÀ NỘI ✅» va doan trich tieng Viet day du (noi dung luoc khoi bang chung — bai goc chi hien trong /ops/**). Khop Expected (admin co khoi trich bai).
  network_observed: third-party-only   # words only — raw statuses live in evidence/E9-network.txt

- eval: E10
  run_id: minted-viewer-khong-thay-the-duyet-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dev_ops_account
  verified_at: 2026-10-29T09:07:09Z
  output: |
    node --test scripts/dev-ops-account.test.mjs
    ca mới trong describe 'vai viewer' và các ca cũ của tệp đều xanh
    ℹ duration_ms 597.961292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-29T09:07:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-29T09:07:09Z

- cmd: cd pipeline && npm test
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-29T09:07:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-29T09:07:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-viewer-khong-thay-the-duyet-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-29T09:07:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/dev-ops-account.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không đo được ở round này vì baseline bị chặn hạ tầng, nên danh sách eval xanh-cả-hai-phía không xác định được; không có eval nào bị xác nhận là không-phân-biệt.

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, deterministic)

## Iterations

Round 1: E1-E10 đều đạt, không eval nào hỏng; không có judgment item. Verdict PASS.
Round 2: chấm lại delta sau khi gộp main (f1971a7f). E4, E5, E6, E7, E9, E10 chạy lại và đều đạt; E1, E2, E3, E8 giữ nguyên từ round 1 (delta không chạm paths của các eval này). Không có judgment item. Verdict PASS.
