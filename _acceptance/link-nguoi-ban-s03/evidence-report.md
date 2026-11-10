---
schema_version: 2
feature_slug: link-nguoi-ban-s03
verdict: REJECT
failed_evals: [E8]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 91c0e8ceb0706ffb197bd529f318c2c5c96272d5
human_signoff:
---

# Evidence Report: link-nguoi-ban-s03

Round 5. Verdict REJECT: E8 hỏng. Lệnh hỏng không gắn eval nào khác: không có.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |
| E11a | AC-11 | script | PASS |
| E11b | AC-11 | judgment | chờ người (hội đồng đề xuất PASS, chưa có human_override) |

## Evidence

- eval: E1
  run_id: minted-link-nguoi-ban-s03-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tra
  verified_at: 2026-11-10T02:32:51Z
  output: |
    (lệnh tra không in dòng tóm tắt; kết thúc thành công)

- eval: E2
  run_id: minted-link-nguoi-ban-s03-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_dung
  verified_at: 2026-11-10T02:32:51Z
  output: |
    (lệnh dung không in dòng tóm tắt; kết thúc thành công)

- eval: E3
  run_id: minted-link-nguoi-ban-s03-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_thu
  verified_at: 2026-11-10T02:32:51Z
  output: |
    (lệnh thu không in dòng tóm tắt; kết thúc thành công)

- eval: E4
  run_id: minted-link-nguoi-ban-s03-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ranh_gioi
  verified_at: 2026-11-10T02:32:51Z
  output: |
    (lệnh ranh-gioi không in dòng tóm tắt; kết thúc thành công)

- eval: E5
  run_id: minted-link-nguoi-ban-s03-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_api
  verified_at: 2026-11-10T02:32:51Z
  output: |
    ℹ duration_ms 110271.238458

- eval: E6
  run_id: minted-link-nguoi-ban-s03-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_db
  verified_at: 2026-11-10T02:32:51Z
  output: |
    ok   E6-nap view moi_nhat giữ dòng mới nhất mỗi mã

- eval: E7
  run_id: minted-link-nguoi-ban-s03-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_lien_lac
  verified_at: 2026-11-10T02:32:51Z
  output: |
    lien-lac: 18 đạt · 0 hỏng

- eval: E8
  run_id: minted-link-nguoi-ban-s03-E8-r5
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.lnb_chon
  verified_at: 2026-11-10T02:32:51Z
  output: |
    HỎNG lượt thử chọn đủ 20 mã + 2 đối chứng
    chon: 13 đạt · 1 hỏng

- eval: E9
  run_id: minted-link-nguoi-ban-s03-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tien_kiem
  verified_at: 2026-11-10T02:32:51Z
  output: |
    (lệnh tien-kiem không in dòng tóm tắt; kết thúc thành công)

- eval: E10
  run_id: minted-link-nguoi-ban-s03-E10-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_ten_nguon
  verified_at: 2026-11-10T02:32:51Z
  output: |
    ten-nguon: 13 đạt · 0 hỏng

- eval: E11a
  run_id: minted-link-nguoi-ban-s03-E11a-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.lnb_tai_lieu
  verified_at: 2026-11-10T02:32:51Z
  output: |
    tai-lieu: 20 đạt · 0 hỏng

- eval: E11b
  judged_by: hội đồng ba lens (domain-correctness, operational-feasibility, spec-alignment)
  proposal: PASS
  rationale: Ba lens cùng đề xuất PASS, xem mục Judge dưới đây.
  human_override:  # chi nguoi ghi

### Judge panel E11b (đề xuất, chưa có human_override)

- domain-correctness: PASS — runtime-map.md và runbook-openclaw-hook.md nêu đủ các bước lượt thử (đếm không ghi, lập tệp, khung 01:00–05:00, canh 30 phút, đọc bốn loại kết quả cùng 2 mã đối chứng); bảng xử cho cả 10 mã tệp chặn; cách tắt bằng xoá `yeu-cau.json` hoặc đặt `chan.txt` không cần khởi động lại; lượt lớn chỉ Mạnh bật qua `luot-lon.txt` và bảng trần; cấm đăng nhập thứ hai; mục «Chưa đo». rule_id `s03_ho_so_theo_tai_khoan` trong mappings.yaml có khối rationale/checked_on cấp trục và chú thích đủ sáu điều kiện ADR-0011; điều (6) chỉ ghi «kiểm 13/12» kèm AC-6 và AC-7, hơi ngắn nhưng vẫn khai được.
- operational-feasibility: PASS — mục «Bộ tra hồ sơ người bán S03» có đủ ý của AC-11: bảng trần, cấm đăng nhập thứ hai, chỉ dùng bộ nghe tin đang nối, 4 bước lượt thử kèm số đếm và đối chứng, bảng 6 mã tệp chặn kèm cách xử, tắt không cần khởi động lại, lượt lớn chỉ Mạnh bật, mục «Chưa đo». Còn hai chỗ mơ hồ nhẹ: nơi đọc số đếm bốn loại, và các giá trị hợp lệ của `luot-lon.txt`; cả hai không làm người khác không chạy được lượt thử.
- spec-alignment: PASS — hai tài liệu nêu đủ: cấm đăng nhập thứ hai, bảng trần (20 mã, 60 giây, 30 lời/ngày, khung 01:00–05:00, 15 giây), lượt thử 5 bước, bảng xử từng mã tệp chặn, cách tắt, lượt lớn chỉ Mạnh bật, mục «Chưa đo». mappings.yaml khai `s03_ho_so_theo_tai_khoan` với sáu điều kiện đánh số (1)–(6); CONTEXT.md có thuật ngữ «Username người bán». Lens này không đọc phần đầu mappings.yaml định nghĩa sáu điều kiện ADR-0011, nên việc sáu mục khớp từng điều kiện là suy từ cách đánh số.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-link-nguoi-ban-s03-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

- cmd: cd app && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

- cmd: cd pipeline && npm test
  run_id: minted-link-nguoi-ban-s03-SUITE-npm_test__13563d-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-link-nguoi-ban-s03-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-link-nguoi-ban-s03-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-10T02:32:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Không có eval nào bị liệt kê là không-phân-biệt. Lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất.

## Iterations

Round 5: E8 failed — lệnh chon báo «HỎNG lượt thử chọn đủ 20 mã + 2 đối chứng» (13 đạt, 1 hỏng). Returned to implementation. Các round trước xem run-log.jsonl.
