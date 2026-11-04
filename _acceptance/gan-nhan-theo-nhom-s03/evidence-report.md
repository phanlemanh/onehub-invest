---
schema_version: 2
feature_slug: gan-nhan-theo-nhom-s03
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a378a5e4162c3a744d1cd573d4ec544f1f2fbcb6
human_signoff:
---

# Evidence Report: gan-nhan-theo-nhom-s03

Round 4. Nội dung thay toàn bộ round cũ; lịch sử round nằm ở mục Iterations.

Lệnh fail không gắn eval: không có.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | ui-check | PASS |
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
  run_id: minted-gan-nhan-theo-nhom-s03-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_migration
  verified_at: 2026-11-04T13:58:29Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-gan-nhan-theo-nhom-s03-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mau
  verified_at: 2026-11-04T13:58:29Z
  output: |
    MAU OK

- eval: E3
  run_id: minted-gan-nhan-theo-nhom-s03-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_pipeline
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 67.615292

- eval: E4
  run_id: E4-gcn-20261104-1400
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T13:58:29Z
  screenshot: evidence/E4-step1.png
  observed: |
    E4-step1.png (1440x900 sáng, nhóm "GCN thử có máy đọc"): tiêu đề Gắn nhãn, ba huy hiệu tiến độ, dòng hướng dẫn "ghi điều người trong nhóm hiểu, kèm căn cứ từng ô"; bộ chọn nhóm góc phải + thanh tiến độ 0/2; khung bài gốc "RB 2PN1WC full nội thất Giá: 8tr" kèm dòng giải thích căn cứ Chữ/Nhóm/Nghề và ô vuông; biểu mẫu hai cột: trái Tin (Ý định tin, Loại tin, Loại hình, Nhiều căn) và Căn (Phòng ngủ, Có «+», WC, Diện tích) rồi ô Lý do; phải Vị trí (5 hàng), Giá (tỷ/triệu, 2 hàng), Người bán (Tên, SĐT); thanh dưới "Đã điền 0/17" + nút "Lưu và xem máy đọc" ở y~809, trong màn; bên dưới lộ đầu khối "Trường hợp theo nhóm". Đủ 17 hàng trong màn, không cuộn.
    E4-step1b.png: bài dài gấp 3 dòng kết thúc "LH 0912 345 678....", nút link "Xem hết bài"; toàn bộ biểu mẫu và nút Lưu (y~849) vẫn trong màn. E4-step1b-mo-cuon.png: bài mở đủ 5 dòng nguyên văn kèm nút "Thu gọn", biểu mẫu đã cuộn lên, header bài dính ở trên cùng vẫn thấy; một dải mảnh phía trên header còn lộ nội dung cuộn (thẩm mỹ nhỏ).
    E4-step2.png: bộ chọn "GCN thử chưa có máy", huy hiệu "Tôi đã gắn 0/1 tin của nhóm", tiến độ 0/1, chỉ bài "Bán căn 1PN giá tốt, nhắn riêng", biểu mẫu trống 0/17, không có bài nhóm khác.
    E4-step3.png (390x844 tối): nền tối, một cột; tiêu đề, huy hiệu xuống dòng, bộ chọn nhóm full-width, bài, khối Tin xếp dọc; nút "Chữ" đang chọn trắng nổi trên nền tối; không có thanh cuộn ngang, nút Lưu dính đáy; bề rộng đo 390 = khổ màn.
    E4-step4-chon.png (sáng, 17/17): Tin rao, Cho thuê, Căn hộ, Có, triệu, Nhóm (Khu đô thị) đều nền đen chữ trắng rõ; ô "không suy ra được" tick làm ô chữ mờ; nhãn "Lý do (bắt buộc)" hiện. E4-step4-chon-toi.png (tối): các lựa chọn đã chọn nền sáng chữ tối, rõ trên nền tối.
    E4-step4.png: sau Lưu với Lý do trống: ô Lý do viền đỏ, nhãn đỏ "Lý do (bắt buộc)", dòng lỗi đỏ "Có trường không từ chữ bài — ghi lý do" ngay dưới ô; các giá trị đã gõ (2, 59, 8,5, 8,5, 0912 345 678, Nhóm, tick WC/Tên/Tầng) còn nguyên, huy hiệu 17/17. Khớp Expected, không mâu thuẫn.
  network_observed: clean

- eval: E5
  run_id: minted-gan-nhan-theo-nhom-s03-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E6
  run_id: minted-gan-nhan-theo-nhom-s03-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E7
  run_id: minted-gan-nhan-theo-nhom-s03-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_mu
  verified_at: 2026-11-04T13:58:29Z
  output: |
    MU OK

- eval: E8
  run_id: e8-gcn-r4-20261104
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T13:58:29Z
  screenshot: evidence/E8-step1.png
  observed: |
    E8-step1.png (1440x900, sáng): sau khi Lưu bài có bản máy đọc (nhóm co-may, bài RB 2PN1WC 8tr), khối "So với máy" hiện với phụ đề "Nhãn đã lưu, không sửa được. 3 trường khác máy." Bảng có ba cột rõ Trường | Anh gắn | Bộ đọc | AI đọc, 17 hàng. Chỗ khác nhìn ra được: ô máy Phòng ngủ "2" (anh gắn 3), Giá thấp nhất "8 triệu" và Giá cao nhất "8 triệu" (anh gắn 9 triệu) có huy hiệu vàng. Cột phải "Ghi trường hợp" có khối "Thẻ nhóm" với chữ thẻ của nhóm, ô Thẻ đúng với bài này không?, Loại trường hợp, Diễn giải, nút Bỏ qua, Ghi và sang tin kế. Bên dưới có bảng "Trường hợp theo nhóm". E8-step2.png: phụ đề "0 trường khác máy. Máy chưa đọc bài này."; cột Bộ đọc và AI đọc toàn "—"; ô Thẻ nhóm ghi "Nhóm chưa có thẻ" và không có ô hỏi thẻ đúng không. E8-step3.png: phụ đề "3 trường khác máy. Bài có 3 tin; đang so với tin đầu. AI chưa đọc bài này." Huy hiệu vàng ở Toà "rb", Phòng ngủ "2", Giá cao nhất "6 triệu" (anh gắn 12 triệu); thẻ nhóm hiện chữ. E8-step4.png (390x844, tối, html có class dark): khối "So với máy" xếp chồng, mỗi trường gồm tên trường, giá trị anh gắn rồi hai dòng "Bộ đọc", "AI đọc" bên dưới; không tràn ngang, mép phải khớp màn. Lưu ý nhỏ: ở khổ hẹp giá trị anh gắn không có nhãn "Anh gắn" riêng, chỉ Bộ đọc và AI đọc có nhãn; ảnh khổ hẹp chụp ở đầu khối nên các ô huy hiệu chỗ khác nằm dưới màn, không lên khung. Còn một tệp cũ E8-step4-cao.png (19:24) không thuộc lượt chạy này, bỏ qua.
  network_observed: clean

- eval: E9
  run_id: minted-gan-nhan-theo-nhom-s03-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E10
  run_id: minted-gan-nhan-theo-nhom-s03-E10-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E11
  run_id: minted-gan-nhan-theo-nhom-s03-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_cases
  verified_at: 2026-11-04T13:58:29Z
  output: |
    CASES OK

- eval: E12
  run_id: minted-gan-nhan-theo-nhom-s03-E12-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_do_cu
  verified_at: 2026-11-04T13:58:29Z
  output: |
    DO-CU OK

- eval: E13
  run_id: minted-gan-nhan-theo-nhom-s03-E13-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 1777.369834

- eval: E14
  run_id: minted-gan-nhan-theo-nhom-s03-E14-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E15
  run_id: minted-gan-nhan-theo-nhom-s03-E15-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-04T13:58:29Z
  output: |
    (sàn thiết kế M1 không báo hex thô mới; lệnh không in thêm dòng nào)

- eval: E16
  run_id: design-gate-c40c5cf2ea
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.gcn_gate
  verified_at: 2026-11-04T13:58:29Z
  output: |
    (cổng thiết kế P0 chạy lần lượt 10 tệp màn, không tệp nào báo lỗi)

- eval: E17
  run_id: e17-20261104-2111
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-04T13:58:29Z
  screenshot: evidence/E17-step1.png
  observed: |
    Đã mở từng tệp bằng Read. E17-step1.png (1440x900, đã cuộn tới bảng): bảng «Trường hợp theo nhóm» có cột Nhóm / Đã gắn / Cần ngữ cảnh / Trường hợp; dòng «GCN thử có máy đọc» 1/2, cần ngữ cảnh 1, «Mặc định theo nhóm 1»; dòng «GCN thử chưa có máy» ghi «chưa có», «—», «—»; dòng «GCN thử bài ba tin» 1/1, 1, «Mặc định theo nhóm 1». Dòng mô tả «Chỉ có số. Chữ lý do đọc qua lệnh xuất ở máy thu.» Không thấy chữ lý do (marker LYDO-KHONG-LEN-BANG vắng khỏi DOM). Chỉ có số và nhãn loại, đọc được theo nhóm; bảng «Đồng thuận» nằm ngay dưới. Thẻ bài gốc dính (sticky) phủ phần trên khi cuộn — hành vi thiết kế, không che bảng. E17-step1-du-nhan.png (lần seed đầy đủ): cả ba nhóm đều 1/2, 1/1, 1/1, không nhóm nào «chưa có» — đúng mô tả seed --nhan. E17-step2.png (390x844, đã cuộn tới bảng): cùng bảng bốn cột vừa khung, tên nhóm xuống dòng, «chưa có» ở dòng nhóm chưa gắn, không chữ lý do, không cuộn ngang; đo: innerWidth 390, documentElement.scrollWidth 390, vùng cuộn thân trang client 390 / scroll 390.
  network_observed: clean

- eval: E18
  run_id: minted-gan-nhan-theo-nhom-s03-E18-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_round_trip
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ROUND-TRIP OK

- eval: E19
  run_id: minted-gan-nhan-theo-nhom-s03-E19-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E20
  run_id: minted-gan-nhan-theo-nhom-s03-E20-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

- eval: E21
  run_id: minted-gan-nhan-theo-nhom-s03-E21-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.gcn_migration
  verified_at: 2026-11-04T13:58:29Z
  output: |
    MIGRATION OK

- eval: E22
  run_id: minted-gan-nhan-theo-nhom-s03-E22-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-04T13:58:29Z
  output: |
    ℹ duration_ms 13329.826208

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bb6271-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

- cmd: cd app && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__bd9a35-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

- cmd: cd pipeline && npm test
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-npm_test__13563d-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-gan-nhan-theo-nhom-s03-SUITE-node_scripts_check_portal_compliance_mjs-r4
  exit_code: 0
  verified_at: 2026-11-04T13:58:29Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh trên cả HEAD lẫn baseline), cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý:
- E13 (cd app && node --import tsx --test tests/labels.test.tsx): bộ test PL7, xanh cả hai phía; là regression-guard có chủ ý theo Expected (chỉ sửa chỗ số trường và câu hướng dẫn đã đổi).
- E15 (sàn thiết kế M1, design-floor-s4): xanh cả hai phía; là regression-guard có chủ ý (không thêm hex thô mới).

Baseline khong do:
- node _acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/mau.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/mau.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/lib/eval-labels.test.mjs pipeline/lib/label-cases.test.mjs: bo qua baseline: tep pipeline/lib/label-cases.test.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx --test tests/labels-nhom.test.tsx: bo qua baseline: tep app/tests/labels-nhom.test.tsx co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/cases.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/cases.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/gan-nhan-theo-nhom-s03/probes/do-cu.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/do-cu.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- for f in app/src/app/ops/labels/page.tsx app/src/components/ops/labels/labels-view.tsx app/src/components/ops/labels/label-form.tsx app/src/components/ops/labels/label-form-nhom.tsx app/src/components/ops/labels/nhom-row.tsx app/src/components/ops/labels/luot-hai.tsx app/src/components/ops/labels/bang-so.tsx app/src/components/ops/labels/chon-nhom.tsx app/src/components/ops/labels/bang-truong-hop.tsx app/src/components/ops/labels/agreement-table.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: bo qua baseline: tep app/src/components/ops/labels/label-form-nhom.tsx co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi
- cd app && node --import tsx ../_acceptance/gan-nhan-theo-nhom-s03/probes/round-trip.mjs: bo qua baseline: tep _acceptance/gan-nhan-theo-nhom-s03/probes/round-trip.mjs co o cay dang kiem nhung chua co o merge-base 7ec64b7816d9d29d03acccdc988d76cece46685f — eval moi, chay tren code cu khong phan biet gi

Ghi chú phụ của bước chụp ui-check (không làm đổi kết quả):
- E4: phiên thử đầu có một phản hồi lạc đề do điền giá trị không có trong chữ bài; phiên đó bị bỏ, DB thử được seed lại và mọi số mạng thuộc phiên đo sạch. Bước 4 làm ở khổ 1440x900 sáng trên bài dài của nhóm đầu. Dải 24px phía trên header dính còn lộ nội dung cuộn (thẩm mỹ).
- E17: giá trị network_observed chép nguyên văn là clean dù không thấy request XHR của app nào, chỉ có phản hồi trang SSR hợp lệ; nếu đọc chặt hơn thì tương đương no-app-traffic, kết quả không đổi. Chi tiết thô ở evidence/E17-network.txt.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1, 2: lịch sử nằm trong run-log.jsonl và các commit vòng trước (xem commit 10159ecb, ghi lượt S4 vòng 1, 2).
Round 3: E4 failed — phần giao diện đạt hết Expected, đỏ vì luật network (lượt lưu với Lý do trống bị từ chối có chủ ý, Expected của E4 chưa khai). Trả về để sửa expected của E4.
Round 4: E4 khai đường từ chối có chủ ý, 22 eval và 6 lệnh suite đều xanh, verdict PASS.
