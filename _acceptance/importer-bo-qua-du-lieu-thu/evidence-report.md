---
schema_version: 2
feature_slug: importer-bo-qua-du-lieu-thu
verdict: REJECT
failed_evals: [E3]
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: bc6d54dffdd2a5d17ef5fd0006979eeb330bcfef
human_signoff:
---

# Evidence Report: importer-bo-qua-du-lieu-thu

Vòng verify 2 · phiên chấm ngữ cảnh sạch · 25/10/2026 (05:20–05:22 UTC) · cây `bc6d54d`
(nhánh `claude/acceptance-importer-bo-qua-du-lieu-thu-r4` = zcode `e5f9be9` + `origin/main` 47afb91).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | test | FAIL |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-10 | script | PASS |
| E12 | AC-11 | script | PASS |

**Vì sao E3 trượt.** Lệnh `cd pipeline && npm test` thoát 0, 135/135 ca xanh. Nhưng `expected` của E3 gọi đích danh hai ca, và cả hai không còn trong bộ test:
- ca «isTestSnapshot: nhận diện zalo-mock / e2e / TEST; nguồn thật không dính»: commit `d9b9ace` (vòng code 3) đổi tên thành «isTestSnapshot (nghĩa mới = ngoài allowlist): theo segment nguồn của tên dir», và bỏ assert «chữ test nằm lõi trong tên nguồn thật»;
- ca «isTestSnapshot: đường dẫn có dấu / cuối vẫn nhận ra»: bị xoá ở `d9b9ace`, không có ca thay. `grep` cả `pipeline/**/*.test.mjs` không thấy ca unit nào về «/» cuối.

Một ca vắng mặt thì không thể tính là «xanh». Lỗi nằm ở hồ sơ (evals.yaml chưa cập nhật theo vòng code 3–4), không nằm ở hành vi importer: AC-2 vẫn đúng trên thực tế, do E2 chứng (chotot `e2e` có «/» cuối bị bỏ; nạp lại airbnb kèm «/» vẫn 2 dòng) và E1 chứng (5 snapshot thử thật, 10/10 lần có và không có «/»). Cách sửa: đổi `expected` của E3 sang tên ca hiện có, hoặc thêm lại một ca unit cho «/» cuối gọi `parseSnapshotDirName(basename(...))`, rồi chấm lại.

Số đếm DB local :5433 trước và sau cả vòng (SELECT chỉ đọc): `airbnb_snapshots` 2.162 → 2.162 · `stg_zalo_posts` 6.981 → 6.981 · `stg_chotot_ads` 17.810 → 17.810. Dòng mang snapshot_id thử theo regex `__(zalo-mock|e2e|test)(__|$)`: 1.263 → 1.263 (3 ở `airbnb_snapshots` và 1.260 ở `stg_zalo_posts`).
Dọn: sau lượt cuối, 0 dòng có snapshot_id chứa `2001-01-0` ở cả `airbnb_snapshots`, `stg_zalo_posts` và `stg_chotot_ads`. Ngoài ra còn 0 dòng mang các tên ca 6 không chứa mốc (`hanoi__zalo-agent__e2e`, `hanoi__zalo-agent__2001-01-01`, `hanoi__chotot-ads__TEST`, `hanoi__zalo-agent__TEST…`), 0 `post_id` dạng `acc-pl1-%` và 0 `list_id` ≥ 990.000.000.
Nguồn từng nạp vào `airbnb_snapshots` gồm zalo-agent, airbnb-listing, airbnb-discovery, chotot-ads, airdna-research, osm-boundaries và zalo-mock (3 dòng thử cũ). Mọi nguồn thật đều nằm trong allowlist của importer tương ứng.

## Evidence

- eval: E1
  run_id: importer-bo-qua-du-lieu-thu-E1-r2-20261025T052028Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_real_mock
  verified_at: 2026-10-25T05:20:29Z
  output: |
    snapshot thử trên máy: 5 · dòng stg mang snapshot_id thử TRƯỚC: 1263 {"airbnb_snapshots":3,"stg_abnb_discovery":0,"stg_abnb_listings":0,"stg_abnb_nights":0,"stg_chotot_ads":0,"stg_osm_boundaries":0,"stg_zalo_posts":1260}
    ok   có snapshot thử thật để thử (không đo rỗng)
    ok   import-airbnb bỏ qua cả 5 snapshot thử, có và không có «/» cuối (10/10 lần, exit 0, có log)
    dòng stg mang snapshot_id thử SAU: 1263 · stg_zalo_posts tổng 6981 → 6981
    ok   0 dòng stg mới mang snapshot_id thử
    ok   should-NOT-fire: dòng thử cũ KHÔNG bị xoá (PL2 lo) — số đếm giữ nguyên
    REAL-MOCK PASS

- eval: E2
  run_id: importer-bo-qua-du-lieu-thu-E2-r2-20261025T052035Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:20:36Z
  output: |
    ok   nạp lại snapshot thật (kèm «/» cuối) → vẫn 2 dòng, không nhân đôi
    ok   import-chotot: snapshot thử tên e2e (có «/» cuối) → bỏ qua, exit 0
    ok   import-chotot: snapshot thật vẫn nạp (1 dòng)
    ok   should-NOT-fire: sau mọi ca, số dòng stg mang snapshot_id thử không đổi
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E3
  run_id: importer-bo-qua-du-lieu-thu-E3-r2-20261025T052049Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-25T05:20:57Z
  output: |
    ✔ allowlist: nguồn thật đi qua, mọi nguồn khác bị chặn (kể cả lạ)
    ✔ isTestSnapshot (nghĩa mới = ngoài allowlist): theo segment nguồn của tên dir
    ✔ khuôn tên: thư mục segment thử (TEST/e2e) bị bỏ dù nguồn hợp lệ
    ✔ khuôn tên: tên thật có mốc thời gian vẫn nạp (cả 3 dạng storage)
    ✔ khuôn tên: thiếu/thừa segment hoặc mốc rác → bỏ
    ✔ TS_RE bốn bản (2 importer + 2 daily script) phải identical (BÁO 2510-5)
    ℹ tests 135 · pass 135 · fail 0 · cancelled 0
    (grep «dấu / cuối» và «zalo-mock / e2e / TEST; nguồn thật không dính» trong log: không có dòng nào)

- eval: E4
  run_id: importer-bo-qua-du-lieu-thu-E4-r2-20261025T052141Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:21:42Z
  output: |
    ok   tên thật + manifest.source=zalo-mock → bỏ qua có log, 0 dòng
    (17 dòng ok, 0 dòng trượt)
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E5
  run_id: importer-bo-qua-du-lieu-thu-E5-r2-20261025T052143Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:21:44Z
  output: |
    snapshot thật lẫn 1 item thử: exit 0 · stg_zalo_posts [acc-pl1-1792905703739-a1, acc-pl1-1792905703739-a2]
    ok   log báo bỏ 1 item thử lẫn
    ok   2 item thật vào stg, item zalo-mock không vào
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E6
  run_id: importer-bo-qua-du-lieu-thu-E6-r2-20261025T052145Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:21:46Z
  output: |
    snapshot thật lẫn 1 item thử: exit 0 · stg_zalo_posts [acc-pl1-1792905705723-a1, acc-pl1-1792905705723-a2]
    ok   nạp lại snapshot thật (kèm «/» cuối) → vẫn 2 dòng, không nhân đôi
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E7
  run_id: importer-bo-qua-du-lieu-thu-E7-r2-20261025T052147Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:21:48Z
  output: |
    ok   tên «e2e__<mốc>-5» → bỏ qua, 0 dòng
    ok   tên «zalo-agent__TEST» → bỏ qua, 0 dòng
    ok   should-NOT-fire: sau mọi ca, số dòng stg mang snapshot_id thử không đổi
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E8
  run_id: importer-bo-qua-du-lieu-thu-E8-r2-20261025T052149Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:21:50Z
  output: |
    ok   import-chotot: snapshot thử tên e2e (có «/» cuối) → bỏ qua, exit 0
    ok   import-chotot: snapshot thật vẫn nạp (1 dòng)
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E9
  run_id: importer-bo-qua-du-lieu-thu-E9-r2-20261025T052200Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_real_mock
  verified_at: 2026-10-25T05:22:01Z
  output: |
    snapshot thử trên máy: 5 · dòng stg mang snapshot_id thử TRƯỚC: 1263 {"airbnb_snapshots":3,"stg_abnb_discovery":0,"stg_abnb_listings":0,"stg_abnb_nights":0,"stg_chotot_ads":0,"stg_osm_boundaries":0,"stg_zalo_posts":1260}
    dòng stg mang snapshot_id thử SAU: 1263 · stg_zalo_posts tổng 6981 → 6981
    ok   0 dòng stg mới mang snapshot_id thử
    ok   should-NOT-fire: dòng thử cũ KHÔNG bị xoá (PL2 lo) — số đếm giữ nguyên
    REAL-MOCK PASS

- eval: E10
  run_id: importer-bo-qua-du-lieu-thu-E10-r2-20261025T052202Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:22:02Z
  output: |
    ok   import-chotot: snapshot thật vẫn nạp (1 dòng)
    ok   import-chotot: tên thật nhưng manifest.source=e2e → bỏ qua, 0 dòng
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E11
  run_id: importer-bo-qua-du-lieu-thu-E11-r2-20261025T052204Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:22:04Z
  output: |
    ok   allowlist: nguồn 'example' (có thật trên máy) → bỏ qua, 0 dòng
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E12
  run_id: importer-bo-qua-du-lieu-thu-E12-r2-20261025T052205Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-25T05:22:06Z
  output: |
    ok   khuôn tên: «zalo-agent__e2e» (đuôi không phải mốc) → bỏ qua, 0 dòng
    ok   khuôn tên: «zalo-agent__2001-01-01» (đuôi không phải mốc) → bỏ qua, 0 dòng
    ok   khuôn tên: «chotot-ads__TEST» (đuôi không phải mốc) → bỏ qua, 0 dòng
    ok   should-NOT-fire: mốc 6 chữ số (collector bản cũ) vẫn nạp
    ok   should-NOT-fire: mốc 9 chữ số + hậu tố -n (collector bản mới) vẫn nạp (ca 2)
    dọn: xoá 3 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

## Known limits

- Không chạy importer trên ~2.180 snapshot thật đang có trên máy (Out of scope của hợp đồng). Đường «snapshot thật vẫn nạp» chỉ được chứng bằng fixture có mốc năm 2001 (E5, E6, E8, E10, E12). Snapshot thật chỉ được đọc tên thư mục (`ls`): cả 2.183 tên trên máy (zalo-agent 2.083, airbnb-listing 43, airbnb-discovery 17, airdna-research 14, chotot-ads 13, osm-boundaries 7, zalo-mock 5, example 1) đều khớp khuôn `<city>__<nguồn>__<mốc>` của importer. Không tên nguồn thật nào bị khuôn tên chặn nhầm.
- `real-mock` (E1, E9) chỉ quét thư mục khớp `__(zalo-mock|e2e|test)(__|$)`. Snapshot nguồn lạ có thật trên máy (`hanoi__example__2026-10-17T153258`) không lọt vào lượt chạy trên dữ liệu thật; AC-10 chỉ được chứng bằng fixture `example` (E11).
- E7 dẫn ca should-NOT-fire «tên nguồn thật chứa chữ test ở giữa» sang «ca isTestSnapshot của E3». Assert đó đã bị bỏ ở `d9b9ace`. Với allowlist, khẳng định này đúng hiển nhiên, vì không nguồn nào trong allowlist chứa chữ «test». Bộ chấm gọi hàm thuần `parseSnapshotDirName`/`isAllowedSource` (không chạm DB): `danang__airbnb-listing__2026-10-23T032239565` và `hanoi__zalo-agent__2026-10-25T021827756-1` đều được nhận. Không eval nào còn chạy ca này.
- Các ca «bỏ qua» theo khuôn tên (E7, E12) chỉ kiểm exit 0 cùng 0 dòng, không kiểm dòng log bỏ qua; còn ca `chotot-ads__TEST` dựng snapshot 0 item nên chỉ phép đếm `airbnb_snapshots` phân biệt được. Khẳng định «có log» của AC-10 và AC-11 chỉ được đọc trong code (`console.warn` trước `process.exit(0)` hoặc `return false`), harness không kiểm.
- Harness `fixtures`: lệnh `process.exit(2)` khi kiểm trùng `list_id` vẫn nằm trong `try`, sau khi ca 1–3 đã ghi DB, nên thoát kiểu đó bỏ qua khối `finally` dọn (phát hiện vòng 1, chưa sửa). Xác suất gần 0.
- Baseline không đo ở vòng 2 (xem Analyst).
- DB :5433 dùng chung. Lượt chạy rơi vào 12:20–12:22 (+07), không trùng job nạp đêm.

## Ngoài hợp đồng

- **Allowlist của `import-airbnb.mjs` sẽ lặng lẽ chặn S08 khi nhánh `zcode/s08-danh-muc` vào main.**
  - Người dùng thấy gì: sau khi merge cả hai nhánh, mọi snapshot `vn__s08-danh-muc__<mốc>` bị `import-airbnb` bỏ với dòng log «bỏ qua snapshot nguồn ngoài ALLOWLIST 's08-danh-muc'» và mã 0. `stg_s08_inventory` đứng ở 0 dòng mà không job nào báo lỗi.
  - Căn cứ: S08 KHÔNG có importer riêng. Trên `zcode/s08-danh-muc` (75cff27), S08 nạp qua chính `pipeline/import-airbnb.mjs` (nhánh `it.source === "s08-danh-muc"`, dòng 179). `import-s08-row.mjs` chỉ là hàm ánh xạ thuần, và `collector/docs/DATA-CONTRACT.md:79` của nhánh đó ghi rõ `import-airbnb.mjs`. Cùng lúc, `AIRBNB_IMPORTER_SOURCES` của PL1 chỉ có zalo-agent, airbnb-listing, airbnb-discovery, airdna-research, osm-boundaries. Bộ chấm gọi hàm thuần trên tên snapshot S08 thật ở worktree ZCode, `vn__s08-danh-muc__2026-10-24T152955810`: khuôn tên nhận (`parse` ra `{city:"vn", source:"s08-danh-muc"}`), nhưng `isAllowedSource` trả false. Hai nhánh cùng sửa `import-airbnb.mjs` (S08 thêm 50 dòng) nên sẽ xung đột văn bản; nếu người gộp giữ allowlist mà không thêm `s08-danh-muc`, S08 rơi vào đúng ca này. Hiện main chưa có S08, nên người dùng chưa bị ảnh hưởng.
  - file: `pipeline/import-airbnb.mjs` (AIRBNB_IMPORTER_SOURCES, dòng 57–63); `zcode/s08-danh-muc:pipeline/import-airbnb.mjs:179`
  - severity: medium
  - Đề xuất: new-contract (giao việc tích hợp cho nhánh S08: thêm `s08-danh-muc` vào allowlist kèm ca test, hoặc ghi điều kiện này vào checklist merge của S08)

- **Khuôn tên của importer chặt hơn TS_RE của daily script: tên 4 phần được daily nhận nhưng importer bỏ.**
  - Người dùng thấy gì: một thư mục kiểu `hanoi__zalo-agent__x__2026-10-25T021827756` được `zalo-import-daily.sh` hoặc `apify-facebook-daily.sh` chọn (glob `*__zalo-agent__*`, `sed 's/.*__//'` tham lam nên lấy được mốc hợp lệ). Importer lại bỏ nó vì tên có 4 phần, trả mã 0, và state nhảy qua mốc đó. Đây là việc nhảy có log và không mất snapshot thật, nên hướng đi vẫn an toàn.
  - Căn cứ: chuỗi regex của bốn bản GIỐNG HỆT nhau (`^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$`), cả trên nhánh lẫn `origin/main` 47afb91, và test «TS_RE bốn bản» xanh. Chỗ lệch nằm ở phần còn lại của luật: importer đòi đúng 3 segment, còn daily chỉ xét đuôi sau `__` cuối. Bộ chấm chạy `sed` cùng `grep -E` trên tên 4 phần, và daily NHẬN. Trên đĩa không có tên nào như vậy (2.183/2.183 tên đều 3 phần).
  - file: `scripts/zalo-import-daily.sh:55-63`, `scripts/apify-facebook-daily.sh:64-72`, `pipeline/import-airbnb.mjs:31-37`
  - severity: low
  - Đề xuất: known-limits

- **`chotot-daily.sh` và `import-chotot.mjs --latest` vẫn chọn «mới nhất» bằng sort chuỗi, không lọc khuôn tên.**
  - Người dùng thấy gì: nếu có thư mục `hanoi__chotot-ads__TEST` (hoặc đuôi không phải mốc nào đó xếp sau chữ số), `sort | tail -1` chọn nó làm snapshot mới nhất. PL1 bỏ nó với mã 0, và đêm đó snapshot Chợ Tốt thật mới nhất không được nạp; transform vẫn chạy trên dữ liệu cũ mà không báo gì. Đây là phát hiện vòng 1 về `chotot-daily`. PL1 vòng 4 đã chặn tên này ở importer, nhưng bước chọn thư mục vẫn chưa lọc.
  - Căn cứ: `scripts/chotot-daily.sh:33` (`ls -1d …chotot-ads__* | sort | tail -1`, không có TS_RE như hai daily kia); `import-chotot.mjs:31-46` (`latestSnapshotDir` sắp theo `localeCompare` đường dẫn rồi mới lọc khuôn). Hiện trên máy không có thư mục nào như vậy.
  - file: `scripts/chotot-daily.sh` (làn ZCode), `pipeline/import-chotot.mjs`
  - severity: low
  - Đề xuất: known-limits

## Analyst

Non-discriminating evals:
- Vòng 2 không chạy baseline A/B (xem «Baseline khong do»), nên không xác định được eval nào xanh trên cả hai cây. Theo số vòng 1: E6 (idempotent) và mục «snapshot Chợ Tốt thật vẫn nạp» của E8 là guard hồi quy, xanh cả trên code cũ. Mục mới «mốc 9 chữ số + -n vẫn nạp» của E12 chỉ đọc lại kết quả ca 2 (`rows.length === 2`), nên nó trùng E5 chứ không phải một phép đo riêng.
- E3 hiện chỉ còn là guard «0 fail» của cả bộ pipeline; nó không còn trỏ đúng ca nào của AC-2.

Baseline khong do:
- Cả vòng 2 (E1–E12): phiên chấm chỉ được phép chạy các lệnh `config:` của evals trên cây đang verify. Dựng cây cũ để chạy `fixtures` sẽ ghi DB với một importer khác, ngoài phạm vi được giao. Ghi chú trong hợp đồng («importer vòng 3 d9b9ace đỏ 4 ca khuôn tên») là lời của người dựng hồ sơ; vòng này chưa kiểm lại.
- E1, E9: như vòng 1, không chạy `real-mock` trên code cũ vì nó sẽ ghi 5 snapshot thử thật vào stg.

Đọc code (`pipeline/import-airbnb.mjs`, `pipeline/import-chotot.mjs` @ bc6d54d):
- Thứ tự lớp chặn của `import-airbnb`: khuôn tên trên `basename(dir)`, rồi nguồn ở tên, rồi manifest mồ côi, rồi `manifest.source`, rồi lọc item. Mọi nhánh bỏ qua đều in `console.warn` trước `process.exit(0)`. `import-chotot` có khuôn tên cùng allowlist `{chotot-ads}` ở `main`, rồi lớp `manifest.source !== "chotot-ads"` trong `readSnapshot`. Như vậy phát hiện «thiếu lớp manifest.source» của vòng 1 đã được sửa, và E10 xanh.
- Nhánh ghi `stg_zalo_posts` vẫn nhận `zalo-mock` và `zalo-groups` (dòng 168), nhưng allowlist đã lọc hai nguồn này từ trước nên đó là mã chết, vô hại. DB chưa từng có snapshot `zalo-groups`.

## Variance

none — mọi eval chạy một lần, tất định; lệnh `fixtures` chạy 10 lần (E2, E4–E8, E10–E12), 10/10 đồng nhất (17 dòng ok, dọn 3 snapshot, còn 0 dòng giả); `real-mock` 2/2 đồng nhất.

## Iterations

Round 1: 9/9 eval đạt; 3 phát hiện ngoài hợp đồng (import-chotot thiếu lớp manifest.source — có thể chạm AC-7 tuỳ cách đọc; state vòng đêm với tên `…__TEST`; thoát sớm trong harness bỏ dọn) — chuyển người xét ở Gate 2.
Round 2: E3 trượt — `expected` gọi tên hai ca unit đã bị đổi tên hoặc xoá ở `d9b9ace` (ca «/» cuối không còn ca thay); hành vi importer đúng ở 11/12 eval còn lại, kể cả AC-9..11. Trả về sửa evals.yaml (E3) và/hoặc thêm lại ca unit «/» cuối; ngoài hợp đồng: allowlist chặn S08 khi gộp nhánh `zcode/s08-danh-muc` (medium).
