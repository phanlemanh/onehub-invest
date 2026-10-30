# gop-tin-chi-anh-o-transform (PL28) Implementation Plan

> **For agentic workers:** thực thi tuần tự trong phiên (Native). Steps dùng checkbox (`- [ ]`).

**Goal:** ảnh của tin chỉ-ảnh S03 vào offer của tin chữ gần nhất cùng người (dưới 2 phút) trong bảng `media`.

**Architecture:** hàm thuần `pipeline/lib/gop-anh.mjs` (nhận diện + gán); `transform-media.mjs` nối bài ảnh đã gán vào danh
sách bài của offer trước `mediaRowsFromPosts`. `sale_offers`, `stg_zalo_posts` chỉ đọc.

**Tech Stack:** Node ESM, `node:test`, pg.

**Spec:** `docs/superpowers/specs/2026-10-30-gop-tin-chi-anh-o-transform-design.md` · hợp đồng `_acceptance/gop-tin-chi-anh-o-transform/`
(Hỏi-1: gần nhất, ngưỡng ≥ 45%; Hỏi-2: bảng ảnh).

## Global Constraints

- Cửa sổ `< 120` giây; cùng `conversation_id` và `sender_id`; hoà → bài chữ đứng sau ảnh, rồi `post_id` nhỏ hơn.
- Chỉ nguồn S03; S05 giữ nguyên. Không đổi `mediaRowsFromPosts`, `PHONE_RE`, `sale_offers`.
- Ca DB và thước chỉ chạy trên DB thử `oneinvest_p1_n1`, giao dịch ROLLBACK.
- Không đưa tên miền thật của nguồn vào mã, test, tài liệu.

## Review Focus

- Bài chữ gần nhất không thuộc offer → ảnh không vào đâu (AC-4).
- Bài chữ mới gần hơn tới sau → lượt kế gỡ ở offer cũ (AC-3b).
- Bài thử bị gạt (dùng `loadStgPosts`).
- Bài chỉ-ảnh không cột ảnh → không sinh dòng, không làm lệch thước.
- Ảnh trùng URL/tệp với ảnh có sẵn của offer → bỏ trùng như NH1.

---

### Task 1: lib/gop-anh.mjs + ma trận GA-AC-1/2 (independent: false; phục vụ E1, E2, E7)

**Files:** Create `pipeline/lib/gop-anh.mjs`, `pipeline/scripts/gop-anh.test.mjs`

**Interfaces — Produces:** `laChiAnh(text: string|null): boolean`; `ganBaiAnh(baiChu, baiAnh, { cuaSoGiay = 120 }): Map<string, string>`
(bài: `{ post_id, posted_at, sender_id, conversation_id }`); `CUA_SO_GIAY = 120`.

- [ ] Viết ma trận GA-AC-1 (6 dòng) và GA-AC-2 (9 dòng) kèm ca đỏ: BO_GAT_URL, BO_CUNG_NGUOI, NHO_HON_BANG, LAY_DAU_TIEN.
- [ ] Cài hàm. Verify: `cd pipeline && node --test scripts/gop-anh.test.mjs`.

### Task 2: transform-media nối bài ảnh + ca DB GA-AC-3/3b/4/5 (independent: false; phục vụ E3–E5, E7c)

**Files:** Modify `pipeline/transform-media.mjs` (`dungDong`) · Create `pipeline/scripts/gop-anh.itest.mjs`

**Interfaces — Consumes:** Task 1. **Produces:** `baiAnhCuaTin(c): Promise<Map<offer_id, post[]>>` (export để thước dùng).

- [ ] Ca DB: offer tổng hợp + bài chỉ-ảnh trong/ngoài cửa sổ, hai lượt, lượt ba có bài chữ gần hơn (offer khác / không offer),
  bài gần tin chữ không offer, băm stg + sale_offers trước/sau; ca đỏ: BO_NOI, BO_XOA (DELETE → SELECT), LOC_OFFER.
- [ ] Cài. Verify: `bash db/db-thu.sh oneinvest_p1_n1 && cd pipeline && DATABASE_URL=…/oneinvest_p1_n1 node --test scripts/gop-anh.itest.mjs scripts/media-canonical.itest.mjs`.

### Task 3: thước do-gop-anh.mjs (independent: false; phục vụ E6)

**Files:** Create `pipeline/scripts/do-gop-anh.mjs`

- [ ] Một giao dịch ROLLBACK: transform-media bản nền ghim (git show) → «trước»; cây → «sau»; ngưỡng đọc từ opportunity.md;
  ngày mẫu 2026-10-28 so tập cặp SQL độc lập với tập cặp từ `media` hai chiều; lượt đối chứng bỏ điều kiện cùng người.
- [ ] Verify: `DATABASE_URL=…/oneinvest_p1_n1 node scripts/do-gop-anh.mjs` exit 0.

### Task 4: tài liệu (independent: true; không eval)

**Files:** `pipeline/CLAUDE.md` (dòng transform-media), `docs/ROADMAP.md` (as-built).
