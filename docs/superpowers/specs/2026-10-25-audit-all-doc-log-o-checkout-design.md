# Đọc log job ở checkout chính khi chạy từ worktree (ON16 · `audit-all-doc-log-o-checkout`) — thiết kế

Hàng ON16 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `giam-sat`, hạng T2). Câu giao: «audit-all.sh và
trang Ops ở máy local đọc log job ở checkout chính dù chạy từ worktree, không báo LIMITED hay «Hỏng» giả vì thư mục log
rỗng». Ngưỡng (`bat_khi`): «Chạy audit-all từ một worktree: các mục log đọc đúng tệp ở checkout chính, kết quả trùng lần
chạy từ checkout chính». Gốc YC5 — AU5 Ngoài-1/3 (trùng audit L12). Điều phối duyệt Cổng Đáng `build` (P3-63).

## 1. Hiện trạng (main 9e3bb9f)

Job launchd chạy từ checkout chính `~/dev/onehub-invest` (qua symlink `~/dev/one-invest`) và ghi log vào
`<checkout chính>/pipeline/logs/`. Worktree (`.claude/worktrees/*`, `~/dev/onehub-invest-zcode`) có `pipeline/logs/`
rỗng hoặc không có (thư mục bị gitignore). Ba chỗ suy gốc kho từ cây ĐANG chạy nên đọc nhầm thư mục rỗng:

| Chỗ đọc | Suy gốc bằng | Đọc log | Triệu chứng khi chạy từ worktree |
|---|---|---|---|
| `scripts/audit-all.sh` | `ROOT` = thư mục cha của script | `airdna-daily.log` (mục A1) | «AirDNA nightly log trống» → LIMITED giả |
| `app/src/lib/ops-queries.ts` `getLockdownStatus` | `cwd` (bỏ `/app`) | `zalo-watchdog.log` | lớp 1–4 lockdown «Chưa kiểm được»/«Hỏng» giả trên `/ops/collections` |
| `app/src/lib/collections-queries.ts` `readSchedulerStatus` | hằng `ROOT` từ `cwd` lúc nạp | `airdna-daily.log`, `launchd-smoke.log`, `launchd-collector-api.log`, `weekly-*.log` | lưới «Máy móc» không có giờ chạy cuối, không dòng log |

Ma trận viết trước — mọi đường `audit-all.sh` đọc tương đối với `ROOT` (`grep '$ROOT'`, main 9e3bb9f):

| Dòng | Đường | Loại |
|---|---|---|
| 43 | `$ROOT/pipeline/logs/airdna-daily.log` (mục A1) | trạng thái chạy — ở checkout chính |
| 168 | `pipeline/logs/launchd-backup.log` | chỉ là chữ trong thông điệp, không đọc |

Mọi đường đọc khác của audit-all là `$HOME/…`, `~/.oneinvest/…`, docker, curl, launchctl — không phụ thuộc cây.

`scripts/lib/ops-local.mjs` `readLockdown` nhận `root` từ bên gọi (`pipeline/push-ops-facts.mjs`, chạy bằng launchd ở
checkout chính) — không thuộc câu giao, ngoài vòng.

## 2. Thiết kế

1. **Gốc log = checkout chính của kho.** Hỏi git: `git -C <cây> rev-parse --path-format=absolute --git-common-dir` →
   thư mục git chung `<X>/.git`; gốc log là `<X>` khi tên thư mục là `.git` và `<X>` tồn tại. Mọi ca khác — git lỗi (cây
   không phải kho git, `.git` hỏng, checkout chính đã mất), thư mục git chung không tên `.git` (kho trần) — gốc log là
   chính cây đang chạy (giữ hành vi cũ, không lỗi). Ở checkout chính, thư mục git chung là `<cây>/.git` nên gốc log trùng
   cây. Hỏi git thay vì tự đọc tệp `.git`: git hiểu mọi khuôn worktree, kể cả đường tương đối (`worktree.useRelativePaths`).
   Phía app nhớ kết quả theo thư mục làm việc trong tiến trình (một lần gọi git mỗi tiến trình).
   **Hỏi-1 — khi không tìm được checkout chính, người đọc thấy gì?** Khuyến nghị (a): dòng LIMITED của mục log ghi đường
   đã đọc («… trống — đọc <đường>») — không thêm dòng, người thấy ngay audit đọc ở đâu. Lối khác: (b) in thêm một dòng
   cảnh báo riêng khi rơi về cây đang chạy — rõ hơn nhưng thêm dòng chỉ ở ca lỗi; (c) im lặng như cũ — lỗi giả quay lại
   không ai biết vì sao.
2. **Chỉ log đổi gốc.** Script, mã, cấu hình vẫn của cây đang chạy — chỉ đường `pipeline/logs/*` đi qua gốc log.
3. **Bash**: `audit-all.sh` đặt `LOG_ROOT` ngay sau `ROOT` theo luật 1; mục A1 đọc `$LOG_ROOT/pipeline/logs/…`, dòng
   LIMITED theo Hỏi-1. Dòng PASS không đổi chữ, nên đầu ra từ worktree trùng đầu ra ở checkout chính.
4. **TS**: tệp mới `app/src/lib/log-root.ts` — `treeRoot(cwd)` (bỏ đuôi `/app`, cách suy cũ) và `logRoot(cwd)` (luật 1).
   `getLockdownStatus` mặc định `root = logRoot()`; `readSchedulerStatus` tính thư mục log khi GỌI (`logsDir()`), không
   còn hằng lúc nạp mô-đun. Ngoài `log-root.ts`, ba tệp đọc log không còn tự dựng đường `pipeline/logs` (luật tĩnh, AC-5).

## 3. Phép đo

1. **audit-all trong hộp** (`scripts/audit-all.test.mjs`, khuôn AU5: bản giả docker/curl/launchctl/security, PATH tối
   thiểu cộng thư mục chứa `git` thật): dựng «checkout chính» tạm bằng `git init` + một commit chứa `scripts/audit-all.sh`,
   ghi `pipeline/logs/airdna-daily.log` (gitignore), rồi «worktree» tạm bằng `git worktree add` — tệp `.git` do git viết,
   không viết tay. Chạy từ worktree → dòng A1 PASS «có activity»; toàn bộ đầu ra trùng lần chạy ở checkout chính tạm.
   Chiều đỏ: script main 9e3bb9f từ worktree → LIMITED «trống». Ca biên: checkout chính, cây không git, `.git` hỏng,
   worktree mà checkout chính đã bị dời → đọc log của chính cây, dòng LIMITED ghi đường đã đọc (Hỏi-1).
2. **Trang Ops local** (`app/tests/doc-log-o-checkout.test.tsx`): cùng hai cây tạm dựng bằng git thật,
   `process.chdir(<worktree>/app)`, gọi `getLockdownStatus` (log watchdog tươi ở checkout chính) và `readSchedulerStatus`
   với TỪNG loại log của bảng §1 (`airdna-daily.log`, `launchd-smoke.log`, `launchd-collector-api.log`, một
   `weekly-*.log`) chỉ đặt ở checkout chính. Lớp 1–4 «ok», `lastWatchdogAt` là dòng cuối của log chính; mỗi job có giờ =
   mtime tệp tương ứng. Đối chứng: bản sao mã main 9e3bb9f (`git show`) trên cùng cây → lớp 1–4 không ok, các job không
   giờ. Luật tĩnh: ba tệp đọc log không chứa chuỗi `pipeline/logs` ngoài `log-root.ts`.
3. **Lệnh thật** (`scripts/smoke-doc-log-o-checkout.mjs`): chạy đồng thời `scripts/audit-all.sh` của worktree này và
   của checkout chính thật (HOME tạm cho cả hai lượt — không token cloud, không CLI OpenClaw, không keychain), so TOÀN BỘ
   đầu ra, in từng dòng khác. Tiền điều kiện ghi ra: worktree không có `pipeline/logs/airdna-daily.log` của riêng nó.
   Chiều đỏ: bản sao script main đặt ngoài checkout chính → dòng A1 khác.
4. **Trang thật**: app chạy từ worktree (DB local, phiên admin tạm), `/ops/collections` 1280px — «Bộ canh chạy cuối»
   khớp một trong hai dòng cuối log watchdog ở checkout chính; nhãn lớp 1–4 bằng trạng thái suy từ dòng đó («Ổn» khi dòng
   có ` ok ` và cũ ≤ 15 phút, ngược lại không «Ổn»); job S02 «Chạy cuối» khớp mtime `airdna-daily.log` ở checkout chính.
   Quy đổi giờ: múi Asia/Ho_Chi_Minh, `YYYY-MM-DD HH:mm (GMT+7)`, cắt tới phút. Ảnh chụp cho người ký.

## 4. Không làm

- `scripts/lib/ops-local.mjs` / `pipeline/push-ops-facts.mjs` (bên ghi bản tin máy chủ) — chạy bằng launchd ở checkout
  chính, ngoài câu giao.
- Script ghi log (`zalo-watchdog.sh`, `*-daily.sh`) — làn ZCode, và chúng chạy ở checkout chính.
- Mốc lần thu của `check-freshness` (ON17, chờ ZC7).
