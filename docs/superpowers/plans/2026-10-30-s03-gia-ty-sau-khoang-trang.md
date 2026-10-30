# s03-gia-ty-sau-khoang-trang Implementation Plan

> **For agentic workers:** thực thi tuần tự trong phiên (Native). Steps dùng checkbox (`- [ ]`).

**Goal:** `gatSo` giữ nguyên giá tỷ viết bằng đồng khi ngay sau là khoảng trắng/xuống dòng + 1–2 chữ số, SĐT vẫn bị gạt.

**Architecture:** thêm một nhánh vào `laDuoiNhomNghin` (`pipeline/transform-zalo.mjs`); không đổi `PHONE_RE`, `extractPhones`,
luật giá. Thước dữ liệu thật là script mới chỉ đọc.

**Tech Stack:** Node ESM, `node:test`, pg (READ ONLY).

**Spec:** `docs/superpowers/specs/2026-10-30-s03-gia-ty-sau-khoang-trang-design.md` · hợp đồng `_acceptance/s03-gia-ty-sau-khoang-trang/`.

## Global Constraints

- Giữ nguyên các mỏ neo đột biến của vòng trước trong `transform-zalo.mjs`: `(laDuoiNhomNghin(t, m, i) ? m : " ")`,
  `return nhom.test(m);`, `const PHONE_RE = /(?<!\d)(?:`, `return t.replace(PHONE_RE, (m, i) => (laDuoiNhomNghin(t, m, i) ? m : " "));`.
- Không ghi DB `oneinvest` :5433; script AC-6 chỉ `BEGIN READ ONLY`.
- Bản nền ghim: `ec899d03`.

## Review Focus

- SĐT 3-3-3 kèm đuôi sau «m2.» hay sau một số đứng riêng — AC-2 có dòng cho từng điều kiện.
- Gạch/chấm sau giá — giữ như trước vòng (dòng «3.000.000.000-3.500.000.000» không đổi giá).
- Số đứng sau giá (diện tích, số phòng) — AC-1 assert trường.
- Danh sách SĐT — so với bản nền.
- DB rỗng — thước AC-6 TRƯỢT.

---

### Task 1: nhánh đuôi trong laDuoiNhomNghin + ma trận GS-AC-1…4 (independent: false; phục vụ E1–E5)

**Files:** Modify `pipeline/transform-zalo.mjs` (`laDuoiNhomNghin`) · Create `pipeline/scripts/gia-ty-sau-khoang-trang.test.mjs`

- [ ] Viết ma trận GS-AC-1 (8 dòng giá + 4 assert trường), GS-AC-2 (10 dòng → 9 triệu), GS-AC-3 (15 dòng so `extractPhones` bản
  nền `ec899d03` qua git show), GS-AC-4 (2 dòng chốt khoảng). Ca đỏ: BO_NHANH_DUOI (E1, E4), BO_000 (E2), BO_THAN (E2),
  LOI_A (`[.\-\s]?` → `[.\-]?` trong PHONE_RE, E3).
- [ ] Chạy → đỏ ở GS-AC-1/2/4 trên cây chưa sửa.
- [ ] Thêm nhánh: khớp = nhóm 3 chữ số cùng dấu, nhóm cuối `000`, rồi `\s\d{1,2}$`; thân số tiền `(?:^|[^\p{L}\d.,])\d{1,3}$` trước dấu.
- [ ] Verify: `cd pipeline && node --test scripts/gia-ty-sau-khoang-trang.test.mjs scripts/gia-ty-chan-dong.test.mjs scripts/cam-mau-s03.test.mjs`.

### Task 2: thước dữ liệu thật so-gia-ty-sau-khoang-trang.mjs (independent: false; phục vụ E6)

**Files:** Create `pipeline/scripts/so-gia-ty-sau-khoang-trang.mjs`

- [ ] So mọi trường `parsePost` bản nền `ec899d03` với bản cây trên mọi bài S03 (`loadStgPosts`, READ ONLY). TRƯỢT khi 0 bài,
  khi đổi SĐT, khi bài đổi không mang nhãn quan hệ (giá mới = số tiền trong chữ; trường khác chỉ null → số đuôi).
- [ ] Lượt đối chứng: bản sao bỏ điều kiện nhóm cuối `000` + bài tổng hợp «Cho thuê 9tr LH 2.098.765.432 1 T.Lan» phải TRƯỢT.
- [ ] Verify: `cd pipeline && node scripts/so-gia-ty-sau-khoang-trang.mjs` (exit 0).

### Task 3: tài liệu (independent: true; không eval)

**Files:** `pipeline/CLAUDE.md` (dòng transform-zalo), `docs/ROADMAP.md` (as-built).

- [ ] Một dòng mỗi tệp. Verify: `cd pipeline && npm test`, rồi `/verify` trước commit.
