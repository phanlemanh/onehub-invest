---
schema_version: 2
feature_slug: tin-rao-tren-invest
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f44d043e74b44716d7a00e0714cab35544eec78a
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: tin-rao-tren-invest

Vòng 3. Chỉ E4b chạy lại trên cây f44d043e; các eval còn lại giữ nguyên từ vòng gốc (carry-forward, delta không chạm paths của chúng).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E2b | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E4b | AC-4 | test | PASS |
| E4c | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E6b | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E7u | AC-7 | ui-check | PASS |
| E8 | AC-8 | test | PASS |
| E8b | AC-8 | test | PASS |
| E8u | AC-8 | ui-check | PASS |
| E9 | AC-9 | test | PASS |
| E9u | AC-9 | ui-check | PASS |
| E9b | AC-9 | test | PASS |
| E10 | AC-10 | judgment | PASS |

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx: bo qua baseline: tep app/tests/tin-rao-doi-chieu.test.tsx co o cay dang kiem nhung chua co o merge-base 630f4511644c54a849ea27d2af035590daff2c33 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Evidence

### Eval chạy lại vòng 3

- eval: E4b
  run_id: minted-tin-rao-tren-invest-E4b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tir_doi_chieu
  verified_at: 2026-11-02T09:10:29Z
  output: |
    cd app && node --import tsx --test tests/tin-rao-doi-chieu.test.tsx
    ℹ duration_ms 21914.758709

### Eval carry-forward (không chạy lại vòng 3)

- eval: E1
  run_id: minted-tin-rao-tren-invest-E1-r1
  exit_code: 0
  verifier: config:executors.test.tir_sync
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2
  run_id: minted-tin-rao-tren-invest-E2-r1
  exit_code: 0
  verifier: config:executors.test.tir_sync_db
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E2b
  run_id: minted-tin-rao-tren-invest-E2b-r1
  exit_code: 0
  verifier: config:executors.test.tir_quet_that
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E3
  run_id: minted-tin-rao-tren-invest-E3-r1
  exit_code: 0
  verifier: config:executors.test.tir_sync_db
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-tin-rao-tren-invest-E4-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E4c
  run_id: minted-tin-rao-tren-invest-E4c-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E5
  run_id: minted-tin-rao-tren-invest-E5-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E6
  run_id: minted-tin-rao-tren-invest-E6-r1
  exit_code: 0
  verifier: config:executors.test.tir_be_mat
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E6b
  run_id: minted-tin-rao-tren-invest-E6b-r1
  exit_code: 0
  verifier: config:executors.script.portal_static
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  output: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E7
  run_id: minted-tin-rao-tren-invest-E7-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E7u
  run_id: minted-tin-rao-tren-invest-E7u-r2
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  screenshot: evidence/E7u.png
  observed: |
    E7u-step1.png (trang /vn/hanoi/listings/sale chưa lọc, đã chèn style che): 3.373 tin bán, lưới thẻ; mỗi thẻ có «Đăng bởi» kèm ô xám che tên, nút «Chưa có số»; không thấy tên người bán. E7u.png (lọc Phường là Quảng Bị): chip lọc «Phường là Quảng Bị», «1 tin bán · 0 tin có số», đúng một thẻ 1 tỷ, Đất 58 m², Quảng Bị; hàng cuối hiện «Tài khoản nhiều tên» (thay cho «Đăng bởi <tên>») và «Chưa có số». Không có tên thật trên ảnh. Khớp Expected.
  network_observed: n-a (driver)
  note: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8
  run_id: minted-tin-rao-tren-invest-E8-r2
  exit_code: 0
  verifier: config:executors.test.tir_ui
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8b
  run_id: minted-tin-rao-tren-invest-E8b-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E8u
  run_id: minted-tin-rao-tren-invest-E8u-r1
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  screenshot: evidence/E8u-sale.png
  observed: |
    Đã mở bằng Read các khung E8u-sale.png, E8u-short.png, E8u-rent.png, E8u-375.png, E8u-step16-sale-chip.png và các khung probe. Các khung step khác được lưu từ cùng phiên chạy nhưng không mở lại từng cái.
    E8u-sale.png (hanoi, 1280): header Thị trường, Bán (đang sáng), Cho thuê, Lợi suất, So sánh. "Tin bán tại Thành phố Hà Nội", "3.376 tin bán · 1 tin có số". Thẻ có giá ở đầu (4,4 tỷ · 66,9 tr/m²), hàng cuối "Đăng bởi [khối xám] ... Chưa có số". Tên người đăng bị che thành khối xám.
    E8u-rent.png (hanoi): mục Cho thuê sáng, "3.591 tin thuê dài hạn", ô Dài hạn đang chọn, Thêm bộ lọc, Chỉ tin có số, Xếp theo Mới cập nhật. Giá "120 tr/tháng" ở đầu thẻ, hàng cuối "Đăng bởi [che]" và "Chưa có số" cùng vị trí.
    E8u-short.png: "Thuê ngắn hạn tại Thành phố Hà Nội", ô Ngắn hạn chọn, mục Cho thuê sáng, "300 listing". Lưới hai cột thẻ có ảnh (thẻ đầu trống ảnh), giá "20,1 tr/đêm" ở đầu thẻ, hàng cuối Công suất, Doanh thu và nút Xem listing ghim đáy; bên phải là bản đồ giá Hà Nội.
    E8u-step16-sale-chip.png (hcmc sale): chip "Giá (tỷ) | trong khoảng | 1,5 – 3", "2.478 tin bán", thẻ giá từ 1,5 tỷ đến 2,7 tỷ, mục Bán sáng.
    E8u-375.png: header có Bán (sáng) và Cho thuê ngoài menu hamburger, nút "Bộ lọc" mang số 1, Chỉ tin có số, Xếp theo, "2.478 tin bán", thẻ 2,3 tỷ, người đăng bị che. Không có cuộn ngang. Khớp Expected.
  network_observed: clean
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9
  run_id: minted-tin-rao-tren-invest-E9-r2
  exit_code: 0
  verifier: config:executors.test.tir_ui
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

- eval: E9u
  run_id: minted-tin-rao-tren-invest-E9u-r1
  exit_code: 0
  verifier: config:executors.design.ui_check
  verified_at: 2026-11-02T08:39:42Z
  carried_from_round: 1
  screenshot: evidence/E9u-sang.png
  observed: |
    E9u-sang.png (sáng, 1280x900): trang "Tin bán tại Thành phố Hà Nội", công tắc "Chỉ tin có số" bật, dòng "1 tin bán · 1 tin có số · cập nhật trong 30 ngày", một thẻ 16 tỷ, 92,5 tr/m², Căn hộ 173 m² 4 PN, Ngọc Hồi, "Thấy từ 3 ngày trước", nhãn "Tài khoản nhiều tên", nút "Xem số"; không thấy số điện thoại; chữ đọc rõ, không tràn ngang. E9u-toi.png: cùng bố cục nền tối, chữ sáng đọc rõ, nút Xem số và thẻ có viền thấy được. E9u-trong.png (tối): bộ lọc Giá (tỷ) từ 900, "0 tin bán · 0 tin có số", khung nét đứt "Không có tin khớp bộ lọc / Nới khoảng giá, diện tích hoặc bỏ bớt điều kiện." kèm nút "Xoá bộ lọc". Khớp Expected, trừ số tin có số hôm nay là 1 chứ không phải 2.
  network_observed: clean
  note: carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E9b
  run_id: minted-tin-rao-tren-invest-E9b-r2
  exit_code: 0
  verifier: config:executors.test.tir_api
  verified_at: 2026-11-02T08:58:45Z
  carried_from_round: 2
  output: carry-forward tu round 2 — delta khong cham paths cua eval

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context)
  verdict: UNCERTAIN
  rationale: panel giu nguyen tu round 2 — inputs khong doi, khong cham lai; rationale xem round do. Đề xuất panel là PASS nhưng một lens còn UNCERTAIN nên người quyết ở Cổng 2.
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: UNCERTAIN (r2)
    - spec-alignment: PASS (r2)
  required_evidence:
    - Một câu rõ ràng, đặt ở ADR-0007 dòng 226-227 hoặc ngay sau sửa đổi 02/11, nói `seller_name`/`seller_phone` trong `seller_*` đã hết bị loại. Hoặc Mạnh xác nhận ghi chú rằng sửa đổi 02/11 thay thế luật gate ở dòng 226-227. Lấy từ: /Users/manhphan/dev/onehub-invest/.claude/worktrees/distracted-napier-fce98f/docs/adr/0007-collector-operating-principles.md. Có câu này thì verdict đổi sang PASS.
    - Nội dung dòng 53 của /Users/manhphan/dev/onehub-invest/.claude/worktrees/distracted-napier-fce98f/.claude/skills/onehub-ui/catalog.md và dòng 48-52 của routes.md bị rút gọn khi tôi đọc, nên chưa thấy hết. Cần trích đoạn đầy đủ cho thấy khung thẻ dùng chung `ListingCardFrame` và khuôn Duyệt listing.
  human_override: Mạnh 2026-11-02 — Đạt

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-tin-rao-tren-invest-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-tin-rao-tren-invest-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

- cmd: cd app && npm test
  run_id: minted-tin-rao-tren-invest-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

- cmd: cd pipeline && npm test
  run_id: minted-tin-rao-tren-invest-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-tin-rao-tren-invest-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-tin-rao-tren-invest-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-02T09:10:29Z

## Known limits

## Ngoài hợp đồng

## Iterations

Round 1: các eval feature đạt; một lệnh suite hồi quy (test:lint-rules) đỏ ở vòng đầu. Trả về thi công.
Round 2: E4b bị finding mức cao (đo sau khi tự xoá sellerName, không đo giá trị API thực trả). Trả về thi công.
Round 3: commit f44d043e sửa E4b đo đúng giá trị API trả và đọc lại tin mang định danh; E4b và toàn bộ lệnh suite xanh, các eval khác carry-forward. Còn mục judgment E10 chờ người quyết nên verdict PENDING-JUDGMENT.
