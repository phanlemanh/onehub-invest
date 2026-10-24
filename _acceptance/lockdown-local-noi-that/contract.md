---
schema_version: 1
feature: Lockdown tính ở máy local không báo «Ổn» cho lớp không kiểm được và «Dòng log cuối» của job là dòng có nghĩa
slug: lockdown-local-noi-that
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [ui, cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-24
design_doc: docs/superpowers/specs/2026-10-24-lockdown-local-noi-that-design.md
lo_trinh_ma: ON2
---

# Acceptance Contract: lockdown-local-noi-that

## Context

Căn cứ: `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-19, QD3; audit prod 24/10 OPS-3; Hỏi-1 (Cổng 1). Hàng ON2 (T3). L4b «Agent-turn hôm
nay = 0» hiện «Ổn» khi grep log thất bại (lỗi bị nuốt → 0 → xanh) — có thể che sự cố agent-turn thật; job Sync hiện «Dòng
log cuối» là cảnh báo Node. Phần cloud là ON23. An toàn Zalo: phép đo chỉ đọc tệp tạm, không gọi lệnh `openclaw` nào.

## Criteria

- AC-1: Given thư mục log openclaw tạm KHÔNG có tệp của ngày hôm nay, When gọi `getLockdownStatus({ agentLogDir, root, now })`, Then lớp L4b có `ok: null` («Chưa kiểm được») và `agentTurnsToday: null` — không phải `true`; chiều đỏ: bản sao giữ nhánh cũ (lỗi đọc → 0) ra `ok: true` và ca đỏ nêu «L4b».
- AC-2: Given tệp log ngày hôm nay có 0 dòng `auto-reply/agent-turn-timing` (đối chứng) và có 2 dòng, When gọi hàm, Then lần lượt `ok: true, agentTurnsToday: 0` và `ok: false, agentTurnsToday: 2`.
- AC-3: Given `TZ=Asia/Ho_Chi_Minh`, `now` = 2026-10-24 01:00 giờ máy (2026-10-23 18:00 UTC) và chỉ có tệp `openclaw-2026-10-24.log` chứa 2 dòng `auto-reply/agent-turn-timing`, When gọi hàm, Then L4b `ok: false`, `agentTurnsToday: 2` (đọc đúng tệp ngày giờ máy); chiều đỏ: bản sao đặt tên tệp theo ngày UTC (`toISOString`) trên cùng thư mục ra `ok: null` và ca đỏ nêu «ngày UTC».
- AC-4: Given gốc kho tạm với `pipeline/logs/zalo-watchdog.log` và `now` cố định — (a) tệp vắng, (b) dòng cuối chứa ` ok ` ghi cách `now` 5 phút, (c) dòng cuối không chứa ` ok `, (d) dòng cuối chứa ` ok ` nhưng cách `now` hơn 15 phút (quá 3 chu kỳ 5′ của watchdog) — When gọi hàm, Then (a) L4 `false` («Hỏng» — watchdog không canh), L1–L3 `null`; (b) L1–L4 đều `true`; (c) L4 `false`, L1–L3 `null`; (d) L4 `false`, L1–L3 `null`. Cùng ma trận chạy hai cách: truyền `root`, và KHÔNG truyền `root` với cwd = `<gốc tạm>/app` (đối chứng: cwd = `<gốc tạm>`) — cả hai cách ra cùng kết quả. (Theo Hỏi-1 lối A ở Cổng 1.)
- AC-5: Given đầu ra THẬT của `getLockdownStatus` trên thư mục tạm của AC-1 (tệp log vắng → `agentTurnsToday: null`, L4b `ok: null`) và của AC-2 (2 dấu), When đưa thẳng vào ô «Lockdown», lưới lớp lockdown và «Cần chú ý» của `/ops/collections`, Then ca null: ô ghi «Chưa kiểm được agent-turn hôm nay» (không «Không có agent-turn hôm nay»), 0 mục «Khẩn» agent-turn, L4b nằm trong nhóm «Chưa kiểm được» của lưới (không «Ổn», không «Hỏng»); ca 2 dấu: có mục «Khẩn» «Agent-turn hôm nay».
- AC-6: Given ma trận 5 mẫu dòng log viết trước — (1) mẫu `cloud-sync.log` thật 24/10 kết thúc bằng `(node:<pid>) DeprecationWarning: Calling client.query() …` + `(Use \`node --trace-deprecation ...\` …)`, (2) chỉ có hai dòng cảnh báo đó, (3) một dòng thường, (4) dòng thường rồi cảnh báo dạng `(node:<pid>) [DEP0040] DeprecationWarning: …`, (5) tệp rỗng — When gọi `lastMeaningfulLine` của `pipeline/lib/last-log-line.mjs` và của `app/src/lib/last-log-line.ts`, Then đủ 10 ô (5 mẫu × 2 bản) bằng giá trị viết trước: (1) dòng `sync xong …`, (2) `null`, (3) chính dòng đó, (4) dòng thường, (5) `null`; và hai đường đọc thật dùng nó: `tailLog` của `pipeline/lib/last-log-line.mjs` (hàm `push-ops-facts.mjs` dùng cho mọi job của `scheduler()`) đọc tệp tạm mẫu (1) ra `lastLine` = dòng `sync xong …`, `readSchedulerStatus()` của app (nhánh local, cwd ở gốc tạm) ra cùng dòng cho job đọc tệp mẫu; `push-ops-facts.mjs` không còn hàm đọc dòng cuối nào khác; chiều đỏ: bản không lọc ra dòng `(Use \`node --trace-…`.

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Ma trận: L4b {tệp vắng (AC-1), 0 dấu, 2 dấu (AC-2), ngày máy ≠
ngày UTC (AC-3)} · watchdog {vắng, ok mới, không ok, ok cũ > 15′} × {truyền root, cwd `app/`, cwd gốc} (AC-4) · hiển thị null (AC-5) · dòng log {mẫu thật, chỉ cảnh
báo, thường, [DEP], rỗng} × hai bản (AC-6).

## Out of scope

- Hiện lockdown trên cloud (ON23) và facts lockdown đẩy lên cloud.
- Dò hạ tầng (`pgrep openclaw`, probe :8009/:9210) và nội dung `scripts/zalo-watchdog.sh`.

## Notes

- Phép đo chỉ đọc tệp trong thư mục tạm; không gọi lệnh `openclaw` nào, không đụng `~/.openclaw` (zalo-safety).
