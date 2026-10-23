---
schema_version: 1
feature: Mọi job đêm thoát khác 0 khi không tới được DB, và watchdog cảnh báo khi DB sập
slug: job-bao-loi-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, docs]
status: implemented
design_doc: docs/superpowers/specs/2026-10-23-job-bao-loi-that-design.md
lo_trinh_ma: AU3
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: job-bao-loi-that

## Context

Hàng AU3 (đợt `cam-mau-2310`). Audit 23/10 L7, L10: DB local sập ~8 giờ đêm 22→23/10 mà `launchctl` ghi
mọi job «last exit 0». Đo 23/10 (design doc §1): từng bước node làn Claude đã thoát 1 + `ECONNREFUSED` khi
DB không tới; lỗ nằm ở tệp bọc shell không `set -e` — bước giữa hỏng, bước cuối lành (DB lên lại giữa chuỗi,
như `chotot-daily` 05:30 với DB lên 05:38) thì launchd thấy 0. Vòng này: chặn lỗ ở đoạn transform của
`scripts/chotot-daily.sh` và `scripts/apify-facebook-daily.sh` bằng bộ chạy bước dùng chung
`scripts/lib/job-step.sh`, và dựng phép đo `scripts/job-exit.test.mjs` cho cả năm job có bước DB làn Claude.
Vế «watchdog cảnh báo khi DB sập» là lớp L5b của ZC3 (làn ZCode) — xem Out of scope.

Source input: hàng AU3 `docs/plan/lo-trinh.json` + ô cơ hội `_acceptance/job-bao-loi-that/opportunity.md`
(Mạnh «build duyệt» 23/10) + LUAT đợt `dot0-cam-mau`.

## Criteria

- AC-1: Given cây tạm chứa bản chép nguyên `scripts/chotot-daily.sh` + `scripts/lib/job-step.sh` và `node` giả đầu `PATH` (ghi nhật ký lời gọi; bước được chỉ định in `Error: connect ECONNREFUSED` rồi thoát 1), When chạy job với (a) mọi bước lành, (b) lần lượt `transform-chotot`, `refresh-bait-gap`, `resolve-properties` hỏng, (c) `transform-chotot` thoát 3 và `resolve-properties` thoát 1, Then (a) thoát 0, không dòng `JOB FAIL`, nhật ký lời gọi khớp ĐÚNG dãy bước viết trước; (b) thoát ≠ 0, stderr có đúng dòng `JOB FAIL [chotot-daily] bước <bước> mã 1`, và các bước SAU bước hỏng VẪN được gọi đúng thứ tự (luồng dữ liệu không đổi so với trước vòng); (c) thoát 3 (mã của bước hỏng ĐẦU TIÊN) và có hai dòng ghim; chiều đỏ cùng cây: bản đột biến bỏ phần ghi mã hỏng của một bước → ca của bước đó đỏ, thông điệp nêu tên bước.
- AC-2: Given cây tạm như AC-1 với `scripts/apify-facebook-daily.sh`, When chạy với (a) mọi bước lành, (b) lần lượt `transform-fb`, `refresh-bait-gap` hỏng, Then (a) thoát 0, không dòng `JOB FAIL`, nhật ký lời gọi khớp dãy viết trước; (b) thoát ≠ 0, dòng `JOB FAIL [apify-facebook-daily] bước <bước> mã 1`, bước sau vẫn được gọi; chiều đỏ: bản đột biến bỏ phần ghi mã hỏng → ca đỏ có tên bước.
- AC-3: Given cây tạm cho từng job trong năm job (`chotot-daily`, `apify-facebook-daily`, `airdna-daily`, `cloud-sync`, collector tuần qua `pipeline/finalize-hanoi.sh`) với `node`/`docker` giả, When chạy (a) mọi bước lành và (b) «DB tắt hẳn» — mọi lời gọi `node <gốc>/pipeline/*.mjs` (hoặc `node *.mjs` trong `pipeline/`) và mọi `docker` hỏng `ECONNREFUSED`; lời gọi collector (`dist/cli.js`, `npm`) vẫn lành, Then (a) cả năm thoát 0; (b) cả năm thoát ≠ 0 — ma trận năm job × hai trạng thái viết trước trong test, ca đếm khẳng định đủ 10 ca; thêm ca `todo` mang mã đáp án Hỏi-1 cho ô «cloud-sync · chập chờn (sync-cloud hỏng, push-ops-facts lành)» để lỗ hiện trong đầu ra (trừ khi Hỏi-1 chọn vá ở vòng này).
- AC-4: Given cây tạm cho `airdna-daily.sh` và `finalize-hanoi.sh` (không đổi ở vòng này), When lần lượt một bước làn Claude hỏng (`transform-airdna`, `dq-truthful-coverage`; `reassign-areas`, `transform-airbnb`, `transform-zalo`, psql `300_metrics`), Then thoát ≠ 0 và không bước nào sau bước hỏng được gọi (hai tệp đã `set -euo pipefail`); đối chứng dương: ca mọi bước lành có nhật ký lời gọi khớp đúng dãy viết trước.
- AC-5: Given mười bước node làn Claude THẬT (`transform-chotot`, `refresh-bait-gap`, `resolve-properties`, `transform-fb`, `transform-airdna`, `dq-truthful-coverage`, `reassign-areas`, `transform-airbnb`, `transform-zalo`, `sync-cloud`), mỗi bước chạy với env trắng (chỉ `PATH`, `HOME` tạm có `cloud.env` giả, `DATABASE_URL`/`PGHOST`/`PGPORT` trỏ một cổng canh do test mở và đóng ngay mọi kết nối) và hộp cát nạp trước (`node --import`) chặn mọi kết nối TCP không tới cổng canh và mọi `fetch`, When chạy từng bước, Then mỗi bước thoát ≠ 0, cổng canh ghi nhận ≥ 1 lần nối từ bước đó (quan hệ «kết nối thật đi theo `DATABASE_URL`»), và hộp cát không phải chặn lần nối nào khác; ca đếm khẳng định đủ 10 bước + 1 ca `todo` `push-ops-facts` (mã `P3-3`, không chạy — viết cứng chuỗi kết nối); chiều đỏ cùng bộ đo: (i) bản sao một bước với `.catch` nuốt lỗi (thoát 0) → ca đỏ; (ii) bản sao viết cứng `localhost:5433` → hộp cát chặn, cổng canh không thấy lần nối, ca đỏ và không chạm DB thật.
- AC-6: Given `scripts/lib/job-step.sh`, When `job_step <job> <nhãn>` chạy lệnh thoát 0, thoát 1, thoát 3, Then trả đúng 0 / 1 / 3; lệnh lành không in gì thêm; lệnh hỏng in đúng một dòng `JOB FAIL [<job>] bước <nhãn> mã <n>` ra stderr (không ra stdout); stdout/stderr của chính lệnh đi qua nguyên vẹn.
- AC-7: Given `docs/ops/runtime-map.md`, When người vận hành đọc mục job đêm, Then biết job nào nay thoát ≠ 0 khi bước DB hỏng (và dòng `JOB FAIL` để tìm trong log), bước nào còn nuốt lỗi và đang chờ ai (`P3-1` ZCode: đoạn nạp; `P3-3` T3: `cloud-sync.sh` khi DB chập chờn + `push-ops-facts`), và cảnh báo DB sập đến từ L5b watchdog (ZC3) chứ không từ job. (judgment)

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Không gian đã liệt bằng ma trận viết trước trong
design doc §6, theo ba trục:

- Trục A — job launchd có bước DB làn Claude: chotot-daily | apify-facebook-daily | airdna-daily | cloud-sync |
  collector tuần [thước CE: 11 plist `pipeline/cron/*.plist` — 5 job còn lại không chạy bước DB làn Claude:
  zalo-import/zalo-watchdog/zalo-heartbeat/collector-plist-thu (làn ZCode), smoke (không DB), backup (chưa cài),
  kev-gate (dịch vụ Python)] → AC-1..AC-4.
- Trục B — trạng thái DB trong lượt: lành (AC-3a) | tắt hẳn (AC-3b) | chập chờn = một bước giữa hỏng (AC-1, AC-2,
  AC-4) [thước CE: sự cố 22/10 — DB lên lại giữa chuỗi].
- Trục C — lớp: tệp bọc shell (AC-1..AC-4) | bước node (AC-5) | bộ chạy bước (AC-6) |
  tài liệu vận hành (AC-7); ranh giới làn/hạng: không đo bằng eval — xem Notes.
- [GIẢ ĐỊNH] `node`/`docker` giả trên `PATH` mô phỏng đúng cách tệp bọc thấy bước hỏng (chỉ qua mã thoát). Lớp
  bước thật (AC-5) đỡ vế «bước thật thoát ≠ 0»; lớp tệp bọc đỡ vế «mã đi lên launchd».

## Đường đo

- «Tắt DB rồi chạy từng job: tất cả thoát khác 0» · số từ `node --test scripts/job-exit.test.mjs` (ca «DB tắt hẳn» × 5 job + 10 bước thật trên cổng canh) · AC-3, AC-5
- «… có một cảnh báo» · số từ L5b của `scripts/zalo-watchdog.sh` (ZC3, nhánh `zcode/audit-p1-resilience`) — NGOÀI hàng — Hỏi-2 chốt A: vế này thành ngưỡng của ZC3 · không AC ở hàng này

## Out of scope

- Cảnh báo DB sập: lớp L5b của `scripts/zalo-watchdog.sh` (ZC3, làn ZCode, `t3_paths`) — vòng này không dựng kênh cảnh báo thứ hai.
- Đoạn thu/nạp của `chotot-daily.sh` và `apify-facebook-daily.sh` (`import-chotot` không kiểm mã; `import-airbnb … || true` + state nhảy qua snapshot hỏng) — làn ZCode, yêu cầu `P3-1`.
- `scripts/zalo-import-daily.sh` — bản vá P1.5 nằm trên nhánh ZC3.
- `scripts/cloud-sync.sh` khi DB chập chờn/sống mà `sync-cloud` hỏng còn `push-ops-facts` lành (theo đáp án Hỏi-1), và `push-ops-facts.mjs` viết cứng chuỗi kết nối — `t3_paths`, đề xuất hàng T3 riêng (`P3-3`).
- `backup.sh` (chưa cài; `BACKUP_*` chờ Mạnh — audit Q; PASS giả thuộc AU5) · `smoke-daily.sh` (không dùng DB).
- Thử lại khi `ECONNREFUSED`; hiện «last exit» của launchd lên `/ops` (AU5/AU6); sửa plist.

## Notes

- Phép đo KHÔNG tắt DB chung :5433 (job đêm và ZCode chạy trên cùng DB) — «DB tắt» = cổng chết `127.0.0.1:5434` hoặc bước giả hỏng `ECONNREFUSED`.
- Ranh giới làn/hạng không có eval riêng (một thuộc tính của nhánh, không phải của cây — đặt vào bộ test chung thì
  đỏ mọi nhánh sau sửa đúng phần vòng này chừa ra): tệp `bao_ve` bị hook đợt chặn sửa; tệp `t3_paths` bị
  `scripts/pre-merge-check.sh` bắt khi hồ sơ là T2; đoạn thu/nạp của hai tệp `*-daily.sh` giữ nguyên — người soát
  thấy trong diff PR.
