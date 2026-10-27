# airbnb-nghi-khong-hoi-sinh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Listing Airbnb bị `ghiListing` cho nghỉ ngoài phường mang toạ độ của lần thu mới nhất, nên `reassign-areas` không
đánh thức nó bằng toạ độ cũ.

**Architecture:** Sửa một câu UPDATE trong nhánh cho nghỉ của `ghiListing`, `pipeline/transform-airbnb.mjs`. Test DB gọi
`ghiListing` + `runReassign` thật trong BEGIN … ROLLBACK, có đối chứng cặp bằng câu cũ. Test tĩnh đọc nhánh cho nghỉ.

**Tech Stack:** Node .mjs, `pg`, PostGIS, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-27-airbnb-nghi-khong-hoi-sinh-design.md` · hợp đồng
`_acceptance/airbnb-nghi-khong-hoi-sinh/contract.md`.

## Global Constraints

- Không migration. Không câu `DELETE`/`TRUNCATE` nhắm `listing_records` (răng `scan-delete`).
- Test DB chạy trên DB thử riêng (`bash db/db-thu.sh oneinvest_p2_airbnb`, DATABASE_URL); ném lỗi khi DB là `oneinvest`.

## Review Focus

- Payload thiếu một trong hai toạ độ (chỉ `lat` null): `geom` phải NULL, không sinh điểm `(lng, NULL)`. Câu CASE xét cả hai.
- Listing chưa có bản ghi mà lần thu ngoài phường: UPDATE không chạm dòng nào, không lỗi (OOS-1, hành vi cũ).
- Listing nghỉ vì `doi_khoa`: lý do và mốc giữ nguyên (AC-4 dòng 2).

---

### Task 1: Nhánh cho nghỉ của ghiListing ghi toạ độ lần thu mới

**Files:**
- Modify: `pipeline/transform-airbnb.mjs` (nhánh `if (!areaId)` của `ghiListing`)
- Create: `pipeline/scripts/airbnb-nghi-chung.mjs` (hằng `CAU_NGHI_CU`, `nhanhNghi(src)`, `kiemNhanhNghi(nhanh) → string[]`)
- Test: `pipeline/scripts/airbnb-nghi.itest.mjs` (AN chốt DB, AN-AC-1…AN-AC-5b), `pipeline/scripts/airbnb-nghi.test.mjs` (AN-AC-6)

Phục vụ E1–E7. `independent: false` (một task).

- [x] Viết test DB và test tĩnh theo evals.yaml; chạy trên mã cũ (`git show HEAD:pipeline/transform-airbnb.mjs`) → đỏ ở
  AN-AC-1, 2, 3, 4, 6 với thông điệp ghim («toạ độ lần thu mới», «reassign đánh thức…», «không ghi toạ độ»); AN-AC-5a/5b
  xanh (hồi quy).
- [x] Sửa câu UPDATE: `latitude = $2, longitude = $3`, `geom` từ hai toạ độ (NULL khi thiếu một trong hai),
  `retired_at = COALESCE(retired_at, now())`, `retired_reason = COALESCE(retired_reason, 'ngoai_phuong')`, bỏ
  `AND retired_at IS NULL`.
- [x] Verify: `cd pipeline && node --test scripts/airbnb-nghi.itest.mjs scripts/airbnb-nghi.test.mjs` → pass 9, fail 0,
  skipped 0; `node --test scripts/nap-lai-db.itest.mjs scripts/nap-lai.test.mjs` → 31/31; `npm test` xanh.
- [x] Chiều đỏ của chốt DB: `DATABASE_URL` trỏ `oneinvest` hay vắng → pass 0, fail 7.
- [x] Commit `fix(pipeline): listing Airbnb cho nghỉ ngoài phường mang toạ độ lần thu mới — reassign không đánh thức bằng toạ độ cũ`.

### Task 2: Tài liệu

**Files:** `pipeline/CLAUDE.md` (dòng transform-airbnb), `docs/ROADMAP.md` §2 (đoạn PL14).

Phục vụ không eval nào (tài liệu); gộp vào commit của Task 1.
