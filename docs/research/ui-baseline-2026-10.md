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

> **Cập nhật 2026-10-23 (merge main sau PR #3 + #5):** trang `/deals` dời sang `/ops/deals`, nên
> 2 vi phạm của nó (`no-arbitrary-text-size`, `no-emoji-icons`) đổi khoá từ `src/app/(app)/deals/page.tsx`
> sang `src/app/ops/deals/page.tsx`: `app/(app)` 4 → 2, `app/ops` 15 → 17. Tổng vẫn **138**, không luật
> nào tăng (`check-baseline-growth` exit 0). Số theo luật giữ nguyên là mốc "trước".

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

## Sau B3 — thống nhất biểu đồ (2026-10-23)

- **Commit:** `fdda593` (nhánh `claude/ui-clean-b3-charts-f4d78e`, đã merge main `8595dc0`: Phần A + #3–#8 + #10; đo lần đầu ở `a7e4ba5` trước merge: 133 vi phạm / 29 file)
- **Chạy lại:** `cd app && npm run lint:ui-report`; thước của đợt: `node scripts/ui-standards/b3-check.mjs <lệnh>`
- Mục suppress phạm vi B3 (performance, revenue-mix, yield/pnl): 8 → 0 — 5 `no-raw-palette` sửa thật bằng bảng màu chung (`components/charts/palette.ts`), 3 thành ngoại lệ có lý do "nguyên bản @reui/chart-6" (2 `no-banned-motion`, 1 `no-raw-controls`).
- File > 200 dòng phạm vi B3: 7 → 0 (margin-plot 780, metric-plot 510, plot-motion 282, revenue-mix/chart 251, performance/chart 231, pnl/chart 203, performance/chart-toolbar 201).
- Code biểu đồ chép trùng (`b3-check.mjs duplicates`, cửa sổ 6 dòng giữa hai tệp): 7 nhóm trùng + 6 bản riêng `use-trigger-tooltip`/`icons` → 0; một bảng màu chuỗi thay ba bảng riêng.

### Số liệu lint UI toàn app tại commit trên

**Tổng 131 vi phạm trong 28 file.** Baseline = mục nằm trong `eslint-suppressions.json`; ngoại lệ = `eslint-disable` kèm lý do; mới = đang làm lint đỏ.

#### Theo luật

| Luật | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `onehub-ui/no-arbitrary-text-size` | 32 | 32 | 0 | 0 |
| `onehub-ui/no-raw-controls` | 26 | 25 | 1 | 0 |
| `onehub-ui/no-raw-palette` | 25 | 25 | 0 | 0 |
| `onehub-ui/no-hardcoded-color` | 16 | 16 | 0 | 0 |
| `onehub-ui/no-emoji-icons` | 15 | 15 | 0 | 0 |
| `onehub-ui/no-banned-motion` | 8 | 6 | 2 | 0 |
| `onehub-ui/no-raw-table` | 6 | 6 | 0 | 0 |
| `onehub-ui/no-native-dialogs` | 3 | 3 | 0 | 0 |
| **Tổng** | 131 | 128 | 3 | 0 |

#### Theo thư mục (cấp 2 dưới `src/`)

| Thư mục | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `components/ops` | 45 | 45 | 0 | 0 |
| `components/marketing` | 18 | 18 | 0 | 0 |
| `app/ops` | 17 | 17 | 0 | 0 |
| `components/invest` | 12 | 12 | 0 | 0 |
| `components/auth` | 9 | 9 | 0 | 0 |
| `components/finder` | 9 | 9 | 0 | 0 |
| `components/insight` | 6 | 3 | 3 | 0 |
| `components/saved` | 5 | 5 | 0 | 0 |
| `components/yield` | 4 | 4 | 0 | 0 |
| `components/listing` | 3 | 3 | 0 | 0 |
| `components/shell` | 2 | 2 | 0 | 0 |
| `components/compare` | 1 | 1 | 0 | 0 |
| **Tổng** | 131 | 128 | 3 | 0 |

## Ghi chú

- Dòng "render không thuần" (`Math.random()`/`Date.now()` trong render) do `react-hooks/purity` của `eslint-config-next` lo (mức `error`), không có luật onehub-ui riêng.
- `eslint-suppressions.json` chỉ được giảm: ESLint 9.39.5 mặc định thoát mã 2 khi còn mục suppression không còn xảy ra, buộc phải `npx eslint --prune-suppressions` sau khi sửa xong.
- ESLint không tự bắt `eslint-disable` trần hay directive nêu đích danh `onehub-ui/require-disable-reason` (nó nuốt báo cáo); `npm run lint` chạy thêm `check-bare-disables.mjs` để bắt hai dạng đó.

## Sau B1 — cổng Ops (ui-clean-b1-ops)

- **Ngày đo:** 2026-10-23 · **Commit:** `70a6d92` (nhánh `claude/ui-clean-b1-ops-c5a53a`, sau khi merge main `021b48e` có B3 — PR #12)
- **Chạy lại:** `cd app && npm run lint:ui-report`
- **Phạm vi B1 còn 0 mục** baseline trên các file của đợt (`app/ops/**` trừ `ops/deals` và `ops/review`, `components/ops/**` trừ `review-card.tsx`, `components/shell/ops-shell/**`) — đếm từ `eslint-suppressions.json` bằng `node scripts/ui-standards/b1-ops.mjs docs`.
- Hàng `app/ops` còn lại là `ops/deals/page.tsx` (đợt B5). Hàng `components/ops` còn lại là 20 mục của `review-card.tsx`: Task 12 (`/ops/review` theo solution-agents-5) đã TÁCH khỏi vòng này (Mạnh quyết «tách» 2026-10-23), làm ở vòng sau khi nhánh enrich vào main.

**Tổng 85 vi phạm trong 21 file.** Baseline = mục nằm trong `eslint-suppressions.json`; ngoại lệ = `eslint-disable` kèm lý do; mới = đang làm lint đỏ.

#### Theo luật

| Luật | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `onehub-ui/no-arbitrary-text-size` | 26 | 26 | 0 | 0 |
| `onehub-ui/no-raw-palette` | 18 | 18 | 0 | 0 |
| `onehub-ui/no-hardcoded-color` | 16 | 16 | 0 | 0 |
| `onehub-ui/no-banned-motion` | 8 | 6 | 2 | 0 |
| `onehub-ui/no-emoji-icons` | 8 | 8 | 0 | 0 |
| `onehub-ui/no-raw-controls` | 8 | 7 | 1 | 0 |
| `onehub-ui/no-raw-table` | 1 | 1 | 0 | 0 |
| **Tổng** | 85 | 82 | 3 | 0 |

#### Theo thư mục (cấp 2 dưới `src/`)

| Thư mục | Tổng | Baseline | Ngoại lệ có lý do | Mới (đỏ) |
|---|---:|---:|---:|---:|
| `components/ops` | 20 | 20 | 0 | 0 |
| `components/marketing` | 18 | 18 | 0 | 0 |
| `components/invest` | 12 | 12 | 0 | 0 |
| `components/finder` | 9 | 9 | 0 | 0 |
| `components/auth` | 7 | 7 | 0 | 0 |
| `components/insight` | 4 | 1 | 3 | 0 |
| `components/yield` | 4 | 4 | 0 | 0 |
| `components/listing` | 3 | 3 | 0 | 0 |
| `components/saved` | 3 | 3 | 0 | 0 |
| `app/ops` | 2 | 2 | 0 | 0 |
| `components/shell` | 2 | 2 | 0 | 0 |
| `components/compare` | 1 | 1 | 0 | 0 |
| **Tổng** | 85 | 82 | 3 | 0 |


### So với "trước"

| Chỉ số | Trước (138 / 31 file) | Sau B1 |
|---|---:|---:|
| `components/ops` | 45 | xem bảng trên |
| `app/ops` (trừ deals) | 15 | 0 |
| Kiểu bảng / ô KPI / đầu trang ở cổng Ops | 3 / 2 / 5 | 1 InsightGrid + lưới của block · StatTiles + ô của block (ngoại lệ có tên) · 1 PageHeader |
