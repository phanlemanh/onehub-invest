---
schema_version: 2
feature_slug: gan-nhan-theo-nhom-s03
verdict: REJECT
failed_evals: [E4]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 63d6c75c3d7a54a961fab1104bb86634dc8d8bdf
human_signoff:
---

# Evidence Report: gan-nhan-theo-nhom-s03

Round 3. Nội dung thay toàn bộ round cũ; lịch sử round nằm ở mục Iterations.

Lệnh fail không gắn eval: không có. Lệnh ui-check của E4 kết thúc khác không và đã gắn vào E4. Phần giao diện của E4 đạt hết Expected; chỉ luật network của eval ui-check làm E4 đỏ (xem khối E4).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | ui-check | FAIL |
| E5 | AC-3 | test | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | ui-check | PASS |
| E9 | AC-6 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-9 | script | PASS |
| E13 | AC-9 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | script | PASS |
| E16 | AC-10 | script | PASS |
| E17 | AC-7 | ui-check | PASS |
| E18 | AC-8 | script | PASS |
| E19 | AC-11 | test | PASS |
| E20 | AC-12 | test | PASS |
| E21 | AC-13 | script | PASS |
| E22 | AC-14 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-gan-nhan-theo-nhom-s03-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_migration
  verified_at: 2026-11-04T12:14:29Z
  output: |
    MIGRATION OK

- eval: E21
  run_id: minted-gan-nhan-theo-nhom-s03-E21-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_migration
  verified_at: 2026-11-04T12:14:29Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-gan-nhan-theo-nhom-s03-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mau
  verified_at: 2026-11-04T12:14:29Z
  output: |
    MAU OK

- eval: E3
  run_id: minted-gan-nhan-theo-nhom-s03-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 59.252375

- eval: E4
  run_id: minted-gan-nhan-theo-nhom-s03-E4-r3
  exit_code: 1
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T12:14:29Z
  screenshot: evidence/E4-step1.png
  observed: |
    E4-step1.png (1440x900 sáng): bộ chọn nhóm «GCN thử có máy đọc» kèm tiến độ 0/2, bài gốc, câu hướng dẫn mới, các khối Tin, Vị trí, Căn, Giá, Người bán hai cột, ô Lý do; 17 hàng đủ, nút «Lưu và xem máy đọc» nằm trong màn, không cuộn. Nút Chủ/Nhóm/Nghề (Chủ đang chọn) nhìn rõ.
    E4-step1b: bài dài gấp còn 3 dòng, có «Xem hết bài», bấm ra đủ 5 dòng, thẻ bài dính trên cùng khi cuộn. E4-step2: chọn nhóm «GCN thử chưa có máy» chỉ còn bài của nhóm, tiến độ 0/1.
    E4-step3 (390x844 tối): một cột, không tràn ngang (khung 390 = nội dung 390), trạng thái đã chọn nhìn rõ trên nền tối. E4-step4: Lý do trống có viền đỏ, nhãn «Lý do (bắt buộc)», câu báo ngay dưới ô «Có trường không từ chữ bài — ghi lý do», chữ đã gõ còn nguyên, không sang lượt hai. Không thấy chuỗi cũ «Ghi theo đúng chữ của tin». Khớp Expected về giao diện; chỉ vi phạm luật network (POST lưu bị từ chối 4xx do Lý do trống, có chủ ý).
  network_observed: app-fail
  output: |
    Kết luận của người chạy: phần giao diện đạt hết Expected; eval đỏ CHỈ vì luật network. Không sửa code.
    Bản chạy: dev server worktree cổng 3460 (DB thử oneinvest_gcn_nhan), seed bằng probes/seed.mjs, đã tắt server sau khi xong.
    Assertion bằng DOM: 17 hàng (16 hàng có nhóm «căn cứ» và hàng Nhiều căn), cả 17 nằm trong 1440x900, nút Lưu trong màn, không cuộn; câu hướng dẫn đúng chuỗi mới, chuỗi cũ không còn; bộ chọn nhóm đúng tiến độ riêng từng nhóm; khổ 390 không tràn ngang, có cả nền sáng lẫn tối; Lý do trống báo lỗi đúng ô (aria-invalid, thông điệp role=alert ngay dưới ô), giá trị đã gõ giữ nguyên.
    Network (evidence/E4-network.txt): phản hồi lỗi có chủ ý của bước Lý do trống (route lưu từ chối 4xx trên origin của dev server). Expected của E4 không khai trạng thái này nên theo luật network eval bị đỏ; không có lỗi 5xx hay lỗi kết nối. Người chốt nên xem: nếu cho phép, sửa expected của E4 khai rõ phản hồi từ chối này (E6 đã khai lỗi đúng ô) rồi chạy lại.
    Frame đã lưu: E4-step1.png, E4-step1b.png, E4-step1b-mo-cuon.png, E4-step2.png, E4-step3.png, E4-step3-chon.png, E4-step4.png, E4-step4-toi.png, E4-network.txt.

- eval: E5
  run_id: minted-gan-nhan-theo-nhom-s03-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E6
  run_id: minted-gan-nhan-theo-nhom-s03-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E7
  run_id: minted-gan-nhan-theo-nhom-s03-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mu
  verified_at: 2026-11-04T12:14:29Z
  output: |
    MU OK

- eval: E8
  run_id: E8-verifier-20261104
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T12:14:29Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1440x1500 sáng, nhóm «GCN thử có máy đọc», đã lưu bài «RB 2PN1WC», 17/17): có «Bài gốc», khối «So với máy» bảng 4 cột Trường | Anh gắn | Bộ đọc | AI đọc (17 hàng), mô tả «1 trường khác máy», hàng Toà khác nhìn ra nhờ badge vàng «rb»; bên phải khối «Ghi trường hợp» với «Thẻ nhóm», ô «Thẻ đúng với bài này không?», nút Bỏ qua và «Ghi và sang tin kế»; phía dưới bảng «Trường hợp theo nhóm» và «Đồng thuận». Trước khi lưu, trang không có «So với máy», «Bộ đọc», «Thẻ nhóm» (đo bằng DOM).
    E8-step2.png (nhóm chưa có máy): «0 trường khác máy. Máy chưa đọc bài này.», cột Bộ đọc và AI đọc toàn «—», thẻ nhóm ghi «Nhóm chưa có thẻ». E8-step3.png (bài ba tin): «3 trường khác máy. Bài có 3 tin; đang so với tin đầu. AI chưa đọc bài này.», ba ô khác (Toà, Phòng ngủ, Giá cao nhất) có badge vàng.
    E8-step4.png (390x844 tối): bảng xếp dọc, badge vàng rõ trên nền tối, không có thanh cuộn ngang; E8-step4-cao.png (ảnh phụ) không tràn ngang. Khớp Expected. Ghi chú nhỏ: ở khổ hẹp giá trị Anh gắn là dòng đầu mỗi hàng và không có nhãn «Anh gắn» riêng; badge «khác» khá nhạt ở nền sáng.
  network_observed: clean
  output: |
    PASS: mạng: 4 POST lưu nhãn đều thành công trong log máy chủ (1 lần lưu bị bỏ, 3 lần lưu chính thức). Console 0 lỗi, 1 cảnh báo preload font (không thuộc phạm vi). Không có request 4xx hay 5xx.
    Frame đã lưu: E8-step1.png, E8-step2.png, E8-step3.png, E8-step4.png, E8-step4-cao.png (ảnh phụ); network: E8-network.txt.

- eval: E9
  run_id: minted-gan-nhan-theo-nhom-s03-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E10
  run_id: minted-gan-nhan-theo-nhom-s03-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E11
  run_id: minted-gan-nhan-theo-nhom-s03-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_cases
  verified_at: 2026-11-04T12:14:29Z
  output: |
    CASES OK

- eval: E12
  run_id: minted-gan-nhan-theo-nhom-s03-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_do_cu
  verified_at: 2026-11-04T12:14:29Z
  output: |
    DO-CU OK

- eval: E13
  run_id: minted-gan-nhan-theo-nhom-s03-E13-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 1566.809042

- eval: E14
  run_id: minted-gan-nhan-theo-nhom-s03-E14-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E15
  run_id: minted-gan-nhan-theo-nhom-s03-E15-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-04T12:14:29Z
  output: |
    (sàn thiết kế bậc M1: không báo hex thô mới)

- eval: E16
  run_id: design-gate-badd12f7c2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gcn_gate
  verified_at: 2026-11-04T12:14:29Z
  output: |
    (cổng thiết kế P0 không báo lỗi trên 10 tệp màn trong danh sách lệnh)

- eval: E17
  run_id: E17-gan-nhan-theo-nhom-s03-20261104
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T12:14:29Z
  screenshot: evidence/E17-step1.png
  observed: |
    E17-step1.png (1440x900): màn Gắn nhãn cuộn tới khối «Trường hợp theo nhóm», chú thích «Chỉ có số. Chữ lý do đọc qua lệnh xuất ở máy thu.». Bảng 4 cột (Nhóm, Đã gắn, Cần ngữ cảnh, Trường hợp), 3 hàng: «GCN thử có máy đọc» 1/2, 1, «Mặc định theo nhóm 1»; «GCN thử chưa có máy» chữ xám «chưa có», «—», «—»; «GCN thử bài ba tin» 1/1, 1, «Mặc định theo nhóm 1». Không có chữ lý do nào trong DOM. Mép trên ảnh có thẻ bài sticky đè lên biểu mẫu do cuộn, là artefact cuộn, không thuộc bảng.
    E17-step2.png (390x844): cùng bảng, đủ 4 cột và 3 hàng, nhóm «chưa có» vẫn ghi «chưa có», tên nhóm xuống dòng, không cắt hay cuộn ngang; bề rộng trang đo bằng DOM: khung 390, vùng cuộn 390, nội dung 390. Khớp Expected. Ghi chú seed: để có nhóm «chưa gắn», người chạy xoá nhãn và trường hợp của bài gcn-seed-3 trên DB thử oneinvest_gcn_nhan, không sửa code.
  network_observed: no-app-traffic
  output: |
    Console: 0 lỗi, 0 cảnh báo; log máy chủ không có dòng 4xx hay 5xx.
    Ghi chú: ui-capture.sh chỉ chụp viewport đầu trang nên chụp bằng playwright-cli, cuộn tới bảng. Chỉ thấy request static, không có fetch hay XHR của app nên ghi no-app-traffic.
    Frame đã lưu: E17-step1.png, E17-step2.png; network/console: E17-network.txt.

- eval: E18
  run_id: minted-gan-nhan-theo-nhom-s03-E18-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_round_trip
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ROUND-TRIP OK

- eval: E19
  run_id: minted-gan-nhan-theo-nhom-s03-E19-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E20
  run_id: minted-gan-nhan-theo-nhom-s03-E20-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

- eval: E22
  run_id: minted-gan-nhan-theo-nhom-s03-E22-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T12:14:29Z
  output: |
    ℹ duration_ms 3630.951708

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

- cmd: cd app && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

- cmd: cd pipeline && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-04T12:14:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline): E13 (bộ test PL7, regression-guard có chủ ý), E15 (sàn thiết kế M1, regression-guard có chủ ý).

Baseline không đo:
- node _acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/mau.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/mau.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs: bo qua baseline: tep pipeline/lib/label-cases.test.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-nhom.test.tsx: bo qua baseline: tep app/tests/labels-nhom.test.tsx co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/cases.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/cases.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/do-cu.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/do-cu.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- for f in app/src/app/ops/labels/page.tsx app/src/components/ops/labels/labels-view.tsx app/src/components/ops/labels/label-form.tsx app/src/components/ops/labels/label-form-nhom.tsx app/src/components/ops/labels/nhom-row.tsx app/src/components/ops/labels/luot-hai.tsx app/src/components/ops/labels/bang-so.tsx app/src/components/ops/labels/chon-nhom.tsx app/src/components/ops/labels/bang-truong-hop.tsx app/src/components/ops/labels/agreement-table.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: bo qua baseline: tep app/src/components/ops/labels/label-form-nhom.tsx co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/gan-nhan-theo-nhom-s03/probes/round-trip.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/round-trip.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1, 2: lịch sử nằm trong run-log.jsonl và các commit vòng trước (xem commit 10159ecb, ghi lượt S4 vòng 1, 2).
Round 3: E4 failed — phần giao diện đạt hết Expected, đỏ vì luật network (POST lưu với Lý do trống bị từ chối 4xx có chủ ý, Expected của E4 không khai). Chờ người chốt: sửa expected của E4 rồi chạy lại, hoặc trả về triển khai. Escalate to user, verdict REJECT.
