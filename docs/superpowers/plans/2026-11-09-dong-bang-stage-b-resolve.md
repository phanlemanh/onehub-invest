# Đóng băng Stage B và thẻ Ghép căn — kế hoạch thi công

> For agentic workers: thực thi tuần tự trong phiên (T2, các task chạm chung `_acceptance/config.yaml` và test app).

**Goal:** Stage B không dựng cặp, judge-run không gieo thẻ, thẻ Ghép căn đang chờ không hiện và không được đếm ở mọi bên đọc; dữ liệu giữ nguyên.

**Architecture:** Bỏ khối Stage B khỏi `chayResolve`; chặn `main` của judge-run; một vị từ SQL `THE_DONG_BANG_SQL` (TS) chép nguyên văn sang các bên đọc `.mjs`, mọi câu đọc thẻ chờ thêm `NOT <vị từ>`; một test quét toàn cây giữ luật.

**Spec:** `docs/superpowers/specs/2026-11-09-dong-bang-stage-b-resolve-design.md` · hợp đồng `_acceptance/dong-bang-stage-b-resolve/contract.md`.

## Global Constraints

- Vị từ đúng chuỗi: `(item_type = 'entity_match' AND status = 'pending')`.
- Dòng log Stage B: `Stage B: đóng băng (V7) — không dựng cặp mới`.
- Dòng judge-run: `judge-run: Ghép căn đóng băng (V7) — không chấm, không gieo hay rút thẻ`.
- Không migration, không câu ghi mới vào `review_queue`, `property_candidates`, `property_offers`, `properties`; không sửa route decide.
- Test DB chạy trên `db/db-thu.sh` (không ghi DB `oneinvest`).

## Review Focus

1. Thẻ Ghép căn `deferred` (hoãn) phải còn hiện ở «Đã quyết» — vị từ chỉ bắt `pending` (E3 G5).
2. `?card=<thẻ chờ đóng băng>` phải ra «Không tìm thấy thẻ», không lỗi (E3).
3. «Đã quyết hôm nay» vẫn tính thẻ Ghép căn quyết trong ngày (E4).
4. Bộ đọc HD11 trả rỗng vì lỗi SQL phải đỏ, không xanh rỗng (E4b).
5. Câu đọc chờ mới thêm sau này thiếu vị từ phải đỏ ở phép quét (E6).

---

### Task 1: Stage B đóng băng — independent: false

**Files:** Modify `pipeline/resolve-properties.mjs` · Create `pipeline/tests/resolve-properties-dong-bang.itest.mjs` · Modify `pipeline/tests/resolve-properties-deadlock.itest.mjs`, `pipeline/lib/thu-lai-deadlock.sql-base.json`, `pipeline/scripts/s03-len-cong.itest.mjs` (chú thích ca thị trường).
**Phục vụ:** E1, E9b, E9c. **Verify:** `config:executors.test.dbs_resolve`, `rtld_itest`, `s03_len_cong_db`.

### Task 2: judge-run dừng — independent: true

**Files:** Modify `agent/scripts/judge-run.ts` (`main` in dòng đóng băng, `return` trước khi mở pg/model) · Create `agent/tests/judge-run-dong-bang.test.ts`.
**Phục vụ:** E2. **Verify:** `config:executors.test.dbs_judge`, `cd agent && npm test`.

### Task 3: Lọc thẻ chờ ở app — independent: false

**Files:** Create `app/src/lib/ops/review-dong-bang.ts` (`THE_DONG_BANG_SQL`, `KHONG_DONG_BANG_SQL = "NOT " + …`) · Modify `review-nap.ts`, `review-dau-trang.ts`, `review-cho-ghep.ts` (trả `{}` không truy vấn), `components/ops/review-content.tsx` (`loadPendingCounts`), `lib/data-flow-queries.ts` · Create `app/tests/review-dong-bang.test.tsx` · Modify mồi ở `ops-duyet-nhip`, `viewer-the-duyet`, `review-queue`, `ops-duyet-hop-hang-muc`, `the-duyet-du-can-cu` (test).
**Phục vụ:** E3, E4, E5, E9. **Verify:** `config:executors.test.dbs_app`, `cd app && npx tsc --noEmit && npm run lint && npm test`.

### Task 4: Lọc ở bản tin cloud, báo cáo ngày, HD11 + phép quét — independent: false

**Files:** Modify `scripts/lib/ops-local.mjs`, `scripts/bao-cao-ngay.mjs`, `pipeline/do-the-duyet.mjs` (chép vị từ, export câu nạp) · Create `scripts/ops-local-dong-bang.test.mjs` (E4b + E6 quét toàn cây, danh sách miễn), `scripts/dong-bang-khong-ghi.test.mjs` (E7).
**Phục vụ:** E4b, E6, E7. **Verify:** `config:executors.test.dbs_mjs`, `dbs_khong_ghi`, `node --test scripts/*.test.mjs` (ca không DB).

### Task 5: Tài liệu — independent: true

**Files:** `docs/ROADMAP.md` §2 as-built + §4, `pipeline/CLAUDE.md` dòng resolve-properties.
**Phục vụ:** E8.
