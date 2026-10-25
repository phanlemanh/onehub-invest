---
schema_version: 2
feature_slug: chotot-khong-lui
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 71322cd081738d65375a11f63fa0c9e98947c217
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: chotot-khong-lui

Vòng verify 1 trên cây `71322cd`, nhánh `claude/acceptance-chotot-khong-lui`. Cây này là ZCode `8bb54ae` (2510-6) gộp
`origin/main` `a2c2122`, cộng hồ sơ. DB local :5433 chạy trong container `one-invest-db`. Phiên chấm không viết mã này.

Cả 8 eval đạt `expected`, kể cả các vế should-NOT-fire. Nạp snapshot cũ sau bản mới không đổi md5 của dòng: giá vẫn
1200000000, tiêu đề vẫn «bản mới». Trên importer của main, đúng phép đo đó đỏ (giá lùi về 1000000000, tiêu đề «bản cũ»).
Mọi lượt harness chạy trên DB tạm `acc_ckl_*` / `acc_capt_*`, và các DB tạm đều đã bị xoá. Dấu DB oneinvest trước và sau
phiên giống hệt nhau. «Ngoài hợp đồng» có 3 mục mức low, chi tiết ở `review-findings.md`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | script | PASS |

## Evidence

E1 và E4 dùng chung một lượt `ckl_khong_lui`, mỗi eval có một dòng run-log riêng. Bộ `scripts/` chạy với
`DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest`.

- eval: E1
  run_id: chotot-khong-lui-E1-r1-20261025T123419Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ckl_khong_lui
  verified_at: 2026-10-25T12:34:19Z
  output: |
    DB tạm: acc_ckl_93678_59052 (không phải oneinvest)
    ok   nạp snapshot mới
    ok   nạp snapshot cũ sau (thoát 0)
    ok   should-NOT-fire: nạp cũ sau mới không đổi dòng — giá 1200000000 (mới 1200000000), tiêu đề «bản mới»
    ok   snapshot_id + captured_at giữ bản mới
    ok   bất biến: captured_at = collected_at của snapshot dòng đang trỏ
    KHONG-LUI PASS
  note: should-NOT-fire đạt. md5 ghép từ giá, tiêu đề, payload, snapshot_id và captured_at giống nhau trước và sau lượt nạp cũ. Trên baseline, chính dòng này đỏ với «giá 1000000000 (mới 1200000000), tiêu đề «bản cũ»», trong khi snapshot_id và captured_at vẫn giữ bản mới. Đó đúng là lỗi Ngoài-1 của giu-captured-at.

- eval: E2
  run_id: chotot-khong-lui-E2-r1-20261025T123428Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ckl_tien
  verified_at: 2026-10-25T12:34:28Z
  output: |
    ok   nạp mới sau cũ (thoát 0)
    ok   nội dung tiến theo bản mới (giá 1200000000, tiêu đề «bản mới»)
    ok   snapshot_id + captured_at tiến cùng nhau
    ok   tin chỉ có ở bản mới được thêm
    ok   bất biến captured_at = collected_at
    TIEN PASS

- eval: E3
  run_id: chotot-khong-lui-E3-r1-20261025T123433Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ckl_idempotent
  verified_at: 2026-10-25T12:34:33Z
  output: |
    ok   nạp lại cùng snapshot: không nhân dòng (2 → 2), dòng không đổi
    ok   bằng mốc thu: cập nhật như cũ (giá 1250000000)
    ok   bất biến captured_at = collected_at
    IDEMPOTENT PASS
  note: should-NOT-fire đạt. Nạp lại cùng snapshot thì số dòng giữ 2 và md5 không đổi. Snapshot khác tên nhưng cùng finishedAt thì vẫn cập nhật nhờ `>=`.

- eval: E4
  run_id: chotot-khong-lui-E4-r1-20261025T123419Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ckl_khong_lui
  verified_at: 2026-10-25T12:34:19Z
  output: |
    ok   snapshot_id + captured_at giữ bản mới
    ok   bất biến: captured_at = collected_at của snapshot dòng đang trỏ
    KHONG-LUI PASS
  note: dòng bất biến ok ở cả ba chế độ. Ở khong-lui là dòng trên. Ở tien (E2) và idempotent (E3) là dòng «ok bất biến captured_at = collected_at». Phép đếm là số dòng JOIN `airbnb_snapshots` có `captured_at <> collected_at`, và nó bằng 0 cả ba lần.

- eval: E5
  run_id: chotot-khong-lui-E5-r1-20261025T123434Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.capt_chotot
  verified_at: 2026-10-25T12:34:34Z
  output: |
    ok   INSERT mới: captured_at = giờ thu snapshot (manifest.finishedAt)
    ok   snapshot MỚI hơn: snapshot_id VÀ captured_at cùng tiến
    ok   should-NOT-fire: nạp lại snapshot CŨ sau → snapshot_id và captured_at không lùi
    ok   bất biến: captured_at = collected_at của snapshot dòng đang trỏ (0 dòng lệch)
    ghi nhận: giá sau khi nạp lại snapshot cũ = 1200000000 (snapshot mới 1200000000)
    CHOTOT PASS
  note: dòng «ghi nhận» của kiểm giu-captured-at đổi từ 1000000000 (baseline) sang 1200000000 (HEAD). Đây là bằng chứng chéo cho AC-1, do một harness độc lập in ra.

- eval: E6
  run_id: chotot-khong-lui-E6-r1-20261025T123434Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ckl_unit
  verified_at: 2026-10-25T12:34:34Z
  output: |
    ✔ upsert có WHERE EXCLUDED.captured_at >= dòng hiện có, đặt SAU mọi SET
    ✔ các cột nội dung + snapshot_id + captured_at đặt THẲNG EXCLUDED (hết CASE của 2410-1 v2)
    ✔ should-NOT-fire: dấu bằng bị đổi thành > sẽ hổng 'nạp lại cùng snapshot'
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0

- eval: E7
  run_id: chotot-khong-lui-E7-r1-20261025T123438Z
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-25T12:34:38Z
  output: |
    ▶ GT-AC-1 S06 importer thật
      ✔ GT-AC-1 importer thật nạp lại snapshot S06 cũ → stale, last = finishedAt
      ✔ GT-AC-1 đối chứng: importer thật nạp snapshot thu 10 giờ → fresh
    ℹ tests 178
    ℹ pass 178
    ℹ fail 0
    ℹ skipped 0
  note: bộ chạy trong 26 giây, không ca nào bị bỏ qua. GT-AC-1 chạy `pipeline/import-chotot.mjs` thật bằng spawn với đường tuyệt đối, nên guard `main()` mới không chặn nó.

- eval: E8
  run_id: chotot-khong-lui-E8-r1-20261025T123508Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ckl_scope
  verified_at: 2026-10-25T12:35:08Z
  output: |
    ok  _acceptance/config.yaml
    ok  pipeline/import-chotot.mjs
    ok  pipeline/scripts/chotot-khong-lui-noi-dung.test.mjs
    ok  scripts/chotot-khong-lui/acceptance.mjs
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Probe còn liệt kê LO-TRINH.html, PRODUCT-MAP.md và ba tệp của hồ sơ, tất cả đều ok. Ngoài commit chỉ có run-log.jsonl mới của hồ sơ này.

Network truth: không có eval `ui-check` nào. Cả 8 eval là script hoặc test, không có đường mạng: n-a (driver).

## Known limits

- Dòng cũ có `captured_at` NULL không bao giờ được cập nhật. Hợp đồng đã chấp nhận (Out of scope). DB oneinvest hiện có
  0 dòng như vậy. Probe N1 xác nhận: trên HEAD dòng giữ bản cũ, còn trên main nội dung vẫn tiến nhưng `captured_at` kẹt
  NULL. OOC-1 là đường sinh thêm dòng NULL mới.
- Hai snapshot khác nhau cùng mốc thu: bản nạp sau thắng (hợp đồng chấp nhận, E3 đo).
- Dữ liệu đã bị lùi trước vòng này không được khôi phục. `import-airbnb` giữ luật LEAST. Cả hai nằm trong Out of scope.

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Cả ba chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): manifest thiếu `finishedAt` làm importer ghi `captured_at` NULL, và từ vòng này dòng đó đóng băng vĩnh
  viễn vì WHERE so với NULL. Probe N2 đã tái hiện: trên HEAD dòng giữ «không finishedAt», giá 900000000; trên main dòng
  tiến lên giá 1200000000. `collect-chotot.mjs` luôn ghi `finishedAt` nên xác suất thấp. Đề xuất new-contract (từ chối
  manifest thiếu finishedAt, hoặc thêm `IS NULL OR` vào WHERE; làn ZCode).
- OOC-2 (low): log «✅ N ads → stg_chotot_ads» đếm cả những tin mà WHERE đã chặn (`n++` theo item, không đọc `rowCount`).
  Người nạp bù snapshot cũ thấy «nạp đủ» dù không dòng nào đổi. Đề xuất known-limits.
- OOC-3 (low): guard `main()` chỉ realpath vế `argv[1]`. Với `NODE_OPTIONS=--preserve-symlinks-main`, đi qua đường
  symlink thì importer thoát 0, không in gì và không nạp gì (probe G5). Trong kho không chỗ nào dùng cờ này. Guard chép
  nếp có sẵn của `import-airbnb.mjs`. Đề xuất known-limits.

## Analyst

Non-discriminating evals:
- E2 (`ckl_tien`) và E3 (`ckl_idempotent`) xanh trên baseline. Đây là guard hồi quy có chủ ý: AC-2 và AC-3 đòi hai
  hướng nạp đúng của main không bị WHERE mới làm hỏng. Hợp đồng (Notes) đã ghi trước «tien và idempotent xanh» trên main.
  Riêng vế «bằng mốc thì cập nhật» của E3 có thêm răng ở E6, ca should-NOT-fire «đổi `>=` thành `>`».
- E4 xanh trên baseline: main cũng giữ `captured_at = collected_at`, vì CASE của 2410-1 v2 đẩy snapshot_id và captured_at
  cùng nhau. Đây là guard để bất biến không gãy khi bỏ CASE.
- E5 (`capt_chotot`) và E7 (`scripts`) xanh trên baseline: guard hồi quy theo AC-5. Dòng «ghi nhận» của E5 vẫn đổi từ
  1000000000 sang 1200000000.
- Eval phân biệt là E1 (should-NOT-fire của AC-1). Nó đỏ trên baseline đúng ở dòng giá và tiêu đề.

Baseline khong do:
- E6 (`ckl_unit`): tệp test `pipeline/scripts/chotot-khong-lui-noi-dung.test.mjs` chưa có trên diffBase, và nó import
  `UPSERT_SQL` mà importer của main không export.
- E8 (`ckl_scope`): probe đo danh sách tệp đổi `merge-base..HEAD` của nhánh. Trên cây diffBase phép đo này rỗng.

Cách đo baseline: rsync `pipeline/` (không node_modules) và `scripts/` của HEAD sang scratchpad, symlink
`pipeline/node_modules` về kho, rồi ghi đè `pipeline/import-chotot.mjs` bằng `git show origin/main:pipeline/import-chotot.mjs`.
Tệp này giống hệt nhau ở merge-base `a2c2122` và origin/main `169b8c6`; bản ghi đè có CASE WHEN của 2410-1 v2 và gọi
`main()` không guard. Kết quả:
- khong-lui đỏ: dòng should-NOT-fire báo giá 1000000000, tiêu đề «bản cũ». Hai dòng snapshot_id/captured_at và bất biến
  vẫn ok.
- tien: TIEN PASS. idempotent: IDEMPOTENT PASS.
- capt_chotot: CHOTOT PASS, «ghi nhận: giá … = 1000000000».
- `node --test scripts/check-freshness.test.mjs`: 39/39, GT-AC-1 hai ca ✔. Đây là bộ duy nhất trong `scripts/*.test.mjs`
  chạy importer, và diff `scripts/` của nhánh chỉ thêm harness. Toàn bộ `scripts/*.test.mjs` chạy trên bản chép thì có
  ca đỏ, nhưng đó là các ca cần thư mục là một kho git (ON16, ON7-AC-3, ZL-AC-*, git check-ignore), không liên quan
  importer, nên không lấy làm số baseline.

Kiểm thêm, không phải eval (chi tiết ở `review-findings.md`):
- Guard `main()` qua symlink, kiểm thật. Một symlink thư mục tạm trỏ tới bản chép HEAD, dựng y như
  `~/dev/one-invest → onehub-invest`, vì plist `com.oneinvest.chotot` gọi đúng đường symlink. Chạy
  `/bin/bash <symlink>/scripts/chotot-daily.sh` với collect, transform, refresh và resolve thay bằng stub, DB tạm: thoát 0,
  «✅ 1 ads», 1 dòng. Gọi thẳng importer qua symlink thư mục, qua symlink tệp, hay đường tương đối với cwd symlink đều nạp
  1 dòng. `import { UPSERT_SQL }` không chạy `main()`. Với DB ở cổng đóng qua symlink, importer in dòng `❌ ECONNREFUSED`,
  nên vòng thử lại của `chotot-daily.sh` vẫn bắt được.
- `WHERE >=` với NULL: probe N1 và N2, xem Known limits và OOC-1.
- Hai snapshot cùng mốc thu: E3. Snapshot cũ chứa tin chưa có thì vẫn được thêm (probe N3).
- Dấu DB oneinvest trước và sau phiên giống hệt nhau: `stg_chotot_ads` 17810 dòng, md5 `15ababbf…`;
  `airbnb_snapshots` 2466 dòng. Không còn DB `acc_*` nào sót lại.
- origin/main đã tiến tới `169b8c6` (#106 khoa-nap-s05-paused) sau cây được chấm. Gộp thử bằng `git merge-tree` có xung
  đột ở `_acceptance/config.yaml`, `PRODUCT-MAP.md` và `LO-TRINH.html`, toàn là tệp cổng hoặc tệp máy sinh, không tệp mã
  nào. `pipeline/import-chotot.mjs` không đổi trên main. Làn merge cần gộp lại và ghim lại (repin).

## Variance

none — 8 eval tất định, mỗi lệnh chạy một lần trên HEAD. E1 và E4 dùng chung một output.

## Iterations

Round 1: 8/8 eval đạt trên `71322cd`. Baseline đỏ ở E1 (giá lùi về 1000000000). E2–E5 và E7 xanh trên baseline, là
guard có chủ ý. E6 và E8 không đo baseline. Guard `main()` qua đường symlink của launchd được kiểm thật và vẫn nạp.
«Ngoài hợp đồng» có 3 mục low, người quyết. PASS.
