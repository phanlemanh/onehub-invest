# Kế hoạch: dung-m2-song-song

Design: `docs/superpowers/specs/2026-10-29-dung-m2-song-song-design.md` · Hợp đồng: `_acceptance/dung-m2-song-song/contract.md`.
Mọi task tuần tự (`independent: false`): task 3–5 đọc tệp mà task 1–2 sinh, task 6 dùng registry thật.

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Kho có bảng token sinh từ màu giao diện | `scripts/design-floor/gen-tokens.mjs`, `design/tokens.json` | AC-1…AC-3 (bảng token) |
| Kho có danh mục thành phần sinh từ code và catalog | `scripts/design-floor/gen-registry.mjs`, `design/component-registry.json` | AC-4…AC-6 (danh mục) |
| Test cho hai lệnh sinh | `scripts/design-floor/gen-*.test.mjs`, `test-helpers.mjs` | AC-1…AC-6 |
| Bộ kiểm của kit đọc được tệp sinh | `scripts/design-floor/reuse-plan.test.mjs` | AC-7 (bộ kiểm đọc được) |
| Lệnh báo tệp sinh cũ; bậc vẫn M1 | `scripts/design-floor/fresh.test.mjs` | AC-8 (độ tươi), AC-10 (giữ M1) |
| Người làm giao diện phải viết kế hoạch dùng lại | `.claude/skills/onehub-ui/SKILL.md`, `loop.md` | AC-9 (luật skill) |

## Task 1 — lệnh sinh tokens
- Files: `scripts/design-floor/gen-tokens.mjs`, `design/tokens.json`
- Verify: `node scripts/design-floor/gen-tokens.mjs --root . && node scripts/design-floor/gen-tokens.mjs --root . --check`
- Evals: E1, E2, E3, E9 · independent: false

## Task 2 — lệnh sinh registry
- Files: `scripts/design-floor/gen-registry.mjs`, `design/component-registry.json`
- Verify: `node scripts/design-floor/gen-registry.mjs --root . && node scripts/design-floor/gen-registry.mjs --root . --check`
- Evals: E4, E5, E6, E9 · independent: false

## Task 3 — test tokens + registry (cặp xanh/đỏ, ma trận viết tay)
- Files: `scripts/design-floor/test-helpers.mjs`, `gen-tokens.test.mjs`, `gen-registry.test.mjs`
- Verify: `node --test scripts/design-floor/gen-tokens.test.mjs scripts/design-floor/gen-registry.test.mjs`
- Evals: E1–E6 · independent: false

## Task 4 — test bộ kiểm của kit
- Files: `scripts/design-floor/reuse-plan.test.mjs`
- Verify: `node --test scripts/design-floor/reuse-plan.test.mjs`
- Evals: E7, E11 · independent: false

## Task 5 — test độ tươi và bậc
- Files: `scripts/design-floor/fresh.test.mjs`
- Verify: `node --test scripts/design-floor/fresh.test.mjs`
- Evals: E8, E12 · independent: false

## Task 6 — skill onehub-ui
- Files: `.claude/skills/onehub-ui/SKILL.md`, `.claude/skills/onehub-ui/loop.md`
- Verify: `node --test scripts/design-floor/*.test.mjs` (ca M2-AC-9 rút ví dụ của SKILL.md)
- Evals: E10, E11 · independent: false
