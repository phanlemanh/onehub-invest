# Kế hoạch thi công — ON2 `lockdown-local-noi-that` (T3)

Hợp đồng: `_acceptance/lockdown-local-noi-that/contract.md` (duyệt 24/10, Hỏi-1 = A). Thiết kế:
`docs/superpowers/specs/2026-10-24-lockdown-local-noi-that-design.md`. TDD: mỗi task viết test đỏ trước, rồi mã, rồi xanh.
Phép đo chỉ đọc tệp trong thư mục tạm (`mkdtemp`); không gọi lệnh `openclaw` nào, không đụng `~/.openclaw`, không chạy
`push-ops-facts.mjs`.

## Hệ quả cần anh thấy trước khi duyệt

Trên cloud `getLockdownStatus` chạy cùng mã và không có tệp log nào. Hôm nay cloud hiện L4 «Hỏng», L1–L3 «Chưa kiểm
được», L4b «Ổn» (chính lỗi của hàng này). Sau hàng này L4b trên cloud thành «Chưa kiểm được», còn L1–L4 giữ như cũ.
Đây là cùng một sửa, không tách được nếu không thêm nhánh riêng cho cloud. Kế hoạch giữ hệ quả này (chiều nói thật), và
ON23 sẽ thay cả ô bằng số máy local đẩy lên. Nếu anh muốn cloud giữ y nguyên tới ON23, trả lời «sửa: chặn L4b trên cloud»;
khi đó Task 2 thêm nhánh `isCloud()`.

## Task 1 — `lastMeaningfulLine` hai bản + `tailLog` (AC-6, E6/E7)

1. Test đỏ `pipeline/scripts/last-log-line.test.mjs`: ma trận 5 mẫu viết trước × 2 bản = 10 assert giá trị (bản app nạp
   bằng `import()` tệp `.ts` — Node 24 tự bỏ kiểu, như `scripts/freshness-parity.test.mjs`); `tailLog` trên tệp tạm mẫu (1);
   tĩnh: `push-ops-facts.mjs` import `tailLog` từ `./lib/last-log-line.mjs`, không còn `async function tailFile` và
   `lines.at(-1)`; chiều đỏ: một bản lọc-rỗng (hàm chỉ lấy dòng cuối) chạy trên mẫu (1) ra dòng `(Use \`node --trace-`.
2. Viết `pipeline/lib/last-log-line.mjs` (`lastMeaningfulLine`, `tailLog` → `{ lastLogAt, lastLine }`, vắng →
   `{ lastLogAt: null, lastLine: null }`) và `app/src/lib/last-log-line.ts` (chỉ `lastMeaningfulLine`).
3. `push-ops-facts.mjs`: xoá `tailFile`, dùng `tailLog` cho mọi job trong `scheduler()`. Hàm cũ trả khoá `mtime` khi lỗi
   (lệch với `lastLogAt`) — `tailLog` trả đúng khoá `lastLogAt: null`.
4. `collections-queries.ts`: `tailFile` dùng `lastMeaningfulLine`.

## Task 2 — `getLockdownStatus(opts)` (AC-1…AC-4, E1–E4)

1. Test đỏ `app/tests/lockdown-local.test.tsx` (`process.env.TZ = "Asia/Ho_Chi_Minh"` dòng đầu, trước mọi import):
   - L4b: thư mục tạm vắng tệp → `ok null, agentTurnsToday null`; 0 dấu → `true/0`; 2 dấu → `false/2`; now 01:00 +07 với
     chỉ `openclaw-2026-10-24.log` (2 dấu) → `false/2`.
   - Chiều đỏ AC-1/AC-3: hai bản sao hàm cũ đặt TRONG tệp test (nhánh lỗi → 0; tên tệp `toISOString`) chạy trên cùng thư
     mục, assert ra `ok true` / `ok null` với tên ca nêu «L4b» / «ngày UTC».
   - Watchdog: 4 ca (vắng; ok 5′; không ok; ok 16′) × 3 cách gọi (truyền `root`; không `root` với `process.chdir(<tmp>/app)`;
     không `root` với cwd `<tmp>`) = 12 assert; `after()` khôi phục cwd.
2. Mã: `getLockdownStatus({ root?, agentLogDir?, now? } = {})`:
   - `root` mặc định suy từ cwd như `collections-queries.ts` (suy MỖI lần gọi, không ở cấp module, để chdir trong test có
     hiệu lực); `agentLogDir` mặc định `/tmp/openclaw`; `now` mặc định `new Date()`.
   - Watchdog: đọc `<root>/pipeline/logs/zalo-watchdog.log`; `fresh` = dòng cuối chứa ` ok ` và `now − Date.parse(25 ký tự
     đầu) ≤ 15′`. `fresh` → L1–L4 `true`; còn lại L4 `false`, L1–L3 `null`. `lastWatchdogAt` giữ như cũ (25 ký tự đầu).
   - L4b: tên tệp `openclaw-YYYY-MM-DD.log` dựng từ `getFullYear/getMonth/getDate` (giờ máy); `readFile` lỗi → `null`;
     được → đếm dòng chứa `auto-reply/agent-turn-timing`. Bỏ `grep` cho bước này.
   - Kiểu trả về `agentTurnsToday: number | null`.

## Task 3 — hiển thị `null` (AC-5, E5)

1. Test đỏ (cùng tệp): lấy đầu ra THẬT của `getLockdownStatus` trên thư mục tạm của ca vắng và ca 2 dấu, render
   `CollectionsTiles` + `LockdownGrid` bằng `renderToStaticMarkup`, gọi `issuesOf`; assert ba vế cho ca null và mục «Khẩn»
   cho ca 2 dấu.
2. Mã: `collections-tiles.tsx` — kiểu `number | null`; `basis` null → «Chưa kiểm được agent-turn hôm nay»; badge chỉ khi
   `> 0`. `attention-list.tsx` — kiểu `number | null`, điều kiện `(agentTurnsToday ?? 0) > 0`. `lockdown-grid.tsx` đã có
   trạng thái `unknown` — không đổi mã, chỉ đo.
3. Không thêm component, không đổi bố cục (ReUI: chỉ đổi chữ `basis` của StatCard có sẵn).

## Task 4 — kiểm

`cd app && npx tsc --noEmit && npm run lint && npm test` · `cd pipeline && npm test` · `/verify` app + pipeline. Chạy đột
biến cho chiều đỏ của AC-1, AC-3, AC-6 (chép hàm sang bên, sửa phá, chạy, khôi phục) — ghi kết quả vào bằng chứng S4.

## Tệp chạm

`pipeline/lib/last-log-line.mjs` (mới) · `pipeline/push-ops-facts.mjs` (T3) · `pipeline/scripts/last-log-line.test.mjs` (mới) ·
`app/src/lib/last-log-line.ts` (mới) · `app/src/lib/collections-queries.ts` · `app/src/lib/ops-queries.ts` ·
`app/src/components/ops/collections/{collections-tiles,attention-list}.tsx` · `app/tests/lockdown-local.test.tsx` (mới).
Không chạm tệp bảo vệ nào, không migration.
