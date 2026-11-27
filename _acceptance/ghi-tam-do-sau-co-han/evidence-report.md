---
schema_version: 2
feature_slug: ghi-tam-do-sau-co-han
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 03b9b5836e2983045893e668a3104ed6a99427a5
human_signoff:
---

# Evidence Report: ghi-tam-do-sau-co-han

Round 1. Chín eval máy E1–E9 đều xanh, nhưng lệnh suite `agent npm test` đỏ (không gắn eval nào) và có hai finding trong hợp đồng (AC-6) nên verdict là REJECT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người) |

## Evidence

- eval: E1
  run_id: minted-ghi-tam-do-sau-co-han-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-1 «trả lại dòng mã toà của luật»: AC-1 ô loại=true toà=true: lời nhắc còn dòng «Mã tòa phát hiện»

- eval: E2
  run_id: minted-ghi-tam-do-sau-co-han-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-2 «bỏ dấu danh sách toà»: AC-2 tin C (danh sách toà) route corroborated

- eval: E3
  run_id: minted-ghi-tam-do-sau-co-han-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-3 «áp không mở lô (đọc toàn bộ)»: AC-3 đọc toàn bộ áp mà thiếu lô

- eval: E4
  run_id: minted-ghi-tam-do-sau-co-han-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-4 «đảo doc_lap lô đọc toàn bộ»: lô doc-toan-bo-loai-hinh doc_lap lệch — lô: doc-toan-bo-loai-hinh=1993:false:14 truoc-doc-lap-loai-hinh=187:false:14 truoc-doc-lap-toa=110:false:14

- eval: E5
  run_id: minted-ghi-tam-do-sau-co-han-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-5 «rút bỏ lọc theo lô»: AC-5 số giá trị rút

- eval: E6
  run_id: minted-ghi-tam-do-sau-co-han-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-6 «đọc toàn bộ bỏ xét quá hạn»: AC-6 đọc toàn bộ vẫn ghi tạm loại hình khi lô quá hạn

- eval: E7
  run_id: minted-ghi-tam-do-sau-co-han-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-7 «đạt mà không thôi cờ»: AC-7 lô đạt mà giá trị còn cờ hoặc bị rút

- eval: E8
  run_id: minted-ghi-tam-do-sau-co-han-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-8 «bỏ điều kiện ghi tạm ở B3»: AC-8 căn lên bậc nhờ loại hình ghi tạm

- eval: E9
  run_id: minted-ghi-tam-do-sau-co-han-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh
  verified_at: 2026-11-27T06:57:42Z
  output: |
    đỏ đúng AC-9 «áp corroborated khi ô dừng»: AC-9 áp corroborated khi ô dừng

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 1
  verified_at: 2026-11-27T06:57:42Z
  note: lệnh đỏ, không gắn eval nào. Đuôi đầu ra cho thấy ca SL1-AC-11 trong tests/s03-len-cong.test.ts đỏ với lỗi Postgres «current transaction is aborted, commands ignored until end of transaction block» (thước không đỏ trên bản route.ts).

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-ghi-tam-do-sau-co-han-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T06:57:42Z

### Judgment

Hội đồng đề xuất cho E10 (ap-may-thu.md có đủ năm thứ: lệnh áp, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau). Người quyết ở Cổng 2, ô human_override để trống.

- eval: E10
  judged_by: judge panel (fresh context)
  proposal: PASS
  votes:
    - domain-correctness: PASS — ap-may-thu.md có đủ năm thứ. Mục 1 là lệnh áp 129 từ main (psql -1). Mục 2 là số chạy thử 1.993/187/110 khớp AC-4. Mục 3 là lệnh pg_dump trước áp. Mục 4 là lùi bằng lui-129.sql, kèm số đã chạy thử trên bản chép (bảng gỡ, cột còn 0). Mục 5 là lệnh kiểm sau áp, kèm số mong đợi.
    - operational-feasibility: PASS — Tệp có đủ năm thứ: lệnh áp 129 từ main, bảng chạy thử trên bản chép khớp 1.993 · 187 · 110, lệnh pg_dump trước khi áp, lệnh lùi kèm kết quả đã chạy thử (bảng ghi_tam_lo đã gỡ, cột lo_id/ghi_tam còn 0), lệnh kiểm sau áp cùng số mong đợi.
    - spec-alignment: PASS — Lệnh áp 129 ở mục 1; mục 2 ghi 1.993, 187, 110 khớp ba lô của AC-4 cùng ca áp lần hai không đổi; mục 3 có pg_dump trước áp; mục 4 có lệnh lùi và số đã chạy thử; mục 5 có lệnh kiểm sau áp và số mong đợi (ba lô đúng số ở mục 2, hạn bằng ngày áp cộng 14, cột đầu bằng 0 ở truy vấn đêm kế).
  human_override:  # chi nguoi ghi

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 03b9b5836 (vòng BLOCKED ở 2469d5342 không tính). pipeline_that chạy NGOÀI vòng (HT37): bỏ khỏi danh sách suite của vòng, chạy riêng sau lượt — tests 37, pass 37, fail 0, skipped 0, «bỏ qua 1 ca chỉ máy thu» → ĐẠT (chấm trên M5: ON22-AC-10 không chạy — HT33). Mọi eval E1–E9 thoát 0; E10 judgment đề xuất PASS. Suite agent đỏ hai ca SL1-AC-11 (tests/s03-len-cong.test.ts, lỗi 25P02 «current transaction is aborted»), lặp lại khi chạy lại riêng (421/424). Soát cùng sha (DB dựng từ migration) agent xanh 413/424; main e88c6786d trên M5 cùng cách chạy agent xanh 410/411 — xem evidence/m5-ngoai-vong-r1.txt. Review: hai finding medium trong hợp đồng AC-6 (xuLaiTrich ở agent/src/enrich/doc-toan-bo.ts:440 chỉ kiểm oDangDung, thiếu truongQuaHan — vẫn ghi tạm property_type vào trường có lô quá hạn chưa rút). Kit trả REJECT. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không có baseline đo được (baseline n-a), nên không có eval nào bị xếp là không-phân-biệt.

Baseline khong do
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-1: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-2: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-3: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh AC-4: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-5: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-6: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-7: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-8: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh AC-9: bo qua baseline: tep _acceptance/ghi-tam-do-sau-co-han/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 4d63b3f11257d35194b8b8d8c78ea24170f6994e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định.

## Iterations

Round 1: chín eval E1–E9 xanh, nhưng lệnh suite `agent npm test` đỏ (ca SL1-AC-11 của tests/s03-len-cong.test.ts, không gắn eval nào) và hai finding trong hợp đồng AC-6 (đường xuLaiTrich trong agent/src/enrich/doc-toan-bo.ts vẫn ghi tạm property_type khi lô quá hạn chưa rút). Trả về triển khai.
