# B3 — Thống nhất biểu đồ (bảng màu chung, gom code trùng, tách file) — thiết kế

Ngày: 2026-10-23 · Chủ: Mạnh · Hạng: T2 · Hồ sơ: `_acceptance/ui-clean-b3-charts/`
Nguồn: spec `2026-10-22-ui-ux-standards-design.md` §5 mục 3 (B3) · plan
`2026-10-22-ui-standards-reui.md` Phần B · `reui/rules/color.md` mục Charts ·
`onehub-ui/data-color.md` (đang ghi "TBD ở B3").

## 1. Ý định

Ba biểu đồ của app là ba block ReUI chuyển thể, mỗi cái mang bảng màu, bộ chữ và bộ
hook riêng chép từ block gốc:

| Biểu đồ | Block gốc | Thư mục | Ở đâu |
|---|---|---|---|
| Hiệu suất theo tháng | `@reui/chart-6` | `components/insight/performance/` | Insight thị trường + phường |
| Cơ cấu doanh thu | `@reui/chart-13` | `components/insight/revenue-mix/` | Insight thị trường + phường |
| Doanh thu và chi phí 12 tháng tới | `@reui/chart-36` | `components/yield/pnl/` | `/yield` |

B3 làm ba việc, không đổi dữ liệu, props hay bố cục:

1. **Một bảng màu chung cho chuỗi dữ liệu**, một module là nguồn duy nhất, ghi vào
   `onehub-ui/data-color.md` (thay chỗ "TBD").
2. **Gom code chép trùng** về `components/charts/`.
3. **Tách file quá 200 dòng** mà không đổi hành vi.

## 2. Hiện trạng đo được (2026-10-23)

- Màu chuỗi hiện tại **chính là màu block gốc** (đối chiếu `components/blocks/chart-*`):
  chart-6 teal/amber/sky/violet-500 một bậc cho cả hai chế độ; chart-13 thang violet
  700/500/300 + zinc; chart-36 indigo/slate/emerald có cặp sáng/tối. "Doanh thu" mang
  ba màu khác nhau ở ba biểu đồ.
- `--chart-1..5` của theme **đổi sắc giữa sáng và tối** (sáng: cam/xanh ngọc/…; tối:
  xanh dương/xanh lá/…) → theo luật ReUI không dùng được cho chuỗi cần giữ danh tính.
- Tương phản trên `--card` (WCAG 2.2 SC 1.4.11, đồ hoạ ≥ 3:1), đo bằng oklch → sRGB:
  teal-500 2,42 · amber-500 2,15 · sky-500 2,71 ở nền sáng (dưới 3:1); bậc 600 đạt
  3,2–4,0; bậc 400 ở nền tối đạt 5,7–10,4.
- Lint `onehub-ui` trong phạm vi: 8 mục suppress (4 `no-raw-palette` performance/data.ts,
  1 revenue-mix/value-faces.tsx, 2 `no-banned-motion` metric-plot.tsx, 1
  `no-raw-controls` metric-tiles.tsx).
- Trùng lặp: `use-trigger-tooltip.ts` ×3 giống hệt; `value-faces` (CAP_BOX, DotSeparator,
  Fact…) ×3; `icons` (toast) ×3; hàm `copyText` ×2, tải CSV ×3; nút "Thao tác khác"
  (tooltip + dropdown) ×3; ToggleGroup "nổi lên thẻ" ×2; hàng tooltip (glyph · nhãn ·
  số) ×2; "Tháng M/YYYY" ×2.
- File > 200 dòng (7): margin-plot 780, metric-plot 510, plot-motion 282, revenue-mix/chart
  251, performance/chart 231, pnl/chart 203, performance/chart-toolbar 201.

## 3. Mục tiêu / phi mục tiêu / phản mục tiêu

**Mục tiêu**: một nguồn màu chuỗi, đọc được ở cả hai chế độ; không còn code biểu đồ chép
trùng; mọi file trong phạm vi ≤ 200 dòng; 8 mục suppress của phạm vi gỡ hết.

**Phi mục tiêu**: không đổi dữ liệu/query/props; không đổi bố cục, chữ, chuyển động của
block; không đổi theme/brand (`--chart-*` giữ nguyên); không đụng `app/src/app/ops/**`,
`components/ops/**` (B1); không đụng ô KPI (B2): tổng doanh thu ở revenue-mix/chart.tsx
(khối "Tổng doanh thu") và các ô `Stat` của pnl.

**Phản mục tiêu**: lint xanh nhờ `eslint-disable`; "gom" thành một component khổng lồ
nhiều cờ; đổi hành vi (tooltip, đổi chỉ số/kỳ, menu, xuất CSV, sao chép) mà không ai
thấy; màu mới đẹp ở sáng nhưng chìm ở tối.

## 4. Bảng màu chung

Module `app/src/components/charts/palette.ts` là nguồn DUY NHẤT; mọi biểu đồ lấy màu
qua nó (config `ChartContainer` dạng `theme: { light, dark }` + lớp chấm tĩnh có cặp
`dark:`). Luật chọn (ghi vào data-color.md):

1. Mỗi **nghĩa** một sắc, giữ nguyên ở mọi biểu đồ.
2. Biến palette cố định (`var(--color-<sắc>-<bậc>)`), không dùng `--chart-1..5`.
3. Bậc: nền sáng lấy bậc gần 500 nhất đạt ≥ 3:1 trên `--card`; nền tối bậc 400.
4. Chuỗi trung tính (chi phí, "Khác", hatch) và bậc nhạt của thang được miễn 3:1 —
   danh tính đi bằng vị trí + chú giải có số. Danh sách miễn ĐÓNG, ghi trong module.

**Phương án khuyến nghị (A — theo nghĩa)** — Hỏi-1 ở Cổng Phạm vi:

| Khoá | Nghĩa | Sáng | Tối | Dùng ở | So với hiện tại |
|---|---|---|---|---|---|
| `revenue` | Doanh thu | indigo-500 | indigo-400 | performance, pnl | performance: teal → indigo |
| `occupancy` | Công suất | amber-600 | amber-400 | performance | 500 → 600 (sáng) |
| `adr` | Giá phòng | sky-600 | sky-400 | performance | 500 → 600 (sáng) |
| `revpar` | RevPAR | teal-600 | teal-400 | performance | violet → teal |
| `expenses` | Chi phí | slate-300 | slate-600 | pnl | giữ (miễn 3:1) |
| `margin` | Biên lợi nhuận | emerald-600 | emerald-400 | pnl | giữ |
| `share1..3` | Thang cơ cấu doanh thu | indigo-700/500/300 | indigo-500/400/300 | revenue-mix | violet → indigo (share3 miễn) |
| `rest`, `hatch` | Phần còn lại | zinc-100 · zinc-300 | zinc-800 · zinc-600 | revenue-mix | giữ (miễn) |

Lý do khuyên A: G4 của spec ("một bảng màu biểu đồ") nghĩa là một từ vựng màu cho cả
sản phẩm; "Doanh thu" một màu ở cả ba biểu đồ, và cơ cấu doanh thu là doanh thu chia nhỏ
nên dùng thang của chính màu đó. Phương án B (giữ sắc từng block, chỉ nâng bậc cho đủ
3:1 + thêm cặp tối) rẻ hơn về thị giác nhưng giữ "Doanh thu" ba màu.
Ảnh trước / bản thử A: `_acceptance/ui-clean-b3-charts/evidence/{before,proto-a}/`.

## 5. Gom code trùng — `app/src/components/charts/`

| File chung | Thay cho | Ghi chú |
|---|---|---|
| `palette.ts` | màu trong performance/data.ts, revenue-mix/value-faces.tsx, pnl/data.ts | §4 |
| `use-trigger-tooltip.ts` | 3 bản giống hệt | chép nguyên một bản |
| `faces.tsx` | CAP_BOX, CAP_TRUNCATE, DotSeparator, Fact, KeyDot (chấm màu theo `swatch`) | khoá riêng từng biểu đồ (AverageKey, LineKey, TargetKey, SliceDot) ở lại thư mục biểu đồ, dùng `faces` chung |
| `icons.tsx` | 3 bản `icons.tsx` | hợp các glyph; giữ nguyên glyph từng chỗ đang dùng (CopyIcon vs FileTextIcon) |
| `actions.ts` | `copyText` ×2, tải CSV ×3 | `downloadFile(name, body, type)`, `copyText(text, title, description)` — cùng toast, cùng chữ |
| `overflow-menu.tsx` | nút "Thao tác khác" (Tooltip + DropdownMenu) ×3 | trigger + nội dung qua `children`; `size` theo chỗ dùng (icon / icon-sm) |
| `segmented-toggle.tsx` | ToggleGroup "nổi lên thẻ" ×2 | items, value, aria-label, `size`, `renderLabel` |
| `tooltip-row.tsx` | ReadoutRow (performance) + CardRow (pnl) | khác nhau đúng khoảng cách → prop `className` |
| `format.ts` | "Tháng M/YYYY" ×2 | `formatLongMonth`; pnl `formatPercent` → `fmtPct` của `lib/format` (cùng kết quả: 1 chữ số thập phân, chưa ai dùng dạng có dấu) |

Không gom: `useStillSeries` (metric-plot) và `useFrozenDemo` (mix-donut) — một bên theo
dõi đổi `data-demo`, bên kia không; gộp là đổi hành vi.

## 6. Tách file (≤ 200 dòng, không đổi hành vi)

- `pnl/margin-plot.tsx` 779 → `margin-plot.tsx` (MarginPlot + đồng hồ reveal) ·
  `plot-scope.ts` (PlotContext, useRevealRef, hằng) · `plot-bars.tsx` (PlotBar, SHAPES,
  Hatch) · `plot-layers.tsx` (ReadSync, ColumnBands, MorphLayer, ForecastRule, moneyAxis)
  · `margin-lane.tsx` · `period-card.tsx`.
- `pnl/plot-motion.ts` 281 → `plot-reveal.ts` (keyframes, nhịp, onSmoothFrame) +
  `plot-morph.ts` (captureMorph, morphBar, fadeInLayers).
- `performance/metric-plot.tsx` 509 → `metric-plot.tsx` · `plot-scope.ts` (context,
  ticks, motion) · `plot-marks.tsx` (EndMark, Annotations, AverageRule) · `readout.tsx`.
- `performance/chart.tsx`, `revenue-mix/chart.tsx`, `pnl/chart.tsx` xuống ≤ 200 nhờ
  `actions.ts` + tách chú giải (`plot-legend.tsx`, `slice-legend.tsx`). Khối "Tổng doanh
  thu" của revenue-mix/chart.tsx giữ nguyên từng dòng (B2).
- Tên file/hàm/hằng giữ như block gốc khi còn nghĩa; chỉ dời chỗ.

## 7. Lint

- Màu: hết 5 mục `no-raw-palette` vì lớp chấm nay có cặp `dark:`.
- `no-banned-motion` ở metric-plot (`ease-out` + `duration-400` khớp `animationDuration`
  400/`"ease-out"` của Recharts) và `no-raw-controls` ở metric-tiles (ô chỉ số là nút bấm
  cả ô): là **nguyên bản @reui/chart-6**. AGENTS.md (ReUI): "never retime" chuyển động có
  sẵn, và không đặt padding/height lên component đã cài → không đổi sang `Button` hay đổi
  nhịp; dùng `eslint-disable-next-line <luật> -- nguyên bản @reui/chart-6: <lý do>` (spec
  §3 / A4: ngoại lệ có lý do). Đúng 3 dòng, liệt trong contract.
- `npx eslint . --prune-suppressions` gỡ 8 mục; `check-baseline-growth` xanh.

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
### 1. Luồng

- Suôn sẻ: mở Insight (thị trường/phường) hoặc `/yield` → đọc biểu đồ, rê để xem
  tooltip, đổi chỉ số/kỳ/gộp, mở "Thao tác khác" → tải CSV / sao chép (điểm ra: toast).
  Không đổi so với hiện tại.
- Biên: cơ cấu doanh thu khi tổng = 0 (Empty "Chưa có doanh thu"); không đổi.
- Lỗi & quay lại: sao chép bị trình duyệt chặn → toast lỗi "Không sao chép được"; không đổi.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Insight thị trường/phường | đọc hiệu suất và cơ cấu doanh thu của khu vực | Finder / bản đồ → Insight |
| `/yield` | ước tính lợi suất một căn | Insight / nav → `/yield` |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-insight-perf-ready | Insight | 4 ô chỉ số + đường xu hướng theo màu chuỗi của chỉ số đang chọn | bấm ô khác, đổi 6/12 tháng |
| ST-insight-mix-ready | Insight | vòng donut thang màu doanh thu + chú giải có số | rê lát để xem tooltip |
| ST-insight-mix-empty | Insight | Empty "Chưa có doanh thu" | đọc phần khác của trang |
| ST-yield-pnl-ready | `/yield` | cột doanh thu/chi phí + làn biên lợi nhuận + mốc thuê dài hạn | đổi Tháng/Quý, bật/tắt mốc |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Sáng/tối: màu chuỗi đổi bậc theo `theme` của `ChartContainer`, sắc giữ nguyên.
- 390px: bố cục co như hiện tại (ô chỉ số 2×2, chú giải xuống dòng); không đổi.

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| ChartContainer / Tooltip / DropdownMenu / ToggleGroup / Button (ui) | dùng | đã cài, không sửa |
| `components/charts/*` | ghép | gom phần chép trùng của 3 block chuyển thể, không thêm hình mới |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: không đổi IA — giữ khuôn của trang Insight/`/yield` theo `onehub-ui/routes.md`; đợt
chỉ đổi màu và cấu trúc file.
<!-- UX-SPEC-TEMPLATE>>> -->

## 8. Để builder quyết

Tên hàm/prop trong `components/charts/`; ranh giới tách cụ thể từng file miễn ≤ 200 dòng
và không đổi DOM/hành vi (đo bằng `scripts/ui-standards/b3-capture.mjs` trước/sau).
