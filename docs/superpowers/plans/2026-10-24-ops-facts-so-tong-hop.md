# Kế hoạch — ops-facts-so-tong-hop (ON22, T3)

Hợp đồng: `_acceptance/ops-facts-so-tong-hop/contract.md` (Cổng Phạm vi duyệt 24/10; Hỏi-1 = A — mọi job trong
`pipeline/cron`). Design: `docs/superpowers/specs/2026-10-24-ops-facts-so-tong-hop-design.md`. Năm task, tuần tự
(cùng chạm `push-ops-facts.mjs` hoặc phụ thuộc thư viện của task 1).

| Người vận hành thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| (chưa thấy gì) Máy thu có sẵn cách đo khoá Zalo, bản ghi 24h, thẻ chờ, job chạy nền — cùng con số trang local | `scripts/lib/ops-local.mjs` | AC-3 (bản ghi 24h), AC-4 (thẻ chờ), AC-5 (khoá Zalo), AC-6 (job) |
| Bản tin lên cloud có năm nhóm số, mỗi nhóm có giờ đo; nhóm đo không được ghi lỗi | `pipeline/push-ops-facts.mjs` | AC-1, AC-2, AC-7, AC-8, AC-10 |
| Cloud có một chỗ đọc chung biết số chưa có / tươi / cũ quá 45′ | `app/src/lib/ops-facts.ts` | AC-9 (đọc trên cloud) |
| Phép đo hai chiều cho mọi tiêu chí | `pipeline/scripts/ops-facts-so-tong-hop.test.mjs`, `app/tests/ops-facts-so-tong-hop.test.tsx`, `pipeline/scripts/capture-ops-facts.mjs` | AC-1…AC-10 |
| Người vận hành biết đọc năm nhóm số và chữ lỗi | `docs/ops/runtime-map.md`, ROADMAP | (sổ vận hành) |

## Task 1 — thư viện đo ở máy local

- Files: `scripts/lib/ops-local.mjs` — bốn hàm nhận phụ thuộc qua tham số (client pg, thư mục, lệnh), không tự kết nối:
  - `readRecords24h(client)` → `[{code, n}]` — bản `.mjs` của `items24h` trong `getSourceFeedHealth`
    (`app/src/lib/ops-queries.ts`): cùng câu SQL `airbnb_snapshots` 24 giờ, cùng bảng luồng thu theo mã; bảng vắng → ném.
  - `readLockdown({ root, agentLogDir, now, probe, pgrep })` → `{layers, lastWatchdogAt, agentTurnsToday}` — bản `.mjs`
    của `getLockdownStatus` (ON2): cùng `WATCHDOG_FRESH_MS = 15′`, cùng tên tệp log theo ngày giờ máy, cùng bảy lớp; probe
    và `pgrep` tiêm vào để đo (GET, không phương thức ghi — an toàn Zalo).
  - `readReviewQueue(client)` → `{byType:[{type, n}], total}` — `review_queue` `status = 'pending'` gom theo `item_type`;
    bảng vắng → ném.
  - `readLaunchdJobs({ cronDir, run, names, now })` → `[{id, pid, lastExit, running, lastLogAt}]` — nhãn từ
    `pipeline/cron/*.plist` (Label + StandardOutPath), `launchctl list` (chỉ đọc) qua `run`, nhãn che bằng
    `maskSourceNames`; `launchctl` không chạy được → ném.
- Verify: `cd pipeline && npm test` (task 4 mới có ca); ở task này `node --check scripts/lib/ops-local.mjs`.
- `independent: false` (task 2, 4 dùng).

## Task 2 — bên ghi đẩy năm khối

- Files: `pipeline/push-ops-facts.mjs` — dựng `blocks` sau payload cũ (giữ mọi khoá cũ):
  `freshness` (`readFreshness` của `scripts/lib/freshness.mjs`), `jobs`, `lockdown`, `records24h`, `reviewQueue`; mỗi khối
  bọc `measure(name, fn)` → `{measured_at, ...data}` hoặc `{measured_at, error}` (thông điệp lỗi qua `maskSourceNames`,
  không giá trị). Tôn trọng env thử: `ONEINVEST_CRON_DIR`, `OPENCLAW_LOG_DIR`, `LAUNCHCTL` (đường lệnh), `OPS_FACTS_NOW`
  (mốc giờ cho phép đo), `ONEINVEST_ROOT` (đã có). `--kho` in thêm một dòng `khối: freshness đo được · jobs lỗi · …`.
  Bộ soát `factsChan` (NT2) không đổi — tự phủ năm khối.
- Verify: `cd pipeline && npm test` (ca ON7/NT2 cũ vẫn xanh); `node pipeline/push-ops-facts.mjs --kho` trên máy thật.
- `independent: false`.

## Task 3 — hàm đọc chung trên cloud

- Files: `app/src/lib/ops-facts.ts` — `FACTS_STALE_MS = 45 * 60_000`; `readOpsFacts({ now } = {})` đọc
  `ops_heartbeat` (`id = 'primary'`) → `{state, facts, measuredAt, blocks}`; khối: `{state, measuredAt, data?, error?}`;
  không có dòng → `{state: "none", facts: null, measuredAt: null, blocks: {}}`. Không đổi `getLocalFacts`.
- Verify: `cd app && npx tsc --noEmit && npm run lint`.
- `independent: false` (task 4 đo).

## Task 4 — phép đo

- Files:
  - `pipeline/scripts/capture-ops-facts.mjs`: thêm tham số lược đồ tạm (`schema` → `DATABASE_URL` với `search_path`) và
    PATH giả cho `launchctl`.
  - `pipeline/scripts/ops-facts-so-tong-hop.test.mjs`: AC-1 (năm khối, measured_at trong khoảng, khoá cũ; đỏ: bỏ
    measured_at), AC-2 (freshness = `runCheck --json` cùng `now`; đỏ: đổi SLO), AC-4 (đếm pending theo loại, ba khoá;
    đỏ: kèm tiêu đề), AC-6 (bản chụp launchctl 23/10: mỗi nhãn của `pipeline/cron` có mặt, lastExit, pid, lastLogAt, nhãn
    che S0x; launchctl vắng → error), AC-7 (bốn ca viết trước; đỏ: lỗi thành 0), AC-8 (ma trận cấy tên năm khối → chặn,
    0 POST, nêu `blocks.<khối>`), AC-10 (máy thật, `--kho`, không nhánh skip).
  - `app/tests/ops-facts-so-tong-hop.test.tsx`: AC-3 (records24h = `getSourceFeedHealth().items24h`; đỏ: đếm ngoài 24h),
    AC-5 (bảy ca cây log viết trước, so `getLockdownStatus`; đỏ: false→null, thiếu log→true), AC-9 (bản tin thật qua handler
    `POST /api/v1/ops/ingest` thật vào `ops_heartbeat` lược đồ tạm → `readOpsFacts` năm trạng thái; đỏ: đổi tên
    `measured_at`, ngưỡng 60′).
- Verify: `cd pipeline && npm test`; `cd app && npm test`; phá thử từng ca (luật đo hai chiều).
- `independent: false`.

## Task 5 — tài liệu

- Files: `docs/ops/runtime-map.md` (mục «Số tổng hợp Ops lên cloud»: năm khối, chữ lỗi, `--kho`, hàm đọc + 45′),
  `docs/ROADMAP.md` (một dòng §2).
- Verify: đọc lại; `node scripts/check-portal-compliance.mjs`.
- `independent: true`, làm cuối.
