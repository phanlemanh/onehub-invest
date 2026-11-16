---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9475a2fb547bd65424f5837e3ca6ff6eec8490d4
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Round 5. Nội dung thay toàn bộ round cũ; lịch sử các round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | ui-check | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | judgment | UNCERTAIN |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 8411.243833

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: node --test pipeline/tests/the-dia-chi-nhom.test.mjs
    ℹ duration_ms 43.275417

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 8411.243833

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10883.527834

- eval: E5
  run_id: minted-the-dia-chi-nhom-s03-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T10:25:09Z
  screenshot: evidence/E5-step1.png
  observed: |
    E5-step1.png (1280px, co CSS): tieu de 'The dia chi nhom', hai badge '28 nhom co the' va '28 cho duyet' khop 28 cua lenh dung nhap; bang cot Nhom/The/Du an/Phuong-tinh/Phan khu/Ban-thue/Bai da doc, moi hang badge vang 'Nhap'; cuon trong khung nen anh chi thay 11 hang dau. E5-step1-cuoi.png: hai hang cuoi 'Chua co trong so' TN-116 (0 bai) va TN-118 (5 bai, Ban), the xam.
    E5-step2.png: hop 'Duyet the TN-120 Nhap' cho S03-N002, bon o Du an (chip Vinhomes Grand Park, 'tu bai da doc, 47 bai'), Phuong-tinh (Long Binh, 'theo du an'), Phan khu ('Chua du can cu (1.408 bai da doc)'), Ban hay thue (Thue, 'tu bai da doc: 254 ban, 1.033 thue'), o Ly do, nut Bac (xam) va Nhan. E5-step3.png: sau Nhan, hang TN-120 badge xanh 'Da duyet', dau trang '27 cho duyet', toast 'Da duyet the TN-120'. E5-step4.png: TN-124 (N004) badge 'Da duyet', ban/thue 'Thue', bo dem 26 (E5-step4-truoc.png hien nut 'Luu sua' sau khi doi o).
    E5-step5-khong-ly-do.png: hop TN-122, Bac mo xam (disabled), khong thong bao loi, chi dong goi y 'bac the can ly do tu 3 ky tu'; E5-step5.png: TN-122 badge do 'Bac', toast 'Da bac the TN-122'. E5-step-o-trong.png: TN-117 (1 bai): Du an 'Chon du an', Phuong 'Chon phuong', Ban hay thue 'De trong', moi o kem 'Chua du can cu (1 bai da doc)', Phan khu 'Du an da chon chua co phan khu'. E5-step-409.png: hop TN-126, o Ly do con 'Chu da nhap o tab dau', Alert do 'The da doi tu luc anh mo' + 'the da doi tu luc anh mo - tai lai the roi lam lai', nut 'Tai lai the', Bac, Luu sua. E5-step-viewer.png: 'Xem the TN-139', cac o select mo xam, chi nut 'Dong'. E5-step6.png (375px): tieu de, hai badge, bang the voi cot bi cat trong khung cuon ngang cua the, khong tran trang. Email thanh ben che den trong moi anh.
    Doi chieu Expected: dat het; luu y nho (a) Bac khong ly do bi chan bang nut vo hieu, khong co thong bao loi; (b) Alert 409 lap y hai lan.
  network_observed: clean

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10883.527834

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: mkdir -p .acceptance-runs/the-dia-chi-nhom-s03 && node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    **ĐẠT**

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T10:25:09Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ duration_ms 207.592416

- eval: E10
  judged_by: hội đồng đề xuất (fresh context), người quyết ở Cổng 2
  verdict: UNCERTAIN
  rationale: Đề xuất của hội đồng là PASS nhưng một phiếu chưa chắc nên chưa tự chốt; ô Phường · tỉnh của thẻ đủ ô chỉ ghi «theo dự án», không có số bài.
  required_evidence:
    - Văn bản AC-10 trong contract.md (hoặc một dòng chốt của người ký) nói ô suy ra từ dự án như Phường · tỉnh («theo dự án») được miễn ghi số bài
    - Hoặc ảnh chụp lại hộp thẻ đủ ô (thẻ TN-008, ghi vào evidence/E5-step2.png) trong đó ô Phường · tỉnh ghi số bài làm căn cứ, ví dụ «theo dự án, 47 bài»
  human_override:  # chi nguoi ghi

Phiếu từng lens (đề xuất, chưa có người chốt):

- domain-correctness: PASS — Thẻ đủ ô (TN-008) ghi nguồn và số bài cho từng ô: dự án «từ bài đã đọc, 47 bài», phường «theo dự án», phân khu «Chưa đủ căn cứ (1.408 bài đã đọc)», bán/thuê «254 bán, 1.033 thuê». Thẻ ô trống (TN-005) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» với nhãn, định nghĩa (ghi nguồn và số bài căn cứ), mã `group_address_card` và `TN-001`, slug `group-cards`.
- operational-feasibility: UNCERTAIN — Hộp duyệt thẻ đủ ô ghi rõ nguồn và số bài cho dự án và bán/thuê. Riêng ô Phường · tỉnh chỉ ghi «theo dự án», không có số bài, và ô Phân khu chỉ ghi «Chưa đủ căn cứ (1.408 bài đã đọc)» mà không nói nguồn. Mục «Thẻ địa chỉ nhóm» trong CONTEXT.md đủ nhãn, mã, slug và định nghĩa. Chỉ riêng ô phường chưa rõ là đạt hay không.
- spec-alignment: PASS — Ảnh thẻ đủ ô (TN-008) hiện nguồn và số bài ở từng ô: dự án «từ bài đã đọc, 47 bài», phường·tỉnh «theo dự án», bán/thuê «từ bài đã đọc: 254 bán, 1.033 thuê», phân khu «Chưa đủ căn cứ (1.408 bài)». Thẻ ô trống (TN-005) ghi «Chưa đủ căn cứ (1 bài đã đọc)» ở cả bốn ô. CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, mã `group_address_card`, slug `group-cards`, định nghĩa và _Avoid_.

Đề xuất tổng: PASS (hai phiếu PASS, một phiếu UNCERTAIN). Dissent hiển thị đầy đủ ở trên; để human_override trống cho người quyết ở Cổng 2.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r5
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r5
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r5
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: cd pipeline && npm run test:a
  run_id: blg7ztive
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: cd pipeline && npm run test:b
  run_id: bxqc5lnb6
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r5
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r5
  exit_code: 0
  verified_at: 2026-11-16T10:25:09Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tự round 1 — baseline không đo lại round này (evals.yaml không đổi từ lần đo baseline cuối). Trường baseline của từng eval ghi n-a.

Không có eval nào bị liệt kê là không-phân-biệt.

## Variance

none — mọi eval chạy một lần, xác định, đều đồng nhất.

## Iterations

Round 5: không eval máy nào hỏng; verdict REJECT do review còn một lỗi trong hợp đồng (AC-7: lệnh dựng nháp không gạt bài thử nên đếm 28 nhóm thay vì 27 nhóm thật) và E10 còn một phiếu chưa chắc về dòng căn cứ ô Phường · tỉnh. Chi tiết ở review-findings.md. Trả về triển khai.
