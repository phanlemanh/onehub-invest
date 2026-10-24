---
schema_version: 2
feature_slug: importer-bo-qua-du-lieu-thu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 75994e074e46e79acf45d6c32addae1532fce7e0
human_signoff:
---

# Evidence Report: importer-bo-qua-du-lieu-thu

Vòng verify 1 · phiên ngữ cảnh sạch · 24/10/2026 (08:10–08:20 UTC) · cây `75994e0`
(importer `pipeline/import-airbnb.mjs`, `pipeline/import-chotot.mjs` không đổi kể từ `b2f392d`).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |

Số đếm DB local :5433 (bảng có snapshot_id khớp `__(zalo-mock|e2e|test)(__|$)`), trước và sau cả vòng:
`airbnb_snapshots` 3 → 3 · `stg_zalo_posts` 1.260 → 1.260 · `stg_abnb_*`, `stg_chotot_ads`, `stg_osm_boundaries` 0 → 0
(tổng 1.263 → 1.263). Tổng toàn bảng: `airbnb_snapshots` 1.354, `stg_zalo_posts` 4.092, `stg_chotot_ads` 15.515, không đổi.
Dọn: sau mọi lượt, quét 19 cột id của các bảng `public` thấy 0 dòng `acc-pl1-`; 0 dòng `stg_chotot_ads` có list_id ≥ 990.000.000.

## Evidence

- eval: E1
  run_id: importer-bo-qua-du-lieu-thu-E1-20261024T081038
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_real_mock
  verified_at: 2026-10-24T08:10:38Z
  output: |
    snapshot thử trên máy: 5 · dòng stg mang snapshot_id thử TRƯỚC: 1263 {"airbnb_snapshots":3,"stg_abnb_discovery":0,"stg_abnb_listings":0,"stg_abnb_nights":0,"stg_chotot_ads":0,"stg_osm_boundaries":0,"stg_zalo_posts":1260}
    ok   có snapshot thử thật để thử (không đo rỗng)
    ok   import-airbnb bỏ qua cả 5 snapshot thử, có và không có «/» cuối (10/10 lần, exit 0, có log)
    dòng stg mang snapshot_id thử SAU: 1263 · stg_zalo_posts tổng 4092 → 4092
    ok   0 dòng stg mới mang snapshot_id thử
    ok   should-NOT-fire: dòng thử cũ KHÔNG bị xoá (PL2 lo) — số đếm giữ nguyên
    REAL-MOCK PASS

- eval: E2
  run_id: importer-bo-qua-du-lieu-thu-E2-20261024T081045
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:10:46Z
  output: |
    ok   tên thật + manifest.source=zalo-mock → bỏ qua có log, 0 dòng
    snapshot thật lẫn 1 item thử: exit 0 · stg_zalo_posts [acc-pl1-1792829445988-a1, acc-pl1-1792829445988-a2]
    ok   nạp lại snapshot thật (kèm «/» cuối) → vẫn 2 dòng, không nhân đôi
    ok   import-chotot: snapshot thử tên e2e (có «/» cuối) → bỏ qua, exit 0
    ok   import-chotot: snapshot thật vẫn nạp (1 dòng)
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E3
  run_id: importer-bo-qua-du-lieu-thu-E3-20261024T081059
  exit_code: 0
  baseline: red
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-24T08:11:06Z
  output: |
    ✔ isTestSnapshot: nhận diện zalo-mock / e2e / TEST; nguồn thật không dính (0.416459ms)
    ✔ isTestSnapshot: đường dẫn có dấu / cuối vẫn nhận ra (basename không rỗng) (0.055792ms)
    ℹ tests 95
    ℹ suites 3
    ℹ pass 95
    ℹ fail 0
    ℹ cancelled 0

- eval: E4
  run_id: importer-bo-qua-du-lieu-thu-E4-20261024T081112
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:11:13Z
  output: |
    ok   tên thật + manifest.source=zalo-mock → bỏ qua có log, 0 dòng
    ok   should-NOT-fire: sau mọi ca, số dòng stg mang snapshot_id thử không đổi
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E5
  run_id: importer-bo-qua-du-lieu-thu-E5-20261024T081115
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:11:15Z
  output: |
    snapshot thật lẫn 1 item thử: exit 0 · stg_zalo_posts [acc-pl1-1792829475546-a1, acc-pl1-1792829475546-a2]
    ok   log báo bỏ 1 item thử lẫn
    ok   2 item thật vào stg, item zalo-mock không vào
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E6
  run_id: importer-bo-qua-du-lieu-thu-E6-20261024T081118
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:11:18Z
  output: |
    snapshot thật lẫn 1 item thử: exit 0 · stg_zalo_posts [acc-pl1-1792829478298-a1, acc-pl1-1792829478298-a2]
    ok   2 item thật vào stg, item zalo-mock không vào
    ok   nạp lại snapshot thật (kèm «/» cuối) → vẫn 2 dòng, không nhân đôi
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E7
  run_id: importer-bo-qua-du-lieu-thu-E7-20261024T081120
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:11:21Z
  output: |
    ok   tên «e2e__acc-pl1-1792829481000» → bỏ qua, 0 dòng
    ok   tên «zalo-agent__TEST» → bỏ qua, 0 dòng
    ok   should-NOT-fire: sau mọi ca, số dòng stg mang snapshot_id thử không đổi
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    FIXTURES PASS

- eval: E8
  run_id: importer-bo-qua-du-lieu-thu-E8-20261024T081123
  exit_code: 0
  baseline: red
  verifier: config:executors.script.pl1_fixtures
  verified_at: 2026-10-24T08:11:24Z
  output: |
    ok   import-chotot: snapshot thử tên e2e (có «/» cuối) → bỏ qua, exit 0
    ok   import-chotot: snapshot thật vẫn nạp (1 dòng)
    dọn: xoá 2 snapshot + 0 dòng chotot · còn 0 dòng giả
    ok   dọn sạch dữ liệu giả
    FIXTURES PASS

- eval: E9
  run_id: importer-bo-qua-du-lieu-thu-E9-20261024T081126
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl1_real_mock
  verified_at: 2026-10-24T08:11:26Z
  output: |
    snapshot thử trên máy: 5 · dòng stg mang snapshot_id thử TRƯỚC: 1263 {"airbnb_snapshots":3,"stg_abnb_discovery":0,"stg_abnb_listings":0,"stg_abnb_nights":0,"stg_chotot_ads":0,"stg_osm_boundaries":0,"stg_zalo_posts":1260}
    ok   import-airbnb bỏ qua cả 5 snapshot thử, có và không có «/» cuối (10/10 lần, exit 0, có log)
    dòng stg mang snapshot_id thử SAU: 1263 · stg_zalo_posts tổng 4092 → 4092
    ok   0 dòng stg mới mang snapshot_id thử
    ok   should-NOT-fire: dòng thử cũ KHÔNG bị xoá (PL2 lo) — số đếm giữ nguyên
    REAL-MOCK PASS

## Known limits

- Không chạy importer trên ~1.380 snapshot thật đang có (descope d-…-2): đường «snapshot thật vẫn nạp» chỉ được chứng bằng fixture tiền tố `acc-pl1-` (E5, E6, E8). Snapshot thật chỉ được đọc (`ls`, đọc manifest và item); quét 1.380 snapshot không phải thử: 0 cái lẫn item nguồn thử, nên lớp lọc item chưa từng gặp ca thật.
- E1 và E9 không đo baseline: trên code cũ, `real-mock` sẽ ghi snapshot thử vào stg. 3 trong 5 snapshot thử đã có sẵn trong DB, nên với 3 cái đó, «0 dòng mới» cũng đúng trên code cũ (ON CONFLICT). Phần phân biệt nằm ở 2 snapshot chưa nạp (`…T072651`, `…T072717`) và ở điều kiện có dòng log bỏ qua.
- Phép đếm của `real-mock` chỉ đếm dòng có snapshot_id khớp regex. Item thử lẫn trong snapshot thật mang snapshot_id thật, nên phép đếm này không thấy. Ca đó do E5 (fixture) phủ.
- Regex là danh sách cố định ba loại (`zalo-mock`, `e2e`, `test`; không phân biệt hoa thường; khớp nguyên segment). Các biến thể không bị bắt: `zalo-mock-v2`, `zalo_mock`, `mock`, `e2e-run`, `example`. Trên máy có thật một snapshot `hanoi/hanoi__example__2026-10-17T153258` (`manifest.source=example`, 3 item nguồn `example`). Nó chưa có trong DB và nằm ngoài danh sách của hợp đồng.
- DB :5433 dùng chung. Các lượt chạy rơi vào 15:10–15:20 (+07), không trùng job launchd nào có lịch (ngoại trừ cloud-sync và heartbeat 15 phút: không chạy importer hay transform). Khi chạy, không thấy biến động lạ trong số đếm.

## Ngoài hợp đồng

- **`import-chotot.mjs` chỉ có lớp nhận diện theo tên, không có lớp `manifest.source`.** Phần Context của hợp đồng ghi «ZCode sửa importer (`import-airbnb.mjs`, `import-chotot.mjs`) theo ba lớp», nhưng thực tế chỉ `import-airbnb` có đủ ba lớp. Lớp item thì `import-chotot` đã có sẵn từ trước: `readSnapshot` chỉ giữ item có `source === "chotot-ads"`. Đã tái hiện an toàn bằng probe tiền tố `acc-pl1-probe-<ms>` (kiểm trùng trước, xoá sau, còn 0 dòng):
  - thư mục `hanoi__chotot-ads__<tag>-src-e2e` với `manifest.source=e2e`, item nguồn `chotot-ads`: importer kết thúc mã 0, không có log bỏ qua, ghi 1 dòng `airbnb_snapshots` (source e2e) và 1 dòng `stg_chotot_ads`;
  - với `manifest.source=zalo-mock`: ghi 1 dòng `airbnb_snapshots` (source zalo-mock) và 0 dòng `stg_chotot_ads`.

  AC-3 chỉ nêu `import-airbnb`, và E8 thử theo tên, nên ca này được xếp ngoài hợp đồng. Nhưng nếu đọc AC-7 («gặp snapshot thử») theo định nghĩa ba lớp ở Context thì ca này chạm AC-7. Người quyết ở Gate 2. Rủi ro thực tế thấp, vì `collect-chotot.mjs` luôn ghi `source=chotot-ads`. Tái hiện: chạy `import-chotot.mjs <dir>` trên một snapshot v1 tự dựng trong thư mục tạm, có `snapshotId` mang tiền tố riêng, rồi `DELETE FROM airbnb_snapshots WHERE snapshot_id LIKE '%<tag>%'` (cascade sang `stg_chotot_ads`).
- **Con trỏ state của vòng nạp đêm có thể bị đầu độc** (đã có từ trước, thuộc làn ZCode). `zalo-import-daily.sh` và `apify-facebook-daily.sh` lấy `TS` bằng `sed 's/.*__//'` rồi so chuỗi. Một thư mục `*__zalo-agent__TEST` (đúng dạng tên mà fixture dùng) cho `TS=TEST`, lớn hơn mọi `2026…`. Importer bỏ qua với mã 0, state nhảy thành `TEST`, và từ đó mọi snapshot thật về sau bị bỏ qua. PL1 trả mã 0 nên vòng nạp không gãy, đúng ý hợp đồng; việc nhảy qua một snapshot thử cũng đúng ý. Riêng hình dạng tên này thì làm hỏng con trỏ. Tương tự, `chotot-daily.sh` lấy `sort | tail -1`: một thư mục `*__chotot-ads__TEST` sẽ thành «mới nhất», bị bỏ qua, và đêm đó snapshot thật mới nhất không được nạp. Hiện trên máy không có thư mục nào như vậy.
- **Harness `fixtures`:** khi kiểm trùng `list_id` Chợ Tốt, lệnh gọi `process.exit(2)` nằm BÊN TRONG `try`, sau khi ca 1–3 đã ghi DB. Thoát kiểu đó bỏ qua khối `finally`, nên các dòng `acc-pl1-` còn sót lại. Xác suất gần 0: list_id thật lớn nhất 135.429.110, còn list_id thử ≥ 990.000.000. Vẫn nên chuyển sang `throw` hoặc đặt cờ để khối dọn luôn chạy.

## Analyst

Non-discriminating evals:
- Baseline chạy hai cây, xuất bằng `git archive` ra thư mục tạm ngoài repo, chép harness sang, symlink `pipeline/node_modules`. Chỉ chạy `fixtures` và test unit, KHÔNG chạy `real-mock`. Đã đọc code fixtures trước: mọi dòng nó có thể ghi trên code cũ đều mang tiền tố `acc-pl1-<ms>` (snapshot_id, post_id, snapshot_id Chợ Tốt) và được dọn hết (cascade từ `airbnb_snapshots`). Sau mỗi lượt: «còn 0 dòng giả».
  - `6e84f96` (diffBase, chưa có PL1): `fixtures` đỏ ở 8 mục: manifest.source, item lẫn, nạp lại, chotot e2e «/», e2e, TEST, should-NOT-fire. Test unit mới đỏ vì module chưa export `isTestSnapshot`.
  - `19b9eff` (bản PL1 đầu, dùng `split("/").pop()`): `fixtures` đỏ ở 5 mục: manifest.source, item lẫn, nạp lại, chotot e2e «/». Các mục tên e2e/TEST xanh, đúng như mong đợi vì bản đó đã có lớp tên.
- E3, ca «đường dẫn có dấu / cuối»: XANH trên `19b9eff`, tức bản còn lỗi `split`. Test gọi `isTestSnapshot` trên CẢ đường dẫn, mà regex vẫn khớp `__zalo-mock__` ở giữa chuỗi, nên nó không chạm `basename()` hay `split()` trong `main()`. Ca này không bắt được lỗi mà nó mang tên. AC-2 thực chất do E2 gánh (chotot, đỏ trên `19b9eff`) và E1 gánh (`import-airbnb` với «/» trên snapshot thử thật; không đo baseline được).
- E6 (idempotent): đỏ trên baseline chỉ vì item zalo-mock làm thành 3 dòng. Tính idempotent thì code cũ vẫn giữ (3 → 3 khi nạp lại). Vì vậy E6 không phân biệt được chính khẳng định của nó; nên coi là guard hồi quy.
- E8, mục «snapshot Chợ Tốt thật vẫn nạp (1 dòng)»: xanh trên cả hai baseline. Đây là guard hồi quy có chủ ý; mục «bỏ qua e2e «/»» của E8 thì đỏ.
- Lệnh `fixtures` là một lệnh chung cho E2 và E4–E8. Baseline từng eval ghi ở trên là trạng thái của dòng kiểm tương ứng với eval đó.

Baseline khong do:
- E1, E9: không chạy `real-mock` trên code cũ, vì nó sẽ ghi 5 snapshot thử thật vào stg và đặt lại `captured_at`.

Đọc code (`git diff 6e84f96 b2f392d`):
- Regex: áp lên 1.384 tên thư mục snapshot trên máy, chỉ khớp đúng 5 thư mục `hanoi__zalo-mock__…`. Không tên nguồn thật hay mốc thời gian nào bị nhận nhầm. Các nguồn có trên máy: airbnb-discovery, airbnb-listing, airdna-research, chotot-ads, example, osm-boundaries, zalo-agent, zalo-mock.
- `isTestSnapshot("x__" + source + "__x")` với `source` null, undefined hay rỗng đều trả false, nên snapshot được nạp như thường. Đây là hành vi an toàn đúng hướng: không bỏ nhầm dữ liệu thật.
- Hai vòng nạp đêm chỉ glob `*__zalo-agent__*` (và `chotot-ads`), nên snapshot tên `zalo-mock` không bao giờ được chọn. Một snapshot tên thật nhưng `manifest.source` là nguồn thử thì được bỏ qua với mã 0, và state nhảy qua nó. Đúng ý: dữ liệu thử không bao giờ cần nạp lại. Ngoại lệ là hình dạng tên `…__TEST`, xem «Ngoài hợp đồng».

## Variance

none — mọi eval chạy một lần, tất định; E2/E4–E8 cùng lệnh `fixtures` chạy 6 lần, 6/6 đồng nhất; `real-mock` 2/2 đồng nhất.

## Iterations

Round 1: 9/9 eval đạt; 3 phát hiện ngoài hợp đồng (import-chotot thiếu lớp manifest.source — có thể chạm AC-7 tuỳ cách đọc; state vòng đêm với tên `…__TEST`; thoát sớm trong harness bỏ dọn) — chuyển người xét ở Gate 2.
