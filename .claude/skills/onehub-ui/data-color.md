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

- Luật nền: `reui/rules/color.md`, mục **Charts**. Màu chuỗi khai trong config của
  `ChartContainer`. Chuỗi nào phải giữ danh tính qua cả sáng lẫn tối thì dùng biến palette cố
  định (`var(--color-violet-500)`), như các block ReUI vẫn làm.
- **Bảng màu chung cho chuỗi dữ liệu: TBD ở B3.** Đây là chỗ để dành có chủ đích, không phải
  bỏ quên. B3 sẽ chốt bảng màu và ghi vào đây, đồng thời gom `use-trigger-tooltip`,
  `value-faces`, `chart-toolbar`, `format` và `icons` về một chỗ dùng chung. Trước B3, biểu đồ
  mới giữ nguyên màu của block gốc, không tự chọn màu.
- Chuỗi biểu diễn bậc (choropleth, thanh xếp hạng) dùng `bins.ts`, không dùng bảng màu chuỗi.

## Ops (chờ B3)

Biểu đồ của cổng Ops (đợt B1, `ui-clean-b1-ops`) — chuỗi chỉ có nghĩa ở Ops:

| Biểu đồ | File | Chuỗi | Màu đang dùng |
|---|---|---|---|
| Luồng 7 ngày (`/ops/collections`) | `components/ops/collections/sync-activity.tsx` | S01 listing tươi · S02 listing chạm (chế độ Listing); S03 offer vào DB · S03 post raw (chế độ Tin Zalo) | `var(--chart-1)` / `var(--chart-2)` |

Dùng `--chart-1/2` TẠM; chuyển sang `palette.ts` (`themeOf()`) khi B3 merge — đợt nào merge sau làm bước chuyển.
Ô số và thanh phân đoạn của Ops dùng token trạng thái (`bg-success`, `bg-warning`, `bg-destructive`, `bg-muted-foreground/40`), không phải màu chuỗi.
