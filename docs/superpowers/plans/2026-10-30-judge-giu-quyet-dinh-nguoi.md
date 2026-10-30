# judge-giu-quyet-dinh-nguoi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** judge-run không ghi đè thẻ người vừa quyết; luật ghép căn so phường bằng đúng khoá của thẻ duyệt.

**Architecture:** Chặn ghi đè nằm ngay trong câu UPDATE (`status = 'pending'` + `NOT EXISTS` thẻ đã quyết của cặp),
đếm theo `rowCount`. `chuanHoaPhuong` thay bằng `khoaPhuong` + `soPhuong` chép từ `app/src/lib/ops/review-can-cu.ts`;
`apNguong` nhận tham số so phường để test đối chứng.

**Tech Stack:** TypeScript strict, node:test + tsx, pg, DB thử riêng :5433.

**Spec:** `docs/superpowers/specs/2026-10-30-judge-giu-quyet-dinh-nguoi-design.md` · hợp đồng `_acceptance/judge-giu-quyet-dinh-nguoi/`

## Global Constraints

- Chỉ sửa `agent/scripts/judge-run.ts`, `agent/src/agents/judge-entity.ts`, `agent/tests/judge-*`.
- Không chạm DB `oneinvest`; test dùng DB thử `oneinvest_p3_judge_test_<pid>`.
- Verify: `cd agent && npm test` (= `config:executors.test.agent`) + `npx tsc --noEmit`.

## Review Focus

- Thẻ hai chiều: một bị quyết giữa chừng → không sửa thẻ nào (AC-2).
- Tên phường rỗng `''` và chỉ tiền tố «Phường» → thiếu, không phải khác (AC-4 ô 16, 18).
- «Phượng Dực» không bị bỏ như tiền tố «Phường» (AC-4 ô 3).

---

### Task 1: Chặn ghi đè thẻ người vừa quyết — phục vụ E1, E2, E3 · independent: true

**Files:** Modify `agent/scripts/judge-run.ts` (khối UPDATE ~157–164) · Test `agent/tests/judge-run.test.ts`

**Interfaces:** Produces `export const SQL_CAP_NHAT: string` (câu UPDATE mới, tham số $1..$4 như cũ).

- [x] Viết ca 'AC-1 thẻ bị quyết giữa lúc chấm' (3 ô approved/rejected/deferred), 'AC-2 hai chiều, một thẻ bị quyết', thêm assert AC-3 vào ca AC-7; mỗi ca có đối chứng đỏ theo evals.yaml (UPDATE cũ nhúng nguyên văn).
- [x] Chạy `cd agent && node --import tsx --test tests/judge-run.test.ts` → đỏ ở AC-1/AC-2.
- [x] Sửa UPDATE: `WHERE id = ANY($4) AND status = 'pending' AND NOT EXISTS (SELECT 1 FROM review_queue x WHERE x.id = ANY($4) AND x.status <> 'pending')`; `rowCount` 0 → `boQua++`, ngược lại `capNhat++`.
- [x] Chạy lại → xanh. Commit.

### Task 2: So phường cùng khoá thẻ duyệt — phục vụ E4, E5 · independent: true

**Files:** Modify `agent/src/agents/judge-entity.ts` (`chuanHoaPhuong` → `khoaPhuong`, `soPhuong`; `apNguong`) · Test `agent/tests/judge-nguong.test.ts`

**Interfaces:** Produces `export function khoaPhuong(v: string): string`, `export function soPhuong(a: string|null, b: string|null): "khop"|"lech"|"thieu"`, `apNguong(pair, lechFn = lech, soPhuongFn = soPhuong)`.

- [x] Viết ca 'AC-4 phường khớp thẻ duyệt' (18 cặp, 36 assert, rút hàm từ tệp app + `stripTypeScriptTypes`) và 'AC-5 cùng phường ghi khác kiểu ra yes' (5 ô, 10 assert), đối chứng đỏ với `chuanHoaPhuong` cũ nhúng nguyên văn.
- [x] Chạy → đỏ.
- [x] Chép `khoaPhuong`/`soPhuong` (+ `trong`, `khoa`, `soGiaTri`) từ app; `apNguong` dùng `soPhuongFn` cho `khacPhuong`/`cung`/`thieu`; bỏ `chuanHoaPhuong`.
- [x] Chạy `cd agent && npm test && npx tsc --noEmit` → xanh (kể cả ma trận AC-1 PL25). Commit.
