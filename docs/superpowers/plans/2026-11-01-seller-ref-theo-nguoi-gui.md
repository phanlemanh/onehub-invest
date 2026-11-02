# seller_ref S03/S05 theo người gửi — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `seller_ref` của tin S03/S05 là `sender_id` của bài neo, không còn `author_hash` hằng.

**Architecture:** Một hàm thuần `chonNguoiGuiTin(bai)` cạnh `chonSdtTin` trong `transform-zalo.mjs`; hai transform gọi
nó khi dựng dòng tin. Ca DB và thước chạy trên DB thử, đối chứng bằng transform của commit nền `ed0ff2cd`.

**Tech Stack:** Node ESM `.mjs`, `node:test`, `pg`, PostGIS :5433.

**Spec:** `docs/superpowers/specs/2026-11-01-seller-ref-theo-nguoi-gui-design.md` · hợp đồng
`_acceptance/seller-ref-theo-nguoi-gui/contract.md` · `evals.yaml`.

## Global Constraints

- Không sửa `pipeline/sync-cloud.mjs` (giữ T2).
- Không ghi DB `oneinvest`: ca DB và thước chỉ chạy trên `DATABASE_URL` dạng `oneinvest_<dãy>_<việc>`, BEGIN…ROLLBACK.
- Thông điệp ghim đối chứng đúng chữ trong `evals.yaml`.

## Review Focus

- `sender_id` có khoảng trắng hai đầu → trim (E1).
- `posted_at` dạng chuỗi ISO khác múi giờ → so bằng thời điểm, không so chuỗi (E2).
- Bài trùng `post_id` trong một tin (repost cùng bài) → không đổi kết quả (ma trận E2).
- Tin S05 gom bài nhiều người gửi → neo theo thời gian (E4 fixture).
- Tin cũ đang mang hằng được ghi đè khi nạp lại (E7).

---

### Task 1: hàm chọn + hai transform + ca thuần — independent: false

**Files:** Modify `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs` · Create `pipeline/scripts/seller-ref.test.mjs`
**Phục vụ:** E1, E2, E3, E6
**Interfaces — Produces:** `export function chonNguoiGuiTin(bai: {post_id: string, posted_at: string|Date, sender_id?: string|null}[]): string|null`

- [ ] Viết `seller-ref.test.mjs`: ca «SR AC-1», «SR AC-2» (ma trận bốn ô), «SR AC-3», «SR AC-6» + ba đối chứng bản
  chép (`banSao` như `boc-sdt.test.mjs`) ghim `/SELLER_REF CON LA HANG/`, `/SELLER_REF KHONG THEO NEO/`,
  `/SELLER_REF ROI VE HANG/`. Chạy → đỏ (hàm chưa có).
- [ ] Thêm `chonNguoiGuiTin`; `o.posts` mang `sender_id`; hai transform ghi `seller_ref: chonNguoiGuiTin(o.posts)`, bỏ
  `authorHash`.
- [ ] Verify: `cd pipeline && node --test scripts/seller-ref.test.mjs` xanh; `npm test` không thêm ca đỏ.
- [ ] Commit.

### Task 2: ca DB — independent: false

**Files:** Create `pipeline/scripts/seller-ref.itest.mjs` · **Phục vụ:** E4, E5

- [ ] Khuôn `gop-trung-s03.itest.mjs` (`withTx`, khoá 33033, 044 + `napPhatBieu`). Gieo bài S03 (agent thường) và S05
  (`agent_id = 'apify-facebook'`) cùng `author_hash`; chạy `runTransformZalo` + `runTransformFb`; đọc lại
  `sale_offers.seller_ref`. Đối chứng: `git show ed0ff2cd:pipeline/transform-{zalo,fb}.mjs` ra thư mục tạm cạnh
  `pipeline/` (để import tương đối còn đúng), chạy cùng fixture → `/TRANSFORM NEN VAN HANG/`.
- [ ] E5: `selectList('sale_offers', ['source','seller_ref'])` của `sync-cloud.mjs` chạy trên các dòng vừa ghi → S03
  `S03:<số>` khớp `SELLER_REF_RE`, S05 đuôi chữ → NULL; giá trị thô `ct:1` không khớp `SELLER_REF_RE`.
- [ ] Verify: `bash db/db-thu.sh oneinvest_p3_sref` rồi chạy itest với `DATABASE_URL` ấy.
- [ ] Commit.

### Task 3: thước dữ liệu thật — independent: false

**Files:** Create `pipeline/scripts/do-seller-ref.mjs` · **Phục vụ:** E7, E8

- [ ] Khuôn `do-cam-mau-s03.mjs`. Hai lượt BEGIN…ROLLBACK (cây, nền `ed0ff2cd`), không xoá tin có sẵn. Người gửi bài neo
  tính bằng SQL riêng trên `stg_zalo_posts` qua `post_ids`. Thước: số ref ±1% · ref = người gửi bài neo · ref >5% chỉ
  khi đúng người · tin còn mang hằng cũ = 0. Lượt nền phải TRƯỢT. E8: so mọi cột `information_schema` trừ
  `seller_ref` và mốc giờ ghi; đối chứng đổi `n_reposts` trong giao dịch → gọi tên cột. In số tin S05 NULL trên cloud.
- [ ] Verify: chạy với `DATABASE_URL` DB thử, exit 0.
- [ ] Commit; contract `status: implemented`.
