# Tệp anh em `danh-ba-vat-the-*.itest.mjs` — soi cùng lỗi (chỉ báo, không sửa trong hàng này)

Soi tĩnh ngày 12/11 trên main e01513de. Không chạy, vì khoá s4 đang thuộc dãy khác (luật máy yên).

| Tệp | Lỗi luật một tỉnh (`nhieu-tinh` / `tinh-khong-co-iso`) | Lỗi áp 082 lần hai trên DB đủ migration | Căn cứ |
|---|---|---|---|
| `danh-ba-vat-the-that.itest.mjs` (executor `dbv_that`) | **Nghi có** | Không | Dựng DB thử đủ migration (`taoDbThu(TEN)`, có 088) và chép `areas` từ máy thu. Câu chép chỉ lấy `id, region_type, name, country_code` (dòng ~61–64), bỏ `parent_id` và `admin_code`. Sau đó gọi lệnh dựng thật (`pipeline/danh-ba-vat-the.mjs --db …`, dòng ~105). Phường không có cha nên khu sẽ ra `nhieu-tinh` hoặc `tinh-khong-co-iso` như fixture của tệp chính. |
| `danh-ba-vat-the-iso.itest.mjs` (`da1_db`) | Không | Không | Chạy trên DB của riêng lượt chép từ máy thu (có PX1, `admin_code`, `parent_id`) và tự áp 088 trong ca. Đây là tệp của chính DA1. |
| `danh-ba-vat-the-xa.itest.mjs` (`dv1_db`) | Không | Không | DB của riêng lượt chép từ máy thu có PX1; không dựng fixture vùng. |
| `danh-ba-vat-the-xa-that.itest.mjs` (`dv1_that`) | Không | Không | Phiên chỉ đọc máy thu, chỉ đếm. |

Khuyến nghị: mở một hàng riêng cho `danh-ba-vat-the-that.itest.mjs`, sao cho câu chép `areas` mang theo `parent_id` và
`admin_code`, kèm các thị trường cha. Chạy lẻ tệp một lần khi máy rảnh để xác nhận trước khi sửa.
