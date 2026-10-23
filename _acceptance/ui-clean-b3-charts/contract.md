---
schema_version: 1
feature: Chuẩn UI ReUI — đợt B3 thống nhất biểu đồ (bảng màu chuỗi chung, gom code chép trùng, tách file > 200 dòng)
slug: ui-clean-b3-charts
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, docs]
status: implemented
design_doc: docs/superpowers/specs/2026-10-23-ui-clean-b3-charts-design.md
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: ui-clean-b3-charts

## Context

Ba biểu đồ của app (Hiệu suất theo tháng — @reui/chart-6, Cơ cấu doanh thu — @reui/chart-13,
Doanh thu và chi phí 12 tháng tới — @reui/chart-36) mỗi cái mang bảng màu, hook và chữ chép
riêng từ block gốc; "Doanh thu" mang ba màu; ba màu chuỗi ở nền sáng dưới 3:1; file biểu đồ
dài tới 779 dòng. Đợt B3 của bộ chuẩn UI ReUI chốt một bảng màu chuỗi chung, gom phần chép
trùng về `components/charts/`, tách file lớn — không đổi dữ liệu, props, bố cục hay hành vi.

Source input: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md` §5 mục 3 ·
`docs/superpowers/plans/2026-10-22-ui-standards-reui.md` Phần B · design doc ở frontmatter.

Phạm vi file: `app/src/components/insight/performance/**`, `app/src/components/insight/revenue-mix/**`,
`app/src/components/yield/pnl/**`, `app/src/components/charts/**` (mới), cùng
`.claude/skills/onehub-ui/{data-color,catalog}.md` và `docs/research/ui-baseline-2026-10.md`.

## Criteria

- AC-1: Given phạm vi file của đợt, When quét mã nguồn ba thư mục biểu đồ, Then không còn
  literal màu nào ngoài `components/charts/palette.ts` theo ma trận viết trước — (1)
  `var(--color-<sắc>-<bậc>)`, (2) lớp `<thuộc tính>-<sắc>-<bậc>`, (3) hex `#rgb/#rrggbb`, (4)
  `rgb(`/`rgba(`, (5) `hsl(`, (6) `oklch(`/`oklab(`, (7) tên màu CSS trong `fill=`/`stroke=`/
  `stopColor=` — không file nào dùng `--chart-1..5`/`--color-chart-*`; và quan hệ nghĩa → khoá
  đúng: Doanh thu ở Hiệu suất và ở P&L cùng khoá `revenue`, ba lát Cơ cấu doanh thu lấy
  `share1..3`, Công suất/ADR/RevPAR/Chi phí/Biên lấy đúng khoá cùng tên.
- AC-2: Given `components/charts/palette.ts`, When tính tương phản từng chuỗi trên `--card`
  ở sáng và tối (oklch của theme Tailwind và `globals.css`), Then mọi chuỗi đạt ≥ 3:1 ở cả hai
  chế độ, trừ đúng danh sách miễn đóng mà người chốt ở Hỏi-3 (đề xuất: `expenses`, `share3`, `rest`, `hatch`); mỗi chuỗi có
  cặp sáng/tối bằng biến palette cố định và một lớp chấm tĩnh có cặp `dark:` khớp hai biến đó.
- AC-3: Given `.claude/skills/onehub-ui/data-color.md`, When đọc mục Biểu đồ, Then không còn
  "TBD", có bảng liệt mọi khoá của `palette.ts` với đúng bậc sáng/tối như module, và có luật
  chọn màu (nghĩa → sắc, biến cố định thay `--chart-*`, bậc theo 3:1, danh sách miễn).
- AC-4: Given ba thư mục biểu đồ và `components/charts/`, When dò trùng lặp (cửa sổ 6 dòng mã
  đã chuẩn hoá, bỏ dòng import/đóng mở ngoặc), Then không có đoạn nào xuất hiện ở hai file
  khác nhau; `use-trigger-tooltip`, `icons`, các mặt giá trị chung, hàm tải CSV/sao chép và nút
  "Thao tác khác" chỉ có một bản, ở `components/charts/`.
- AC-5: Given phạm vi file của đợt, When đếm dòng mọi `.ts`/`.tsx`, Then không file nào quá
  200 dòng.
- AC-6: Given `app/eslint-suppressions.json` và lint của app, When chạy
  `npx tsc --noEmit && npm run lint` trong `app/`, Then xanh; suppressions không còn mục nào
  thuộc file trong phạm vi; trong phạm vi chỉ có đúng 3 `eslint-disable` mang lý do
  "nguyên bản @reui/chart-6" (2 `no-banned-motion` ở nhịp 400ms/ease-out của Recharts, 1
  `no-raw-controls` ở ô chỉ số) cộng dòng `react-hooks/preserve-manual-memoization` đã có.
- AC-7: Given hai nơi dùng biểu đồ (`components/insight/insight-page.tsx`,
  `app/(app)/yield/page.tsx`), When so với nhánh chính, Then hai file đó không đổi và
  `PerformanceChart`, `RevenueMixChart`, `PnlChart`, kiểu `MonthRow` vẫn được export từ đúng
  đường dẫn cũ với cùng tên props.
- AC-8: Given ảnh chụp cấu trúc "trước" (cây gốc của nhánh) và "sau" (cây HEAD), chụp liền
  nhau (cách ≤ 2 giờ, cùng dữ liệu local, cùng mã băm `b3-capture.mjs`), When so phần không màu
  — cây thẻ/vai trò/aria/chữ của ba khung, số phần tử SVG, và kết quả thao tác: rê tooltip,
  chọn Công suất, 6 tháng, Quý, bật/tắt mốc thuê dài hạn, mở "Thao tác khác", tải CSV (tên tệp
  + sha256 nội dung) và sao chép (chữ toast khi clipboard được phép và khi bị chặn) ở cả ba
  khung — Then hai bản giống hệt, bản "sau" ghi mã cây `app/src` trùng HEAD; và ảnh khung P&L
  (không đổi màu) giống hệt từng byte ở 4 chế độ sáng/tối × 1280/390.
- AC-9: Given app chạy với dữ liệu local, When chụp ba khung ở sáng 1280, tối 1280, sáng 390,
  tối 390 trên Insight thị trường, Insight phường và `/yield`, Then ảnh có đủ trong evidence,
  màu chuỗi phân biệt được với nền và với nhau ở cả hai chế độ, và ngoài màu chuỗi không có
  khác biệt nhìn thấy với ảnh "trước". (judgment)
- AC-10: Given tài liệu đo, When đọc `docs/research/ui-baseline-2026-10.md` và
  `onehub-ui/catalog.md`, Then baseline có mục "sau B3" với số lấy từ `npm run lint:ui-report`
  (tổng và theo luật, cộng số file > 200 dòng của phạm vi trước/sau), và catalog ghi
  `components/charts/` là phần dùng chung của ba block biểu đồ.

## Coverage

Quét bằng morphological-scan (preset test-matrix), chân sản phẩm `[SUY-TỪ-REPO: docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md]`,
chân ngành `[NGÀNH: WCAG 2.2 SC 1.4.11 Non-text Contrast]` + `[NGÀNH: ReUI rules/color.md — Charts]`.

- Trục A — biểu đồ: performance | revenue-mix | pnl [thước CE: spec §5 B3 liệt đúng ba thư mục; `grep` consumer chỉ ra insight-page.tsx + yield/page.tsx]
- Trục B — loại việc: màu nguồn chung | tương phản sáng/tối | gom trùng | tách file | lint/suppress | tài liệu [thước CE: brief đợt (1)(2)(3) + điều kiện "Xong khi"]
- Trục C — bề mặt kiểm: mã nguồn | cấu trúc DOM + thao tác | ảnh sáng/tối/390 [thước CE: onehub-ui bước nhìn + spec §5 "mỗi trang chụp sáng/tối/390"]
- Core → AC-1…AC-10 (mỗi ô B×C có nghĩa, áp chung cho cả trục A). Later: gộp `useStillSeries`/`useFrozenDemo` (khác hành vi, entry descope). Never: đổi `--chart-*` của theme (phi mục tiêu brand).
- `[GIẢ ĐỊNH]` phương án màu A (theo nghĩa) — chờ người chọn ở Cổng Phạm vi (Hỏi-1).
- `[GIẢ ĐỊNH]` danh sách miễn 3:1 (`expenses` 1,48 sáng · `share3` 2,01 sáng · `rest`, `hatch`) — chờ người chốt (Hỏi-3).
- Thiếu: trạng thái ST-insight-mix-empty không có thước máy (dữ liệu local không có khu vực tổng = 0; khối Empty nằm trong vùng B2 không đụng) — xem gap-probe.

## Out of scope

- Ô KPI: khối "Tổng doanh thu" trong revenue-mix/chart.tsx và các ô `Stat` của pnl/chart.tsx — đợt B2 (một kiểu `StatTiles`).
- `app/src/app/ops/**`, `components/ops/**` — đợt B1 đang làm song song.
- Đổi theme/brand, kể cả `--chart-1..5` trong `globals.css`.
- Gộp `useStillSeries` (metric-plot) với `useFrozenDemo` (mix-donut) — khác hành vi khi `data-demo` đổi.
- Block gốc trong `components/blocks/**` (vendor, vẫn giữ bản chép trùng của chính nó).
- Trạng thái tải/lỗi mới cho biểu đồ — đợt B4.

## Notes

- Danh sách miễn 3:1 (AC-2) cố ý đóng: chuỗi trung tính/bậc nhạt mà danh tính đi bằng vị trí + chú giải có số.
- Ảnh "trước" và bản thử phương án A: `evidence/before/`, `evidence/proto-a/` (bản thử là vứt đi, code đã hoàn lại).
