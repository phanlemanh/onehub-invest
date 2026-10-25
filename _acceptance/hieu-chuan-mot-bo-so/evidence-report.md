---
schema_version: 2
feature_slug: hieu-chuan-mot-bo-so
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2cf2cd328ee393995c2c8c39b9ffdd05ea29e210
human_signoff:
---

# Evidence Report: hieu-chuan-mot-bo-so

Round 3. Mọi eval máy đều xanh (E1–E7 và E8 mang từ round trước; E9, E10 chạy lại ở round này), nhưng review còn ba finding TRONG hợp đồng chống lại AC-10 (phép đo «bề rộng trang» trên /ops luôn ra bằng bề rộng khung, nên điều kiện «390 không cuộn ngang» của E10 chưa được chứng minh thật). Vì vậy verdict là REJECT, danh sách eval đỏ để trống. Chi tiết xem review-findings.md.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS (mang từ round 1) |
| E2 | AC-2 | test | PASS (mang từ round 1) |
| E3 | AC-3 | test | PASS (mang từ round 2) |
| E4 | AC-4 | test | PASS (mang từ round 2) |
| E5 | AC-5 | test | PASS (mang từ round 1) |
| E6 | AC-6 | test | PASS (mang từ round 1) |
| E7 | AC-7 | script | PASS (mang từ round 1) |
| E8 | AC-8 | judgment | PASS (đề xuất của hội đồng, chưa người chốt) |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS (máy đo; xem finding AC-10 trong review-findings.md) |

## Evidence

- eval: E1
  run_id: minted-hieu-chuan-mot-bo-so-E1-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-hieu-chuan-mot-bo-so-E2-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-hieu-chuan-mot-bo-so-E3-r2
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-hieu-chuan-mot-bo-so-E4-r2
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:17:01Z
  carried_from_round: 2
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-hieu-chuan-mot-bo-so-E5-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-hieu-chuan-mot-bo-so-E6-r1
  exit_code: 0
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-hieu-chuan-mot-bo-so-E7-r1
  exit_code: 0
  verifier: config:executors.script.hieu_chuan_do
  verified_at: 2026-10-25T00:08:38Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E8
  judged_by: hội đồng ba lens (đề xuất; panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2)
  verdict: PASS
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  human_override:  # chi nguoi ghi

- eval: E9
  run_id: minted-hieu-chuan-mot-bo-so-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_capture_login
  verified_at: 2026-10-25T00:23:29Z
  output: |
    node --test scripts/ui-capture-login.test.mjs
    ℹ duration_ms 72.140875

- eval: E10
  run_id: minted-hieu-chuan-mot-bo-so-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start
  verified_at: 2026-10-25T00:23:29Z
  screenshot: evidence/E10-sang-1440.png
  observed: |
    E10-sang-1440.png: da dang nhap (sidebar Van hanh/Cong noi bo, muc 'Chat luong du lieu' sang, breadcrumb, nut 'Chep lien ket'). Dau trang: tieu de 'Chat luong du lieu' + chip '13 kiem', '46 doi tuong', '25 thi truong hieu chuan'; 4 the KPI (160/338, 350, 16.378, 53); bang 'Kiem chat luong (7 ngay)' va 'Do phu trung thuc'. Duoi la 25 the 'Hieu chuan — <thi truong>' (Bac Ninh ... Dong Thap), moi the co dong 'Diem S02 · ...', bang Chi so/Tu thu/S02 · Hieu chuan (12 thang qua)/Ti le, badge 'x.xx× · Lech' mau vang, badge 'dai dien cho N thi truong S02 · Hieu chuan', ngay thu, va cau dinh nghia 'Listing tu thu: so listing dang theo doi trong ca khu vuc (gom phuong con). ADR, cong suat tu thu = ...'. Sau the cuoi co dong 'Chua co so: Hue, Hai Phong, Quang Ninh, Ca Mau, Ha Tinh, Hung Yen, Ninh Binh, Thai Nguyen, Tay Ninh', roi bang 'Thi truong S02 · Hieu chuan toan quoc' (1–25/43) co chu thich 'Listing tu thu: ...'. Khong co nhan 'mau mong' o the nao. Khong chu/khoi de nhau.
    E10-toi-1440.png: cung bo cuc nen toi; chip '25 thi truong hieu chuan' o dau trang; cac the Hieu chuan, cau 'Listing tu thu: ...', dong 'Chua co so: ...' (cung 9 ten), badge Lech vang tren nen toi doc ro; chu sang tren nen toi doc duoc, khong de nhau; khong nhan 'mau mong'.
    E10-sang-390.png: bo cuc 1 cot, chip '25 thi truong hieu chuan' o dau trang, the Hieu chuan xep doc (tieu de, diem, badge 'dai dien cho...', ngay thu xuong dong rieng), cau 'Listing tu thu: ...' wrap tot, dong 'Chua co so: Hue, Hai Phong, ...' wrap 2 dong, bang S02 toan quoc o cuoi. Trong bang trong the, cot S02 · Hieu chuan va Ti le bi cat ben phai (cuon ngang trong khung data-grid — thiet ke cho phep) va thanh cuon xam nho nam duoi dong 'Listing' nhung khong de len chu. Khong cuon ngang cap trang (trang 390 = khung 390). Khong nhan 'mau mong'.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

- cmd: cd app && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

- cmd: cd pipeline && npm test
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-hieu-chuan-mot-bo-so-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-25T00:23:29Z

### Hội đồng chấm E8 (đề xuất)

Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2. Đề xuất chung: PASS. human_override để trống cho người quyết ở Cổng 2.

- domain-correctness: PASS (r2)
- operational-feasibility: PASS (r2)
- spec-alignment: PASS (r2)

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

### Baseline khong do

- node --test scripts/ui-capture-login.test.mjs: bo qua baseline: tep scripts/ui-capture-login.test.mjs co o cay dang kiem nhung chua co o merge-base 9146509944a827e0b4a42306c4cdbbec3a654be8 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E3, E4 được chạy lại ở round 2 (mã r2); lệnh suite của pipeline chưa xanh ở round 1. Trả về triển khai.
Round 2: E10 bắt được thẻ Hiệu chuẩn và bảng Độ phủ cuộn ngang ở 390; sửa bước chụp (ui-capture) để in bề rộng khung/trang. Trả về triển khai.
Round 3: E9 và E10 xanh, toàn bộ suite xanh, nhưng review còn ba finding TRONG hợp đồng cho AC-10 (phép đo document.scrollWidth trên /ops luôn bằng bề rộng khung nên điều kiện «390 không cuộn ngang» không kiểm được gì). Sau round 3 → leo thang cho người, verdict REJECT. Mốc giờ của E9, E10 và các lệnh suite round 3 chỉ có ngày vì máy chưa cấp giờ chạy; main loop có thể đóng dấu giờ khi ghi run-log.
