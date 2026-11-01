# nguoi-noi-theo-sdt (HD13) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Bộ dựng danh bạ gộp người theo SĐT vào người theo tài khoản cùng nguồn khi nối một–một, có vết, tách lại được.

**Architecture:** Hàm thuần `capMotMot`/`chonGop`/`nguoiCuoi`/`anhXaVai` trong `pipeline/lib/danh-ba-nguoi.mjs`; `dungNguoi`
ghi gộp (UPDATE parties + INSERT registry_events) và rút vai lý do `gop-nguoi`; `tachNguoi` + CLI `--tach`. Thước dữ liệu
thật trong `nap-lai-nguoi.mjs`.

**Tech Stack:** Node ESM, pg, node:test. **Spec:** `docs/superpowers/specs/2026-10-31-nguoi-noi-theo-sdt-design.md` +
`_acceptance/nguoi-noi-theo-sdt/contract.md` + `evals.yaml`.

## Global Constraints

- Chỉ chạm vùng: `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/dung-nguoi.mjs`, `pipeline/scripts/danh-ba-nguoi*.test.mjs`,
  `pipeline/scripts/nap-lai-nguoi.mjs` (+ `pipeline/CLAUDE.md` một dòng). Không migration; `do-danh-ba-sdt.mjs` không đổi.
- DB: chỉ DB thử `oneinvest_p3_nguoi`; 055 + 060 nạp trong giao dịch (itest, thước); không ghi `oneinvest`.
- Hằng: `LY_DO_GOP = "gop-nguoi"`, lý do sự kiện gộp `sdt-mot-mot <S0x>`, `changed_by = "dung-nguoi"`, nguồn gộp `S03`, `S05`.

## Review Focus

1. Người tài khoản đã gộp một SĐT, sau đó SĐT thứ hai thành một–một với cùng người gửi → không gộp (AC-7) — ca trong E1.
2. Hai lượt dựng chồng nhau — khoá 55055 có sẵn, không đổi.
3. Tin chỉ SĐT của số đã gộp mà người gửi đã đổi — vai theo `gopVao`, rút `gop-nguoi` khi người bị gộp còn vai.
4. Tách người mà người còn lại đã bị gộp tiếp (chuỗi) — `nguoiCuoi` đi theo chuỗi, có chặn vòng.
5. CLI tách gọi trên DB không có bảng parties → lỗi rõ, thoát 1.

### Task 1: lõi thuần (E1, E2, E10)

**Files:** Modify `pipeline/lib/danh-ba-nguoi.mjs`; Test `pipeline/scripts/danh-ba-nguoi.test.mjs`.

**Interfaces — Produces:**
- `capMotMot(tins, baiTheoId, { motSdtMoiNguoi = true }) → { cap: {source, sdt, taiKhoan}[], nhieuNhieu: {S0x: {sdt_nhieu_nguoi, nguoi_nhieu_sdt}} }` (tin sống, S03/S05).
- `nguoiCuoi(gopVao: Map, k) → string`.
- `chonGop(tins, biDanh: Map, trangThai: Map<party_key,status>, { baiTheoId, gopVao = new Map(), motSdtMoiNguoi }) → { gop: {tu, vao, source, sdt}[], nhieuNhieu }`.
- `anhXaVai(vai, gopVao) → vai[]` (party_key → người cuối, bỏ trùng theo subject|party).
- `SQL.trangThai`, `SQL.gop`, `SQL.themSuKien`, `SQL.docNguoi`, `SQL.tach`.

- [ ] Test ma trận chonGop (9 dáng + người tài khoản đã có SĐT khác) và anhXaVai; quét SQL (cả `dung-nguoi.mjs`) có đối chứng dương. Chạy đỏ.
- [ ] Cài; chạy `cd pipeline && node --test scripts/danh-ba-nguoi.test.mjs` xanh. Commit.

### Task 2: ghi gộp + tách (E3–E7, E9)

**Files:** Modify `pipeline/lib/danh-ba-nguoi.mjs` (`dungNguoi`, `tachNguoi`), `pipeline/dung-nguoi.mjs`; Test `pipeline/scripts/danh-ba-nguoi.itest.mjs`.

**Interfaces:** `dungNguoi` trả thêm `gop`, `nhieu_nhieu`; `tachNguoi(c, partyKey, { lyDo, runId, out }) → { tu, vao, dung }`, lỗi `code` `KHONG_CO` / `SAI_TRANG_THAI`. CLI: `--tach <k> --ly-do <s>` (thiếu lý do → 2 trước kết nối; lỗi tách → 1).

- [ ] Itest E3–E7 (mồi viết tay qua `themTin`/`themBai`), E9 (tiến trình con; 055 + 060 áp lên DB thử nếu thiếu, chốt từ chối oneinvest). Chạy đỏ.
- [ ] Cài; chạy executor `nguoi_db` xanh (cả ca cũ). Commit.

### Task 3: thước dữ liệu thật (E8)

**Files:** Modify `pipeline/scripts/nap-lai-nguoi.mjs`.

- [ ] Nạp 060 trong giao dịch; N1 trước (tinhSo + bộ đọc không mở giao dịch), gộp lượt 1 = N1 trước, N1 sau = 0, kiểm đích gộp (người gửi rút độc lập từ stg_zalo_posts), người cuối ≤ 1 SĐT, lượt 2 gộp 0, đối chứng luật lỏng và đối chứng gộp sai trong SAVEPOINT; in `git hash-object` của do-danh-ba-sdt.mjs.
- [ ] Chạy executor `nguoi_nap_lai` trên DB thử, exit 0. Commit + dòng `pipeline/CLAUDE.md`.
