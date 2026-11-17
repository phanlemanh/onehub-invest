# Trang Danh bạ chỉ đọc — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — làm tuần tự trong phiên dãy U2).

**Goal:** Đo trang `/ops/registry` (đã dựng ở bản bấm được, Cổng Phạm vi Mạnh duyệt 17/11) bằng hai bộ test theo `evals.yaml`.

**Architecture:** Mã trang đã có (`lib/ops/registry/{doc,du-an,cay}.ts`, `components/ops/registry/*`, hai route). S3 chỉ
thêm test: một bộ trên lược đồ tạm `tdb_<pid>` của DB lượt (`db/db-thu.sh`) với view thật dựng lại từ `pg_get_viewdef`, một
bộ đối chiếu chỉ-đọc trên DB máy thu.

**Tech Stack:** node --test + tsx, pg, react-dom/server `renderToStaticMarkup`.

**Spec:** `docs/superpowers/specs/2026-11-17-trang-danh-ba-chi-doc-design.md` · hợp đồng `_acceptance/trang-danh-ba-chi-doc/contract.md`.

## Global Constraints

- Chỉ SELECT trên `:5433/oneinvest`; ghi chỉ trong lược đồ tạm của DB lượt (khoá executor `tdb_app`).
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp ghim «TDB-AC-n …».
- Không đọc `source_registry` trong mã trang; test được đọc để lấy danh sách tên cho bộ quét.

## Review Focus

- Nút con mang id nhỏ hơn cha → cây trang dự án vẫn đủ nút (ma trận đặt K2 id < K1).
- Toà merged, căn retired → không đếm (đột biến bỏ lọc active).
- Tin `xung_dot` → không đếm (đột biến bỏ lọc `mot_du_an`).
- Phân khu mở như dự án → 404 (đột biến nhận mọi node_type).
- Tên nguồn thật trong mã căn/trục → che (đột biến bỏ che ở trang dự án).

---

### Task 1: `app/tests/registry-chi-doc.test.tsx` — E1–E8, E11

**Files:** Create `app/tests/registry-chi-doc.test.tsx`. Modify `app/src/components/ops/registry/registry-grid.tsx`
(prop `locBanDau`, `hopLoc` xuất ra, honour `negated`).

**Interfaces:** Consumes `docDanhBa(q)`, `docDuAn(id, q)`, `parseNodeId`, `dungCay`, `khopTim`, `RegistryContent`,
`DuAnContent`, `RegistryGrid({rows, locBanDau})`, `RegistrySkeleton`, `oSo`.

- [ ] Lược đồ tạm: bảng `LIKE public … INCLUDING DEFAULTS INCLUDING CONSTRAINTS`; view `sale_offers`,
  `s06_offer_project`, `offer_project`, `v_s09_du_an_moi` dựng lại từ định nghĩa public trong lược đồ tạm.
- [ ] Ma trận sáu nút + vật thể + tin + nguồn + areas như E2/E3/E4/E7 của `evals.yaml`, bảng kỳ vọng viết trước.
- [ ] Mỗi ca kèm đột biến chép mã sang `app/tests/.tdb-cu-<pid>/`, đổi đúng một chỗ, ghim thông điệp.
- [ ] Chạy: `cd app && bash ../db/db-thu.sh oneinvest_suite_tdb --chay node --import tsx --test --test-concurrency=1 tests/registry-chi-doc.test.tsx` → pass hết.

### Task 2: `app/tests/registry-doi-chieu.test.tsx` — E14

**Files:** Create `app/tests/registry-doi-chieu.test.tsx`.

- [ ] Một giao dịch `BEGIN READ ONLY` trên `:5433/oneinvest`; so `docDanhBa(client)` với `count(*)` độc lập; HTML
  `/ops/registry` + mọi `/ops/registry/<id>` có toà quét `findSourceNames` = 0; đếm mười bảng trước = sau; đối chứng
  dương bộ quét.
- [ ] Chạy: `cd app && node --import tsx --test tests/registry-doi-chieu.test.tsx` → pass.
