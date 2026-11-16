---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: REJECT
failed_evals: ["E7"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9d8b50a796b5065ceb0b59c6778d03d526fea8fc
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

Round 6. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations. E2, E4, E5, E6 mang từ round 5 (delta không chạm paths của các eval này).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS (carried r5) |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS (carried r5) |
| E5 | AC-5 | ui-check | PASS (carried r5) |
| E6 | AC-6 | test | PASS (carried r5) |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | judgment | UNCERTAIN |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T13:04:35Z
  output: |
    bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 8155.737375

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T10:25:09Z
  carried_from_round: 5
  output: |
    carry-forward tu round 5 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T13:04:35Z
  output: |
    bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 8155.737375

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r5
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T10:25:09Z
  carried_from_round: 5
  output: |
    carry-forward tu round 5 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-the-dia-chi-nhom-s03-E5-r5
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T10:25:09Z
  carried_from_round: 5
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
  carried_from_round: 5
  output: |
    carry-forward tu round 5 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r6
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T13:04:35Z
  output: |
    mkdir -p .acceptance-runs/the-dia-chi-nhom-s03 && node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    # Số chạy thử TG1 trên bản chép oneinvest_u1_tg1
    Chạy lúc 2026-11-16T13:23:27.835Z · 0.53 giây · ghi {"tao":0,"cap_nhat":0,"giu_da_quyet":4,"khong_doi":22}
    so_mot_du_an 13/13 · so_chua_ghi 8/8 · so_nhieu_du_an 3/3 · ngoai_so 2/2 · so_khong_bai 3/3
    nhóm có bài / số thẻ: lệnh dựng nháp 28, đếm độc lập 26
    Nhóm có từ 5 bài đọc: 24 (sàn một nửa = 12); dự án 21, phường 21, phân khu 0, bán/thuê 24
    ĐỎ: số thẻ 28 ≠ số nhóm có bài đếm độc lập 26
  Nguyên nhân: bản chép oneinvest_u1_tg1 còn 28 dòng thẻ từ lượt chụp E5 trước bản vá; ghiNhap không gỡ thẻ của nhóm không còn trong tập nháp (hai nhóm toàn bài thử). Bất biến số thẻ = số nhóm có bài vỡ trên bản chép này. Các lớp và sàn ô (21/24 dự án, 24/24 bán-thuê) đều đạt; chỉ đẳng thức số thẻ đỏ.

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T13:04:35Z
  output: |
    node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r6
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T13:04:35Z
  output: |
    bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ duration_ms 1152.95

- eval: E10
  judged_by: judge panel đề xuất (3 lens, fresh context)
  verdict: UNCERTAIN
  rationale: Hai trong ba lens không chắc ô Phường · tỉnh của thẻ đủ ô chỉ ghi «theo dự án» mà không có số bài riêng có đạt «mỗi ô ghi nguồn và số bài» hay không; lens còn lại cho là đạt vì ô suy ra từ ô dự án 47 bài. Các ô khác (dự án, phân khu, bán/thuê, ô trống) đều nêu nguồn và số bài; CONTEXT.md có mục «Thẻ địa chỉ nhóm» đủ nhãn, mã, định nghĩa, slug.
  votes:
    - domain-correctness: UNCERTAIN — ô phường chỉ ghi «theo dự án», người duyệt phải tự suy ra số bài là 47 của ô dự án.
    - operational-feasibility: UNCERTAIN — chưa có hợp đồng trong input để xác nhận cách đọc «theo dự án» là đủ căn cứ.
    - spec-alignment: PASS — ô phường lấy từ ô dự án 47 bài nên căn cứ gián tiếp đã nêu.
  required_evidence:
    - Ảnh hộp duyệt chụp lại, ô Phường · tỉnh ghi số bài căn cứ, ví dụ «theo dự án (47 bài)», từ /ops/group-cards mở thẻ TN-120, lưu vào _acceptance/the-dia-chi-nhom-s03/evidence/.
    - Hoặc câu trong contract.md (AC-10) chốt rằng nhãn «theo dự án» đã đủ chỉ nguồn và số bài của ô phường, rồi đưa contract vào Input của eval E10.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r6
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r6
  exit_code: 2
  verified_at: 2026-11-16T13:04:35Z
  ghi chú: lệnh không gắn eval nào. Lỗi tsc là TS2304 «Cannot find name 'LayoutProps'» và «'PageProps'» ở src/app/(app)/layout.tsx, (auth)/layout.tsx, (marketing)/layout.tsx, layout.tsx, ops/layout.tsx, ops/data-flow/page.tsx. Đây là kiểu toàn cục do Next sinh; không liên quan tới tệp của feature này.

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r6
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

- cmd: cd pipeline && npm run test:a
  run_id: bxd3aumq3
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r6
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r6
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r6
  exit_code: 0
  verified_at: 2026-11-16T13:04:35Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay.

Eval không phân biệt (xanh cả HEAD lẫn baseline): không có.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 5: REJECT — AC-7, lệnh dựng nháp chưa gạt bài thử như mọi transform đọc stg; sửa ở commit 1eccf666.
Round 6: E7 đỏ — số thẻ trên bản chép oneinvest_u1_tg1 (28) lệch số nhóm có bài đếm độc lập (26) vì thẻ cũ của hai nhóm toàn bài thử còn nằm lại; ghiNhap không gỡ thẻ mồ côi. Trả về implementation: dựng lại bản chép hoặc xử lý thẻ mồ côi, chụp lại loạt E5 trên cùng sha.
