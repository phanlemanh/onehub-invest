# loi-vao-script-chay-qua-symlink — kế hoạch thi công

**Goal:** 12 lối vào script chạy khi gọi qua symlink `~/dev/one-invest`. **Spec:** `docs/superpowers/specs/2026-10-24-loi-vao-script-chay-qua-symlink-design.md` · `_acceptance/loi-vao-script-chay-qua-symlink/`.

## Global Constraints

- Khuôn đúng: `process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)` (import `realpathSync` từ `node:fs`, `fileURLToPath` từ `node:url`).
- Không sửa plist, `scripts/*-daily.sh`, bản chép kit; không ghi DB trong test (DATABASE_URL `postgres://127.0.0.1:9/x`).

## Review Focus

1. Gọi qua đường tương đối (`node transform-zalo.mjs` với cwd = pipeline/) — `realpathSync` nhận đường tương đối theo cwd → Task 1 ô «tương đối».
2. `enrich-revert.ts` chạy qua tsx — loader tsx có giải symlink cho `import.meta.url` không → Task 1 ô enrich-revert qua symlink.
3. Nhập như mô-đun từ test hiện có → main không được chạy → Task 1 AC-4.

### Task 1: Thước + sửa 12 lối vào (một task — thước đỏ trước, sửa sau)

independent: false · phục vụ E1–E4

**Files:** Create `pipeline/scripts/entrypoint-symlink.test.mjs`; Modify 12 tệp ở AC-1 (dòng lối vào).

- [ ] Viết test: `ENTRY_MATRIX` 12 dòng `{ path, kind: 'db'|'static'|'smoke'|'tsx' }`; hàm `run(kind, how)` với `how ∈ symlink|abs|rel`; ca AC-1 (36 ô), AC-2 (3 tệp mẫu qua symlink), AC-3 (`scanEntrypoints(files)` theo tệp + ma trận mẫu 6 ô), AC-4 (runner tạm nhập 8 tệp, gọi qua symlink và đường thật; đối chứng runner gọi `measureResidue` với client cổng 9).
- [ ] Chạy → AC-1 và AC-3 đỏ trên mã hiện tại (đúng triệu chứng), AC-2 và AC-4 xanh.
- [ ] Sửa 12 lối vào sang khuôn đúng.
- [ ] Chạy → xanh; `cd pipeline && npm test` toàn bộ xanh; `cd agent && npm test` xanh.
- [ ] Commit `fix(pipeline): lối vào script chạy được qua symlink ~/dev/one-invest`.
