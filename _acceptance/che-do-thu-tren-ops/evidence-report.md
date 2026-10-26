---
schema_version: 2
feature_slug: che-do-thu-tren-ops
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 78ed70327bce78391bca09bf7eb49b88308ce396
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: che-do-thu-tren-ops

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | ui-check | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-che-do-thu-tren-ops-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E2
  run_id: minted-che-do-thu-tren-ops-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E3
  run_id: minted-che-do-thu-tren-ops-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E4
  run_id: minted-che-do-thu-tren-ops-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E5
  run_id: minted-che-do-thu-tren-ops-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E6
  run_id: minted-che-do-thu-tren-ops-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 3442.146125

- eval: E7
  run_id: minted-che-do-thu-tren-ops-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E8
  run_id: e8-verify-20261025
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T11:16:51Z
  screenshot: evidence/E8-sang.png
  observed: |
    E8-sang.png (đã đọc): /ops/sources sáng, viewport đầu trang, bảng «Danh mục mã nguồn» S01–S08, cột «Tên thật (tầng A)» là các khối đen █ (đã che), nhãn tầng C hiện rõ; chưa thấy cột Chế độ vì nằm dưới. E8-toi.png: cùng bố cục nền tối, chữ trắng đọc được, khối tầng A che. E8-390.png: một cột, bảng danh mục cuộn ngang TRONG khung bảng (thanh cuộn nằm trong thẻ), trang không tràn ngang, tầng A che.
    E8-sang-chedo.png: hai bảng nhóm (Nhóm Facebook, Thị trường Chợ Tốt) có cột «Bài | Chế độ | Trạng thái»; mọi dòng hiện «Chưa đặt» (xám nhỏ nhưng đọc được); tên nhóm và group_key là khối đen/xám. E8-toi-chedo.png: giống, nền tối, «Chưa đặt» đọc được, tầng A che bằng khối trắng. E8-390-chedo.png: tiêu đề «Nhóm» của bảng, cột Chế độ nằm ngoài vùng nhìn trong khung bảng cuộn ngang riêng, trang không cuộn ngang; tầng A che.
    E8-hop-thoai-sang.png: hộp thoại «Chế độ thu», dòng «S06 · điểm #6. Bật Bùng cần hạn; máy tự về Duy trì khi hết hạn.», ba nút Chờ/Bùng/Duy trì (Bùng chọn), ô «Hạn bùng» dd/mm/yyyy, câu «Tối đa 14 đêm; hết hạn máy tự về Duy trì.», nút Huỷ và nút Lưu bị khoá (xám); nền sau mờ, tầng A che, không có tên nguồn thật hay group_key. E8-hop-thoai-toi.png: giống ở nền tối, Lưu khoá, nền sau che. Tất cả khớp Expected.
  network_observed: clean

- eval: E9
  run_id: minted-che-do-thu-tren-ops-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

- eval: E10
  run_id: minted-che-do-thu-tren-ops-E10-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T11:16:51Z

- eval: E11
  run_id: minted-che-do-thu-tren-ops-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.che_do_thu
  verified_at: 2026-10-25T11:16:51Z
  output: |
    ℹ duration_ms 1916.742834

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-che-do-thu-tren-ops-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T11:16:51Z

- cmd: cd app && npm test
  run_id: minted-che-do-thu-tren-ops-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-25T11:16:51Z

- cmd: cd pipeline && npm test
  run_id: minted-che-do-thu-tren-ops-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T11:16:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-che-do-thu-tren-ops-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T11:16:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-che-do-thu-tren-ops-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T11:16:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline):

- node --test scripts/job-exit.test.mjs: E6 (xanh cả hai phía; ca AU13 cloud-sync cũ đã xanh trên mã cũ, nên đây là regression-guard có chủ ý cho thứ tự bước mới chứ chưa chứng minh được phần mới một mình)

Baseline không đo

- cd app && node --import tsx --test tests/che-do-thu.test.tsx: bo qua baseline: tep app/tests/che-do-thu.test.tsx co o cay dang kiem nhung chua co o merge-base 08afadf0bf07b9de84188dffe62e0637d53edea4 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định)

## Iterations

Round 1: mọi eval xanh; hai finding trong hợp đồng (AC-7 hàng SourceGroups dựng tay, AC-5 detail audit chỉ kiểm tập khoá) được sửa ở S4-r1 (lưới đọc qua docNhomThu dùng chung, phép đo AC-5 ghép audit theo điểm), bốn mục ngoài hợp đồng ghi nhận cho Gate 2.
Round 2: mọi eval xanh trên cây 9d35ae4c; không còn finding trong hợp đồng.

### Re-pin lần 1 — 2026-10-25, do ghim lại sau chữ ký + gộp main 169b8c6
run_id: repin-20261025T232950Z-78712
sha: 3b52ca19931628767cbc2a889e4248020c70edb0 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)

### Re-pin lần 2 — 2026-10-26, do ghim lại sau gộp main c0c5a97 (#111, #114)
run_id: repin-20261026T001911Z-71919
sha: 402336b1cebb8a8eb761a732ff2cab2c973654dd · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)

### Re-pin lần 3 — 2026-10-26, do ghim lại sau gộp main 85072b3 (#118 sửa test agent, #119)
run_id: repin-20261026T035853Z-29290
sha: 00732520b962e459a2541a77efb2f3cbfb8420ef · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)

### Re-pin lần 4 — 2026-10-26, do CD-AC-7b chờ request lưu xong (che-do-thu-test-cho-luu)
run_id: repin-20261026T144747Z-36323
sha: df43c77d496fef39c38cccebdc201b9e1ba4c5ec · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)

### Re-pin lần 5 — 2026-10-26, do gộp origin/main (#140) vào fix/che-do-thu-test-cho-luu
run_id: repin-20261026T144940Z-98370
sha: dfc6f9754cfd74f4af639535ada109f1754cc80b · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)

### Re-pin lần 6 — 2026-10-26, do danh sách bỏ qua CI thêm ca DF-AC-3 + gộp #141/#136 (ci-bo-qua-df-ac-3)
run_id: repin-20261026T145405Z-62211
sha: 78ed70327bce78391bca09bf7eb49b88308ce396 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng · ngoài làn máy: E8 (E8 không khai paths)
