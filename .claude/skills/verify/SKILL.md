---
name: verify
description: Kiểm các module onehub-invest vừa đổi trước khi commit hoặc báo xong — typecheck, test, build theo từng module (app, collector, pipeline, data-api, agent). Dùng khi user nói "verify", "kiểm lại", "chạy test", hoặc trước khi commit một thay đổi code.
argument-hint: "[all | app | collector | pipeline | data-api | agent]"
allowed-tools: Bash(git *) Bash(npx tsc *) Bash(npm *) Bash(node *) Bash(curl -sf *)
---

# /verify

Phạm vi: `$ARGUMENTS`. Trống → chỉ các module có file đổi so với HEAD:

```bash
{ git diff --name-only HEAD; git ls-files --others --exclude-standard; } | cut -d/ -f1 | sort -u
```

`all` → mọi module. Chạy từng module theo bảng, dừng module đó ở bước lỗi đầu tiên:

| Module | Lệnh (chạy trong thư mục module) |
|---|---|
| app | `npx tsc --noEmit` → `npm run lint` → `npm run build` |
| collector | `npm run check` → `npm test` |
| pipeline | `npm test` → `node --check` từng `.mjs` vừa đổi |
| data-api | `npm run typecheck` (chưa có `node_modules` → báo user cần `npm install`, không tự cài) |
| agent | `npx tsc --noEmit` → `npm test` |

- `agent/` có sẵn 2 lỗi TS tồn đọng ở `src/runtime/loop.ts` và `src/runtime/models.ts`. Chỉ
  coi là lỗi mới nếu nằm ở file khác hoặc số lỗi tăng.
- Nếu app đã build và có DB: `npm run start -- -p 3456` ở nền rồi
  `curl -sf http://localhost:3456/vn/hanoi -o /dev/null` phải trả 200; tắt server sau đó.
- Đổi SQL trong `pipeline/sql/` hoặc `db/migrations/`: áp vào DB local và chạy lại câu SQL
  liên quan một lần để chứng minh idempotent.

## Báo cáo

Bảng ngắn: module · lệnh · PASS/FAIL · dòng lỗi đầu tiên. Không nói "xong" khi còn FAIL.
Lỗi tồn đọng từ trước ghi riêng, tách khỏi lỗi do thay đổi lần này.
