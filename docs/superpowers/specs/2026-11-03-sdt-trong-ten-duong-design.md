# Số điện thoại trong tên đường S06 — thiết kế

Ngoài-4 của hồ sơ `s06-duong-du-an-len-tin` (DS1), Mạnh chọn mở hợp đồng mới. DS1 đưa `payload.street_name` lên `street_raw` và
`properties.street`, hai cột này lên cloud và `/api/v1/listings`; bộ cắt `streetOf` chỉ cắt số đầu chuỗi nên chữ kèm số vẫn hiện.
AGENTS.md luật 6: số người bán chỉ trả khi bấm «Xem số», không nằm trong HTML hay danh sách API.

## Số đo 03/11 (chỉ đọc, đã che chữ số)

- `stg_chotot_ads` có giá và diện tích, có đường: 49.611 tin; có dãy từ 9 chữ số, cho phép ngăn: 55 tin. 48 tin chỉ có số, 7 tin có chữ.
- Dạng trong 55 tin: 41 liền, 6 ngăn khoảng trắng kiểu `9999 999 999`, 1 kiểu `999 999 99 99`, 7 có chữ (4 kiểu `c/c c c c c 9999.999.999`, 3 kiểu số đi với tên). Dạng gạch, `+84`, thiếu số 0: 0 tin, ma trận vẫn ghim. Phép `\d{9,}` liền nhau bỏ sót các dạng có ngăn.
- Trên toàn `stg_chotot_ads` có đường (61.171 tin, không lọc giá và diện tích) vẫn là 55 tin. Định nghĩa rộng hơn (tới ba ký tự không phải chữ giữa hai chữ số) bắt thêm 3 chuỗi: hai địa chỉ nhiều dấu `/` và một toạ độ, không phải số điện thoại. Số bàn tám chữ số: 1 chuỗi.
- Cột khác: `block_raw` 0; `street_number` 85/26.417 và `unit_number` 2/9.040 của S06 mang dãy số, hai cột này không nằm trong CLOUD_ALLOW nên ở lại máy.
- Đã có sẵn một giá trị: phát biểu `legacy` sống, cột tin và `properties.street`. `enrichment_log`: 0.

## Vì sao ba lớp

1. **Bộ đọc** `docDuong`: chuỗi có số thì không phát biểu. Bỏ cả chuỗi, không gạt số: phát biểu `source_field` phải đúng chữ nguồn, và cả 7 chuỗi có chữ đều là lời liên hệ, không phải tên đường.
2. **Phát biểu sống** ở transform: chỉ sửa bộ đọc thì nguồn rút và cột về `legacy` vẫn mang số. Rút phát biểu `street_raw` S06 mang số, lý do `chua-sdt`, rồi phân xử lại các tin đó. Dòng không xoá.
3. **Ô căn** ở `resolve-properties`: `dienDuongCan` không đụng ô có sẵn. Ô mang số về NULL kèm một mục log không chứa số, rồi được điền lại từ tin sạch; bên điền không nhận từ tin còn số, để resolve chạy trước transform cũng không chở số.

Một mẫu duy nhất `MAU_DAY_SO` dùng được ở cả JS và Postgres, ở `pipeline/lib/sdt-trong-chuoi.mjs`. Thước đo định nghĩa độc lập: gộp các chữ số cách nhau đúng một dấu rồi tìm 9 chữ số liền, không dùng mẫu của mã; đồng thời in số chuỗi theo định nghĩa rộng để thấy chỗ mẫu hẹp bỏ qua.

Giới hạn của mẫu: chuỗi kiểu `123-125-127 Lê Lợi` cũng bị bỏ. Đo 03/11: 0 tin dạng này, hàng 17 ghim hành vi. Gỡ nhầm thì đổi mẫu rồi chạy lại transform, vì nguồn còn nguyên trong `stg`; `legacy` đã rút thì không tự sống lại.

## Không đổi

`app/`, `sync-cloud.mjs`, migration. `sync-cloud` đọc mọi dòng rồi xoá-chèn hoặc upsert đè mọi cột cho phép, nên NULL lên cloud ở lượt đồng bộ kế (AC-5 đo); `field_assertions` không nằm trong CLOUD_ALLOW nên phát biểu đã rút vẫn chỉ ở máy.
