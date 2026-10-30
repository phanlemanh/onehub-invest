---
schema_version: 2
feature_slug: man-gan-nhan-mu
verdict: REJECT
failed_evals: [E2]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 14b27f7e9f51f58b3222ab2c8359548f0818d570
human_signoff:
---

# Evidence Report: man-gan-nhan-mu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | ui-check | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-10 | script | PASS |

Tổng kết vòng 1: 12/13 eval xanh, E2 (AC-2, lấy mẫu) đỏ. Probe `probes/mau.mjs` dừng ngay ở bước dựng dữ liệu thử vì vi phạm khoá ngoại, nên chưa đo được hành vi lấy mẫu nào của AC-2. Lệnh đỏ duy nhất của vòng này là lệnh của E2, không có lệnh đỏ nào ngoài eval.

## Evidence

- eval: E1
  run_id: minted-man-gan-nhan-mu-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_migration
  verified_at: 2026-10-30T01:52:18Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-man-gan-nhan-mu-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.mgn_mau
  verified_at: 2026-10-30T01:52:18Z
  output: |
    error: insert or update on table "stg_zalo_posts" violates foreign key constraint "stg_zalo_posts_snapshot_id_fkey"
    detail: Key (snapshot_id)=(hanoi__zalo__mgnthu) is not present in table "airbnb_snapshots".
    at async moi (_acceptance/man-gan-nhan-mu/probes/mau.mjs:22:32)
    at async _acceptance/man-gan-nhan-mu/probes/mau.mjs:76:3
    Nguyên nhân gần: bước dựng dữ liệu thử chèn vào stg_zalo_posts với snapshot_id chưa có dòng cha trong airbnb_snapshots. Probe dừng trước khi chạy lệnh label-sample, nên 0 trong các số đo của AC-2 được đo.

- eval: E3
  run_id: E3-man-gan-nhan-20261030
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-30T01:52:18Z
  screenshot: evidence/E3-step1.png
  observed: |
    E3-step1.png (1280 sáng): trang «Gắn nhãn» trong Ops, breadcrumb Vận hành > Gắn nhãn; chip «Tôi đã gắn 0/10 tin», «Cặp gắn trùng đủ hai người 0/2», «Đồng thuận: chưa đủ cặp»; thẻ «Tin cần gắn» có «S03 · Duy Ka Masteri ❤️❤️ · đăng 2026-10-28 15:55 (GMT+7)» và chữ gốc (một URL ảnh f64-zpg-r.zdn.vn); thẻ «Chín trường lõi» có Ý định tin / Loại tin / Loại hình (ô Chọn), Dự án, Toà, kèm «Tin không nêu» mỗi ô; không có giá trị máy nào. Bố cục hai cột, không cuộn ngang.
    E3-step2.png (390x844 tối): nền tối, một cột, tiêu đề, chip xuống hàng, thẻ tin và thẻ biểu mẫu xếp dọc, nội dung vừa khung 390, không cắt ngang.
    E3-step3-truoc-luu.png: form đã điền (Dự án Vinhomes Ocean Park, Toà S1, giá 3,5 / 3,8 tỷ, Diện tích «Tin không nêu» tích và ô xám, Phòng ngủ 2).
    E3-step3.png (sau Lưu): chip đổi «Tôi đã gắn 1/10 tin»; thẻ tin là bài khác (12:11, nội dung «Giảm giá chốt trong ngày nay... DT:43m2 ... 2,9 tỷ»); form về trạng thái trống («Chọn», ô rỗng). Khớp Expected: sang tin khác.
    E3-step4.png (giá ngược): nhãn «Giá (khoảng)» và hai ô 5 / 4 viền đỏ, dòng đỏ «Giá thấp nhất lớn hơn giá cao nhất» ngay dưới ô giá; Dự án Vinhomes Ocean Park, Toà S1, Diện tích 50, Phòng ngủ 2 còn nguyên; vẫn tin 12:11, không sang tin khác. Khớp Expected (AC-7 vế màn). Khung ảnh step3/4 từ ego-browser là viewport ~1870 rộng, nền tối theo pane.
  network_observed: n-a (driver)
  output: |
    Bước 5 đạt: ở tin kế điền đủ chín ô với giá 5 / 4 tỷ rồi bấm Lưu, DOM có alert «Giá thấp nhất lớn hơn giá cao nhất», đầu trang vẫn «1/10», cùng tin 12:11, URL không đổi, mọi ô giữ nguyên; doc-nhan vẫn 9 dòng của item 82 (không ghi thêm).
    Log dev server: các lượt tải trang đều thành công, một lượt lưu đúng thành công, một lượt giá ngược bị từ chối đúng kỳ vọng AC-7; không có lỗi phía máy chủ. ego-browser không có đường đọc network/console nên ghi nhận từ log server.
    Cây không có tệp mới ngoài thư mục evidence/ (cookie và mint tạm ở scratchpad đã xoá).
    Lưu ý cho người ký: «ô số» ở Expected được diễn giải là các ô đếm số tin (Tôi đã gắn x/10, Cặp gắn trùng 0/2, Đồng thuận) và mã nguồn S03; trang không có ô «số thứ tự tin» riêng. Nếu Expected có ý đó thì cần người ký xác nhận.

- eval: E4
  run_id: minted-man-gan-nhan-mu-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx (chung một lượt chạy với E6, E8, E9, E10)
    duration_ms 734.727042

- eval: E5
  run_id: minted-man-gan-nhan-mu-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_mu
  verified_at: 2026-10-30T01:52:18Z
  output: |
    MU OK

- eval: E6
  run_id: minted-man-gan-nhan-mu-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx (chung một lượt chạy với E4, E8, E9, E10)
    duration_ms 734.727042

- eval: E7
  run_id: minted-man-gan-nhan-mu-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_dong_thuan
  verified_at: 2026-10-30T01:52:18Z
  output: |
    DONG THUAN OK

- eval: E8
  run_id: minted-man-gan-nhan-mu-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx (chung một lượt chạy với E4, E6, E9, E10)
    duration_ms 734.727042

- eval: E9
  run_id: minted-man-gan-nhan-mu-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx (chung một lượt chạy với E4, E6, E8, E10)
    duration_ms 734.727042

- eval: E10
  run_id: minted-man-gan-nhan-mu-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mgn_app
  verified_at: 2026-10-30T01:52:18Z
  output: |
    cd app && node --import tsx --test tests/labels.test.tsx (chung một lượt chạy với E4, E6, E8, E9)
    duration_ms 734.727042

- eval: E11
  run_id: design-gate-be9b43a44c
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.mgn_gate
  verified_at: 2026-10-30T01:52:18Z
  output: |
    design-gate (P0 floor, --jsdom) chạy lần lượt trên page.tsx, labels-view.tsx, label-form.tsx, agreement-table.tsx; vòng lặp kết thúc thành công, không tệp nào dừng vòng.

- eval: E12
  run_id: minted-man-gan-nhan-mu-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_duong
  verified_at: 2026-10-30T01:52:18Z
  output: |
    DUONG OK

- eval: E13
  run_id: minted-man-gan-nhan-mu-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mgn_pham_vi
  verified_at: 2026-10-30T01:52:18Z
  output: |
    PHAM VI OK

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-man-gan-nhan-mu-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

- cmd: cd app && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

- cmd: cd pipeline && npm test
  run_id: minted-man-gan-nhan-mu-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-man-gan-nhan-mu-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-man-gan-nhan-mu-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T01:52:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Vì baseline bị chặn ở hạ tầng, mọi trường baseline của vòng này là n-a và danh sách eval không-phân-biệt (xanh cả trên code cũ lẫn code mới) KHÔNG đo được ở vòng này.

### Baseline khong do

- node _acceptance/man-gan-nhan-mu/probes/migration.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/man-gan-nhan-mu/probes/mau.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/labels.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/mu.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx ../_acceptance/man-gan-nhan-mu/probes/dong-thuan.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- for f in app/src/app/ops/labels/page.tsx app/src/components/ops/labels/labels-view.tsx app/src/components/ops/labels/label-form.tsx app/src/components/ops/labels/agreement-table.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/man-gan-nhan-mu/probes/duong.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash _acceptance/man-gan-nhan-mu/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E2 failed — probe mau.mjs vi phạm khoá ngoại stg_zalo_posts_snapshot_id_fkey ngay ở bước dựng dữ liệu thử (snapshot_id hanoi__zalo__mgnthu chưa có trong airbnb_snapshots), AC-2 chưa được đo. Returned to implementation.
