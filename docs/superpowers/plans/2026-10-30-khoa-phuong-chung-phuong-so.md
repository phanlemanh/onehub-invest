# khoa-phuong-chung-phuong-so Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [x]`) syntax.

**Goal:** thẻ duyệt và luật chấm cùng coi «P.12» = «Phường 12».

**Architecture:** bỏ dòng «khoá chỉ số → soGiaTri» trong `soPhuong` ở `app/src/lib/ops/review-can-cu.ts` và bản chép ở
`agent/src/agents/judge-entity.ts`; thay ca test cũ đo hành vi cũ bằng ca mới.

**Tech Stack:** TypeScript strict, node:test + tsx.

**Spec:** `docs/superpowers/specs/2026-10-30-khoa-phuong-chung-phuong-so-design.md` · hợp đồng `_acceptance/khoa-phuong-chung-phuong-so/`

## Global Constraints

- Chỉ sửa bốn tệp của vùng; không đổi tiền tố, slug hoá, ca Thiếu.
- Verify: `config:executors.test.the_duyet_phuong` + `config:executors.test.agent` + `cd agent && npx tsc --noEmit` + `cd app && npx tsc --noEmit`.

## Review Focus

- «phuong-12» vẫn Lệch (slug không có tiền tố có dấu).
- «Phường 1» với «Phường 12» vẫn Lệch.
- Ma trận giữ lại (TPL-AC-1/2/4, AC-1 PL25, AC-5) không đổi ô nào so với 3ad9d838.

---

### Task 1: Thẻ duyệt — E1, E4 · independent: false

**Files:** Modify `app/src/lib/ops/review-can-cu.ts` (`soPhuong`) · Test `app/tests/the-duyet-phuong-lech-gia.test.tsx` (thay ca TPL-AC-3 bằng 'KP-AC-1 phường số ghi khác kiểu'; sửa chú thích TPL-AC-4).

- [x] Viết ca KP-AC-1 (6 cặp × 2 chiều = 12 assert, đối chứng đỏ chèn lại dòng khoá-chỉ-số) → đỏ.
- [x] Bỏ dòng khoá-chỉ-số, sửa chú thích `soPhuong` → xanh cả tệp.

### Task 2: Luật chấm — E2, E3, E5 · independent: false

**Files:** Modify `agent/src/agents/judge-entity.ts` (`soPhuong`, bỏ `soGiaTri`/`trong`/`khoa` nếu không còn dùng) · Test `agent/tests/judge-nguong.test.ts` (thay ca 'AC-4 phường khớp thẻ duyệt' bằng 'KP-AC-2' 21 cặp; thêm 'KP-AC-3').

- [x] Viết KP-AC-2 (42 assert, apNguong không tham số; ba đối chứng đỏ) và KP-AC-3 (4 assert) → đỏ.
- [x] Bỏ dòng khoá-chỉ-số ở agent → `npm test` + `tsc` xanh. Commit.
