---
schema_version: 2
feature_slug: hieu-chuan-mot-bo-so
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3e89ba9fa76d37c79124676ffa1492be362ba7f1
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: hieu-chuan-mot-bo-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | judgment | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-hieu-chuan-mot-bo-so-E1-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-hieu-chuan-mot-bo-so-E2-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-hieu-chuan-mot-bo-so-E3-r2
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-hieu-chuan-mot-bo-so-E4-r2
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  carried_from_round: 2
  # carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-hieu-chuan-mot-bo-so-E5-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-hieu-chuan-mot-bo-so-E6-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-hieu-chuan-mot-bo-so-E7-r1
  exit_code: 0
  verifier: config:executors.script.hieu_chuan_do
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  judged_by: judge-subagent (fresh context)
  verdict: PASS
  rationale: Panel giu nguyen tu round 2 — inputs khong doi, khong cham lai; rationale xem round do. Ba judge (domain-correctness, operational-feasibility, spec-alignment) deu PASS (r2).
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-hieu-chuan-mot-bo-so-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T00:49:00Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 87.198208

- eval: E10
  run_id: minted-hieu-chuan-mot-bo-so-E10-r4
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-10-25T00:49:00Z
  screenshot: evidence/E10-sang-1440.png
  observed: |
    Đã mở từng ảnh bằng Read, cắt đoạn bằng sharp vì ảnh cao 16000px.

    E10-sang-1440.png (sáng, 1440): đã đăng nhập, thấy shell Vận hành, mục nav «Chất lượng dữ liệu» đang chọn. Tiêu đề «Chất lượng dữ liệu» kèm ba nhãn «13 kiểm», «46 đối tượng», «25 thị trường hiệu chuẩn». Có bốn thẻ KPI (160 / 338; 350; 16.378; 53), bảng «Kiểm chất lượng (7 ngày)», bảng «Độ phủ trung thực» với chú thích «Listing tự thu: số listing đang theo dõi trong cả khu vực…». Có các thẻ «Hiệu chuẩn — <khu vực>» (Bắc Ninh, Cần Thơ, Hà Nội, Hồ Chí Minh, Đà Nẵng, Đồng Nai, An Giang, Cao Bằng, Gia Lai, Khánh Hòa, Lai Châu, Lào Cai, Lâm Đồng, Sơn La, Thanh Hóa, Tuyên Quang, Đắk Lắk, Đồng Tháp…), mỗi thẻ có câu định nghĩa «Listing tự thu: …». Một số thẻ có nhãn «đại diện cho N thị trường S02 · Hiệu chuẩn». Không thẻ nào có nhãn «mẫu mỏng». Cuối vùng có dòng «Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh», rồi bảng «Thị trường S02 · Hiệu chuẩn toàn quốc». Không có trang /login. Chữ đọc được, không đè nhau, bảng cuộn ngang chỉ trong khung của nó.

    E10-toi-1440.png (tối, 1440): cùng bố cục, nền tối. Đầu trang có «25 thị trường hiệu chuẩn». Thẻ Bắc Ninh, Cần Thơ, Hà Nội có câu «Listing tự thu: …». Dòng «Chưa có số: Huế, Hải Phòng, …, Tây Ninh» có mặt. Chữ sáng trên nền tối đọc rõ, nhãn «Lệch» màu vàng đọc được, không đè nhau. Không có nhãn «mẫu mỏng». Không phải trang đăng nhập.

    E10-sang-390.png (sáng, 390): shell thu gọn, tiêu đề, ba nhãn gồm «25 thị trường hiệu chuẩn», bốn thẻ KPI xếp dọc. Các thẻ Hiệu chuẩn (Cần Thơ, Hà Nội, Hồ Chí Minh, Điện Biên, Đắk Lắk, Đồng Tháp…) có câu định nghĩa «Listing tự thu: …», chữ xuống dòng gọn. Bảng trong thẻ cuộn ngang trong khung riêng (thanh cuộn, cột «S02» bị cắt trong khung), theo thiết kế. Trang không cuộn ngang, đo s=c=390. Có dòng «Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh», rồi bảng «Thị trường S02 · Hiệu chuẩn toàn quốc». Dưới nội dung (khoảng y 13.6k đến 16000) là vùng trắng, chỉ có nút Next dev ở góc. Không đè chữ, không có trang đăng nhập.

    Đối chiếu Expected: khớp ở cả ba frame. Hạn chế: ảnh 390 chụp ở chiều cao 16000 thay vì 40000 vì 40000 và 30000 làm trình duyệt lỗi chụp; nội dung vẫn nằm gọn trong 16000.
  network_observed: n-a (driver)
  output: |
    Ảnh đối chứng dương (ngoài evidence): /private/tmp/claude-503/-Users-manhphan-dev-onehub-invest/f5659470-ffbb-4423-b6b1-543a3f321f33/scratchpad/e10-probe.png
    Server: dùng chung cổng 3462 có sẵn, không tắt.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

- cmd: cd app && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

- cmd: cd pipeline && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-10-25T00:49:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval nào được đo là xanh trên cả HEAD lẫn baseline (không có eval không-phân-biệt).

### Baseline khong do

- node --test scripts/ui-capture-login.test.mjs: bo qua baseline: tep scripts/ui-capture-login.test.mjs co o cay dang kiem nhung chua co o merge-base 9146509944a827e0b4a42306c4cdbbec3a654be8 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lượt, xác định).

## Iterations

Round 1: E1, E2, E5, E6, E7 pass (mang tiếp sang các vòng sau).
Round 2: E3, E4 pass sau khi chạy lại (mang tiếp).
Round 3: REJECT — phép đo bề rộng trang của AC-10 hằng đúng trên khung Ops (ba finding AC-10); chạm trần 3 lượt, đã được người duyệt mở tiếp.
Round 4: E9 và E10 chạy lại trên commit 2b55953 (đo bề rộng vùng cuộn thân trang kèm đối chứng dương); các eval máy đều xanh, E8 giữ panel từ round 2. Verdict PASS.

### Re-pin lần 1 — 2026-10-25, do gộp main 1de42b8 (ON13 đổi thứ tự cột bảng Độ phủ) sau chữ ký
run_id: repin-20261025T012735Z-77544
sha: 3e89ba9fa76d37c79124676ffa1492be362ba7f1 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng · ngoài làn máy: E8, E10 · diff chạm vật đo ngoài làn máy: E10 — chưa chứng lại, đi vòng S4 delta · AC không có chốt máy: AC-8, AC-10
