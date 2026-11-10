---
schema_version: 2
feature_slug: s03-nap-ho-so
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 580fb82181e36518b555c5c6135aa1effab7905b
human_signoff:
---

# Evidence Report: s03-nap-ho-so

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: s03-nap-ho-so-E1-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-1 lượt 00:00: snapshot hồ sơ mới được nạp, con trỏ hồ sơ tiến, chuỗi tin chạy đủ, mã 0 (518.605459ms)
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0
    ℹ skipped 0

- eval: E2
  run_id: s03-nap-ho-so-E2-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-2 Ngoài-6 thứ tự: DB thiếu 080 → GIỮ con trỏ hồ sơ, JOB FAIL nap-ho-so mã 4, chuỗi tin vẫn chạy; áp 080 rồi chạy lại → nạp đủ, không trùng (400.673416ms)
    ℹ pass 7
    ℹ fail 0

- eval: E3
  run_id: s03-nap-ho-so-E3-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-3 con trỏ riêng: snapshot hồ sơ mốc CŨ hơn con trỏ tin vẫn được nạp; con trỏ tin không bị kéo theo (163.136125ms)
    ℹ pass 7
    ℹ fail 0

- eval: E4
  run_id: s03-nap-ho-so-E4-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-4 nạp hồ sơ hỏng → giữ con trỏ, JOB FAIL nap-ho-so mã 1, chuỗi tin vẫn chạy, khoá được nhả (146.161292ms)
    ℹ pass 7
    ℹ fail 0

- eval: E5
  run_id: s03-nap-ho-so-E5-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-5 lượt nhanh cũng nạp hồ sơ (để link hồ sơ lên trong ngày), vẫn bỏ đọc gộp + làm giàu (122.022208ms)
    ℹ pass 7
    ℹ fail 0

- eval: E6
  run_id: s03-nap-ho-so-E6-20261110T102153Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_test
  verified_at: 2026-11-10T10:21:53Z
  output: |
    ✔ HS-6 đối chứng: không có snapshot hồ sơ nào → không gọi nạp hồ sơ, con trỏ hồ sơ ở mốc gốc, mã 0 (129.449375ms)
    ✔ HS-7 snapshot hồ sơ đang ghi (thư mục .partial) không bị nạp (127.854ms)
    ℹ pass 7
    ℹ fail 0

- eval: E7
  run_id: s03-nap-ho-so-E7-20261110T102310Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_regress
  verified_at: 2026-11-10T10:23:10Z
  output: |
    ✔ PL34-AC-4 tập tệp: mọi tệp test nhắc {S03}-import-daily đúng bằng bảy tệp kê trước; thiếu một thì đỏ gọi tên (86.5245ms)
    ℹ tests 134
    ℹ pass 134
    ℹ fail 0
    ℹ skipped 0
    ℹ duration_ms 64598.356875

- eval: E8
  run_id: s03-nap-ho-so-E8-20261110T102321Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.snh_scope
  verified_at: 2026-11-10T10:23:21Z
  output: |
    SCOPE OK
    (merge-base 16416a09 → HEAD: ngoài _acceptance/, PRODUCT-MAP.md, LO-TRINH.html chỉ còn
     pipeline/cron/com.oneinvest.s03-nap-15phut.plist, scripts/s03-nap-ho-so.test.mjs,
     scripts/s03-nap-nhanh.test.mjs, scripts/zalo-import-daily.sh — không dòng NGOAI PHAM VI)

## Known limits

- Vòng hồ sơ gặp thư mục hồ sơ KHÔNG ẩn mà thiếu `manifest.json` thì dừng vòng ngay và giữ con trỏ, nhưng `HS_RC` vẫn bằng 0: không có dòng JOB FAIL, tác vụ thoát 0, mọi snapshot hồ sơ sau nó bị chặn mãi mà không ai thấy (vòng tin có nhánh mồ côi ≥30′ và bật FAILED; vòng hồ sơ thì không). Rủi ro thấp vì bộ ghi của collector ghi vào `.…partial` rồi rename sau khi ghi manifest (`collector/src/core/storage.ts`). Chỗ: `scripts/zalo-import-daily.sh:179`. Sửa: đặt `HS_RC=5` (hoặc nhánh mồ côi ≥30′ như vòng tin) trước `break`.
- Bộ test dùng node giả in vài dòng, nên không phủ trường hợp đầu ra importer lớn (xem mục Ngoài hợp đồng) và không phủ nhánh `find` lỗi (`HS_RC=3`).
- Hai snapshot hồ sơ trùng mốc ở hai thành phố khác nhau: nếu cái đầu nạp được, cái sau hỏng thì con trỏ đã bằng mốc chung và cái sau bị bỏ ở lượt kế. Hiện collector API ghi hồ sơ theo một thành phố, nên chưa xảy ra; vòng tin có cùng giới hạn.
- Vòng tin hỏng (`FAILED=1`) thoát trước vòng hồ sơ, nên lượt đó cũng không nạp hồ sơ; lượt sau nạp bù vì con trỏ hồ sơ không đổi.

## Ngoài hợp đồng

- (JOB A, mức trung bình, tiềm ẩn) `scripts/zalo-import-daily.sh:185`: `printf '%s' "$OUT" | grep -q "CHUA-AP-080"` chạy dưới `set -o pipefail`. `grep -q` thoát ngay khi gặp dòng khớp; nếu đầu ra importer vượt bộ đệm pipe (~64 KB) và dòng `CHUA-AP-080` nằm ở đầu, `printf` nhận SIGPIPE, pipeline trả mã 141, điều kiện `if` thành sai, và con trỏ hồ sơ tiến qua snapshot CHƯA nạp. Đó chính là kiểu mất dữ liệu Ngoài-6. Đã tái hiện bằng bash thật (đầu ra 20.000 dòng, 5/5 lần không bắt được). Với importer hôm nay đầu ra chỉ vài dòng, nên chưa xảy ra. Sửa: `grep -q "CHUA-AP-080" <<<"$OUT"` hoặc `[[ $OUT == *CHUA-AP-080* ]]`, kèm một ca test node giả in trên 64 KB sau dòng CHUA-AP-080.

## Analyst

Baseline khong do: E1–E6 — tệp `scripts/s03-nap-ho-so.test.mjs` chưa có trên diffBase 65b8ff78 (eval mới; chạy trên code cũ không chứng minh gì). E7, E8 là lệnh hồi quy và phạm vi, không đo baseline. Hợp đồng ghi phép đột biến của liên làn (bỏ kiểm CHUA-AP-080, dùng chung con trỏ tin, bỏ gán JOB_RC: mỗi đột biến làm đỏ ít nhất một ca); lượt chấm này không chạy lại các đột biến đó.

Đối chiếu importer (`pipeline/import-airbnb.mjs`): khi thiếu bảng `stg_s03_ho_so`, `main` in `CHUA-AP-080`, bỏ mọi item hồ sơ, không ghi `airbnb_snapshots` khi snapshot chỉ có hồ sơ, rồi COMMIT và thoát 0. Có bảng thì `napHoSo` chèn với `ON CONFLICT (source_id) DO NOTHING`. Hai hành vi này khớp với giả định của tệp bọc và của node giả trong test.

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: E1–E8 đạt; không trả về sửa.
