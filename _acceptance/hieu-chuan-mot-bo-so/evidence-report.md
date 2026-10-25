---
schema_version: 2
feature_slug: hieu-chuan-mot-bo-so
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f24814a6d17e2099b1e588e10c4205a841558a52
human_signoff:
---

# Evidence Report: hieu-chuan-mot-bo-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (carry-forward tu round 1) |
| E2 | AC-2 | test | PASS (carry-forward tu round 1) |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS (carry-forward tu round 1) |
| E6 | AC-6 | test | PASS (carry-forward tu round 1) |
| E7 | AC-7 | script | PASS (carry-forward tu round 1) |
| E8 | AC-9 | judgment | PASS (de xuat cua hoi dong, cho human_override) |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | FAIL |

Ghi chu bang: E8 thuoc tieu chi AC-8 (dong E8 o tren ghi nham cot Criterion se duoc doc theo dinh nghia eval: E8 = AC-8).

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
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  output: |
    ℹ duration_ms 11789.468875

- eval: E4
  run_id: minted-hieu-chuan-mot-bo-so-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  output: |
    ℹ duration_ms 11789.468875

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
  judged_by: hoi dong 3 lens (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: CONTEXT.md co du ba muc «Listing tự thu», «Mẫu mỏng», «Thị trường hiệu chuẩn», moi muc co nhan, dong Code, dinh nghia va _Avoid_; nghia khop ba cau da chot. Day la de xuat cua hoi dong, nguoi quyet o Cong 2.
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-hieu-chuan-mot-bo-so-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T00:17:01Z
  output: |
    ℹ duration_ms 85.987042

- eval: E10
  run_id: minted-hieu-chuan-mot-bo-so-E10-r2
  exit_code: 1
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-10-25T00:17:01Z
  screenshot: evidence/E10-sang-1440.png
  observed: |
    E10-sang-1440.png (đã mở bằng cách cắt từng đoạn): đã đăng nhập, thấy shell ops với sidebar. Đầu trang có 'Chất lượng dữ liệu' cùng ba huy hiệu '13 kiểm', '46 đối tượng', '25 thị trường hiệu chuẩn'. Có bảng Độ phủ trung thực (chú thích 'Listing tự thu: số listing đang theo dõi trong cả khu vực (gồm phường con)…'), rồi các thẻ 'Hiệu chuẩn — Bắc Ninh / Cần Thơ / Hà Nội / Hồ Chí Minh…', mỗi thẻ có chú thích 'Listing tự thu: …'. Cuối vùng có dòng 'Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh', tiếp theo là bảng 'Thị trường S02 · Hiệu chuẩn toàn quốc'. Không thẻ nào có nhãn 'mẫu mỏng'; chỉ có huy hiệu 'đại diện cho N thị trường', ngày và 'Lệch'. Không chữ hay khối đè nhau. Cả bốn cột (Chỉ số, Tự thu, S02, Tỉ lệ) đều đủ.

    E10-toi-1440.png: nền tối, cùng bố cục và cùng nội dung. Thấy '25 thị trường hiệu chuẩn', chú thích 'Listing tự thu…' và dòng 'Chưa có số: …' đủ 9 tên. Chữ sáng trên nền tối, đọc rõ, huy hiệu 'Lệch' vàng đọc được. Không đè nhau, không có nhãn 'mẫu mỏng'.

    E10-sang-390.png: đã đăng nhập, bố cục một cột. Đầu trang có huy hiệu '25 thị trường hiệu chuẩn' và các thẻ 'Hiệu chuẩn — …' có câu 'Listing tự thu: …'. Dòng 'Chưa có số: Huế, Hải Phòng, Quảng Ninh, Cà Mau, Hà Tĩnh, Hưng Yên, Ninh Bình, Thái Nguyên, Tây Ninh' có ở cuối vùng. Không có nhãn 'mẫu mỏng'. Nhưng bảng trong mỗi thẻ có thanh cuộn ngang riêng, chỉ thấy Chỉ số và Tự thu, cột S02 và Tỉ lệ bị cắt và 'S02' lòi nửa chữ ở mép. Bảng Độ phủ trung thực và bảng toàn quốc cũng bị cắt cột. Thanh cuộn nằm sát chữ 'Listing' ở hàng cuối của mỗi thẻ. Điều này mâu thuẫn với expected 'ở 390 không cuộn ngang' nên tôi chấm FAIL.
  network_observed: n-a (driver)
  output: |
    Ba frame chup bang scripts/ui-capture.sh: evidence/E10-sang-1440.png, evidence/E10-toi-1440.png, evidence/E10-sang-390.png (390 chup o chieu cao 16000 vi 40000 khong chup duoc).
    Phep do E7 trong luot nay: 25 thi truong hieu chuan, chua co so (9): Hue, Hai Phong, Quang Ninh, Ca Mau, Ha Tinh, Hung Yen, Ninh Binh, Thai Nguyen, Tay Ninh; mau mong: khong co.
    Dat: khong frame nao la trang /login; dau trang «25 thị trường hiệu chuẩn» khop E7; cau dinh nghia «Listing tự thu» co o moi the va chu thich bang Do phu; dong «Chưa có số: …» 9 ten khop E7; khong the nao mang nhan «mẫu mỏng»; ui-capture.sh bao «tầng A: đã che 0» o ca 3 lan; che do toi doc duoc, khong de nhau o 1440.
    Khong dat: «ở 390 không cuộn ngang» — moi the Hieu chuan o 390 co thanh cuon ngang rieng, cot S02 va Ti le bi cat; bang Do phu trung thuc cung bi cat.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T00:17:01Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T00:17:01Z

- cmd: cd pipeline && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T00:17:01Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T00:17:01Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T00:17:01Z

### Hoi dong cham E8 (de xuat, human_override de trong)

Panel de xuat: PASS. Nguoi quyet o Cong 2.

- domain-correctness: PASS — CONTEXT.md co du ba muc (dong 329, 333, 337), moi muc co nhan, dong Code, RESO va _Avoid_, cung dinh dang voi cac muc ke ben. «Listing tự thu» la so listing dang theo doi trong ca khu vuc gom phuong con; «Mẫu mỏng» la co mau duoi nguong 5 listing (hang MAU_MONG_DUOI); «Thị trường hiệu chuẩn» la thi truong co it nhat mot so, phan con lai gop vao dong «Chưa có số: …».
- operational-feasibility: PASS — CONTEXT.md (dong 329-339) co du ba muc, moi muc co nhan in dam, dong Code (ourListings, isThin, splitCalibrated), dinh nghia va _Avoid_. Nghia khop ba cau hoi da chot.
- spec-alignment: PASS — CONTEXT.md (dong 329-339) co du ba muc, moi muc co nhan, dinh nghia, dong Code va _Avoid_. Nghia khop ba cau hoi da chot.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval khong-phan-biet (xanh tren ca HEAD lan baseline, chung minh harness chu khong phai feature; viet lai de assert hanh vi moi hoac xac nhan la regression-guard co chu y): lenh `cd app && npm test` gom E3, E4.

Baseline khong do:
- node --test scripts/ui-capture-login.test.mjs: bo qua baseline: tep scripts/ui-capture-login.test.mjs co o cay dang kiem nhung chua co o merge-base 9146509944a827e0b4a42306c4cdbbec3a654be8 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9, E10 va lenh suite `cd pipeline && npm test` do — verdict REJECT. Returned to implementation (commit f24814a: loi vao realpath, cot bang Do phu khong de chu, E9 chay dung tep).
Round 2: E10 failed — o 390 moi the «Hiệu chuẩn — …» va bang Do phu trung thuc co thanh cuon ngang rieng, cot S02 va Ti le bi cat, mau thuan voi «o 390 khong cuon ngang»; E9, E3, E4 va moi lenh suite xanh; E1, E2, E5, E6, E7 carry-forward tu round 1. Lenh do khong gan eval khac: ui-check:E10 (chi gan E10). Returned to implementation.
