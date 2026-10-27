# ui-standards-reui-thuoc-loi-thoi — thước baseline UI theo kịp các đợt dọn

Hàng P4 (giám sát thêm 27/10 ~01:10Z, ưu tiên 97.3). Lượt ghim lại `repin-20261027T005453Z-32146` cho thấy E7, E12 của hồ sơ
đã ký `ui-standards-reui` đỏ sẵn trên main.

## Gốc

- **E7 `ui_baseline_guard`** (`app/eslint-plugin-onehub-ui/selftest.mjs baseline-guard`) viết cứng tệp mẫu
  `src/app/ops/page.tsx` («có mục suppress: no-raw-palette 1, no-raw-table 1») — đợt dọn cổng Ops đã xoá hết mục suppress của
  tệp này.
- **E12 `ui_baseline_doc`** (`scripts/ui-standards/acceptance.mjs baseline-doc`) đòi tổng `lint:ui-report` = tổng
  `eslint-suppressions.json` = con số tổng đầu tài liệu `docs/research/ui-baseline-2026-10.md` (138) và mọi hàng Tổng trong tài
  liệu bằng 138. Thực tế: báo cáo 16 (12 baseline + 4 ngoại lệ có lý do), suppressions 12, tài liệu là NHẬT KÝ các lần đo
  138 → 131 → 85.

## Cách sửa (không đổi luật lint, không đổi eslint-suppressions.json)

- `baseline-guard`: tệp mẫu suy từ `eslint-suppressions.json` — tệp `.tsx` đầu tiên (thứ tự khoá) có mục suppress của một luật có
  mẫu vi phạm (`no-raw-palette`, `no-arbitrary-text-size`, `no-emoji-icons`, `no-raw-table`); thêm MỘT vi phạm của CÙNG luật →
  phải đỏ (vượt số đếm). Hết tệp phù hợp → đỏ có tên.
- `baseline-doc`: lần đo MỚI NHẤT trong tài liệu (cặp hàng Tổng cuối) = hàng Tổng của báo cáo sống (tổng/baseline/ngoại lệ/mới);
  cột Baseline của báo cáo = tổng suppressions; cột Mới = 0; baseline qua các lần đo chỉ giảm; hai bảng của một lần đo khớp.
- Tài liệu: thêm mục «Hiện trạng 27/10» chép nguyên báo cáo sống (16/12/4/0).
- `ui-standards-reui/evals.yaml`: E12 khai `status: not-run` + `superseded_by: ui-standards-reui-thuoc-loi-thoi#AC-2`
  (khuôn EVAL-THAY-BOI của kit, như `auth-error-e2-superseded`); cmd giữ nguyên. E7 GIỮ SỐNG: câu hứa đã ký («thêm vi phạm mới vào
  bản tạm của một file đã có mục suppress → lint đỏ; …») không nêu tên tệp, vẫn đúng với thước đã sửa. Bộ chứng của kit đòi hồ sơ
  thay `signed-off` (chữ ký người) và thẻ bắt tay `ui-standards-reui/E12` trong hợp đồng — có ở mục «Thay thế».
- `baseline-doc` thêm: tổng qua các lần đo không tăng. Nới so với E12 cũ (tổng = suppressions): ngoại lệ có lý do được tính riêng.
- selftest: phép kiểm «cây làm việc không đổi» bỏ `_acceptance/` (lượt chấm ghi sổ song song).

### Lối đã loại
- **Chỉ sửa câu `expected` của E7/E12 trong hồ sơ đã ký** — đổi lời hứa đã ký mà không có chữ ký mới.
- **Đặt lại tài liệu về 16 (xoá lịch sử)** — mất nhật ký các lần dọn.
