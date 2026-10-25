---
schema_version: 2
feature_slug: nhom-s03-tren-cloud
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1c02ea19cbce833926ae6f1aa11dfe2e13a1cc32
human_signoff:
---

# Evidence Report: nhom-s03-tren-cloud

Round 1. Tám eval máy đạt (E1–E6, E8, E8b), E9 (ui-check) không đạt nên tổng là REJECT. E7 (judgment) chờ người: hội đồng đề xuất PASS nhưng một lens (spec-alignment) còn UNCERTAIN. Không có lệnh fail nào không gắn eval: lệnh duy nhất fail là `ui-check:E9`, đã gắn E9.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | chờ người (hội đồng đề xuất PASS, một lens UNCERTAIN) |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | FAIL |

## Evidence

- eval: E1
  run_id: minted-nhom-s03-tren-cloud-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E2–E6, một lần chạy, mọi ca xanh)

- eval: E2
  run_id: minted-nhom-s03-tren-cloud-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E1, E3–E6)

- eval: E3
  run_id: minted-nhom-s03-tren-cloud-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E1, E2, E4–E6)

- eval: E4
  run_id: minted-nhom-s03-tren-cloud-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E1–E3, E5, E6)

- eval: E5
  run_id: minted-nhom-s03-tren-cloud-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E1–E4, E6)

- eval: E6
  run_id: minted-nhom-s03-tren-cloud-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm test
    ℹ duration_ms 25249.144167
    (lệnh chung với E1–E5)

- eval: E8
  run_id: minted-nhom-s03-tren-cloud-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch

- eval: E8b
  run_id: minted-nhom-s03-tren-cloud-E8b-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T04:49:20Z
  output: |
    cd app && npm run test:lint-rules
    ℹ duration_ms 202.339916

- eval: E9
  run_id: minted-nhom-s03-tren-cloud-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T04:49:20Z
  screenshot: evidence/E9-ST-s03-none.png
  observed: |
    Chỉ có MỘT khung được lưu: E9-ST-s03-none.png (đã mở bằng Read, 1280x2400). Khung này đúng: /ops/collections ở chế độ none, breadcrumb Vận hành > Thu thập, Alert tím «Chỉ đo ở máy thu», bốn thẻ «Chưa có số» (Khoá an toàn có Badge vàng «Chưa kiểm được trên máy chủ»), bảng «Sức khoẻ nguồn» rỗng «Chưa có dữ liệu», bảng «Khoá an toàn & hạ tầng thu» 8 dòng cùng Badge «Chỉ kiểm ở máy thu», và ở cuối Alert «Phần còn lại của trang chưa có số trên máy chủ» (Cần chú ý, ống S03, xoay vòng, nhóm S03, Luồng 7 ngày, tác vụ đo trực tiếp trên máy thu). Không có bảng nhóm S03 (đúng cho trạng thái none). Không thấy thanh cuộn ngang; công cụ báo vùng cuộn 1040 = nội dung 1040. Các khung fresh, stale, dark-fresh, narrow-fresh và local KHÔNG tồn tại: capture.ui (scripts/ui-capture.sh) từ chối chụp, thoát 5 «tầng A còn lộ sau khi che (3 tên) — không chụp», nên không có khung nào cho các dòng ST-s03-fresh/stale/local, khung tối và khung 390px. Lượt chấm không vòng qua rào này vì chụp bằng công cụ khác sẽ đưa tên tầng A thật vào bằng chứng.
  network_observed: n-a (driver)
  output: |
    1. [PASS] Lược đồ none dựng xong, dev server :3460 (VERCEL=1, search_path=ops_cloud_proto) lên, GET /login 200, đăng nhập ops thử thành công.
    2. [PASS] ST-s03-none: khung E9-ST-s03-none.png có Alert «Phần còn lại…». Chụp với UI_CAPTURE_SIZE=1280x2400. Bề rộng: khung 1280, vùng cuộn 1040, nội dung 1040.
    3. [FAIL] ST-s03-fresh: capture.ui rc=5 «tầng A còn lộ sau khi che (3 tên) — không chụp», không có khung E9-ST-s03-fresh.png.
    4. [FAIL] ST-s03-stale: rc=5, cùng lý do, không có khung.
    5. [FAIL] Khung tối (E9-dark-ST-s03-fresh.png) và 390px (E9-narrow-ST-s03-fresh.png) không chụp được vì cùng rào trên trang fresh; phép kiểm scrollWidth <= innerWidth ở 390px không chạy.
    6. [FAIL] ST-s03-local (:3461, DB local không VERCEL): rc=5, cùng rào, không có khung E9-ST-s03-local.png.
    Nguyên nhân gốc (đo, không in tên thật): khối blocks.s03.groups trong bản tin do push-ops-facts dựng từ DB local mang tên nhóm thật (4 tên trong tập 12 tên của scripts/ui-standards/tier-a-names.mjs, ở blocks.s03.groups.1/5/7/12.name và zaloGroups). tier-a-names.mjs vẫn nạp source_groups.name và group_key vào danh sách che; app không đánh data-tier-a cho cột tên nhóm vì tên nhóm S03 là tầng C từ 24/10 (ADR-0007). Mâu thuẫn: công cụ chụp coi các tên này là tầng A và chặn, trong khi bảng hiện chúng. Đây cũng là lệch với eval: E9 mô tả «tên nhóm giả» nhưng ops-cloud-proto chỉ dựng log giả (demoHome); danh sách nhóm vẫn lấy từ source_groups local.
    Kiểm DOM thay cho khung, qua HTTP có đăng nhập, chỉ in marker và số đếm:
    - fresh (:3460): HTTP 200; «đang bật» có; mô tả «đang bật 3 nhóm»; «Vào bảng thô» có; «Hoạt động» có; «Phần còn lại của trang» có; «Nhóm chưa có tên» KHÔNG có.
    - local (:3461): HTTP 200; mô tả «đang bật 7 nhóm»; «Vào bảng thô» có; «Hoạt động» có; «Phần còn lại của trang» không có (đúng cho máy thu); «Nhóm chưa có tên» KHÔNG có.
    Phép kiểm DOM không thay được khung nên eval vẫn không đạt.
    Network: driver là capture-only, không có E9-network.txt.
    Dọn dẹp: đã tắt hai dev server của lượt chấm, xoá lược đồ ops_cloud_proto, git status chỉ còn du-bao.json và thư mục evidence/.

- eval: E7
  judged_by: hội đồng 3 lens (domain-correctness, operational-feasibility, spec-alignment)
  proposal: PASS (đề xuất; một lens còn UNCERTAIN, chờ người quyết)
  votes:
    - domain-correctness: PASS — Trong các file đầu vào, bảng nhóm S03 khớp bảng trạng thái ST-s03-*. Không có khối s03 thì `toCloudS03` trả null, không dựng bảng, và «nhóm S03» ở lại Alert gom, nên không bao giờ hiện «0 nhóm». Trường thiếu hiện «—» (`accepted` null). Khối `s03` chỉ có tên nhóm (tầng C) và số đếm, tên là chuỗi số dài hoặc trùng mã trong cấu hình thì đổi thành null, và `ownerAccount` đặt null. Chân bảng máy chủ ghi «mã nhóm chỉ xem ở máy thu». Số cũ không có badge xanh («Hoạt động» chuyển viền xám), và giao diện bảng/trang không còn chữ «cloud»/«local» (dùng «máy thu»/«máy chủ»). Chưa kiểm được chữ của `FactsStamp`/`FactsStaleAlert` (ngoài danh sách đầu vào) và `zaloAccounts[].enabledGroups` đã mang mã nhóm lên từ trước (đặc tả có nói rõ, nằm ngoài khối s03), nên hai chỗ này không tính vào phán quyết.
    - operational-feasibility: PASS — Trong các file đầu vào, `toCloudS03` trả null khi khối vắng, lỗi hoặc sai khuôn, nên bảng không dựng và «nhóm S03» ở lại Alert gom (ST-s03-none), không có «0 nhóm». `accepted` thiếu hoặc null hiện «—». Khối `s03` bên ghi chỉ mang tên nhóm và các số đếm: mã nhóm dạng số dài, `group:` hoặc trùng cấu hình bị đổi thành `name: null` («Nhóm chưa có tên»), không có tên tài khoản, và `ownerAccount` ở máy chủ luôn là null. Khi số cũ, badge «Hoạt động» chuyển sang `outline` (không xanh), chân bảng máy chủ ghi «mã nhóm chỉ xem ở máy thu», và chữ giao diện trong các file này chỉ dùng «máy thu» và «máy chủ», không có «cloud» hay «local». Phần chưa xác minh được từ danh sách đầu vào: trang máy thu tính N bằng `readZaloAllowlist` và `gateByGroup` (không có trong danh sách). Các hàng trong bảng hiện vẫn chạy qua `FactsStaleAlert` nhưng file đó cũng không có trong danh sách. Hai điểm này không đủ để chặn.
    - spec-alignment: UNCERTAIN — Trong các file được liệt kê, phía máy chủ khớp bảng trạng thái. Khối `s03` không mang mã nhóm hay tên tài khoản (`ownerAccount: null`, chân bảng ghi «mã nhóm chỉ xem ở máy thu»). Khối vắng thì không dựng bảng và `nhóm S03` ở lại Alert gom, nên không có «0 nhóm». `accepted` thiếu thì ô ghi «—», và badge «Hoạt động» chuyển sang `outline` khi khối cũ. Tuy vậy, nửa máy thu của ST-s03-local và chữ của `FactsStamp`/`FactsStaleAlert` nằm ngoài danh sách input, nên chưa đủ căn cứ để PASS.
  required_evidence:
    - Nửa máy thu của ST-s03-local: nội dung `readZaloAllowlist` và `gateByGroup` trong /Users/manhphan/dev/onehub-invest/.claude/worktrees/bold-bassi-0e7f42/app/src/lib/collections-queries.ts, cùng `effectiveEnabledGroupIds` trong app/src/lib/zalo-admin.ts, để xác nhận «đang bật N nhóm» và «Vào bảng thô» ở máy thu đúng như đặc tả. Ba file này không có trong danh sách input.
    - Chữ thật mà `FactsStamp` và `FactsStaleAlert` hiện trên máy chủ, trong app/src/components/ops/facts-status.tsx. Cần xem hai component này không còn chữ «local»/«cloud» (ADR-0014 còn viết «từ máy local» còn CONTEXT.md đã chốt «máy thu»). Cần xem luôn Alert 45′ lấy `state` của khối `s03` (spec §4) hay `state` chung (`cloud.state` trong collections-view.tsx). File này không có trong danh sách input.
    - Nếu muốn khẳng định không mất thông tin khi nhật ký Zalo không đọc được: một ca đo trên `zaloExtras`/`parseLog` (pipeline/push-ops-facts.mjs dòng 95-118) cho nhóm chỉ có trong DB mà vắng trong nhật ký. Hiện nhóm này có `seen`/`passed`/`accepted` = 0, không phải `null`, nên máy chủ hiện «0» chứ không hiện «—» dù không đo được.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-25T04:49:20Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-25T04:49:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-s03-tren-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-25T04:49:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — E1, E2, E3, E4, E5, E6 (baseline green)
- `cd app && npm run test:lint-rules` — E8b (baseline green)

E8 là eval có phân biệt (baseline red). E9 không đo được trên baseline (baseline n-a).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9 không đạt — công cụ chụp `scripts/ui-capture.sh` từ chối chụp mọi trang có khối nhóm S03 vì danh sách che tầng A (`scripts/ui-standards/tier-a-names.mjs`) vẫn nạp tên nhóm, trong khi tên nhóm S03 là tầng C từ 24/10 (ADR-0007); chỉ có khung ST-s03-none, thiếu khung fresh/stale/local, khung tối và 390px. Trả về triển khai (đồng bộ danh sách che với ADR-0007 hoặc dựng dữ liệu nhóm giả cho phép đo) rồi chấm lại.
