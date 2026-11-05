---
schema_version: 2
feature_slug: ghep-anh-tren-the-gan-nhan
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9522531471e61c7b040eab94a6f85b6c45b76cea
human_signoff:
---

# Evidence Report: ghep-anh-tren-the-gan-nhan

Round 5. Mười hai eval của hợp đồng đều chạy xong và đều đạt. Verdict là REJECT vì một lệnh suite hồi quy, `cd app && npm test`, không đạt và không gắn eval nào (xem mục «Lệnh suite (hồi quy)»). Vì không eval nào đỏ nên `failed_evals` để trống.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | ui-check | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | ui-check | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ghep-anh-tren-the-gan-nhan-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_lenh
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd pipeline && node --test scripts/label-ghep.test.mjs
    ℹ duration_ms 214.71275

- eval: E2
  run_id: minted-ghep-anh-tren-the-gan-nhan-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E3
  run_id: minted-ghep-anh-tren-the-gan-nhan-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1373.756541

- eval: E4
  run_id: minted-ghep-anh-tren-the-gan-nhan-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E5
  run_id: E5-ego-62
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T12:16:36Z
  screenshot: evidence/E5-ghep-1280.png
  observed: |
    Lần chạy 2, mọi khung đều đã mở bằng Read. Ở 1280 px thẻ S03 hiện nhãn tím «Ghép suy ra · 3 ảnh» đọc trọn, ba ảnh một hàng, chữ «Cho thuê 2PN toà thử, 64,5m2, giá 7 triệu» đọc trọn, căn cứ «Chữ» được chọn, không có http hay example.test, không tràn ngang. Ở 375 px thẻ xếp một cột, không bị cắt ngang. Cụm 21 ảnh cuộn ngang một hàng; chữ hai tin «Có 2 tin chữ trong 2 phút, máy chọn tin gần nhất» và «Không có tin chữ trong 2 phút» đọc trọn; ô ảnh lỗi có «Ảnh không tải được» và «Thử lại»; hết nhóm hiện «Đã gắn hết nhóm này».
    Chỉ có một điều chưa tốt: hộp xem lớn của ảnh lỗi chỉ hiện chữ thay thế và biểu tượng ảnh vỡ.
  network_observed: clean

- eval: E6
  run_id: minted-ghep-anh-tren-the-gan-nhan-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_thuan
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx --test tests/labels-ghep.test.ts
    ℹ duration_ms 1373.756541

- eval: E7
  run_id: minted-ghep-anh-tren-the-gan-nhan-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E8
  run_id: e8-20261105-ghep-anh
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-05T12:16:36Z
  screenshot: evidence/E8-luot-hai.png
  observed: |
    Trước khi lưu (bản chạy cổng 3463, DB thử, nhóm S03-N064, bài 11038): các trang và route danh sách trả 200, ba ảnh zalo-media trả 200 image/png. Chữ tin chữ seed «Cho thuê 2PN toà thử» xuất hiện tổng 7 lần; mọi mồi (TOAMAYSEED, MOIASSERTSEED, MOIPROPSEED, rent_lt, moiseeda1-3, TOAMAYANHSEED), mã bài ghep-seed-t1/a1/a2/a3 và example.test đều đếm 0 trên mọi phản hồi. Đối chứng đọc DB thử: block_raw 1+1, silver_labels rent_lt 1 và moiseed* 3, field_assertions 1, enrichment_proposals 1, stg_zalo_posts ghep-seed-% 38 dòng (31 dòng ảnh example.test).
    Sau khi điền đủ 17/17 và bấm «Lưu và xem máy đọc» (khung E8-luot-hai.png, 1280x1500): khối «Bài gốc» còn nhãn «Ghép suy ra · 3 ảnh», dải 3 ảnh và chữ ghép; bảng «So với máy» có cột Anh gắn / Bộ đọc / AI đọc với giá trị bộ đọc (Tin rao, Bán, toamayseed, 64.5; 3 trường khác máy). Chọn «Ghép sai» rồi «Ghi và sang tin kế» chuyển sang bài «Bán căn 1PN thử» (1/7); DB thử ghi eval_label_cases case_kind = ghep-sai, 1 dòng cho bài này. Không sửa code; server do tôi dựng đã tắt.
  network_observed: clean

- eval: E9
  run_id: minted-ghep-anh-tren-the-gan-nhan-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E10
  run_id: minted-ghep-anh-tren-the-gan-nhan-E10-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_nap
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs
    NAP OK

- eval: E11
  run_id: minted-ghep-anh-tren-the-gan-nhan-E11-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_that
  verified_at: 2026-11-05T12:16:36Z
  output: |
    cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs
    THAT OK

- eval: E12
  run_id: minted-ghep-anh-tren-the-gan-nhan-E12-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ghep_kin
  verified_at: 2026-11-05T12:16:36Z
  output: |
    node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs
    KIN OK

### Lệnh suite (hồi quy)

Lệnh fail không gắn eval: `cd app && npm test`. Bộ chạy 1008 ca, 997 đạt, 1 không đạt, 10 bỏ qua. Ca không đạt là `E4b đối chiếu DB máy thu` ở `app/tests/tin-rao-doi-chieu.test.tsx:102`, assert về thời gian: `newest 1072.3745839999901 ms`. Ca này không thuộc eval nào của hợp đồng; round này không xác định được nó có do diff của feature hay do độ trễ máy. Năm lệnh suite còn lại đều đạt.

- cmd: cd agent && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-05T12:16:36Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-05T12:16:36Z

- cmd: cd app && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__bd9a35-r5
  exit_code: 1
  verified_at: 2026-11-05T12:16:36Z

- cmd: cd pipeline && npm test
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-11-05T12:16:36Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-05T12:16:36Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-ghep-anh-tren-the-gan-nhan-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-05T12:16:36Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo xanh ở cả code mới lẫn code cũ. Năm lệnh eval feature và hai eval ui-check có baseline n-a, nên chưa thể nói chúng phân biệt được code cũ với code mới.

Baseline khong do
- cd pipeline && node --test scripts/label-ghep.test.mjs: bo qua baseline: tep pipeline/scripts/label-ghep.test.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-ghep.test.ts: bo qua baseline: tep app/tests/labels-ghep.test.ts co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs: bo qua baseline: tep _acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs co o cay dang kiem nhung chua co o merge-base e50741fc8b1368098d2d7d4c5c4a1efc6b364c0a — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 4: REJECT (theo commit 410a1f82 «bằng chứng lượt chấm 4 ghép ảnh trên thẻ gắn nhãn, REJECT»; nguyên nhân chi tiết nằm ở round đó, không có trong đầu vào của bước này).
Round 5: REJECT — E1 đến E12 đều đạt; lệnh suite `cd app && npm test` không đạt ở ca `E4b đối chiếu DB máy thu` (assert thời gian), không gắn eval nào. Trả lại để điều tra ca này, và các lỗi ngoài hợp đồng nằm ở review-findings.md để người quyết ở Gate 2.
