---
schema_version: 2
feature_slug: link-nguoi-ban-s03
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3ceb47df1b67b61a41b44c10d52f678f961bc7d6
human_signoff:
---

# Evidence Report: link-nguoi-ban-s03

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
| E11b | AC-11 | judgment | chờ người (đề xuất PASS, một phiếu cần bằng chứng thêm) |

Lệnh không gắn eval mà đỏ: `node scripts/link-nguoi-ban-s03/acceptance.mjs ten-nguon` (thuộc E10, đã tính ở trên).

## Evidence

- eval: E1
  run_id: minted-link-nguoi-ban-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tra
  verified_at: 2026-11-09T04:47:06Z
  output: |
    lệnh `acceptance.mjs tra` chạy 1 lần, 1 lần đạt, không dao động.

- eval: E2
  run_id: minted-link-nguoi-ban-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_dung
  verified_at: 2026-11-09T04:47:06Z
  output: |
    lệnh `acceptance.mjs dung` chạy 1 lần, 1 lần đạt, không dao động.

- eval: E3
  run_id: minted-link-nguoi-ban-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_thu
  verified_at: 2026-11-09T04:47:06Z
  output: |
    lệnh `acceptance.mjs thu` chạy 1 lần, 1 lần đạt, không dao động.

- eval: E4
  run_id: minted-link-nguoi-ban-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ranh_gioi
  verified_at: 2026-11-09T04:47:06Z
  output: |
    ℹ duration_ms 32463.482541

- eval: E5
  run_id: minted-link-nguoi-ban-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_api
  verified_at: 2026-11-09T04:47:06Z
  output: |
    ℹ duration_ms 110246.987875

- eval: E6
  run_id: minted-link-nguoi-ban-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_db
  verified_at: 2026-11-09T04:47:06Z
  output: |
    ok   E6-nap view moi_nhat giữ dòng mới nhất mỗi mã

- eval: E7
  run_id: minted-link-nguoi-ban-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_lien_lac
  verified_at: 2026-11-09T04:47:06Z
  output: |
    lien-lac: 18 đạt · 0 hỏng

- eval: E8
  run_id: minted-link-nguoi-ban-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_chon
  verified_at: 2026-11-09T04:47:06Z
  output: |
    chon: 12 đạt · 0 hỏng

- eval: E9
  run_id: minted-link-nguoi-ban-s03-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tien_kiem
  verified_at: 2026-11-09T04:47:06Z
  output: |
    ℹ duration_ms 54671.961167

- eval: E10
  run_id: minted-link-nguoi-ban-s03-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.lnb_ten_nguon
  verified_at: 2026-11-09T04:47:06Z
  output: |
    MỚI S01 +3 _acceptance/link-nguoi-ban-s03/s4-args-r2.json
    MỚI S06 +4 _acceptance/link-nguoi-ban-s03/s4-args-r2.json
    MỚI S03 +6 _acceptance/link-nguoi-ban-s03/s4-args-r2.json
    MỚI S08 +1 _acceptance/link-nguoi-ban-s03/s4-args-r2.json
    ten-nguon: quét 68 tệp so với 541b56ea
    HỎNG 0 lần xuất hiện mới của tên nguồn (4)
    ten-nguon: 9 đạt · 1 hỏng

- eval: E11a
  run_id: minted-link-nguoi-ban-s03-E11a-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tai_lieu
  verified_at: 2026-11-09T04:47:06Z
  output: |
    tai-lieu: 20 đạt · 0 hỏng

### Judgment (E11b)

Đề xuất panel: PASS. Mục này chờ người (T3 hoặc có phiếu chưa chốt), để trống human_override.

- eval: E11b
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  proposal: PASS
  votes:
    - domain-correctness: PASS — Tài liệu có đủ các ý AC-11 hỏi. runtime-map nêu lượt thử 4 bước gồm số đếm và đối chứng, bảng trần, bảng 10 mã tệp chặn kèm cách xử, tắt không cần khởi động lại, chỉ Mạnh bật lượt lớn, cấm đăng nhập thứ hai, và mục «Chưa đo». mappings.yaml khai `s03_ho_so_theo_tai_khoan` với sáu điều kiện đánh số (1)-(6) cùng `checked_on`. CONTEXT.md có thuật ngữ «Username người bán».
    - operational-feasibility: UNCERTAIN — Runtime-map và runbook phủ gần đủ: một phiên và cấm đăng nhập thứ hai, bảng trần, các bước lượt thử, bảng 10 mã tệp chặn, tắt không cần khởi động lại, chỉ Mạnh bật lượt lớn, mục «Chưa đo». Hai chỗ còn hở. Sáu điều kiện của `rule_id` trong mappings.yaml (dòng 505-509) không khớp sáu điều kiện ở đầu tệp (bằng chứng DD, lý do VN, migration, CHECK, khai báo ở đây, DQ check): điều kiện (6) ghi «kiểm 13/12 — _acceptance/…» khó hiểu, còn migration và CHECK/DQ bị gộp chung. Bước 4 của lượt thử cũng không nói người chạy đọc số đếm và kết quả đối chứng ở đâu (tệp, log hay đầu ra lệnh nào).
    - spec-alignment: PASS — runtime-map.md và runbook-openclaw-hook.md nêu đủ các ý AC-11 hỏi. Gồm bộ tra chỉ dùng bộ nghe tin đang nối và cấm đăng nhập thứ hai, bảng trần, các bước lượt thử (đếm, đối chứng), bảng xử từng mã tệp chặn, chỉ Mạnh bật lượt lớn bằng `luot-lon.txt`, tắt bằng xoá `yeu-cau.json` hoặc đặt `chan.txt` mà không cần khởi động lại, và mục «Chưa đo». `mappings.yaml` khai `s03_ho_so_theo_tai_khoan` với sáu điều kiện ADR-0011 đánh số (1)–(6), và CONTEXT.md có thuật ngữ «Username người bán». Một điểm lệch nhỏ không đổi kết luận: điều kiện (3) ghi «tên tiếng Anh snake_case» trong khi mã là tiếng Việt không dấu, giống các mã anh em `so_tren_tin`, `so_trong_bai`.
  required_evidence:
    - Trong pipeline/mappings.yaml, mục rule_id `s03_ho_so_theo_tai_khoan` (khoảng dòng 503-510): liệt kê đúng sáu điều kiện của ADR-0011 Quyết định 3 theo thứ tự (bằng chứng tra DD, lý do đặc trưng VN, migration 080, CHECK constraint, khai báo ở mappings, DQ check enum-vocab) và giải thích hoặc bỏ cụm «kiểm 13/12». Kèm trích Quyết định 3 trong docs/adr/0011-*.md để đối chiếu.
    - Trong docs/ops/runtime-map.md mục «Lượt thử» bước 4, nêu cụ thể nơi đọc số đếm bốn loại và kết quả hai mã đối chứng (đường dẫn tệp hoặc lệnh, ví dụ nội dung `da-thu.txt` hoặc dòng log gateway), để người khác chạy mà không phải đoán.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-link-nguoi-ban-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

- cmd: cd app && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

- cmd: cd pipeline && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-link-nguoi-ban-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-link-nguoi-ban-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-09T04:47:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline khong do
- node scripts/link-nguoi-ban-s03/acceptance.mjs tra: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs dung: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs thu: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs ranh-gioi: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs api: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs db: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs lien-lac: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs chon: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs tien-kiem: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs ten-nguon: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi
- node scripts/link-nguoi-ban-s03/acceptance.mjs tai-lieu: bo qua baseline: tep scripts/link-nguoi-ban-s03/acceptance.mjs co o cay dang kiem nhung chua co o merge-base 541b56ea6010914723459799c5dd22ecc7786392 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Iterations

Round 1: E10 đỏ — phép quét tên nguồn thấy lần xuất hiện mới của tên nguồn trong tệp chưa theo dõi `_acceptance/link-nguoi-ban-s03/s4-args-r2.json` (cùng `s4-args.json` trong git status). Trả về bước triển khai.
