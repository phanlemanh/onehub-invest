# Phương án giao diện Căn giá tốt

Phác để quyết định ở Cổng Phạm vi, không phải bằng chứng. Tên hướng giữ nguyên, không đánh số lại.

Trục: một màn cho người vận hành quét nhiều căn thế nào.

| Hướng | Động cơ | Đánh đổi | Số đo trên bản chạy 1280×800 |
|---|---|---|---|
| **Bảng cộng sheet** (máy khuyên, Mạnh chốt 03/11) | Một trang xem nhiều, so theo cột, chuyển căn không rời danh sách | Ảnh chỉ 40 px, sheet che bảng khi mở | 9 căn trọn màn, cao 55 px một căn, mắt đi 55 px giữa hai mức giảm, căn kế 1 phím |
| Lưới thẻ cộng trang riêng | Ảnh lớn thấy ngay, bản đang chạy | Ít căn trên màn, không so thẳng cột, quay lại mỗi lần chuyển căn | 3 căn trọn màn, cao 332 px một căn, mắt đi 335 px, căn kế phải quay lại rồi bấm |
| Chia đôi màn | Vừa thấy bảng vừa thấy chi tiết | Vùng nội dung 1040 px, panel 576 px còn 464 px cho bảng, mất cột so sánh | Chỉ tính bề rộng, không dựng |

## Từng khối: ba nguồn

| Khối | Trong kho | ReUI Pro | Vẽ mới | Chọn |
|---|---|---|---|---|
| Khung bảng, phân trang | `records-grid` | [solution-crm-3](https://reui.io/preview/base/solution-crm-3?ref=mcp) | không cần | kho |
| Tab việc kế | lưới mục tiêu `/ops` | [data-grid-filtering-2](https://reui.io/preview/base/data-grid-filtering-2?ref=mcp) | không cần | kho |
| Chip lọc | `records-filter` | [data-grid-filtering-1](https://reui.io/preview/base/data-grid-filtering-1?ref=mcp) | không cần | kho |
| Ô ảnh, tên căn | chưa có | ý từ [solution-inventory-2](https://reui.io/preview/base/solution-inventory-2?ref=mcp) | ảnh 40 px, rê xem lớn | mới, nhỏ |
| Thanh giảm | ô thanh của finder | ý từ [data-grid-advanced-1](https://reui.io/preview/base/data-grid-advanced-1?ref=mcp) | vạch ngưỡng 35% | kho, thêm vạch |
| Khung sheet | sheet hàng duyệt, `record-sheet` | [solution-agents-5](https://reui.io/preview/base/solution-agents-5?ref=mcp) | không cần | kho |
| Đầu sheet | chưa có | ý từ [solution-crm-4](https://reui.io/preview/base/solution-crm-4?ref=mcp) | ghép từ phần có sẵn | kho |
| Căn cùng tiêu chí | `ui/table` | không thấy mẫu khớp | hàm chọn căn và hàng so | mới, nhỏ |
| J, K và `?can=` | chưa có | không thấy trong các block đã xem | chỉ là xử lý sự kiện | mới, nhỏ |

Không cài block Pro mới: phần khung trùng khuôn kho đã có, và luật `catalog.md` không cho cài block cho việc kho đã có bản chuyển thể.

Số đo là số bố cục trên dữ liệu bịa, chưa phải thời gian thao tác của người thật.
