---
schema_version: 2
feature_slug: db-vao-volume
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3dbf610d3c4544c685d83ed564122e8f88a08e39
human_signoff: Mạnh 2026-10-29
---

# Evidence Report: db-vao-volume

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-1 | script | PASS |
| E4 | AC-1 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-10 | judgment | UNCERTAIN |
| E14 | AC-1 | script | PASS |
| E15 | AC-1 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-db-vao-volume-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_static
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check static: ĐẠT

- eval: E15
  run_id: minted-db-vao-volume-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_static
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check static: ĐẠT

- eval: E2
  run_id: minted-db-vao-volume-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_mutation
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check mutation: ĐẠT

- eval: E3
  run_id: minted-db-vao-volume-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_static
  verified_at: 2026-10-29T09:37:29Z
  output: |
    check-db-autostart static: ĐẠT

- eval: E4
  run_id: minted-db-vao-volume-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_mutation
  verified_at: 2026-10-29T09:37:29Z
  output: |
    check-db-autostart mutation: ĐẠT

- eval: E5
  run_id: minted-db-vao-volume-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E6
  run_id: minted-db-vao-volume-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E7
  run_id: minted-db-vao-volume-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E8
  run_id: minted-db-vao-volume-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E9
  run_id: minted-db-vao-volume-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E10
  run_id: minted-db-vao-volume-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E11
  run_id: minted-db-vao-volume-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check tap-duot: ĐẠT

- eval: E12
  run_id: minted-db-vao-volume-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_live
  verified_at: 2026-10-29T09:37:29Z
  output: |
    db-volume-check live: ĐẠT

- eval: E14
  run_id: minted-db-vao-volume-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_live
  verified_at: 2026-10-29T09:37:29Z
  output: |
    check-db-autostart live: ĐẠT

### Judgment (E13) — hội đồng đề xuất PASS, còn một phiếu chưa chốt

- eval: E13
  judged_by: judge panel (3 lens, fresh context) — đề xuất của hội đồng: PASS
  verdict: UNCERTAIN
  rationale: Hai phiếu PASS, một phiếu UNCERTAIN ở lens domain-correctness. Ý (1) và (3) đạt, ý (2) gần đạt; chỗ hở là hai dòng `public.sale_offers: →` và `public.listings: →` trong chuyen-that.log không có số dòng, nên chưa đọc được từ log rằng hai bảng được nêu tên đó nằm trong phép so và khớp trước = sau = sau tạo lại.
  votes:
    - domain-correctness: UNCERTAIN — Ý (1) và (3) đạt: khôi phục thử khớp 283/283 lúc 08:52Z, trước giờ chuyển 09:19:43Z; runbook có đủ lệnh, nơi để bản sao lưu, hạn giữ, đường lùi từ tar lạnh và cảnh báo compose cũ. Ý (2) gần đạt: cửa sổ job gần nhất là 101 phút, danh sách loại trừ có lý do từng bảng và không chứa bốn bảng cấm, ops-check trước và sau giống nhau. Chỗ hở: dòng `public.sale_offers: →` và `public.listings: →` trong chuyen-that.log không có số dòng nào. Đó là hai trong bốn bảng được nêu tên, nên không đọc được từ log rằng chúng nằm trong phép so và khớp trước = sau = sau tạo lại. Câu "khớp từng dòng mọi 283 bảng" không thay được hai con số còn trống.
    - operational-feasibility: PASS — Cả ba ý đúng. (1) khoi-phuc-that.log: bản sao lưu thật khôi phục "PASS khớp 283/283 bảng" lúc 08:52:09Z, trước giờ chuyển 16:19:43 +07 (09:19:43Z) trong chuyen-that.log. (2) Bảng cửa sổ job có khoảng cách nhỏ nhất 101 phút, lớn hơn 20 phút. Năm bảng loại trừ đều có lý do và không có sale_offers, sale_offer_records, listings, properties. Số dòng 283 bảng khớp trước = sau = sau tạo lại, tổng 12181635. ops-check-sau.log giống ops-check-truoc.log (30 PASS · 3 FAIL · 6 LIMITED, cùng 1 ô S01/hcmc quá hạn). (3) db-volume.md đủ sao lưu, khôi phục, chuyển, lùi, nơi lưu chỉ ở đĩa máy này, hạn giữ 7 ngày (nêu mốc 05/11 16:20), lùi từ tar lạnh và cảnh báo compose cũ. Một điểm nhỏ: chuyen-that.log in "public.sale_offers: →" và "public.listings: →" không có số, nên hai dòng này không xác nhận được từng bảng. Dòng tổng "khớp từng dòng mọi 283 bảng" thì có, và không làm sai kết luận.
    - spec-alignment: PASS — (1) khoi-phuc-that.log ghi khôi phục thử khớp 283/283 bảng lúc 08:52:09Z. Giờ đó trước giờ chuyển 16:19:43 +07, tức 09:19:43Z, trong chuyen-that.log. (2) Bảng cửa sổ plist có khoảng cách gần nhất là 101 phút (đều ngoài ±20 phút). Danh sách loại trừ gồm 5 bảng, mỗi bảng có lý do, và không có sale_offers, sale_offer_records, listings, properties. Số dòng trước, sau chuyển và sau tạo lại đều là 283 bảng, tổng 12181635, khớp từng dòng. ops-check-sau.log giống ops-check-truoc.log (30 PASS, 3 FAIL, 6 LIMITED, cùng một ô S01/hcmc quá hạn). (3) db-volume.md có đủ lệnh sao lưu, khôi phục, chuyển, lùi, lùi từ tar lạnh, nơi để bản sao lưu chỉ ở đĩa máy này, hạn giữ 7 ngày (sớm nhất 05/11 16:20) và cảnh báo không chạy compose cũ. Một điểm lệch nhỏ không đổi kết luận: dòng số của sale_offers và listings trong chuyen-that.log bị để trống ("→"), nhưng dòng tổng hợp "khớp từng dòng mọi 283 bảng" vẫn bao phủ chúng.
  required_evidence:
    - Số dòng của public.sale_offers và public.listings ở ba mốc (truoc.tsv, sau.tsv, sau-tao-lai.tsv) trong $HOME/onehub-backups/db/20261029T085125Z/. Lấy bằng cách chạy lại bước in số dòng của chuyen-that.log (các dòng `sale_offers: →` và `listings: →`) cho ra dạng `public.sale_offers: N→N→N`, hoặc grep hai tên đó trong ba tệp tsv và dán kết quả vào evidence/chuyen-that.log.
    - Giải thích hai dòng trống, kèm bằng chứng: `SELECT relkind FROM pg_class WHERE relname IN ('sale_offers','listings')` trên DB oneinvest, và xác nhận hai tên này có (hoặc không có) trong danh sách 283 bảng của truoc.tsv. Nếu chúng là bảng phân vùng hoặc view thì ghi rõ cách phép so bao phủ dữ liệu của chúng.
  human_override: Mạnh 2026-10-29 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-db-vao-volume-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-db-vao-volume-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

- cmd: cd app && npm test
  run_id: minted-db-vao-volume-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

- cmd: cd pipeline && npm test
  run_id: minted-db-vao-volume-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-db-vao-volume-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-db-vao-volume-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T09:37:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline của round này ghi n-a. Danh sách eval không-phân-biệt (xanh trên cả HEAD lẫn baseline) KHÔNG đo được ở round này vì baseline không chạy; không kết luận eval nào có phân biệt hay không.

### Baseline khong do

- bash scripts/db-volume-check.sh static: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh mutation: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/check-db-autostart.sh static: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/check-db-autostart.sh mutation: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh tap-duot: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh live: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/check-db-autostart.sh live: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval chạy một lần (xác định), không có eval nhiều lần nên không có pass_rate hỗn hợp.

## Iterations

Round 1: mọi eval máy (E1-E12, E14, E15) đạt và các lệnh suite đạt; E13 (judgment) còn một phiếu chưa chốt (hai dòng số dòng trống trong chuyen-that.log), chờ người ở Cổng 2. Baseline không đo được (hạ tầng). Mốc giờ verified_at chỉ ghi ngày verify (2026-10-29), không bắt được giờ chính xác.

### Re-pin lần 1 — 2026-10-29, do sau db-volume-live-ban-lui: thước live không đòi bản lùi tồn tại mãi
run_id: repin-20261029T103227Z-30313
sha: d4d9450292f0e864927b242b9c86ef172828072a · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E13 · AC không có chốt máy: AC-10

### Re-pin lần 2 — 2026-10-29, do sau db-volume-live-ban-lui vòng 2 (sửa tự kiểm live) + gộp origin/main
run_id: repin-20261029T120251Z-66574
sha: 3dbf610d3c4544c685d83ed564122e8f88a08e39 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E13 · AC không có chốt máy: AC-10
