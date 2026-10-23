---
schema_version: 2
feature_slug: ui-clean-b3-charts
verdict: REJECT
failed_evals: [E10]
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e6a34244e9f31633f508cd9c859ffd72bd903c48
human_signoff:
---

# Evidence Report: ui-clean-b3-charts

Round 2. Nội dung thay trọn round cũ; lịch sử nằm ở mục Iterations.

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
| E10 | AC-9 | ui-check | FAIL |
| E11 | AC-1 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-9 | ui-check | PASS |
| E14 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ui-clean-b3-charts-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_palette
  verified_at: 2026-10-23T00:12:37Z
  output: |
    palette: ĐẠT

- eval: E2
  run_id: minted-ui-clean-b3-charts-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_contrast
  verified_at: 2026-10-23T00:12:37Z
  output: |
    contrast: ĐẠT

- eval: E3
  run_id: minted-ui-clean-b3-charts-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_data_color
  verified_at: 2026-10-23T00:12:37Z
  output: |
    data-color: ĐẠT

- eval: E4
  run_id: minted-ui-clean-b3-charts-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_duplicates
  verified_at: 2026-10-23T00:12:37Z
  output: |
    duplicates: ĐẠT

- eval: E5
  run_id: minted-ui-clean-b3-charts-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_file_size
  verified_at: 2026-10-23T00:12:37Z
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
  run_id: minted-ui-clean-b3-charts-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_suppressions
  verified_at: 2026-10-23T00:12:37Z
  output: |
    suppressions: ĐẠT

- eval: E8
  run_id: minted-ui-clean-b3-charts-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_api
  verified_at: 2026-10-23T00:12:37Z
  output: |
    api: ĐẠT

- eval: E9
  run_id: minted-ui-clean-b3-charts-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_structure
  verified_at: 2026-10-23T00:12:37Z
  output: |
    structure: ĐẠT

- eval: E10
  run_id: minted-ui-clean-b3-charts-E10-r2
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:12:37Z
  screenshot: evidence/E10-step1-tooltip.png   # còn E10-step2-occupancy.png, E10-step3-yield-quarter.png và 20 ảnh evidence/s4/*.png
  observed: |
    Da mo tung anh s4 doi chieu before.
    PERFORMANCE (market 1280/390 sang+toi, ward 1280/390 sang+toi = 8 anh): duong xu huong, vung to duoi duong, cham chu thich "T10/26-T9/27", vach gach duoi o KPI "Doanh thu" doi tu xanh ngoc (teal) sang indigo/tim xanh (sang: ~#5b5bff, toi: ~#7b7fff). Ben sang, duong indigo tren nen the trang ro, vung to nhat nhung doc duoc; ben toi, duong indigo sang tren nen den ro. Chu, tru truc, nhan Tet/30/4/He, vung Hè xam, so lieu (vd 21 ty, 14,0%, 1.594.875, 223.917; ward 4,5 ty, 19,1%, 534.608), nhan cuoi duong 2.052.971.924 / 390.241.320, bo cuc, khoang cach, chieu cao khung deu giong het before. Khong co khac biet nao khac ngoai mau chuoi.
    REVENUE-MIX (market 3 loai phong, ward 2 loai phong; sang/toi, 1280/390 = 8 anh): donut + cham chu thich doi tu bang tim-violet (sang: tim dam/tim vua/tim nhat; toi: tim sang dan) sang bang indigo (sang: indigo dam/indigo vua/periwinkle nhat; toi: indigo vua/xanh tim/periwinkle nhat). Moi cung donut phan biet duoc voi nen the va voi nhau; 3 chuoi market (Nguyên căn/Phòng riêng/Phòng ở chung) la 3 nac do sang tang dan, phan biet duoc tren ca sang va toi (nac nhat va nac giua o che do toi hoi gan nhau nhung van tach duoc, nhan chu o legend phan biet them); ward 2 chuoi tach ro. Chu (Tổng doanh thu 21 tỷ/4,5 tỷ, 257/23 listing, 66%/34%/0%, 75%/25%, badge 147/109/1 listing, 10/13 listing), bo cuc va khoang cach giong het before. Khong co khac biet nao ngoai mau chuoi.
    YIELD-PNL (4 anh, byte-identical voi before nen noi dung y het): cot Doanh thu indigo, cot Chi phi xam xanh nhat (sang)/xam xanh dam (toi), duong Bien loi nhuan xanh luc, vach ngang thue dai han xam; phan biet duoc tren sang va toi. Mau KHONG doi so voi before (dung ky vong pnl khong doi mau). Ghi nhan tien co san (khong do thay doi B3, vi anh giong het before): truc ty le 30%-90% o phan tren bieu do bi chen sat/chong chu nhau.
    BROWSER PANE: E10-step1-tooltip.png - Insight phuong Hoan Kiem, o Doanh thu dang chon, re vao diem T3/27: tooltip "Tháng 3/2027 / Doanh thu 96.278.195 ₫" co cham tron indigo cung mau voi duong. E10-step2-occupancy.png - sau khi bam o Cong suat: duong va vung to thanh mau vang hổ phách, vach gach duoi o Cong suat cung vang, chu thich "T10/26-T9/27" cham vang, truc 0-100%, tooltip "Công suất 6,7%" cham vang, nhan cuoi duong 21,7%. E10-step3-yield-quarter.png - /yield sau khi bam Quý: truc X chi con 4 nhom T10-T12, T1-T3, T4-T6, T7-T9, cot gop quy, tooltip "T7-T9 (từ 7/2027)" liet ke Doanh thu 29,9 tr, Chi phí 21 tr, Thu nhập ròng 8,9 tr, Biên lợi nhuận 29,8%.
    DOI CHIEU EXPECTED: du 20 anh s4; moi chuoi doc duoc o sang va toi; khac biet so voi before chi o mau chuoi (performance, revenue-mix); pnl khong doi mau (byte-identical); tooltip, doi chi so, Quy chay dung. Tat ca khia canh hien thi/chuc nang KHOP expected. Eval van khong dat vi rail network: co 1 POST /api/v1/user-events bi tu choi (chua dang nhap) toi origin app (app-fail); so tho nam trong evidence/E10-network.txt.
  network_observed: app-fail

- eval: E11
  run_id: minted-ui-clean-b3-charts-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_selftest
  verified_at: 2026-10-23T00:12:37Z
  output: |
    40/40 ca đạt

- eval: E12
  run_id: minted-ui-clean-b3-charts-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_docs
  verified_at: 2026-10-23T00:12:37Z
  output: |
    docs: ĐẠT

- eval: E13
  run_id: ui-clean-b3-charts-E13-verify-001
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:12:37Z
  screenshot: evidence/E13-step1.png   # còn E13-step2..4.png và ảnh từng khung
  observed: |
    Each frame below was opened with Read.
    E13-step1.png (hoan-kiem, light, full page): the page has a light background. The 'Hiệu suất theo tháng' frame (title, subtitle, 4 KPI tiles, chart) and the 'Cơ cấu doanh thu' frame (donut 4,5 tỷ, legend Nguyên căn / Phòng riêng) are visible. This full-page capture caught the performance chart mid-animation, with only a single point at T9/27 showing.
    E13-step2.png (yield, light): the 'Doanh thu và chi phí 12 tháng tới' frame is visible with bars, a margin line and a KPI row. The legend and text are readable.
    E13-step3.png (hoan-kiem, dark) and E13-step4.png (yield, dark): the same two pages on a dark background. The chart frames have light-coloured text on a dark panel. The bars use two blue and slate tones and the margin line is green.
    E13-hoan-kiem-light-performance.png: the frame crop shows the full line and area chart, a smooth line from T11/26 to T9/27 with the Tết, 30/4 and Hè markers. Titles and KPIs are legible, with no clipped or overflowing text in the frame.
    E13-hoan-kiem-dark-mix.png: the 'Cơ cấu doanh thu' donut shows 23 listing in the centre. The legend rows Nguyên căn 3,4 tỷ 75% and Phòng riêng 1,1 tỷ 25% are readable on the dark panel.
    E13-yield-dark-pnl.png: bars, line and KPI row are legible and nothing overflows. Only cosmetic issue: the 90%..30% axis labels on the left are stacked together.
    The visible frames match the expectation: no P0 (contrast or overflow) is visible inside the three chart frames, and the scan found 0 P0 in the frames in all four runs. The only P0s sit in the search dialog outside the frames.
  network_observed: clean

- eval: E14
  run_id: minted-ui-clean-b3-charts-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_pixels
  verified_at: 2026-10-23T00:12:37Z
  output: |
    pixels: ĐẠT

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-ui-clean-b3-charts-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-23T00:12:37Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ui-clean-b3-charts-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-23T00:12:37Z

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
Round 2: E10 không đạt — rail network thấy một POST /api/v1/user-events bị từ chối (chưa đăng nhập) tới origin app, loại app-fail, mà expected không khai; mọi khía cạnh hiển thị và chức năng của E10 đều khớp expected. Lệnh ui-check:E10 là lệnh fail duy nhất và đã gắn eval E10. E13 ghi nhận cùng loại beacon telemetry này là chỉ-ghi-chú; hai eval xử lý khác nhau, người quyết ở Cổng 2 cần thống nhất. Trả về triển khai.
