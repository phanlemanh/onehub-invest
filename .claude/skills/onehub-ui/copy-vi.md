# Chữ tiếng Việt

UI viết tiếng Việt. **Nhãn lấy từ `CONTEXT.md`** ở gốc repo (dòng in đậm của mỗi thuật ngữ; tên ở
`_Avoid_` là tên đã loại). Chưa có thuật ngữ thì thêm vào `CONTEXT.md` trước khi viết nhãn. URL tiếng
Anh, kebab-case, theo `Slug URL` của `CONTEXT.md` (luật ở `AGENTS.md` › Quy ước). Tên nguồn chỉ được
ghi bằng mã `S0x` (SPL, ADR-0007), không viết tên nguồn thật lên UI.

## Số đều đi qua `lib/format.ts`

Không gọi `toFixed`, `toLocaleString` hay tự ghép "tr"/"tỷ" trong component.

| Hàm | Ra | Dùng cho |
|---|---|---|
| `fmtMoney(v, currency)` | `109.162 ₫` | tiền đầy đủ. `null` ra "—" |
| `fmtMoneyCompact(v, currency)` | `1,5 tỷ ₫`, `500 tr ₫` | tiền trong ô KPI, nhãn, tooltip |
| `fmtCompact(v)` | `1,5 tỷ`, `500 tr` | nhãn trục (không kèm ký hiệu tiền) |
| `fmtPct(v, digits = 1)` | `62,5%` | tỷ lệ; truyền vào phân số 0..1 |
| `fmtInt(v)` | `1.234` | đếm (listing, phường, đêm) |
| `fmtMonth(iso)` | `T10/2026` | nhãn tháng |

- Locale `vi-VN`: chấm ngăn nghìn, phẩy thập phân. Đơn vị là "tỷ" và "tr" (triệu); không dùng
  "T" của compact vi-VN vì dễ đọc nhầm.
- Ô chứa số luôn có `tabular-nums`. Ô chưa có số thì hiện "—". `fmtMoney`, `fmtPct` và `fmtInt` tự trả "—" khi gặp `null`. Hai
  hàm compact chỉ nhận số, nên phải kiểm `null` trước khi gọi.
- Chỉ số tính sẵn ở server (pipeline/sql). Component chỉ định dạng, không tính lại.

## Độ dài chữ

Theo ngân sách của ReUI, `reui/rules/layout.md` mục **Spacing and copy**: tiêu đề 1–3 chữ, mô tả
1 mệnh đề (~8 chữ), dòng ngữ cảnh tối đa 2 đoạn, nhãn và nút 1–2 chữ, tiêu đề toast tối đa 4
chữ. Tiếng Việt ra dài hơn tiếng Anh, nên phải cắt ý chứ đừng thu nhỏ cỡ chữ. Nếu chữ xuống dòng
ở bề rộng desktop thì đã quá ngân sách.

## Trạng thái trống và lỗi: chuyện gì đang xảy ra, cộng một hành động

- **Trống** (`Empty`): tiêu đề nói thiếu cái gì ("Chưa lưu khu vực nào"), một dòng giải thích,
  một nút ("Tìm thị trường"). Không bao giờ để vùng rỗng mà không có lời nào.
- **Lỗi** (`states/page-error.tsx`, hoặc báo inline trong vùng): nói việc nào hỏng, không nói
  lỗi kỹ thuật, kèm nút "Thử lại".
- **Đang thu thập** (IA §3.3), dùng cho khu vực chưa tự thu dữ liệu: `Empty` nói rõ dữ liệu
  đang được thu, không mượn số của AirDNA (R1), và chỉ sang chỗ đã có số. Biến thể này khác
  "bộ lọc ra 0 kết quả", nên đừng dùng chung chữ.
- Số mô phỏng hoặc ước tính luôn đi kèm Badge `warning-light` "MÔ PHỎNG", có thêm độ tin cậy
  nếu có.

## Bẫy `"use client"` (đã gặp 2 lần)

Trang server import GIÁ TRỊ (hàm, hằng số) từ file `"use client"` chỉ nhận được
**tham chiếu client**: gọi hàm → lỗi 500 (`tierOf`, P3); dùng hằng số →
`.slice(0, ref)` ra mảng rỗng, KHÔNG báo lỗi (`COMPARE_MAX`, P5). Hằng số, kiểu,
hàm thuần dùng chung giữa server và client → để ở module thường (`*.ts`, không
`"use client"`): `page/tiers.ts`, `finder/bins.ts`, `compare/compare-types.ts`.
