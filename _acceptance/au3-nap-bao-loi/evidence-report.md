---
schema_version: 2
feature_slug: au3-nap-bao-loi
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 6826a2a9e38a4fff5c02c402b2904f59ae4289ba
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: au3-nap-bao-loi

Vòng verify 2, cây `5cae57f` (nhánh `claude/acceptance-au3-nap-bao-loi-r3`). Code tính năng là
ZCode `903fc80` gộp `origin/main` `9e3bb9f`. Hợp đồng gọi đây là vòng 3 của nhánh.

Cả 11 eval đều đạt `expected`, và R1 của vòng 1 đã được sửa: E9 cho thấy snapshot hcmc lỗi
được nạp lại theo đúng mốc thời gian.

Báo cáo **không xanh-sạch**: mục «Ngoài hợp đồng» có một ca mất dữ liệu lặng lẽ, mức high.
Một snapshot đang tải media bị coi là đã nạp, state vượt qua nó, và snapshot đó không bao giờ
vào stg. Ca này không thuộc AC nào, vì import trả 0 chứ không «nạp lỗi». Mạnh cần quyết trước
khi ký: mở hợp đồng mới, hay ghi nhận là giới hạn.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | PASS |
| E8 | AC-4 | script | PASS |
| E9 | AC-5 | script | PASS (lệnh sửa sau lượt đầu, chạy lại r2b) |
| E10 | AC-6 | script | PASS |
| E11 | AC-7 | script | PASS |

## Evidence

Trích đoạn đã làm sạch: mã thoát của các ca con trong sandbox ghi bằng chữ, đường dẫn tạm ghi `<tmp>`.

- eval: E1
  run_id: au3-nap-bao-loi-E1-r2-20261025T043753Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-25T04:37:55Z
  output: |
    (a) DB chết thật: thoát khác 0 · 10 dòng retry · sleep 10× [sleep 20] · transform false
    ok   (a) exit khác 0
    ok   (a) lỗi thật của import-chotot được nhận là ECONNREFUSED: mỗi thành phố thử 5 lần, chờ 20s giữa các lần
    ok   (a) KHÔNG chạy transform / refresh / resolve
    ok   (a) log báo dừng trước transform
    CHOTOT PASS

- eval: E2
  run_id: au3-nap-bao-loi-E2-r2-20261025T043759Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-25T04:38:01Z
  output: |
    (a) DB chết thật: thoát khác 0 · 5 dòng retry · sleep 5 · state 2026-10-22T120000000 · transform false
    ok   (a) lỗi thật được nhận là ECONNREFUSED: thử 5 lần, chờ 20s, exit khác 0
    ok   (a) state giữ nguyên (chưa nạp được snapshot nào)
    ok   (a) dừng chuỗi ngay ở snapshot đầu, không thử các snapshot sau
    ok   (a) không transform / refresh
    APIFY PASS

- eval: E3
  run_id: au3-nap-bao-loi-E3-r2-20261025T043808Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-25T04:38:09Z
  output: |
    (b) lượt 1, 2026-10-23T070000000 lỗi: thoát khác 0 · state 2026-10-23T010000000 · nạp [import 2026-10-23T010000000 #1, import 2026-10-23T070000000 #1]
    ok   (b) lượt 1: exit khác 0, state giữ ở snapshot thành công cuối
    ok   (b) lượt 1: snapshot sau không nạp, không transform
    ok   should-NOT-fire: snapshot cũ hơn state không nạp lại
    (b) lượt 2, DB lành: thoát 0 · state 2026-10-23T130000000 · nạp [import 2026-10-23T070000000 #2, import 2026-10-23T130000000 #1]
    ok   (b) lượt 2: nạp lại đúng snapshot lỗi rồi snapshot sau, không nạp lại snapshot đã thành công
    ok   (b) lượt 2: state tới snapshot cuối, transform + refresh chạy
    APIFY PASS
  note: ca hai thị trường mà vòng 1 thấy E3 không phủ (R1) nay là E9.

- eval: E4
  run_id: au3-nap-bao-loi-E4-r2-20261025T043810Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-25T04:38:11Z
  output: |
    (c) lỗi khác DB: thoát khác 0 · thử hanoi 1 lần · sleep 0
    ok   (c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ, exit khác 0
    ok   (c) không transform
    DB lên lại sau 2 lần: thoát 0 · thử hanoi 3 lần · sleep 2
    ok   ECONNREFUSED 2 lần rồi lên → thử 3 lần, chờ 2×20s, đi tiếp transform, exit 0
    CHOTOT PASS

- eval: E5
  run_id: au3-nap-bao-loi-E5-r2-20261025T043817Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-25T04:38:19Z
  output: |
    ok   (c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ
    ok   ECONNREFUSED 3 lần rồi lên → thử 4 lần, chờ 3×20s, nạp hết, exit 0
    APIFY PASS

- eval: E6
  run_id: au3-nap-bao-loi-E6-r2-20261025T043824Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-25T04:38:25Z
  output: |
    (d) DB sống: thoát 0 · nạp [hanoi__chotot-ads__20261023T053000, hcmc__chotot-ads__20261023T053000] · bước [transform-chotot, refresh-bait-gap, resolve-properties]
    ok   (d) DB sống → exit 0, không chờ
    ok   (d) should-NOT-fire: chỉ nạp snapshot MỚI NHẤT mỗi thành phố, bản 22/10 không nạp
    ok   (d) đủ 3 bước transform → refresh → resolve
    ok   (d) transform hỏng → refresh + resolve vẫn chạy, exit 3, dòng JOB FAIL
    CHOTOT PASS

- eval: E7
  run_id: au3-nap-bao-loi-E7-r2-20261025T043830Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-25T04:38:32Z
  output: |
    ok   (d) DB sống, transform-fb hỏng → refresh vẫn chạy, exit 4, dòng JOB FAIL, state tới cuối
    APIFY PASS

- eval: E8
  run_id: au3-nap-bao-loi-E8-r2-20261025T043837Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_syntax
  verified_at: 2026-10-25T04:38:37Z
  output: |
    SYNTAX OK

- eval: E9
  run_id: au3-nap-bao-loi-E9-r2b-20261025T044734Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_r1_probe
  verified_at: 2026-10-25T04:47:35Z
  output: |
    stub sleep thắng PATH: ok
    --- lượt 1: hcmc T07 nạp lỗi
    JSON hỏng (lỗi giả)
    ❌ nạp fail tại <tmp>/repo/collector/snapshots/hcmc/hcmc__zalo-agent__2026-10-23T070000000 — giữ state ở 2026-10-22T120000000, dừng chuỗi (lần chạy sau nạp tiếp)
    lượt 1 thoát khác 0 · state 2026-10-22T120000000
      gọi: apify-facebook-collector
      gọi: import hcmc/hcmc__zalo-agent__2026-10-23T070000000
    --- lượt 2: DB lành
    lượt 2 thoát 0 · state 2026-10-23T130000000
      gọi: apify-facebook-collector
      gọi: import hcmc/hcmc__zalo-agent__2026-10-23T070000000
      gọi: import hanoi/hanoi__zalo-agent__2026-10-23T130000000
      gọi: transform-fb
      gọi: refresh-bait-gap
    R1: hcmc T07 được nạp lại
    R1 OK
  note: lệnh E9 sửa sau lượt đầu vì grep khớp chuỗi con. Lệnh cũ `grep -q 'được nạp lại'` khớp cả dòng thất bại «KHÔNG BAO GIỜ được nạp lại», nên lệnh xanh trên cả baseline. Lệnh mới trong `_acceptance/config.yaml` là `grep -qx 'R1: hcmc T07 được nạp lại'`, đổi trong cây làm việc, chưa commit. Lượt đầu với lệnh cũ (au3-nap-bao-loi-E9-r2-20261025T043844Z) cho cùng output này. Hcmc T07 (mốc sớm) được nạp TRƯỚC hanoi T13, và output không có dòng «KHÔNG BAO GIỜ».

- eval: E10
  run_id: au3-nap-bao-loi-E10-r2-20261025T043852Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_ts_format
  verified_at: 2026-10-25T04:38:53Z
  output: |
    apify-facebook-daily.sh: thoát 0 · nạp theo thứ tự [2026-10-24T090755, 2026-10-24T090800123, 2026-10-24T090800123-1] · state 2026-10-24T090800123-1
    ok   apify-facebook-daily.sh: nạp đủ ba khuôn tên thật (6 chữ số, 9 chữ số, có -1) đúng thứ tự thời gian
    ok   apify-facebook-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    ok   apify-facebook-daily.sh: state tới mốc thật mới nhất, không nhảy theo tên rác (được 2026-10-24T090800123-1)
    zalo-import-daily.sh: thoát 0 · nạp theo thứ tự [2026-10-24T090755, 2026-10-24T090800123, 2026-10-24T090800123-1] · state 2026-10-24T090800123-1
    ok   zalo-import-daily.sh: nạp đủ ba khuôn tên thật (6 chữ số, 9 chữ số, có -1) đúng thứ tự thời gian
    ok   zalo-import-daily.sh: should-NOT-fire: tên rác (TEST, thiếu giờ, đuôi lạ) không được nạp
    ok   zalo-import-daily.sh: state tới mốc thật mới nhất, không nhảy theo tên rác (được 2026-10-24T090800123-1)
    TS-FORMAT PASS

- eval: E11
  run_id: au3-nap-bao-loi-E11-r2-20261025T043858Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_lock
  verified_at: 2026-10-25T04:38:59Z
  output: |
    apify-facebook-daily.sh: thoát khác 0 · import 0 · sleep 59
    ok   apify-facebook-daily.sh: khoá đang bị giữ → không nạp gì, thoát khác 0
    ok   apify-facebook-daily.sh: should-NOT-fire: state không đổi khi không lấy được khoá
    ok   apify-facebook-daily.sh: không gỡ khoá của job khác
    ok   apify-facebook-daily.sh: chạy xong tự gỡ khoá của mình (trap)
    zalo-import-daily.sh: thoát khác 0 · import 0 · sleep 59
    ok   zalo-import-daily.sh: khoá đang bị giữ → không nạp gì, thoát khác 0
    ok   zalo-import-daily.sh: should-NOT-fire: state không đổi khi không lấy được khoá
    ok   zalo-import-daily.sh: không gỡ khoá của job khác
    ok   zalo-import-daily.sh: chạy xong tự gỡ khoá của mình (trap)
    LOCK PASS

Network truth: không có eval `ui-check` nào. Cả 11 eval là `script`, không có đường mạng: n-a (driver).

Trước khi chạy, phiên chấm đọc harness `scripts/au3-nap-bao-loi/acceptance.mjs` và phép thử
`probes/r1-nhieu-thi-truong.sh`, và thấy đủ các điều kiện an toàn:
- ROOT của bản chép là thư mục tạm, HOME giả;
- stub `sleep` được kiểm là thắng PATH, và harness bỏ chạy nếu stub thua;
- bước thu và mọi module pipeline là bản giả, trừ ca «DB chết»: ca này dùng `import-*.mjs` thật
  trỏ một cổng vừa mở rồi đóng. Không có lệnh nào ghi vào :5433.

Sau khi chạy, không còn thư mục `acc-au3-*` hay `probe-*` nào sót trong `$TMPDIR`. Nhưng có tệp
`tmp.*` rỗng sót lại, xem Known limits.

## Known limits

- **Bước thu S05 và trạng thái paused không thuộc hồ sơ này** (lời giao riêng claudedp-2510-4), nên
  không tính là lỗi vòng này. Hiện trạng: `apify-facebook-daily.sh:17` vẫn gọi
  `node …/apify-facebook-collector.mjs` mà không kiểm mã thoát. Bước thu này chạy TRƯỚC khoá
  state, nên Apify vẫn bị gọi (tốn tiền) cả khi khoá đang kẹt hoặc lượt nạp sau đó bỏ cuộc.
- Retry chỉ bắt chuỗi `ECONNREFUSED`. Các lỗi tạm khác khi DB đang lên lại (`57P03`, `Connection terminated
  unexpectedly`) fail ngay ở lần đầu. AC-3 chốt đúng điều này. Dữ liệu không mất: apify giữ state, chotot dừng
  trước transform. `grep -q` khớp chuỗi con ở bất kỳ đâu trong log; điều này còn y như vòng 1.
- Chotot chỉ nạp snapshot mới nhất mỗi thị trường (AC-4 «như cũ»). Nếu snapshot của một ngày nạp hỏng thì
  ngày đó vắng khỏi `stg_chotot_ads`, dù raw snapshot vẫn còn.
- Hậu tố `-n` từ 10 trở lên xếp theo chuỗi (`-10` đứng trước `-2`). `sort` và `[[ > ]]` dùng cùng một thứ tự,
  nên không snapshot nào bị bỏ, chỉ là thứ tự nạp lệch khỏi thời gian thật. Ca này cần ≥10 lần trùng
  mili-giây nên gần như không xảy ra.
- `mktemp` của macOS BỎ QUA `TMPDIR` và ghi vào thư mục tạm của user (`getconf DARWIN_USER_TEMP_DIR`).
  Vì thế mỗi lượt chạy harness apify để lại tệp `tmp.*` rỗng ở đó. Phiên chấm đã xoá 42 tệp do chính mình
  sinh ra, và còn những tệp có từ trước phiên này. Nguồn rò nằm trong script, xem «Ngoài hợp đồng».
- Eval chạy bản chép trong sandbox, chưa có lượt chạy thật dưới launchd. Hợp đồng để điều này ngoài phạm vi.

## Ngoài hợp đồng

**Snapshot đang tải media bị coi là đã nạp → mất khỏi stg, không ai biết**
- Người dùng thấy gì: một mẻ ~50 tin Zalo/FB không bao giờ có trong `stg_*`, trên Ops hay Invest. Job vẫn
  thoát 0, log chỉ có một dòng cảnh báo «bỏ qua snapshot mồ côi», và không có gì để lượt sau nạp lại.
- Căn cứ:
  - `doFlush` gọi `fetchMessageMedia` trước `write()`/`finalize()`. Tệp ảnh đầu tiên ghi qua `addExtraFile`
    sẽ `mkdir` thư mục snapshot ngay, nên thư mục tồn tại mà chưa có `manifest.json` trong suốt lúc tải
    ảnh. Lúc tải ảnh kéo dài tới ~250s ở ca xấu (tối đa 100 ảnh, 4 luồng, timeout 10s).
  - `import-airbnb.mjs:38-41` trả 0 khi thiếu manifest. Script coi đó là nạp thành công, đẩy MAXTS lên
    mốc của snapshot rồi ghi state.
  - Phép thử sandbox dùng import-airbnb THẬT, DB là cổng chết. Lượt 1, đang tải media: thoát 0, state =
    `2026-10-24T090800123`, transform chạy. Lượt 2, sau khi có manifest: 0 lần gọi import.
  - Vòng 1 đã nêu ca «mồ côi» này với cửa sổ «rất ngắn». Thật ra bước tải media (N1) kéo cửa sổ lên mức
    phút, và nó trùng được với lịch 00:00 của `zalo-import-daily.sh` lẫn 0/6/12/18h của apify.
- file: `pipeline/import-airbnb.mjs:38-41`, `collector/src/api/server.ts:221-267`, `collector/src/core/storage.ts:61-66`,
  `scripts/apify-facebook-daily.sh:73-79`, `scripts/zalo-import-daily.sh:64-70`
- severity: high
- Đề xuất: new-contract. Hướng sửa: snapshot thiếu manifest thì không tính là thành công (dừng chuỗi
  như khi nạp lỗi, hoặc bỏ qua mà không đẩy state); hoặc collector ghi vào thư mục tạm rồi rename
  nguyên tử. Chia làn: ZCode sửa collector và hai script, Claude sửa phía pipeline.

**Khoá state kẹt sau kill -9 hay mất điện → cả hai job nạp đỏ mãi, không tự lành**
- Người dùng thấy gì: từ lúc đó không còn tin Zalo/FB mới nào vào stg. Mỗi lượt apify và zalo-import chờ
  5 phút rồi thoát khác 0 với dòng «khoá … bận >5′». Tình trạng kéo dài tới khi có người `rmdir` khoá bằng tay.
- Căn cứ:
  - Phép thử sandbox kill -9 bash giữa lúc nạp: khoá còn nguyên. Lượt kế: 59 lần `sleep 5`, 0 import,
    thoát khác 0. zalo-import cũng y hệt.
  - Khoá là thư mục `pipeline/logs/apify-daily.state.lock`, nên sống qua cả lần khởi động lại máy.
    Không có kiểm khoá cũ (PID hay tuổi).
  - Ngược lại, khi bị SIGTERM thì trap chạy và khoá được gỡ; phép thử đã kiểm điều này.
  - Không mất dữ liệu: snapshot vẫn nằm trên đĩa và sẽ nạp khi khoá được gỡ.
- file: `scripts/apify-facebook-daily.sh:47-52`, `scripts/zalo-import-daily.sh:39-44`
- severity: medium
- Đề xuất: new-contract (ghi PID vào khoá và gỡ khoá khi PID đã chết, hoặc dùng `lockf`/`flock` theo fd).

**zalo-import-daily: transform-zalo hỏng bị nuốt, job vẫn thoát 0**
- Người dùng thấy gì: stg Zalo mới đã nạp nhưng không được transform, nên tin mới không lên sản phẩm,
  trong khi launchd và watchdog thấy job xanh.
- Căn cứ: phép thử sandbox cho `transform-zalo` thoát 7. Job thoát 0, và các bước chạy là
  `transform-zalo refresh-bait-gap`. Script gọi `node transform-zalo.mjs` trần, không qua `job_run`, nên
  mã thoát cuối là của `refresh-bait-gap`. Ở apify và chotot, phần này đã đi qua `job-step.sh`.
- file: `scripts/zalo-import-daily.sh:78-79`
- severity: medium
- Đề xuất: new-contract (đưa `job_run` + `exit "$JOB_RC"` vào zalo-import như hai job kia). Đây là phần làn
  Claude của AU3.

**apify-facebook-daily rò tệp tạm mỗi lượt nạp**
- Người dùng thấy gì: không thấy gì ngay. Thư mục tạm của user đầy dần tệp log nạp
  (`/var/folders/…/T/tmp.*`).
- Căn cứ: `import_one` gán `TMPLOG=$(mktemp)` cho mỗi snapshot nhưng không xoá khi nạp thành công hay
  thất bại. Trap chỉ xoá TMPLOG cuối cùng. Đo trong sandbox: một lượt nạp 4 snapshot để lại 3 tệp (cả ca
  ok lẫn ca fail). zalo-import xoá `log` ở mọi nhánh nên không rò. Hai bản `import_one` đã lệch nhau.
- file: `scripts/apify-facebook-daily.sh:27-41,52`
- severity: low
- Đề xuất: known-limits (sửa một dòng: `rm -f "$TMPLOG"` ở các nhánh return, như bản zalo).

**Snapshot tới muộn có mốc nhỏ hơn state bị bỏ vĩnh viễn (vd 6 chữ số cùng giây sau state 9 chữ số)**
- Người dùng thấy gì: một mẻ tin bị thiếu, không có lỗi nào được báo.
- Căn cứ: state là một mốc «cao nhất đã nạp». Phép thử sandbox: state `2026-10-24T090800123`, rồi một
  thư mục `…__2026-10-24T090800` xuất hiện sau. Kết quả: 0 lần gọi import, thoát 0. Ca này xảy ra được
  khi collector cũ (:9210, mốc 6 chữ số) và collector mới (mili-giây) cùng ghi trong giai đoạn chuyển,
  hoặc khi hai writer ghi chéo nhau. Trên đĩa hôm nay, 2046/2046 thư mục zalo-agent đều là mốc 6 chữ số,
  nên giai đoạn chuyển chưa bắt đầu.
- file: `scripts/apify-facebook-daily.sh:73`, `scripts/zalo-import-daily.sh:64`
- severity: low
- Đề xuất: known-limits (bảo đảm chỉ một collector ghi zalo-agent tại một thời điểm khi triển khai 903fc80).

**chotot-daily không lọc khuôn tên snapshot**
- Người dùng thấy gì: nếu có một thư mục `hanoi__chotot-ads__TEST` (hoặc tên rác bất kỳ xếp sau chữ số),
  thì nó thành «mới nhất» mãi mãi. Thiếu manifest thì job đỏ mỗi ngày (import-chotot ném lỗi). Có
  manifest thì job nạp lại đúng dữ liệu cũ đó mỗi ngày mà vẫn thoát 0, tức là giá chotot ngừng cập nhật
  lặng lẽ.
- Căn cứ: phép thử sandbox với ba thư mục `2026-10-23T053000`, `2026-10-24T053000` và `TEST`, import giả
  thành công: thoát 0, chỉ nạp `TEST`. Dòng `ls … | sort | tail -1` không có TS_RE như hai script zalo-agent.
- file: `scripts/chotot-daily.sh:33`
- severity: low
- Đề xuất: known-limits (hoặc thêm TS_RE `^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}$` khi sửa lần tới).

## Analyst

Non-discriminating evals:
- **E9 (`au3_r1_probe`): lệnh đã sửa trong vòng này, nay phân biệt được.**
  - Ở lượt đầu, lệnh cũ (`grep -q 'được nạp lại'`) xanh trên cả `9e3bb9f` (main) lẫn `983f47e` (code
    vòng 1), dù cả hai in dòng thất bại «R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại». Lý do: grep khớp chuỗi
    con của chính dòng đó, và phép thử luôn thoát 0.
  - Điều phối đã đổi lệnh thành `grep -qx 'R1: hcmc T07 được nạp lại'`.
  - Đo lại bằng lệnh mới: đỏ trên cả hai baseline (không có dòng `R1 OK`, dòng R1 là «KHÔNG BAO GIỜ»),
    và xanh trên HEAD (lượt r2b).
- E8 (`au3_syntax`) xanh trên cả hai baseline: đây là guard cú pháp có chủ ý.
- E11: hai mục «không gỡ khoá của job khác» và «tự gỡ khoá (trap)» xanh trên baseline theo kiểu rỗng, vì
  bản cũ không có khoá. Hai mục phân biệt được là «không nạp gì, thoát khác 0» và «state không đổi».
- Các mục (d) của E6/E7 và should-NOT-fire «snapshot cũ hơn state» của E3 là guard hồi quy có chủ ý
  (AC-4 «như cũ»), như vòng 1.

Baseline đo bằng `git archive` hai cây ra scratchpad, chép harness và phép thử hiện hành vào, symlink
`pipeline/node_modules`, chạy xong thì xoá. Repo không bị đụng tới.
- `9e3bb9f` (gốc so sánh = merge-base với main): chotot 7 mục đỏ, apify 8, ts-format 6, lock 4. Cú pháp xanh.
  Phép thử R1 in dòng «KHÔNG BAO GIỜ», và lệnh E9 mới đỏ.
- `983f47e` (code vòng 1): chotot và apify xanh, đúng như vòng 1. ts-format 6 mục đỏ: thư mục `TEST` được
  nạp và state nhảy tới `TEST`. lock 4 mục đỏ: nạp 5 snapshot dù khoá đang bị giữ. Phép thử R1 in dòng
  «KHÔNG BAO GIỜ», và lệnh E9 mới đỏ.

Kiểm thêm, không phải eval:
- Thứ tự `sort` của đường ống `"$ts $d"` và phép so `[[ > ]]` (bash 3.2) khớp nhau ở cả `C`, `en_US.UTF-8`
  và `vi_VN.UTF-8`. Mốc 6 chữ số xếp trước mốc 9 chữ số cùng giây, và mốc gốc xếp trước `-1`. Vì vậy
  launchd (thường là locale C) và một lượt chạy tay từ terminal UTF-8 cho cùng kết quả.
- SIGTERM giữa lúc nạp: trap gỡ khoá, state giữ nguyên.
- Phía collector, tên thật của zalo-agent là `YYYY-MM-DDThhmmssmmm` cộng `-n` khi trùng (`storage.ts:29-34`).
  TS_RE khớp tên này. Chotot đặt tên `YYYY-MM-DDThhmmss` (`collect-chotot.mjs:99`).

## Variance

none — 11 eval tất định, mỗi eval chạy một lần. Riêng E9 chạy thêm một lượt sau khi lệnh được sửa. Các eval dùng chung lệnh cho output giống hệt nhau giữa
các lượt (E1/E4/E6; E2/E3/E5/E7). E3 và E4 chạy đồng thời, mỗi cái trong sandbox riêng, và không ảnh hưởng nhau.

## Iterations

Round 1: cả tám lệnh eval đều xanh, nhưng phản biện tìm ra R1: AC-2 vỡ khi snapshot zalo-agent nằm ở hai
thị trường, vì state nhảy qua snapshot lỗi. REJECT [E3], trả làn ZCode (`tin MỞ LẠI`).
Round 2: 11/11 eval xanh trên `5cae57f` (ZCode `903fc80` + main). R1 đã sửa (E9). Lệnh E9 sửa trong vòng vì grep
khớp chuỗi con, rồi chạy lại riêng (r2b): đỏ trên baseline, xanh trên HEAD. TS_RE nhận 6/9 chữ số và `-n`
(E10), khoá state chung (E11). PASS nhưng không xanh-sạch: «Ngoài hợp đồng» có một ca mất dữ liệu lặng lẽ
mức high (snapshot đang tải media), chờ Mạnh quyết mở hợp đồng mới hay ghi nhận.

### Re-pin lần 1 — 2026-10-25, do gộp origin/main 7381e9a (sau #88)
run_id: repin-20261025T051209Z-37560
sha: 0477f69ccf36e74404d541eb4428962bf530c1fd · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-31, do ghim lại sau Cổng 2 cong-tac-that: harness au3 bắt kịp main + revisit hồ sơ đã ký
run_id: repin-20261031T031750Z-45355
sha: 4819c9ceb992643c00d90dad5df0f834daf688bc · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-10-31, do ghim lại sau gộp origin/main (333c9891)
run_id: repin-20261031T033210Z-30899
sha: 6826a2a9e38a4fff5c02c402b2904f59ae4289ba · suites: 6 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng
