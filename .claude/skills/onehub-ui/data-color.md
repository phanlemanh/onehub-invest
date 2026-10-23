# Màu dữ liệu

Màu chỉ trạng thái hay nhấn mạnh thì theo `reui/rules/color.md` (token, Badge/Alert variant).
File này chỉ nói màu **mang số liệu**: bậc phân vị và chuỗi biểu đồ.

## Bậc p30/p60/p90: chỉ có hai nguồn

Không tự đặt ngưỡng, không tự chọn màu bậc. Bản đồ, chú giải, thanh trong bảng và badge KPI
đều phải đọc cùng một bậc.

**`components/finder/bins.ts`** (module thường; được phép chứa hex, xem danh sách file bản đồ ở SKILL.md):

| Export | Dùng cho |
|---|---|
| `cutsOf(values)` → `[p30, p60, p90]`, `binOf(value, cuts)` → 0..3, hoặc `null` khi chưa có số | tính bậc của tập đang xem |
| `BIN_COLORS` (hex blue-200/400/700/900) | lớp màu MapLibre |
| `BIN_SWATCH` (`bg-blue-200` … `bg-blue-900`) | ô màu trong chú giải |
| `BIN_INDICATOR` | thanh `Progress` trong ô bảng (ScoreCell) |
| `NO_DATA_COLOR` / `NO_DATA_COLOR_DARK` | vùng "chưa có số" ở sáng/tối. Luôn dùng cả cặp, không bao giờ chỉ một màu |

**`components/page/tiers.ts`** → `tierOf(mine, [p30, p60, p90], labels?)`: bậc cho `StatTiles`
dưới dạng Badge variant (≥p90 `success-light` "Nhóm đầu", ≥p60 `info-light` "Khá", ≥p30 `outline`
"Trung bình", thấp hơn `warning-light` "Thấp"). Số mà cao không có nghĩa là tốt (giá chẳng hạn)
thì truyền `labels` trung tính. Đừng đảo màu. Đây là module thường, vì trang server gọi
nó được (xem bẫy `"use client"` ở `copy-vi.md`).

## Biểu đồ

Luật nền: `reui/rules/color.md`, mục **Charts**. Nguồn duy nhất của màu chuỗi:
**`components/charts/palette.ts`** (`SERIES`, `themeOf(key)` cho `theme` của `ChartContainer`,
`swatchOf(key)` cho chấm chú giải/tooltip). Không viết `var(--color-…)`, lớp `bg-<sắc>-<bậc>`, hex
hay `oklch(` trong thư mục biểu đồ; thước `node scripts/ui-standards/b3-check.mjs palette` chặn.

Luật chọn màu (chốt ở B3, Cổng Phạm vi 2026-10-23):

1. **Mỗi nghĩa một sắc**, giữ ở mọi biểu đồ: Doanh thu luôn là chàm (indigo); cơ cấu doanh thu
   là doanh thu chia nhỏ nên dùng thang chàm đậm → nhạt.
2. **Biến palette cố định** `var(--color-<sắc>-<bậc>)`, không dùng `--chart-1..5`: theme hiện tại
   đổi sắc của chúng giữa sáng và tối (sáng: cam/xanh ngọc…, tối: xanh dương/xanh lá…).
3. **Bậc theo tương phản đồ hoạ ≥ 3:1 trên `--card`** (WCAG 2.2 SC 1.4.11): nền sáng lấy bậc gần
   500 nhất đạt 3:1, nền tối bậc 400. Đo: `b3-check.mjs contrast`.
4. **Danh sách miễn 3:1 đóng**: `expenses`, `share3`, `rest`, `hatch` — chuỗi trung tính hoặc bậc
   nhạt, danh tính đi bằng vị trí + chú giải có số. Thêm khoá miễn phải qua người duyệt.

| Khoá | Nghĩa | Sáng | Tối | Dùng ở | Miễn 3:1 |
|---|---|---|---|---|---|
| `revenue` | Doanh thu | indigo-500 (4,58) | indigo-400 (5,74) | Hiệu suất, P&L | |
| `occupancy` | Công suất | amber-600 (3,19) | amber-400 (10,43) | Hiệu suất | |
| `adr` | Giá phòng (ADR) | sky-600 (4,02) | sky-400 (8,21) | Hiệu suất | |
| `revpar` | RevPAR | teal-600 (3,66) | teal-400 (9,60) | Hiệu suất | |
| `expenses` | Chi phí | slate-300 (1,48) | slate-600 (2,37) | P&L | miễn |
| `margin` | Biên lợi nhuận | emerald-600 (3,67) | emerald-400 (9,27) | P&L | |
| `share1` | Cơ cấu, lát lớn nhất | indigo-700 (8,07) | indigo-500 (3,91) | Cơ cấu doanh thu | |
| `share2` | Cơ cấu, lát thứ hai | indigo-500 (4,58) | indigo-400 (5,74) | Cơ cấu doanh thu | |
| `share3` | Cơ cấu, lát thứ ba | indigo-300 (2,01) | indigo-300 (8,92) | Cơ cấu doanh thu | miễn |
| `rest` | "Khác" (nền lát) | zinc-100 | zinc-800 | Cơ cấu doanh thu | miễn |
| `hatch` | Vạch chéo + chấm "Khác" | zinc-300 | zinc-600 | Cơ cấu doanh thu | miễn |

- **Chuỗi chỉ có ở Ops** (biểu đồ của block Ops, vd `solution-dev-ops-*`): khai nhóm khoá riêng
  (tiền tố `ops`) trong `palette.ts`, giữ màu block gốc kèm cặp `dark:`; không lẫn vào các nghĩa
  Invest ở bảng trên. Chuỗi trùng nghĩa ở bất kỳ cổng nào (doanh thu, chi phí, biên, tỷ trọng…)
  phải dùng đúng khoá Invest. Nhóm Ops do đợt B1 điền khi merge; thước B3 không quét `components/ops`.
- Chuỗi mới: thêm khoá vào `palette.ts` + một dòng bảng này (`b3-check.mjs data-color` đối chiếu),
  chọn sắc chưa mang nghĩa khác; tái dùng khoá có sẵn khi cùng nghĩa.
- Biểu đồ dời từ block ReUI: giữ cấu trúc, chỉ thay màu block bằng khoá cùng nghĩa.
- Chuỗi biểu diễn bậc (choropleth, thanh xếp hạng) dùng `bins.ts`, không dùng bảng màu chuỗi.

## Ops (chờ B3)

Biểu đồ của cổng Ops (đợt B1, `ui-clean-b1-ops`) — chuỗi chỉ có nghĩa ở Ops:

| Biểu đồ | File | Chuỗi | Màu đang dùng |
|---|---|---|---|
| Luồng 7 ngày (`/ops/collections`) | `components/ops/collections/sync-activity.tsx` | S01 listing tươi · S02 listing chạm (chế độ Listing); S03 offer vào DB · S03 post raw (chế độ Tin Zalo) | `var(--chart-1)` / `var(--chart-2)` |

Dùng `--chart-1/2` TẠM; chuyển sang `palette.ts` (`themeOf()`) khi B3 merge — đợt nào merge sau làm bước chuyển.
Ô số và thanh phân đoạn của Ops dùng token trạng thái (`bg-success`, `bg-warning`, `bg-destructive`, `bg-muted-foreground/40`), không phải màu chuỗi.
