# CI chạy typecheck và test từng module (AU11) — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự trong phiên chính).

**Goal:** `.github/workflows/ci-test.yml` năm job (app, pipeline, agent, data-api, scripts) chạy typecheck + test trên mọi PR.

**Architecture:** Mỗi job: `npm ci` các module test của nó gọi tới, typecheck (TS) hoặc `node --check` (JS), dựng DB trống từ
`db/migrations` bằng `scripts/ci-db-init.mjs` (service PostGIS kartoza 17-3.5 cổng 5433), test với `NODE_OPTIONS` lọc ca
theo `scripts/ci-bo-qua.json`. Đo: tĩnh (`check-ci-test.mjs`), chạy lại cục bộ trong docker (`ci-test-local.mjs`), CI thật qua
nhánh `ci-probe/*` (`ci-test-github.mjs`).

**Spec:** `docs/superpowers/specs/2026-10-25-ci-test-module-design.md` · hợp đồng `_acceptance/ci-test-module/contract.md`.

## Global Constraints

- Không `secrets.`; không `continue-on-error` / `|| true` / `if:` trên bước typecheck-test.
- DB CI chỉ trên PostGIS dùng một lần; `ci-db-init` từ chối DB đã có bảng.
- Ca bỏ qua chỉ khi `CI=true`, đúng danh sách viết sẵn; không bỏ qua ca đỏ sẵn của main.

## Review Focus

1. Lệnh `run:` có `$(…)` và nháy — chạy lại cục bộ phải chạy y như Actions (tệp bước, `bash -eo pipefail`).
2. Migration lỗi một câu kéo đổ cả tệp — áp từng câu như psql.
3. Test module này gọi mã module khác — job cài đủ phụ thuộc.
4. Thư viện dùng chung — cấy lỗi JS vào tệp riêng của module.
5. Hook dọn dẹp chạy cả khi mọi ca bị lọc.

### Task 1: Workflow + DB + danh sách bỏ qua (independent: false) — E1–E4

**Files:** `.github/workflows/ci-test.yml`, `scripts/ci-db-init.mjs`, `scripts/ci/area_sources.sql`, `scripts/lib/ci-can-du-lieu.mjs`,
`scripts/ci-bo-qua.json`, `scripts/check-ci-test.mjs`, `scripts/ci-test-module.test.mjs`.

### Task 2: Agent typecheck xanh (independent: false) — E5

**Files:** `agent/package.json`, `agent/package-lock.json`, `agent/src/runtime/{loop,models}.ts`, `agent/scripts/smoke.ts`.

### Task 3: Chạy lại cục bộ + CI thật (independent: false) — E6–E8

**Files:** `scripts/ci-test-local.mjs`, `scripts/ci-test-github.mjs`.
