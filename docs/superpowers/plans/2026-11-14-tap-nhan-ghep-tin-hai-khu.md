# PL35 tap-nhan-ghep-tin-hai-khu — kế hoạch thi công

> Native, vòng chính. Thiết kế `docs/superpowers/specs/2026-11-13-tap-nhan-ghep-tin-hai-khu-design.md`, hợp đồng
> `_acceptance/tap-nhan-ghep-tin-hai-khu/contract.md` (duyệt 14/11; nhãn toà trước theo ROADMAP §3 mục 48).

### T1 — khu theo nhóm, bộ phân tầng (E3, E4) · independent: false
- `pipeline/lib/eval-labels.mjs`: `LAT_KHU = { op1, gp }` (mẫu tên nhóm), `khuCuaNhom(ten) → 'op1'|'gp'|null` (khớp đúng một).
- `pipeline/lib/tang-ghep.mjs`: `mucGan(text, { toa: string[], truc: string[] }) → 'toa'|'truc'|'khong'` — chỉ nhận chữ bài
  và danh sách tên toà/mã trục của khu; tên toà khớp đúng một toà → `toa`; mã trục khớp → `truc`; mơ hồ (khớp từ hai toà),
  ngoài danh bạ, không nêu → `khong`. `TANG_HAI_KHU`, `TANG_BAT_BUOC`.
- Test `pipeline/scripts/tap-nhan-hai-khu.test.mjs` (`pl35_ham`), ma trận viết trước.

### T2 — chọn mẫu lát `hai-khu-ghep` (E1, E2) · independent: false
- `label-sample.mjs`: lát `hai-khu-ghep` — bài S03 căn hộ của nhóm khớp một khu, khử trùng, phân tầng khu × mức gắn, mỗi tầng
  `min(75, …)` bằng `chonMau`, ghi `stratum`; báo «thiếu N», cận dưới Wilson tối đa, nhãn «bắt buộc»/«cho PL36».

### T3 — nháp (E5, E6, E7) · independent: false
- `label-nhap-ghep.mjs --lat hai-khu-ghep`: tác tử (Haiku qua agent/config; test bằng tác tử giả) nhận chữ bài + toà/trục của
  khu, ghi `draft` khuôn `nhapTuDraft`; câu trích phải có trong chữ bài; bỏ qua bài đã có nhãn người; không đọc `field_assertions`.

### T4 — đóng băng (E8) · independent: true
- `label-dong-bang.mjs --lat hai-khu-ghep`: tệp JSON chuẩn hoá trong `pipeline/eval-sets/`, băm sha256, loại bài hai người lệch.

### T5 — thước DB và dữ liệu thật (E1, E2, E5–E9), ranh giới (E7b, E10) · independent: false
- `pipeline/scripts/tap-nhan-hai-khu-db.sh itest|do`, itest trên DB thử, `tap-nhan-hai-khu-do.mjs`, bảng nhóm kỳ vọng
  `tap-nhan-hai-khu-nhom.json`, `tap-nhan-hai-khu-ranh-gioi.mjs`.
