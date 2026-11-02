# Căn theo tin khi phân xử lại — kế hoạch thi công

> For agentic workers: thi công tuần tự trong phiên (Native). Bước dùng checkbox.

**Goal:** căn (`properties`) của tin chung bài đăng nhận theo khi đề xuất làm giàu được áp/hoàn tác, và sửa một lần phần lệch.

**Architecture:** migration 066 thay `apply_enrichment` / `revert_enrichment` (thân 063, chỉ mở rộng tập căn của bước
cascade) + khối «-- 4. Sửa dữ liệu một lần». Bộ nạp test `pipeline/lib/nap-045.mjs` nạp thêm hàm 066.

**Spec:** `docs/superpowers/specs/2026-11-01-can-theo-tin-khi-phan-xu-lai-design.md` · hợp đồng `_acceptance/can-theo-tin-khi-phan-xu-lai/contract.md`.

## Global Constraints

- Migration mới `db/migrations/066_can_theo_tin.sql`, idempotent (`CREATE OR REPLACE`, khối sửa chỉ điền ô trống, audit chỉ khi > 0 ô).
- Không sửa migration đã commit (063 giữ nguyên). Không áp lên DB `oneinvest` — chỉ DB thử `oneinvest_p2_ct` (`bash db/db-thu.sh oneinvest_p2_ct`).
- Mọi ca itest trong `BEGIN … ROLLBACK`, giữ `pg_advisory_xact_lock(33033)`.
- Khối sửa một lần chỉ chạy khi đã cắt chuyển (`ops_audit phat-bieu:cat-chuyen`), như 063.

## Review Focus

1. Căn gắn cả tin đề xuất lẫn tin chung bài — `max()` gộp đúng, không ghi hai dòng log cho một căn trong một lượt áp.
2. Hoàn tác khi chính B còn mang giá trị — không gỡ (ô riêng trong CT-AC-2).
3. Tin chung đã nghỉ (`retired_at`) — `offers_chung_chu_the` trả cả bản ghi nghỉ; căn của nó vẫn nhận theo (đọc `sale_offer_records`, không đọc view `sale_offers` cho tập này).
4. Khối sửa một lần trên đề xuất đã `reverted` — không điền.
5. Tin không gắn căn nào — không lỗi, không dòng log.

---

### Task 1: Migration 066 + bộ nạp test  (E1–E4, E6 · không độc lập: Task 2 cần)

**Files:** Create `db/migrations/066_can_theo_tin.sql` · Modify `pipeline/lib/nap-045.mjs` (thêm `HAM_066` = 066 trước «-- 4.», nạp sau `HAM_063`).

**Interfaces:** Produces `apply_enrichment(bigint[], text) → int`, `revert_enrichment(bigint[], text, text) → int` (chữ ký 063 không đổi); `export const HAM_066`; `KHOI_SUA_066` (đoạn từ «-- 4.» tới hết) để itest gọi riêng.

- [ ] Viết 066: hai hàm = nguyên văn 063, đổi cascade:
  - áp: tập tin `T = tin của applied ∪ offers_chung_chu_the(chủ thể của chúng)`; `UPDATE properties … COALESCE(p.x, agg.x)` với `agg` nhóm theo `po.property_id` trên `T` (đọc `sale_offer_records`), dòng log `{t, src:'enrich-proposals', proposal_ids, offer_ids, actor}`;
  - hoàn tác: ba nhánh gỡ (bedrooms/bathrooms/street_raw) chạy cho `po.offer_id = ANY(ARRAY[r.offer_id] || offers_chung_chu_the(ARRAY[subj]))`, giữ điều kiện NOT EXISTS của 036; dòng `enrich-revert` cho mọi căn ấy.
- [ ] Khối sửa: với mỗi căn gắn tin chung chủ thể của tin có đề xuất `applied` (status = 'applied'), `COALESCE` ô trống từ `max()` tin gắn căn; `GET DIAGNOSTICS`/đếm ô; `ops_audit ('migration:066','can-theo-tin:sua-mot-lan-066', detail {properties, cells})` chỉ khi cells > 0.
- [ ] `nap-045.mjs`: `HAM_066`, nạp trong `napLai059` sau `HAM_063`.
- [ ] Áp 066 hai lần lên DB thử `oneinvest_p2_ct`; lần hai 0 ô, không thêm audit.
- [ ] Commit `feat(db): 066 căn theo tin chung bài đăng khi áp/hoàn tác đề xuất`.

### Task 2: Itest `pipeline/scripts/can-theo-tin.itest.mjs`  (E1–E4)

**Files:** Create test · `_acceptance/config.yaml` key `can_theo_tin` đã có.

**Interfaces:** Consumes `napPhatBieu`, `writeOffers`, `mintOfferId`, `HAM_066`, `KHOI_SUA_066`; bản cũ `ham("063_…", "apply_enrichment"|"revert_enrichment")`.

- [ ] Fixture: A, B chung post P; C riêng; D (cùng căn PB, mang sẵn giá trị) theo ô; căn PA, PB dựng bằng INSERT `properties` + `property_offers` (khuôn 027) — đối chiếu bằng truy vấn đọc lại, không tự khẳng định.
- [ ] CT-AC-1: ma trận 8 ô (máy/người × B sống/nghỉ × cùng/khác căn) + ô A≠B cùng căn (max) + ô PB có sẵn; chiều đỏ bản 063: 4 ô khác căn ném `CT-AC-1: căn tin chung bài đăng không nhận theo (<ô>)`, 4 ô cùng căn giá trị = 066 và log 063 thiếu `offer_ids`.
- [ ] CT-AC-2: ma trận 8 ô + ô D giữ + ô B còn mang (`CT-AC-2: căn mất giá trị B vẫn mang`); chiều đỏ 4 ô khác căn `CT-AC-2: căn tin chung bài đăng giữ giá trị đã rút (<ô>)`.
- [ ] CT-AC-3: C áp + hoàn tác, md5 `properties` và cột C bằng bản 063.
- [ ] CT-AC-4: lệch sinh bằng `apply_enrichment` 063 → chạy `KHOI_SUA_066`; cells = đếm độc lập; lượt hai 0; ba ô đối chứng (đã hoàn tác, căn không chung, ô có sẵn).
- [ ] Chạy trên `oneinvest_p2_ct`; commit `test(pipeline): can-theo-tin.itest (CT-AC-1..4)`.

### Task 3: Răng `rang/ap-hai-lan.mjs`  (E5)

- [ ] Dựng lại DB thử `oneinvest_p2_ct` (`db/db-thu.sh`), áp 066 lần một rồi lần hai; so `pg_get_functiondef` hai hàm + đếm `ops_audit can-theo-tin:*` trước/sau lần hai; đếm `ops_audit can-theo-tin:*` trên `oneinvest` = 0 trước và sau. Thoát 0/1, in vế lệch.
- [ ] Commit `test(acceptance): răng áp 066 hai lần`.

### Task 4: Kiểm hồi quy  (E6, E7)

- [ ] `pb_chung_bai` (phat-bieu-chung-bai.itest) trên DB thử có 066 — xanh.
- [ ] `cd pipeline && npm test` — xanh. Hạ contract `status: implemented`.
