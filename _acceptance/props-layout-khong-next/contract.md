---
schema_version: 1
feature: Typecheck của app xanh trên cây không có .next — các layout và trang /ops/data-flow khai props tại chỗ, không dựa vào kiểu toàn cục LayoutProps/PageProps do next typegen sinh
slug: props-layout-khong-next
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi khai báo kiểu props của 5 layout và 1 trang; hành vi, dữ liệu, quyền, luồng giữ nguyên
surfaces: [ui]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: props-layout-khong-next

## Context

Hàng CI3 của `docs/plan/lo-trinh.json` (đợt mo-neo-1411), nối OOS-1 của hồ sơ `props-trang-ops-quality` (CI1).
Hồ sơ có mặt vì PR chạm `app/` (ngoài `t1_skip_globs`).

`LayoutProps<"/…">` và `PageProps<"/…">` là kiểu toàn cục do `next typegen` sinh vào `.next/types/`. Cây vừa clone hay
worktree mới không có `.next` nên `cd app && npx tsc --noEmit` đỏ TS2304 — đã làm đỏ worktree chấm ba lần ngày 25/11
(M5, dãy P1, dãy P4), mỗi lần phải nhớ chạy `npx next typegen` trước.

Đếm bằng `npx tsc --noEmit` trên cây không có `.next` tại `origin/main` `de57dc806`: đúng 6 lỗi TS2304, 6 tệp:

| Tệp | Kiểu cũ |
|---|---|
| `app/src/app/layout.tsx` | `LayoutProps<"/">` |
| `app/src/app/(app)/layout.tsx` | `LayoutProps<"/">` |
| `app/src/app/(auth)/layout.tsx` | `LayoutProps<"/">` |
| `app/src/app/(marketing)/layout.tsx` | `LayoutProps<"/">` |
| `app/src/app/ops/layout.tsx` | `LayoutProps<"/ops">` |
| `app/src/app/ops/data-flow/page.tsx` | `PageProps<"/ops/data-flow">` |

Vùng: lời giao khai `(app)/**`, `ops/layout.tsx`, `ops/data-flow/**`; ba tệp `(auth)/layout.tsx`, `(marketing)/layout.tsx`,
`app/src/app/layout.tsx` nằm ngoài vùng đó — GS cho phép, 25/11 (đích của hàng là 6/6).

Sửa: layout khai `{ children: ReactNode }` (`import type { ReactNode } from "react"`); trang `/ops/data-flow` khai
`{ searchParams: Promise<Record<string, string | string[] | undefined>> }` — cùng khuôn CI1 đã dùng cho `/ops/quality`.
Không tệp kiểu dùng chung, không đụng `next.config.ts`, `package.json`, `tsconfig.json`; cách sửa không phụ thuộc bản
Next (kiểu tại chỗ hợp với cả bộ kiểm cũ `next-types-plugin` lẫn `validator.ts` của `next typegen`).

## Criteria

- AC-1: Given cây sạch không có `app/.next`, When chạy `cd app && npx tsc --noEmit`, Then thoát 0; trên `origin/main` `de57dc806` cùng lệnh cho đúng 6 lỗi TS2304 ở 6 tệp bảng trên. Ca phá: trả một layout về `LayoutProps<"/">` → tsc đỏ đúng TS2304 ở tệp đó.
- AC-2: Given cây đã chạy `npx next typegen`, When chạy `cd app && npx tsc --noEmit && npm run lint`, Then thoát 0.
- AC-3: Given app dựng như trước, When mở các layout và `/ops/data-flow?window=…`, Then hành vi không đổi: chỉ khai báo kiểu đổi, thân hàm giữ nguyên từng byte (`git diff` chỉ chạm dòng chữ ký và dòng import kiểu).

## Out of scope

- OOS-1: Trang `/ops/quality` — đã khai kiểu tại chỗ ở CI1.
- OOS-2: Đổi cách CI chạy `next typegen` — CI vẫn chạy như cũ; hàng này chỉ gỡ việc phải nhớ chạy nó ở máy.
- OOS-3: Thêm luật lint cấm `LayoutProps`/`PageProps` toàn cục — chưa có số đo đòi rào mới (luật «không thêm cơ chế tự chế»).
