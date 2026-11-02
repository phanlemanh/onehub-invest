# Kế hoạch thi công: danh bạ người hiện số gốc (SD4 `people-hien-so-goc`)

> Thực thi tuần tự trong phiên chính (`superpowers:executing-plans`). Bước dùng ô `- [ ]`.

**Goal:** vai Vận hành và `admin` thấy, gọi và tìm được số gốc trên danh bạ; vai Người xem không nhận số nào.

**Architecture:** mã ứng dụng đã sửa ở S1 để trình bản bấm được. Vòng này viết phép đo cho mã đó, sửa các chỗ còn ghi luật cũ, và thay hai ô eval đã ký.

**Tech Stack:** Next.js 16, `node:test` + `tsx`, Postgres local :5433, Node `.mjs`.

**Spec:** `docs/superpowers/specs/2026-11-02-people-hien-so-goc-design.md`. Hồ sơ: `_acceptance/people-hien-so-goc/` (Mạnh duyệt Cổng Phạm vi 02/11, nhận ba khuyến nghị).

## Global Constraints

- Số trong test là số bịa; đầu ra phép đo trên DB thật chỉ có số đếm.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, thông điệp ghim đúng chuỗi trong `evals.yaml`.
- `people.ts` chỉ `SELECT`; DB thật mở `default_transaction_read_only`.
- Chỉ sửa tệp trong vùng của hàng. Tệp ngoài vùng hỏi giám sát trước.
- Ô eval đã ký dùng `status: not-run` + `superseded_by`, không sửa lời cũ.

## Review Focus

- Người có hai số sống: tìm số nào, hàng hiện đúng số đó (SHS-AC-4).
- Giá trị `sdt` lệch khuôn: hiện chữ, không thành liên kết gọi (SHS-AC-2).
- Vai Người xem gõ `?q=` là số thật: danh sách và thứ tự không đổi, trang không chép lại số (SHS-AC-5, SHS-AC-11).
- Cùng một số ở hai nguồn: tìm ra cả hai người, không ra người khác (SHS-DC).
- Khối 4 của lệnh kiểm cổng phải còn đỏ khi liên hệ lộ cho vai ngoài `xemNoiDungTin` (SHS-AC-8).

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Danh bạ hiện số, gọi được, tìm được, người có số lên trước; vai Người xem không nhận số | `app/tests/danh-ba-nguoi-tren-ops.test.tsx` đo mã đã sửa | AC-1 đến AC-5, AC-11 |
| Căn giá tốt mở liên hệ cho vai Vận hành, ảnh và chữ bài giữ cho `admin` | `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx` | AC-6, AC-8 |
| Số thật trên máy thu hiện và tìm được đủ | `app/tests/danh-ba-nguoi-doi-chieu.test.tsx` | AC-7 |
| Tài liệu và lệnh kiểm nói đúng quyền mới | `CONTEXT.md`, `docs/`, `app/CLAUDE.md`, `scripts/check-portal-compliance.mjs`, hai ô eval, `probes/chu.mjs` | AC-8 |
| Bản chạy thật đúng ở ba vai, sáng, tối, khổ hẹp | bước kiểm trên bản chạy | AC-9, AC-10 |

### Việc 1: Phép đo danh bạ

**Files:** Modify `app/tests/danh-ba-nguoi-tren-ops.test.tsx`.
**Phục vụ:** E1, E2, E3, E4, E5, E13. `independent: false`.

- [ ] Nạp phần 1 của migration 060 vào lược đồ tạm để có bí danh `sdt`; hạt giống SHS dùng nguồn riêng và dọn sau mỗi ca, để số tổng của ca DBN giữ nguyên.
- [ ] Sửa chuỗi đột biến của CTV-AC-1, CTV-AC-3 theo dòng `locDung` mới.
- [ ] Viết SHS-AC-1, 2, 3, 4, 5, 11 với thông điệp ghim của `evals.yaml`.
- [ ] Verify: `cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx`, thoát 0.

### Việc 2: Phép đo Căn giá tốt

**Files:** Create `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx`; Modify `app/src/components/ops/deal-card.tsx` (bỏ `export { fmtPhone }`), `_acceptance/config.yaml` (`shs_deals_cu` chạy thêm tệp này, vì hai bộ cũ không đo `fmtPhone`).
**Phục vụ:** E6, E9. `independent: false`.

- [ ] Viết SHS-AC-6 (viewer, ops, admin, cloud; hai đối chứng đỏ) và ca `fmtPhone`.
- [ ] Verify: chạy `config:executors.test.deals_lien_he` và `shs_deals_cu`, thoát 0.

### Việc 3: Đối chiếu DB thật

**Files:** Modify `app/tests/danh-ba-nguoi-doi-chieu.test.tsx`.
**Phục vụ:** E7. `independent: false`.

- [ ] Viết SHS-DC: đếm bằng SQL, đi mọi trang, tìm từng số, đối chứng đỏ bỏ lọc `sdt`; chỉ in số đếm.
- [ ] Verify: `cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx`, thoát 0.

### Việc 4: Chữ, cổng, ô eval đã ký

**Files:** Modify `scripts/check-portal-compliance.mjs` (khối 4), `docs/architecture/portals.md`, `CONTEXT.md`, `app/CLAUDE.md` (dòng `/ops/deals`), `docs/ROADMAP.md`, `_acceptance/sdt-luu-goc-e164/evals.yaml` (E8), `_acceptance/sd3-lam-chat-do-danh-ba/evals.yaml` (E7), spec. Delete `app/tests/sdt-che-tren-people.test.tsx`, `app/tests/people-che-so-loader.test.tsx`. Create `_acceptance/people-hien-so-goc/probes/chu.mjs`.
**Phục vụ:** E8. `independent: false`.

- [ ] Viết `probes/chu.mjs` kèm đối chứng đỏ, gồm đỏ khi trang tính `showContact` sai cổng.
- [ ] Sửa khối 4 chỉ đo cổng mới; không nới luật khác.
- [ ] Verify: `node _acceptance/people-hien-so-goc/probes/chu.mjs` và `node scripts/check-portal-compliance.mjs`, thoát 0.

### Việc 5: Kiểm tích hợp

**Phục vụ:** E10, E11, E12, các suite. `independent: false`.

- [ ] Chạy `/verify`, sàn thiết kế S3 và `BASE_URL=http://localhost:3460 node _acceptance/people-hien-so-goc/probes/html-vai.mjs`.
- [ ] Commit (không `git add -A`), `status: implemented`, xin lượt `s4`, chạy Workflow S4.
