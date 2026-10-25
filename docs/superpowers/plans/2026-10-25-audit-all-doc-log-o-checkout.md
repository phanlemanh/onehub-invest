# Đọc log job ở checkout chính khi chạy từ worktree (ON16) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính).

**Goal:** `audit-all.sh` và trang Ops local đọc `pipeline/logs` ở checkout chính khi chạy từ worktree.

**Architecture:** Một luật «gốc log» (git `--git-common-dir`, rơi về cây đang chạy) viết hai bản: bash trong
`audit-all.sh`, TS trong `app/src/lib/log-root.ts`. Ba chỗ đọc log đi qua nó. Đo bằng hai cây tạm dựng bằng git thật,
đối chứng dương trên bản mã main 9e3bb9f rút bằng `git show`, lệnh/trang thật ở smoke.

**Tech Stack:** bash, Next.js 16 (server lib), `node --test` + tsx, git, playwright-core.

**Spec:** `docs/superpowers/specs/2026-10-25-audit-all-doc-log-o-checkout-design.md` · hợp đồng
`_acceptance/audit-all-doc-log-o-checkout/contract.md` (Hỏi-1 theo khuyến nghị).

## Global Constraints

- Gốc log: `git -C <cây> rev-parse --path-format=absolute --git-common-dir`; dùng cha khi tên là `.git` và cha tồn tại;
  ngược lại chính cây. Dòng PASS của A1 không đổi chữ.
- Hỏi-1: dòng LIMITED của A1 = «AirDNA nightly log trống — đọc <đường>».
- Lượt audit thật trong smoke: HOME tạm (không CLI OpenClaw, không keychain, không token cloud).
- Không sửa `scripts/lib/ops-local.mjs`, `pipeline/push-ops-facts.mjs`, script ghi log.

## Review Focus

1. Worktree mà checkout chính đã dời → git lỗi → rơi về cây, không crash (AC-3).
2. `readSchedulerStatus` còn hằng đường log tính lúc nạp mô-đun → chdir không có tác dụng (AC-5).
3. Glob `weekly-*.log` dựng đường riêng (AC-5).
4. Hai lượt audit thật lệch số DB vì chạy lệch giờ — chạy đồng thời (AC-6).
5. `getLockdownStatus` bị gọi với `root` truyền riêng ở trang (AC-7 nhãn lớp 1–4).

---

### Task 1: Gốc log ở audit-all + test hộp (independent: false) — phục vụ E1–E3

**Files:** Modify `scripts/audit-all.sh`, `scripts/audit-all.test.mjs`.
- [ ] Ca `ON16-AC-1` … `ON16-AC-3` (cây tạm dựng bằng `git init` + `git worktree add`, PATH thêm thư mục của git thật),
  mỗi ca có chiều đỏ; `node --test scripts/audit-all.test.mjs` xanh.

### Task 2: Gốc log ở app + test (independent: false) — phục vụ E4, E5

**Files:** Create `app/src/lib/log-root.ts`, `app/tests/doc-log-o-checkout.test.tsx`. Modify `app/src/lib/ops-queries.ts`,
`app/src/lib/collections-queries.ts`.
- [ ] Ca `ON16-AC-4`, `ON16-AC-5` (4 loại log, luật tĩnh), chiều đỏ trên bản sao main; `tsc`, `lint`, `npm test` xanh.

### Task 3: Smoke lệnh thật + trang thật (independent: false) — phục vụ E6, E7

**Files:** Create `scripts/smoke-doc-log-o-checkout.mjs` (khuôn ON13/ON6, `scripts/lib/ops-app.mjs`).
- [ ] Hai lượt audit-all đồng thời, so toàn bộ đầu ra; trang `/ops/collections` từ worktree so với log ở checkout chính;
  ảnh chụp; chiều đỏ của từng vế.
