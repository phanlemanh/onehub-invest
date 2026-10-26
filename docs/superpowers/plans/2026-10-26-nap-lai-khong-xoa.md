# Nạp lại không xoá (PL14) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tin và listing không còn bị xoá khi nạp lại.
- Chỉ nghỉ (`retired_at`), quyết định đi theo tin kế.
- Khoá tin S03/S05 bền (khoá dính).
- Khoá ngoại thành RESTRICT.
- Chỗ đọc thấy đúng như cũ qua view sống.

**Architecture:**
- Migration 044 đổi tên `sale_offers` → `sale_offer_records`, `listings` → `listing_records`, thêm cột nghỉ; tạo lại tên cũ làm
  VIEW `WHERE retired_at IS NULL` (lối A, PL14-Hỏi-1).
- Đường ghi (transform, đối soát, reassign) nhắm bảng bản ghi.
- Chỗ đọc (app, data-api, pipeline sql, sync-cloud) giữ tên cũ.

**Tech Stack:** PostgreSQL 16 + PostGIS (DB local :5433), Node ESM `node --test`, `pg`.

**Spec:** `docs/superpowers/specs/2026-10-26-nap-lai-khong-xoa-design.md` · hợp đồng `_acceptance/nap-lai-khong-xoa/contract.md`
(duyệt 26/10: lối A, đổi khoá ngay, khoá dính) · evals `_acceptance/nap-lai-khong-xoa/evals.yaml`.

## Global Constraints

- Migration mới đúng tên `db/migrations/044_nap_lai_khong_xoa.sql`, idempotent, một giao dịch, áp local theo
  `.claude/rules/migrations.md`. KHÔNG áp Supabase.
- Không sửa `collector/`, importer `stg_*`, migration đã commit.
- `retired_reason` CHECK ∈ {`het_trong_luot`, `ngoai_phuong`, `doi_khoa`}.
- Không câu `DELETE FROM`/`TRUNCATE` nào trên bốn tên bảng trong `pipeline/` sau vòng (trừ test).
- Mọi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp ghim.
- Ca DB chạy trong `BEGIN … ROLLBACK`; DB thật không đổi.

## Review Focus

1. **Upsert qua view một tin đã nghỉ**: `ON CONFLICT` cập nhật hàng nghỉ mà không gỡ `retired_at`. Người mong tin quay lại
   phải sống lại. Ghi thẳng bảng bản ghi và đặt `retired_at = NULL` khi tin có lại (Task 3).
2. **View phụ thuộc cũ** trỏ theo OID sang bảng bản ghi sau RENAME. Dựng lại `v_ruler_p2*`; kiểm pg_depend (Task 1).
3. **Quyền và RLS** trên view mới: anon/authenticated phải thấy như trước. Sao chép GRANT của bảng cũ sang view (Task 1).
4. **Đổi khoá lần đầu với tin S03/S05 có thẻ `enrich:`**: thẻ chuyển sang tin mới, không thành zombie (Task 3, đo ở Task 6).
5. **Lượt thu bù kéo bài cũ hơn neo** không đổi khoá (khoá dính) (Task 2).

---

### Task 1: Migration 044 + test DB lược đồ

phục vụ E1, E2 · independent: false

**Files:** Create `db/migrations/044_nap_lai_khong_xoa.sql`, `pipeline/scripts/nap-lai-db.itest.mjs`.

**Migration 044, theo thứ tự:**
1. RENAME hai bảng; thêm cột:
   - `retired_at timestamptz`;
   - `retired_reason text` + CHECK;
   - `superseded_by text REFERENCES sale_offer_records(offer_id) ON DELETE RESTRICT` (chỉ cho tin);
   - `originating_system_key text`.
2. Điền `originating_system_key`:
   - S06 = `list_id`, suy từ `stg_chotot_ads` bằng băm như `resolve-properties`;
   - S03/S05 = phần tử `post_ids` có `posted_at` sớm nhất, nối `stg_zalo_posts`;
   - listings = bỏ tiền tố `abnb_`.
3. `CREATE VIEW sale_offers` / `listings` `AS SELECT * FROM <records> WHERE retired_at IS NULL`; chép GRANT.
4. DROP và tạo lại 6 khoá ngoại sang bảng bản ghi, `ON DELETE RESTRICT`.
5. `CREATE OR REPLACE VIEW v_ruler_p2_area`, `v_ruler_p2` trên view mới (nguyên văn định nghĩa 034).
6. `CREATE OR REPLACE FUNCTION reconcile_stale_offers` bản mới (Task 3 định nghĩa hành vi; SQL nằm ở đây).
7. Idempotent: khối `DO` kiểm `to_regclass`/`pg_constraint` trước mỗi bước.

- [ ] **Step 1:** Viết ca ND-AC-1 và ND-AC-2 theo E1/E2. Dựng tiền đề trong giao dịch: bảng chưa đổi tên thì áp, đã áp
  thì kiểm idempotent.
- [ ] **Step 2:** FAIL → viết 044 → PASS.
- [ ] **Step 3:** Áp local hai lần, rồi chạy suite app (`tsc`, test) + `data-api` typecheck + pipeline.
- [ ] **Step 4:** Commit.

### Task 2: Khoá dính cho S03/S05

phục vụ E4 · independent: false

**Files:**
- Create `pipeline/lib/offer-key.mjs`.
- Modify `pipeline/transform-zalo.mjs:179`, `pipeline/transform-fb.mjs:89`.
- Test `pipeline/scripts/nap-lai.test.mjs`.

**Interfaces:**
- `anchorPost(posts: {post_id, posted_at}[]): string` — post sớm nhất, hoà thì `post_id` nhỏ nhất.
- `assignOfferIds(source, groups: {posts}[], existing: Map<post_id, offer_id>): {offer_id, originating_system_key}[]`
  - nhóm có post đã thuộc một offer thì thừa kế `offer_id` của offer có chung nhiều post nhất (hoà thì `offer_id` nhỏ nhất);
  - nhóm mới hoàn toàn thì `offer_id = 'offer_' + sha256(source + '|' + anchor)[:16]`.
- Transform đọc `existing` từ `sale_offer_records` (`unnest(post_ids)`).

- [ ] Viết ma trận 6 dòng NL-AC-4 + đối chứng (E4) → FAIL → cài → PASS → commit.

### Task 3: Đường ghi không xoá + đối soát chuyển dòng con

phục vụ E3, E5 · independent: false

**Files:** Modify `pipeline/lib/write-offers.mjs`, `db/migrations/044…` (hàm), `pipeline/transform-chotot.mjs`.

**`writeOffers`:**
- upsert vào `sale_offer_records` với `retired_at = NULL`, `retired_reason = NULL` trong `SET`;
- bỏ yêu cầu hàm 039 cũ, đổi sang kiểm hàm 044 (chữ ký thêm `p_reason`).

**`reconcile_stale_offers(p_source, p_live, p_actor)` bản 044, với mỗi offer vắng:**
- tìm offer kế y (chung post nhiều nhất);
- chuyển đề xuất enrich như 039;
- chuyển `property_offers` (`ON CONFLICT DO NOTHING` rồi xoá dòng cũ của bảng con — dòng con, không phải tin);
- chuyển `property_candidates` có `status IN ('merged','rejected')` (đổi `offer_a`/`offer_b`);
- chuyển thẻ `review_queue` `enrich:` / `pair:` (`item_id`);
- đặt `retired_at`, `retired_reason`, `superseded_by`;
- lý do: `doi_khoa` khi y mang khoá mới cùng post neo, ngược lại `het_trong_luot`;
- không có y: không chuyển, ghi `ops_audit` ảnh chụp.

`transform-chotot` upsert vào `sale_offer_records`.

- [ ] Viết ND-AC-3 + ND-AC-5 → FAIL → cài → PASS. Cập nhật `pipeline/scripts/write-offers.test.mjs` theo bảng mới. Commit.

### Task 4: Listing nghỉ thay xoá

phục vụ E6 · independent: false

**Files:** Modify `pipeline/reassign-areas.mjs:197-205`, `pipeline/transform-airbnb.mjs:142`, `pipeline/sql/200_transform.sql:64`.

- **reassign:** `UPDATE listing_records SET retired_at = now(), retired_reason = 'ngoai_phuong' … RETURNING`; bước gán phường
  nhắm `listing_records` và gỡ `retired_at` khi có phường.
- **transform-airbnb:** cùng cách cho id ngoài phường; upsert listing có phường thì `retired_at = NULL`.
- **200_transform:** chỉ `DELETE FROM nights` của listing sống (`WHERE listing_id IN (SELECT id FROM listings)`).
- Xuất khẩu hàm thuần để test gọi; tuân khuôn lối vào `realpathSync`.

- [ ] Viết ND-AC-6 (hai đường + 200) → FAIL → cài → PASS → commit.

### Task 5: Quét DELETE + sync chép cha sống

phục vụ E8, E9, E9b · independent: false

**Files:**
- Create `pipeline/lib/scan-delete.mjs`; test vào `nap-lai.test.mjs`.
- Modify `pipeline/sync-cloud.mjs`: thêm `childFilterSql(table)` dùng trong câu chọn `nights`, `listing_stats`,
  `property_offers` (`WHERE <fk> IN (SELECT … FROM <view sống>)`).

`scanDeletes(root): {path, line, text}[]` mở rộng `scanDeleteAll` cho bốn tên bảng.

- [ ] Viết NL-AC-8 (cây thật + cây giả cấy), ND-AC-9 → FAIL → cài → PASS. `pipeline npm test` xanh. Commit.

### Task 6: Thước bật ba lượt

phục vụ E7 · independent: false

**Files:** Create `pipeline/scripts/nap-lai-ba-luot.mjs`.

**Cách chạy:**
- một client, `BEGIN`;
- chụp ma trận 7 hàng × 2 cột;
- ba lượt hàm transform: S03 → S05 → S06 → airbnb/reassign;
- biến mỗi lượt: đổi giá một tin S03 trong stg tạm, đổi `rule_id` qua biến môi trường parser, dời toạ độ một listing;
- chụp lại; in bảng; `ROLLBACK`.

**Cờ đối chứng `--doi-chung=039|khong-chuyen`:** thay hàm đối soát bằng bản giả lập trong giao dịch.

**Mã thoát:** 0 khi mất = 0; 1 khi có mất, nêu hàng.

- [ ] Chạy ba chế độ, ghi kết quả → commit.

### Task 7: SQL bắt kịp cloud + tài liệu

phục vụ E10 · independent: false

**Files:**
- Create:
  - `docs/ops/cloud-schema-catchup-2026-10-26-043.sql` (chép byte tệp giám sát đã áp);
  - `docs/ops/cloud-schema-catchup-2026-10-26-044.sql` (khối `-- ĐO TRƯỚC` chỉ SELECT; khối `-- ÁP`);
  - `scripts/check-cloud-catchup.mjs` + test.
- Modify:
  - `docs/ROADMAP.md`: dòng PL6 «chưa đẩy Supabase» → «đã áp 26/10»; thêm dòng PL14;
  - `pipeline/CLAUDE.md`.

- [ ] Đo cloud chỉ đọc (lược đồ `public.sale_offers`/`listings`/FK) qua đường đọc của `sync-cloud` (`mgmtExec` SELECT) — nếu không
  có token ở worktree thì ghi «chưa đo được ở đây» trong khối ĐO TRƯỚC.
- [ ] Viết `check-cloud-catchup` + đối chứng → commit.
- [ ] Chạy đủ mọi lệnh của `evals.yaml` → contract `status: implemented`.
