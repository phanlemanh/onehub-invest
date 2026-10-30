---
schema_version: 2
feature_slug: media-canonical-reso
verdict: REJECT
failed_evals: ["E1","E3","E5","E8","E12"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0133b31c209c6ea92599c4f541438f91c5fba2b5
human_signoff:
---

# Evidence Report: media-canonical-reso

Round 1. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | FAIL |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | FAIL |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | FAIL |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | script | FAIL |
| E9 | AC-8 | ui-check | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | script | FAIL |
| E13 | AC-6 | script | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-10 | test | PASS |

Lệnh đỏ không gắn eval nào: không có. Ba lệnh đỏ đều gắn eval (E1, E3, E5 chung một lệnh itest; E8; E12).

## Evidence

- eval: E1
  run_id: minted-media-canonical-reso-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd pipeline && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --test scripts/media-canonical.itest.mjs
    tests 10 · pass 9 · fail 1 · cancelled 0 · skipped 0
    Ca đỏ duy nhất: «NH-AC-2 S06: mỗi URL http(s) khác nhau một dòng, đúng thứ tự; tin không ảnh 0 dòng; một dòng DQ» (scripts/media-canonical.itest.mjs:154)
    error: deadlock detected (mã PG 40P01) tại runTransformMedia (pipeline/transform-media.mjs:72), gọi từ itest dòng 163, trong trongGiaoDich (dòng 45)
    detail: Process 223147 waits for ExclusiveLock on advisory lock [5270140,0,53053,1]; blocked by process 223141. Process 223141 waits for RowExclusiveLock on relation 5342843 of database 5270140; blocked by process 223147.
    Ghi chú: lệnh này che E1, E3, E5 nên cả ba nhận kết quả đỏ của lệnh; ca đỏ cụ thể thuộc NH-AC-2 (E3). Chín ca còn lại xanh, gồm hai ca NH-AC-1 (053 chạy hai lần, ràng buộc) và các ca NH-AC-4.

- eval: E2
  run_id: minted-media-canonical-reso-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd pipeline && npm test
    duration_ms 33908.791125

- eval: E3
  run_id: minted-media-canonical-reso-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Cùng lệnh itest với E1 (một lần chạy, mười ca, chín xanh).
    Ca đỏ: «NH-AC-2 S06 …» (itest dòng 154) dừng vì deadlock detected tại pipeline/transform-media.mjs:72.
    Hệ quả: các khẳng định AC-2 (2 dòng cho tin A, 1 dòng cho tin B, 0 dòng cho tin C, 1 dòng DQ) chưa được đo xong trong giao dịch này.

- eval: E4
  run_id: minted-media-canonical-reso-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/media-canonical.test.tsx
    duration_ms 2418.724416

- eval: E5
  run_id: minted-media-canonical-reso-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.media_db
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Cùng lệnh itest với E1 (một lần chạy, mười ca, chín xanh). Ca đỏ của lượt không thuộc nhóm NH-AC-4 theo tên, nhưng lệnh thoát đỏ nên eval nhận kết quả đỏ của lệnh.
    Cần người xem lại: có ca NH-AC-4 nào bị che bởi deadlock hay không, hoặc cần chạy lại riêng nhóm này.

- eval: E6
  run_id: minted-media-canonical-reso-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/media-canonical.test.tsx
    duration_ms 2418.724416

- eval: E7
  run_id: minted-media-canonical-reso-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.media_app
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd app && node --import tsx --test tests/media-canonical.test.tsx
    duration_ms 2418.724416

- eval: E8
  run_id: minted-media-canonical-reso-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.media_roundtrip
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd app && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --import tsx scripts/media-roundtrip.ts
    lượt một: 183867 ảnh · thêm 0 · đổi 0 · xoá 0 · đã tải 288
    deadlock detected
    Không có dòng «ROUNDTRIP PASS»; các dòng đếm 'S06 hụt ảnh ở loader', 'S06 lệch số ảnh', 'S03 hụt ảnh đã tải ở loader', 'lượt hai', 'thẻ duyệt S06', 'hồ sơ tin S06' chưa in ra.

- eval: E9
  run_id: minted-media-canonical-reso-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-30T03:33:43Z
  screenshot: evidence/E9-review.png
  observed: |
    E9-review.png (đã đọc): ngăn chi tiết «Cùng căn? binh-thanh 49m² ↔ 51m²» thẻ #14, Ghép căn, Chờ duyệt. Hai thẻ Tin A (S05, giá 6,00 tỷ, 49 m²) và Tin B (S06, 6,90 tỷ, 51 m², Đường Đinh Bộ Lĩnh). Dưới Tin A: «Tin A: không có ảnh» (S05 không có ảnh trong bảng media, đúng dữ liệu). Dưới Tin B (nhãn S06): dải 3 ảnh thật (hẻm có cây, căn phòng, mặt tiền phố), không ô nào là «Ảnh hỏng». Mã tin S06 thể hiện qua nhãn «S06» ở thẻ Tin B (id offer_355e22d49076246c không in trên UI).
    E9-review-list.png (đã đọc): danh sách 11 thẻ chờ duyệt, #24 đến #17 hiện, không có dải ảnh (dải ảnh chỉ có trong ngăn chi tiết).
    E9-ho-so-s06.png (đã đọc): hồ sơ «Cho thuê · 1,9 tr ₫ · 20 m²», S06 · Rao vặt công khai, B2 · Gắn căn, trường lõi 5/5; mục «Ảnh tin» hiện 3 ảnh thật (phòng trắng, bếp, xe máy); mục «Bài gốc» ghi «S06 chưa lưu khoá nối ngược tin → bài (TV10)»; không có câu «Chưa gắn được ảnh», không «Ảnh hỏng».
    E9-ho-so-s03.png (đã đọc): hồ sơ «Cho thuê · 2,8 tỷ ₫», S03 · Cộng đồng, B0 · Có lời khai; mục «Ảnh tin» hiện 1 ảnh thật (ảnh mặt bằng/bản đồ khu căn hộ) có src /api/zalo-media; «Bài gốc» có chữ bài Zalo; không «Chưa gắn được ảnh», không «Ảnh hỏng».
    Đối chiếu Expected: cả ba khung khớp (thẻ S06 có dải ≥ 1 ảnh thật; hồ sơ S06 ≥ 1 ảnh thật không có câu chưa gắn; hồ sơ S03 ≥ 1 ảnh đã tải qua /api/zalo-media; không ô ảnh hỏng).
  network_observed: clean

- eval: E10
  run_id: minted-media-canonical-reso-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd pipeline && npm test
    duration_ms 33908.791125

- eval: E11
  run_id: minted-media-canonical-reso-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: cd pipeline && npm test
    duration_ms 33908.791125

- eval: E12
  run_id: minted-media-canonical-reso-E12-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.media_khong_lui
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: node _acceptance/media-canonical-reso/probes/khong-lui.mjs
    chạy lại ops-dong-chay-df0: 7/7 lệnh xanh
    chạy lại review-media-backend: 4/4 lệnh xanh
    chạy lại transform-zalo-boc-job-run: 1/1 lệnh xanh
    khong-lui: 1 dòng ngoài ba lớp đã biết trước chữ ký (tổng 4 vi phạm):
    VIOLATION [media-canonical-reso]: status=implemented but no evidence-report.md
    Không có dòng «KHÔNG LÙI PASS». Dòng lạ duy nhất là thiếu evidence-report.md của chính hồ sơ này tại thời điểm probe chạy (báo cáo này được ghi sau khi probe chạy); các lớp (2) và (3) chạy lại đều xanh.

- eval: E13
  run_id: minted-media-canonical-reso-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: design-floor-s4.mjs --root .
    (không in dòng nào; sàn M1 không báo hex thô mới)

- eval: E14
  run_id: minted-media-canonical-reso-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.zalo_import_job
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: node --test scripts/zalo-import-job.test.mjs
    duration_ms 1196.404167

- eval: E15
  run_id: minted-media-canonical-reso-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_exit
  verified_at: 2026-10-30T03:33:43Z
  output: |
    Lệnh: node --test scripts/job-exit.test.mjs
    duration_ms 4098.92925

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T03:33:43Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-media-canonical-reso-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T03:33:43Z

- cmd: cd app && npm test
  run_id: minted-media-canonical-reso-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-30T03:33:43Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-media-canonical-reso-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T03:33:43Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-media-canonical-reso-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T03:33:43Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Baseline khong do:
- cd pipeline && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --test scripts/media-canonical.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && node --import tsx --test tests/media-canonical.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && DATABASE_URL=${MEDIA_DB_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest_p2_media} node --import tsx scripts/media-roundtrip.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node _acceptance/media-canonical-reso/probes/khong-lui.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}/scripts/design-floor-s4.mjs" --root .: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/zalo-import-job.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node --test scripts/job-exit.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Eval không-phân-biệt: không xác lập được ở round này, vì baseline bị chặn hạ tầng nên không eval nào có số đo green hay red; không được hiểu là «mọi eval đều có phân biệt».

Ghi chú về mốc giờ: cột verified_at ở trên chỉ ghi ngày (giờ để 00:00:00Z); giờ chạy thật của từng eval nằm ở run-log.jsonl cùng thư mục.

Ghi chú về nguyên nhân đỏ (chưa kết luận): cả E1/E3/E5 (itest) và E8 (media-roundtrip) đều dừng bằng «deadlock detected» quanh transform-media (khoá advisory so với RowExclusiveLock trên cùng bảng). Hai lệnh dùng chung DB thử oneinvest_p2_media; cần người xác định đây là lỗi thứ tự khoá trong transform-media.mjs hay do hai lượt chạy chồng nhau trên cùng DB thử, rồi mới chạy lại.

## Variance

none — mọi eval chạy một lần (runs 1), không eval nào có variance; không có pass_rate hỗn hợp.

## Iterations

Round 1: E1, E3, E5, E8, E12 failed — E1/E3/E5 và E8: «deadlock detected» khi chạy transform-media trên DB thử (một ca NH-AC-2 đỏ, chín ca khác xanh; media-roundtrip dừng sau lượt một); E12: probe còn một dòng lạ là thiếu evidence-report.md của chính hồ sơ. Returned to implementation.
