# Xem màn CG3 `can-gia-tot-loc-xep-hang`, 18/11

Bản chạy: nhánh `claude/xem-man-cg3-872470` (cắt từ `ccc7d25f1`), dev cổng 3461, DB máy thu chỉ đọc.
Ảnh: 4 màn × sáng, tối, 390 px × vai Quản trị, Người xem (24 ảnh), thêm 2 ảnh cây vị trí. Tên ảnh: `<màn>--<chế độ>--<vai>.jpg`.

**Kết luận: chưa nên qua Cổng Bằng chứng khi còn hai lỗi mức Cao.** Thứ tự xếp hạng, số đếm, phân quyền và trạng thái trống đều đạt.

## Phát hiện

| Mức | Phát hiện | Bằng chứng | Chỗ sửa |
|---|---|---|---|
| **Cao** | Tab «Cho thuê» ghi «0 tr/m²» ở cột Giá và «Thước 0 tr/m²» ở cột Giảm, trên mọi dòng thấy được. Giá thuê theo m² dưới 1 triệu nên bị làm tròn về 0. Dòng mặt bằng cùng ô đã ghi đúng «160 nghìn/m²». | `cho-thue--sang--quan-tri.jpg`, `cho-thue--toi--quan-tri.jpg` | `app/src/components/ops/deals-grid.tsx:76`, `app/src/components/ops/deals-cells.tsx:55`; dùng lại cách đổi đơn vị của `chuTrungVi` (`app/src/lib/deals-chi-tiet.ts:71`) |
| **Cao** | Ở 390 px không thấy giá và mức giảm nếu chưa cuộn ngang bảng. Bảng rộng 1.096 px (Người xem 946 px) trong vùng 348 px vì cột đã ẩn vẫn tính vào bề rộng; cột Giá kết thúc ở x = 451, vùng nhìn hết ở x = 369. Trang không cuộn ngang, nhưng lý do căn có mặt trong danh sách bị khuất (AC-10). | `mac-dinh--hep-390--quan-tri.jpg`, `tab-trong--hep-390--quan-tri.jpg` (thanh cuộn thừa) | `deals-grid.tsx`, phần cột và `cotTheoTrang` |
| Trung bình | Chân bảng ghi «1–15 / 7385», AC-3 yêu cầu dạng «1–15 / 7.385». | `mac-dinh--sang--quan-tri.jpg` | `deals-grid.tsx:340` đang dùng `DATA_GRID_VI` (`app/src/components/insight/insight-grid.tsx:40`) |
| Trung bình | Cột Hạng giá cắt mất số căn trong nhóm ở khổ 1.440 px, ví dụ «Vinhomes Ocean Park 1 · 307 c…»: 6 dòng chữ bị cắt ở trang đầu, không có `title`. AC-2 yêu cầu dòng ghi số căn và lý do lùi cấp. | `mac-dinh--sang--quan-tri.jpg` | `app/src/components/ops/deals-cells.tsx:25-26` |
| Trung bình | Cùng một nhóm mang hai đơn vị trên một dòng: «17 căn» ở cột Hạng giá, «Thước … · 17 tin» ở cột Giảm. | `mac-dinh--sang--quan-tri.jpg` | `deals-cells.tsx:55` |
| Thấp | Cây vị trí ghi số hai lần ở mỗi mục, một lần thiếu dấu chấm: «5939» và «5.939 căn». | `cay-vi-tri--sang--quan-tri.jpg` | `app/src/components/ops/deals-bo-loc.tsx:41-42` |
| Thấp | Tiêu đề «Hạng giá» và «Gọi ai» đậm hơn các tiêu đề cột còn lại vì không đi qua `DataGridColumnHeader`. | `mac-dinh--sang--quan-tri.jpg` | `deals-grid.tsx:108`, `deals-grid.tsx:145` |
| Thấp | Trạng thái trống của danh sách lùi còn chữ «thước phường», từ `CONTEXT.md` ghi cần tránh. | Đọc mã, màn này không dựng được trên dữ liệu thật | `app/src/app/ops/deals/page.tsx:40` |

## Đã đạt

| Mục | Kết quả |
|---|---|
| Căn «Giá tốt» cấp dự án ở đầu danh sách (MS2) | 15/15 dòng đầu ở màn mặc định, màn dự án và tab Cho thuê. Trang đầu màn mặc định có 2/15 căn S03 |
| Số tab so với `probes/dem-tap-can.mjs` | Lúc chụp: 7.385 = 7.385, dự án 1: 191 = 191. Dữ liệu đổi trong lúc xem, đo lại: tab 7.459 = lệnh đếm 7.459 = tổng năm tỉnh trên cây |
| Tổng ba tab | 136 + 2.390 + 4.859 = 7.385 (Quản trị); 4.995 + 2.390 + 0 = 7.385 (Người xem) |
| Tập căn cấp dự án theo lệnh đếm | 834 căn lúc chụp, 840 khi đo lại; 257 căn S03 (mốc ghi 832 và 254) |
| Vai Người xem | Không có cột «Gọi ai»; HTML trang đầu không có `tel:`, tên, số điện thoại, ảnh |
| Trạng thái trống | Tab trống có «Xem tất cả»; lọc rỗng có «Xoá bộ lọc»; bộ lọc vẫn đứng |
| Thao tác | Cho thuê, Xem tất cả, sang trang 2 («16–30»), tìm «Ocean Park 1» ra đúng 191 căn |
| Thời gian tới dòng đầu | 0,4–2,0 giây ở chế độ dev (ngưỡng 3 giây) |
| Bố cục | Sáng, tối đọc được; 390 px không cuộn ngang trang |
| Self-check ReUI | C1–C4 sạch, ESLint và `tsc --noEmit` sạch trên tệp CG3 |

## Cần người quyết ở Cổng

Vai Người xem thấy «Đủ để gọi 4.995», vai Quản trị thấy 136, vì Người xem không bị tính thiếu ảnh, chữ bài, số điện thoại. Việc này đúng AC-3, nhưng Người xem không có số để gọi nên nhãn dễ gây hiểu nhầm.

## Giới hạn

- Chưa xem: trạng thái đang tải, lỗi kèm «Thử lại», tập rỗng, vai Vận hành, lược đồ cloud.
- Số tab Cho thuê (9.223) chỉ đối chiếu với bảng phủ của hợp đồng (1.591 + 7.632), vì lệnh đếm chỉ đo tin bán.
- Self-check `onehub-ui` làm theo `loop.md` bước 7–8; danh sách kiểm ReUI đối chiếu bằng tay.
- Badge 10 px ở đầu trang thuộc `PageHeader`, hợp đồng đã để ngoài phạm vi.
- Ảnh đã che số điện thoại, tên người, ảnh tin, email ngay trên trang trước khi chụp; máy kiểm không còn mẫu số điện thoại, email, và đã soát bằng mắt.
