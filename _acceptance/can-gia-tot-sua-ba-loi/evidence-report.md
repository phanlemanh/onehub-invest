---
schema_version: 2
feature_slug: can-gia-tot-sua-ba-loi
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 85c59f8eae023465b266d391bbbd568afe8ded6b
human_signoff: Mạnh 2026-11-04
---

# Evidence Report: can-gia-tot-sua-ba-loi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | ui-check | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |

## Evidence

- eval: E7
  run_id: minted-can-gia-tot-sua-ba-loi-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái trình duyệt trên bản dev của worktree (:3462); sửa nhãn lúc ký vì kho không có khoá executors.ui-check
  verified_at: 2026-11-04T05:07:01Z
  screenshot: evidence/E7-ten.png
  observed: |
    E7-ten.png: trang một căn của tin P1 bán có seller unknown, chân thanh bên «Vận hành» (ops-role-test@local.test). Tiêu đề, giá/huy hiệu, mọi giá trị dd (kể cả ô Tên, SĐT, Nhóm) đều mờ không đọc được; chỉ nhãn dòng (Tên, SĐT, Nhóm), crumb Vận hành > Căn giá tốt > Một căn và khung bố cục rõ. Đo bằng textContent: có đúng 1 dòng Tên, giá trị khác unknown và không rỗng; không có chữ unknown nào trong main. E7-ly-do-390.png (viewport 390): tiêu đề và ảnh mờ, giá trị dd mờ; nhãn đọc rõ «Đã rời danh sách / Đắt hơn thước phường 1%, không phải căn giá tốt» và đoạn «Đắt hơn thước phường 1 tr/m², tức 1%, nên không phải căn giá tốt.»; không thanh cuộn ngang, scrollWidth 390 = clientWidth 390. E7-ly-do-man.png (1870 px): cùng nhãn đọc đủ, ảnh/tiêu đề/dd/tên nhóm mờ, scrollWidth 1870 = clientWidth 1870, không thanh cuộn ngang. E7-crumb-sheet.png: sau khi bấm crumb Căn giá tốt của căn trong danh sách, URL ?can=<đúng mã căn>, sheet mở bên phải, liên kết trong sheet trỏ đúng căn đó; tiêu đề sheet, ảnh, giá trị dd, tên và nút SĐT đều mờ (lần chụp đầu để lộ nút SĐT ở chân sheet nên đã bỏ và chụp lại với blur cả a[href^=tel]; frame hiện tại không còn đọc được SĐT). E7-crumb-bang.png: bấm crumb của căn đã rời (số âm) về /ops/deals, không có dialog, bảng 3 dòng với ô bảng mờ, chỉ thấy tiêu đề cột và khung. Không frame nào có tên nguồn thật (chỉ mã S0x).
  network_observed: n-a (driver)

- eval: E1
  run_id: minted-can-gia-tot-sua-ba-loi-E1-r3
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-can-gia-tot-sua-ba-loi-E2-r3
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-can-gia-tot-sua-ba-loi-E3-r3
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_sua_ba_loi
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-can-gia-tot-sua-ba-loi-E4-r3
  exit_code: 0
  verifier: config:executors.test.can_gia_tot
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-can-gia-tot-sua-ba-loi-E5-r1
  exit_code: 0
  verifier: config:executors.script.can_gia_tot_quet_ma
  verified_at: 2026-11-04T01:50:32Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-can-gia-tot-sua-ba-loi-E6-r3
  exit_code: 0
  verifier: config:executors.script.can_gia_tot_ca_cu
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-can-gia-tot-sua-ba-loi-E8-r3
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_ten_invest
  verified_at: 2026-11-04T04:23:52Z
  carried_from_round: 3
  # carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-can-gia-tot-sua-ba-loi-E9-r2
  exit_code: 0
  verifier: config:executors.test.can_gia_tot_doi_chieu
  verified_at: 2026-11-04T02:08:01Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

- cmd: cd app && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

- cmd: cd pipeline && npm test
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-can-gia-tot-sua-ba-loi-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-04T05:07:01Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature deu red tren baseline (co phan biet)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt đầu bị trả lại để sửa, E5 ghi nhận ở round này.
Round 2: E9 ghi nhận ở round này.
Round 3: bị chặn ở S4, E7 chuyển sang cổng 3462.
Round 4: E7 chạy lại với frame đã che mờ; các eval còn lại mang sang từ round trước, suite chạy lại, kết quả PASS.
