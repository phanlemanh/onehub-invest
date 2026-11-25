# DA56 Quỹ căn và căn cao tầng S09 vào stg — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nạp hai kind DATA-CONTRACT v16 (`quy-can`, `can-cao-tang`) vào `stg_s09_danh_ba` không mang URL ảnh và toạ độ, đọc qua ba view
của migration 130, và hiện quỹ căn có giá trên `/ops/registry`.

**Architecture:** Bộ nạp S09 có sẵn nhận thêm schemaVersion 16 và gọi một hàm thuần lọc khoá theo bảng kiểm kê viết trước; migration
130 chỉ thêm view (đối soát quỹ căn, quỹ căn bản đủ, căn cao tầng bản tốt); lớp đọc của Danh bạ Ops thêm truy vấn quỹ căn và hai chỗ
hiện. Không bảng mới, không đồng bộ cloud.

**Tech Stack:** Node .mjs (`node:test`), PostgreSQL view, Next.js 16 + ReUI (`data-grid`), test route `node --import tsx --test`.

**Spec:** `docs/superpowers/specs/2026-11-25-nap-s09-quy-can-va-can-cao-tang-design.md` · hợp đồng
`_acceptance/nap-s09-quy-can-va-can-cao-tang/contract.md` · `evals.yaml`.

## Global Constraints

- Migration số 130, idempotent (`CREATE OR REPLACE VIEW`), không sửa 115/125; xếp chồng nhánh DA42.
- Khoá bỏ khỏi căn quỹ căn trước khi ghi stg: `galleries`, `geolocation` (Hỏi-2 duyệt 25/11). Raw không đổi.
- Chỉ mã `S09` trên màn, log, test, hồ sơ; không tên thật, không tên miền nguồn. Thư mục chờ có tầng A: đọc tại máy, không chép vào kho.
- Fixture trong kho rút từ khuôn bản thu thật bằng script, đã thay tên, URL (`https://cdn.gia-lap.test/...`), toạ độ (`{lat:0,lng:0}`).
- `pipeline/sync-cloud.mjs` không thêm bảng nào.
- UI theo ReUI: `data-grid`, `Skeleton`, Alert lỗi có Thử lại; chữ `text-sm`/`text-xs`; nhãn tiếng Việt.
- Lệnh suite chạy bằng `nice -n 10`; việc nặng (itest DB, `s09-v16-that`, `npm test`) chỉ khi giữ s4 hoặc tải < 12 và không ai giữ s4.

## Review Focus

1. Bản hỏng chạy SAU bản đủ cùng ngày — người vận hành mong quỹ căn vẫn 1.294, không về 2 dự án → Task 3 ô «hỏng sau đủ».
2. Dự án có trang 0 mà thiếu trang giữa (Σ id < tongNguon) — mong dự án hiện «chưa đủ», không hiện số thiếu → Task 3 ô «thiếu trang».
3. Bản thu đêm 25–26/11 thêm tầng cho toà đã có ở bản trước — mong căn không đếm trùng → Task 4 ô «tầng ở hai bản».
4. Một khoá lạ mang URL (vd `positions[].image`) — mong stg không còn chuỗi `http` nào → Task 2 quét `http` trên mọi giá trị chuỗi, Task 6 quét stg thật.
5. Nút dự án nối với hai mã dự án S09 — mong bảng gộp quỹ căn của cả hai, không lặp căn → Task 7 ca «hai mã một nút».

---

### Task 1: Fixture v16 sinh từ bản thu thật

**Files:**
- Create: `pipeline/scripts/s09-v16-sinh-fixture.mjs`, `pipeline/tests/fixtures/s09-v16/<ba thư mục snapshot>/{manifest.json,items-0001.json.gz}`
- Create: `pipeline/lib/s09-danh-ba-v16-khoa.json` (bảng kiểm kê)

**Interfaces:**
- Produces: ba thư mục fixture `vn__s09-danh-ba__F-hong`, `vn__s09-danh-ba__F-du`, `vn__s09-danh-ba__F-tang` (schemaVersion 16, băm đúng);
  `s09-danh-ba-v16-khoa.json` = `{ "quy-can": {"<khoá>": "giu"|"bo", …}, "can-cao-tang": {…} }` liệt MỌI khoá cấp một của căn trong bản
  thu thật (45 quỹ căn, 4 căn cao tầng).

- [ ] **Step 1:** Viết `s09-v16-sinh-fixture.mjs --tu <thư mục chờ> --ra pipeline/tests/fixtures/s09-v16`: lấy 3 dự án quỹ căn (một >1
  trang), 2 toà × 3 tầng căn cao tầng; thay mọi giá trị chuỗi theo luật ở Global Constraints; ghi manifest với `sha256` thật; sinh thêm
  các ca: trang rỗng, item `code` ≠ 200, item thiếu `sourceId`, bản «hỏng» (trang từ 1, không trang 0), tầng rỗng, căn `name` ≠ `code`.
- [ ] **Step 2:** Sinh bảng kiểm kê từ hợp các khoá của MỌI căn trong bốn bản thu thật; `galleries`, `geolocation` = `bo`, còn lại `giu`.
- [ ] **Step 3:** Chạy `grep -rIl -E '<danh sách tên miền đọc từ source_registry local>' pipeline/tests/fixtures/s09-v16` (gunzip trước) → rỗng.
- [ ] **Step 4:** Commit `test(pipeline): DA56 fixture v16 sinh từ khuôn bản thu thật, bảng kiểm kê khoá`.

### Task 2: Bộ nạp nhận v16 và lọc khoá (AC-1, AC-2, AC-9 phần stg/log)

**Files:**
- Create: `pipeline/lib/s09-danh-ba-v16.mjs`, `pipeline/lib/s09-danh-ba-v16.test.mjs`
- Modify: `pipeline/import-s09-danh-ba.mjs` (`SCHEMA_DANH_BA = [15, 16]`; gọi `locTangA` trước INSERT; in số căn bị bỏ khoá)
- Modify: `_acceptance/config.yaml` không đổi (đã khai `s09_v16_db`)

**Interfaces:**
- Produces: `export function locTangA(kind: string, payload: object): { payload: object, boKhoa: number }` — với `quy-can` bỏ khoá `bo` của
  bảng kiểm kê khỏi từng phần tử `payload.data`; kind khác trả nguyên. Ném lỗi khi gặp khoá cấp một KHÔNG có trong bảng (khoá lạ phải được
  người xếp). `export const KHOA_V16` (đọc json).

- [ ] **Step 1: test đỏ** `s09-danh-ba-v16.test.mjs`: (a) mỗi khoá của bảng một assert — `bo` vắng sau lọc, `giu` bằng nguyên văn; số assert
  = số khoá; (b) khoá lạ `anh_moi` → ném «khoá chưa xếp: anh_moi»; (c) không chuỗi nào trong kết quả chứa `http`; (d) `can-cao-tang` trả y
  nguyên.
- [ ] **Step 2:** `node --test pipeline/lib/s09-danh-ba-v16.test.mjs` → FAIL «locTangA is not a function».
- [ ] **Step 3:** Viết `locTangA`, nối vào bộ nạp; bộ nạp in `bỏ khoá tầng A ở <n> căn`.
- [ ] **Step 4:** Test xanh; đột biến tạm bỏ lọc → (a) đỏ nêu «galleries»; hoàn lại.
- [ ] **Step 5:** Commit `feat(pipeline): DA56 bộ nạp S09 nhận v16, lọc khoá tầng A theo bảng kiểm kê`.

### Task 3: Migration 130 — đối soát và quỹ căn bản đủ (AC-3)

**Files:**
- Create: `db/migrations/130_v_s09_db_quy_can.sql`, `pipeline/scripts/s09-v16.itest.mjs` (phần quỹ căn)

**Interfaces:**
- Produces view `v_s09_db_quy_can_doi_soat(snapshot_id, du_an_id, so_trang, so_id, tong_nguon, du boolean NOT NULL, fetched_at)` —
  `tong_nguon` từ trang `meta.trang = 0`; không có trang 0 → `tong_nguon` NULL, `du = false`.
- Produces view `v_s09_db_quy_can(du_an_id, can_id, ma_can, loai_hinh, phong_ngu, phong_tam, dien_tich_min, dien_tich_max, gia_ban_min,
  gia_ban_max, don_gia_min, don_gia_max, trang_thai, trang_thai_ban, block_id, snapshot_id)` — mỗi dự án lấy snapshot mới nhất có `du`,
  một dòng mỗi `can_id` (DISTINCT ON).

- [ ] **Step 1: test đỏ** itest trên DB riêng lượt (`taoDbThu` của `db-thu-dbv.mjs`, áp mọi migration): ma trận sáu ô viết trước —
  `hong-truoc-du`, `hong-sau-du`, `can-hai-trang`, `thieu-trang`, `chi-ban-hong`, `hai-ban-du-khac-gia`; mỗi ô assert trạng thái trọn của dự
  án (số căn, `du`, giá). Số assert = 6.
- [ ] **Step 2:** Chạy → FAIL «relation v_s09_db_quy_can does not exist».
- [ ] **Step 3:** Viết 130 (header theo khuôn 115, «KHÔNG sync cloud»).
- [ ] **Step 4:** Xanh; đột biến chọn theo `fetched_at` bỏ `du` → ô `hong-sau-du` đỏ nêu tên ô; hoàn lại. Áp 130 lần hai không lỗi.
- [ ] **Step 5:** Commit `feat(db): DA56 migration 130 view đối soát và quỹ căn bản đủ`.

### Task 4: Migration 130 — căn cao tầng bản tốt (AC-4)

**Files:** Modify `db/migrations/130_v_s09_db_quy_can.sql`, `pipeline/scripts/s09-v16.itest.mjs`

**Interfaces:**
- Produces view `v_s09_db_can_cao_tang(du_an_id, toa_id, toa_ten, tang_id, tang_ten, can_id, ma, ten, snapshot_id)` — từ
  `v_s09_db_item_moi` kind `can-cao-tang`, bỏ bản `data` rỗng khi tầng có bản tốt không rỗng (bản rỗng chỉ thắng khi không có bản nào khác).

- [ ] **Step 1: test đỏ** năm ô viết trước `tot-roi-loi`, `loi-roi-tot`, `tot-roi-rong`, `code-khac-name`, `tang-hai-ban`; mỗi ô một assert trạng
  thái trọn của tầng.
- [ ] **Step 2:** FAIL. **Step 3:** viết view. **Step 4:** xanh; đột biến cho bản rỗng đè → ô `tot-roi-rong` đỏ. **Step 5:** commit
  `feat(db): DA56 view căn cao tầng bản tốt mới nhất`.

### Task 5: Nạp hai lần, sai băm, tầng A trong log (AC-1, AC-9)

**Files:** Modify `pipeline/scripts/s09-v16.itest.mjs`

- [ ] **Step 1:** Ca «nạp hai lần»: lần một đúng số dòng từng kind theo fixture, lần hai 0 dòng; item hỏng đếm `thieu_source_id`.
- [ ] **Step 2:** Ca «sai băm»: chép fixture sang thư mục tạm, sửa một byte → `napDanhBaThuMuc` ném «sai băm», 0 dòng stg.
- [ ] **Step 3:** Ca «cấy chuỗi»: fixture cấy `cdn.gia-lap.test` và toạ độ `{lat:21.0001,lng:105.0001}` → stg, stdout/stderr bộ nạp không chứa
  hai chuỗi; `FILL` của `pipeline/sync-cloud.mjs` (import danh sách) không có `stg_s09_danh_ba`, `v_s09_db_quy_can*`, `v_s09_db_can_cao_tang`.
  Đột biến bỏ lọc → đỏ nêu chuỗi cấy.
- [ ] **Step 4:** `node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-v16.test.mjs pipeline/scripts/s09-v16.itest.mjs` xanh. Commit.

### Task 6: Đo trên dữ liệu thật (AC-5, AC-6)

**Files:** Create `pipeline/scripts/s09-v16-that.mjs`

**Interfaces:**
- Consumes: `napDanhBaThuMuc`, `taoDbThu`/`apTep`, lượt dựng của DA42 (`danh-ba-s09-toa-that.mjs` cách dựng gói 1 + `dung()`).
- Produces: CLI `--tran-phut <n>`, `--dem` (chỉ đọc trên `DATABASE_URL`), `--xoa-mot-can` (chiều đỏ), `--nguoc` (thứ tự ngược).

- [ ] **Step 1:** Khung giống `danh-ba-s09-toa-that.mjs`: chạy lại mình qua `db/db-thu.sh oneinvest_suite_s09v16 --chay`; kiểm băm thư mục chờ
  (`shasum` theo tệp `.sha256`), bỏ thư mục `.partial`.
- [ ] **Step 2:** Bộ đếm độc lập (không import `pipeline/lib/s09*`) in bảng ba cột stg · đếm thẳng · manifest theo bản thu × kind × cấp.
- [ ] **Step 3:** Ô cố định: quỹ căn 1.294 · 40 dự án · 1.268 có giá; đối soát bản `…T024022939` 0 dòng `du` NULL, `du=false` = số dự án bộ
  đếm; 40 dự án chia 24 · 6 · 10 (nối = `project_links` S09 `noi`); 0 dòng stg hai kind có `http` hay tên miền từ `source_registry`.
- [ ] **Step 4:** AC-6: băm tập dòng hai view sau lượt một, nạp lại, và DB thử thứ hai `--nguoc` — giống nhau.
- [ ] **Step 5:** Chiều đỏ `--xoa-mot-can` thoát 1 nêu ô. Chạy khi giữ s4 hoặc máy rảnh; ghi số vào §4 hồ sơ áp. Commit.

### Task 7: Lớp đọc và màn Danh bạ (AC-7, AC-8, AC-9 phần màn)

**Files:**
- Create: `app/src/lib/ops/registry/quy-can.ts`, `app/src/components/ops/registry/du-an-quy-can-grid.tsx`, `app/tests/registry-quy-can.test.tsx`
- Modify: `app/src/lib/ops/registry/doc.ts` (`TongDanhBa.quyCan`), `app/src/components/ops/registry/registry-content.tsx` (ô tổng),
  `app/src/lib/ops/registry/du-an.ts` + `du-an-content.tsx` (khối dưới «Toà và căn»)

**Interfaces:**
- Produces: `type QuyCanTong = { can: number; coGia: number; duAn: number; noi: number; theChua: number; ngoaiDanhMuc: number }`;
  `export async function docQuyCanTong(q?: Q): Promise<QuyCanTong>`; `type CanQuyCan = { id: string; ma: string; loaiHinh: string|null;
  pn: number|null; wc: number|null; dienTich: [number|null, number|null]; giaBan: [number|null, number|null]; donGia: [number|null,
  number|null]; trangThai: string|null }`; `export async function docQuyCanDuAn(nodeId: number, q?: Q): Promise<CanQuyCan[]>` — nối
  `project_links` (`source='S09'`, `status='noi'`, `asset_node_id = nodeId`) với `v_s09_db_quy_can`, DISTINCT theo `can_id`.

- [ ] **Step 1: test đỏ** route thật trên lược đồ tạm (khuôn `registry-chi-doc.test.tsx`): ô «Quỹ căn S09» = SELECT trên view, dòng phụ ba
  số cộng bằng `duAn`; trang nút có quỹ căn đúng số dòng và giá; nút không quỹ căn có chữ «Chưa có quỹ căn của nguồn S09 cho dự án này»;
  truy vấn lỗi ra khối lỗi có «Thử lại»; ca «hai mã một nút» không lặp căn; HTML không chứa `cdn.gia-lap.test`, toạ độ cấy hay tên thật.
- [ ] **Step 2:** FAIL. **Step 3:** viết lớp đọc + component (`data-grid` chỉ đọc, sort mã căn; giá dạng tỉ/triệu theo hàm định dạng có sẵn
  của Danh bạ). **Step 4:** xanh; đột biến nối sai cột → ca số dòng đỏ. `cd app && npx tsc --noEmit && npm run lint` xanh.
- [ ] **Step 5:** Self-check ReUI trên tệp đổi. Commit `feat(app): DA56 quỹ căn S09 trên Danh bạ Ops`.

### Task 8: Hồ sơ áp và hợp đồng dữ liệu (AC-10)

**Files:** Create `_acceptance/nap-s09-quy-can-va-can-cao-tang/ap-may-thu.md`; kiểm `collector/docs/DATA-CONTRACT.md`

- [ ] **Step 1:** Năm thứ: (1) sao lưu `db-sao-luu.sh`; (2) lệnh áp: sau DA42 áp 130, ZK chép thư mục chờ vào `collector/snapshots`, nạp bằng
  `node pipeline/import-s09-danh-ba.mjs <thư mục>` từng bản; (3) số chạy thử của Task 6; (4) cách lùi `DROP VIEW` ba view + `DELETE FROM
  stg_s09_danh_ba WHERE kind IN ('quy-can','can-cao-tang')` (stg, nạp lại được); (5) lệnh kiểm sau `s09-v16-that.mjs --dem`. Khung giờ ngoài
  lượt S03/S06.
- [ ] **Step 2:** `git diff --exit-code 767c70c13 -- collector/docs/DATA-CONTRACT.md` → exit 0. Commit.

## Thứ tự và độc lập

Task 1 → 2 → (3, 4, 5 cùng tệp itest: tuần tự) → 6 → 7 → 8. Task 7 chỉ cần view của 3 nên có thể làm song song sau Task 3, nhưng cùng
worktree và một người làm: chạy tuần tự. `independent: false` cho mọi task.
