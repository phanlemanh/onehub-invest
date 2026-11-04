# Nới luật trích dẫn căn hộ S03 — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (tuần tự, các task dùng chung một tệp). Steps dùng checkbox.

**Goal:** Nhận dạng số phòng và studio trong luật trích dẫn, xử lại đề xuất đã bỏ bằng nhãn đã đọc, không gọi model.

**Architecture:** Một nhánh mới trong `kiemTrichLoai`, một lệnh `--xu-lai-trich` đi qua `quyetTin` thật rồi `apply_enrichment`, cổng mẫu thêm phiên bản luật.

**Tech Stack:** TypeScript, node:test, Postgres local, `withTx` ROLLBACK.

**Spec:** `docs/superpowers/specs/2026-11-04-s03-noi-luat-trich-dan-design.md`; hợp đồng `_acceptance/s03-noi-luat-trich-dan/contract.md`.

## Global Constraints

- Không đổi `PROMPT_VERSION` (`dtb-s03-v1`). Không gọi model trong `--xu-lai-trich`.
- Nhánh mới: mã `trich-dan:so-phong`; ngưỡng nhánh mới 30 ca, Wilson 0,85; toàn mẫu 100 ca, 0,85.
- Lý do mới của chốt dùng lại `ngu-canh-loai-tru`, không thêm giá trị vào `KetTrich`.
- Không chạm DB máy thu trong test; không ghi tên nguồn thật vào mã, test.

## Review Focus

- Lệnh xử lại quên truyền thân bài vào luật: ca «biệt thự» ở E4.
- Dòng đạt 03/11 không có trường phiên bản: ca ở E6.
- Tin nhiều bài, chữ đổi sau khi đọc: ca «chữ đã đổi» ở E4.
- Chạy lại sau khi hoàn tác làm áp lại: `reverted` không vào diện, ca ở E4.
- Lỗi một tin giữa lượt: giaoDich từng tin, các tin khác vẫn xong; ghi vào `loiGhi`, thoát 1, ca ở E5.

---

### Task 1: Bảng dạng số phòng và hai chốt

**Files:** Modify `agent/src/enrich/luat-trich-dan.ts`; Create `agent/tests/luat-trich-so-phong.test.ts`; Modify `agent/tests/doc-toan-bo.test.ts` nếu ca cũ ghim `khong-tu-khoa` cho câu nay qua luật.
**Phục vụ:** E1, E2. **independent:** false. **Verify:** `cd agent && node --import tsx --test tests/luat-trich-so-phong.test.ts tests/doc-toan-bo.test.ts`.
**Interfaces:** `kiemTrichLoai(value, quote, chu)` giữ chữ ký; `KetTrich` thêm `ma: "trich-dan:so-phong"`; xuất `TU_KHOA_LOAI_KHAC_THAN` để test duyệt đủ danh sách.

- [ ] Viết bảng dương, bảng âm đúng AC-1, AC-2, mỗi từ của danh sách đóng một ca, kèm cặp dương cùng câu không có từ gây loại. Chạy, thấy đỏ.
- [ ] Thêm nhánh mới sau nhánh cũ; câu có từ khoá cũ giữ mã cũ. Chốt 1, chốt 2, ngữ cảnh trước trả `ngu-canh-loai-tru`. Chạy, thấy xanh.
- [ ] Phá thử: bỏ `n` khỏi bảng thì đỏ ca `2n2wc`; gỡ chốt thân bài thì đỏ ca `view biệt thự`. Hoàn lại.
- [ ] Commit.

### Task 2: Điểm tiêm luật, phiên bản luật, cổng mẫu tách nhánh

**Files:** Modify `agent/src/enrich/doc-toan-bo.ts`, `agent/scripts/doc-toan-bo-s03.ts`; Create `agent/tests/xu-lai-trich-db.itest.ts`.
**Phục vụ:** E6, E9. **independent:** false. **Verify:** `cd agent && node --import tsx --test --test-concurrency=1 tests/xu-lai-trich-db.itest.ts`.
**Interfaces:** `LUAT_VERSION = "trich-v2"`; `quyetTin`, `chayLuot`, `doMau` nhận `kiemLoai?: typeof kiemTrichLoai`; `KetMau` thêm `apMoi`, `dungMoi`, `canDuoiMoi`, `luat_version`; `coMauDat(c, promptVersion?, luat = LUAT_VERSION)`.

- [ ] Viết ca: ba dòng cùng bị từ chối, dòng đạt thật thì qua; nhánh mới dưới 30 ca hoặc dưới ngưỡng thì `dat` false dù toàn mẫu đạt. Chạy, thấy đỏ.
- [ ] Sửa `doMau`, `coMauDat`, dòng in của lệnh. Chạy, thấy xanh; phá thử bỏ điều kiện phiên bản thì đỏ ca dòng 03/11.
- [ ] Commit.

### Task 3: Lệnh `--xu-lai-trich`

**Files:** Modify `agent/src/enrich/doc-toan-bo.ts`, `agent/scripts/doc-toan-bo-s03.ts`, `agent/tests/xu-lai-trich-db.itest.ts`.
**Phục vụ:** E3, E4, E5, E7. **independent:** false. **Verify:** như Task 2.
**Interfaces:** `xuLaiTrich(o: { client; runId; thu: boolean; cam?; chiTin?; resolve; giaoDich?; kiemLoai? }): Promise<{ xet: number; dat: number; daAp: number; giuNguyen: Record<string, number>; loiGhi: string[] }>`; cờ `--xu-lai-trich` bật tắt, thoát 6 khi không có mẫu đạt và không `--thu`, thoát 1 khi có `loiGhi`.

- [ ] Viết ca dương từ `chayLuot` thật với `kiemLoai` luật cũ, ca băm cột, đếm `ai_calls`, `review_queue`; chín ca âm cùng lượt; chạy hai lần; hoàn tác hai tin. Chạy, thấy đỏ.
- [ ] Hiện thực: chọn dòng `skipped` lý do `khong-tu-khoa`, chỉ tin còn sống, lấy nhãn theo băm chữ hiện tại, gọi `quyetTin`, chỉ nhận kết quả `property_type` route `corroborated` từ `e2_llm`; UPDATE đúng dòng rồi `apply_enrichment` trong giao dịch từng tin; không gọi `syncReview`.
- [ ] Chạy, thấy xanh. Phá thử: bỏ tham số thân bài thì đỏ ca `biệt thự`; thêm lời gọi `hoi` thì đỏ ca đếm `ai_calls`.
- [ ] Commit.

### Task 4: Đếm, lượt thường, đo trên mã thật

**Files:** Modify `agent/tests/xu-lai-trich-db.itest.ts`; docs `agent/CLAUDE.md`, ROADMAP §2 as-built.
**Phục vụ:** E8, E9. **independent:** false. **Verify:** `executors.test.ls1b_db_va_cu`, `executors.script.ls1b_mau`; `cd agent && npx tsc --noEmit` (2 lỗi tồn đọng được phép).

- [ ] Ca `--dem` so truy vấn độc lập; ca bài mới `2PN` qua `chayLuot`.
- [ ] Chạy `ls1b_mau` chỉ đọc, ghi số vào sổ.
- [ ] Commit, sang `status: implemented`, chạy S4.
