# Kế hoạch thi công — tap-nhan-mau-ocp1 (PL8, T2)

> For agentic workers: thực thi tuần tự trong vòng chính (superpowers:executing-plans). Mỗi phép đo mới chạy cặp hai
> chiều trên cùng fixture (xanh trên bản thật, đỏ trên bản chép hỏng), thông điệp ghim đúng chữ trong `evals.yaml`.

**Mục tiêu:** bộ sinh tập tin mẫu lát OCP1 có đáp án biết sẵn — hàm thuần, sinh lại ra đúng tập, mang dấu mẫu, không
đường nào tới canonical/stg. Hợp đồng: `_acceptance/tap-nhan-mau-ocp1/contract.md` (Mạnh duyệt 30/10, Hỏi-1/2/3 theo
khuyến nghị). Thiết kế: `docs/superpowers/specs/2026-10-30-tap-nhan-mau-ocp1-design.md`.

**DB:** chỉ đọc `oneinvest` :5433 (giao dịch `READ ONLY`). Đối chứng đỏ của E8b dùng bảng tạm cùng tên trong giao dịch
chỉ đọc rồi ROLLBACK — không ghi bảng thật. Executor `tnm_*`: P4-95 đã duyệt (chỉ thêm dòng).

## Task 1 — Thư viện khuôn

- Files: `pipeline/lib/khuon-mau-ocp1.mjs`
- Khoảng 20 khuôn, mỗi khuôn rút từ một tin S03 thật của lát (đọc qua `loadStgPosts` + `LAT_NHOM.ocp1`): `id` (`K01`…),
  `goc` (= `textHash` của tin gốc), `listing_intent`, `kind`, `property_type` cố định, `khung` (chữ tin gốc đã bỏ SĐT,
  URL, tên người, chữ số mơ hồ; giá trị thay bằng ô `{gia}` `{dt}` `{pn}` `{toa}` `{du_an}` `{sdt}`).
- Phủ năm tổ hợp: offer×sale, offer×rent_lt, inquiry×sale, inquiry×rent_lt, not_listing (không ô nào).
- Quy ước loại hình ghi ở đầu tệp: căn hộ khi chữ có «căn hộ»/«CHCC» hoặc «toà <mã>»; biệt thự → house; shop → commercial.
- Bể giá trị + dạng viết của từng ô (giá bán 5 dạng, giá thuê 3 dạng, diện tích 3, phòng ngủ 3, dự án 3, toà mã công khai).
- Phục vụ: AC-2, AC-4, AC-5, AC-6

## Task 2 — Bộ sinh + lệnh

- Files: `pipeline/lib/tap-mau.mjs`, `pipeline/label-mau.mjs`, `pipeline/CLAUDE.md` (một dòng bảng lệnh)
- `sinhTapMau({lat, n, seed})`: khuôn theo hoán vị băm `seed:khuon:id`, tin thứ k dùng khuôn `k mod K`; dạng và giá trị
  chọn bằng băm `seed:k:ô`; nhãn dựng từ giá trị đã bơm theo khuôn chuẩn hoá PL7; dev/test chia đôi theo băm id.
  `veJsonl(tap)`: dòng đầu dấu mẫu + mỗi tin một dòng. Không `pg`, không SQL, không `Math.random`/`Date`.
- `label-mau.mjs --lat ocp1 --n <n> --seed <s> [--out <tệp>]`: tóm tắt ý định × loại tin, dev/test; cờ lạ → thoát 1.
- Phục vụ: AC-1, AC-2, AC-7, AC-8

## Task 3 — Test pipeline (E1, E2, E4, E7, E8)

- Files: `pipeline/lib/tap-mau.test.mjs`
- Mỗi phép đo là một hàm kiểm nhận module bộ sinh; chạy trên bản thật (xanh) và bản chép hỏng ở thư mục tạm (đỏ, khớp
  thông điệp ghim): `Math.random` → 'TAP KHONG TAT DINH'; tệp kiểm sửa một byte → 'TEP KIEM CU'; «3 tỷ 150» →
  3015000000 → 'DAP AN LECH O GIA'; quên not_stated → 'O VANG KHONG LA TIN KHONG NEU'; bỏ khuôn inquiry×rent_lt →
  'O PHU TRONG inquiry×rent_lt'; veJsonl bỏ dòng đầu → 'THIEU DONG DAU MAU'; tệp import tap-mau → 'BO SINH CO DUONG TOI
  PIPELINE'; label-mau import pg → 'BO SINH CO DUONG GHI DB'.
- E2 đọc lại giá trị từ chữ tin bằng khung của khuôn (regex), bộ đọc dạng viết riêng của test — không gọi lại bể.
- Phục vụ: AC-1, AC-2, AC-4, AC-7, AC-8

## Task 4 — Test app (E3)

- Files: `app/tests/labels-mau.test.tsx`
- n = 200 × ba seed: nhãn → `RawLabels` (giá: ≥ 1 tỷ dùng đơn vị tỷ, dưới dùng triệu, số thập phân dấu phẩy) →
  `chuanHoaLuot` thật → `ok` và rows trùng nhãn. Đối chứng đỏ: diện tích ghi «64,5» → 'NHAN KHONG QUA BO GHI THAT'.
- Phục vụ: AC-3

## Task 5 — Probe DB (E5, E6, E8b)

- Files: `_acceptance/tap-nhan-mau-ocp1/probes/db.mjs`
- Một tiến trình, ba phần, giao dịch chỉ đọc: GOC (băm có trong lát, không trùng, đoạn cố định theo thứ tự ≥ 80%), DINH
  DANH (SĐT/URL/tên người gửi/tên nhóm/tên nguồn thật trên mã nguồn bộ sinh + tập n = 200 ba seed + `mau-kiem.jsonl`),
  CANONICAL/STG (đếm `mau-`). Mỗi phần chạy đối chứng đỏ trên bản dữ liệu hỏng trong bộ nhớ.
- Phục vụ: AC-5, AC-6, AC-8

## Task 6 — Tệp kiểm, executor, phạm vi

- Files: `_acceptance/tap-nhan-mau-ocp1/mau-kiem.jsonl` (sinh bằng lệnh, n = 40, seed `kiem`), `_acceptance/config.yaml`
  (bốn dòng `tnm_*`), chạy `probes/pham-vi.sh`.
- Phục vụ: AC-1, AC-9, AC-10
