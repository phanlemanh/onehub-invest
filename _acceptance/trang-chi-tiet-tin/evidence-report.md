---
schema_version: 2
feature_slug: trang-chi-tiet-tin
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1743b1d6c29a4aca1f5652a22ad861f4ed580374
human_signoff:
---

# Evidence Report: trang-chi-tiet-tin

Round 1. Mọi eval gắn AC đều xanh. Verdict REJECT vì hai lệnh suite hồi quy không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) chạy đỏ, xem mục «Lệnh suite (hồi quy)».

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
  run_id: minted-trang-chi-tiet-tin-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx
    duration_ms 3846.870834

- eval: E2
  run_id: minted-trang-chi-tiet-tin-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E1 (tests/trang-chi-tiet-tin.test.tsx)
    duration_ms 3846.870834

- eval: E6b
  run_id: minted-trang-chi-tiet-tin-E6b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E1 (tests/trang-chi-tiet-tin.test.tsx)
    duration_ms 3846.870834

- eval: E8
  run_id: minted-trang-chi-tiet-tin-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E1 (tests/trang-chi-tiet-tin.test.tsx)
    duration_ms 3846.870834

- eval: E10
  run_id: minted-trang-chi-tiet-tin-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_ui
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E1 (tests/trang-chi-tiet-tin.test.tsx)
    duration_ms 3846.870834

- eval: E2b
  run_id: minted-trang-chi-tiet-tin-E2b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-04T23:56:48Z
  output: |
    bash db/db-thu.sh oneinvest_tct --neu-chua-co && cd app && node --import tsx --test tests/trang-chi-tiet-tin-db.test.tsx
    duration_ms 41849.769375

- eval: E3
  run_id: minted-trang-chi-tiet-tin-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E2b (tests/trang-chi-tiet-tin-db.test.tsx)
    duration_ms 41849.769375

- eval: E4
  run_id: minted-trang-chi-tiet-tin-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E2b (tests/trang-chi-tiet-tin-db.test.tsx)
    duration_ms 41849.769375

- eval: E5
  run_id: minted-trang-chi-tiet-tin-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E2b (tests/trang-chi-tiet-tin-db.test.tsx)
    duration_ms 41849.769375

- eval: E7
  run_id: minted-trang-chi-tiet-tin-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tct_db
  verified_at: 2026-11-04T23:56:48Z
  output: |
    cùng lệnh với E2b (tests/trang-chi-tiet-tin-db.test.tsx)
    duration_ms 41849.769375

- eval: E6
  run_id: minted-trang-chi-tiet-tin-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.listing_static
  verified_at: 2026-11-04T23:56:48Z
  output: |
    listing-no-airdna: ĐẠT

- eval: E11
  run_id: design-gate-cfc60bac74
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.tct_gate
  verified_at: 2026-11-04T23:56:48Z
  output: |
    design-gate --jsdom app app/src/components/listing/offer-body.tsx: không vi phạm chặn

- eval: E12
  run_id: minted-trang-chi-tiet-tin-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-04T23:56:48Z
  output: |
    design-floor-s4 --root . : không hex thô

- eval: E1u
  run_id: minted-trang-chi-tiet-tin-E1u-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-04T23:56:48Z
  screenshot: evidence/E1u-ban-than.png
  observed: |
    Da mo doc tung frame (24 anh trong /Users/manhphan/dev/onehub-invest/.claude/worktrees/ecstatic-wilbur-2c5c66/_acceptance/trang-chi-tiet-tin/evidence/). BAN-than/gia/ten/diachi: ca bon anh la trang tin «Can ho · 55 m² · 2 PN», breadcrumb Ban > Tin, gia 3,3 ty 60 tr/m², nguoi dang Lien Smart City, duong Dai Mo, khoi «Tin cung tieu chi» o duoi (khop the da bam). BAN-phuong: trang phuong «Tay Mo» (4 listing, KPI). BAN-nhan: van o danh sach «Tin ban tai Thanh pho Ha Noi», popover «Tin chua xac minh — Tin tu nhom cong dong, chua doi chieu...»; BAN-nhanso: van o danh sach, popover «So chua xac minh — So khong lay truc tiep tu chinh tin nay...»; BAN-xemso: van o danh sach, nut Xem so cua the 3,3 ty doi thanh so dien thoai. THUE-than/gia/ten/diachi: trang tin 10 tr/thang, Nha rieng 30 m², nguoi dang Linh Bao, duong Pho Khuong Trung, phuong Khuong Dinh. THUE-phuong: trang phuong «Khuong Dinh». THUE-nhan: van o danh sach «Tin cho thue tai Thanh pho Ha Noi», popover «Tin chua xac minh»; THUE-nhanso: popover «So chua xac minh» canh the Linh Bao, van o danh sach; THUE-xemso: van o danh sach, nut Xem so cua the Linh Bao thanh so dien thoai. CUNGTC-than/gia/ten/diachi: trang tin «Nha rieng · 30 m² · 3 PN» 10 tr/thang, nguoi dang Quang Khai, duong Ngo Quan Tho 1 (la the dich trong khoi comps, khong phai trang goc 12 tr/thang). CUNGTC-phuong: trang phuong «Van Mieu - Quoc Tu Giam». CUNGTC-nhan: van tren trang tin 3,3 ty (Lien Smart City), popover «Tin chua xac minh» mo ngay canh the 8,5 ty trong khoi comps; CUNGTC-nhanso: van tren trang tin 12 tr/thang goc, popover «So chua xac minh» canh the Quang Khai; CUNGTC-xemso: van tren trang goc, the 10 tr/thang Quang Khai da hien so dien thoai. Tat ca khop Expected: than/gia/ten/dia chi -> /listing/<offer_id>; phuong -> trang phuong; nhan -> popover giai thich, URL khong doi; Xem so -> URL khong doi.
  network_observed: clean   # 55 fetch app-origin deu thanh cong, 0 pageerror; 11 request huy do prefetch khi dieu huong (note-only); chi tiet trong evidence/E1u-network.txt

- eval: E9
  run_id: minted-trang-chi-tiet-tin-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-04T23:56:48Z
  screenshot: evidence/E9-s06.png
  observed: |
    E9-s06.png (1280, sáng): tiêu đề "Căn hộ · 90 m² · 3 PN", giá 7,6 tỷ. Có khối "Người đăng" ở cột phụ (Trần Minh Trí, nhãn «Chưa xác minh» kèm nút Xem số), bảng Thông số, rồi "Tin cùng tiêu chí" 6 thẻ. Chữ rõ nét. E9-s06-dark.png: cùng bố cục, nền tối, chữ và nhãn vàng đọc rõ.
    E9-s03.png và E9-s03-dark.png: tin S03, giá 2,8 tỷ kèm nhãn «Chưa xác minh», người đăng "Huyền Vinhomes" với nút Xem số, Thông số có Block PR6. Các thẻ cùng tiêu chí hiện «Chưa có số» và «Tài khoản nhiều tên». Đọc được ở cả hai chủ đề.
    E9-375.png và E9-375-dark.png: khối Người đăng, nhãn và nút Xem số nằm ở y≈330-366 trong khung 812, trên nếp gấp. Một cột, không tràn ngang, chữ đọc được ở cả sáng và tối.
    E9-thitruong.png (và dark): ở dòng địa điểm hiện "Thị trường: Thành phố Hà Nội" thay cho Phường và không có liên kết. Không có khối "Tin cùng tiêu chí". Có nhãn «Chưa xác minh».
    E9-thieu-truong.png: chỉ hiện Loại hình, Diện tích, Phường; các dòng thiếu bị bỏ, không có ô trống. Người đăng "Tài khoản nhiều tên", nhãn «Chưa có số».
    E9-khong-so.png (và 375 dark): người đăng "Jiang Kim", nhãn «Chưa có số», không có nút Xem số.
    E9-so-ghep.png và E9-so-ghep-dark.png: sau khi bấm Xem số, nút thành ô số điện thoại bị che xám, nhãn «Chưa xác minh» (kèm biểu tượng thông tin) đứng cạnh. E9-so-xacminh.png: số đã xác minh hiện ô số mà không có nhãn «Chưa xác minh».
    E9-404.png và E9-404-dark.png: tiêu đề "Tin này không còn hiện", câu chung, nút "Xem tin đang bán". Hiện ở cả 1280 và 375, chữ rõ.
  network_observed: clean

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-04T23:56:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-trang-chi-tiet-tin-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-04T23:56:48Z

- cmd: cd app && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-04T23:56:48Z
  output: |
    tests 929, pass 917, fail 1, cancelled 1, skipped 10
    tests/hieu-chuan.test.tsx: «HC-AC-1 fixture: hai lần cùng market đại diện» quá hạn 120000ms
    tests/tin-rao-cong-khai.test.tsx: «E7 đối chứng: ngưỡng 4 đỏ NHIEU TEN, đếm sau lọc đỏ DEM SAU LOC» ReferenceError: f is not defined, tại app/src/lib/__ban_sao_tir_37514_3.ts:103

- cmd: cd pipeline && npm test
  run_id: minted-trang-chi-tiet-tin-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-04T23:56:48Z
  output: |
    tests 524, pass 523, fail 0, cancelled 1
    scripts/luoc-do-rieng.test.mjs: «LDR bản chép rỗng mang đủ ràng buộc, chỉ mục, cột sinh, dãy riêng và search_path trỏ vào nó» quá hạn 120000ms

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-chi-tiet-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-04T23:56:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-chi-tiet-tin-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-04T23:56:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail không gắn eval (nguyên nhân REJECT; failed_evals để trống vì không eval nào đỏ):
- `cd app && npm test`: thoát khác 0. Hai ca đỏ nằm ngoài các tệp của hồ sơ này (hieu-chuan, tin-rao-cong-khai), một ca quá hạn 120 giây, một ca lỗi tham chiếu trong bản sao thử nghiệm. Cần người xác định có phải hồi quy do nhánh này hay đã đỏ sẵn trên main.
- `cd pipeline && npm test`: thoát khác 0 do một ca quá hạn 120 giây (luoc-do-rieng); 523 ca còn lại đạt, không ca nào fail. Có dấu hiệu máy chậm hoặc DB dùng chung, cần chạy lại với hạn dài hơn.

Eval không phân biệt (xanh cả trên nhánh lẫn baseline):
- E6 (`node scripts/check-listing-no-airdna.mjs`): xanh trên baseline, là rào hồi quy có chủ ý cho listing thuê ngắn hạn.
- E12 (`design-floor-s4.mjs --root .`): xanh trên baseline, là rào hồi quy hex thô.

Baseline không đo
- cd app && node --import tsx --test tests/trang-chi-tiet-tin.test.tsx: bo qua baseline: tep app/tests/trang-chi-tiet-tin.test.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_tct --neu-chua-co && cd app && DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest_tct node --import tsx --test tests/trang-chi-tiet-tin-db.test.tsx: bo qua baseline: tep app/tests/trang-chi-tiet-tin-db.test.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi
- for f in app/src/components/listing/offer-body.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: bo qua baseline: tep app/src/components/listing/offer-body.tsx co o cay dang kiem nhung chua co o merge-base 9976fb0125defa7e4c2e56013c0bd66e114d1e9c — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: mọi eval gắn AC xanh; `cd app && npm test` và `cd pipeline && npm test` chạy đỏ (hai ca quá hạn và một ca lỗi tham chiếu ngoài hồ sơ). Review còn 12 phát hiện trong hợp đồng về độ chặt của thước đo (xem review-findings.md). Trả về triển khai.
