# Gắn nhãn theo từng nhóm S03 — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (tuần tự, cùng phiên). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mở rộng `/ops/labels` để Mạnh và đội gắn nhãn theo từng nhóm S03, ghi điều người trong nhóm hiểu kèm căn cứ và lý do, so với máy rồi ghi trường hợp.

**Architecture:** Thêm trường vào khuôn một dòng một trường của PL7, bảng riêng cho lý do và trường hợp. Lượt một giữ nguyên tính mù trong `labels-queries.ts`; mọi đọc giá trị máy nằm ở tệp mới `labels-luot-hai.ts`, chỉ gọi sau khi kiểm người gọi đã lưu bài. Giao diện theo bản D.

**Tech Stack:** Next.js 16, Postgres, `node --test` với lược đồ tạm, ReUI trên shadcn base-nova.

**Spec:** `docs/superpowers/specs/2026-11-04-gan-nhan-theo-nhom-s03-design.md` · hợp đồng `_acceptance/gan-nhan-theo-nhom-s03/contract.md` · tiêu chí `evals.yaml` · mẫu giao diện nhánh cục bộ `spike/man-gan-nhan-3-cach`, tệp `proto-d.tsx`.

## Global Constraints

- Migration số 072 (LL đã cấp). Không chạy migration chưa gộp trên `oneinvest`; DB thử `oneinvest_gcn_nhan` và lược đồ tạm. Áp DB thật cần Mạnh duyệt, kèm `pg_dump`.
- Bộ test đầy đủ chỉ chạy dưới khoá s4; lúc làm chỉ gọi đích danh tệp test.
- Nhãn không rời máy thu: 0 bảng nhãn trong `sync-cloud`, `push-ops-facts`.
- Không gộp mã trước 05/11 trừ khi Mạnh nói thẳng.
- Câu chữ theo `CONTEXT.md`: nhãn ô dự án là «Khu đô thị», không dùng «lên cloud», «ghi chú» ở chữ mới; thêm thuật ngữ mới cùng commit.
- UI: thành phần đã cài, không sửa vendor, không cài block; số qua `lib/format.ts`.

## Review Focus

- Bài chỉ có ảnh, chữ rỗng: biểu mẫu vẫn dùng được; mọi ô khai «Chữ bài» với giá trị đều bị từ chối, nên người gắn phải chọn căn cứ khác.
- Tải lại trang sau khi lưu: vẫn ở lượt hai của đúng bài, không rơi sang tin kế; `?xem=<itemId>`.
- Chữ kiểu Unicode và bí danh dấu tiếng Việt: «𝟑𝟒𝐦²», «RAINBOW» so với «rainbow»: luật so với chữ bài chuẩn hoá NFKC, bỏ dấu, chữ thường.
- Hai người lưu cùng lúc một bài đơn: một người 409, lý do của người đó không được ghi.
- Nhóm tên trùng nhiều cuộc trò chuyện hay bài không thuộc đơn vị nào trong sổ: lấy mẫu theo `unit_code`, bài không có đơn vị bị bỏ và lệnh in số bị bỏ.

---

### Task 1: Migration 072 và phép đo lưu trữ

**Files:** Create `db/migrations/072_labels_nhom.sql`, `_acceptance/gan-nhan-theo-nhom-s03/probes/_db.mjs`, `probes/migration.mjs`. **Phục vụ:** E1. **independent: false**

**Interfaces — Produces:** `eval_labels.field` nhận thêm `subzone, stack, floor, bathrooms, bedrooms_plus, multi_unit, seller_name, seller_phone`; `eval_labels.basis text NULL CHECK (basis IN ('chu_bai','ngu_canh_nhom','kien_thuc_nghe'))`; `eval_label_items.stratum text NULL`; `eval_label_reasons(item_id, labeler_id, reason, created_at, PRIMARY KEY (item_id, labeler_id))`; `eval_label_cases(id, item_id, labeler_id, case_kind, note, the_nhom_dung, created_at)` với `the_nhom_dung IN ('dung','sai','chua')`; view `eval_label_agreement` đủ 17 trường, giữ bốn cột cũ.

- [ ] Viết `probes/migration.mjs` theo khuôn `man-gan-nhan-mu/probes/migration.mjs`: DB rỗng `oneinvest_gcn_nhan_mig`, áp 054 rồi nhãn cũ, áp 072 hai lần, in đúng các dòng `ok …` của E1; mỗi trường mới chèn hai người một cặp khớp, một cặp lệch, so kết quả view (16 assert).
- [ ] Chạy `node _acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs`; đỏ vì thiếu tệp 072.
- [ ] Viết `072_labels_nhom.sql`: idempotent, đổi `CHECK` bằng `DROP CONSTRAINT IF EXISTS` rồi `ADD`.
- [ ] Chạy lại, xanh; hai chiều đỏ ghim thông điệp `loi bang nhan tren duong day`, `loi view thieu truong`. Commit.

### Task 2: Mẫu theo nhóm

**Files:** Modify `pipeline/lib/eval-labels.mjs`, `pipeline/lib/eval-labels.test.mjs`, `pipeline/label-sample.mjs`; Create `probes/mau.mjs`. **Phục vụ:** E2, E3. **independent: true**

**Interfaces — Produces:** `chonMauTheoNhom(posts, { seed, moiNhomLon, moiNhomNho, soNhomLon }) → { chon: {ref_id, text_hash, stratum, double_label, split}[], moiNhom: {unit_code, khac_nhau, chon, bo_vi_trung}[], bo_khong_don_vi }`, `posts` mang `unit_code`. Cờ lệnh: `--theo-nhom --moi-nhom-lon --moi-nhom-nho --so-nhom-lon`.

- [ ] Test `chon theo nhom`: fixture có nội dung trùng giữa hai nhóm; cùng đầu vào cho cùng kết quả; đổi nhóm xếp sau không đổi mẫu nhóm xếp trước; nhóm sau bù đủ; 20% trùng tính trong nhóm, làm tròn như `chonMau`; bài không đơn vị vào `bo_khong_don_vi`.
- [ ] Chạy `node --test pipeline/lib/eval-labels.test.mjs`; đỏ.
- [ ] Viết hàm: xếp nhóm theo `khac_nhau` giảm dần, hoà theo `unit_code`; tập băm đã dùng đi theo thứ tự đó; mỗi nhóm gọi `chonMau` trên phần còn lại.
- [ ] Nối cờ vào `label-sample.mjs`: lấy `unit_code` qua `collection_units.group_key = conversation_id`, in số bị trừ, nhóm thiếu.
- [ ] Viết `probes/mau.mjs` theo khuôn cũ, chạy lệnh thật bằng tiến trình con trên DB thử. Xanh. Commit.

### Task 3: Chuẩn hoá 17 trường, căn cứ, lý do

**Files:** Modify `app/src/lib/labels-normalize.ts`; Create `app/tests/labels-nhom.test.tsx`. **Phục vụ:** E6. **independent: false**

**Interfaces — Produces:** `LABEL_FIELDS` thêm tám trường; `BASIS = ["chu_bai","ngu_canh_nhom","kien_thuc_nghe"]`; `chuanHoaLuot(raw, { text: string }) → { ok: true, rows: LabelRow[], reason: string|null } | { ok: false, loi }`; `LabelRow` thêm `basis: Basis|null`; `coTrongChu(value, text): boolean`; `MSG_THIEU_LY_DO = "Có trường không từ chữ bài — ghi lý do"`, `MSG_KHONG_TRONG_CHU = "Chữ bài không có giá trị này — chọn căn cứ khác"`; `veE164(s): string|null` cùng luật `extractPhones` (10 chữ số, đầu 0 rồi 3, 5, 7, 8, 9).

- [ ] Test ma trận viết trước, số assert bằng số phần tử, đủ các ca của E6 và ca Unicode, bài chữ rỗng của Review Focus. `multi_unit` luôn `basis` rỗng. `area_m2` khai «Chữ bài» so số trong chữ.
- [ ] Chạy `cd app && node --import tsx --test tests/labels-nhom.test.tsx`; đỏ.
- [ ] Viết. Chữ áp luật «có trong chữ»: `project, subzone, building, stack, area_m2`.
- [ ] Chạy lại cùng `tests/labels-gia.test.tsx`, `tests/labels-mau.test.tsx`; sửa chỗ số trường đã đổi có chủ ý. Commit.

### Task 4: Lượt một theo nhóm

**Files:** Modify `app/src/lib/labels-queries.ts`, `app/src/app/api/v1/ops/labels/route.ts`, `app/tests/labels-nhom.test.tsx`, `app/tests/labels.test.tsx`. **Phục vụ:** E5, E13. **independent: false**

**Interfaces — Consumes:** Task 3. **Produces:** `tinKe(userId, lat, nhom: string|null)`; `nhomCuaLat(userId, lat) → { unitCode, ten, cuaToi, tong, choNguoiHai }[]`; `ghiNhan(c, userId, lat, itemId, rows, reason)`; `POST` đọc chữ bài theo `item_id` rồi mới chuẩn hoá. Tên nhóm lấy từ bài mới nhất của đơn vị, cùng cách `khai-so-nhom`.

- [ ] Ca test `luu 17 truong va ly do`, `loi giua giao dich`, `tin ke cung nhom`, `hai nguoi cung luc: ly do nguoi sau khong ghi`.
- [ ] Đỏ; viết; xanh cùng `tests/labels.test.tsx`. Commit.

### Task 5: Lượt hai, ghi trường hợp

**Files:** Create `app/src/lib/labels-luot-hai.ts`, `app/src/app/api/v1/ops/labels/[itemId]/review/route.ts`, `probes/mu.mjs`, `probes/seed.mjs`; Modify `app/tests/labels-nhom.test.tsx`. **Phục vụ:** E7, E9. **independent: false**

**Interfaces — Produces:** `doiChieu(userId, itemId) → { bai, cuaToi, boDoc, aiDoc, soTin, the } | null` (null khi người gọi chưa lưu bài; route trả 403); `ghiTruongHop(c, userId, itemId, { case_kind, note, the_nhom_dung })` chỉ thêm dòng. `boDoc` lấy tin có `offer_id` nhỏ nhất chứa bài; `aiDoc` từ `silver_labels` mới nhất của bài; `the` từ `collection_units.note`.

- [ ] Viết `probes/mu.mjs` theo E7, chuỗi đánh dấu ở giá trị máy, thẻ nhóm, lý do, ghi chú của người A; hai chiều đỏ ghim `loi luot mot doc bang may`.
- [ ] Ca test `truong hop khong doi nhan`, `tra loi the`, `bo qua`, `luu lai nhan 409`, `chua luu khong ghi duoc`, `loi truong hop nhan con nguyen`.
- [ ] Đỏ; viết; xanh. `labels-queries.ts` không có đoạn đọc bảng máy nào. Commit.

### Task 6: Bảng trường hợp theo nhóm

**Files:** Modify `app/src/lib/labels-luot-hai.ts`, `app/tests/labels-nhom.test.tsx`. **Phục vụ:** E10. **independent: false**

**Interfaces — Produces:** `bangTruongHop(lat) → { unitCode, ten, daGan, tong, canNguCanh, theoLoai: Record<CaseKind, number> }[]`; không trả chữ lý do hay ghi chú ở bất kỳ vai nào. `CASE_KINDS` đúng danh sách trong spec.

- [ ] Ca `bang truong hop khop sql doc lap`, `nhom chua gan`, `0 chuoi ly do`. Đỏ; viết; xanh. Commit.

### Task 7: Giao diện bản D

**Files:** Modify `app/src/components/ops/labels/label-form.tsx`, `labels-view.tsx`, `labels-content.tsx`, `labels-skeleton.tsx`, `luu-nhan.tsx`, `app/src/app/ops/labels/page.tsx`; Create `components/ops/labels/luot-hai.tsx`, `chon-nhom.tsx`, `bang-truong-hop.tsx`; Modify `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md`, `catalog.md`. **Phục vụ:** E4, E8, E14, E15, E16, E17. **independent: false**

**Interfaces — Consumes:** Task 3–6. Lát mặc định `s03-theo-nhom`; `?lat=`, `?nhom=`, `?xem=`.

- [ ] Viết kế hoạch 7 dòng của ReUI vào câu trả lời trước khi sửa.
- [ ] Chuyển `proto-d.tsx` và vùng dùng chung của nhánh mẫu vào tệp thật, nối dữ liệu; giá giữ hai ô và đơn vị như PL7. Tách tệp để mỗi tệp dưới 200 dòng.
- [ ] Ca render E14 trong `labels-nhom.test.tsx`. Chạy `cd app && npx tsc --noEmit && npm run lint`, `node --import tsx --test tests/labels-nhom.test.tsx tests/labels.test.tsx`.
- [ ] Bước nhìn: dev server, DB thử `oneinvest_gcn_nhan`, chụp sáng, tối, 390 theo các bước của E4, E8, E17; đo 17 hàng và nút Lưu nằm trong màn 1440×900.
- [ ] Self-check C1–C4, `get_audit_checklist`. Commit.

### Task 8: Lệnh xuất và các đường đo

**Files:** Create `pipeline/label-cases.mjs`, `pipeline/lib/label-cases.mjs`, `pipeline/lib/label-cases.test.mjs`, `probes/cases.mjs`, `probes/do-cu.mjs`, `probes/round-trip.mjs`; Modify `pipeline/lib/eval-classify.mjs` nếu trường mới làm sai số cũ, `pipeline/label-agreement.mjs` nếu cần. **Phục vụ:** E11, E12, E18. **independent: false**

**Interfaces — Produces:** `xuatTruongHop(client, lat, nhom?) → { lat, nhom: { unit_code, ten, ly_do[], truong_hop[], the_nhom[], gia_tri_ngu_canh[] }[] }`, sắp xếp ổn định, không có `labeler_id`.

- [ ] Viết ba đầu dò theo expected trong `evals.yaml`, gồm chiều đỏ; đỏ.
- [ ] Viết lệnh và hàm; xanh. Commit.

### Task 9: Khép vòng

**Files:** Modify `docs/ROADMAP.md` §2, §4.

- [ ] Gọi `sync_with_base_branch` để lấy `main`, giải xung đột nếu có.
- [ ] Chạy đích danh: `mgn_app`, `ngl_app`, `tnm_app`, `gcn_app`, `gcn_pipeline`, `mgn_mu`, `node --test pipeline/lib/eval-classify.test.mjs`, trên DB thử. Hồ sơ PL7 phải xanh, vì nó đo chính các tệp này.
- [ ] Ghi ROADMAP, đặt `status: implemented`, xin khoá s4 và dãy mượn với giám sát, rồi vào S4.
