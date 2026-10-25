---
schema_version: 1
feature: audit-all.sh và trang Ops ở máy local đọc log job ở checkout chính dù chạy từ worktree, không báo LIMITED hay «Hỏng» giả vì thư mục log rỗng
slug: audit-all-doc-log-o-checkout
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script, ui]
status: verified
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-audit-all-doc-log-o-checkout-design.md
lo_trinh_ma: ON16
---

# Acceptance Contract: audit-all-doc-log-o-checkout

## Context

Hàng ON16 (YC5, AU5 Ngoài-1/3, audit L12). Job launchd ghi log vào `pipeline/logs/` của checkout chính; worktree có thư
mục log rỗng. «Gốc log» = thư mục cha của thư mục git chung (`git rev-parse --git-common-dir`) khi thư mục đó tên `.git`
và tồn tại; git lỗi hay kho trần → chính cây đang chạy. «Hai cây tạm» = một checkout chính tạm dựng bằng `git init` (log
có nội dung, gitignore) và một worktree tạm dựng bằng `git worktree add` (`pipeline/logs` rỗng) — tệp `.git` do git viết.
Ma trận đường đọc của audit-all và định nghĩa ở design doc §1–§2.

## Criteria

- AC-1: Given hai cây tạm, When chạy `scripts/audit-all.sh` của worktree tạm, Then mục «AirDNA nightly log» PASS «có
  activity» (đọc `airdna-daily.log` của checkout chính tạm); chiều đỏ: script của main 9e3bb9f trên cùng worktree →
  LIMITED «trống».
- AC-2: Given hai cây tạm và cùng bản giả lệnh, When chạy script từ worktree tạm và từ checkout chính tạm, Then toàn bộ
  dòng đầu ra trùng nhau (in số dòng đã so); chiều đỏ: script main 9e3bb9f từ worktree → khác đúng ở mục A1.
- AC-3: Given cây không tìm được checkout chính — thư mục không phải kho git, tệp `.git` hỏng, worktree mà checkout chính
  đã bị dời — và checkout chính tạm chạy chính nó, When chạy audit-all, Then nó đọc log của chính cây, chạy hết và in tổng
  kết; khi mục log trống, dòng LIMITED hiện theo Hỏi-1 (khuyến nghị: ghi đường đã đọc); chiều đỏ: bản đột biến để gốc log
  rỗng khi git lỗi → báo đường đọc sai.
- AC-4: Given hai cây tạm, log watchdog tươi (dòng `ok` trong 15 phút) chỉ ở checkout chính tạm, When gọi
  `getLockdownStatus` với thư mục làm việc là `<worktree>/app`, Then lớp 1–4 `ok: true` và `lastWatchdogAt` bằng mốc dòng
  cuối của log chính; chiều đỏ: bản sao `ops-queries.ts` main 9e3bb9f → lớp 4 không ok, `lastWatchdogAt` null.
- AC-5: Given hai cây tạm, mỗi loại log của lưới Máy móc (`airdna-daily.log`, `launchd-smoke.log`,
  `launchd-collector-api.log`, một `weekly-*.log`) chỉ ở checkout chính tạm, When gọi `readSchedulerStatus` với thư mục làm
  việc là `<worktree>/app`, Then mỗi job tương ứng có `lastLogAt` bằng mtime tệp của nó; checkout chính và cây không git
  đọc log của chính cây; và ngoài `log-root.ts`, `ops-queries.ts` · `collections-queries.ts` không chứa chuỗi
  `pipeline/logs`; chiều đỏ: bản sao `collections-queries.ts` main 9e3bb9f → mỗi job không giờ; bản sao có chuỗi
  `pipeline/logs` → luật tĩnh gọi tên tệp.
- AC-6: Given worktree này (không có `pipeline/logs/airdna-daily.log` riêng — ghi ra) và checkout chính thật
  `~/dev/onehub-invest`, cùng HOME tạm, When chạy đồng thời `scripts/audit-all.sh` của mỗi bên, Then toàn bộ đầu ra trùng
  (in từng dòng khác nếu có); chiều đỏ: bản sao script main đặt ngoài checkout chính → dòng A1 khác, phép so báo.
- AC-7: Given app chạy thật từ worktree (DB local, phiên admin tạm), Chromium 1280×800, When mở `/ops/collections`, Then
  «Bộ canh chạy cuối» khớp một trong hai dòng cuối của `zalo-watchdog.log` ở checkout chính, nhãn lớp 1–4 bằng trạng thái
  suy từ dòng đó («Ổn» khi có ` ok ` và cũ ≤ 15 phút), và job S02 «Chạy cuối» khớp mtime `airdna-daily.log` ở checkout
  chính — giờ quy đổi theo múi Asia/Ho_Chi_Minh, dạng `YYYY-MM-DD HH:mm (GMT+7)`; ảnh chụp lưu cho người ký; chiều đỏ: kỳ
  vọng tính từ thư mục log của worktree → phép so báo lệch.

## Coverage

Trục: {chỗ đọc: audit-all A1, lockdown watchdog, lưới Máy móc (4 loại log)} × {cây: worktree, checkout chính, không git,
`.git` hỏng, checkout chính đã dời} × {đo: hộp cây tạm git thật, lệnh/trang thật}. AC-1/AC-2 audit trong hộp; AC-3 ca
biên; AC-4 lockdown; AC-5 lưới Máy móc từng loại log + luật tĩnh; AC-6 lệnh thật toàn bộ đầu ra; AC-7 trang thật.

## Đường đo

- «các mục log đọc đúng tệp ở checkout chính» — AC-1 (hộp), AC-6 (lệnh thật).
- «kết quả trùng lần chạy từ checkout chính» — AC-2 (hộp, toàn bộ đầu ra), AC-6 (lệnh thật, toàn bộ đầu ra).
- «trang Ops không báo «Hỏng» giả» — AC-4, AC-7 (nhãn lớp 1–4 trên trang thật).

## Out of scope

- `scripts/lib/ops-local.mjs` / `pipeline/push-ops-facts.mjs` (bên ghi bản tin máy chủ, chạy bằng launchd ở checkout chính).
- Script ghi log (`zalo-watchdog.sh`, `*-daily.sh`) — làn ZCode.
- Mốc lần thu của `check-freshness` (ON17).

## Notes

- Hỏi git thay vì tự đọc tệp `.git`: git hiểu mọi khuôn worktree, kể cả đường tương đối; phía app nhớ kết quả trong tiến trình.
