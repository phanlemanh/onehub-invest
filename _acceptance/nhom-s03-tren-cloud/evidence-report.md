---
schema_version: 2
feature_slug: nhom-s03-tren-cloud
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0ea22f486b9225cd6d19870f8f97dc1a9bb0ec80
human_signoff:
---

# Evidence Report: nhom-s03-tren-cloud

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | PASS (hội đồng đề xuất; T3 chờ người xác nhận trực tiếp) |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E9 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-s03-tren-cloud-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E2
  run_id: minted-nhom-s03-tren-cloud-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E3
  run_id: minted-nhom-s03-tren-cloud-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E4
  run_id: minted-nhom-s03-tren-cloud-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E5
  run_id: minted-nhom-s03-tren-cloud-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E6
  run_id: minted-nhom-s03-tren-cloud-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm test (một lần chạy gộp cho E1-E6)
    ℹ duration_ms 19934.239667

- eval: E8
  run_id: minted-nhom-s03-tren-cloud-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npx tsc --noEmit && npm run lint
    tsc sạch, lint sạch (không in cảnh báo nào)

- eval: E8b
  run_id: minted-nhom-s03-tren-cloud-E8b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T05:42:55Z
  output: |
    lệnh: cd app && npm run test:lint-rules
    ℹ duration_ms 197.794333

- eval: E9
  run_id: minted-nhom-s03-tren-cloud-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T05:42:55Z
  screenshot: evidence/E9-ST-s03-none.png
  observed: |
    E9-ST-s03-none.png: trang /ops/collections cuộn xuống cuối; khối «Khoá an toàn & hạ tầng thu» («Chưa có số từ máy thu», 8 lớp đều «Chỉ kiểm ở máy thu») và dưới cùng Alert tím «Phần còn lại của trang chưa có số trên máy chủ — Cần chú ý, ống S03, xoay vòng, nhóm S03, Luồng 7 ngày, tác vụ đo trực tiếp trên máy thu — xem ở cổng Ops trên máy thu.» Đúng trạng thái none.
    E9-ST-s03-fresh.png: bảng nhóm S03, mô tả «Danh mục nguồn cộng đồng — bài thật tách bài thử; danh sách cho phép đang bật 3 nhóm»; cột Nhóm, Trạng thái, Thấy (nhật ký), Qua cổng, Vào bảng thô, Tài khoản, Bài thật 7 ngày, Bài thử; 10 dòng/20 mang tên «Nhóm minh hoạ N» (tên giả); badge «Hoạt động» màu xanh lá, «Im 3 ngày/71h/4 ngày» vàng, «Chưa thấy tin» viền đen; chân bảng «Qua cổng = cổng Kev ≥ 0,9 … Nhóm im quá 72h … Nguồn dữ liệu»; Alert «Phần còn lại…» bên dưới. Không tên thật.
    E9-ST-s03-stale.png: cùng bảng; badge «Hoạt động» chuyển thành viền xám/trung tính (không còn xanh), số liệu mờ hơn so với fresh; «Im …» vẫn vàng. Khớp «Hoạt động viền xám».
    E9-dark-ST-s03-fresh.png: nền tối, cùng bảng fresh, mô tả «đang bật 3 nhóm», cột «Vào bảng thô», chân bảng; badge «Hoạt động» xanh trên nền tối, chữ đọc được; Alert tím viền tối.
    E9-narrow-ST-s03-fresh.png: khung 390px, mô tả «đang bật 3 nhóm» xuống dòng, bảng hiện cột Nhóm/Trạng thái và cuộn ngang trong khung bảng, phân trang 1/2 + «1–10 / 20» + «Số dòng 10» xếp dọc, chân bảng và Alert vừa khung; trang không cuộn ngang (scrollWidth 390 = innerWidth 390).
    E9-ST-s03-local.png: máy thu (không VERCEL): bảng nhóm S03, mô tả «đang bật 3 nhóm», cột «Vào bảng thô» có số (1 / — / 5), 3 dòng: mã «9000000000000000003» (nhóm chưa có tên), «Nhóm minh hoạ B», «Nhóm minh hoạ A», đều «Hoạt động» xanh; chân bảng «danh sách cho phép (mã nhóm, chưa ghép tên): 000001, 000002, 000003» (mã rút gọn); bên dưới khối «Máy móc» với dòng «Cổng nhận tin :9210 — Sống». Khớp expected.
  network_observed: n-a (driver)
  output: |
    Sáu khung: E9-ST-s03-none.png, E9-ST-s03-fresh.png, E9-ST-s03-stale.png, E9-dark-ST-s03-fresh.png, E9-narrow-ST-s03-fresh.png, E9-ST-s03-local.png; thêm E9-network.txt (nhật ký HTTP phía máy chủ dev, không có dòng lỗi).
    Ghi chú nhỏ, không làm hỏng expected: trong mọi khung bảng có thanh cuộn ngang nội bộ chạm mép dưới dòng cuối (rõ ở dòng 10 mode fresh và dòng «Nhóm minh hoạ A» mode local) — hình thức, nhất quán với khung bảng sẵn có. Driver là playwright-cli, không có đường đọc network/console của trình duyệt.

### Judgment

- eval: E7
  judged_by: hội đồng 3 lens (domain-correctness, operational-feasibility, spec-alignment), fresh context
  verdict: PASS
  rationale: Cả ba lens đề xuất PASS; T3 nên bước cuối là người xác nhận trực tiếp.
  human_override:  # chi nguoi ghi

  Phiếu từng lens:
  - domain-correctness: PASS — Bốn trạng thái ST-s03-* khớp với chữ thật của bảng nhóm S03 ở máy chủ và máy thu. Khối `s03` chỉ mang số đếm và tên nhóm (tầng C), không mang mã nhóm hay tên tài khoản thu. Chỗ nào không có số đều ra «—» thay vì 0, và không còn badge xanh khi số đã cũ. Giao diện không có chữ «cloud»/«local» sót lại. ST-s03-none: `toCloudS03` trả null khi khối vắng, lỗi hay sai khuôn; `CloudCollections` khi đó không dựng bảng, «nhóm S03» ở lại Alert gom, máy chủ không có đường nào ra «0 nhóm». ST-s03-fresh: mô tả bảng ghi «danh sách cho phép đang bật N nhóm» với N lấy từ khối; chân bảng ghi «mã nhóm chỉ xem ở máy thu» và không liệt kê mã nào; «Vào bảng thô» là null thì ra «—»; bên ghi gán `accepted: null` khi nhóm đã qua cổng mà nhật ký không có số tin vào, và khi nhật ký không đọc được thì cả khối báo lỗi. ST-s03-stale: `groupStatusBadge` dùng viền xám (`outline`) thay `success-light`, `cloudCount` làm mờ các ô số; Alert vàng 45′ do `FactsStaleAlert` hiện, đúng ADR-0014 §Ngưỡng trễ. ST-s03-local: `readZaloAllowlist` trả null khi cấu hình không đọc được (mô tả ghi «—»); khi đọc được nó dùng `effectiveEnabledGroups` (hợp các nhóm bật hiệu dụng của mọi tài khoản); `gateByGroup` và `parseLog` cùng quy tắc cộng `accepted`. Định danh: tên nhóm trông như mã (chuỗi số từ 15 chữ số, hoặc trùng mã trong cấu hình) bị đổi thành null và hiện «Nhóm chưa có tên»; `cloud.ts` đặt `ownerAccount: null` nên cột «Tài khoản» ra «—»; `factsChan` chỉ miễn soát tầng A cho đường dẫn `.name` của nhóm S03. Nhãn: chữ giao diện dùng «máy thu»/«máy chủ» đúng `CONTEXT.md`; «cloud»/«local» chỉ nằm trong comment và tên biến, «Vào bảng thô» giữ nguyên. Hai chỗ nằm ngoài phạm vi bảng máy chủ và khối `s03`, đã ghi nhận: `zaloAccounts[].enabledGroups` vẫn mang mã nhóm lên máy chủ như trước, và `zaloGroups[].ownerAccount` ở cấp ngoài của bản tin cũng vậy.
  - operational-feasibility: PASS — Khớp bảng ST-s03-* và không lộ định danh, đọc trên mã nguồn. Máy thu: cấu hình hoặc nhật ký không đọc được thì N và các cột đọc từ nhật ký hiện «—» (`readZaloAllowlist` trả null, `getZaloGroups` đặt null, `accepted` null khi đã qua cổng mà không có số). Máy chủ: `toCloudS03` trả null khi khối vắng, lỗi hay sai khuôn, nên bảng không dựng và «nhóm S03» ở lại Alert gom, không bao giờ «0 nhóm»; `accepted` thiếu thì «—». Khối `s03` chỉ mang tên nhóm và số đếm, tên là chuỗi số dài hay trùng mã nhóm thì thành null («Nhóm chưa có tên»), `ownerAccount` không lên máy chủ, chân bảng ghi «mã nhóm chỉ xem ở máy thu». Khối cũ: «Hoạt động» chuyển sang `outline`, ô số mờ. Chữ giao diện chỉ dùng «máy thu»/«máy chủ», không còn «cloud»/«local».
  - spec-alignment: PASS — Bốn trạng thái ST-s03-* khớp với chữ thật trong code. (1) Không có chỗ nào hiện «0 nhóm» hay «0» khi không có số: khối s03 vắng, lỗi hoặc sai khuôn thì `toCloudS03` trả null, bảng không dựng và «nhóm S03» ở lại Alert gom; máy thu không đọc được cấu hình thì ghi «—»; khối `s03` báo lỗi khi không đọc được nhật ký cổng; `accepted` thiếu thì là null và ô ghi «—». (2) Khối s03 bên ghi và bảng máy chủ không mang mã nhóm hay tên tài khoản: hàng chỉ có tên nhóm (tầng C); tên là chuỗi số dài, `group:…` hoặc trùng mã trong cấu hình thì thành null, bảng ghi «Nhóm chưa có tên»; `ownerAccount` ở máy chủ luôn null, chân bảng ghi «mã nhóm chỉ xem ở máy thu», và `factsChan` chặn `zaloAccounts[].name`. (3) Khối cũ không còn badge xanh: «Hoạt động» chuyển sang `outline`, các badge khác là outline hoặc `warning-light`. (4) Chữ hiển thị dùng «máy thu» và «máy chủ»; «cloud»/«local» chỉ nằm trong comment và tên prop, không có trong chuỗi giao diện.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-25T05:42:55Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-25T05:42:55Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-s03-tren-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-25T05:42:55Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay (evals.yaml không đổi từ lần đo baseline cuối).

Baseline khong do: mọi eval máy ghi baseline n-a ở round này.

Eval không phân biệt (xanh cả trên nhánh lẫn baseline đã đo ở round 2, chứng minh harness hơn là tính năng): lệnh `cd app && npm test` — E1, E2, E3, E4, E5, E6. Viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9 không đạt — công cụ chụp từ chối chụp trang có khối nhóm S03 nên chỉ có khung ST-s03-none; khối s03 còn nuốt lỗi đọc nhật ký cổng. Trả về triển khai (khối s03 báo lỗi khi không đọc được nhật ký cổng; E9 chụp trên tên nhóm giả).
Round 2: E1–E6 và E9 đạt; tổng vẫn REJECT vì lệnh suite `cd pipeline && npm test` trượt (DB local đổi giữa lượt) và hội đồng E7 đề xuất không đạt (máy thu ghi «đang bật 0 nhóm» khi không đọc được cấu hình; bảng nhóm chưa làm mờ số khi khối cũ). Trả về triển khai (đổi khuôn: mọi đường đọc của bảng nhóm S03 không đọc được thì «—», số cũ mờ).
Round 3: toàn bộ eval máy và ba lệnh suite đạt; E9 đủ sáu khung; hội đồng E7 đề xuất PASS ở cả ba lens. T3 nên mọi mục judgment chờ người xác nhận trực tiếp ở Cổng 2 — verdict PENDING-JUDGMENT.
