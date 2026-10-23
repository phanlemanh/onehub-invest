---
schema_version: 2
feature_slug: ui-clean-b3-charts
verdict: PASS
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b309c4ad4c2a1b86825d8ea717ba685ae262a45b
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: ui-clean-b3-charts

Round 3. Nội dung thay trọn round cũ; lịch sử nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS (carry-forward từ round 1) |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-1 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-9 | ui-check | PASS |
| E14 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ui-clean-b3-charts-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_palette
  verified_at: 2026-10-23T00:31:34Z
  output: |
    palette: ĐẠT

- eval: E2
  run_id: minted-ui-clean-b3-charts-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_contrast
  verified_at: 2026-10-23T00:31:34Z
  output: |
    contrast: ĐẠT

- eval: E3
  run_id: minted-ui-clean-b3-charts-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_data_color
  verified_at: 2026-10-23T00:31:34Z
  output: |
    data-color: ĐẠT

- eval: E4
  run_id: minted-ui-clean-b3-charts-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_duplicates
  verified_at: 2026-10-23T00:31:34Z
  output: |
    duplicates: ĐẠT

- eval: E5
  run_id: minted-ui-clean-b3-charts-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_file_size
  verified_at: 2026-10-23T00:31:34Z
  output: |
    file-size: ĐẠT

- eval: E6
  run_id: minted-ui-clean-b3-charts-E6-r1
  exit_code: 0
  verifier: config:executors.test.app
  verified_at: 2026-10-23T00:02:53Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-ui-clean-b3-charts-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_suppressions
  verified_at: 2026-10-23T00:31:34Z
  output: |
    suppressions: ĐẠT

- eval: E8
  run_id: minted-ui-clean-b3-charts-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_api
  verified_at: 2026-10-23T00:31:34Z
  output: |
    api: ĐẠT

- eval: E9
  run_id: minted-ui-clean-b3-charts-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_structure
  verified_at: 2026-10-23T00:31:34Z
  output: |
    structure: ĐẠT

- eval: E10
  run_id: E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:31:34Z
  screenshot: evidence/E10-step1-tooltip.png   # còn E10-step2-occupancy.png, E10-step3-yield-quarter.png và 20 ảnh evidence/s4/*.png
  observed: |
    So cặp before/s4 (đã Read từng ảnh).
    market-performance light/dark (1280, 390) và ward-performance light/dark (1280, 390): đường xu hướng, chấm cuối, chấm chú giải "T10/26 – T9/27" và gạch chân ô Doanh thu đổi từ xanh ngọc (teal) sang tím-xanh (sáng: tím đậm ~#6366f1 trên nền thẻ trắng; tối: periwinkle sáng trên nền thẻ tối). Đường rõ nét trên nền thẻ cả sáng và tối; vùng tô gradient nhạt hơn đổi theo màu. Chữ, số (21 tỷ, 14,0%, 1.594.875 đ, 4,5 tỷ, 19,1%...), nhãn trục, vùng Hè, đường Tết/30/4, bố cục, khoảng cách, ngắt dòng ở 390 giống before; không thấy khác biệt nào ngoài màu chuỗi (kể cả gạch chân ô KPI đi theo màu chuỗi).
    market-mix và ward-mix light/dark (1280, 390): donut + chấm chú giải đổi từ dải tím (#6d0fe0-ish) sang dải chàm-xanh (sáng: chàm đậm / chàm vừa / chàm nhạt xanh nhạt; tối: ba sắc periwinkle xanh-tím từ đậm đến nhạt). Market (3 chuỗi: Nguyên căn, Phòng riêng, Phòng ở chung): phân biệt được nhau và với nền thẻ ở sáng; ở tối "Phòng riêng" và "Phòng ở chung" gần nhau về độ sáng nhưng vẫn tách được và có nhãn/số/phần trăm cạnh bên. Ward (2 chuỗi): hai sắc tách rõ ở sáng, ở tối hai sắc xanh-tím gần nhau nhưng thấy ranh giới. Chữ giữa donut (257 / 23 listing), số tiền, %, badge listing, bố cục giống before.
    yield-pnl light/dark/light-390/dark-390: giống hệt before từng byte; Doanh thu tím-xanh, Chi phí xám-xanh, Biên lợi nhuận xanh lá, Ngang thuê xám đứt; đọc được ở sáng và tối (lưu ý có sẵn từ before, không do B3: các nhãn trục phải 30%–90% xếp chồng nhau; cột Chi phí sáng nhạt trên nền thẻ sáng độ tương phản thấp nhưng thấy được).
    E10-step1-tooltip.png: Insight phường Hoàn Kiếm, tab Hiệu suất, rê đường -> tooltip "Tháng 3/2027 / chấm tím-xanh Doanh thu 96.278.195 đ", đường dọc dấu tại T3/27.
    E10-step2-occupancy.png: ô Công suất được chọn (gạch chân hổ phách), tiêu đề trục "Đêm đã đặt ÷ (đã đặt + còn trống), theo tháng", trục 0–100%, đường và vùng tô hổ phách, chấm chú giải hổ phách, tooltip "Tháng 3/2027 / chấm hổ phách Công suất 6,7%", nhãn cuối 21,7%.
    E10-step3-yield-quarter.png: /yield, nút Quý đang chọn, 4 nhóm cột (Doanh thu tím-xanh + Chi phí xám-xanh) trục tới 30 tr, đường Biên lợi nhuận xanh lá 29,8%, chú giải đủ 4 mục.
    Đối chiếu Expected: đủ 20 ảnh; mọi chuỗi đọc được sáng/tối; khác biệt chỉ ở màu chuỗi (performance, revenue-mix), pnl không đổi; tooltip, đổi chỉ số, Quý chạy đúng; lưới mạng đạt.
  network_observed: clean

- eval: E11
  run_id: minted-ui-clean-b3-charts-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_selftest
  verified_at: 2026-10-23T00:31:34Z
  output: |
    46/46 ca đạt

- eval: E12
  run_id: minted-ui-clean-b3-charts-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_docs
  verified_at: 2026-10-23T00:31:34Z
  output: |
    docs: ĐẠT

- eval: E13
  run_id: ui-clean-b3-charts-E13-verify-001
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:31:34Z
  screenshot: evidence/E13-step1.png   # còn E13-step2..4.png và ảnh từng khung evidence/E13-*-hieu-suat-theo-thang.png, E13-*-co-cau-doanh-thu.png, E13-yield-*-doanh-thu-va-chi-phi-12-thang-toi.png
  observed: |
    Mở bằng Read các frame sau.
    - E13-hoan-kiem-light-hieu-suat-theo-thang.png: khung 'Hiệu suất theo tháng' ở sáng, có 4 ô chỉ số (Doanh thu, Công suất, ADR, RevPAR), biểu đồ đường với các mốc Tết, 30/4, Hè và nhãn 390.241.320 đ. Chữ rõ, tương phản đủ. Đường doanh thu mới vẽ đến khoảng T11/26 (hoạt ảnh chưa xong). Không thấy chữ chồng hay tràn.
    - E13-hoan-kiem-dark-hieu-suat-theo-thang.png: cùng khung ở tối, nền tối, đường tím sáng vẽ đủ 12 tháng, chữ trắng và trục xám đọc được. Không tràn.
    - E13-hoan-kiem-light-co-cau-doanh-thu.png: donut 23 listing, hai màu tím phân biệt được (Nguyên căn 75%, Phòng riêng 25%), chú giải và badge đọc rõ.
    - E13-hoan-kiem-dark-co-cau-doanh-thu.png: cùng khung ở tối, hai sắc tím nhạt hơn, vẫn tách được khỏi nền và khỏi nhau.
    - E13-yield-light-doanh-thu-va-chi-phi-12-thang-toi.png: cột doanh thu tím và chi phí xám xanh, đường biên lợi nhuận xanh lá, ngưỡng thuê dài hạn nét đứt, 4 ô chỉ số bên dưới. Không tràn. Nhãn trục phải 30%–90% dính sát nhau (quan sát thị giác, không phải P0).
    - E13-yield-dark-doanh-thu-va-chi-phi-12-thang-toi.png: cùng khung ở tối, cột tím sáng và xám xanh, đường xanh lá sáng, đọc rõ.
    - E13-hoan-kiem-light.png (toàn trang): thấy hai khung 'Hiệu suất theo tháng' và 'Cơ cấu doanh thu' đúng vị trí.
    Đối chiếu Expected: cả ba khung hiển thị đúng ở sáng và tối, không có hỏng hiển thị nhìn thấy. Quét P0 cho kết quả 0 P0 trong khung ở cả bốn tổ hợp (hai trang × hai chế độ). Hai P0 text-overflow còn lại nằm ngoài khung, ghi vào danh sách ngoài phạm vi.
  network_observed: clean

- eval: E14
  run_id: minted-ui-clean-b3-charts-E14-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_pixels
  verified_at: 2026-10-23T00:31:34Z
  output: |
    pixels: ĐẠT

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ui-clean-b3-charts-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-23T00:31:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ui-clean-b3-charts-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-23T00:31:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

Baseline khong do
- node scripts/ui-standards/b3-check.mjs palette: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs contrast: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs data-color: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs duplicates: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs file-size: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs suppressions: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs api: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs structure: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs selftest: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs docs: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs pixels: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi

Eval không phân biệt (xanh ở cả HEAD lẫn baseline): none — không eval nào được đo xanh ở cả hai phía; các eval không đo được baseline nằm ở mục trên.

## Variance

none — mọi eval chạy một lần, không có eval ngẫu nhiên.

## Iterations

Round 1: PASS — 15/15 eval đạt; hai lỗ đo trong hợp đồng (kiểm cột sáng/tối của data-color và kênh swatchOf) được vá ở vòng 2.
Round 2: E10 không đạt — rail network thấy một POST /api/v1/user-events bị từ chối (chưa đăng nhập) tới origin app, loại app-fail, mà expected không khai; mọi khía cạnh hiển thị và chức năng của E10 đều khớp expected. Trả về triển khai.
Round 3: PASS — hợp đồng E10 khai beacon telemetry /api/v1/user-events là ngoại lệ được phép; E10 chạy lại (E10-r3) khớp expected, lưới mạng sạch; E13 và 12 lệnh còn lại đạt, E6 carry-forward từ round 1.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do merge origin/main 8595dc0 sau chữ ký
run_id: repin-20261023T010106Z-61164
sha: b309c4ad4c2a1b86825d8ea717ba685ae262a45b · suites: 3 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng · ngoài làn máy: E10 (E10 không khai paths), E13 (E13 không khai paths) · AC không có chốt máy: AC-9
