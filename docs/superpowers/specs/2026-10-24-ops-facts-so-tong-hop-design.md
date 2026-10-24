# Máy local đẩy số tổng hợp Ops lên cloud (ON22 · `ops-facts-so-tong-hop`) — design

Hàng ON22 của `docs/plan/lo-trinh.json` (dãy P2 đợt `dot0-cam-mau`, chuỗi ADR-0014 AU13 → ON7 → NT2 → **ON22** → ON23,
ON3, ON4, ON5, AU12). Ngưỡng (`bat_khi`): «Một lượt cloud-sync ở local: ops_heartbeat có đủ năm khối, mỗi khối có
measured_at; độ tươi từng nguồn trên cloud trùng check-freshness chạy cùng lúc ở local; cấy tên nguồn thật vào
payload: lệnh dừng trước khi gửi, cloud không đổi; ngừng đẩy 46′: hàm đọc trả stale kèm mốc đo cuối».

Hàng này là **hàng nền**: chỉ dựng bên ghi (năm khối số) và một hàm đọc chung trên cloud. Phần hiện lên trang
(dòng «Số đo lúc HH:MM (giờ VN) từ máy local», Alert «Máy local không đẩy số từ …») thuộc ON3; lockdown trên trang
cloud thuộc ON23; AU12 đọc khối độ tươi.

## Hiện trạng

- `pipeline/push-ops-facts.mjs` chạy sau mỗi lượt `scripts/cloud-sync.sh` (15′), POST `/api/v1/ops/ingest`, upsert
  một dòng `ops_heartbeat` (payload jsonb). Đã có: funnel, health, jobs (nhãn S0x, dòng log cuối đã che), rotation,
  nhóm Zalo, luồng 7 ngày, tài khoản thu (`name: null`), `sourceRuns`. Từ NT2, cả bản tin qua bộ soát tầng A
  (`factsChan` → `pipeline/lib/tier-a-guard.mjs`) trước khi gửi.
- Thiếu (ADR-0014 §Quyết định 1): độ tươi/SLO từng nguồn, mã thoát job launchd, lockdown/watchdog từng lớp, bản ghi
  24h theo S0x, số thẻ chờ duyệt; không khối nào có mốc đo riêng; bên đọc trên cloud (`getLocalFacts`,
  `app/src/lib/collections-queries.ts`) không phân biệt «chưa có số» với «số cũ».
- Định nghĩa hiện có ở local:
  - độ tươi: `scripts/lib/freshness.mjs` ↔ `app/src/lib/freshness.ts` (parity AU6, `scripts/freshness-parity.test.mjs`);
  - bản ghi 24h: `getSourceFeedHealth().items24h` (`app/src/lib/ops-queries.ts`) — `airbnb_snapshots` 24h theo các
    luồng thu của từng mã;
  - lockdown: `getLockdownStatus()` (`app/src/lib/ops-queries.ts`, ON2) — log watchdog, log gateway trong ngày,
    `pgrep`, probe cổng; lớp không kiểm được là `null`, không bao giờ «Ổn».

## Cách làm

1. **Năm khối dưới một khoá `blocks`** trong payload (giữ nguyên mọi khoá cũ để `/ops/collections` không gãy):

   | Khối | Nội dung | Định nghĩa dùng |
   |---|---|---|
   | `freshness` | hàng `{code, city, last, ageHours, sloHours, status}` | `readFreshness` của `scripts/lib/freshness.mjs` — đúng hàm `check-freshness` gọi |
   | `jobs` | job launchd của kho: `{id, pid, lastExit, running, lastLogAt}`, `id` là nhãn đã che tên nguồn (S0x) | `launchctl list` (chỉ đọc), lọc nhãn khai trong `pipeline/cron/*.plist`; `lastLogAt` = mốc ghi cuối của tệp `StandardOutPath` plist khai |
   | `lockdown` | `{layers:[{layer, desc, ok}], lastWatchdogAt, agentTurnsToday}` | bản `.mjs` của `getLockdownStatus` (ON2), khớp bằng phép đo đối chiếu |
   | `records24h` | `{bySource:[{code, n}]}` | bản `.mjs` của `items24h` trong `getSourceFeedHealth`, khớp bằng phép đo đối chiếu |
   | `reviewQueue` | `{byType:[{type, n}], total}` — chỉ số đếm thẻ `pending` | `review_queue` gom theo `item_type` |

   Mỗi khối mang `measured_at` (ISO, lúc khối đó đo xong). Khối không đo được (bảng vắng, lệnh không chạy, quyền)
   → `{measured_at, error: "<lý do không chứa tên>"}` và các khối khác vẫn đi; không bao giờ thay bằng 0, mảng rỗng
   hay `ok: true`.

2. **Định nghĩa chung, hai bản khớp.** Bên ghi là Node thuần (`pipeline/`), không nạp được TypeScript của app. Theo
   tiền lệ AU6 (freshness), lockdown và bản ghi 24h có bản `.mjs` ở `scripts/lib/ops-local.mjs`; phép đo đối chiếu
   (`app/tests/ops-facts-so-tong-hop.test.tsx`) chạy bên ghi THẬT và hàm app trên CÙNG một lược đồ tạm và cây log
   tạm, đòi từng hàng bằng nhau. Không đổi hàm app trong vòng này (ON23 sẽ cho trang cloud đọc khối).

3. **Bộ soát tầng A giữ nguyên** (NT2): `factsChan` soát toàn bản tin, nên năm khối mới tự đi qua. Nhãn job launchd
   mang tên nguồn thật (vd nhãn của S02) được che bằng `maskSourceNames` như dòng log cuối; danh sách tên rỗng thì
   bản tin bị chặn như NT2.

4. **Hàm đọc chung trên cloud** `readOpsFacts()` (`app/src/lib/ops-facts.ts`): trả
   `{ state: "none" | "fresh" | "stale", facts, measuredAt, blocks }` — `blocks[name] = { state, measuredAt, data?,
   error? }`. Hằng `FACTS_STALE_MS = 45 * 60_000` sống ở đúng tệp này (ADR-0014: «hằng số một chỗ trong code, cùng
   chỗ với hàm đọc chung»). Tươi/cũ của cả bản tin theo `pushedAt`; của từng khối theo `measured_at` của khối. Không có
   dòng → `state: "none"`, `facts: null`. Hàm không đổi `getLocalFacts` (trang hiện tại đọc như cũ; ON3 chuyển trang
   sang hàm này).

5. **Route ingest không đổi**: payload vẫn là `ops_heartbeat.payload` jsonb (ADR-0014 §Hệ quả), không migration.

6. **Chế độ khô** `--kho` (từ NT2) in thêm một dòng tóm tắt năm khối (`đo được / không đo được`), không in giá trị.

## Không làm

- Không hiện số lên trang (ON3), không đổi trang lockdown cloud (ON23), không đổi `/api/v1/ops/coverage` (AU12).
- Không bảng riêng / migration cho số tổng hợp (ADR-0014: jsonb trừ khi Cổng Phạm vi chọn khác).
- Không đẩy nội dung thẻ chờ duyệt (tầng A) — chỉ số đếm theo loại.
- Không đổi hàm app `getLockdownStatus` / `getSourceFeedHealth`.
- Không gọi phương thức ghi lên OpenClaw hay route Zalo (an toàn Zalo); lockdown chỉ đọc log và probe GET như ON2.

## Hỏi-1 (chỉ người có)

Khối `jobs` gồm **mọi** job launchd khai trong `pipeline/cron/` (12 nhãn, cả job chạy liên tục như Kev gate, cổng
nhận tin của collector) hay **chỉ** job chạy theo lịch đêm? ADR-0014 viết «trạng thái job đêm», nhưng trang Thu thập
hiện cả job chạy liên tục. Máy khuyên: **mọi nhãn** — một tập, khớp trang hiện nay; ON3/ON23 cần thấy job chạy liên
tục bị chết. Lối khác: chỉ job có lịch — trang cloud không thấy job chạy liên tục chết.
