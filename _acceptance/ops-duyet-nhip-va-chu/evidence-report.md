---
schema_version: 2
feature_slug: ops-duyet-nhip-va-chu
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5","E6","E7","E8","E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e880fb6974b262008a5221c0734d9d719fe47825
human_signoff:
---

# Evidence Report: ops-duyet-nhip-va-chu

Vòng 1. Lệnh `cd app && npm test` kết thúc không sạch, nên cả mười eval gắn với lệnh này (E1 đến E10) bị tính hỏng. Bản ghi cuối lệnh cho thấy 1049 ca đạt, 1 ca hỏng, 5 ca bỏ qua. Ca hỏng duy nhất là `E4b đối chiếu DB máy thu` trong `app/tests/tin-rao-doi-chieu.test.tsx`: vn-hcmc sale, tổng lệch đếm độc lập (26511 so với 26512). Ca này không thuộc hợp đồng OD1 và đã được ghi từ đường nền (commit 8db0380f, suite app đỏ sẵn E4b do tốc độ DB máy thu). Máy không tách riêng từng eval OD1 khỏi lệnh suite, nên các eval gắn lệnh đó giữ trạng thái hỏng cho đến khi chạy lại.

Lệnh hỏng không gắn eval: không có. Lệnh duy nhất hỏng là `cd app && npm test`, và nó gắn với E1 đến E10.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAILED |
| E2 | AC-2 | test | FAILED |
| E3 | AC-3 | test | FAILED |
| E4 | AC-4 | test | FAILED |
| E5 | AC-5 | test | FAILED |
| E6 | AC-6 | test | FAILED |
| E7 | AC-7 | test | FAILED |
| E8 | AC-8 | test | FAILED |
| E9 | AC-9 | test | FAILED |
| E10 | AC-10 | test | FAILED |
| E11 | AC-4 | ui-check | PASS |
| E12 | AC-8 | test | PASS |
| E13 | AC-8 | test | PASS |
| E14 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ops-duyet-nhip-va-chu-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Lệnh `cd app && npm test`: tests 1055, pass 1049, fail 1, skipped 5.
    Ca hỏng: tests/tin-rao-doi-chieu.test.tsx, «E4b đối chiếu DB máy thu» (vn-hcmc sale: total lệch đếm độc lập, 26511 so với 26512).

- eval: E2
  run_id: minted-ops-duyet-nhip-va-chu-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E3
  run_id: minted-ops-duyet-nhip-va-chu-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E4
  run_id: minted-ops-duyet-nhip-va-chu-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E5
  run_id: minted-ops-duyet-nhip-va-chu-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E6
  run_id: minted-ops-duyet-nhip-va-chu-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E7
  run_id: minted-ops-duyet-nhip-va-chu-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E8
  run_id: minted-ops-duyet-nhip-va-chu-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E9
  run_id: minted-ops-duyet-nhip-va-chu-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E10
  run_id: minted-ops-duyet-nhip-va-chu-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T01:55:21Z
  output: |
    Cùng lệnh `cd app && npm test` như E1: tests 1055, pass 1049, fail 1. Ca hỏng là E4b đối chiếu DB máy thu.

- eval: E11
  run_id: minted-ops-duyet-nhip-va-chu-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui_check
  verified_at: 2026-11-08T01:55:21Z
  screenshot: evidence/E11-step1.png
  observed: |
    Tôi đã mở từng ảnh bằng Read, kết quả khớp Expected.
    - step1: Frame «Nhịp duyệt 7 ngày» ở 1280 px sáng. Bảng có đủ cột Hạng mục, Thẻ chờ, Đã quyết có đo, Trung vị ở thẻ, Giữa hai lượt, Quá 30 phút. Ghép căn: 6 thẻ chờ, 1 lượt đo. Gộp Người: 27 thẻ chờ, 1 lượt đo. Năm hàng còn lại đều có 0 lượt đo, hiện «—».
    - step2: Ba hàng đầu của bảng khi lọc «Người», chỉ có cột Thẻ, Loại, Trạng thái. Cả ba tiêu đề đều «Gộp Người? S03 · …» (#213463, #213462, #213461), badge «Người», trạng thái «Chờ duyệt».
    - step3: Đầu sheet thẻ Ghép căn #105729. Tiêu đề «Cùng căn? Phường Thanh Xuân · 76 m² và 68 m²» không có chữ «score», tên phường có dấu. Badge «Ghép căn» và «Không chắc». Chân sheet có badge «Không chắc» và dòng «Lý do: thử OD1». Ảnh ghép từ hai lần chụp (đầu sheet và chân sheet, bằng ffmpeg vstack) vì thân sheet có SĐT.
    - step4: Sau khi tải lại, hàng Ghép căn có 5 thẻ chờ, 2 lượt đo, trung vị 6,8 giây (trước đó là 6 thẻ, 1 lượt, 3,2 giây). Hàng Gộp Người vẫn 1 lượt đo.
    - step5: Ô Căn của hàng /ops/deals có badge «Đang chờ ghép», nhận diện bằng nội dung ô. Ô gồm «Chưa có ảnh», «Chưa rõ loại hình · 76 m² · 3PN», «Thanh Xuân». Không thấy cột liên hệ.
    - step6: Sheet căn có hai nút «Mở thẻ ghép #105727» và «Mở thẻ ghép #105728». Bấm #105727 thì URL thành /ops/review?card=105727. Sheet mở với tiêu đề «Cùng căn? Phường Thanh Xuân · 76 m² và 83 m²», badge «Ghép căn» và «Chờ duyệt».
    - step7: /ops/review?card=999999 hiện Alert có biểu tượng cảnh báo, chữ «Không tìm thấy thẻ #999999».
    - step8: 375 px chế độ tối. Frame hiện tối, bảng cuộn ngang bên trong Frame, trang không cuộn ngang. documentElement.scrollWidth = clientWidth = 375, innerWidth = 375, html có class dark.
  network_observed: n-a (driver)

- eval: E12
  run_id: minted-ops-duyet-nhip-va-chu-E12-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-11-08T01:55:21Z
  output: |
    `cd app && npx tsc --noEmit && npm run lint` kết thúc sạch.

- eval: E13
  run_id: minted-ops-duyet-nhip-va-chu-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.ui_lint_rules
  verified_at: 2026-11-08T01:55:21Z
  output: |
    `cd app && npm run test:lint-rules` kết thúc sạch (duration_ms 282.221708).

- eval: E14
  run_id: minted-ops-duyet-nhip-va-chu-E14-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-08T01:55:21Z
  output: |
    design-floor-s4.mjs --root . kết thúc sạch.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T01:55:21Z

- cmd: cd pipeline && npm test
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-08T01:55:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ops-duyet-nhip-va-chu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T01:55:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (pass trên cả HEAD lẫn baseline, chỉ chứng minh harness hoặc là regression-guard có chủ ý):
- E13 (`cd app && npm run test:lint-rules`)
- E14 (design-floor-s4.mjs)

Baseline không đo:
- cd app && npm test: baseline vượt trần 180 giây/lệnh, đã dừng cả cây tiến trình; BLOCKED hạ tầng, không phải kết quả của code cũ

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs lớn hơn 1).

## Judge panels

Không có panel judge nào được đề xuất ở vòng này (không có judgment item).

## Iterations

Round 1: E1 đến E10 hỏng vì lệnh `cd app && npm test` còn một ca đỏ (E4b đối chiếu DB máy thu, 26511 so với 26512, ngoài hợp đồng OD1, đỏ sẵn từ đường nền). E11 đến E14 xanh. Trả về cho khâu thi công.
