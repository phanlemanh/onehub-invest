# UI3 — `/yield`: chi phí vận hành + «Dòng tiền vốn vay» (data-grid-advanced-7), `/dau-tu` → 301

> Hồ sơ nghiệm thu: `_acceptance/yield-dong-tien-von-vay/` (T2). Hàng lộ trình `UI3` (`docs/plan/lo-trinh.json`, phủ
> `GD5`). Cổng Đáng: Mạnh quyết `build` (23/10). Đợt I4 của `routes.md`. Dãy U1, nối sau UI2 (PR #78) — mẫu redirect 301.

## Câu giao

Nhà đầu tư dùng /yield thấy bảng chi phí vận hành và phần «Dòng tiền vốn vay» dựng bằng data-grid-advanced-7, còn link
/vn/<market>/dau-tu cũ chuyển 301 về /yield?area=…#financing. Ghi chú của hàng: gỡ bộ mô phỏng và redirect 301 phải đi
cùng phần thay thế — tách ra thì có lúc mất chức năng dòng tiền.

## Hiện trạng (nhánh UI2 `d5d3e72`)

- `/[country]/[market]/dau-tu` = bộ mô phỏng G3 viết tay (`invest/investment-simulator.tsx`, 222 dòng): ô nhập tự vẽ,
  chữ 10–11px, màu trạng thái tự tô; mặc định từ `lib/invest.ts`. Sống nhờ ngoại lệ `dau-tu` của `route-slugs.test.mjs`.
- `/yield` (form-11 + StatTiles + chart-36 + CompsTable) không có phần vốn vay. Dải gradient form-11 dùng `oklch(...)`
  cứng; nút gợi ý giá là `<button>` trần.
- Baseline lint của nhóm: 16 (`investment-simulator.tsx` 12, `yield-form.tsx` 4).
- `CONTEXT.md` đã chốt: Mô phỏng đầu tư «gộp vào Ước tính lợi suất thành mục … (`#financing`)»; routes.md chốt đích
  `/yield?area=<market>#financing` (301, gộp) và block `data-grid-advanced-7` (chi phí vận hành + dòng tiền vốn vay).
- `market_asset_stats` (giá bán/thuê `/yield` dùng) nay tính từ `sale_offers` — cùng nguồn thật với `lib/invest.ts`.

## Thiết kế

1. **Redirect.** `next.config.ts`: `{ source: "/:country/:market/dau-tu", destination: "/yield?area=:country-:market#financing",
   statusCode: 301 }`. Xoá trang `/dau-tu`, `investment-simulator.tsx`, `lib/invest.ts`; xoá ngoại lệ `dau-tu`. Nút «Đầu tư»
   trên Insight trỏ `/yield?area=<mã khu vực>#financing`.
2. **`/yield` nhận `area=<mã thị trường>`.** Mã khớp một thị trường → chọn thị trường ấy, phường để mặc định (link cũ
   chỉ biết thị trường). Mã phường giữ hành vi cũ.
3. **Vốn vay trên form-11.** Thêm nhóm «Vốn vay» (vốn tự có % giá mua, lãi suất %/năm, kỳ hạn năm — mặc định 30% · 9% ·
   20 năm như bộ mô phỏng cũ), đi cùng URL (`eq`, `rate`, `term`) để báo cáo vẫn tính ở server và chia sẻ được. Server
   kẹp: vốn tự có 10–100%, lãi 0–30%, kỳ hạn 5–35 năm. Nút «Về mặc định» đặt lại cả chi phí lẫn vốn vay.
4. **Mô hình `lib/financing.ts` (hàm thuần).** Doanh thu, chi phí vận hành, thu nhập ròng lấy NGUYÊN từ ước tính lợi suất
   (cùng số với ô KPI phía trên). Khoản vay = giá mua × (1 − vốn tự có); trả góp đều (annuity) hằng tháng; tách lãi/gốc
   theo năm bằng lịch trả từng tháng. Tiền mặt bỏ ra = phần vốn tự có của giá + nội thất ban đầu (trả tiền mặt). Lợi nhuận
   năm = dòng tiền sau nợ + gốc đã trả; dòng tổng ghim = lợi nhuận ÷ tiền mặt bỏ ra. Có giá thuê dài hạn → thêm mục «So với
   cho thuê dài hạn» (thu nhập ròng sau thuế 10% − trả nợ). Chưa tính tăng giá, lạm phát, phí giao dịch.
5. **Lưới `yield/financing/` chuyển thể `@reui/data-grid-advanced-7`.** Mục có dòng cộng (Doanh thu ngắn hạn · Chi phí vận
   hành 4 dòng · Thu nhập ròng · Trả nợ vay lãi/gốc · Dòng tiền sau nợ · So với thuê dài hạn), cột Hằng tháng + Năm 1…5,
   dòng tổng ghim, dải màu mục như bản gốc. Khác bản gốc: CHỈ ĐỌC (sửa tham số ở form, một nguồn sự thật là URL), không
   thêm/sửa/xoá dòng, không chọn ô; điện thoại chỉ ghim nút mở + tên khoản mục. Bấm hàng mục để mở/gập; mặc định mở Chi phí
   vận hành và Trả nợ vay. Bản gốc của block không qua `tsc` với data-grid đang cài nên không giữ trong `components/blocks/`.
6. **Sự kiện `dau_tu_input`** (hồ sơ tài chính người dùng, tầng A local — agent memory đọc loại này) phát khi bấm «Ước
   tính», payload mới: khu vực, giá mua, vốn tự có, lãi, kỳ hạn.
7. **Lint.** Gradient form-11 đổi `oklch(...)` → biến palette Tailwind (`var(--color-blue-950)`…), `<button>` → `Button
   variant="link" size="xs"`. Gỡ simulator → baseline giảm đúng 16.
8. **Cổng.** `scripts/check-portal-compliance.mjs` mục 7 chuyển từ `/dau-tu` sang `/yield` + mục vốn vay (không chữ
   AirDNA/tên nguồn thật; mô hình vốn vay không truy vấn DB); smoke cổng kiểm 301.
9. **Tài liệu.** routes.md (bỏ dòng `/dau-tu`, dòng `/yield` ghi I4 xong), catalog (`data-grid-advanced-7`), CONTEXT.md
   (thuật ngữ Mô phỏng đầu tư → mục «Dòng tiền vốn vay», code `financing`), portals.md, app/CLAUDE.md, ROADMAP I4.

## Câu hỏi cho người (Cổng Phạm vi)

- **Hỏi-1** — cách tính vốn vay: nội thất trả tiền mặt (không vay), bỏ phí giao dịch 0,5% của bộ mô phỏng cũ, lưới 5 năm
  (máy khuyên giữ — đơn giản, nói rõ ở chú thích lưới).
- **Hỏi-2** — trạng thái tải của `/yield`: để hàng sau (máy khuyên) hay làm trong hàng này.
- **Hỏi-3** — đường đo: bỏ cho hàng dọn giao diện (máy khuyên) hay khai thước sau ship.

## Phương án đã loại

- **Giữ lưới sửa ô như bản gốc** (sửa số ngay trên lưới, thêm dòng chi phí): loại — `/yield` tính ở server từ URL để chia
  sẻ được; sửa trong lưới tạo nguồn sự thật thứ hai lệch với form.
- **Giữ mô hình ADR × công suất của bộ mô phỏng** (người tự nhập giá đêm/công suất): loại — hai mô hình doanh thu trên một
  trang cho hai số khác nhau; CONTEXT.md chốt gộp vào Ước tính lợi suất.
- **Redirect `?market=`** (tham số `/yield` vốn có): loại — routes.md và CONTEXT.md đã chốt `?area=<market>`.

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Insight thị trường/phường → «Đầu tư» → `/yield?area=<mã>#financing` → chỉnh căn, chi phí, vốn vay ở form →
  «Ước tính» → đọc lưới «Dòng tiền vốn vay» (mở/gập mục) và ô KPI (điểm ra: so sánh listing, Insight).
- Biên: link cũ `/vn/<market>/dau-tu` → 301 vào thẳng mục vốn vay; vốn tự có 100% → khoản vay 0, trả nợ 0; phường không có
  giá thuê dài hạn → không có mục «So với cho thuê dài hạn»; chưa đủ listing → Empty có sẵn, không có lưới.
- Lỗi & quay lại: lỗi khi đọc số → `(app)/error.tsx` (cả trang, như hiện nay).

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Ước tính lợi suất `/yield` | cho biết một căn cụ thể cho thuê ngắn hạn có lời không, kể cả khi vay | nav «Lợi suất», Insight «Đầu tư», link cũ `/dau-tu` / CompsTable, Insight |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-yield-default | /yield | form (căn · chi phí · vốn vay), tóm tắt, ô KPI, độ tin cậy, lưới vốn vay, biểu đồ 12 tháng, listing so sánh | chỉnh, «Ước tính» |
| ST-yield-financing-redirect | /yield#financing | link cũ `/dau-tu` → cuộn tới lưới vốn vay, thị trường của link | đọc lưới |
| ST-yield-no-loan | /yield | vốn tự có 100%: khoản vay 0, trả nợ 0, dòng tiền = thu nhập ròng | đổi vốn tự có |
| ST-yield-no-lt | /yield | phường không giá thuê dài hạn: lưới không có mục «So với cho thuê dài hạn» | — |
| ST-yield-empty | /yield | Empty «Chưa đủ listing để ước tính» (có sẵn), không lưới | đổi số phòng ngủ |
| ST-yield-phone | /yield (375 px) | lưới cuộn ngang trong khung, nút mở + tên khoản mục ghim | cuộn ngang |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Bấm hàng mục (hoặc nút mũi tên) mở/gập; mặc định mở Chi phí vận hành, Trả nợ vay.
- Số âm đỏ (dòng tiền, so sánh dài hạn); tiền gọn «123,5 tr ₫».
- Form: vốn tự có bước 5%, lãi bước 0,5%, kỳ hạn bước 5 năm; server kẹp về khoảng cho phép.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `@reui/data-grid-advanced-7` → `yield/financing/*` | mở rộng (chuyển thể chỉ đọc) | block đích của routes.md; bỏ sửa ô vì báo cáo tính từ URL |
| form-11 (`yield-form.tsx`) | mở rộng | thêm nhóm «Vốn vay» cùng khuôn FormRow/Num |
| `@reui/data-grid` (DataGrid, DataGridTable, foot row) | dùng | lưới chuẩn của kho |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: bảng-điều-khiển (dashboard-first)
Căn cứ: routes.md ghi `/yield` là «Dashboard grid» và block đích đã chốt ở bản đồ đích 23/10 — không có khuôn thứ hai.
<!-- UX-SPEC-TEMPLATE>>> -->
