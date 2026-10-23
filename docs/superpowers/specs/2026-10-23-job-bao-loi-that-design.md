# Job đêm báo lỗi thật (AU3 · `job-bao-loi-that`) — thiết kế

Hàng AU3 của `docs/plan/lo-trinh.json` (đợt `cam-mau-2310`, T2). Câu giao: «Mọi job đêm thoát khác 0 khi
không tới được DB, và watchdog cảnh báo khi DB sập». Gốc: audit 23/10 L7, L10 — DB local sập ~8 giờ đêm
22→23/10 mà `launchctl` ghi mọi job «last exit 0».

## 1. Số đo trước khi thiết kế (23/10, worktree, DB trỏ cổng chết `127.0.0.1:5434`)

| Bước node làn Claude | Mã thoát | stderr |
|---|---|---|
| `transform-chotot`, `refresh-bait-gap`, `resolve-properties`, `transform-fb`, `transform-airdna`, `dq-truthful-coverage`, `reassign-areas`, `transform-airbnb`, `transform-zalo` | 1 | `ECONNREFUSED` |
| `sync-cloud` | chưa đo ở bước này (cần `cloud.env` giả) — đọc `DATABASE_URL` | — |
| `push-ops-facts` | **không đo được** — chuỗi kết nối viết cứng `localhost:5433`, bỏ qua `DATABASE_URL` | — |

Kết luận: từng bước đã báo lỗi đúng. **Lỗ nằm ở tệp bọc shell** (launchd chỉ thấy mã của tệp bọc):

| Job launchd | Tệp bọc | Vì sao «exit 0» khi DB hỏng |
|---|---|---|
| `com.oneinvest.cloud-sync` (15′) | `scripts/cloud-sync.sh` | không `set -e`: `sync-cloud` hỏng, `push-ops-facts` lành → mã 0 |
| `com.oneinvest.chotot` (05:30) | `scripts/chotot-daily.sh` | không `set -e`: chỉ mã của bước cuối (`resolve-properties`) lên launchd; đêm 22/10 DB lên lại 05:38 giữa chuỗi → bước nạp/transform hỏng, bước cuối lành → 0 |
| `com.oneinvest.apify-facebook` (6h) | `scripts/apify-facebook-daily.sh` | không `set -e`: `transform-fb` hỏng, `refresh-bait-gap` lành → 0 |
| `com.oneinvest.airdna-daily` | `scripts/airdna-daily.sh` | đã `set -euo pipefail` — đúng sẵn |
| `com.oneinvest.collector` (tuần) | `weekly-with-jitter.sh` → `weekly-collect.sh` → `pipeline/finalize-hanoi.sh` | cả ba `set -euo pipefail` — đúng sẵn |

## 2. Điều thật sự hỏng khi «không tới được DB»

Khi DB tắt HẲN suốt lượt, bước cuối của mỗi tệp bọc cũng hỏng ở `connect()` → tệp bọc đã thoát ≠ 0 (kể cả
`cloud-sync.sh`: `push-ops-facts` nối thẳng `localhost:5433`). «Mọi job exit 0» đêm 22/10 đến từ hai ca:

- **DB chập chờn / lên lại giữa chuỗi** (đêm 22/10: DB lên 05:38, `chotot-daily` chạy 05:30): bước giữa hỏng,
  bước cuối lành → mã 0. Đây là lỗ của đoạn transform trong `chotot-daily.sh` và `apify-facebook-daily.sh`.
- **Bước nạp nuốt lỗi** (`|| true`, không kiểm mã) — làn ZCode, xem §3.

## 3. Ranh giới làn và hạng (AGENTS.md «Phân làn», LUAT đợt, `_acceptance/config.yaml` `t3_paths`)

- **Vòng này sửa (làn Claude, T2):** đoạn transform trở đi của `chotot-daily.sh` (`transform-chotot` →
  `refresh-bait-gap` → `resolve-properties`) và của `apify-facebook-daily.sh` (`transform-fb` →
  `refresh-bait-gap`); thêm `scripts/lib/job-step.sh`; phép đo `scripts/job-exit.test.mjs`; ghi chú
  `docs/ops/runtime-map.md`.
- **Không sửa — `t3_paths`:** `scripts/cloud-sync.sh`, `pipeline/push-ops-facts.mjs`. Khi DB tắt hẳn job này đã
  thoát ≠ 0 (phép đo giữ điều đó). Còn hai lỗ: DB chập chờn (rớt lúc `sync-cloud`, lên lại trước `push-ops-facts`) thì mã 0 — CÙNG ca
  chập chờn mà vòng này vá cho chotot/apify; và `push-ops-facts` bỏ qua `DATABASE_URL`. Vá ở hàng T3 riêng
  (`P3-3`, khuyến nghị) hay nâng cả hàng lên T3 là **Hỏi-1** cho Mạnh ở Cổng Phạm vi.
- **Làn ZCode (không sửa, yêu cầu `P3-1`):** vòng nạp của `chotot-daily.sh` (`node import-chotot` không kiểm
  mã) và của `apify-facebook-daily.sh` (`import-airbnb … || true` rồi state vẫn nhảy qua snapshot hỏng — đúng lỗ
  P1.5 đã vá cho `zalo-import-daily.sh`). `zalo-import-daily.sh` (`scripts/zalo-*.sh`, khoá `bao_ve`) — bản vá
  P1.5 trên nhánh `zcode/audit-p1-resilience` (ZC3).
- **Cảnh báo DB sập** = lớp L5b của `scripts/zalo-watchdog.sh` (ZC3, nhánh `zcode/audit-p1-resilience`, T3
  chờ Mạnh ký). Watchdog là làn ZCode và `t3_paths` → AU3 không dựng kênh cảnh báo thứ hai; vế «có một cảnh
  báo» của `bat_khi` do ZC3 giao.

## 4. Thiết kế

1. **Bộ chạy bước dùng chung** `scripts/lib/job-step.sh`, hàm `job_step <job> <nhãn> <lệnh…>`: chạy lệnh;
   mã ≠ 0 thì in MỘT dòng ghim ra stderr `JOB FAIL [<job>] bước <nhãn> mã <n>` và trả đúng mã đó. Dòng ghim
   là thứ log launchd và phép đo đọc.
2. **Đoạn transform của `chotot-daily.sh`, `apify-facebook-daily.sh`:** mỗi bước chạy qua `job_step`, hỏng thì
   ghi lại mã hỏng ĐẦU TIÊN rồi chạy tiếp bước sau; cuối tệp `exit` bằng mã đó. Luồng dữ liệu y như trước vòng
   (chỉ mã thoát đổi): `refresh-bait-gap` và `resolve-properties` là bước liên nguồn — dừng chuỗi khi
   `transform-chotot` hỏng bền sẽ làm tin của mọi nguồn khác ngừng thành «Một Căn Nhà» (gap-probe P0, sổ
   d-…-10). Không đặt `set -e` cả tệp (sẽ đổi hành vi đoạn nạp của ZCode).
3. **Không đổi** `airdna-daily.sh`, `finalize-hanoi.sh`, `weekly-*.sh`, `cloud-sync.sh`: đã thoát ≠ 0 khi DB tắt;
   phép đo giữ chúng khỏi thoái.

## 5. Phép đo (không tắt DB thật)

Tắt DB chung (:5433) làm gãy job đêm và phiên ZCode trên cùng DB (LUAT đợt: thử phá hoại phải báo giám sát).
Thay bằng hai lớp, cùng trong `scripts/job-exit.test.mjs` (chạy bởi `node --test scripts/*.test.mjs`):

- **Lớp tệp bọc (cây giả):** chép NGUYÊN tệp bọc thật vào cây tạm cùng đường tương đối; `node`/`docker` giả
  đặt đầu `PATH` (và `HOME` tạm để tệp bọc không chèn node thật lên trước) ghi lại lời gọi và thoát theo biến
  `FAIL_STEP` (bước hỏng in `Error: connect ECONNREFUSED`). Ma trận viết trước (§6). Chiều đỏ cùng cây: bản
  đột biến của chính tệp bọc (bỏ phần ghi mã hỏng của một bước) → ca báo đỏ với tên bước. Ca «mọi bước
  lành» đòi nhật ký lời gọi của `node` giả khớp ĐÚNG dãy bước viết trước (đối chứng dương cho các assert «bước
  sau được/không được gọi»).
- **Lớp bước thật:** chạy từng bước node làn Claude THẬT với env trắng (chỉ `PATH`, `HOME` tạm có `cloud.env`
  giả, `DATABASE_URL`/`PGHOST`/`PGPORT` trỏ một **cổng canh** do test mở: nhận kết nối, ghi lại, đóng ngay) và
  một **hộp cát** nạp trước bằng `node --import` chặn mọi kết nối TCP không tới cổng canh và mọi `fetch`. Đo
  QUAN HỆ: bước thoát ≠ 0 VÀ cổng canh thấy lần nối của bước đó VÀ hộp cát không phải chặn gì. Chiều đỏ:
  bản sao nuốt lỗi (`.catch` → thoát 0) → ca đỏ; bản sao viết cứng `localhost:5433` → hộp cát chặn, cổng
  canh không thấy, ca đỏ — và không chạm DB thật (đúng mẫu sự cố `push-ops-facts` 23/10).

## 6. Ma trận (viết trước khi code)

| Job | DB tắt hẳn (mọi bước DB hỏng) | Mọi bước lành | Một bước làn Claude hỏng |
|---|---|---|---|
| chotot-daily | ≠ 0 | 0 | `transform-chotot` · `refresh-bait-gap` · `resolve-properties`: ≠ 0, dòng ghim, bước sau VẪN chạy; hai bước hỏng → mã bước hỏng đầu |
| apify-facebook-daily | ≠ 0 | 0 | `transform-fb` · `refresh-bait-gap`: ≠ 0, dòng ghim, bước sau VẪN chạy |
| airdna-daily | ≠ 0 | 0 | `transform-airdna` · `dq-truthful-coverage`: ≠ 0, bước sau không chạy |
| collector tuần (`finalize-hanoi.sh`) | ≠ 0 | 0 | `reassign-areas` · `transform-airbnb` · `transform-zalo` · psql (docker): ≠ 0, bước sau không chạy |
| cloud-sync | ≠ 0 | 0 | ca `todo` «chập chờn: sync-cloud hỏng, push-ops-facts lành» — theo đáp án Hỏi-1 (`P3-3` hoặc vá ở vòng này) |

Bước thật trên cổng canh (10 + 1 todo): `transform-chotot`, `refresh-bait-gap`, `resolve-properties`, `transform-fb`,
`transform-airdna`, `dq-truthful-coverage`, `reassign-areas`, `transform-airbnb`, `transform-zalo`,
`sync-cloud`. `push-ops-facts` là ca `todo` của node:test (không đỏ suite, hiện trong đầu ra kèm mã `P3-3`):
nó không đọc `DATABASE_URL` nên KHÔNG được chạy (sẽ nối DB thật rồi đẩy lên cloud — lần dò 23/10 đã lỡ đẩy
một lượt số vận hành như nhịp 15′ thường lệ); hộp cát được thử hai chiều trên một bản sao viết cứng chuỗi kết nối.

## 7. Ngoài phạm vi

Cảnh báo DB sập (ZC3 L5b) · đoạn nạp của hai tệp `*-daily.sh` (ZCode, `P3-1`) · `zalo-import-daily.sh` (ZC3 P1.5)
· `cloud-sync.sh` khi DB sống + `push-ops-facts` viết cứng DB (`P3-3`, T3) · `backup.sh` (chưa cài; `BACKUP_*` là
câu audit Q của Mạnh; PASS giả thuộc AU5) · `smoke-daily.sh` (không dùng DB) · thử lại khi `ECONNREFUSED` · hiện
«last exit» của launchd lên `/ops` (AU5/AU6) · sửa plist (`pipeline/cron/**`, làn ZCode).

## Đặc tả UX

Không chạm UI — bỏ (sổ quyết định: «bỏ đặc-tả-UX»).
