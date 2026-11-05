# Xử gốc nhóm S03 đăng ký hai lần — kế hoạch thi công

> **For agentic workers:** vòng T2, thực thi tuần tự trong main loop (superpowers:executing-plans). Checkbox `- [ ]` để theo dõi.

**Goal:** Một nhóm S03 có một dòng hiệu lực trong sổ, transform so khoá đã chuẩn hoá, hai lỗ đo của hồ sơ trước được vá.

**Architecture:** `runTransformZalo` đổi `conversation_id` sang khoá thật ngay sau khi đọc bài, một chỗ. Lệnh `don-nhom-hai-lan` mặc định chỉ in, `--ghi` chuyển dòng phụ sang `retired` trong giao dịch của bên gọi. Phép đo chạy trong giao dịch lùi trên DB thử.

**Tech Stack:** Node ESM `.mjs`, `pg`, PostgreSQL local :5433.

**Spec:** `docs/superpowers/specs/2026-11-05-nhom-hai-lan-s03-xu-goc-design.md`, hợp đồng `_acceptance/nhom-hai-lan-s03-xu-goc/contract.md`, thông điệp ghim ở `evals.yaml`.

## Global Constraints

- Mạnh chốt: Hỏi-1 lối A (`retired`, giữ dòng và mã), Hỏi-2 đổi transform một chỗ, Hỏi-3 gộp khi có chữ ký và CI xanh.
- Không chạy `--ghi` trên DB `oneinvest` trong vòng này; sớm nhất 06/11, có lời riêng của Mạnh.
- Không ghi khoá nhóm thật hay tên kênh vào tệp kho; đầu ra chỉ có số đếm và mã `S03-N…`. Kho công khai.
- Không đụng `app/src/components/ops/labels/**`, `sync-don-vi.mjs`, `khai-so-nhom.mjs`, `import-*`; không migration.
- Phép đo mới có cặp hai chiều trên cùng fixture, thông điệp đúng `evals.yaml`.
- DB thử: `oneinvest_nhl_xu`; E8, E9 dùng `oneinvest_gcn_nhan`.

## Review Focus

- Khoá có `:` lạ (`conv:x`, `a:b:group:x`, `k:group:`) không được gộp: ca AC-3, Task 1.
- Dòng phụ đã `paused` vì `sync-don-vi` vẫn được dọn: ca AC-5, Task 2.
- Chạy `--ghi` hai lần hoặc nhóm ba dòng: lần hai 0 thay đổi, cả hai dòng phụ đều dọn: ca thêm ở Task 2.
- Hoàn lại rồi dọn lại: dòng nhật ký mới nhất quyết định, không hoàn hai lần: ca thêm ở Task 2.
- `git diff` không có tệp hoặc commit gộp không còn: đỏ, không xanh rỗng: ca AC-9, Task 4.

---

### Task 1: Transform so khoá đã chuẩn hoá

`independent: false` · phục vụ E1, E2, E3

**Files:** Modify `pipeline/transform-zalo.mjs`. Create `pipeline/scripts/nhom-hai-lan-transform.itest.mjs`.

**Interfaces:**
- Produces: `runTransformZalo(client, { parse, suyLoaiTin, khoaNhom = khoaNhomThat })`, trả thêm `bai_doi_khoa: number`; `tangLoai(posts, { parse, khoaNhom = khoaNhomThat })`; `docThiTruongNhom(client, khoaNhom = khoaNhomThat)` trả `Map` có cả khoá nguyên văn lẫn khoá thật, dòng khoá trần thắng.

- [ ] Viết itest: giao dịch lùi, xoá bài trong giao dịch để chỉ còn fixture, khoá `nhl-…`. In đúng các dòng của E1, E2, E3 kể cả chiều đỏ với `khoaNhom` nguyên văn và hàm gộp quá tay.
- [ ] Chạy lệnh `executors.script.nhl_transform`. Kỳ vọng đỏ vì chưa có tham số.
- [ ] Sửa transform, chỉ ba chỗ trên.
- [ ] Chạy lại, kỳ vọng exit 0; chạy `cd pipeline && npm test`, kỳ vọng không thêm đỏ so với nền.
- [ ] Commit `fix(pipeline): transform S03 so khoá nhóm đã chuẩn hoá`.

### Task 2: Lệnh dọn sổ

`independent: true` so với Task 1 · phục vụ E5, E6

**Files:** Create `pipeline/don-nhom-hai-lan.mjs`, `pipeline/scripts/don-nhom-hai-lan.itest.mjs`.

**Interfaces:**
- Produces: `xetNhomHaiLan(so) → { don: [{ dai_dien, phu: row[] }], bo_qua: [{ unit_code, ly_do }] }`; `donNhomHaiLan(client, { ghi = false, out = console.log }) → dem`; `hoanLaiDon(client, { ghi = false, out }) → dem`. Hai hàm ghi dùng SAVEPOINT trong giao dịch của bên gọi. Actor `machine:don-nhom-hai-lan`, action `unit.retire_duplicate`, `unit.restore_duplicate`.
- Lý do bỏ qua: `khong co dong khoa tran`, `lech the`, `lech thi truong`, `lech du an`, `dai dien da go`.

- [ ] Viết itest: xoá dòng S03 trong giao dịch, fixture ba nhóm hợp lệ (một dòng phụ `paused`, một nhóm ba dòng) và năm nhóm rơi vào năm lý do bỏ qua; lỗi tiêm bằng trigger trên `ops_audit` nổ ở dòng thứ hai. In đúng các dòng E5, E6.
- [ ] Chạy `nhl_so`, kỳ vọng đỏ vì chưa có tệp.
- [ ] Viết lệnh theo khuôn `khai-so-nhom.mjs`; dòng phụ đã ở `retired`, `completed` không xét nên lần hai 0 thay đổi và cặp đã dọn không bị báo lệch.
- [ ] Chạy lại, kỳ vọng exit 0.
- [ ] Commit `feat(pipeline): lệnh dọn dòng sổ S03 đăng ký hai lần`.

### Task 3: Phép đo trên bản sao thật và quét khoá

`independent: false` · phục vụ E4, E7, E10 · cần Task 1, Task 2, `_quet.mjs` của Task 4

**Files:** Create `pipeline/scripts/do-nhom-hai-lan.mjs`.

**Interfaces:**
- Consumes: `dieuKienVisible()` của `do-s03-len-cong.mjs`, `layMau`, `dongBoS03`, `donNhomHaiLan`, `_quet.mjs`.
- Produces: `soCong(truoc, sau, nhomCoCap) → { roi, them, doi, doi_ngoai }`; `--cong`, `--quet`.

- [ ] Viết bộ so và hai ca đỏ trước, rồi `--cong`: lượt nguyên văn, lượt mặc định, lượt có bài mồi, lượt sau dọn. In đúng dòng E4, E7.
- [ ] Viết `--quet`: tệp đổi, đầu ra các lệnh mới, token kênh và tên đơn vị đọc từ sổ cả hai DB thử; chỉ in số. In đúng dòng E10.
- [ ] Chạy `nhl_cong`, `nhl_quet`, kỳ vọng exit 0, số đổi khoá khác 0.
- [ ] Commit `test(pipeline): đo hai chiều nhóm S03 trên bản sao thật`.

### Task 4: Vá hai lỗ đo của `that-chi-doc`

`independent: false` với Task 3 vì dùng chung `_quet.mjs`; làm trước Task 3 · phục vụ E8, E9

**Files:** Create `_acceptance/nhom-dang-ky-hai-lan-s03/probes/_quet.mjs`. Modify `.../probes/that-chi-doc.mjs`.

**Interfaces:**
- Produces: `tepTheoDiff(root, day: string[], { chuaCommit = false }) → string[]`, ném khi rỗng; `tepThemMoi(root) → string[]`; `demKhop(chu, khoa) → number`; `quetTep(root, tep, khoa) → number`; `MERGE_315`.

- [ ] Sửa vế không vượt hạn mức thành tổng `chọn` cả nhóm thật so với `can` của đại diện; M1 phải cho `ok do M1: loi vuot han muc`.
- [ ] Thay danh sách tay bằng `tepTheoDiff`; thêm ba ca của E9, gồm kho git tạm có commit chứa khoá mồi.
- [ ] Chạy `ndk_that`, kỳ vọng exit 0 và đủ dòng E8, E9.
- [ ] Commit `test(acceptance): vá hai lỗ đo nhom-dang-ky-hai-lan-s03`.

Thứ tự chạy: Task 1, Task 2, Task 4, Task 3. Xong: `/verify`, `design-floor-s3`, hợp đồng sang `implemented`, S4.
