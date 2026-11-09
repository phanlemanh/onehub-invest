---
schema_version: 2
feature_slug: bai-nhan-tru-bai-chi-anh
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8981a8ebff815a0ef28c96be3f5ef2d64c6bf60a
human_signoff:
---

# Evidence Report: bai-nhan-tru-bai-chi-anh

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
| E10 | AC-1 | script | PASS |
| E11 | AC-5 | ui-check | PASS |

## Evidence

Round 3: toàn bộ eval giữ nguyên từ round trước (delta không chạm paths của eval), chỉ lệnh suite chạy lại.

- eval: E1
  run_id: minted-bai-nhan-tru-bai-chi-anh-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-bai-nhan-tru-bai-chi-anh-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-bai-nhan-tru-bai-chi-anh-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-bai-nhan-tru-bai-chi-anh-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T05:23:44Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-bai-nhan-tru-bai-chi-anh-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T05:23:44Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-bai-nhan-tru-bai-chi-anh-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-bai-nhan-tru-bai-chi-anh-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-bai-nhan-tru-bai-chi-anh-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_app
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-bai-nhan-tru-bai-chi-anh-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.df4_cu
  verified_at: 2026-11-09T05:23:44Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-bai-nhan-tru-bai-chi-anh-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.df4_that
  verified_at: 2026-11-09T03:43:57Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-bai-nhan-tru-bai-chi-anh-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-09T05:23:44Z
  carried_from_round: 2
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
  (carry-forward tu round 2 — delta khong cham paths cua eval; khung của lượt gốc, cùng run_id)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

- cmd: cd app && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

- cmd: cd pipeline && npm test
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-bai-nhan-tru-bai-chi-anh-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-09T06:46:54Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (pass trên cả HEAD lẫn baseline), ghi nhận là regression-guard có chủ ý:
- E9 (lệnh `cd app && bash ../db/db-thu.sh oneinvest_suite_df4cu --chay node --import tsx --test --test-concurrency=1 tests/ops-dong-chay.test.tsx tests/dong-chay-cloud.test.tsx tests/df0-chang-theo-ngay.test.tsx tests/df0-dem-de-xuat.test.tsx tests/dong-chay-so-cu.test.tsx`): bộ thử cũ giữ nguyên hành vi, là rào hồi quy chủ ý của AC-9, không phải eval của hành vi mới.

## Variance

none — không eval nào chạy nhiều lần; không có eval ngẫu nhiên hay chập chờn.

## Iterations

Round 1: E11 failed — Sankey khổ hẹp vỡ đầu cột. Returned to implementation.
Round 2: REJECT chỉ do lệnh suite app npm test (ca đo giờ E4B-AC-3 chập chờn, ngoài diff); mọi eval PASS.
Round 3: PASS — suite xanh trọn, eval giữ nguyên từ round trước.
