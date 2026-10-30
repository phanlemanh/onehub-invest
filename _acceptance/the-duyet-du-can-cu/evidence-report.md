---
schema_version: 2
feature_slug: the-duyet-du-can-cu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6cccdb14e9f3316134ec9b85eb14ed96dd85de9c
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: the-duyet-du-can-cu

Vòng 2. Sau vòng 1, lệnh suite cổng portal đã sửa (kiểm tra zalo-media theo gate xemNoiDungTin + admin ở ?path=); cả sáu lệnh suite chạy lại ở vòng này đều xanh. Cả 16 eval của hợp đồng (E1–E16) là carry-forward từ vòng 1 vì delta của vòng 2 không chạm paths của eval nào (mỗi khối ghi `carried_from_round: 1`). Hợp đồng không có eval dạng judgment nên không có mục nào chờ người chốt.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | ui-check | PASS |
| E14 | AC-10 | script | PASS |
| E15 | AC-10 | script | PASS |
| E16 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-the-duyet-du-can-cu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-the-duyet-du-can-cu-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-duyet-du-can-cu-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-the-duyet-du-can-cu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-the-duyet-du-can-cu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-the-duyet-du-can-cu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-the-duyet-du-can-cu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-the-duyet-du-can-cu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_agent
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-the-duyet-du-can-cu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-the-duyet-du-can-cu-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-the-duyet-du-can-cu-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-the-duyet-du-can-cu-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E13
  run_id: E13-the-duyet-du-can-cu-20261030
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  screenshot: evidence/E13-step1.png
  observed: |
    E13-step1.png (1280 sáng, sheet Ghép căn #24 «Cùng căn? binh-thanh 52m² ↔ 60m²»): bảng 4 cột Trường/Tin A/Tin B/So; từng hàng (Giá 7.00 tỷ vs 8.50 tỷ, Diện tích, Giá/m², Phường, Phòng ngủ, WC, Loại hình, Đường, Toà, Tầng) kèm dòng căn cứ cỡ nhỏ dưới giá trị hoặc dưới nhãn trường; nhãn So: Lệch (vàng/hổ phách) và Thiếu (viền xám) tách rõ; dưới cùng ô «Lý do» có nhãn, ba nút Cùng căn/Khác căn/Không chắc đang xám (tắt), gợi ý «Ghi lý do trước khi quyết». Không có «Điểm B», «tự tin», % độ tin.
    E13-step2.png: khối Toàn văn Tin A (đoạn đầu, ghi chú không có toàn văn ở máy thu) và Toàn văn Tin B hiển thị trọn, giữ xuống dòng, emoji hiện; chân sheet ghim, Lý do trống, nút tắt. E13-step3.png: giống hệt step2 (cùng sha — chân sheet ghim nên cuộn tới đáy ra cùng khung); Lý do trống + nút tắt.
    E13-step1b-ai.png: khối «Suy luận của AI — không phải căn cứ», «AI cho là: chưa chắc», lời chênh lệch có % (độ chênh số liệu, không phải độ tin).
    E13-step4.png (1280 tối, sheet Bổ sung tin #162, trạng thái Từ chối): nền tối, trường WC=10, Đường=Bạch Đằng, mỗi trường kèm huy hiệu «Chưa rõ phương pháp» + «Chưa ghi căn cứ»; Toàn văn trọn, xuống dòng giữ; chân sheet «Đã bỏ» + «Lý do: …»; chữ đọc rõ trên nền tối, không có % hay «tự tin». E13-step4b-dark-ghep-can.png (1280 tối, ghép căn #23): Khớp xanh lục, Lệch vàng, Thiếu xám viền — ba nhãn tách màu rõ trên nền tối; Lý do trống, nút tắt.
    E13-step5.png (390 sáng): sheet đầy chiều ngang, bảng so vẫn 4 cột ép hẹp, căn cứ ngắt 3–4 dòng nhưng đọc được, nhãn So đủ, ô Lý do rỗng và nút tắt; nút N của Next dev che một phần nút Cùng căn (chỉ dev). E13-step5b-toan-van-390.png: Toàn văn Tin B hiện trọn, giữ xuống dòng, không tràn ngang.
    E13-step6.png (390, gõ «thử»): ô Lý do có «thử», đếm 3/1.000 ký tự, nút Cùng căn chuyển nền tối (bật), Khác căn/Không chắc viền màu bật; scrollWidth=clientWidth=390. Khớp Expected; không mâu thuẫn.
  network_observed: unscoped-partial   # chỉ từ chữ; số status thô nằm ở evidence/E13-network.txt
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-the-duyet-du-can-cu-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E15
  run_id: design-gate-654d8df638
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.the_duyet_design_gate
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E16
  run_id: minted-the-duyet-du-can-cu-E16-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-30T06:13:49Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-du-can-cu-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-du-can-cu-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-du-can-cu-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-du-can-cu-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-du-can-cu-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-du-can-cu-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T06:27:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

none (danh sách rỗng) — không eval nào được xác nhận xanh cả hai phía. Mọi field baseline ở vòng này ghi n-a (baseline không đo được cho eval carry-forward và cho lệnh suite), nên không kết luận eval nào là red hay green.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: không eval nào đỏ; lệnh suite `node scripts/check-portal-compliance.mjs` (không gắn eval) đỏ ở kiểm tra «zalo-media: isAdmin chặn trước stat/readFile» — diff đã đổi rào đầu của serveZaloMedia khỏi isAdmin nên kiểm tra tĩnh của cổng portal không còn thấy dạng cũ. Trả về giai đoạn triển khai.

Round 2: sửa kiểm tra cổng zalo-media theo gate xemNoiDungTin + admin ở ?path= (commit ff22a187); sáu lệnh suite chạy lại đều xanh, trong đó cổng portal báo «ĐẠT»; 16 eval carry-forward từ vòng 1 vì delta không chạm paths của eval. Verdict PASS.

### Re-pin lần 1 — 2026-10-30, do gộp main 96c6c4b2 (#199 DB2b) đổi tệp nhãn trong paths eval
run_id: repin-20261030T073651Z-83377
sha: 15f752e595fda44f166af5a24c0df9aa45ab93a2 · suites: 6 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng · ngoài làn máy: E13

### Re-pin lần 2 — 2026-10-30, do ba ca probe DB máy thu bỏ qua có lời ở CI
run_id: repin-20261030T075624Z-91866
sha: 6cccdb14e9f3316134ec9b85eb14ed96dd85de9c · suites: 6 lệnh exit 0 · evals: 15/15 eval máy đạt kỳ vọng · ngoài làn máy: E13
