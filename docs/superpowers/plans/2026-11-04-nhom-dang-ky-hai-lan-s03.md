# Một nhóm thật là một tầng khi lấy mẫu — kế hoạch thi công

> **For agentic workers:** làm tuần tự trong phiên chính theo feature-loop; S4 do tác tử tươi chấm.

**Goal:** `label-sample --theo-nhom` coi một nhóm S03 có nhiều dòng trong sổ là một tầng, không đổi dữ liệu.

**Architecture:** hàm thuần `khoaNhomThat`, `donViTheoNhomThat` trong `pipeline/lib/eval-labels.mjs`; `layMauTheoNhom` tra đơn vị qua khoá thật và trả báo gộp; `main` in báo.

**Tech Stack:** Node `.mjs`, `node:test`, Postgres DB thử `oneinvest_gcn_nhan`.

**Spec:** `docs/superpowers/specs/2026-11-04-nhom-dang-ky-hai-lan-s03-design.md`, hợp đồng `_acceptance/nhom-dang-ky-hai-lan-s03/contract.md`.

## Global Constraints

- Không ghi vào DB `oneinvest`; không áp 072, 073 lên DB thật. Phép đo chạy trên `oneinvest_gcn_nhan`.
- Không ghi tên kênh hay khoá nhóm thật vào tệp kho; fixture dùng tiền tố giả `ndkk:`.
- Không đổi sổ, bảng bài S03 (`stg_*`), transform, hook, đường thu, `/ops/sources`.

## Review Focus

- Lọc `--nhom-khop` loại nhóm trùng khỏi lát: không được in báo gộp cho nhóm không có bài trong lát (kiểm ở ca «không có cặp thì không báo»).
- Sổ DB thử có cặp thật cạnh fixture: báo gộp không được kéo cặp ngoài lát vào đầu ra của fixture (cùng ca trên).
- Bài có `conversation_id` rỗng: không ném lỗi, vẫn đếm vào số bài bỏ (ô 13).
- Khoá chỉ gồm tiền tố: giữ nguyên, không thành khoá rỗng (ô 12).
- Bản đột biến còn sót thư mục tạm khi lệnh đỏ: probe dọn trong `finally`.

---

### Task 1: Hàm thuần và lệnh

**Files:** sửa `pipeline/lib/eval-labels.mjs`, `pipeline/label-sample.mjs`; test `pipeline/lib/eval-labels.test.mjs`; `independent: false`.

**Interfaces — Produces:** `khoaNhomThat(khoa: string): string`; `donViTheoNhomThat(so: {unit_code, group_key, note?}[]): { donVi: Map<khoaThat, unit_code>, gop: {khoa, khoa_dai_dien, unit_code, gop_tu: string[], the_lech: boolean}[] }`; `donViCuaBai(donVi, khoa|null): string|null`. `layMauTheoNhom` trả thêm `gop_trung: {unit_code, gop_tu, the_lech, bai_khoa_phu}[]`, `tang_phu_da_co: {stratum, so}[]`.

- [ ] Viết ca «nhom that» trên bảng 13 ô của AC-4, ca «y hệt», ca đột biến ghim `NHOM THAT SAI`; chạy `node --test pipeline/lib/eval-labels.test.mjs`, kỳ vọng đỏ vì chưa có hàm.
- [ ] Viết ba hàm: regex `/^(?:[^:]+:)?group:(?=.)/`; đại diện xếp dòng khoá trần trước, rồi `unit_code`.
- [ ] Nối vào `layMauTheoNhom` và `main`, đúng hai chuỗi của design; báo gộp chỉ gồm nhóm có bài trong lát.
- [ ] Chạy lại test, kỳ vọng xanh. Phục vụ E4.

### Task 2: Đầu dò hai chiều

**Files:** tạo `_acceptance/nhom-dang-ky-hai-lan-s03/probes/mau-hai-khoa.mjs`, `probes/that-chi-doc.mjs`; `independent: false`.

**Interfaces — Consumes:** đầu ra chữ của lệnh; hằng `ROOT`, `URL_THU`, `noiDbThu` của `_acceptance/gan-nhan-theo-nhom-s03/probes/_db.mjs`.

- [ ] Viết `mau-hai-khoa.mjs`: fixture nhiều nhóm hơn số nhóm lớn, kỳ vọng tính tay (`D` 24 nội dung, 15 bài ở khoá phụ), sáu đột biến ghim thông điệp, dọn trong `finally`. Phục vụ E1, E2, E3, E5, E6.
- [ ] Viết `that-chi-doc.mjs`: `--thu` trên kết nối chỉ đọc, cặp đọc từ sổ, quét khoá trong tệp và đầu ra, chỉ in số lượng. Phục vụ E7, E8.
- [ ] Chạy hai lệnh, kỳ vọng exit 0, không còn `.ndk-dot-*` trong `pipeline/`.
- [ ] Commit theo `/verify`.
