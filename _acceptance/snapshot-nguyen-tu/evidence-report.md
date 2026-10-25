---
schema_version: 2
feature_slug: snapshot-nguyen-tu
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: e0a8505be8d687c7652a940cbfc17d154aea2382
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: snapshot-nguyen-tu

Vòng verify 1, cây `e0a8505` (nhánh `claude/acceptance-snapshot-nguyen-tu` = origin/main `5104013` + ZCode
`zcode/snapshot-nguyen-tu` @ `7b6494f` + hồ sơ). Phiên chấm không viết mã này.

Cả 8 eval đạt `expected`, kể cả các vế should-NOT-fire. Snapshot đang ghi chỉ có `.<id>.partial`, còn finalize đổi tên ra
thư mục trọn vẹn. Ba writer cùng mili-giây ra ba id. Thư mục tên thật có sẵn không bị ghi vào. Hai tệp bọc dừng ở snapshot
thiếu manifest còn trẻ, bỏ qua mồ côi già và không thấy `.partial`. Hồi quy AU3 và 52/52 test collector xanh. Mục «Ngoài
hợp đồng» có 3 mục, đều mức low (xem `review-findings.md`), đang chờ người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | script | PASS |

## Evidence

E1 và E2 dùng chung một lượt `snt_dang_ghi`, E5 và E6 dùng chung một lượt `snt_mo_coi`. Mỗi eval có một dòng run-log
riêng. Lệnh nào cũng chạy từ gốc kho với timeout công cụ 600 s, và không lệnh nào bị công cụ ngắt.

- eval: E1
  run_id: snapshot-nguyen-tu-E1-r1-20261025T104855Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.snt_dang_ghi
  verified_at: 2026-10-25T10:48:55Z
  output: |
    ok   đang ghi (sau write + tải media): thư mục tên thật CHƯA có
    ok   chỉ có một thư mục ẩn '.<id>.partial' (.acc__acc-src__2026-10-25T104856383.partial)
    ok   manifest chưa có trước finalize
    DANG-GHI PASS
  note: should-NOT-fire đạt, vì lúc đang ghi không có thư mục tên thật. Trên storage.ts của origin/main, hai dòng đầu đỏ (thư mục tên thật `acc__acc-src__…` có ngay sau `write`), nên không có DANG-GHI PASS.

- eval: E2
  run_id: snapshot-nguyen-tu-E2-r1-20261025T104855Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.snt_dang_ghi
  verified_at: 2026-10-25T10:48:55Z
  output: |
    ok   sau finalize: chỉ còn thư mục tên thật (acc__acc-src__2026-10-25T104856383)
    ok   thư mục tên thật trọn vẹn: manifest + items + media khớp sha256 (ok)
    ok   tệp media nằm trong thư mục tên thật
    DANG-GHI PASS
  note: cùng lượt với E1. Gốc tạm chưa có thư mục city, nên nhánh ENOENT của constructor được chạy qua. Baseline đỏ vì cùng lệnh với E1 (lượt main dừng ở vế đang ghi).

- eval: E3
  run_id: snapshot-nguyen-tu-E3-r1-20261025T104907Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snt_trung_ms
  verified_at: 2026-10-25T10:49:07Z
  output: |
    ok   ba writer cùng ms ra ba id khác nhau (acc__acc-src__2026-10-25T100000123 · acc__acc-src__2026-10-25T100000123-1 · acc__acc-src__2026-10-25T100000123-2)
    ok   không còn thư mục '.partial' nào
    ok   acc__acc-src__2026-10-25T100000123: trọn vẹn, đúng item của chính nó (ok)
    ok   acc__acc-src__2026-10-25T100000123-1: trọn vẹn, đúng item của chính nó (ok)
    ok   acc__acc-src__2026-10-25T100000123-2: trọn vẹn, đúng item của chính nó (ok)
    TRUNG-MS PASS
  note: main xanh, vì ở main thư mục tên thật có ngay lúc `write` nên chốt `existsSync` cũ đủ tách. Eval phân biệt được hai vòng lỗi: cb174db và dd1ea44c đều sập ENOTEMPTY ở rename. Xem Analyst.

- eval: E4
  run_id: snapshot-nguyen-tu-E4-r1-20261025T104911Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.snt_ten_that_co_san
  verified_at: 2026-10-25T10:49:11Z
  output: |
    ok   writer mới lấy hậu tố (acc__acc-src__2026-10-25T100000456-1)
    ok   should-NOT-fire: thư mục cũ cùng tên không bị ghi vào
    ok   snapshot mới trọn vẹn
    TEN-THAT-CO-SAN PASS
  note: should-NOT-fire đạt. Baseline main đỏ, nhưng vì bước dựng của harness (rmSync `.partial` mà main không tạo, ENOENT), không phải vì hành vi. Bản harness nới bước dọn cho main xanh, nên đây là guard với main. Trên dd1ea44c, eval đỏ đúng lý do: hai dòng đầu báo writer không lấy hậu tố và ghi vào thư mục cũ. Xem Analyst.

- eval: E5
  run_id: snapshot-nguyen-tu-E5-r1-20261025T104920Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-10-25T10:49:20Z
  output: |
    zalo-import-daily.sh (a) mồ côi trẻ: chuỗi dừng (mã thoát khác 0) · nạp [2026-10-24T090755] · state 2026-10-24T090755
    ok   zalo-import-daily.sh (a): nạp snapshot TRƯỚC mồ côi rồi dừng
    ok   zalo-import-daily.sh (a): log 'snapshot chưa xong'
    ok   zalo-import-daily.sh (a): state giữ ở snapshot thành công cuối
    zalo-import-daily.sh (b) mồ côi già: exit 0 · nạp [2026-10-24T090755, 2026-10-24T090800123, 2026-10-24T090800123-1] · state 2026-10-24T090800123-1
    ok   zalo-import-daily.sh (b): log 'snapshot mồ côi'
    MO-COI PASS
  note: trích, dòng tóm tắt (a) đã đổi mã thoát thành chữ. apify-facebook-daily.sh cho cùng kết quả ở (a) và (b). should-NOT-fire đạt: thư mục thiếu manifest trẻ không bị coi là mồ côi, và state không vượt nó. Baseline chạy chế độ mo-coi trên bản chép tệp bọc của origin/main: ở (a) cả hai tệp nạp luôn snapshot thiếu manifest `090759` và đẩy state tới `090800123-1` (đúng sự cố mất dữ liệu); ở (b) không có log «mồ côi»; tổng 10 mục đỏ.

- eval: E6
  run_id: snapshot-nguyen-tu-E6-r1-20261025T104920Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.snt_mo_coi
  verified_at: 2026-10-25T10:49:20Z
  output: |
    apify-facebook-daily.sh (c) .partial: exit 0 · nạp [2026-10-24T090755, 2026-10-24T090800123, 2026-10-24T090800123-1] · state 2026-10-24T090800123-1
    ok   apify-facebook-daily.sh (c): dir .partial không được nạp
    ok   apify-facebook-daily.sh (c): .partial vô hình — không log, không chặn
    ok   apify-facebook-daily.sh (c): state không nhảy theo .partial
    ok   zalo-import-daily.sh (c): dir .partial không được nạp
    ok   zalo-import-daily.sh (c): state không nhảy theo .partial
    MO-COI PASS
  note: should-NOT-fire đạt. Vế (c) cũng xanh trên tệp bọc của main, vì glob `*` của bash không khớp tên bắt đầu bằng dấu chấm. Cả lệnh vẫn đỏ trên main, nhưng do vế (a) và (b). Xem Analyst.

- eval: E7
  run_id: snapshot-nguyen-tu-E7-r1-20261025T104926Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kns_au3_regress
  verified_at: 2026-10-25T10:49:26Z
  output: |
    TS-FORMAT PASS
    APIFY PASS
    CHOTOT PASS
    LOCK PASS
  note: guard hồi quy có chủ ý. Bốn chế độ xanh trên origin/main (harness và tệp bọc của main), và cũng xanh khi chạy harness HEAD trên tệp bọc của main.

- eval: E8
  run_id: snapshot-nguyen-tu-E8-r1-20261025T104937Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-25T10:49:37Z
  output: |
    ✔ 2510-8: đang ghi chỉ có '.partial'; finalize rename ra tên thật trọn vẹn (items + media + manifest)
    ✔ 2510-8 vòng 2 (MỞ LẠI): hai writer cùng city/source cùng mili-giây — hai sid riêng, không chung .partial, cả hai finalize trọn vẹn
    ✔ 2510-8 vòng 3 (MỞ LẠI): cùng ms nhưng A ĐÃ finalize — B vẫn lấy sid khác; tên thật có sẵn cùng sid → hậu tố -1
    ℹ tests 52
    ℹ pass 52
    ℹ fail 0
    ℹ skipped 0
  note: dist bị xoá rồi build lại sạch, bộ chạy 110 s. Baseline: bản biên dịch HEAD của `snapshot-nguyen-tu.test.js` chạy với storage.ts của origin/main cho «ℹ pass 1», «ℹ fail 2» (hai ca đầu đỏ). Ca vòng 3 xanh trên main, cùng lý do E4.

Network truth: không có eval `ui-check` nào. Cả 8 eval là `script`, không có đường mạng: n-a (driver).

Kho sau các lượt chạy: `git status` chỉ có `app/next-env.d.ts` (có từ trước phiên chấm) cùng tệp mới của hồ sơ này.
`collector/dist` được build lại (gitignored). Thư mục tạm `acc-snt-*`/`acc-skip-*` đã dọn hết.

## Known limits

- Writer bị kill để lại `.<id>.partial` vĩnh viễn, không có bước dọn (Out of scope của hợp đồng). Từ vòng này, lượt thu
  bị skip cũng để lại `.partial` rỗng (OOC-1).
- Thư mục thiếu manifest già hơn 30′ bị bỏ qua vĩnh viễn, đúng AC-4. Cổng đo mtime thư mục cấp đầu (OOC-2).
- Triển khai collector :9210 bản build mới (ZC4) là lời giao riêng. Trước đó, bản đang chạy vẫn ghi kiểu cũ và chỉ cổng
  manifest của tệp bọc che chắn.

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Cả ba chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): `scheduler.ts` tạo `SnapshotWriter` trước hai cổng skip (cửa sổ giờ, cap ngày), nên mỗi lượt CLI bị skip
  để lại một `.partial` rỗng. Đã tái hiện: 3 lượt cho 3 thư mục; main không tạo gì. Đề xuất new-contract (lời giao riêng cho làn ZCode).
- OOC-2 (low): cổng 30′ đo mtime thư mục cấp đầu. Writer kiểu cũ (trước ZC4) ghi ảnh vào `media/` nên mtime cấp đầu
  đứng yên; lượt tải ảnh quá 30′ bị coi là mồ côi và state vượt qua nó. Đề xuất known-limits.
- OOC-3 (low, lý thuyết): giữa `existsSync(tên thật)` và `mkdirSync(.partial)` có khe đua với `rename` của writer khác.
  Hai writer có thể chung sid; writer sau gặp ENOTEMPTY và ở `server.ts` kẹt lại vì tái dùng writer. Đề xuất known-limits.

## Analyst

Non-discriminating evals:
- **E3 (`snt_trung_ms`)**: xanh trên main, vì ở main tên thật xuất hiện ngay lúc `write`, nên chốt `existsSync` cũ đủ tách
  hai writer cùng ms. Eval này canh thiết kế `.partial` mới. Với storage.ts biên dịch từ hai vòng lỗi, nó đỏ đúng lý do:
  cb174db1 và dd1ea44c đều sập ENOTEMPTY ở rename, vì hai writer cùng ms chung một `.partial`. Đây là guard hồi quy có
  chủ ý cho chính lỗi của hai vòng MỞ LẠI.
- **E4 (`snt_ten_that_co_san`)**: cột baseline ghi red, nhưng trên main eval đỏ vì bước dựng của harness (gỡ `.partial`
  mà main không tạo) chứ không vì hành vi. Bản chép harness nới `force: true` và `recursive: true` ở bước dựng cho main
  xanh, vì main vốn có chốt tên thật. Eval phân biệt được với dd1ea44c, vòng làm mất chốt này: writer không lấy hậu tố và
  ghi vào thư mục cũ. Đây là guard với main.
- **E6 (`snt_mo_coi`, vế .partial)**: vế (c) xanh trên tệp bọc của main, vì glob `*` của bash không khớp thư mục bắt đầu
  bằng dấu chấm. Dòng kiểm `${b#.}` mới thêm là lớp phòng hờ, và eval là guard. Cả lệnh vẫn đỏ trên main, do vế (a) và (b).
- E7 (`kns_au3_regress`) xanh trên main: guard hồi quy có chủ ý theo AC-6.

Cách đo baseline:
- storage.ts của `origin/main`, `cb174db1`, `dd1ea44c`, `7b6494f7`: lấy bằng `git show "${ref}:collector/src/core/storage.ts"`
  cùng `types.ts`, biên dịch bằng `collector/node_modules/.bin/tsc --module nodenext --moduleResolution nodenext --target es2022 --skipLibCheck`
  vào scratchpad (`package.json` `{"type":"module"}`), rồi chạy ba chế độ harness với `SNT_STORAGE`. Kết quả khớp mục
  Notes của hợp đồng:
  - main: dang-ghi đỏ.
  - cb174db1: trung-ms ENOTEMPTY.
  - dd1ea44c: ten-that-co-san đỏ, trung-ms ENOTEMPTY.
  - 7b6494f7: cả ba xanh.
- E5/E6: bản chép trong scratchpad gồm harness AU3 của HEAD, tệp bọc apify/zalo/chotot của `origin/main`, `scripts/lib/job-step.sh`
  và các importer. Chạy chế độ mo-coi cho «MO-COI FAIL (10 mục)»: (a) và (b) đỏ ở cả hai tệp bọc, (c) xanh.
- E7: harness và tệp bọc của `origin/main` cho bốn PASS.
- E8: test mới đã biên dịch, chạy với storage.js của main, cho hai ca đỏ và một ca xanh.

## Variance

none — 8 eval tất định, mỗi lệnh chạy một lần trên HEAD. Các eval chung lệnh thì dùng chung một output (E1/E2; E5/E6).

## Iterations

Round 1: 8/8 eval đạt trên `e0a8505`. Baseline đỏ ở E1, E2, E5, E8. E3, E6 và E7 xanh trên main (guard). E4 đỏ trên main
vì bước dựng của harness, nhưng phân biệt được với vòng lỗi dd1ea44c. «Ngoài hợp đồng» có 3 mục low chờ người quyết. PASS.
