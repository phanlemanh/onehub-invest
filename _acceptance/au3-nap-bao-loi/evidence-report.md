---
schema_version: 2
feature_slug: au3-nap-bao-loi
verdict: REJECT
failed_evals: [E3]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2dc2da0382e17fcf42895bb164c117ef33aed0de
human_signoff:
---

# Evidence Report: au3-nap-bao-loi

Vòng verify 1, cây `2dc2da0` (nhánh `claude/acceptance-au3-nap-bao-loi`; code tính năng là `e68e374`).
Cả tám lệnh eval đều xanh. Báo cáo vẫn REJECT vì phản biện tìm ra một lỗi chạm AC-2 mà E3
không phủ: khi snapshot `zalo-agent` nằm ở **hai thị trường**, state vượt qua snapshot lỗi,
nên snapshot đó không bao giờ được nạp lại (R1 dưới đây). Hôm nay ca này chưa xảy ra vì
903/903 snapshot `zalo-agent` trên máy đều ở `hanoi`. Nếu Mạnh coi ca nhiều thị trường là
ngoài phạm vi, chỉ cần ghi một entry descope vào `decisions.jsonl`, chuyển R1 sang «Ngoài
hợp đồng», và hồ sơ này đủ điều kiện PASS mà không phải chạy lại.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | FAIL — lệnh xanh, nhưng AC-2 vỡ ở ca R1 (hai thị trường) mà eval không phủ |
| E4 | AC-3 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-4 | script | PASS |
| E8 | AC-4 | script | PASS |

## Lỗi chạm tiêu chí

### R1 — apify: thứ tự nạp theo đường dẫn, không theo thời gian → state nhảy qua snapshot lỗi (AC-2)

`scripts/apify-facebook-daily.sh:45` duyệt `ls -1d "$ROOT"/collector/snapshots/*/*__zalo-agent__* | sort`.
Lệnh này sắp theo **cả đường dẫn**, tức thị trường trước rồi mới tới thời gian. Còn state lại là
một mốc thời gian duy nhất, lấy max (dòng 53 và 56). Lấy ví dụ `hanoi/…T13` (nạp tốt) và
`hcmc/…T07` (nạp lỗi), cả hai đều mới hơn state:

- lượt 1: chạy `hanoi T13` (MAXTS = T13) rồi tới `hcmc T07`, lỗi, break. Script ghi state = T13 và exit 1.
- lượt 2, DB lành: `hcmc T07` < state nên bị bỏ qua. Không có import nào, exit 0, transform vẫn chạy.
  **Snapshot lỗi không bao giờ được nạp lại**, trái với Then của AC-2 («lượt 2: nạp lại đúng snapshot lỗi»).

Cách tái hiện an toàn: `bash _acceptance/au3-nap-bao-loi/probes/r1-nhieu-thi-truong.sh "$PWD"`.
Phép thử chạy bản chép trong thư mục tạm, HOME giả, kiểm stub `sleep` thắng PATH, và mọi
module pipeline đều là bản giả, nên không đụng DB hay mạng. Kết quả thật:

```
stub sleep thắng PATH: ok
--- lượt 1: hcmc T07 nạp lỗi
❌ nạp fail tại <tmp>/repo/collector/snapshots/hcmc/hcmc__zalo-agent__2026-10-23T070000000 — giữ state ở 2026-10-23T130000000, dừng chuỗi (lần chạy sau nạp tiếp)
  gọi: import hanoi/hanoi__zalo-agent__2026-10-23T130000000
  gọi: import hcmc/hcmc__zalo-agent__2026-10-23T070000000
--- lượt 2: DB lành
  gọi: apify-facebook-collector
  gọi: transform-fb
  gọi: refresh-bait-gap
R1: hcmc T07 KHÔNG BAO GIỜ được nạp lại (state đã vượt nó)
```

Ca này đạt được trên thực tế không? Hôm nay thì không. `collector/src/api/server.ts:178` tạo
`SnapshotWriter(snapshotRoot, city, "zalo-agent")` với **một** `city` cho cả server, và dữ liệu
thật có 903 snapshot đều ở `hanoi`. Ca chỉ xảy ra khi bật collector cho thị trường thứ hai.
Dù vậy, glob `*/` của script cho thấy nó định quét nhiều thị trường, và Given của AC-2 không
loại ca đó. Hướng sửa thuộc làn ZCode (`tin MỞ LẠI`): sắp theo TS ở `basename` chứ không theo
đường dẫn. Bản sửa không thuộc phiên này.

## Evidence

- eval: E1
  run_id: au3-nap-bao-loi-E1-20261023T162040
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-23T16:20:42Z
  output: |
    (a) DB chết thật: exit 1 · 10 dòng retry · sleep 10× [sleep 20] · transform false
    ok   (a) exit khác 0
    ok   (a) lỗi thật của import-chotot được nhận là ECONNREFUSED: mỗi thành phố thử 5 lần, chờ 20s giữa các lần
    ok   (a) KHÔNG chạy transform / refresh / resolve
    ok   (a) log báo dừng trước transform
    CHOTOT PASS

- eval: E2
  run_id: au3-nap-bao-loi-E2-20261023T162052
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-23T16:20:54Z
  output: |
    (a) DB chết thật: exit 1 · 5 dòng retry · sleep 5 · state 2026-10-22T120000000 · transform false
    ok   (a) lỗi thật được nhận là ECONNREFUSED: thử 5 lần, chờ 20s, exit khác 0
    ok   (a) state giữ nguyên (chưa nạp được snapshot nào)
    ok   (a) dừng chuỗi ngay ở snapshot đầu, không thử các snapshot sau
    ok   (a) không transform / refresh
    APIFY PASS

- eval: E3
  run_id: au3-nap-bao-loi-E3-20261023T162105
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-23T16:21:06Z
  output: |
    (b) lượt 1, 2026-10-23T070000000 lỗi: exit 1 · state 2026-10-23T010000000 · nạp [import 2026-10-23T010000000 #1, import 2026-10-23T070000000 #1]
    ok   (b) lượt 1: exit khác 0, state giữ ở snapshot thành công cuối
    ok   (b) lượt 1: snapshot sau không nạp, không transform
    ok   should-NOT-fire: snapshot cũ hơn state không nạp lại
    (b) lượt 2, DB lành: exit 0 · state 2026-10-23T130000000 · nạp [import 2026-10-23T070000000 #2, import 2026-10-23T130000000 #1]
    ok   (b) lượt 2: nạp lại đúng snapshot lỗi rồi snapshot sau, không nạp lại snapshot đã thành công
    ok   (b) lượt 2: state tới snapshot cuối, transform + refresh chạy
    APIFY PASS
  note: lệnh xanh, nhưng mọi snapshot của eval đều ở hanoi. Ca hai thị trường (R1) làm AC-2 vỡ.

- eval: E4
  run_id: au3-nap-bao-loi-E4-20261023T162112
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-23T16:21:14Z
  output: |
    (c) lỗi khác DB: exit 1 · thử hanoi 1 lần · sleep 0
    ok   (c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ, exit khác 0
    ok   (c) không transform
    DB lên lại sau 2 lần: exit 0 · thử hanoi 3 lần · sleep 2
    ok   ECONNREFUSED 2 lần rồi lên → thử 3 lần, chờ 2×20s, đi tiếp transform, exit 0
    CHOTOT PASS

- eval: E5
  run_id: au3-nap-bao-loi-E5-20261023T162119
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-23T16:21:21Z
  output: |
    ok   (c) lỗi khác ECONNREFUSED → thử 1 lần, không chờ
    ok   ECONNREFUSED 3 lần rồi lên → thử 4 lần, chờ 3×20s, nạp hết, exit 0
    APIFY PASS

- eval: E6
  run_id: au3-nap-bao-loi-E6-20261023T162128
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_chotot
  verified_at: 2026-10-23T16:21:29Z
  output: |
    (d) DB sống: exit 0 · nạp [hanoi__chotot-ads__20261023T053000, hcmc__chotot-ads__20261023T053000] · bước [transform-chotot, refresh-bait-gap, resolve-properties]
    ok   (d) DB sống → exit 0, không chờ
    ok   (d) should-NOT-fire: chỉ nạp snapshot MỚI NHẤT mỗi thành phố, bản 22/10 không nạp
    ok   (d) đủ 3 bước transform → refresh → resolve
    ok   (d) transform hỏng → refresh + resolve vẫn chạy, exit 3, dòng JOB FAIL
    CHOTOT PASS

- eval: E7
  run_id: au3-nap-bao-loi-E7-20261023T162135
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-23T16:21:37Z
  output: |
    ok   (d) DB sống, transform-fb hỏng → refresh vẫn chạy, exit 4, dòng JOB FAIL, state tới cuối
    APIFY PASS

- eval: E8
  run_id: au3-nap-bao-loi-E8-20261023T162142
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_syntax
  verified_at: 2026-10-23T16:21:42Z
  output: |
    SYNTAX OK

Network truth: không có eval `ui-check` nào, nên `network_observed` không áp dụng. Cả tám đều
là eval `script` không có đường mạng: n-a (driver).

Trước khi chạy, phiên verify đọc harness `scripts/au3-nap-bao-loi/acceptance.mjs` và xác nhận
bốn điểm an toàn:
- ROOT của bản chép là thư mục tạm, nên `collect-chotot.mjs` và `apify-facebook-collector.mjs` là bản giả;
- HOME giả, nên `~/.openclaw` không bị đọc;
- stub `sleep` được kiểm là thắng PATH, và harness bỏ chạy nếu stub thua;
- `deadPort()` mở một cổng rồi đóng lại, nên ca DB chết dùng `import-*.mjs` thật trỏ cổng không ai nghe.

Hai bản import thật đều `client.connect()` trước mọi lệnh ghi. Khi chạy xong, không còn thư
mục `acc-au3-*` nào sót trong `$TMPDIR`.

## Known limits

- Retry chỉ bắt chuỗi `ECONNREFUSED`. Các lỗi tạm khác khi DB đang lên lại thì không được
  retry mà fail ngay ở lần đầu, ví dụ `57P03 the database system is starting up`, hay
  `Connection terminated unexpectedly` khi proxy cổng của docker/colima đã nhận kết nối mà
  postgres chưa sẵn sàng. Điều này đúng với AC-3 («lỗi khác thì không retry»), nhưng có nghĩa
  là một lần DB khởi động lại có thể vẫn làm job đỏ, dù không mất dữ liệu: apify giữ state,
  còn chotot dừng trước transform.
- Chotot chỉ nạp snapshot mới nhất mỗi thị trường, và AC-4 chốt điều đó là «như cũ». Vì thế
  snapshot của một ngày nạp hỏng sẽ không bao giờ vào `stg_chotot_ads`: ngày sau chỉ nạp
  bản mới hơn. Raw snapshot vẫn còn, nhưng mốc giá của ngày đó vắng khỏi stg.
- Eval chạy bản chép trong sandbox. Chưa có lượt chạy thật dưới launchd, và hợp đồng cũng
  đã để ngoài phạm vi.
- E6, E7 và E8 kiểm «hành vi như cũ». Ở cấp lệnh thì chúng vẫn red trên baseline vì dùng
  chung lệnh với các ca mới, nhưng chính các mục kiểm (d) của chúng thì xanh trên baseline.
  Xem Analyst.

## Ngoài hợp đồng

- Apify: bước thu `node "$ROOT/pipeline/apify-facebook-collector.mjs"` (dòng 17) không kiểm
  mã thoát. Nếu Apify hỏng (token, quota, mạng), job vẫn nạp, vẫn transform và exit 0, nên
  launchd không thấy lỗi thu. Lỗi này có từ trước (baseline giống hệt) và hợp đồng chỉ phủ
  phần nạp. Chotot thì có `|| exit 1` cho bước thu.
- Hai job dùng chung state `pipeline/logs/apify-daily.state` và **cùng lịch 00:00**:
  `com.oneinvest.apify-facebook` chạy 0/6/12/18h, `com.oneinvest.zalo-import` chạy 0h. Hai
  job chạy chồng thì đọc cùng LAST, nạp cùng snapshot, rồi ghi state theo kiểu bên ghi sau
  thắng.
  - Trong một thị trường, state có thể lùi, nhưng hậu quả chỉ là nạp lại một lần, và việc
    nạp lại là idempotent nhờ ON CONFLICT post_id. Vì mỗi bên chỉ đẩy state tới snapshot nó
    tự nạp xong, ca này không làm mất snapshot.
  - Hai giao dịch upsert cùng post_id có thể chặn nhau hoặc deadlock. Lỗi đó không phải
    ECONNREFUSED nên một job sẽ đỏ giả, rồi tự lành ở lượt sau.
  - `transform-fb` và `transform-zalo` cũng chạy đồng thời.
- R1 cũng có y hệt trong `scripts/zalo-import-daily.sh:40` (ZC3, đã nghiệm thu riêng), cùng
  khuôn `ls … | sort` theo đường dẫn. Sửa R1 thì nên sửa cả hai chỗ.
- Snapshot mồ côi: `import-airbnb.mjs:38-41` trả 0 khi thiếu `manifest.json`. `SnapshotWriter`
  (`collector/src/core/storage.ts`) tạo thư mục trước rồi mới ghi manifest ở `finalize`, không
  qua bước rename nguyên tử. Nếu job nạp đúng lúc collector đang flush một snapshot, snapshot
  đó bị coi là đã nạp, state vượt qua nó, và nó mất khỏi stg. Cửa sổ thời gian rất ngắn, và
  lỗi có từ trước.
- `grep -q "ECONNREFUSED"` khớp chuỗi con ở bất kỳ đâu trong log. Phép thử R1 vô tình chứng
  minh điều này: một lỗi giả có chữ «không phải ECONNREFUSED» trong thông báo vẫn bị retry
  5×20s. Hậu quả chỉ là chậm khoảng 100s rồi vẫn fail đúng: exit khác 0, không transform.
- `sleep 20` sau lần thử thứ 5 là thừa. Mỗi lần nạp hỏng hẳn chờ thêm 20s, nên chotot ở ca
  hai thị trường đều chết mất khoảng 200s. Hai thị trường được thử độc lập (thị trường đầu
  lỗi vẫn thử thị trường sau), và việc đó vô hại: thị trường sau nạp được thì stg của nó cập
  nhật, chỉ transform phải chờ lượt sau. Harness đếm 5 hay 10 lần sleep, nên đã đóng khuôn
  đúng hành vi này.
- `mktemp` không có `trap`. Nếu launchd giết job giữa lúc `node` đang chạy, một tệp log tạm
  sẽ sót lại trong `$TMPDIR`: rò nhỏ, vô hại.

## Analyst

Non-discriminating evals:
- E8 (`au3_syntax`) xanh trên cả nhánh lẫn baseline `e68e374~1`. Đây là guard cú pháp có chủ ý.
- Mọi eval còn lại red trên baseline ở cấp lệnh.

Cấp mục kiểm: các mục (d) của E6 (chotot DB sống, chỉ snapshot mới nhất, đủ 3 bước, JOB FAIL)
và E7 (transform-fb hỏng) **xanh trên baseline**. Mục should-NOT-fire «snapshot cũ hơn state
không nạp lại» của E3 cũng xanh trên baseline. Đây là các guard hồi quy có chủ ý, vì AC-4 đòi
«hành vi như cũ». Chúng red ở cấp lệnh chỉ vì nằm chung lệnh với các ca mới. Thêm một điểm:
mục «(a) dừng chuỗi ngay ở snapshot đầu» của E2 xanh trên baseline theo kiểu rỗng (`every`
trên 0 dòng retry). Trên nhánh nó không yếu, vì mục đếm `retry.length === 5` đi kèm.

Baseline đã đo trong worktree tạm ngoài repo (scratchpad, `git worktree add --detach … e68e374~1`
= `bf4145e`), harness chép vào, `pipeline/node_modules` symlink, chạy xong đã gỡ:
- chotot: 7 mục đỏ, gồm (a) DB chết: exit 0, không retry, transform vẫn chạy; (c); và ECONNREFUSED tạm;
- apify: 8 mục đỏ, gồm (a) state nhảy tới T13 khi DB chết; (b) lượt 1 exit 0, nạp T3; lượt 2 không nạp gì; (c); ECONNREFUSED tạm.

Không eval nào phủ trục «thị trường» của apify. R1 lọt qua vì vậy, và E3 nên có thêm một ca hai thị trường.

## Variance

none — mọi eval chạy một lần và là eval tất định. Các lệnh dùng chung (chotot ba lượt, apify
bốn lượt) cho cùng một kết quả mỗi lượt.

## Iterations

Round 1: cả tám lệnh eval đều xanh, nhưng phản biện tìm ra R1: AC-2 vỡ khi snapshot zalo-agent
nằm ở hai thị trường, vì state nhảy qua snapshot lỗi. Trả làn ZCode (`tin MỞ LẠI`), hoặc Mạnh
ghi descope ca nhiều thị trường.
