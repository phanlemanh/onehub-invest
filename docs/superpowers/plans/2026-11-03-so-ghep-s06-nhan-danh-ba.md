# Số ghép S06: danh bạ và nhãn — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Số S06 chỉ vào danh bạ khi có dấu trực tiếp, và mọi số S06 không có dấu ấy hiện trên Invest kèm nhãn «Chưa xác minh», để áp được 068.

**Architecture:** Một luật danh sách dương theo `field_provenance.seller_phone.rule_id = 's06-so-tren-tin'`, dùng ở danh bạ và ở cột tính `seller_phone_inferred` của view. Cột đi lên cloud qua `CLOUD_ALLOW`; API đọc khoan dung; `OfferContact` hiện Badge.

**Tech Stack:** Node `.mjs` + `pg`, PostgreSQL view, Next.js 16, ReUI Badge.

**Spec:** `docs/superpowers/specs/2026-11-03-so-ghep-s06-nhan-danh-ba-design.md`, `_acceptance/so-ghep-s06-nhan-danh-ba/`.

## Global Constraints

- Không áp 068, 070 lên DB `oneinvest`, không ghi thật, không áp cloud. Test dùng `pipeline/lib/luoc-do-rieng.mjs`; đo dùng `db/db-thu.sh oneinvest_sg`.
- Không sửa migration đã commit. Số 070 chờ điều phối liên làn xác nhận; 067 đang để trống.
- `field_provenance` không lên cloud. Tên nguồn thật không vào mã, log, tệp công khai; chỉ `S0x`.
- Đầu ra lệnh đo không chứa SĐT.
- UI: `Badge` từ `@/components/reui/badge`, `variant="warning-light"`, cỡ mặc định, không đặt class cỡ. Chữ đúng «Chưa xác minh».
- Không sửa nhánh `claude/sdt-s06-ghep-tai-khoan` từ vòng này.

## Review Focus

- Tin S06 có số mà `field_provenance` là NULL hoặc thiếu khoá: danh bạ không sinh bí danh, view trả true. Ghim ở Task 1, Task 2.
- `sellersThieu` chạy khi view chưa có cột 070: câu đọc theo `field_provenance`, không đọc cột mới, nên không lỗi. Ghim ở Task 1.
- `ganSdtS06` với `sql` truyền vào từ test đột biến: tham số `$1` vẫn phải được bind. Ghim ở Task 2.
- Cloud chưa có cột: `to_jsonb(o) ->> 'seller_phone_inferred'` trả NULL, không lỗi; có số thì coi là true; không số thì false. Ghim ở Task 4.
- Trang Cho thuê dùng cùng `OfferCard`: prop phải đi qua cả hai trang. Ghim ở Task 5 (E8u có ảnh trang thuê).

---

### Task 1: Danh bạ chỉ nhận số có dấu trực tiếp

Phục vụ E1, E2, E3. `independent: true`.

**Files:**
- Modify: `pipeline/lib/danh-ba-nguoi.mjs` (`rutDinhDanh`, `SQL.tin`, `SQL.sellersThieu`)
- Create: `pipeline/scripts/so-ghep-s06.test.mjs`

**Interfaces:**
- Produces: hằng `RULE_TRUC_TIEP = "s06-so-tren-tin"` export từ `pipeline/lib/danh-ba-nguoi.mjs`; `rutDinhDanh(tin, baiTheoId)` nhận thêm `tin.field_provenance`.

- [ ] Viết ca đỏ `SG-AC-1` với bảng 12 ô (S06, S03, S05 × trực tiếp, ghép, mất dấu, không số), số ô assert bằng 12, assert bí danh, người, vai từng ô. S06 trực tiếp và ghép ghi bằng `ganSdtS06` thật; mất dấu xoá khoá sau khi ghi.
- [ ] Viết `SG-AC-2a`, `SG-AC-2b` so tập cặp (bí danh, người) ở ba mốc: ẩn số diff rỗng; số thứ hai diff đúng cặp của số trực tiếp mới; chạy lại diff rỗng; assert `seller_phone` tin ghép đã null.
- [ ] Viết `SG-AC-3` trên view `sellers` thật, có đối chứng dương số trực tiếp thiếu bí danh.
- [ ] Chạy `node --test pipeline/scripts/so-ghep-s06.test.mjs`. Kỳ vọng: đỏ ở ô `S06-ghep`, `S06-mat-dau`.
- [ ] `SQL.tin` đọc thêm `field_provenance`. `rutDinhDanh`: với S06, `sdt` chỉ khác null khi `field_provenance?.seller_phone?.rule_id === RULE_TRUC_TIEP`. Nguồn khác không đổi.
- [ ] `SQL.sellersThieu` thêm vế loại `o.source = 'S06' AND o.field_provenance -> 'seller_phone' ->> 'rule_id' IS DISTINCT FROM 's06-so-tren-tin'`.
- [ ] Thêm chiều đỏ: đảo luật thành chỉ loại dấu ghép thì ca nêu `S06-mat-dau`.
- [ ] Chạy lại lệnh trên và `node --test pipeline/scripts/bait-gap-sellers.test.mjs`. Kỳ vọng: xanh.
- [ ] Commit `feat(pipeline): danh bạ S06 chỉ nhận số có dấu trực tiếp`.

### Task 2: Migration 070 và bộ gán chờ nhãn

Phục vụ E4, E5. `independent: false`, dùng fixture Task 1.

**Files:**
- Create: `db/migrations/070_nhan_so_ghep.sql` (qua skill `/new-migration`, bỏ bước áp vào DB local dùng chung)
- Create: `pipeline/lib/nap-070.mjs`
- Modify: `pipeline/gan-sdt-s06.mjs`, `pipeline/scripts/so-ghep-s06.test.mjs`

**Interfaces:**
- Produces: `daCoNhan070(client): Promise<boolean>` và `nap070(client)` ở `pipeline/lib/nap-070.mjs`, cùng khuôn `nap-068.mjs`.
- `SQL_GAN` nhận `$1::boolean` cho phép ghép; `ganSdtS06` bind `[await daCoNhan070(client)]`.

- [ ] Viết `SG-AC-4`: ô trực tiếp, ghép ghi bằng `ganSdtS06` rồi `resolve_offer_fields`; ma trận năm ô, số assert bằng 5; cột mới đứng cuối; md5 từng dòng của view trên cột cũ và của `sale_offer_records` trước sau bằng nhau; áp hai lần; chiều đỏ view chỉ nhận dấu ghép.
- [ ] Viết `SG-AC-5` qua `runTransformChotot`: chưa có cột thì số ghép không ghi, số trực tiếp có ghi, log chứa `CHUA-AP-070`; có cột thì ghi; ghi đè view về bản cũ giữa hai lượt thì lại in `CHUA-AP-070`.
- [ ] Chạy test. Kỳ vọng: đỏ vì chưa có tệp 070.
- [ ] Viết 070: `CREATE OR REPLACE VIEW sale_offers AS SELECT <thân 059>, (source = 'S06' AND seller_phone IS NOT NULL AND field_provenance -> 'seller_phone' ->> 'rule_id' IS DISTINCT FROM 's06-so-tren-tin') AS seller_phone_inferred FROM sale_offer_records WHERE …`, liệt kê cột từ định nghĩa hiện hành.
- [ ] `SQL_GAN` chuyển ô `ghep` thành `giu` khi `$1` false. `ganSdtS06` in `gán SĐT S06: CHUA-AP-070 — …` khi false và không ném lỗi. Giữ nhánh `CHUA-AP-068`.
- [ ] Chạy test `gan-sdt-s06.test.mjs` và `so-ghep-s06.test.mjs`. Kỳ vọng: xanh; sửa ca cũ cần cột bằng cách `nap070` trong fixture.
- [ ] Commit `feat(db): 070 nhãn số chưa xác minh, bộ gán chờ nhãn`.

### Task 3: Nhãn lên cloud và tệp năm mốc

Phục vụ E6. `independent: false`, cần cột của Task 2.

**Files:**
- Modify: `pipeline/sync-cloud.mjs` (`CLOUD_ALLOW.sale_offers`), `pipeline/sync-cloud.test.mjs`
- Create: `docs/ops/cloud-schema-catchup-2026-11-03-so-ghep.sql`, `pipeline/scripts/so-ghep-s06-cloud.itest.mjs`

- [ ] Viết itest: sync thật từ view tới lược đồ tạm vai cloud; dòng ghép true, dòng trực tiếp false; `field_provenance` không tới; `piiColumnLeaks` chặn khi cố thêm; lược đồ thiếu cột thì sync chạy tiếp, log chứa «lệch schema»; tệp catch-up chạy thật hai lần; đầu tệp khớp năm tên mốc: gộp, kéo về, áp cloud, áp 070, áp 068.
- [ ] Chạy `sg_sync`. Kỳ vọng: đỏ.
- [ ] Thêm `seller_phone_inferred` vào `CLOUD_ALLOW.sale_offers`. Viết tệp catch-up theo khuôn `cloud-schema-catchup-2026-11-02-tin-rao.sql`: `ADD COLUMN IF NOT EXISTS seller_phone_inferred boolean`.
- [ ] Chạy `sg_sync`. Kỳ vọng: xanh.
- [ ] Commit `feat(sync): đưa nhãn số chưa xác minh lên cloud`.

### Task 4: API báo số chưa xác minh

Phục vụ E7, E7b. `independent: false`, cần tên cột Task 2.

**Files:**
- Modify: `app/src/lib/offers-public.ts`, `app/src/app/api/v1/listings/[id]/contact/route.ts`, `app/src/lib/api-surface.ts` nếu `check-api-surface` đòi
- Create: `app/tests/so-ghep-nhan.test.tsx`

**Interfaces:**
- Produces: mỗi tin trong danh sách có `phoneInferred: boolean`; `getOfferPhone(id): Promise<{ phone: string; inferred: boolean } | null>`; `/contact` trả `{ phone, inferred }`.

- [ ] Viết ca đỏ ma trận năm ô (ghép, trực tiếp, không số, có số mà cột NULL, lược đồ không có cột) trên hai route thật; so khoá cũ với danh sách viết trước; bốn ca 404 cùng thân; JSON danh sách không khớp mẫu SĐT.
- [ ] Chạy `sg_api`. Kỳ vọng: đỏ nêu `phoneInferred`.
- [ ] Câu đọc: `o.seller_phone IS NOT NULL AND coalesce(to_jsonb(o) ->> 'seller_phone_inferred', 'true') <> 'false' AS phone_inferred`, ở cả danh sách và `getOfferPhone`.
- [ ] Chạy `sg_api`, `sg_be_mat`, `app/tests/tin-rao-cong-khai.test.tsx`. Kỳ vọng: xanh.
- [ ] Commit `feat(api): báo số chưa xác minh, thiếu cột vẫn không lỗi`.

### Task 5: Badge trên thẻ tin

Phục vụ E8, E8u. `independent: false`, cần khuôn Task 4.

**Files:**
- Modify: `app/src/components/listing/offer-contact.tsx`, `app/src/components/listing/offer-card.tsx`
- Create: `app/tests/so-ghep-nhan-giao-dien.test.tsx`

**Interfaces:**
- Consumes: `phoneInferred` của Task 4.
- Produces: `OfferContact({ offerId, hasPhone, inferred })`.

- [ ] Viết kế hoạch ReUI trong tin nhắn trước khi sửa UI, theo `.agents/skills/reui/SKILL.md`.
- [ ] Viết ca đỏ trên `OfferCard` thật với dữ liệu theo khuôn API: năm trạng thái `ST-lien-he-*`, số trạng thái assert bằng 5; Badge có biến thể `warning-light`, không có class cỡ tự đặt; chiều đỏ bỏ Badge nêu `ST-lien-he-ghep`.
- [ ] Chạy `sg_ui`. Kỳ vọng: đỏ.
- [ ] `OfferContact` bọc nội dung trong hàng `flex flex-wrap items-center gap-2`, thêm `<Badge variant="warning-light">Chưa xác minh</Badge>` khi `inferred` và có số, ở cả ba nhánh nút, số, lỗi. `OfferCard` truyền `o.phoneInferred`.
- [ ] Chạy `sg_ui`, `app/tests/tin-rao-giao-dien.test.tsx`, `cd app && npx tsc --noEmit && npm run lint`. Kỳ vọng: xanh.
- [ ] Chạy self-check ReUI trên tệp đã đổi, tối đa hai vòng.
- [ ] Commit `feat(listing): Badge Chưa xác minh trên thẻ tin`.

### Task 6: Lệnh đo trên bản sao dữ liệu thật

Phục vụ E9. `independent: false`, cần Task 1, Task 2.

**Files:**
- Create: `pipeline/do-so-ghep-s06.mjs`, thêm ca đột biến vào `pipeline/scripts/so-ghep-s06.test.mjs`

**Interfaces:**
- Produces: `kiemBatBienSoGhep(so): string[]`; dòng in khoá `bi_danh_moi`, `nguoi_moi`, `nguoi_khong_tin`, `sellers`, `nhan_ban`, `nhan_thue`, `so_ghep_ra_so`, `so_ghep_ra_so_neu_bo_nhanh`.

- [ ] Viết ca đột biến: `kiemBatBienSoGhep` đỏ khi `so_ghep_ra_so > 0`, `so_ghep_ra_so_neu_bo_nhanh = 0`, `bi_danh_moi = 0`, tổng nhãn khác số tin không có dấu trực tiếp; lệnh thoát 2 khi tên DB là `oneinvest`.
- [ ] Viết lệnh: kiểm tên DB, đọc số trước, `nap068`, `nap070`, `ganSdtS06`, `dungNguoi`, đọc số sau, in qua `inKhongSo`, thoát 1 khi bất biến sai.
- [ ] Chạy `sg_do` nền. Kỳ vọng: thoát 0, không có SĐT; đưa số thật vào bằng chứng.
- [ ] Commit `feat(pipeline): lệnh đo số ghép trên DB thử`.

### Task 7: Tài liệu

Phục vụ E10. `independent: true`.

**Files:**
- Modify: `CONTEXT.md`, `pipeline/mappings.yaml`, `docs/superpowers/specs/2026-11-02-sdt-s06-ghep-tai-khoan-design.md`, `docs/ROADMAP.md`

- [ ] `CONTEXT.md`: thuật ngữ «Chưa xác minh» (nhãn · code `seller_phone_inferred` · slug không có · định nghĩa · `_Avoid_`).
- [ ] `pipeline/mappings.yaml`: khai `seller_phone_inferred` đủ sáu điều kiện ADR-0011; sửa ghi chú `seller_phone` đã lỗi thời.
- [ ] Thiết kế cũ: dòng đính chính mục hạ nguồn và OOS-2, trỏ sang hồ sơ này.
- [ ] ROADMAP §2, §4: thứ tự 070 trước 068, phần cloud, năm mốc.
- [ ] Commit `docs: số ghép S06, nhãn và thứ tự áp`.
