# Số đo "trước": vi phạm chuẩn UI ReUI (baseline)

- **Ngày đo:** 2026-10-22
- **Commit:** `b4021dc` (cấu hình lint + baseline; nhánh `feat/ui-standards-reui`)
- **Chạy lại:** `cd app && npm run lint:ui-report` (cần `eslint-suppressions.json` còn nguyên để tính cả mục baseline)
- **Đối chiếu tổng:** `node -e 'const s=require("./eslint-suppressions.json");console.log(Object.values(s).flatMap(Object.values).reduce((a,v)=>a+v.count,0))'` (chạy trong `app/`) ra **138**, khớp tổng bên dưới.

Cách đếm: **mỗi chuỗi class / phần tử JSX vi phạm là một báo cáo**, không phải mỗi lớp Tailwind. Phạm vi `src/**/*.{ts,tsx}`, trừ bốn thư mục vendor (`components/ui`, `reui`, `blocks`, `examples`). Hex trong 5 file bản đồ được phép (tắt riêng `no-hardcoded-color`).

## Số liệu lint UI (luật `onehub-ui/*`)

**Tổng 138 vi phạm trong 31 file.** Baseline = mục nằm trong `eslint-suppressions.json`; ngoại lệ = `eslint-disable` kèm lý do; mới = đang làm lint đỏ.

### Theo luật

| Luật | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `onehub-ui/no-arbitrary-text-size` | 32 | 32 | 0 | 0 |
| `onehub-ui/no-raw-palette` | 30 | 30 | 0 | 0 |
| `onehub-ui/no-raw-controls` | 26 | 26 | 0 | 0 |
| `onehub-ui/no-emoji-icons` | 17 | 17 | 0 | 0 |
| `onehub-ui/no-hardcoded-color` | 16 | 16 | 0 | 0 |
| `onehub-ui/no-banned-motion` | 8 | 8 | 0 | 0 |
| `onehub-ui/no-raw-table` | 6 | 6 | 0 | 0 |
| `onehub-ui/no-native-dialogs` | 3 | 3 | 0 | 0 |
| **Tổng** | 138 | 138 | 0 | 0 |

### Theo thư mục (cấp 2 dưới `src/`)

| Thư mục | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `components/ops` | 45 | 45 | 0 | 0 |
| `components/marketing` | 18 | 18 | 0 | 0 |
| `app/ops` | 15 | 15 | 0 | 0 |
| `components/invest` | 12 | 12 | 0 | 0 |
| `components/insight` | 11 | 11 | 0 | 0 |
| `components/auth` | 9 | 9 | 0 | 0 |
| `components/finder` | 9 | 9 | 0 | 0 |
| `components/saved` | 5 | 5 | 0 | 0 |
| `app/(app)` | 4 | 4 | 0 | 0 |
| `components/yield` | 4 | 4 | 0 | 0 |
| `components/listing` | 3 | 3 | 0 | 0 |
| `components/shell` | 2 | 2 | 0 | 0 |
| `components/compare` | 1 | 1 | 0 | 0 |
| **Tổng** | 138 | 138 | 0 | 0 |


## Đối chiếu với kiểm kê tay (spec mục 7)

| Chỉ số | Kiểm kê tay | Lint (đo máy) | Ghi chú chênh lệch |
|---|---|---|---|
| Màu Tailwind thô | 62 chỗ / 13 file | 30 báo cáo / 12 file | Kiểm kê tay đếm từng lớp (`grep` ra 62 lớp / 13 file); lint đếm một lần cho mỗi chuỗi class, nên một chuỗi có 3 lớp chỉ là 1 báo cáo. File thứ 13 là `components/yield/pnl/data.ts`: lớp thô đi kèm cặp `dark:` nên luật cho qua (chỉ bắt lớp thô thiếu `dark:` hoặc màu trạng thái tự tô). |
| `text-[Npx]` | 32 chỗ / 12 file | 32 báo cáo / 12 file | Khớp số. Cụ thể `grep` ra 30 lớp `text-[Npx]`, cộng 2 `text-[1.75rem]` (`saved-list.tsx`, `login-form.tsx`) cũng bị luật cấm; hai phép đếm trùng nhau về tổng. |
| Bảng tự dựng | ~5 | 6 `<table>` / 6 file | Kiểm kê tay là ước lượng; lint đếm thẻ `<table>` thực. |
| Điều khiển thô / hộp thoại tay | 4 cụm component tay | 26 `no-raw-controls` + 3 `no-native-dialogs` | Kiểm kê tay đếm theo cụm component; lint đếm từng thẻ `<input>`/`<select>`/`<button>`… và từng `alert`/`confirm`/`prompt`. |

Ba luật không có đối ứng trong kiểm kê tay: `no-emoji-icons` (17), `no-banned-motion` (8) và `no-hardcoded-color` (16, ngoài 5 file bản đồ).

## Kiểm kê tay (không đo được bằng lint)

| Chỉ số | Nguồn | Trước | Đích |
|---|---|---|---|
| Số kiểu ô KPI | kiểm kê tay | 6 | 1 |
| Số kiểu bảng | kiểm kê tay | 3 | 1 |
| Số kiểu page header | kiểm kê tay | 5 | 1 |
| Trang có trạng thái tải | kiểm kê tay | 0 / 21 | mọi trang có vùng dữ liệu |
| File feature > 200 dòng | `wc -l` | 19 | giảm; không ép số |

## Ghi chú

- Dòng "render không thuần" (`Math.random()`/`Date.now()` trong render) do `react-hooks/purity` của `eslint-config-next` lo (mức `error`), không có luật onehub-ui riêng.
- `eslint-suppressions.json` chỉ được giảm: ESLint 9.39.5 mặc định thoát mã 2 khi còn mục suppression không còn xảy ra, buộc phải `npx eslint --prune-suppressions` sau khi sửa xong.
- ESLint không tự bắt `eslint-disable` trần hay directive nêu đích danh `onehub-ui/require-disable-reason` (nó nuốt báo cáo); `npm run lint` chạy thêm `check-bare-disables.mjs` để bắt hai dạng đó.
