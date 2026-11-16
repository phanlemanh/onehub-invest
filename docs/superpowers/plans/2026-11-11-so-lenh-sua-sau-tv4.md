# so-lenh-sua-sau-tv4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — ba task nhỏ, phiên tự làm).

**Goal:** Lệnh `source.pause` có `resume_when` sai kiểu không còn kẹt hàng lệnh; plist ops-apply neo node tuyệt đối;
`cap-token-may.mjs` cấp token qua Management API và tự ghi `cloud.env`.

**Architecture:** Thêm một nhánh kiểm vào `kiemLenh` (hai bản chẵn); plist dùng chỗ giữ `__NODE__` thay lúc cài bằng
một dòng trong runtime-map; `cap-token-may.mjs` tách hàm `chay()` có đường `--qua-mgmt` gọi `mgmtExec` của `sync-cloud.mjs`.

**Tech Stack:** Node ESM, `node:test`, pg, tsx (app), plutil.

**Spec:** `docs/superpowers/specs/2026-11-11-so-lenh-sua-sau-tv4-design.md` · hợp đồng `_acceptance/so-lenh-sua-sau-tv4/contract.md` · `evals.yaml` E1–E10.

## Global Constraints

- Mã lý do mới đúng chuỗi `resume-when-sai-khuon`; thứ tự kiểm: sau `thieu-reason`.
- Ca test mang tiền tố `SS-AC-n` đúng như `evals.yaml`.
- Không in token; chỉ băm sha256 rời máy.
- Dòng cài trong runtime-map không chứa `launchctl`; chứa đúng một `~/Library/LaunchAgents`.

## Review Focus

1. `resume_when: null` gửi tường minh vẫn hợp lệ (AC-1 ô null).
2. `cloud.env` không tồn tại với `--ghi-cloud-env` → tạo tệp mới, quyền 600.
3. Management API trả lỗi HTTP → `mgmtExec` ném → thoát 1, tệp không đổi (ghi tệp chỉ sau khi cloud trả dòng).
4. Thiếu `SUPABASE_MGMT_TOKEN` trong `cloud.env` → thoát 2 trước khi gọi mạng.
5. Import `cap-token-may.mjs` không chạy `main` và không nạp `pg` cho đường mgmt (E10 vế import).

---

### Task 1: kiemLenh chặn `resume_when` sai kiểu (AC-1..AC-5)

**Files:** `pipeline/lib/lenh.mjs`, `app/src/lib/lenh.ts`, `pipeline/scripts/lenh.test.mjs`,
`pipeline/scripts/so-lenh.itest.mjs`, `app/tests/so-lenh.test.tsx`.

- [ ] Viết test: `SS-AC-1` (9 ô, đối chứng đỏ bản sao gỡ nhánh), `SS-AC-2` (44 ô = 9 + 35 ô SL-AC-5, đối chứng bản sao lenh.ts),
  `SS-AC-3` (apLenh L1 failed rồi L2 applied; đối chứng: bản sao gỡ nhánh thì ném TypeError), `SS-AC-4` (ops-apply hai lượt
  với cloud giả; đối chứng: bản sao lenh.mjs → lượt một thoát ≠ 0, L2 không có sổ), `SS-AC-5` (POST 400 + đối chứng 201).
- [ ] Chạy, thấy đỏ.
- [ ] Thêm nhánh: `if (type === "source.pause" && payload.resume_when !== undefined && payload.resume_when !== null && typeof payload.resume_when !== "string") return { ok: false, ly_do: "resume-when-sai-khuon" }` ở cả hai bản.
- [ ] Chạy `lenh.test.mjs`, `so-lenh.itest.mjs` (db-thu), `so-lenh.test.tsx` (db-thu) — xanh.

### Task 2: plist `__NODE__` + dòng cài (AC-6, AC-7)

**Files:** `pipeline/cron/com.oneinvest.ops-apply.plist`, `docs/ops/runtime-map.md`, tạo `pipeline/scripts/ops-apply-plist.test.mjs`.

- [ ] Test `SS-AC-6`, `SS-AC-7` đúng như E6, E7 (rút dòng cài theo dấu `com.oneinvest.ops-apply.plist` + `__NODE__`).
- [ ] Đổi plist `ProgramArguments` = [`__NODE__`, `__ROOT__/pipeline/ops-apply.mjs`].
- [ ] Runtime-map: một dòng `sed -e "s#__NODE__#$(command -v node)#g" -e "s#__ROOT__#$HOME/dev/onehub-invest#g" pipeline/cron/com.oneinvest.ops-apply.plist > ~/Library/LaunchAgents/com.oneinvest.ops-apply.plist`
  chạy ở gốc kho, kèm ghi chú «đổi chỗ node thì cài lại»; bước cấp token đổi sang `--qua-mgmt --ghi-cloud-env`.

### Task 3: cap-token-may qua Management API (AC-8, AC-9)

**Files:** `scripts/cap-token-may.mjs`, tạo `scripts/cap-token-may.test.mjs`.

**Interfaces:** `export async function chay({ argv, home, env, fetchImpl, exec, out, err }) → Promise<number>`;
`exec` (tuỳ chọn, test) = `(sql) => Promise<rows[]>`; vắng thì đường mgmt dựng `exec` từ `mgmtExec(khoá, { fetchImpl })`.
`main` chỉ chạy khi gọi trực tiếp; `pg` nạp lười chỉ trên đường pg.

- [ ] Test `SS-AC-8`, `SS-AC-8b`, `SS-AC-9` đúng như E8–E10 (đối chứng đỏ bằng bản sao tệp có sửa chuỗi).
- [ ] Cài đặt: SQL trên đường mgmt nội suy giá trị đã kiểm (tên khớp regex, scopes khớp `^[a-z:]+$`, băm hex) — không có tham số.
- [ ] Chạy `node --test scripts/cap-token-may.test.mjs` — xanh.

### Sau cùng

- [ ] `/verify` các module đổi (chạy từng tệp test, LUẬT MÁY YÊN); commit; S4 chấm + ghim lại `so-lenh-bo-ap`.
