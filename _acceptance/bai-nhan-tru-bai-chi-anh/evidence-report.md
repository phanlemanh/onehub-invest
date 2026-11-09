---
schema_version: 2
feature_slug: bai-nhan-tru-bai-chi-anh
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 47b76c9c5f070c003a03e4f5ff77b5d23b7958cf
human_signoff:
---

# Evidence Report: bai-nhan-tru-bai-chi-anh

Round 2. Mọi eval gắn AC đều xanh. Verdict REJECT vì một lệnh suite hồi quy không gắn eval nào ("cd app && npm test") thất bại ở round này: ca E4B-AC-3 của tests/tin-rao-doi-chieu.test.tsx (đo thời gian sort, 941 ms và 821 ms so với ngưỡng 700 ms). Xem Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward round 1) |
| E2 | AC-2 | test | PASS (carry-forward round 1) |
| E3 | AC-3 | test | PASS (carry-forward round 1) |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS (carry-forward round 1) |
| E7 | AC-7 | test | PASS (carry-forward round 1) |
| E8 | AC-8 | test | PASS (carry-forward round 1) |
| E9 | AC-9 | test | PASS |
| E10 | AC-1 | script | PASS (carry-forward round 1) |
| E11 | AC-5 | ui-check | PASS |

## Evidence

- eval: E4
  run_id: minted-bai-nhan-tru-bai-chi-anh-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T05:23:44Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_df4app --chay node --import tsx --test --test-concurrency=1 tests/data-flow-bai-chi-anh.test.tsx
    ℹ duration_ms 4853.858

- eval: E5
  run_id: minted-bai-nhan-tru-bai-chi-anh-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T05:23:44Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_df4app --chay node --import tsx --test --test-concurrency=1 tests/data-flow-bai-chi-anh.test.tsx
    ℹ duration_ms 4853.858

- eval: E9
  run_id: minted-bai-nhan-tru-bai-chi-anh-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_cu
  verified_at: 2026-11-09T05:23:44Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_df4cu --chay node --import tsx --test --test-concurrency=1 tests/ops-dong-chay.test.tsx tests/dong-chay-cloud.test.tsx tests/df0-chang-theo-ngay.test.tsx tests/df0-dem-de-xuat.test.tsx tests/dong-chay-so-cu.test.tsx
    ℹ duration_ms 17788.991292

- eval: E11
  run_id: minted-bai-nhan-tru-bai-chi-anh-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-09T05:23:44Z
  screenshot: evidence/E11-step1.png
  observed: |
    E11-step1.png (1280 sáng, S03): khung 'Đường ống' có chip '110.370 bài' và nút Tất cả/S03/S05/S06 với S03 đang chọn. Sankey có cột Nguồn (1 nguồn), Bài nhận 110.370, Bài cần đọc 86.316, Đọc được 58.769 (68,1%), Tin rao mới 5.103 (9.3 bài/tin), Gắn căn 0,0% đỏ (156 chờ khớp). Các nút: S03 · Cộng đồng 110.370; Ảnh đã ghép vào tin 24.054 (xám, vạch gạch nối); Đọc thành tin rao 47.392 (đen); Đọc thành Yêu cầu 11.377 (xanh lơ); Ảnh chưa ghép 19.894 (đỏ); Không đọc được 7.653 (đỏ); Gộp vào tin đã có 42.289 (xám); Chưa định vị 5.103 (đỏ). Chú giải có Yêu cầu xanh lơ và Rơi khỏi ống đỏ. Không có thanh bên.
    E11-step2.png: rê 'Đọc thành Yêu cầu', tooltip ghi Yêu cầu, Số lượng 11.377, So với bài nhận 10,3%, Tỉ lệ bước 13,2%, kèm mô tả bài tìm mua/thuê. Luồng xanh lơ sáng lên, phần còn lại mờ.
    E11-step2a-tin-rao.png: rê 'Đọc thành tin rao', tooltip ghi Đang chảy, Số lượng 47.392, So với bài nhận 42,9%, Tỉ lệ bước 54,9%.
    E11-step3.png: lưới có cột Nguồn/nhóm, Nút thắt, Bài nhận, Đọc được, Tin rao, Đủ trường lõi, Có phường, Gom cụm. Hàng S03 · Cộng đồng: huy hiệu đỏ 'Kẹt · trường lõi', Bài nhận 110.370 (100%), Đọc được 58.769 (68%), Tin rao 5.103 (9.3 bài/tin), Đủ trường lõi 1.673 (33%), Có phường 4.881 (96%). Cùng ảnh có S06 (Khoẻ, 75.582 / 95%), S01 (Khoẻ, 908 / 93%), S05 (Kẹt · trường lõi, 57 / 57%).
    E11-step4.png (375 tối): nền tối, khung 'Đường ống' trong một cột. Nút chọn nguồn xếp vừa hàng. Sankey trong khung cuộn ngang riêng. Hiện cột Nguồn và nút S03 trắng trên nền tối, chữ rõ, không vỡ. Chú giải gồm Yêu cầu xanh lơ và Rơi khỏi ống đỏ.
    E11-step4b-cuon-giua.png: cuộn tới 330. Thấy Bài cần đọc 86.316, nút Ảnh đã ghép (xám), Đọc thành Yêu cầu (xanh lơ), Không đọc được (đỏ). Tooltip còn lại cho Bài nhận → Bài cần đọc 78,2%. Nhãn bị cắt ở mép khung vì đang cuộn.
    E11-step4c-cuon-cuoi.png: cuộn cuối. Thấy Tin rao mới 5.103, Gắn căn 0,0% đỏ, Chưa định vị (đỏ), Gộp vào tin đã có (xám). Chữ rõ.
    Tất cả khớp Expected.
  network_observed: n-a (driver)

### Eval carry-forward (round 1)

- eval: E1
  run_id: minted-bai-nhan-tru-bai-chi-anh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-bai-nhan-tru-bai-chi-anh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-bai-nhan-tru-bai-chi-anh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-bai-nhan-tru-bai-chi-anh-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-bai-nhan-tru-bai-chi-anh-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-bai-nhan-tru-bai-chi-anh-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-bai-nhan-tru-bai-chi-anh-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.df4_that
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-09T05:23:44Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-09T05:23:44Z

- cmd: cd app && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bd9a35-r2
  exit_code: 1
  verified_at: 2026-11-09T05:23:44Z
  note: 1102 ca, 1096 đạt, 1 hỏng, 5 bỏ qua. Ca hỏng là E4B-AC-3 ở tests/tin-rao-doi-chieu.test.tsx (đo thời gian sort: newest 941 ms, price-asc 821 ms, ngưỡng 700 ms). Lệnh không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-09T05:23:44Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-09T05:23:44Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-09T05:23:44Z

## Known limits

## Ngoài hợp đồng

## Analyst

Carried tu round 1 — baseline khong do lai round nay. Field baseline cua moi eval ghi n-a (round nay khong do).

Eval khong-phan-biet (xanh ca tren HEAD lan baseline): lenh `cd app && bash ../db/db-thu.sh oneinvest_suite_df4cu --chay ... tests/ops-dong-chay.test.tsx tests/dong-chay-cloud.test.tsx tests/df0-chang-theo-ngay.test.tsx tests/df0-dem-de-xuat.test.tsx tests/dong-chay-so-cu.test.tsx` (eval E9). E9 la regression-guard co chu y (AC-9 giu nguyen hanh vi cu), khong phai loi harness.

## Variance

none — every multi-run eval is uniform (moi eval chay mot lan, deterministic). Ca E4B-AC-3 cua suite app la ca do thoi gian, hong o round nay; nghi nhay theo tai may, khong thuoc eval nao.

## Iterations

Round 1: eval gan AC xanh ca; S4 r1 REJECT o E11 (Sankey chong dau cot o kho hep). Tra ve trien khai, commit 47b76c9c nới khung toi thieu.
Round 2: E4, E5, E9, E11 chay lai va xanh; E1, E2, E3, E6, E7, E8, E10 carry-forward. Lenh suite "cd app && npm test" hong mot ca E4B-AC-3 (thoi gian sort 941 ms va 821 ms vuot 700 ms, tests/tin-rao-doi-chieu.test.tsx) — ca nay do do hieu nang, khong cham mã cua feature; can chay lai tren may roi hoac nguoi quyet. Tra ve.
