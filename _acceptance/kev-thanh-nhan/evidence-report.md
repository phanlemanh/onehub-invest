---
schema_version: 2
feature_slug: kev-thanh-nhan
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f5411aa8349eca5be7328f8de4a253a8e65e53b1
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: kev-thanh-nhan

PL4 (T3) — hook Zalo đẩy mọi tin tới collector kèm `meta.kev`, không bỏ tin theo điểm.
Vòng verify 1, phiên ngữ cảnh sạch, HEAD = 9fc3336 (code `collector/` và
`pipeline/import-airbnb.mjs` trùng 7271b32, `git diff 7271b32 HEAD` rỗng trên các đường đó).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |

## Evidence

Sandbox đã tự xác nhận bằng đọc harness `scripts/kev-nhan/acceptance.mjs` và `handler.js`:
handler chạy trong tiến trình con với `HOME` là thư mục tạm (có chặn trùng HOME thật),
env con chỉ có `PATH`, `HOME`, `ONEINVEST_KEV_URL`, `ONEINVEST_API_URL` trỏ hai server giả
trên cổng ngẫu nhiên 127.0.0.1; `handler.js` đọc đúng hai biến này (dòng 11–12). L1 chỉ là
grep mẫu chép từ `scripts/zalo-watchdog.sh`, không chạy watchdog.

- eval: E1
  run_id: kev-thanh-nhan-E1-20261023T094920
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_handler_label
  cmd: node scripts/kev-nhan/acceptance.mjs handler-label
  verified_at: 2026-10-23T09:49:20Z
  output: |
    gate sống: hook exit 0 · POST tới collector 4 · p = [0.2, 0.95, , ]
    ok   hook chạy xong, không ném lỗi
    ok   4 tin có chữ của zalouser đều được đẩy — kể cả p=0.2 (dưới ngưỡng 0.9)
    ok   log hook không còn dòng 'skip p=' (không bỏ tin theo điểm)
    ok   should-NOT-fire: tin rỗng không ảnh vẫn bị bỏ như cũ (không phải lọc theo p)
    ok   should-NOT-fire: kênh không phải zalouser không bị đẩy
    HANDLER-LABEL PASS

- eval: E2
  run_id: kev-thanh-nhan-E2-20261023T094926
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_handler_label
  cmd: node scripts/kev-nhan/acceptance.mjs handler-label
  verified_at: 2026-10-23T09:49:26Z
  output: |
    ok   Kev trả 500 hoặc thiếu noul → p = null (không giả 1.0)
    gate chết (cổng đóng): POST 1 · p = null
    ok   Kev không nghe → tin vẫn đẩy, p = null
    ok   log ghi gate-down
    HANDLER-LABEL PASS

- eval: E3
  run_id: kev-thanh-nhan-E3-20261023T094927
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_handler_label
  cmd: node scripts/kev-nhan/acceptance.mjs handler-label
  verified_at: 2026-10-23T09:49:27Z
  output: |
    gate sống: hook exit 0 · POST tới collector 4 · p = [0.2, 0.95, , ]
    ok   p thấp và p cao đi kèm nguyên giá trị
    ok   mọi tin có meta.kev đủ {p, model, threshold, at}
    ok   POST đúng /agent-report với khoá trong HOME giả
    HANDLER-LABEL PASS

- eval: E4
  run_id: kev-thanh-nhan-E4-20261023T094938
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_manifest_v3
  cmd: cd collector && rm -rf dist && npm run build && cd .. && node scripts/kev-nhan/acceptance.mjs manifest-v3
  verified_at: 2026-10-23T09:49:38Z
  output: |
    > tsc -p tsconfig.json
    manifest schemaVersion 3 · 2 item
    ok   manifest khai schemaVersion 3
    ok   tin có kev: meta.kev nguyên vẹn trong raw
    ok   should-NOT-fire: tin không kev không bị gắn meta.kev giả
    MANIFEST-V3 PASS

- eval: E5
  run_id: kev-thanh-nhan-E5-20261023T094943
  exit_code: 0
  baseline: red
  verifier: config:executors.script.collector_test_clean
  cmd: cd collector && rm -rf dist && npm test
  verified_at: 2026-10-23T09:49:45Z
  output: |
    ✔ kev-nhãn: p thấp vẫn nhận 202, meta.kev nguyên vẹn; không kev → meta.kev vắng
    ✔ kev-nhãn: p=null (gate down) vẫn nhận, meta.kev.p = null
    ✔ kev-nhãn: flush tin có kev → manifest khai schemaVersion 3 (PL4, claudedp-2310-11 mở lại)
    ✔ ZC1: hai tin CHỈ ẢNH cùng nhóm cùng ts → 2 RawItem; tin chữ giữ nguyên sourceId cũ
    ℹ tests 23
    ℹ pass 23
    ℹ fail 0
    ℹ skipped 0

- eval: E6
  run_id: kev-thanh-nhan-E6-20261023T094951
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_contract_doc
  cmd: grep -q 'schemaVersion.: 3' collector/docs/DATA-CONTRACT.md && grep -q 'chấp nhận `{1,2,3}`' collector/docs/DATA-CONTRACT.md && echo CONTRACT-DOC OK
  verified_at: 2026-10-23T09:49:51Z
  output: |
    CONTRACT-DOC OK

- eval: E7
  run_id: kev-thanh-nhan-E7-20261023T094951
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kev_import_versions
  cmd: node scripts/kev-nhan/acceptance.mjs import-versions
  verified_at: 2026-10-23T09:49:51Z
  output: |
    schemaVersion 1: qua kiểm phiên bản + sha256, dừng ở bước nối DB (cổng chết)
    ok   v1 được nhận
    schemaVersion 2: qua kiểm phiên bản + sha256, dừng ở bước nối DB (cổng chết)
    ok   v2 được nhận
    schemaVersion 3: qua kiểm phiên bản + sha256, dừng ở bước nối DB (cổng chết)
    ok   v3 được nhận
    schemaVersion 4: bị từ chối
    ok   should-NOT-fire: v4 bị từ chối trước khi đọc dữ liệu
    IMPORT-VERSIONS PASS

- eval: E8
  run_id: kev-thanh-nhan-E8-20261023T094952
  exit_code: 0
  baseline: green
  verifier: config:executors.script.kev_watchdog_l1
  cmd: node scripts/kev-nhan/acceptance.mjs watchdog-l1
  verified_at: 2026-10-23T09:49:52Z
  output: |
    mẫu L1 (nguyên văn watchdog): send-?message|sendMessage|reply\(
    ok   handler.js thật: L1 không khớp (không có API gửi tin) — watchdog không kill
    ok   đối chứng: bản cấy «await api.sendMessage(group, text);» → L1 khớp
    ok   đối chứng: bản cấy «await reply(text);» → L1 khớp
    ok   đối chứng: bản cấy «send-message» → L1 khớp
    WATCHDOG-L1 PASS

### An toàn runtime (đo quanh lượt chạy)

- Collector API :9210 giữ nguyên PID trước và sau (63069); Kev :8009 giữ nguyên PID (56822).
  Không restart, không `launchctl`, không chạy watchdog.
- `~/.openclaw/logs` (thư mục): mtime trước = sau (Oct 20 16:37:28). `~/.openclaw`, `~/.openclaw/hooks`,
  `~/.openclaw/hooks/oneinvest-zalo-pipe/handler.js`: mtime không đổi. Tệp log
  `oneinvest-zalo-pipe.log` có mtime tiến lên trong lượt chạy — do hook THẬT đang chạy ghi; đếm dòng
  mang tên nhóm giả của harness (`acc-group`, `group=g`, `acc-zc1`) trong log thật = 0.
- PL4 không ghi DB. (stg-roundtrip của hồ sơ ZC1 là eval duy nhất ghi DB; `stg_zalo_posts` 2242 trước
  và sau, `airbnb_snapshots` 528 trước và sau.)

## Known limits

- Tiêu chí `bat_khi` của PL4 (một ngày chạy thật: số tin hook nhận = số tin có snapshot, mọi tin có
  `meta.kev`) CHƯA đo được ở vòng này. Nó chỉ đo được sau khi triển khai hook vào `~/.openclaw` và
  restart Collector API :9210 — việc triển khai do ZCode làm qua kênh tin. Mọi eval ở đây chạy trong
  sandbox (HOME giả, Kev và collector giả).
- `meta.kev` dừng ở raw snapshot: `pipeline/import-airbnb.mjs` không ghi `meta.kev` vào `stg_zalo_posts`
  (bảng chưa có cột), nên transform hiện KHÔNG đọc được p. Đây là giới hạn đã ghi ở «Out of scope» của
  hợp đồng (cần migration của Claude khi transform cần dùng p), không phải lỗi của vòng này.
- E8 (L1 watchdog) xanh trên cả nhánh lẫn baseline ce4ad81 — nó là rào hồi quy an toàn Zalo, không phân
  biệt code mới với code cũ.
- Mã thoát của E5 (suite collector) cũng xanh trên baseline (19/19); eval chỉ đỏ trên baseline theo vế
  `expected` «có ca kev-nhãn» (baseline 0 ca kev-nhãn / ZC1).

## Ngoài hợp đồng

- **Kev treo (nhận kết nối, không trả lời) làm hook treo vô hạn, tin không được đẩy.** `fetch` tới Kev
  không có timeout/AbortSignal. Tái hiện an toàn (phép thử riêng, cùng cơ chế sandbox: tiến trình con,
  HOME giả, server Kev giả không bao giờ `res.end`): sau 4 giây tiến trình con vẫn chưa xong, phải
  SIGKILL, 0 POST tới collector giả, log trống. AC-2 chỉ phủ «không nghe / 500 / thiếu điểm» nên đây ngoài
  tiêu chí; code cũ (ce4ad81) cũng không có timeout — không phải hồi quy, nhưng nó chạm thẳng mục tiêu
  `bat_khi` «mọi tin vào raw». Đề xuất: `signal: AbortSignal.timeout(...)` cho lời gọi Kev → rơi vào
  nhánh gate-down, p = null.
- **Kev trả `noul` không phải số (chuỗi `"0.5"` hay `true`)**: hook đẩy nguyên giá trị đó vào `kev.p`
  (không ép về null), POST vẫn tới collector, nhưng dòng log sau POST ném `p.toFixed is not a function`
  và ghi `post-error` dù tin đã vào. Hệ quả: funnel đọc log (`app/src/lib/collections-queries.ts`,
  `pipeline/push-ops-facts.mjs`) đếm thiếu tin đã nhận; `meta.kev.p` có thể mang kiểu lạ. Code cũ còn tệ
  hơn (ném ra khỏi hook ở nhánh skip). Tái hiện: phép thử sandbox như trên với Kev giả trả
  `{"answers":{"is_bds":{"noul":"0.5"}}}`.
- **`pipeline/backfill-zalo-media.mjs` chỉ xét snapshot `schemaVersion === 2`** (dòng 50). Từ nay snapshot
  zalo-agent là v3 và vẫn mang `meta.mediaFiles`, nên `zalo_media_backfill --check` sẽ bỏ qua mọi snapshot
  mới — đo thiếu/xanh giả. Bên tiêu thụ `schemaVersion` khác trong `pipeline/`: `import-chotot.mjs` chỉ nhận
  v1 nhưng đọc snapshot do `collect-chotot.mjs` tự ghi v1, không bị ảnh hưởng.
- Ngữ nghĩa «skip» của funnel thay đổi: `scripts/audit-all.sh` (đếm `skip p=`) và funnel Ops (đếm ` skip `)
  sẽ về gần 0 vì hook không còn dòng `skip p=`; nhãn «gate pass/skip» trên Ops và audit thành lỗi thời.
- Phình dữ liệu (chỉ ghi nhận): theo số đo 23/10 trong hợp đồng (1270 skip / 549 post), lượng tin vào raw và
  `stg_zalo_posts` có thể tăng khoảng 3 lần, gồm cả tin không phải BĐS. Lọc thật dồn hết về `transform-zalo`
  (parsePost) — mà transform chưa đọc được p (xem Known limits).

## Analyst

Non-discriminating evals: E8 — xanh trên cả nhánh lẫn baseline ce4ad81; đây là rào hồi quy an toàn Zalo có
chủ ý (L1 không được khớp handler thật), không chứng tính năng.

Baseline (ce4ad81, worktree tạm ngoài repo, chép harness, `npm ci` + build collector, `pipeline/node_modules`
mượn bằng symlink; đã gỡ worktree): handler-label red (6 mục, 1 POST thay vì 4, không có kev), manifest-v3 red
(manifest v2, không meta.kev), import-versions red (v3 bị từ chối), contract-doc red, watchdog-l1 green, suite
collector chạy xanh 19/19 nhưng 0 ca kev-nhãn nên red theo vế expected.

Phép thử riêng (sandbox, không ghi DB): Kev trả JSON hỏng → gate-down, p = null, tin vẫn đẩy (đúng); Kev treo
và noul không phải số — xem Ngoài hợp đồng. Không còn đường nào trong `handler.js` bỏ tin theo p hay gán p giả:
nhánh duy nhất còn `return` sớm là kênh khác zalouser và tin rỗng không ảnh.

## Variance

none — mọi eval đều tất định (runs: 1). E1–E3 chạy chung lệnh ba lần riêng, kết quả trùng nhau.

## Iterations

Round 1: 8/8 eval PASS; không có lỗi chạm tiêu chí. Các phát hiện ngoài hợp đồng ghi ở trên để người quyết.

### Re-pin lần 1 — 2026-10-23, do hoá cũ do merge origin/main d72479f (ZC3 PR #31) vào nhánh
run_id: repin-20261023T103041Z-17532
sha: 7617e4a21b697fb63ce8745f4da734c1affa8faf · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-23, do hoá cũ do merge origin/main 2ba6d4a (#34, #35, #37) vào nhánh
run_id: repin-20261023T105354Z-32956
sha: 2a4f9401e9c17d442d2e35503ed4498bfaebcfa9 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-10-26, do ghim lại sau sửa thước kev-nhan (PR #135) và gộp main 441e0405
run_id: repin-20261026T131214Z-72593
sha: f5411aa8349eca5be7328f8de4a253a8e65e53b1 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
