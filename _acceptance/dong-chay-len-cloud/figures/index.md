# Hình tại điểm quyết định — dong-chay-len-cloud

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — «Tin mới nhất» trên cloud hiện từ tin rao cloud hay ẩn tới TV10 | 2 nhánh → cần hình | `hoi-1.html` / `hoi-1.png` |
| Hỏi-2 — khối dataFlow mang gì lên cloud (khó đảo) | 2 nhánh → cần hình | `hoi-2.html` / `hoi-2.png` |
| Đường số: máy thu tính sẵn → bản tin → cloud | 4 bước nối tiếp → cần hình (chung với Hỏi-2) | trong `hoi-2` |

## Đề bài hình hoi-1

- Hai nhánh, tình huống: người vận hành mở «Dòng chảy dữ liệu» trên cloud, cuộn tới «Tin mới nhất».
- Nhánh A (máy khuyên): bảng hiện tin rao (đã có trên cloud), mỗi tin có bậc; mở hồ sơ tin thì chỗ bài gốc ghi «Bài gốc chỉ xem ở máy thu».
- Nhánh B: bảng ẩn trên cloud, ghi «Tin mới nhất xem ở máy thu» cho tới khi có trang hồ sơ tin (TV10).
- Hệ quả mỗi nhánh một dòng: A — thấy tin cụ thể ngay, thiếu bài gốc; B — cloud chỉ có số.

## Đề bài hình hoi-2

- Đường số bốn bước: máy thu tính sẵn số mỗi 15 phút → bản tin gửi lên → cloud lưu bản tin → trang cloud đọc. Bảng thô và tên nguồn thật đứng lại ở máy thu.
- Hộp «khối dòng chảy» liệt thứ đi lên: số chặng theo nguồn, số tin đủ năm trường lõi, số theo ngày, số theo nhóm thu kèm tên nhóm, lưu trú ngắn hạn, loại giao dịch, đề xuất làm giàu chờ. Hộp «không đi lên»: mã tin, bài gốc, mã nhóm, tên nguồn thật.
- Nhánh A (máy khuyên): đồng ý danh sách này; máy chặn mọi trường ngoài danh sách.
- Nhánh B: bỏ tên nhóm khỏi khối — lưới chất lượng theo nhóm trên cloud trống.
