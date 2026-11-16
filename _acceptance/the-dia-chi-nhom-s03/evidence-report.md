---
schema_version: 2
feature_slug: the-dia-chi-nhom-s03
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2f8435e3d8a80cf2e5599a14dbcb5d20835106a2
human_signoff:
---

# Evidence Report: the-dia-chi-nhom-s03

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
| E10 | AC-10 | judgment | đề xuất PASS, chờ người chốt ở Cổng 2 |

## Evidence

- eval: E1
  run_id: minted-the-dia-chi-nhom-s03-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 6681.532833

- eval: E2
  run_id: minted-the-dia-chi-nhom-s03-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_unit
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: node --test pipeline/tests/the-dia-chi-nhom.test.mjs
    ℹ duration_ms 42.548958

- eval: E3
  run_id: minted-the-dia-chi-nhom-s03-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_db
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1 --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom.itest.mjs
    ℹ duration_ms 6681.532833

- eval: E4
  run_id: minted-the-dia-chi-nhom-s03-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10602.232083

- eval: E5
  run_id: E5-20261116-r6
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-11-16T06:04:17Z
  screenshot: evidence/E5-step1.png
  observed: |
    E5-step1: 1280px sáng, breadcrumb Vận hành › Thẻ địa chỉ nhóm, chip «28 nhóm có thẻ» «28 chờ duyệt», bảng cột Nhóm/Thẻ/Dự án/Phường·tỉnh/Phân khu/Bán-thuê/Bài đã đọc, mọi hàng badge Nháp vàng, nút Duyệt thẻ; email thanh bên «•••@•••». E5-step1-cuoi: hai hàng mờ «Chưa có trong sổ» TN-004 (0) và TN-006 (5) ở cuối, đều Nháp. E5-step2: hộp «Duyệt thẻ TN-008» Nháp, Dự án chip Vinhomes Grand Park + «từ bài đã đọc, 47 bài»; Phường Long Bình · TP HCM «theo dự án»; Phân khu «Chưa đủ căn cứ (1.408 bài đã đọc)»; Bán hay thuê Thuê «từ bài đã đọc: 254 bán, 1.033 thuê»; ô Lý do; nút Bác, Nhận. E5-step3: hộp đóng, header «27 chờ duyệt», hàng TN-008 badge xanh Đã duyệt, toast «Đã duyệt thẻ TN-008». E5-step4: TN-010 badge Đã duyệt, Bán/thuê «Thuê», toast «Đã duyệt thẻ TN-010» (frame cuộn xuống, không thấy header; đếm 26 lấy từ DOM). E5-step5-loi: TN-015 Lý do «ab», nút Bác mờ (disabled), dòng «bác thẻ cần lý do từ 3 ký tự». E5-step5: TN-015 badge đỏ Bác, header «24 chờ duyệt», toast «Đã bác thẻ TN-015». E5-step-o-trong: TN-005 1 bài, ô Chọn dự án/Chọn phường/Để trống, mỗi ô «Chưa đủ căn cứ (1 bài đã đọc)», phân khu «Dự án đã chọn chưa có phân khu». E5-step-409: TN-022 Nháp, chữ «Chữ tab A đã nhập dở» còn, Alert đỏ «Thẻ đã đổi từ lúc anh mở — tải lại thẻ rồi làm lại» + nút «Tải lại thẻ». E5-step-409-tai-lai: badge thành Đã duyệt, Alert hết, nhưng Bán/thuê vẫn Thuê và chữ dở còn. E5-step-viewer: «Xem thẻ TN-025», phường/phân khu/bán-thuê xám, chỉ nút Đóng, không Nhận/Lưu sửa/Bác. E5-step6 (375): không tràn ngang, bảng cuộn trong khung, chip header xuống dòng. E5-step6-hop: hộp thẻ TN-020 vừa 343px, nút Nhận/Bác xếp dọc đáy. Tất cả khớp Expected, kèm các lưu ý trong output.
  network_observed: clean   # raw statuses live in evidence/E5-network.txt
  output: |
    Các khẳng định A1–A12 đạt: trang 200 vai ops; header 28 nhóm có thẻ khớp số lệnh dựng nháp và DB; 28 hàng badge Nháp; nhóm chưa có trong sổ ở cuối; hộp TN-008 có bốn ô kèm căn cứ; Nhận, Lưu sửa, Bác đổi badge và bộ đếm 28→27→26→24; Bác không lý do hoặc 2 ký tự bị chặn bằng nút disabled, DB giữ nguyên; ô trống TN-005 nói vì sao; tab A lưu khi thẻ đã đổi ở tab B hiện lỗi 409, giữ chữ ở ô Lý do, có nút «Tải lại thẻ», DB không thêm dòng; viewer chỉ có «Xem thẻ»/«Đóng»; 375px không tràn ngang; email thanh bên che.
    Lưu ý, không làm đỏ vì ngoài Expected: (1) Bác không lý do bị chặn bằng nút disabled và dòng gợi ý cố định, không có thông báo lỗi như step mô tả. (2) Sau «Tải lại thẻ» ở TN-022 badge thành Đã duyệt nhưng ô Bán/thuê vẫn «Thuê» và Lý do còn chữ dở, trong khi DB là ca_hai: form có vẻ giữ giá trị người dùng chứ không nạp lại từ thẻ mới. (3) Viewer: ô Dự án vẫn nhận focus và gõ lọc, chưa disabled. (4) Mạng: không có lỗi máy chủ hay lỗi kết nối; chỉ POST bị từ chối do thẻ đã đổi (Expected có khai) và vài prefetch bị huỷ phía client. Console có 4 cảnh báo preload, không có lỗi trang.
    Frames: E5-step1.png, E5-step1-cuoi.png, E5-step2.png, E5-step3.png, E5-step4.png, E5-step5-loi.png, E5-step5.png, E5-step-o-trong.png, E5-step-409.png, E5-step-409-tai-lai.png, E5-step-viewer.png, E5-step6.png, E5-step6-hop.png. E5-step4-truoc-luu.png là ảnh cũ chưa chụp lại.

- eval: E6
  run_id: minted-the-dia-chi-nhom-s03-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_app
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_tg1a --chay node --import tsx --test --test-concurrency=1 tests/the-dia-chi-nhom-app.itest.tsx
    ℹ duration_ms 10602.232083

- eval: E7
  run_id: minted-the-dia-chi-nhom-s03-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_dem
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --dem --ghi .acceptance-runs/the-dia-chi-nhom-s03/so-chay-thu.md
    **ĐẠT**

- eval: E8
  run_id: minted-the-dia-chi-nhom-s03-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg1_that_chat_luong
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: node pipeline/scripts/the-dia-chi-nhom-that.mjs --chat-luong
    khớp 12/13 (đạt khi từ 9)

- eval: E9
  run_id: minted-the-dia-chi-nhom-s03-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg1_lui
  verified_at: 2026-11-16T06:04:17Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_tg1l --chay node --test --test-concurrency=1 pipeline/tests/the-dia-chi-nhom-lui.itest.mjs
    ℹ duration_ms 235.596583

- eval: E10
  judged_by: hội đồng ba lăng kính (carried từ round 2 — inputs không đổi, không chấm lại)
  verdict: PASS (đề xuất của máy, chưa phải kết luận)
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2. Phiếu - domain-correctness: PASS (r2); operational-feasibility: PASS (r2); spec-alignment: PASS (r2).
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-dia-chi-nhom-s03-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: cd app && npm test
  run_id: minted-the-dia-chi-nhom-s03-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-dia-chi-nhom-s03-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-dia-chi-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-16T06:04:17Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Field baseline cua tung eval ghi n-a.

Không có eval nào bị liệt kê là không-phân-biệt. Các lệnh suite xanh cả hai phía là regression-guard bình thường.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: baseline đo một lần; evals.yaml không đổi từ đó.
Round 2: S4 thử lại, chỉ còn deadlock bộ agent ngoài vùng (đã sửa bằng chạy tuần tự).
Round 3: toàn bộ eval máy và E5 giao diện xanh trên cây 2f8435e3; còn E10 chờ người chốt ở Cổng 2 và một phát hiện trong hợp đồng (AC-6, xem review-findings.md) để người cân nhắc, nên verdict là PENDING-JUDGMENT.
