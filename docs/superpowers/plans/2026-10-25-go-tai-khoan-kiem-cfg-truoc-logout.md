# go-tai-khoan-kiem-cfg-truoc-logout Implementation Plan

**Goal:** `deleteZaloAccount` kiểm bản cấu hình sau khi gỡ TRƯỚC lệnh `openclaw channels logout`.

**Spec:** `docs/superpowers/specs/2026-10-25-go-tai-khoan-kiem-cfg-truoc-logout-design.md` · hợp đồng
`_acceptance/go-tai-khoan-kiem-cfg-truoc-logout/contract.md`.

## Global Constraints

- Phép đo chỉ dùng openclaw giả (HOME/PATH tạm), không chạm `~/.openclaw` (luật zalo-safety).
- Giữ nguyên chuỗi `  requireDeletableAccount(cfg, accountId);\n` và vị trí logout — thước GT-AC-5 của
  `go-tai-khoan-kiem-id` đột biến trên chính chuỗi ấy.

## Review Focus

- Cấu hình hỏng ở `channels.zalouser.accounts` (không phải object) → requireDeletableAccount ném trước; không đổi.
- Lệnh CLI ghi cấu hình phạm trong lúc logout → writeCfg vẫn chặn (ngoài phạm vi, giữ như cũ).

### Task 1: Kiểm bản sau khi gỡ trước logout (một task, tuần tự)

**Files:** Modify `app/src/lib/zalo-admin.ts` (deleteZaloAccount) · Test `app/tests/go-tai-khoan-kiem-cfg.test.tsx`
**Evals:** E1–E6 · **independent:** không (một task)

- [ ] Chạy `cd app && node --import tsx --test tests/go-tai-khoan-kiem-cfg.test.tsx` trên bản cũ — GC-AC-1 và GC-AC-4 đỏ
  (AC-4 đỏ vì dòng đột biến chưa có), ghi sổ `fix` kèm sha.
- [ ] Thêm `withoutAccount(cfg: Root, accountId: string): Root` (structuredClone, bỏ `accounts[accountId]`) và dòng
  `  assertZaloCfgSafe(withoutAccount(cfg, accountId));` ngay sau `requireDeletableAccount`.
- [ ] Chạy lại tệp test — xanh; `cd app && npm test` xanh; `npx tsc --noEmit` và `npm run lint` sạch.
- [ ] Commit.
