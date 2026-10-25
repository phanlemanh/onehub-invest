---
schema_version: 2
feature_slug: nhom-s03-tren-cloud
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1541f1d37e81f364b48a6d6e12e3fd55cb5c749a
human_signoff:
---

# Evidence Report: nhom-s03-tren-cloud

Round 2. Chín eval máy ở trạng thái đạt (E1–E6, E9 chạy lại; E8, E8b mang sang từ round 1 vì delta không chạm paths của chúng). E9 đã chụp đủ sáu khung, lỗi round 1 (công cụ chụp từ chối vì tên nhóm thật) được gỡ. Tổng vẫn là REJECT vì hai lý do, không có eval máy nào trượt nên `failed_evals` để trống: (1) lệnh suite `cd pipeline && npm test` trượt (thoát khác 0) và KHÔNG gắn eval nào — đo ở round này, round 1 lệnh này xanh; (2) E7 (judgment): hội đồng đề xuất FAIL (một lens PASS, hai lens FAIL), chờ người quyết ở Cổng 2. Lệnh trượt không gắn eval: `cd pipeline && npm test`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | judgment | chờ người (hội đồng đề xuất FAIL: 1 lens PASS, 2 lens FAIL) |
| E8 | AC-8 | test | PASS (mang từ round 1) |
| E8b | AC-8 | test | PASS (mang từ round 1) |
| E9 | AC-9 | ui-check | PASS |

## Evidence

- eval: E1
  run_id: minted-nhom-s03-tren-cloud-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E2–E6, một lần chạy; ca «ON4-AC-1 ma trận nhật ký viết trước» và bốn chiều đỏ đều ok)

- eval: E2
  run_id: minted-nhom-s03-tren-cloud-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E1, E3–E6; ca «ON4-AC-2» và năm chiều đỏ đều ok)

- eval: E3
  run_id: minted-nhom-s03-tren-cloud-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E1, E2, E4–E6; hai ca «ON4-AC-3» và hai chiều đỏ đều ok)

- eval: E4
  run_id: minted-nhom-s03-tren-cloud-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E1–E3, E5, E6; hai ca «ON4-AC-4» và chiều đỏ đều ok)

- eval: E5
  run_id: minted-nhom-s03-tren-cloud-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E1–E4, E6; ca «ON4-AC-5» và chiều đỏ đều ok)

- eval: E6
  run_id: minted-nhom-s03-tren-cloud-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T04:58:53Z
  output: |
    cd app && npm test
    ℹ duration_ms 28854.390875
    (lệnh chung với E1–E5; ca «ON4-AC-6» và đối chứng dương đều ok)

- eval: E8
  run_id: minted-nhom-s03-tren-cloud-E8-r1
  exit_code: 0
  verifier: config:executors.test.app
  verified_at: 2026-10-25T04:49:20Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd app && npx tsc --noEmit && npm run lint (round 1: tsc sạch, lint sạch)

- eval: E8b
  run_id: minted-nhom-s03-tren-cloud-E8b-r1
  exit_code: 0
  verifier: config:executors.test.ui_lint_rules
  verified_at: 2026-10-25T04:49:20Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    cd app && npm run test:lint-rules (round 1: xanh)

- eval: E9
  run_id: minted-nhom-s03-tren-cloud-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-10-25T04:58:53Z
  screenshot: evidence/E9-ST-s03-none.png
  observed: |
    none (E9-ST-s03-none.png): trang Thu thập, banner tím «Chỉ đo ở máy thu»; 4 ô KPI «—/Chưa có số»; bảng Sức khoẻ nguồn rỗng; bảng Khoá an toàn 8 lớp «Chỉ kiểm ở máy thu»; cuối trang Alert «Phần còn lại của trang chưa có số trên máy chủ. Cần chú ý, ống S03, xoay vòng, nhóm S03, Luồng 7 ngày, tác vụ đo trực tiếp trên máy thu…». Khớp mô tả.
    fresh (E9-ST-s03-fresh.png): 4 ô KPI có số (4/4, 1.274, 1.414, 3/8); các bảng đầy đủ. Khối «Nhóm S03» có mô tả «Danh mục nguồn cộng đồng — bài thật tách bài thử; danh sách cho phép đang bật 3 nhóm». Cột: Nhóm, Trạng thái, Thấy (nhật ký), Qua cổng, Vào bảng thô, Tài khoản, Bài thật 7 ngày, Bài thử. Trang 1/2 (1–10 của 20) với «Nhóm minh hoạ 1–10»: badge xanh «Hoạt động», cam «Im 3 ngày/Im 71h», trắng «Chưa thấy tin». Chân bảng có chú thích «Qua cổng = cổng Kev ≥ 0,9…». Alert «Phần còn lại…» nằm ngay dưới và không còn nhắc nhóm S03. Khớp.
    stale (E9-ST-s03-stale.png): banner vàng «Máy thu không đẩy số từ 2026-10-25 11:14». Thanh tiến trình trong KPI xám, badge «Đạt» trong bảng nguồn không có màu. Bảng «Nhóm S03 · Cộng đồng» có mô tả «đang bật 3 nhóm», badge «Hoạt động» viền xám, trắng nền (không xanh); chân bảng đủ. Khớp.
    dark (E9-dark-ST-s03-fresh.png): giao diện tối đầy đủ, nền tối, chữ rõ; bảng «Nhóm S03 · Cộng đồng» có mô tả «đang bật 3 nhóm», badge xanh/cam đúng màu tối, cột «Vào bảng thô», chân bảng; không tràn. Khớp.
    narrow (E9-narrow-ST-s03-fresh.png): 390px, các thẻ KPI xếp một cột; bảng nhóm hiện cột Nhóm + Trạng thái, phân trang «1–10 / 20» và chú thích ở dưới; không thanh cuộn ngang. Khớp.
    local (E9-ST-s03-local.png): bố cục máy thu (không banner), thẻ Luồng 7 ngày, Cần chú ý, ống S03, Vòng thu S02. Bảng «Nhóm S03» mô tả «danh sách cho phép đang bật 3 nhóm», cột «Vào bảng thô», ba dòng: mã 9000000000000000003 (xuống dòng giữa số), «Nhóm minh hoạ B», «Nhóm minh hoạ A», đều «Hoạt động». Chân bảng: «Qua cổng = cổng Kev ≥ 0,9 (mã nhóm, chưa phép tên): 000001, 000002, 000003…». Tên nhóm đều giả. Khớp.
  network_observed: n-a (driver)
  output: |
    Ghi chú thẩm mỹ, không làm hỏng expected: (a) ở bảng nhóm, biểu tượng sắp xếp của «Thấy (nhật ký)» và «Vào bảng thô» chạm sang tiêu đề cột kế bên («Qua cổng», «Tài khoản»); (b) ở máy thu, dòng nhóm chỉ có mã nhật ký hiện nguyên 19 chữ số và xuống dòng giữa số; (c) ở 390px bảng nhóm chỉ lộ cột Nhóm và Trạng thái, các cột còn lại nằm trong vùng cuộn riêng của bảng.
    Dọn: tắt cả hai dev server (không còn cổng 3460/3461 mở); git checkout app/next-env.d.ts; xoá app/AGENTS.md (do dev server sinh); node scripts/ops-cloud-proto.mjs --drop.
    Network: driver là playwright-cli qua script chụp, không có đường đọc network/console nên không có E9-network.txt.

- eval: E7
  judged_by: hội đồng 3 lens (domain-correctness, operational-feasibility, spec-alignment)
  proposal: FAIL (đề xuất của hội đồng: 1 lens PASS, 2 lens FAIL; chờ người quyết ở Cổng 2)
  votes:
    - domain-correctness: PASS — Bốn trạng thái ST-s03-* khớp chữ thật trong mã, và các điểm hỏi đều sạch. Khối s03 vắng, lỗi hoặc sai khuôn (`toCloudS03`) thì trả null: bảng không dựng, «nhóm S03» ở lại Alert gom, không hiện «0 nhóm». «Vào bảng thô» thiếu số thì ghi «—» (`accepted` null ở cả `parseLog`, `gateByGroup` và `toCloudS03`). Khối s03 chỉ mang tên nhóm cùng các số đếm, không có mã nhóm hay `ownerAccount` (bộ lọc `isId` đổi tên dạng mã thành null, chân bảng máy chủ ghi «mã nhóm chỉ xem ở máy thu»). Khi khối cũ, badge «Hoạt động» chuyển sang `outline` thay vì `success-light`. Chuỗi hiển thị chỉ dùng «máy thu»/«máy chủ» đúng CONTEXT; «cloud»/«local» chỉ là tên prop và import trong mã. Lưu ý nhỏ, không đổi kết luận: bảng chưa làm mờ số khi khối cũ như câu «số cũ vẫn hiện nhưng mờ» của ADR-0014, nhưng bảng ST-s03-stale của đặc tả chỉ đòi Alert và badge viền xám. Cột «Tài khoản» trên máy chủ luôn ghi «—», không lộ định danh.
    - operational-feasibility: FAIL — Phía máy chủ khớp đặc tả. Khối s03 và bảng máy chủ không mang mã nhóm hay tên tài khoản, không hiện «0 nhóm» khi vắng khối, ô thiếu ghi «—», badge «Hoạt động» chuyển viền xám khi cũ, và chữ giao diện dùng «máy thu/máy chủ». Nhưng ở máy thu, `readZaloAllowlist` (app/src/lib/collections-queries.ts, dòng 404-413) trả `[]` khi không đọc được `~/.openclaw/openclaw.json`, và `ZaloGroupsTable` (collections-tables.tsx, dòng 273) ghi «đang bật 0 nhóm». Đó là «0 khi không có số» mà câu hỏi cấm. Bên ghi thì ném lỗi trong trường hợp này (push-ops-facts.mjs, dòng 231).
    - spec-alignment: FAIL — Bốn trạng thái ST-s03-* khớp phần lớn. Khối s03 không mang mã nhóm hay tên tài khoản. Bảng máy chủ không có «0 nhóm», «0», chữ «cloud» hay «local» trên giao diện, và badge «Hoạt động» chuyển viền xám khi cũ. Chỗ lệch: ADR-0014 §Ngưỡng trễ mức «Cũ» đòi số cũ vẫn hiện nhưng mờ, mà `ZaloGroupsTable` ở `collections-tables.tsx` khi `cloud.stale` chỉ đổi badge, còn các ô seen/passed/«Vào bảng thô»/bài thật vẫn là `fmtInt` thường. `CloudFlowTable` cùng trang thì có làm mờ qua `cloudCount`. Đặc tả ST-s03-stale không nêu việc làm mờ, nên lệch này nằm giữa ADR và đặc tả.
  required_evidence:
    - (operational-feasibility) Sửa `readZaloAllowlist` (app/src/lib/collections-queries.ts, dòng 404-413) để trả null hoặc báo lỗi khi cấu hình không đọc được. Sửa mô tả ở app/src/components/ops/collections-tables.tsx dòng 273 để ghi «—» hoặc «chưa đọc được danh sách» thay vì «0 nhóm». Đính kèm một test trong app/tests/nhom-s03-tren-cloud.test.tsx: trỏ HOME sang thư mục tạm không có openclaw.json, render ZaloGroupsTable ở máy thu, khẳng định không có chuỗi «0 nhóm».
    - (operational-feasibility) Hoặc một mục trong đặc tả/contract nói rõ trạng thái ST-s03-local khi không đọc được cấu hình (chấp nhận hiện «0» ở đó), kèm chữ ký của Mạnh. Có mục này thì kết luận 0 là kết quả đã chấp thuận và lens này đổi sang PASS.
    - (spec-alignment) Trong `app/src/components/ops/collections-tables.tsx`, các ô số của `ZaloGroupsTable` (seen, passed, accepted, real7, mock7) phải mờ (text-muted-foreground) khi `cloud?.stale` là true, như `cloudCount` làm ở `CloudFlowTable`. Lệnh kiểm: chụp hoặc render `/ops/collections` bản máy chủ với khối s03 có measured_at cũ hơn 45′ rồi xem DOM các ô số.
    - (spec-alignment) Hoặc một câu trong `docs/superpowers/specs/2026-10-25-nhom-s03-tren-cloud-design.md` (ST-s03-stale hoặc §4 Hành vi) ghi rõ bảng nhóm S03 được miễn «số mờ» của ADR-0014 §Ngưỡng trễ mức «Cũ», với Mạnh chốt hoặc ADR sửa kèm theo.
    - (spec-alignment) Nếu `app/src/lib/ops-facts.ts` cho thấy `FactsStaleAlert` (theo `cloud.state` toàn bản tin) và `s03.stale` (theo `state` của khối) có thể lệch nhau, thì phải có ca kiểm xác nhận không xảy ra trường hợp badge xám mà không có Alert vàng.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T04:58:53Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhom-s03-tren-cloud-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-25T04:58:53Z

- cmd: cd pipeline && npm test
  run_id: minted-nhom-s03-tren-cloud-SUITE-npm_test__13563d-r2
  exit_code: 1
  verified_at: 2026-10-25T04:58:53Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhom-s03-tren-cloud-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T04:58:53Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhom-s03-tren-cloud-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-25T04:58:53Z

Ghi chú lệnh suite trượt `cd pipeline && npm test` (không gắn eval nào): hai ca trượt thấy trong đoạn cuối đầu ra. Ca ở `pipeline/scripts/ops-facts-so-tong-hop.test.mjs` dòng 282 so sánh danh sách độ tươi nguồn bằng deepStrictEqual và lệch. Ca «AC-9 stg không đổi» ở `pipeline/scripts/test-posts.test.mjs` dòng 227 thấy bảng stg đổi từ 6117 lên 6126 dòng (băm đổi theo). Cả hai đọc DB local dùng chung :5433 nên dấu hiệu là dữ liệu local đổi giữa lúc chạy, chưa chứng minh được nguyên nhân; round 1 lệnh này xanh. Cần người xác định đây là nhiễu dữ liệu local hay lỗi do thay đổi của vòng.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline, chứng minh harness chứ chưa chứng minh tính năng; nên viết lại để assert hành vi mới, hoặc xác nhận là regression-guard có chủ ý):

- `cd app && npm test` — E1, E2, E3, E4, E5, E6 (baseline green)

E9 không đo được trên baseline (baseline n-a).

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E9 không đạt — công cụ chụp `scripts/ui-capture.sh` từ chối chụp mọi trang có khối nhóm S03 vì danh sách che tầng A vẫn nạp tên nhóm, trong khi tên nhóm S03 là tầng C từ 24/10 (ADR-0007); chỉ có khung ST-s03-none. Trả về triển khai (khối s03 báo lỗi khi không đọc được nhật ký cổng; E9 chụp trên tên nhóm giả) rồi chấm lại.
Round 2: E1–E6 và E9 đạt (E9 có đủ sáu khung, tên nhóm giả); E8, E8b mang từ round 1. Tổng vẫn REJECT: lệnh suite `cd pipeline && npm test` trượt và không gắn eval nào (xanh ở round 1); E7 hội đồng đề xuất FAIL (máy thu ghi «đang bật 0 nhóm» khi không đọc được cấu hình OpenClaw; bảng nhóm không làm mờ số khi khối cũ theo ADR-0014). Chờ người quyết ở Cổng 2 hoặc trả về triển khai.
