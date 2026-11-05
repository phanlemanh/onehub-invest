---
schema_version: 2
feature_slug: trang-chi-tiet-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3dfa8dcb202a82c211ed926e136b505bda7bc7b1
human_signoff: Mạnh 2026-11-05
---

# Evidence Report: trang-chi-tiet-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E1u | AC-1 | ui-check | PASS |
| E2 | AC-2 | test | PASS |
| E2b | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E6b | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-trang-chi-tiet-tin-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-05T01:25:42Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    ca TCT-AC-1 xanh
    ℹ duration_ms 1019.925375

- eval: E2
  run_id: minted-trang-chi-tiet-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-05T01:25:42Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    ca TCT-AC-2-ve xanh
    ℹ duration_ms 1019.925375

- eval: E6b
  run_id: minted-trang-chi-tiet-tin-E6b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-05T01:25:42Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    ca TCT-AC-6 xanh
    ℹ duration_ms 1019.925375

- eval: E8
  run_id: minted-trang-chi-tiet-tin-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-05T01:25:42Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    ca TCT-AC-8 xanh
    ℹ duration_ms 1019.925375

- eval: E10
  run_id: minted-trang-chi-tiet-tin-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-05T01:25:42Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    ca TCT-AC-9 xanh
    ℹ duration_ms 1019.925375

- eval: E2b
  run_id: minted-trang-chi-tiet-tin-E2b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-05T01:25:42Z
  output: |
    tests/trang-chi-tiet-tin-db.test.tsx trên DB thử oneinvest_tct
    ℹ duration_ms 63972.229042

- eval: E3
  run_id: minted-trang-chi-tiet-tin-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-05T01:25:42Z
  output: |
    tests/trang-chi-tiet-tin-db.test.tsx trên DB thử oneinvest_tct
    ℹ duration_ms 63972.229042

- eval: E4
  run_id: minted-trang-chi-tiet-tin-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-05T01:25:42Z
  output: |
    tests/trang-chi-tiet-tin-db.test.tsx trên DB thử oneinvest_tct
    ℹ duration_ms 63972.229042

- eval: E5
  run_id: minted-trang-chi-tiet-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-05T01:25:42Z
  output: |
    tests/trang-chi-tiet-tin-db.test.tsx trên DB thử oneinvest_tct
    ℹ duration_ms 63972.229042

- eval: E7
  run_id: minted-trang-chi-tiet-tin-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-05T01:25:42Z
  output: |
    tests/trang-chi-tiet-tin-db.test.tsx trên DB thử oneinvest_tct
    ℹ duration_ms 63972.229042

- eval: E6
  run_id: minted-trang-chi-tiet-tin-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.script.listing_static
  verified_at: 2026-11-05T01:25:42Z
  output: |
    listing-no-airdna: ĐẠT

- eval: E11
  run_id: design-gate-53e3b7bebc
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.tct_gate
  verified_at: 2026-11-05T01:25:42Z
  output: |
    design-gate trên app/src/components/listing/offer-body.tsx: không vi phạm P0

- eval: E12
  run_id: minted-trang-chi-tiet-tin-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-05T01:25:42Z
  output: |
    design-floor-s4 --root . : không hex thô

- eval: E1u
  run_id: minted-trang-chi-tiet-tin-E1u-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-05T01:25:42Z
  screenshot: evidence/E1u-sale-than.png
  observed: |
    Đã mở bằng Read cả 21 frame (lượt chạy đầu), rồi chạy lại với che rộng hơn và mở lại các frame có tên người đăng. Thân/giá/tên/địa chỉ (3 lối x 4): frame là trang tin /listing/<id> của đúng thẻ vừa bấm: Bán «Căn hộ · 55 m² · 2 PN», 3,3 tỷ, 60 tr/m², phường Tây Mỗ, đường Đại Mỗ; Thuê «Nhà riêng · 30 m² · 4 tầng», 10 tr/tháng, Khương Đình, Phố Khương Trung; comps «Nhà riêng · 40 m² · 4 tầng», 6,3 tỷ, 157,5 tr/m², Ngọc Hồi. Khớp thẻ nguồn, khối Người đăng trống (đã che); khối Tin cùng tiêu chí còn skeleton lúc chụp. Phường: Bán -> trang «Tây Mỗ» (vn/hanoi/tay-mo), Thuê -> «Khương Đình», comps -> «Ngọc Hồi». Nhãn: ở cả ba lối còn nguyên trang danh sách / trang tin cũ và hiện popover «Số chưa xác minh. Số không lấy trực tiếp từ chính tin này… Xem phương pháp». Xem số: ở cả ba lối còn nguyên trang danh sách / trang tin cũ, nút đổi thành ô có biểu tượng điện thoại và số đã trong suốt. Tên người đăng ở mọi thẻ trong frame là ô trống («Đăng bởi» + vạch mờ). Khớp Expected, không ô nào thiếu.
  network_observed: clean   # raw trong evidence/E1u-network.txt

- eval: E9
  run_id: minted-trang-chi-tiet-tin-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-05T01:25:42Z
  screenshot: evidence/E9-s06.png
  observed: |
    Tôi đã mở từng frame bằng Read.
    - E9-s06.png (1280, sáng): tin S06 «Nhà riêng · 174 m² · 5 tầng», breadcrumb Việt Nam > Thành phố Hồ Chí Minh > Bán > Tin. Giá 20,8 tỷ. Hai cột: bên trái giá và Thông số, bên phải Người đăng. Tên người đăng bị che bằng ô xám. Chỉ có nút «Xem số», không có nhãn (ST-lien-he-truc-tiep). Phường là liên kết gạch chân. Có khối «Tin cùng tiêu chí» với các thẻ có «Đăng bởi» bị che, nhãn «Chưa xác minh» kèm biểu tượng thông tin, và nút «Xem số». Chữ đọc rõ.
    - E9-s06-dark.png: cùng bố cục trên nền tối. Chữ trắng đọc rõ, badge vàng «Chưa xác minh» vẫn đủ tương phản, ô che hiện ra là xám tối.
    - E9-s03.png (sáng): tin S03 «Căn hộ · 60 m² · 2 PN». Giá 3,3 tỷ có badge «Chưa xác minh» kèm biểu tượng thông tin (ST-tin-chua-xac-minh). Có Người đăng với «Xem số». Thông số gồm Loại hình, Diện tích, Phòng ngủ, Block, Phường. Thẻ cùng tiêu chí có «Tài khoản nhiều tên» và «Chưa có số». E9-s03-dark.png tương tự, đọc được.
    - E9-375.png và E9-375-dark.png: một cột. Thứ tự là tiêu đề, giá, Người đăng kèm «Xem số» (y≈366, trên nếp gấp), rồi Thông số. Không có cuộn ngang. Cả hai chủ đề đọc được.
    - E9-375-ghep.png và E9-375-ghep-dark.png: Người đăng có nhãn «Chưa xác minh» kèm biểu tượng thông tin và nút «Xem số» nằm trong khung 375, không tràn (ST-lien-he-ghep).
    - E9-thi-truong.png: tin S03 cấp thị trường. Dòng «Thị trường: Thành phố Hà Nội» không phải liên kết, không có khối «Tin cùng tiêu chí» (ST-tin-cap-thi-truong).
    - E9-thieu-truong.png: tin «Đất · 80 m² · Mặt tiền 5 m». Thông số bỏ hẳn dòng Phòng ngủ, không có chữ «chưa có» (ST-tin-thieu-truong).
    - E9-khong-so.png: khối Người đăng chỉ có badge «Chưa có số», không nhãn, không nút (ST-lien-he-chua-co-so).
    - E9-ghep.png: nhãn «Chưa xác minh» kèm nút Xem số.
    - E9-truc-tiep-da-lay.png và E9-ghep-da-lay.png: nút thành liên kết gọi có biểu tượng điện thoại, số bị che. Bản ghép vẫn giữ nhãn «Chưa xác minh».
    - E9-404.png: nền sáng, khối rỗng ở giữa, tiêu đề «Tin này không còn hiện», mô tả «Tin có thể đã cũ, hoặc đường dẫn không đúng…», nút «Xem tin đang bán». HTTP 404. Có lớp phủ dev «1 Issue» ở góc dưới trái.
    - E9-404-375-dark.png: cùng nội dung ở 375 nền tối, đọc được, không tràn.
    Đối chiếu Expected: các trạng thái ST-tin-* và ST-lien-he-* khớp bảng Đặc tả UX. Liên hệ không tràn ngang ở 375 và nằm trên nếp gấp. Chữ đọc được ở cả hai chủ đề. Không frame nào mâu thuẫn với Expected.
  network_observed: clean   # raw trong evidence/E9-network.txt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-trang-chi-tiet-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

- cmd: cd app && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

- cmd: cd pipeline && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-chi-tiet-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-chi-tiet-tin-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-05T01:25:42Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên HEAD lẫn baseline), chỉ chứng minh harness hoặc là regression-guard có chủ ý:
- E6: node scripts/check-listing-no-airdna.mjs
- E12: node design-floor-s4.mjs --root .

Baseline không đo:
- cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx: bo qua baseline: tep app/tests/trang-chi-tiet-tin.test.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_tct --neu-chua-co && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_tct node --import tsx --test tests/trang-chi-tiet-tin-db.test.tsx: bo qua baseline: tep app/tests/trang-chi-tiet-tin-db.test.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- for f in app/src/components/listing/offer-body.tsx (design-gate --jsdom app): bo qua baseline: tep app/src/components/listing/offer-body.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: có lượt chấm r1 siết thước (commit 3dfa8dcb, đo HTTP trên bản build), trả về triển khai.
Round 2: toàn bộ 15 eval và 6 lệnh suite xanh trên 3dfa8dcb; verdict PASS.
