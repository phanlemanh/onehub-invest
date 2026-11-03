---
schema_version: 2
feature_slug: so-ghep-s06-nhan-danh-ba
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: da7f9bb1980bf2d542ecaf8e6b1691f4c8938ff2
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: so-ghep-s06-nhan-danh-ba

Round 4. Mọi eval của hợp đồng đều mang sang từ các round trước (delta không chạm paths của eval nào); sáu lệnh suite hồi quy chạy lại và đều đạt. Judgment E10 do hội đồng ba góc nhìn đề xuất PASS, chờ người chốt ở Gate 2 nên verdict tổng là PENDING-JUDGMENT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (mang sang từ round 3) |
| E2 | AC-2 | test | PASS (mang sang từ round 3) |
| E3 | AC-3 | test | PASS (mang sang từ round 3) |
| E4 | AC-4 | test | PASS (mang sang từ round 3) |
| E5 | AC-5 | test | PASS (mang sang từ round 3) |
| E6 | AC-6 | test | PASS (mang sang từ round 1) |
| E7 | AC-7 | test | PASS (mang sang từ round 1) |
| E7b | AC-7 | script | PASS (mang sang từ round 1) |
| E8 | AC-8 | test | PASS (mang sang từ round 1) |
| E8u | AC-8 | ui-check | PASS (mang sang từ round 1) |
| E9 | AC-9 | script | PASS (mang sang từ round 2) |
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |

## Evidence

Mốc `verified_at` của lệnh suite vòng 4 là mốc xấp xỉ do máy không truyền giờ chạy; giờ chính xác nằm ở `run-log.jsonl`.

- eval: E1
  run_id: minted-so-ghep-s06-nhan-danh-ba-E1-r3
  carried_from_round: 3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-so-ghep-s06-nhan-danh-ba-E2-r3
  carried_from_round: 3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-so-ghep-s06-nhan-danh-ba-E3-r3
  carried_from_round: 3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-so-ghep-s06-nhan-danh-ba-E4-r3
  carried_from_round: 3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-so-ghep-s06-nhan-danh-ba-E5-r3
  carried_from_round: 3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_test
  verified_at: 2026-11-03T04:06:44Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-so-ghep-s06-nhan-danh-ba-E6-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_sync
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_api
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7b
  run_id: minted-so-ghep-s06-nhan-danh-ba-E7b-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_be_mat
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sg_ui
  verified_at: 2026-11-03T01:11:06Z
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8u
  run_id: minted-so-ghep-s06-nhan-danh-ba-E8u-r1
  carried_from_round: 1
  exit_code: 0
  baseline: n-a
  verifier: config:capture.ui
  verified_at: 2026-11-03T01:11:06Z
  screenshot: evidence/E8u-truoc.png
  observed: |
    E8u-truoc.png (1870 rong): trang 'Tin ban tai Thanh pho Ha Noi', the 'Hai Yen' (7,5 ty, O Cho Dua) co Badge vang 'Chua xac minh' canh nut 'Xem so' khi chua bam; the 'ha duy anh' va 'Ngo Phuong' cung co Badge; cac the 'Chua co so' khong co Badge. Khop Expected.
    E8u-sau.png: cung trang, the Hai Yen sau khi bam: Badge 'Chua xac minh' VAN CON, nut chuyen thanh link tel: voi phan so la khoi xam tron (da che), khong doc duoc chu so. Khop Expected, khong lo so.
    E8u-truc-tiep.png: cuon toi the 'Tu Nguyen' (Hoang Mai, 4,4 ty, Dang boi Tu Nguyen) chi co nut 'Xem so', KHONG co Badge; the 'Tu Nguyen' (Vinh Tuy) ben canh co Badge de doi chieu. Khop Expected.
    E8u-320.png (320 rong): the 'Hai Yen' co Badge 'Chua xac minh' va link tel: da che xuong dong trong khung the, the lien ke 'ha duy anh' Badge + Xem so nam gon, khong cat/tran ngang; do bang JS scrollWidth=clientWidth=320. Khop Expected.
    E8u-thue.png: trang /vn/hanoi/listings/rent, the '16 tr/thang Nha rieng 30 m2 3 PN Tuong Mai Dang boi Quang Khai' co Badge 'Chua xac minh' + Xem so (the 10 tr/thang Quang Khai va 5 tr/thang datle cung co); cac the 'Chua co so' khong Badge. Khop Expected.
  network_observed: n-a (driver)
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-so-ghep-s06-nhan-danh-ba-E9-r2
  carried_from_round: 2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sg_do
  verified_at: 2026-11-03T03:29:16Z
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval

### Judgment

- eval: E10
  judged_by: hội đồng ba góc nhìn (fresh context), đề xuất PASS
  verdict: PASS
  rationale: Cả ba góc nhìn thấy đủ bốn vế trong các tệp đầu vào: thuật ngữ «Chưa xác minh» đủ khuôn trong CONTEXT.md; khai `seller_phone_inferred` đủ sáu điều kiện ADR-0011 trong mappings.yaml (ngày tra 2026-11-03, `dd: null`, lý do đặc trưng VN, migration 070, boolean không cần CHECK, DQ `so-chua-xac-minh` ở 450) cùng ghi chú `seller_phone` nay là tầng C và lên cloud; dòng «Đính chính 03/11» ở thiết kế cũ nêu mục hạ nguồn và OOS-2; ROADMAP ghi thứ tự 070 trước 068 kèm các mốc cột cloud, kéo về, áp 070, áp 068. Hội đồng không mở `pipeline/sql/450_dq_checks.sql` và `db/migrations/070` vì ngoài danh sách đầu vào, chỉ dựa vào việc mappings.yaml khai chúng.
  votes:
    - domain-correctness: PASS — thuật ngữ «Chưa xác minh» đủ khuôn (định nghĩa, Code kèm RESO, _Avoid_); mappings.yaml khai đủ sáu điều kiện ADR-0011; ghi chú `seller_phone` không còn nói số ở lại máy; dòng đính chính ở thiết kế cũ nêu rõ mục hạ nguồn và OOS-2; ROADMAP ghi «070 trước 068».
    - operational-feasibility: PASS — mappings.yaml khai `seller_phone_inferred` với `dd: null`, kiểu boolean không cần CHECK, DQ `so-chua-xac-minh` ở 450, migration 070; ROADMAP ghi thứ tự áp «070 trước 068» cùng các mốc cột cloud (CLOUD_ALLOW, áp cột cloud).
    - spec-alignment: PASS — CONTEXT.md đúng khuôn thuật ngữ; mappings.yaml đủ sáu điều kiện ADR-0011 với ngày tra 03/11 và kết quả không có tương đương; ghi chú `seller_phone` nói số lên cloud, trên Invest chỉ qua route contact; thiết kế cũ có đoạn «Đính chính 03/11» sửa ba chỗ; ROADMAP ghi 070 trước 068 kèm năm mốc.
  human_override: Mạnh 2026-11-03 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

- cmd: cd app && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

- cmd: cd pipeline && npm test
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-ghep-s06-nhan-danh-ba-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-03T06:07:00Z

## Known limits

## Ngoài hợp đồng

Còn các mục ngoài hợp đồng chờ người quyết ở Gate 2: 6 mục mới của vòng 4 và 10 mục mang từ vòng trước, đọc đủ ở review-findings.md mục «Ngoài hợp đồng».

## Analyst

Eval không-phân-biệt: none — danh sách rỗng. Baseline không đo ở vòng 4 (mọi field baseline là n-a: eval mang sang không chạy lại, sáu lệnh suite là hồi quy không gắn eval), nên không khẳng định thêm rằng mọi eval feature đều red trên baseline.

Lệnh fail không gắn eval: none — sáu lệnh suite đều đạt ở vòng này.

## Variance

none — mọi eval có runs là 1, không có pass_rate hỗn hợp. Ghi chú về lệnh suite (không phải eval): `cd pipeline && npm test` đạt ở vòng 1 và vòng 4, hỏng ở vòng 2 và vòng 3 với hai ca khác nhau (tranh chấp khoá trên DB dùng chung); nghi chập chờn, chưa root-cause.

## Iterations

Round 1: mọi eval của hợp đồng xanh, nhưng lệnh suite `cd app && npm test` không gắn eval nào hỏng (ca trong app/tests/ops-nhan-theo-context.test.tsx mong danh sách rỗng nhưng nhận về nhiều khoá). Trả về thi công.
Round 2: E1 đến E5 và E9 chạy lại, xanh; E6, E7, E7b, E8, E8u mang sang từ round 1; `cd app && npm test` nay đạt; `cd pipeline && npm test` hỏng do deadlock ở ca AC-2 của write-offers.test.mjs, không gắn eval nào. REJECT, trả về thi công.
Round 3: E1 đến E5 chạy lại, xanh; các eval còn lại mang sang; `cd pipeline && npm test` hỏng ở ca GS-AC-3a của gan-sdt-s06.test.mjs (không lấy được khoá trên public.field_assertions). REJECT ở trần ba vòng, chuyển người quyết; Mạnh chọn sửa rồi chấm thêm vòng 4.
Round 4: E1 đến E5 mang sang từ round 3, E6, E7, E7b, E8, E8u từ round 1, E9 từ round 2 (delta không chạm paths của eval nào); cả sáu lệnh suite đạt, kể cả `cd pipeline && npm test`. Hội đồng đề xuất PASS cho E10. Verdict PENDING-JUDGMENT: chờ người chốt E10 và quyết các mục ngoài hợp đồng.
