---
schema_version: 2
feature_slug: airbnb-worklist
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2ffc377e6325150ea8f76d077e47c287423d1b2d
human_signoff:
---

# Evidence Report: airbnb-worklist

Vòng verify 1. Phiên tươi chạy đủ 11 eval qua harness `scripts/airbnb-worklist/acceptance.mjs` trên worktree `claude/acceptance-airbnb-worklist` @ 2ffc377. Lệnh nào cũng chạy riêng và có một dòng trong `run-log.jsonl`.

Trước khi chạy, phiên đã đọc harness để tự xác nhận:
- HOME là thư mục tạm (`mkdtemp`).
- stub `launchctl`/`docker`/`npm`/`security`/`osascript`/`sleep` đứng đầu PATH, và `assertStubsWin` kiểm `command -v` trước khi chạy (thua thì bỏ chạy).
- installer, nightly, finalize chạy trên bản chép trong thư mục tạm, với bước con giả.
- `export-db` chỉ `SELECT` và ghi worklist ra tệp tạm.

Machine eval xanh cả 11. Còn các mục dưới «Known limits» và «Ngoài hợp đồng» cho người xét ở Gate 2: hồ sơ này không xanh-sạch.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: airbnb-worklist-E1-20261023T153206
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_installers
  verified_at: 2026-10-23T15:32:07Z
  output: |
    an toàn: launchctl/docker/npm/security/osascript → stub trong thư mục tạm
    install-airbnb-cron: com.oneinvest.airbnb-nightly.plist, com.oneinvest.smoke.plist
    ok   bootout job cũ com.oneinvest.collector
    ok   bản cài cũ collector.plist bị xoá khỏi LaunchAgents
    ok   airbnb-nightly.plist / smoke.plist cài vào LaunchAgents giả, __ROOT__ đã thay; bootstrap cả hai
    ok   should-NOT-fire: không bootstrap lại job collector cũ
    install-cron: com.oneinvest.smoke.plist, com.oneinvest.backup.plist
    ok   install-cron.sh cài smoke + backup
    ok   should-NOT-fire: install-cron.sh không hồi sinh job collector
    INSTALLERS PASS

- eval: E2
  run_id: airbnb-worklist-E2-20261023T153211
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_static
  verified_at: 2026-10-23T15:32:11Z
  output: |
    ok   bash -n scripts/airbnb-nightly.sh · pipeline/finalize-airbnb.sh · install-airbnb-cron.sh · install-cron.sh · airdna-daily.sh
    ok   plutil -lint airbnb-nightly.plist: OK
    ok   com.oneinvest.collector.plist đã xoá khỏi repo
    ok   scheduler: CONDUCT_WINDOW mặc định off · jitter vẫn bật · cap ngày 600
    ok   airbnb-nightly: 24 batch × 25 = cap 600
    ok   install-cron.sh: vòng lặp chỉ còn smoke backup
    STATIC PASS

- eval: E3
  run_id: airbnb-worklist-E3-20261023T153216
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_nightly_flow
  verified_at: 2026-10-23T15:32:17Z
  output: |
    1 còn việc ×2 rồi hết: thứ tự export→health→cli→finalize · 3 batch · finalize true
    ok   thứ tự: xuất worklist → gate sức khoẻ → thu
    2 gate delisted dừng: 0 batch · finalize false · mã thoát khác 0
    3 batch 2 lỗi: 2 batch · finalize false · mã thoát khác 0 (đúng như mong)
    ok   scheduler skip (vượt cap) → dừng sau batch 1, vẫn finalize phần đã có
    5 luôn còn việc: 24 batch · finalize true
    6 jitter mặc định: sleep [703]
    NIGHTLY-FLOW PASS

- eval: E4
  run_id: airbnb-worklist-E4-20261023T153211
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_static
  verified_at: 2026-10-23T15:32:11Z
  output: |
    ok   airdna-rotate: 12 market/đêm mặc định
    ok   airdna-daily: xuất worklist sau transform AirDNA
    ok   scheduler: CONDUCT_WINDOW mặc định off
    ok   install-cron.sh: vòng lặp chỉ còn smoke backup
    STATIC PASS

- eval: E5
  run_id: airbnb-worklist-E5-20261023T153221
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_export_db
  verified_at: 2026-10-23T15:32:22Z
  output: |
    > tsc -p tsconfig.json
    export: worklist: total=56887 by market 47=14137 48=14506 89491=13131 khác=15113 → <tệp tạm>
    ok   export-airdna-worklist ghi worklist ra tệp tạm (không đụng collector/state)
    ok   khuôn {generatedAt,total,ids}: total=56887
    ok   mọi id dạng abnb_<số>, không trùng
    ok   collector đọc worklist: bỏ prefix abnb_ còn id số cho URL /rooms/<id>
    ok   ưu tiên market lớn trước: 47=14137 48=14506 89491=13131 khác=15113
    EXPORT-DB PASS

- eval: E6
  run_id: airbnb-worklist-E6-20261023T153230
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T15:32:36Z
  output: |
    ✔ prioritize: ưu tiên market rồi revenue DESC, dedupe, chỉ abnb_
    ✔ healthReport: gone/done vượt 40% → verdict stop
    ✔ healthReport: tỉ lệ khoẻ → verdict ok; chia 0 an toàn
    ℹ tests 70
    ℹ pass 70
    ℹ fail 0
    ℹ skipped 0

- eval: E7
  run_id: airbnb-worklist-E7-20261023T153251
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-23T15:32:52Z
  output: |
    ✔ parseWorklist: strip prefix abnb_ (URL /rooms/ cần id số), bỏ input rác
    ✔ isGone: title báo không tồn tại hoặc redirect khỏi /rooms/<id>
    ✔ isGone: biến thể trang đã rút + trang có dữ liệu nguồn thì không GONE (review #7)
    ℹ tests 26
    ℹ pass 26
    ℹ fail 0
    ℹ skipped 0

- eval: E8
  run_id: airbnb-worklist-E8-20261023T153257
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_health_gate
  verified_at: 2026-10-23T15:32:57Z
  output: |
    ok   đúng 40% → chưa dừng (gone 4/done 10 → rate 40%, ok)
    ok   50% → dừng (gone 5/done 10 → rate 50%, stop)
    ok   41% → dừng (gone 41/done 100 → rate 41%, stop)
    ok   40,4% làm tròn 40% → chưa dừng (gone 202/done 500 → rate 40%, ok)
    ok   40,6% làm tròn 41% → dừng (gone 203/done 500 → rate 41%, stop)
    ok   chưa thu gì → không chia 0, không dừng (gone 0/done 0 → rate 0%, ok)
    HEALTH-GATE PASS

- eval: E9
  run_id: airbnb-worklist-E9-20261023T153257
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_finalize_cities
  verified_at: 2026-10-23T15:32:57Z
  output: |
    an toàn: docker → stub trong thư mục tạm
    nạp [hanoi__…20261023T010000, hcmc__…, danang__…, vn__…20261023T010000] · transform [hanoi, hcmc, danang, vn] · sql [300_metrics, 400_breakdowns, 410_listing_stats, 450_dq_checks]
    ok   nạp snapshot chưa có của cả 4 city (hanoi, hcmc, danang, vn)
    ok   should-NOT-fire: snapshot đã nạp không nạp lại
    ok   transform-airbnb chạy TỪNG city
    ok   gán phường một lượt cho mọi city
    ok   metrics 300 → 400 → 410 → 450
    FINALIZE-CITIES PASS

- eval: E10
  run_id: airbnb-worklist-E10-20261023T153302
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc5_scheduler
  verified_at: 2026-10-23T15:33:09Z
  output: |
    mặc định (không env): chạy=true · 5971ms
    ok   không đặt CONDUCT_WINDOW → chạy ở giờ hiện tại (22h)
    ok   jitter mặc định vẫn còn: 1 request ngủ ≥ 2000ms (5971ms)
    ok   should-NOT-fire: CONDUCT_WINDOW=0-1 (không chứa 22h) → bỏ qua, không gọi nguồn
    ok   should-NOT-fire: cap ngày đã chạm (CONDUCT_DAILY_MAX=0) → bỏ qua
    ok   CONDUCT_WINDOW=off + CONDUCT_JITTER=0 → chạy ngay (đường chạy tay)
    SCHEDULER PASS

- eval: E11
  run_id: airbnb-worklist-E11-20261023T153309
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc5_adr
  verified_at: 2026-10-23T15:33:09Z
  output: |
    ok   ADR-0007 có mục sửa đổi 2026-10-23, Mạnh chốt
    ok   ghi CONDUCT_WINDOW mặc định off
    ok   ghi jitter và cap 600 giữ nguyên
    ADR PASS

## Known limits

- **«Một đêm thật» chỉ đo được sau triển khai.** Cột `bat_khi` của hàng ZC5 (worklist chạy đủ id, không lượt gọi nào ngoài cửa sổ) không đo được ở đây. Phải đợi ZCode chạy `install-airbnb-cron.sh` qua kênh tin, rồi đọc `pipeline/logs/airbnb-nightly.log` sau đêm đầu. Mọi eval luồng đêm dùng bước con giả. Đường Chrome thật vào Airbnb chưa được chạy lần nào: `isGone` trên trang lỗi thật, redirect thật, nhịp jitter thật, thời lượng 24 batch.
- **Ràng buộc AU9: Đà Nẵng phải có phường trước khi nightly lấy id Đà Nẵng.**
  - `reassign-areas.mjs` hiện chỉ khai `MARKETS = { hanoi, hcmc }`. `transform-airbnb.mjs` gán phường bằng `ST_Covers` ngay lúc transform; listing không rơi vào phường nào thì bị `DELETE` khỏi `listings` (staging vẫn giữ).
  - Hệ quả: PDP Đà Nẵng thu trước AU9 không vào canonical, metrics/breakdown Đà Nẵng chưa tin được. Các id đó đã nằm trong `doneIds` nên nightly không thu lại.
  - Sau AU9, lượt `transform-airbnb vn` hằng đêm sẽ tự đọc lại staging `vn__%`, nên dữ liệu không mất.
  - Về thời điểm: worklist hiện xếp 28.643 id HCMC + Hà Nội trước 13.131 id Đà Nẵng. Ở 600 id/đêm, id Đà Nẵng đầu tiên rơi vào khoảng đêm thứ 48, chứ không phải «ngay đêm đầu» như mục Notes của hợp đồng (nếu không có gone/fail và universe không đổi). Ràng buộc vẫn đúng, chỉ là chậm hơn hợp đồng viết.
- **15.113 id «khác»** (tỉnh ngoài 3 market, kể cả 86 id market `null`) cũng sẽ được thu, rồi bị bỏ khỏi canonical vì không có phường. Tính ra khoảng 25 đêm PDP chưa dùng được, xếp cuối danh sách.
- **E5 phụ thuộc trạng thái DB local lúc chạy** (universe 56.887 id). Số đếm sẽ đổi theo lượt AirDNA kế tiếp.
- **E6 chạy cả suite pipeline.** Một số ca ghi vào DB local :5433, nhưng trong `BEGIN…ROLLBACK` (`scripts/write-offers.test.mjs`, `scripts/bait-gap-sellers.test.mjs`), nên không để lại dòng nào. Không eval ZC5 nào ghi DB.

## Ngoài hợp đồng

Lỗi tìm được khi đọc code thật (`git diff 76fc9a5 e5e92c4`). Không mục nào trái một tiêu chí theo đúng chữ của hợp đồng. Mục 1 nằm sát AC-2: người duyệt nên quyết.

1. **[cao, sát AC-2] Cả batch FAIL từng item thì không dừng, mà quay 24 batch trên CÙNG 25 id.**
   - Trong `airbnb-listing.ts`, item lỗi chỉ `failed++`, không vào `doneIds`, và `batch = todo.slice(0, BATCH)`. CLI vẫn thoát 0 vì `runCollector` không ném lỗi cho lỗi từng item. Cap ngày cộng `coverage.captured`, nên item lỗi và trang gone không ăn cap.
   - Khi Airbnb chặn (CCP §5 «Fail = lùi + báo», circuit breaker ≥3 block/24h), nightly vẫn gọi tối đa 24 × 25 = 600 lượt vào đúng 25 listing đó, không lùi, không báo.
   - E3 coi «batch lỗi» là CLI thoát khác 0, nên không phủ ca này. Nếu Mạnh hiểu «Một batch lỗi» của AC-2 gồm cả «25/25 item FAIL», ca này thành REJECT.
   - Tái hiện an toàn: chạy `nightly()` của harness với kế hoạch CLI in `còn=500` kèm các dòng `FAIL`, thoát 0 (giống ca 5 của E3: 24 batch). Phần collector lấy lại cùng id thì đọc ở dòng `failed++` và `todo.slice` của `collector/src/collectors/airbnb-listing.ts`.
2. **[trung bình] Gate 40% tính trên done/gone cộng dồn từ đầu, và chỉ kiểm một lần trước khi thu.**
   - Mẫu số lớn dần nên làm loãng tín hiệu. Ví dụ: một đêm Airbnb đổi kiểu redirect khiến `isGone` báo nhầm 100%, nhưng gate không bật vì mẫu số cũ lớn.
   - Trong đêm không có gate, nên một đêm có thể đánh gone vĩnh viễn tới 600 id. `goneIds` không bao giờ được thử lại.
   - Ngược lại, mẫu nhỏ đêm đầu (vd 11/25) sẽ chặn mọi đêm sau mãi mãi, và chỉ gỡ được bằng tay trong checkpoint.
   - Đúng nguyên văn AC-6, nhưng là rủi ro thiết kế.
3. **[thấp] `remaining = ids.size - doneIds.size - goneIds.size` trừ đôi.** Id gone được thêm vào cả `goneIds` lẫn `doneIds`. Ngoài ra `doneIds` cộng dồn cả id đã rời worklist (vào `listings` thì export loại ra), nên số «còn … id cho lần chạy sau» trong manifest bị thấp, có thể âm. Điều kiện dừng sớm của nightly không bị ảnh hưởng: grep đọc `còn=${todo.length}`, và số này tính đúng.
4. **[thấp] `worklist-health.mjs` in sai «finalize/sync gần nhất».**
   - Hai đường `logs/airbnb-nightly.log` và `logs/sync-cloud.log` là đường tương đối, mà nightly chạy với cwd là `collector/`. Thư mục `collector/logs` không tồn tại.
   - Tên tệp thật là `pipeline/logs/cloud-sync.log`, không phải `sync-cloud.log`.
   - Tái hiện (chỉ SELECT): `cd collector && node ../pipeline/worklist-health.mjs` in `finalize gần nhất: chưa có · sync gần nhất: chưa có`.
5. **[thấp] Đua ghi worklist.** `airdna-daily` (19:05) giờ chạy `export-airdna-worklist.mjs` vào cùng tệp `collector/state/airbnb-worklist.json` (`writeFile` không nguyên tử), trong khi nightly (19:35 + jitter ≤20′) đọc lại tệp đó ở đầu mỗi batch. Nếu đọc trúng lúc đang ghi, `JSON.parse` ném lỗi, batch thoát khác 0, và cả đêm dừng không finalize. Tìm bằng đọc code, phụ thuộc thời điểm, chưa tái hiện.
6. **[thấp, CCP §3] Smoke Airbnb 20:00 chạy chồng với nightly Airbnb** (19:35 → vài giờ): hằng đêm có hai phiên Chrome cùng vào một nguồn. Trước đây chỉ chồng mỗi Chủ nhật.
7. **[chữ] Comment cũ.** Plist `com.oneinvest.airbnb-nightly.plist` vẫn ghi «trong cửa sổ CCP 19-23», dù window đã off. Header `scripts/airbnb-nightly.sh` vẫn ghi «default 32 ≈ 800 listing/đêm», trong khi code là 24 (600).

## Analyst

Các eval xanh cả trên nhánh lẫn trên baseline 76fc9a5 (không phân biệt được code cũ với mới):
- **E6** (`cd pipeline && npm test`) xanh trên baseline: 26/26 ca. Baseline chưa có `scripts/export-airdna-worklist.test.mjs` và `scripts/worklist-health.test.mjs`, nên ở mức lệnh, eval chỉ là rào hồi quy. Phần phân biệt nằm ở ý «ca prioritize/healthReport xanh» trong `expected`, và người chấm phải tự đọc tên ca.
- **E7** (`cd collector && rm -rf dist && npm test`) xanh trên baseline: 19/19 ca, vì baseline chưa có `airbnb-worklist.test.ts`. Lý do giống E6.
- **E10** (`zc5_scheduler`) xanh trên baseline vì eval chạy lúc 22h, nằm trong cửa sổ mặc định cũ 19–23. Ca «không đặt CONDUCT_WINDOW → chạy ở giờ hiện tại» chỉ phân biệt được khi chạy ngoài 19–23h.
  - Phép thử phụ, cùng cơ chế sandbox: `runCollector` thật, collector giả, thư mục tạm, `TZ=UTC` (15h).
  - Nhánh: collector được gọi. Baseline: `skip: ngoài cửa sổ giờ hoạt động 19-23`.
  - Vậy hành vi mới đúng, nhưng eval nên ép giờ (TZ hoặc tham số `now`) để luôn phân biệt được.

Baseline đỏ đúng như mong: E1 (5 mục đỏ: job cũ còn, nightly chưa có, hồi sinh collector), E2/E4 (9 mục đỏ, gồm rotate 12 và airdna-daily export), E3/E9/E8 (tệp chưa tồn tại), E5 (chưa có export script), E11 (ADR chưa sửa).

Thứ tự finalize đã kiểm: import → reassign-areas → transform. Thứ tự này khác chữ của bẫy 5 trong AGENTS.md («sau transform: reassign rồi 300 + 400»), nhưng trùng `finalize-hanoi.sh` hiện hành. `transform-airbnb.mjs` tự gán phường bằng `ST_Covers` khi transform và tự `DELETE` listing ngoài phường, nên không mất gán phường cho listing mới. Không phải lỗi.

Baseline khong do: không có. Cả 11 eval đều đo được trên baseline.

## Variance

Không có: mọi eval là tất định (`runs: 1`). E3 ca 6 lấy jitter ngẫu nhiên nhưng chỉ kiểm khoảng (< 1200s), nên không dao động kết quả.

## Iterations

Round 1: cả 11 eval xanh. 7 mục ngoài hợp đồng (mục 1 sát AC-2) và Known limits chuyển Gate 2 cho người xét.
