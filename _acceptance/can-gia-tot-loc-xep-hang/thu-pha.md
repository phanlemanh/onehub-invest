# Bảng thử phá CG3

Sinh bằng `node _acceptance/can-gia-tot-loc-xep-hang/probes/thu-pha.mjs --write` trên commit `3d94fe124ddf77ad30d8c95d5840b0a334de2168`. Mỗi dòng sửa một chỗ mã sản phẩm trên worktree tạm rồi chạy lệnh chấm của tiêu chí. «Đạt» là lệnh thoát khác 0 và thông điệp đỏ khớp cột ca đỏ; dòng đối chứng là cùng lệnh khi chưa đột biến.

| Tiêu chí | Đột biến | Tệp | Ca đỏ (thông điệp) | Lệnh | Mã thoát | Kết quả |
|---|---|---|---|---|---|---|
| AC-1 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 0 | đạt |
| AC-1 | bỏ ưu tiên cấp dự án | `lib/deals.ts` | CG3-AC-1 sai thứ tự | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-1 | đảo chiều hạng phần trăm | `lib/deals.ts` | CG3-AC-1 sai thứ tự | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-1 | đảo mức dưới trung vị khi cùng hạng | `lib/deals.ts` | CG3-AC-1 sai thứ tự | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-1 | đảo mã tin khi cùng hạng, cùng mức | `lib/deals.ts` | CG3-AC-1 sai thứ tự | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-1 | bỏ hạn 45 ngày | `lib/deals.ts` | CG3-AC-1 màn phải loại đúng ba căn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-1 | trang truyền ngưỡng 0 | `app/ops/deals/page.tsx` | CG3-AC-1 màn phải loại đúng ba căn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-1` | 1 | đạt |
| AC-2 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 0 | đạt |
| AC-2 | dòng không có lý do vẫn in chữ lý do | `components/ops/deals-cells.tsx` | CG3-AC-2 dòng không có lý do lùi cấp | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | bỏ số căn trong nhóm | `components/ops/deals-cells.tsx` | CG3-AC-2 dòng không có lý do lùi cấp | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | mất tên dự án của nhóm | `lib/deals.ts` | CG3-AC-2 ô Hạng giá | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | mất lý do lùi cấp từ DB | `lib/deals.ts` | CG3-AC-2 ô Hạng giá | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | độ tin luôn cao | `lib/deals.ts` | CG3-AC-2 ô Hạng giá | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | đảo hai nhãn hạng | `lib/deals.ts` | CG3-AC-2 ô Hạng giá | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | trung vị giá tháng gấp mười lần | `components/ops/deals-cells.tsx` | CG3-AC-2 trung vị giá tháng | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-2 | mức giảm lấy nhầm hạng phần trăm | `lib/deals.ts` | CG3-AC-2 mức giảm | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-2` | 1 | đạt |
| AC-3 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 0 | đạt |
| AC-3 | mọi căn thường vào Đủ để gọi | `lib/deals.ts` | CG3-AC-3 tab du lệch số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | mọi căn thường vào Còn thiếu | `lib/deals.ts` | CG3-AC-3 tab du lệch số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | đếm trong trang thay vì toàn tập | `lib/deals.ts` | CG3-AC-3 tab (du\|xac-minh\|thieu) lệch số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | xếp tab theo vai không xem nội dung | `lib/deals.ts` | CG3-AC-3 tab (du\|thieu) lệch số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | ô Tình trạng ghi sai tab | `components/ops/deals-grid.tsx` | CG3-AC-3 vai Người xem tab thieu: ô Tình trạng ghi sai | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | tab đếm trong trang trên trình duyệt | `components/ops/deals-grid.tsx` | CG3-AC-3 tab .+ ghi sai số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | mọi tab in số Tất cả | `components/ops/deals-grid.tsx` | CG3-AC-3 tab .+ ghi sai số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | đầu khoảng luôn là 1 | `components/ops/deals-grid.tsx` | CG3-AC-3 trang giữa phải ghi | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | cuối khoảng không chặn theo tổng | `components/ops/deals-grid.tsx` | CG3-AC-3 trang cuối phải chặn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | bỏ đường khi xét đủ | `lib/deals.ts` | CG3-AC-3 (căn có đường\|bảy căn mất một mục) | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | bỏ ảnh trên máy thu khi xét đủ | `lib/deals.ts` | CG3-AC-3 (căn có ảnh trên máy thu\|bảy căn mất một mục) | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-3 | cloud xếp tab như máy thu | `lib/deals.ts` | CG3-AC-3 tab (du\|thieu) lệch số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-3` | 1 | đạt |
| AC-4 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 0 | đạt |
| AC-4 | lọc tab sau khi đã cắt trang | `lib/deals.ts` | CG3-AC-4 tab (du\|xac-minh\|thieu):  | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | bản cloud vẫn đọc bảng ảnh | `lib/deals.ts` | media | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | đổi cỡ trang giữ nguyên trang | `components/ops/deals-grid.tsx` | CG3-AC-4 đổi cỡ trang phải về trang 1 | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | bảng không biết tổng số căn | `components/ops/deals-grid.tsx` | CG3-AC-4 (trang giữa phải sang\|phải có nút tới trang cuối) | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | đổi tab giữ nguyên trang | `components/ops/deals-grid.tsx` | CG3-AC-4 đổi tab phải về trang 1 | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | nhận trang số lẻ | `lib/deals-chi-tiet.ts` | CG3-AC-4 tham số | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | bỏ chuyển trang của căn ngoài trang | `app/ops/deals/page.tsx` | Missing expected rejection | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-4 | bản cloud đọc số căn, số nhà | `lib/deals.ts` | unit_number | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-4` | 1 | đạt |
| AC-5 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 0 | đạt |
| AC-5 | căn gắn thẳng tỉnh thuộc mọi phường | `lib/deals.ts` | CG3-AC-5 .+: sai tập căn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | bỏ lọc dự án | `lib/deals.ts` | CG3-AC-5 .+: sai tập căn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | chọn vị trí không về trang 1 | `components/ops/deals-grid.tsx` | CG3-AC-5 chọn (tỉnh\|dự án\|phường) phải | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | bỏ nhánh Phường | `lib/deals.ts` | CG3-AC-5 tỉnh phải có hai nhánh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | bỏ nhánh Dự án | `lib/deals.ts` | CG3-AC-5 tỉnh phải có hai nhánh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | mục cây hiện mã thô | `lib/deals.ts` | CG3-AC-5 nhánh Dự án sai mục | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | chọn mục mới vẫn giữ vị trí cũ | `components/ops/deals-grid.tsx` | CG3-AC-5 chọn (tỉnh\|dự án\|phường) phải | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-5 | ô vị trí không hiện mục đang chọn | `components/ops/deals-grid.tsx` | CG3-AC-5 ô chọn phải hiện mục đang chọn | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-5` | 1 | đạt |
| AC-6 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 0 | đạt |
| AC-6 | bỏ điều kiện bán hay thuê | `lib/deals.ts` | CG3-AC-6 mặc định phải là tin bán | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 1 | đạt |
| AC-6 | lọc loại hình mất tác dụng với tin thuê | `lib/deals.ts` | CG3-AC-6 ô rent × (apartment\|house) × .+ sai tập | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 1 | đạt |
| AC-6 | tab luôn sáng Bán | `components/ops/deals-grid.tsx` | CG3-AC-6 đang xem thuê thì Cho thuê phải sáng | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 1 | đạt |
| AC-6 | chỉ còn hai loại hình | `components/ops/deals-grid.tsx` | CG3-AC-6 ô loại hình phải có đủ mọi loại | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 1 | đạt |
| AC-6 | chọn loại hình không có tác dụng | `components/ops/deals-grid.tsx` | CG3-AC-6 chọn loại hình phải mang type | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-6` | 1 | đạt |
| AC-7 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 0 | đạt |
| AC-7 | mất khung tải | `app/ops/deals/page.tsx` | CG3-AC-7 trang phải hiện khung tải | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | đổi lọc khi lỗi không làm gì | `components/ops/deals-grid.tsx` | CG3-AC-7 đổi Cho thuê khi lỗi phải tải lại trang | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | mất thanh lọc khi lỗi | `app/ops/deals/page.tsx` | CG3-AC-7 ca lỗi mất thanh lọc\|Cannot read properties of undefined | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | nút Xem tất cả không làm gì | `components/ops/deals-grid.tsx` | CG3-AC-7 Xem tất cả phải về tab Tất cả | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | nút Xoá bộ lọc không làm gì | `components/ops/deals-grid.tsx` | CG3-AC-7 Xoá bộ lọc phải bỏ vị trí | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | tập rỗng dẫn sai trang | `components/ops/deals-grid.tsx` | CG3-AC-7 tập rỗng phải dẫn sang chất lượng dữ liệu | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | lọc dự án rỗng báo tập rỗng | `components/ops/deals-grid.tsx` | CG3-AC-7 lọc .+ ra rỗng phải báo lọc rỗng | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | chỉ lọc loại hình mất nút bỏ lọc | `components/ops/deals-grid.tsx` | CG3-AC-7 chỉ lọc loại hình | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-7 | lỗi hạ tầng rơi về bản cloud | `lib/deals.ts` | CG3-AC-7 lỗi hạ tầng phải tới khung lỗi | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-7` | 1 | đạt |
| AC-8 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 0 | đạt |
| AC-8 | trang gửi đủ liên hệ cho vai Người xem | `app/ops/deals/page.tsx` | CG3-AC-8 vai Người xem lộ | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 1 | đạt |
| AC-8 | bỏ bước che liên hệ trong thư viện | `lib/deals.ts` | CG3-AC-8 vai Người xem lộ | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 1 | đạt |
| AC-8 | trang một căn gửi đủ liên hệ | `app/ops/deals/[offerId]/page.tsx` | CG3-AC-8 mở căn ngoài trang lộ | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 1 | đạt |
| AC-8 | đảo điều kiện lời báo cloud | `app/ops/deals/page.tsx` | CG3-AC-8 (máy thu không được báo\|lược đồ cloud phải báo) | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 1 | đạt |
| AC-8 | vai Người xem nhận tên nhóm | `lib/deals.ts` | CG3-AC-8 vai Người xem lộ | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-8` | 1 | đạt |
| AC-9 | (không đột biến, đối chứng) | — | xanh | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 0 | đạt |
| AC-9 | đầu trang còn chữ thước phường | `app/ops/deals/page.tsx` | CG3-AC-9 đầu trang còn chữ «thước phường» | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 1 | đạt |
| AC-9 | bảng còn chữ thước phường | `components/ops/deals-cells.tsx` | CG3-AC-9 bảng còn chữ «thước phường» | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 1 | đạt |
| AC-9 | phần trăm dùng dấu chấm | `components/ops/deals-cells.tsx` | CG3-AC-9 phần trăm phải dùng dấu phẩy | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 1 | đạt |
| AC-9 | cột nguồn in thêm tên nguồn | `components/ops/deals-grid.tsx` | CG3-AC-9 cột nguồn chỉ được hiện mã S0x | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 1 | đạt |
| AC-9 | mức giảm màn hẹp dùng dấu chấm | `components/ops/deals-grid.tsx` | CG3-AC-9 phần trăm phải dùng dấu phẩy\|33,7 | `bash _acceptance/can-gia-tot-loc-xep-hang/probes/doc.sh AC-9` | 1 | đạt |

Tổng: 66 đột biến, 0 chưa bắt được.
