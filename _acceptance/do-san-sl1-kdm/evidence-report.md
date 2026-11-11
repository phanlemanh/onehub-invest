---
schema_version: 2
feature_slug: do-san-sl1-kdm
verdict: BLOCKED
failed_evals: []
reason: "Lenh `cd pipeline && npm test` (pinned vao worktree do-san-sl1-kdm) duoc chuyen sang nen sau 600 giay va van chay (pid 78581, npm test trong .claude/worktrees/do-san-sl1-kdm/pipeline). Da cho ~30 phut tong cong, chua co dong ket thuc. Khong kill duoc tien trinh tu verifier nay, khong chay lai. Khai long_running: 30 cho eval trong evals.yaml (mac dinh) thi lenh vuot tran. Khong doan PASS/FAIL. Can kiem tra lai khi suite ket thuc (ps -p 78581 de xem con chay khong)."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dddc1d5abc9142b1f2aeea085e434627721abc13
human_signoff:
---

# Evidence Report: do-san-sl1-kdm

Round 3. Bốn eval của hợp đồng (E1-E4) mang từ vòng trước vì delta không chạm paths của chúng. Vòng này bị chặn ở lệnh suite `cd pipeline && npm test` (chạy quá trần thời gian, chưa kết thúc). Ngoài ra `cd app && npm test` đỏ ở hai ca không gắn eval nào (xem Evidence, mục Lệnh suite).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS (carry-forward từ round 1) |
| E2 | AC-2 | test | PASS (carry-forward từ round 2) |
| E3 | AC-3 | test | PASS (carry-forward từ round 2) |
| E4 | AC-4 | script | PASS (carry-forward từ round 2) |

## Evidence

- eval: E1
  run_id: minted-do-san-sl1-kdm-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_doc
  verified_at: 2026-11-10T23:16:17Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval
    expected: "Chế độ chỉ đọc trên DB local: «S03: 0», «S05: 0», «S06: 0 tin trỏ khu vực không hợp lệ» (90 tin trỏ xã dvhc có admin_code không còn bị đếm), «kiem-tin-rao-gan: PASS», exit 0. Chiều đỏ ở E2 (cùng hàm đếm)."

- eval: E2
  run_id: minted-do-san-sl1-kdm-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_vi_tu
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: "Ca KDM-PX1 xanh: trong giao dịch ROLLBACK chèn ba khu vực mồi (xã có admin_code không OSM; không OSM không mã; xã có admin_code mang meta.lac) và ba tin trỏ vào; với mỗi ô, kết quả hàm đếm của thước bằng kết quả câu SQL khuVucKhopTen(coDanhBa) của pipeline/lib/osm.mjs (round-trip với bên ghi), ô một hợp lệ, ô hai không. Chiều đỏ cùng fixture: hàm đếm dựng bằng phuongHopLe khác bên ghi ở ô một, assert ghim «KDM-PX1». Sau ROLLBACK đếm khu vực mồi = 0."

- eval: E3
  run_id: minted-do-san-sl1-kdm-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tin_rao_gan_do_test
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: "node --test scripts/kiem-tin-rao-gan-khu-vuc.test.mjs xanh: KDM-AC-3 ba chiều xanh, mỗi lượt --thu chạy qua db/db-thu.sh --chay trên DB của riêng lượt (băm ROLLBACK không lệch vì job khác) (bản thường PASS; khong-sua và mo-loc gọi tên tin mồi), KDM-AC-4, KDM-AC-5 và KDM-PX1 xanh."

- eval: E4
  run_id: minted-do-san-sl1-kdm-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dsk_khong_db_chung
  verified_at: 2026-11-11T00:17:08Z
  carried_from_round: 2
  output: |
    carry-forward tu round 2 — delta khong cham paths cua eval
    expected: "Probe xanh: trong cả hai tệp, với mỗi câu ghi (INSERT INTO, UPDATE … SET, DELETE FROM, DROP) lệnh query BEGIN|ROLLBACK|COMMIT gần nhất phía trước là BEGIN và gần nhất phía sau là ROLLBACK (chữ trong chú thích, thông báo không tính). Chiều đỏ trên bản sao mỗi tệp, hai ca: câu ghi trước BEGIN đầu tiên, và câu ghi ngay sau lệnh ROLLBACK thật đầu tiên — mỗi ca probe gọi tên «<tệp>:<dòng>»."

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-11-11T04:02:07Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-do-san-sl1-kdm-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-11T04:02:07Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-do-san-sl1-kdm-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-11T04:02:07Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-do-san-sl1-kdm-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-11-11T04:02:07Z

- cmd: cd app && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__bd9a35-r3
  ket_qua: lenh ket thuc voi trang thai loi (khong gan eval nao). 1115 test, 1108 pass, 1 fail, 1 cancelled, 5 skipped.
  ca do 1: tests/can-gia-tot-doi-chieu.test.tsx «CGT-DC đối chiếu DB máy thu chỉ đọc» — quá hạn 1200000 ms.
  ca do 2: tests/tin-rao-doi-chieu.test.tsx «E4B-AC-3 biên: mỗi sort bản mới dưới 700 ms» — đo thấy price-desc 970 ms và perm2-asc 716 ms (ca đo thời gian, nhạy với tải máy).
  verified_at: 2026-11-11T04:02:07Z

- cmd: cd pipeline && npm test
  run_id: minted-do-san-sl1-kdm-SUITE-npm_test__13563d-r3
  ket_qua: KHONG CHAY XONG — chuyen sang nen sau 600 giay, pid 78581 van chay sau ~30 phut, chua co dong ket thuc. Khong doan PASS hay FAIL.
  verified_at: 2026-11-11T04:02:07Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt). Lưu ý trung thực: các eval E1-E4 mang từ vòng trước không có kết quả baseline ở vòng này (baseline: n-a); lệnh suite là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval của vòng này chạy một lần). Ghi chú: ca E4B-AC-3 của `cd app && npm test` là ca đo thời gian nhạy tải, đỏ ở vòng này, không gắn eval nào.

## Iterations

Round 1: S4 bị từ chối — hồ sơ vòng 1; sửa theo nhát (hợp đồng và evals), KDM-AC-3 chuyển sang DB riêng của lượt, KDM-PX1 tự dựng khu vực cha, probe AC-4 đo quan hệ.
Round 2: S4 bị từ chối chỉ vì E5 (AU11-AC-3 chập chờn khi tải, main cũng đỏ) — dừng, trình người; Mạnh thu AC-5 thành Known limits, ký lại Cổng Phạm vi.
Round 3: BLOCKED — `cd pipeline && npm test` chạy quá trần thời gian (pid 78581 chưa kết thúc); `cd app && npm test` đỏ ở hai ca không gắn eval (CGT-DC quá hạn, E4B-AC-3 biên thời gian). E1-E4 mang từ vòng trước. Cần chạy lại với trần dài hơn khi tải máy thấp.
