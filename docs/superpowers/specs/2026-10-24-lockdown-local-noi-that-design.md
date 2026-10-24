# Lockdown ở máy local nói thật (ON2 · `lockdown-local-noi-that`) — thiết kế

Hàng ON2 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, T3 vì chạm `pipeline/push-ops-facts.mjs`). Câu giao: «Lockdown
tính ở máy local không báo «Ổn» cho lớp không kiểm được (L4b khi grep log thất bại) và «Dòng log cuối» của job là dòng có
nghĩa, không phải cảnh báo Node». Căn cứ: `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-19, QD3; audit prod 24/10 OPS-3.
Phần hiện trên cloud là ON23 — không làm ở đây. An toàn Zalo: `.claude/rules/zalo-safety.md`, `docs/ops/runtime-map.md`.

## 1. Lỗi (đọc mã 24/10)

| Chỗ | Hiện tại | Hậu quả |
|---|---|---|
| L4b `getLockdownStatus` (`app/src/lib/ops-queries.ts`) | `grep -c` trên `/tmp/openclaw/openclaw-<ngày>.log`; mọi lỗi (tệp vắng, không đọc được) bị nuốt → `turns = 0` → `ok: true` | «Ổn» xanh khi KHÔNG kiểm gì — có thể che một sự cố agent-turn thật (sự cố 20/10) |
| Ngày của tệp L4b | `new Date().toISOString().slice(0,10)` (UTC) | gateway đặt tên theo ngày máy (watchdog: `date +%Y-%m-%d`); 0h–7h giờ VN tìm nhầm tệp hôm trước |
| Watchdog L1–L4 | `readFile("pipeline/logs/zalo-watchdog.log")` tương đối cwd — Next chạy ở `app/` nên không thấy tệp → L4 `false` («Hỏng»), L1–L3 null | «Hỏng» giả ở local; tệp vắng phải là «Chưa kiểm được», không phải «Hỏng» |
| «Dòng log cuối» (`tailFile` trong `pipeline/push-ops-facts.mjs` và `app/src/lib/collections-queries.ts`) | dòng không rỗng cuối cùng | job Sync hiện `(Use \`node --trace-deprecation ...\` …)` thay dòng `sync xong …` |

## 2. Thiết kế

1. **L4b đọc tệp trực tiếp, phân biệt vắng với 0**: đọc `<agentLogDir>/openclaw-<ngày máy>.log` (mặc định `/tmp/openclaw`)
   bằng `readFile`, đếm dòng chứa `auto-reply/agent-turn-timing`. Đọc được → `turns` = số đếm, `ok = turns === 0`; không đọc
   được → `turns = null`, `ok = null` («Chưa kiểm được»). Không gọi tiến trình con cho bước này. Tên tệp theo ngày máy.
2. **Watchdog đọc theo gốc kho** (cùng cách `collections-queries.ts` suy `ROOT`: cwd kết thúc `/app` → thư mục cha). Watchdog
   ghi một dòng `<ISO> ok — …` mỗi 5′ (launchd `StartInterval` 300) và không ghi `ok` khi nó phát hiện sự cố. Theo Hỏi-1
   (khuyến nghị lối A): dòng cuối có ` ok ` VÀ mốc ISO đầu dòng cách `now` ≤ 15′ → L1–L4 `true`; mọi ca khác (tệp vắng, dòng
   cuối không ok, `ok` cũ hơn 15′) → L4 `false` («Hỏng» — watchdog không canh), L1–L3 `null` («Chưa kiểm được»). Sau khi sửa
   đường dẫn, tệp vắng ở máy local nghĩa là watchdog không chạy thật — giữ báo động đỏ.
3. `getLockdownStatus(opts)` nhận `{ root, agentLogDir, now }` (mặc định như trên) để phép đo trỏ thư mục tạm.
   `agentTurnsToday: number | null`; ô Lockdown và «Cần chú ý» xử lý `null` («Chưa kiểm được agent-turn hôm nay», không
   mục «Khẩn»). Bước dò hạ tầng (`pgrep`, probe cổng) giữ nguyên.
4. **Dòng log có nghĩa**: hàm `lastMeaningfulLine(text)` bỏ dòng cảnh báo Node (`(node:<pid>) …Warning: …`,
   `(Use \`node --trace-…` ) rồi lấy dòng không rỗng cuối; chỉ còn cảnh báo → `null`. Hai bản: `pipeline/lib/last-log-line.mjs`
   (dùng trong `push-ops-facts.mjs` — tệp này chạy `main()` khi import nên phép đo không được import nó) và
   `app/src/lib/last-log-line.ts` (dùng trong `collections-queries.ts`); một test đo cả hai trên cùng ma trận. Bản pipeline
   có thêm `tailLog(file)` → `{ lastLogAt, lastLine }` thay hàm `tailFile` riêng của `push-ops-facts.mjs` (để phép đo gọi
   được đường đọc thật mà không import tệp chạy `main()`).

## 3. Phép đo

- `pipeline/scripts/last-log-line.test.mjs`: ma trận viết trước (mẫu `cloud-sync.log` thật 24/10 · chỉ cảnh báo · dòng thường ·
  `[DEP0040]` · rỗng) × hai bản; chiều đỏ: hàm không lọc → ra dòng cảnh báo.
- `app/tests/lockdown-local.test.tsx` (`TZ=Asia/Ho_Chi_Minh` ghim trước mọi import): thư mục tạm cho log watchdog + log
  openclaw; ma trận L4b {tệp vắng, 0 dấu, 2 dấu, ngày giờ máy ≠ ngày UTC}; watchdog {vắng, ok mới, không ok, ok cũ} × {truyền
  root, cwd `<tmp>/app`, cwd `<tmp>`}; render ô Lockdown + lưới + «Cần chú ý» từ đầu ra THẬT của hàm; `readSchedulerStatus`
  nhánh local trên gốc tạm. Chỉ đọc tệp tạm, không gọi lệnh `openclaw` nào (an toàn Zalo).

## 4. Ngoài phạm vi

Hiện lockdown trên cloud (ON23) · dò hạ tầng `pgrep`/cổng · watchdog đọc `gateway.log` (giữ nguyên script).

## Đặc tả UX

Không đổi cấu trúc — chỉ chữ của ô Lockdown khi chưa kiểm được (sổ: «bỏ đặc-tả-UX»).
