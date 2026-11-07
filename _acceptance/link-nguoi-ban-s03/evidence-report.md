---
schema_version: 2
feature_slug: link-nguoi-ban-s03
verdict: REJECT
failed_evals: ["E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3e766ef16e471a76e7fd42a77cdcaaafdd26f7de
human_signoff:
---

# Evidence Report: link-nguoi-ban-s03

Round 1. E10 không chạy xong: bộ quét tên nguồn dừng khi đọc tệp tạm trong agent/tests, nên chưa có kết quả quét. Mười eval máy còn lại đạt. E11b còn chờ người.

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
| E10 | AC-10 | script | FAIL |
| E11a | AC-11 | script | PASS |
| E11b | AC-11 | judgment | UNCERTAIN |

## Evidence

- eval: E1
  run_id: minted-link-nguoi-ban-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tra
  verified_at: 2026-11-07T12:26:49Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs tra
    hoàn tất, không có dòng lỗi

- eval: E2
  run_id: minted-link-nguoi-ban-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_dung
  verified_at: 2026-11-07T12:26:49Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs dung
    hoàn tất, không có dòng lỗi

- eval: E3
  run_id: minted-link-nguoi-ban-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_thu
  verified_at: 2026-11-07T12:26:49Z
  output: |
    lệnh: node scripts/link-nguoi-ban-s03/acceptance.mjs thu
    hoàn tất, không có dòng lỗi

- eval: E4
  run_id: minted-link-nguoi-ban-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ranh_gioi
  verified_at: 2026-11-07T12:26:49Z
  output: |
    ℹ duration_ms 59.667875

- eval: E5
  run_id: minted-link-nguoi-ban-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_api
  verified_at: 2026-11-07T12:26:49Z
  output: |
    ℹ duration_ms 110636.343084

- eval: E6
  run_id: minted-link-nguoi-ban-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_db
  verified_at: 2026-11-07T12:26:49Z
  output: |
    ok   E6-nap view moi_nhat giữ dòng mới nhất mỗi mã

- eval: E7
  run_id: minted-link-nguoi-ban-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_lien_lac
  verified_at: 2026-11-07T12:26:49Z
  output: |
    lien-lac: 17 đạt · 0 hỏng

- eval: E8
  run_id: minted-link-nguoi-ban-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_chon
  verified_at: 2026-11-07T12:26:49Z
  output: |
    chon: 12 đạt · 0 hỏng

- eval: E9
  run_id: minted-link-nguoi-ban-s03-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tien_kiem
  verified_at: 2026-11-07T12:26:49Z
  output: |
    ℹ duration_ms 56.153042

- eval: E10
  run_id: minted-link-nguoi-ban-s03-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.lnb_ten_nguon
  verified_at: 2026-11-07T12:26:49Z
  output: |
    acceptance ten-nguon: Error: ENOENT: no such file or directory, open '.../agent/tests/.td-cu-run-13168-0.ts'
    at chay (scripts/link-nguoi-ban-s03/ten-nguon.mjs:121:22)
    at async scripts/link-nguoi-ban-s03/acceptance.mjs:40:16

- eval: E11a
  run_id: minted-link-nguoi-ban-s03-E11a-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tai_lieu
  verified_at: 2026-11-07T12:26:49Z
  output: |
    tai-lieu: 20 đạt · 0 hỏng

- eval: E11b
  judged_by: panel đề xuất ba lens (domain-correctness, operational-feasibility, spec-alignment)
  verdict: UNCERTAIN
  rationale: Tài liệu phủ gần hết các ý của AC-11. Còn hai chỗ chưa chốt: sáu điều kiện ADR-0011 trong mappings.yaml dòng 503-510 không khớp sáu điều kiện nêu ở dòng 3-5, và bước 4 của runtime-map không nói đọc số đếm ở đâu.
  required_evidence:
    - Sửa pipeline/mappings.yaml dòng 503-510 cho sáu mục khớp sáu điều kiện ở dòng 3-5, và nêu «(6) kiểm 13/12» là kiểm cụ thể nào (enum-vocab:rule_id của pipeline/dq-enum-vocab.mjs).
    - Cho thấy rule_id s03_ho_so_theo_tai_khoan có checked_on riêng hoặc ghi rõ dùng checked_on 2026-11-06 của enum contact_rule.
    - Chỉ rõ trong runtime-map.md hoặc runbook-openclaw-hook.md nơi đọc số đếm bốn loại và kết quả hai mã đối chứng sau lượt thử.
  human_override:  # chi nguoi ghi

Phiếu của từng lens:
- domain-correctness: UNCERTAIN — runtime-map và runbook đủ các ý còn lại, nhưng sáu điều kiện ADR-0011 trong mappings.yaml (dòng 503-510) không khớp dòng 3-5, và điều kiện (6) «kiểm 13/12» không rõ là kiểm gì.
- operational-feasibility: PASS — có lượt thử 5 bước, bảng 10 mã tệp chặn, cách tắt không cần khởi động lại, cấm đăng nhập thứ hai, bảng trần, chỉ Mạnh bật lượt lớn, mục «Chưa đo», thuật ngữ trong CONTEXT. Bước 4 hơi mỏng nhưng không đủ để hạ.
- spec-alignment: UNCERTAIN — bước 4 không nói đọc số đếm ở đâu hay bằng lệnh nào, và ADR-0011 không nằm trong input để đối chiếu điều kiện (6).

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-link-nguoi-ban-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

- cmd: cd app && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

- cmd: cd pipeline && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-link-nguoi-ban-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-link-nguoi-ban-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-07T12:26:49Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Lưu ý: không eval nào có baseline đo được. Tất cả đều n-a, nên câu trên chỉ nói không có eval nào bị phát hiện là xanh trên cả hai phía.

Baseline khong do
- node scripts/link-nguoi-ban-s03/acceptance.mjs tra: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs dung: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs thu: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs ranh-gioi: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs api: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs db: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs lien-lac: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs chon: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs tien-kiem: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs ten-nguon: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs tai-lieu: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 967fc62afd343571f2685e5dfb5770048fab5209 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng đều

## Iterations

Round 1: E10 không chạy xong, bộ quét tên nguồn dừng vì không đọc được tệp tạm trong agent/tests. Trả về giai đoạn cài đặt.
