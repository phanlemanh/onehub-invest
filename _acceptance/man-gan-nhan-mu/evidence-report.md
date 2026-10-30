---
schema_version: 2
feature_slug: man-gan-nhan-mu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 92cec90399ba1f2d1839b68117f7a01a07581aa5
human_signoff:
---

# Evidence Report: man-gan-nhan-mu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | ui-check | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-10 | script | PASS |

Tổng kết vòng 2: cả 13 eval xanh. E2, E5, E7 chạy lại ở vòng này trên cây 92cec903 (round 2); 10 eval còn lại mang từ vòng 1 vì delta không chạm paths của chúng. Sáu lệnh suite hồi quy đều xanh.

## Evidence

- eval: E1
  run_id: minted-man-gan-nhan-mu-E1-r1
  exit_code: 0
  verifier: config:executors.script.mgn_migration
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-man-gan-nhan-mu-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_mau
  verified_at: 2026-10-30T01:59:19Z
  output: |
    MAU OK

- eval: E3
  run_id: E3-man-gan-nhan-20261030
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E3-step1.png
  observed: |
    E3-step1.png (1280 sáng): trang «Gắn nhãn» trong Ops, breadcrumb Vận hành > Gắn nhãn; chip «Tôi đã gắn 0/10 tin», «Cặp gắn trùng đủ hai người 0/2», «Đồng thuận: chưa đủ cặp»; thẻ «Tin cần gắn» có «S03 · Duy Ka Masteri ❤️❤️ · đăng 2026-10-28 15:55 (GMT+7)» và chữ gốc (một URL ảnh f64-zpg-r.zdn.vn); thẻ «Chín trường lõi» có Ý định tin / Loại tin / Loại hình (ô Chọn), Dự án, Toà, kèm «Tin không nêu» mỗi ô; không có giá trị máy nào. Bố cục hai cột, không cuộn ngang.
    E3-step2.png (390x844 tối): nền tối, một cột, tiêu đề, chip xuống hàng, thẻ tin và thẻ biểu mẫu xếp dọc, nội dung vừa khung 390, không cắt ngang.
    E3-step3-truoc-luu.png: form đã điền (Dự án Vinhomes Ocean Park, Toà S1, giá 3,5 / 3,8 tỷ, Diện tích «Tin không nêu» tích và ô xám, Phòng ngủ 2).
    E3-step3.png (sau Lưu): chip đổi «Tôi đã gắn 1/10 tin»; thẻ tin là bài khác (12:11, nội dung «Giảm giá chốt trong ngày nay... DT:43m2 ... 2,9 tỷ»); form về trạng thái trống («Chọn», ô rỗng). Khớp Expected: sang tin khác.
    E3-step4.png (giá ngược): nhãn «Giá (khoảng)» và hai ô 5 / 4 viền đỏ, dòng đỏ «Giá thấp nhất lớn hơn giá cao nhất» ngay dưới ô giá; Dự án Vinhomes Ocean Park, Toà S1, Diện tích 50, Phòng ngủ 2 còn nguyên; vẫn tin 12:11, không sang tin khác. Khớp Expected (AC-7 vế màn). Khung ảnh step3/4 từ ego-browser là viewport ~1870 rộng, nền tối theo pane.
  network_observed: n-a (driver)

- eval: E4
  run_id: minted-man-gan-nhan-mu-E4-r1
  exit_code: 0
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-man-gan-nhan-mu-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_mu
  verified_at: 2026-10-30T01:59:19Z
  output: |
    MU OK

- eval: E6
  run_id: minted-man-gan-nhan-mu-E6-r1
  exit_code: 0
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-man-gan-nhan-mu-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_dong_thuan
  verified_at: 2026-10-30T01:59:19Z
  output: |
    DONG THUAN OK

- eval: E8
  run_id: minted-man-gan-nhan-mu-E8-r1
  exit_code: 0
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-man-gan-nhan-mu-E9-r1
  exit_code: 0
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-man-gan-nhan-mu-E10-r1
  exit_code: 0
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: design-gate-be9b43a44c
  exit_code: 0
  verifier: config:executors.design.mgn_gate
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-man-gan-nhan-mu-E12-r1
  exit_code: 0
  verifier: config:executors.script.mgn_duong
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: minted-man-gan-nhan-mu-E13-r1
  exit_code: 0
  verifier: config:executors.script.mgn_pham_vi
  verified_at: 2026-10-30T01:52:18Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-man-gan-nhan-mu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

- cmd: cd app && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

- cmd: cd pipeline && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-man-gan-nhan-mu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-man-gan-nhan-mu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T01:59:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- node _acceptance/man-gan-nhan-mu/probes/mau.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/mu.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/dong-thuan.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: none — không liệt kê được eval nào; baseline BLOCKED hạ tầng nên tính phân biệt không đo được ở round này.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2 failed — probe mau.mjs vi phạm khoá ngoại stg_zalo_posts_snapshot_id_fkey ngay ở bước dựng dữ liệu thử (snapshot_id hanoi__zalo__mgnthu chưa có trong airbnb_snapshots), AC-2 chưa được đo. Returned to implementation.
Round 2: cả 13 eval xanh — E2, E5, E7 chạy lại trên cây 92cec903 sau khi phép đo tách dữ liệu thử theo tag; E1, E3, E4, E6, E8, E9, E10, E11, E12, E13 mang từ round 1 (delta không chạm paths của chúng); sáu lệnh suite xanh.
