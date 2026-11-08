---
schema_version: 2
feature_slug: danh-ba-phuong-xa-toan-quoc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 980ec75d7d5307e907da8fec61923bd14bd11c89
human_signoff:
---

# Evidence Report: danh-ba-phuong-xa-toan-quoc

Hạng T3, round 1. Phiên verify tươi (không viết code này), đường độc lập Phase 3: mọi lệnh chạy tuần tự tại HEAD
`980ec75d`, lệnh trùng chạy một lần (E1–E6 chung một lệnh `px1_db`, E7–E8 chung `px1_thuan`). Không có eval judgment
hay ui-check (surfaces: config, cli). Baseline chạy trên worktree tạm tại `d60c3fa1` rồi đã xoá.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-1 NGUON.json khai đủ băm, băm thật khớp (25.346917ms)
    ✔ PX1-AC-1 chiều đỏ: một byte lệch → bộ nạp thoát 2, 0 dòng ghi (80.739625ms)
    ℹ tests 13 · pass 13 · fail 0 · skipped 0
  note: ca đỏ chạy CLI thật `nap-dvhc.mjs --data <tạm>` trên bản sao đổi một byte xa.json, ghim «PX1 băm lệch: xa.json»,
    mã thoát 2; «0 dòng ghi» được kiểm bằng số dòng areas + băm tập id trước/sau (không đếm riêng admin_code, area_aliases).

- eval: E2
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-2 đủ 3.321 xã dưới đúng 34 tỉnh, mã duy nhất (1718.167417ms)
    ✔ PX1-AC-2 chiều đỏ: thiếu thị trường, tên thị trường lệch → dừng có tên, không ghi (45.66025ms)
    ℹ tests 13 · pass 13 · fail 0 · skipped 0
  note: 34 market có admin_code khớp bảng, 3321/3321 mã riêng, GROUP BY parent_id so bảng rút từ xa.json 34/34; chiều đỏ
    ghim «PX1 thiếu thị trường 46» (vn-hue đổi region_type trong savepoint thay vì xoá) và «PX1 tên thị trường lệch 52».

- eval: E3
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-3 giữ id cũ, gắn mã phường OSM, chèn xã thiếu đúng khuôn (1752.099875ms)
    ✔ PX1-AC-3 chiều đỏ: hai phường OSM cùng tên một xã → dừng có tên (39.264ms)
    ✔ PX1-AC-3 chuanTen: ma trận viết trước (0.474083ms)
    ✔ PX1-AC-3 khopXa: ưu tiên phường OSM, khu tên quận cũ không nhận mã, hai cùng hạng thì mơ hồ (0.417875ms)
    ✔ PX1-AC-3 idXa: slug chung trong tỉnh hoặc id đã có thì thêm mã (0.712292ms)
  note: chụp (id, name, md5 geom, source) trước/sau; 11 khu airbnb-discovery NULL và có tên trong báo cáo; Cẩm Giàng (03626),
    Thạnh An (73308) khớp xã có dấu; Hưng Long, Hoàng Sa chèn mới; ghim «PX1 khớp hai khu vực: 00004». Ma trận chuanTen/khopXa
    ở lệnh px1_thuan (E7 cùng run).

- eval: E4
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-4 10.033 bí danh, 441 tách, đích nằm trong danh bạ (1403.785166ms)
    ✔ PX1-AC-4 bộ tra theo khoá: một đích → xã, nhiều đích → cần chọn, không bao giờ đoán (2480.875833ms)
    ℹ tests 13 · pass 13 · fail 0 · skipped 0
  note: ma trận theo khoá rút từ xa-cu.json (số assert = số khoá) và chiều đỏ «PX1-AC-4 đoán xã cho tên cũ nhiều đích» nằm
    ở lệnh px1_thuan cùng phiên chấm (run danh-ba-phuong-xa-toan-quoc-eval-px1-thuan-r1-20261108T030200Z).

- eval: E5
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-5 084 áp hai lần không đổi lược đồ (16.352667ms)
    ✔ PX1-AC-5 bộ nạp thật hai lần: lần hai doi=0, nội dung bằng hệt (8116.716334ms)
    ℹ tests 13 · pass 13 · fail 0 · skipped 0
  note: lần hai ghim dòng «doi=0», băm (id, parent, name, admin_code, meta) + area_aliases bằng nhau; ca phụ đổi meta.loai
    giữa hai lần thấy «doi=1».

- eval: E6
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_db
  verified_at: 2026-11-08T03:01:55Z
  output: |
    ✔ PX1-AC-6 reassign (lượt thường) không xoá xã danh bạ, vẫn xoá khu không mã (3012.055833ms)
    ✔ PX1-AC-6 reassign (--xoa-khu-vuc-lac) không xoá xã danh bạ, vẫn xoá khu không mã (5380.767458ms)
    ✔ PX1-AC-6 chiều đỏ: xã chèn mới mất mã thì reassign xoá nó (điều kiện admin_code là thứ giữ nó lại) (3298.855584ms)
  note: các ca AU9 cũ của reassign-areas.test.mjs xanh trong SUITE-pipeline (AU9-AC-1…AC-10).

- eval: E7
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-thuan-r1-20261108T030200Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_thuan
  verified_at: 2026-11-08T03:02:03Z
  output: |
    ✔ PX1-AC-7 S06 khớp ward_name_v3 vào xã danh bạ của tỉnh khác 4 thành phố (1.117833ms)
    ✔ PX1-AC-7 S03: nhóm khai tỉnh khớp xã của tỉnh đó; nhóm chưa khai không bị kéo sang tỉnh khác (5.002416ms)
    ℹ tests 11 · pass 11 · fail 0 · skipped 0
  note: ca DB «PX1-AC-7-db» (docThiTruongCoXa = 34, docThiTruongCoPhuong không đổi, phuongHopLe không nhận dòng dvhc)
    xanh trong run danh-ba-phuong-xa-toan-quoc-eval-px1-db-r1-20261108T030125Z.

- eval: E8
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-thuan-r1-20261108T030200Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_thuan
  verified_at: 2026-11-08T03:02:03Z
  output: |
    ✔ PX1-AC-8 bí danh: ma trận bốn lớp × hai đường (1.231125ms)
    ✔ PX1-AC-8 bí danh trên dữ liệu thật: bốn lớp cộng lại đủ 10.033 dòng (12.931417ms)
    ℹ tests 11 · pass 11 · fail 0 · skipped 0

- eval: E9
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-do-r1-20261108T030207Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_do
  verified_at: 2026-11-08T03:02:16Z
  output: |
    tin nối được: S06 73660/73660 · S03 1387 bài một-bài/103720 bài
    đối chứng code: lệch 0
    vn-da-nang | 8249 | 8246 | 8249 | 0 | 0 | 0 | 3 | 0
    vn-hanoi | 9256 | 8809 | 8809 | 0 | 0 | 0 | 0 | 0
    vn-hcmc | 57382 | 56627 | 56627 | 0 | 0 | 84 | 0 | 0
    tổng | 75047 | 73682 | 73685 | 0 | 0 | 84 | 3 | 0
    tập khai trước: Hưng Yên 41 tin (gắn mới 0) · không tỉnh 119 (gắn mới 0) · HN/HCM chỉ gắn tỉnh 1202 (gắn mới 0)
    sau ROLLBACK: areas 545
    PX1-AC-9 xanh
  note: chiều đỏ trong chính lệnh chạy thêm bằng cờ --doi-chung-hong (run
    danh-ba-phuong-xa-toan-quoc-eval-px1-do-hong-r1-20261108T030235Z, dòng run-log kind kiem-them-chieu-do): thoát 1 đúng
    như kỳ vọng với «PX1-AC-9 tỉnh giảm: vn-hanoi», «PX1-AC-9 mất xã: 1 (vn-hanoi)», «PX1-AC-9 đổi xã: 1 (vn-hanoi)».

- eval: E10
  run_id: danh-ba-phuong-xa-toan-quoc-eval-px1-cu-r1-20261108T030253Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.px1_cu
  verified_at: 2026-11-08T03:02:59Z
  output: |
    ✔ PX1-AC-10 bộ đọc tên chạy như cũ, in đúng một dòng «chưa áp 084» (40.46625ms)
    ✔ PX1-AC-10 gán S06, S03 bằng code mới = area_id đang lưu (761.36175ms)
    ✔ PX1-AC-10 reassign mới cho cùng kết quả với reassign của nhánh chính (2824.64875ms)
    ✔ PX1-AC-10 chiều đỏ: bỏ kiểm cột thì câu khớp tên gãy khi chưa áp 084 (18.542625ms)
    ℹ tests 4 · pass 4 · fail 0 · skipped 0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: danh-ba-phuong-xa-toan-quoc-suite-agent-r1-20261108T023935Z
  exit_code: 0
  verified_at: 2026-11-08T02:39:57Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: danh-ba-phuong-xa-toan-quoc-suite-app-tsc-lint-r1-20261108T024001Z
  exit_code: 0
  verified_at: 2026-11-08T02:40:12Z

- cmd: cd pipeline && npm test
  run_id: danh-ba-phuong-xa-toan-quoc-suite-pipeline-r1-20261108T025235Z
  exit_code: 0
  verified_at: 2026-11-08T03:01:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: danh-ba-phuong-xa-toan-quoc-suite-app-lint-rules-r1-20261108T030118Z
  exit_code: 0
  verified_at: 2026-11-08T03:01:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: danh-ba-phuong-xa-toan-quoc-suite-portal-r1-20261108T030119Z
  exit_code: 0
  verified_at: 2026-11-08T03:01:20Z

Lệnh suite `cd app && npm test` ĐỎ ở HEAD — xem Known limits (đỏ có sẵn, baseline cùng đỏ).

## Known limits

- Suite `cd app && npm test` đỏ tại HEAD (run danh-ba-phuong-xa-toan-quoc-suite-app-test-r1-20261108T024016Z): 1034/1040 qua, một ca hỏng «E4b đối chiếu DB máy thu» (`app/tests/tin-rao-doi-chieu.test.tsx`), trần thời gian 1000 ms của câu sắp xếp price-desc đo được 1040 ms khi 8 tệp test chạy song song. Baseline `d60c3fa1` cùng đỏ đúng ca ấy (price-asc 1076 ms, run danh-ba-phuong-xa-toan-quoc-base-app-test-r1-20261108T031211Z). Chạy riêng tệp đó tại HEAD thì xanh, mọi câu dưới 400 ms (run danh-ba-phuong-xa-toan-quoc-kiem-app-e4b-r1-20261108T032409Z). Diff không chạm `app/` hay `agent/`. Kết luận: đỏ có sẵn, phụ thuộc tải máy, không do vòng này.
- E9: số tập khai trước trong đầu ra (Hưng Yên 41 tin, không tỉnh 119) khác số ghi trong `expected` (46, 233). Thước in đúng dòng riêng; số đổi theo bản chép DB máy thu hôm nay. Mệnh đề «đếm areas, area_aliases sau thước bằng trước» chỉ được in cho areas (545 = 545), không có so sánh tự động; area_aliases không có trên bản chép (chưa áp 084) nên chỉ sống trong giao dịch rồi ROLLBACK.
- Một số chiều đỏ được hiện thực khác chữ của `expected` nhưng cùng ý: E2 «xoá market vn-hue» làm bằng đổi region_type trong savepoint, và «0 dòng ghi» được kiểm sau ROLLBACK TO SAVEPOINT (hiển nhiên đúng; thứ thật sự bảo đảm là bộ nạp kiểm đủ 34 thị trường trước mọi lệnh ghi, `pipeline/nap-dvhc.mjs:45-49`); E3 «bản sao chuanTen bỏ cả Quận» không chạy như một ca, chỉ có ca 11 khu kiểm chiều xanh; E6 chiều đỏ gỡ admin_code của xã thay vì sửa bản sao reassign; E1 chiều đỏ đếm areas + băm id, không đếm riêng admin_code, area_aliases.
- Bản chép DB máy thu chưa áp 084, nên nhánh «bản chép đã có 084 thì DROP» của E10 và nhánh «đã có cột» của E9 không được đi qua trong lượt này.
- Phát hiện trong hợp đồng, mức thấp hoặc tiềm ẩn (chi tiết ở review-findings.md): S06 không bỏ tiền tố «Đặc khu» khi khớp ward_name_v3 (13 đặc khu rơi về khớp chữ); một xã trong `xa.json` mang tên có tiền tố thường «xã Bắc Sơn» nên vào areas với tên và id có tiền tố; đường ward_name cũ của S06 khớp thẳng tên hiện hành trước bước bí danh an toàn, bỏ qua luật «trùng tên hiện hành» của AC-8 (0 tin trên dữ liệu hôm nay).

## Ngoài hợp đồng

- Bộ khớp tên S03 `matchPhuongThiTruong` khớp chuỗi con không ranh giới từ (kể cả biến thể slug bỏ dấu); trước chỉ áp cho 4 thành phố, nay áp cho mọi xã của tỉnh nhóm khai. Dữ liệu hôm nay: 480 bài của nhóm khai Hưng Yên, 2 lần khớp, cả hai đúng ranh giới từ.
- Khi sau này thu ranh giới OSM cho 30 tỉnh (OOS-1): xã danh bạ đã chèn với id có hậu tố mã, cộng phường OSM cùng tên mới vào, thì lần nạp kế sẽ gắn mã vào phường OSM và va chỉ mục duy nhất `areas_admin_code_uq` — dừng bằng lỗi DB không tên (giao dịch ROLLBACK, không hỏng dữ liệu).

## Analyst

none — không có eval nào xanh trên baseline. Cả mười eval đều n-a ở baseline vì tệp lệnh chưa có ở diffBase (xem dưới); tính phân biệt của chúng dựa trên các ca chiều đỏ trong chính bộ test (đều xanh ở HEAD) và lần chạy `--doi-chung-hong` của E9.

Baseline không đo:
- E1–E6 (`pipeline/scripts/nap-dvhc.test.mjs`), E7–E8 (`pipeline/lib/dvhc.test.mjs`), E9 (`pipeline/scripts/nap-dvhc-do.mjs`), E10 (`pipeline/scripts/nap-dvhc-cu.test.mjs`): tệp chưa tồn tại ở `d60c3fa1` — eval mới, chạy trên code cũ không chứng minh gì.

Baseline suite tại `d60c3fa1` (worktree tạm, node_modules symlink, đã xoá): agent xanh; app tsc+lint xanh sau khi sinh kiểu route Next (`next typegen`) trong worktree tạm — lần đầu thiếu kiểu `LayoutProps` vì worktree mới chưa có `.next/types`, là hạ tầng (run danh-ba-phuong-xa-toan-quoc-base-app-tsc-lint-r1-20261108T030331Z); app test đỏ cùng ca E4b như HEAD; pipeline xanh 626/626 (HEAD 643/643, thêm 17 ca PX1); lint-rules xanh; portal xanh.

## Variance

none — mọi eval chạy một lần, xác định, không có phương sai.

## Iterations

Round 1: mười eval máy xanh (E1–E10), năm suite xanh; suite app test đỏ có sẵn (baseline cùng đỏ, ca đo thời gian). Có ba phát hiện mức thấp/tiềm ẩn trong hợp đồng và hai ngoài hợp đồng — xem review-findings.md; người quyết ở Gate 2 (T3).
