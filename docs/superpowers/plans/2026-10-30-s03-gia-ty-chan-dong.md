# s03-gia-ty-chan-dong — kế hoạch thi công

> Native (tuần tự trong phiên). Spec: `docs/superpowers/specs/2026-10-30-s03-gia-ty-chan-dong-design.md`.

**Goal:** `gatSo` không gạt đuôi nhóm nghìn của số tiền; `PHONE_RE`, `extractPhones` giữ nguyên.

## Global Constraints

- Không đổi `PHONE_RE`, `extractPhones`, luật giá, luật diện tích, chốt khoảng, khoá gom.
- Phép so dữ liệu thật chỉ đọc (`BEGIN READ ONLY`), không ghi DB nào.
- Mỗi phép đo mới có ca đỏ trên bản sao đột biến (chép cạnh tệp thật, xoá ngay) với thông điệp ghim mã ca.

## Review Focus

- «1.000.000.000» (tỷ chẵn nhỏ nhất) và «10.000.000.000» (hai chữ số đầu) đều ra đúng. (Task 1, dòng ma trận)
- SĐT dạng chấm nối sau SĐT dạng chấm («0901.234.567,0912.345.678») vẫn bị gạt cả hai. (Task 1)
- Số tiền dùng dấu phẩy nhóm nghìn («3,000,000,000») cùng luật bỏ qua — GIA_DONG không đọc dạng phẩy nên vẫn null, không lùi. (Task 2 so dữ liệu thật)

### Task 1: gatSo bỏ qua đuôi nhóm nghìn · phục vụ E1–E5 · independent: false

**Files:** Modify `pipeline/transform-zalo.mjs` (`gatSo`); Create `pipeline/scripts/gia-ty-chan-dong.test.mjs`.

**Interfaces — Produces:** `gatSo(text)` giữ chữ ký; thay `.replace(PHONE_RE, " ")` bằng hàm thay: khớp ở vị trí `i` bị giữ
nguyên khi `text[i-1]` là `.`/`,`, `text[i-2]` là chữ số, và khớp khớp `^\d{3}(?:<cùng dấu>\d{3})+$`.

- [ ] Viết `GT-AC-1…4` (ma trận theo hợp đồng, số assert = số dòng) + ca đỏ: bỏ điều kiện bỏ-qua (E1, E4); chỉ xét ký
  tự đứng trước (E2); đưa điều kiện dấu chấm/phẩy vào `PHONE_RE` (E3).
- [ ] Chạy → đỏ; sửa `gatSo`; chạy → xanh; `npm test` của pipeline xanh; commit.

### Task 2: Phép so toàn bộ bài thật · phục vụ E6 · independent: false

**Files:** Create `pipeline/scripts/so-gia-ty-chan-dong.mjs`.

- [ ] Đọc `loadStgPosts` trong `BEGIN READ ONLY` (DATABASE_URL, mặc định oneinvest); nạp bản nền `git show ecaf5ff0:pipeline/transform-zalo.mjs`
  (chép tạm cạnh tệp thật) và bản cây; mỗi bài so `priceVnd`, `pricePerm2Vnd`, `phones`; in tổng, số bài đổi giá (kèm mã
  bài, nhãn `gia-ty-chan-dong` khi chữ gốc có `\d{1,3}(\.000){3,}`), số bài đổi SĐT. Exit 1 khi có bài đổi SĐT hoặc bài
  đổi giá không mang nhãn. `--dot-bien`: thay bản cây bằng bản sao đưa điều kiện vào `PHONE_RE`, thêm một bài tổng hợp
  «Cho thuê 2PN 9tr LH 0901234567,0912345678 T.Lan» → phải exit 1 gọi tên bài ấy.
- [ ] Chạy cả hai chế độ; commit.
