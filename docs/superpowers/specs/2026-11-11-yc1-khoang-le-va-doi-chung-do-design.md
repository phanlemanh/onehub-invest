# Khoảng có phần lẻ viết rời và đối chứng đỏ của lệnh đo ngân sách

Hàng `yc1-khoang-le-va-doi-chung-do`, dãy P2, giám sát đợt mở ngày 11/11. Hàng gộp hai mục Mạnh định tuyến «mở hợp đồng
mới» khi ký Cổng Bằng chứng của hồ sơ `sua-doc-ngan-sach-yeu-cau` (YC1, PR #419):

- nhóm A thuộc `sua-doc-ngan-sach-yeu-cau` Ngoài-3: khoảng có phần lẻ viết rời ở đầu dưới bị đọc sai;
- nhóm B thuộc `sua-doc-ngan-sach-yeu-cau` Ngoài-5: bộ dò của lệnh đo chưa có đối chứng đỏ.

Các dòng sổ ở `_acceptance/sua-doc-ngan-sach-yeu-cau/decisions.jsonl`, mã gate2 ngày 11/11.

## Nhóm A — khoảng có phần lẻ viết rời ở đầu dưới

Thử trên main 7e7b7073 (bộ đọc của YC1):

| Chữ | Dịch vụ | Ra | Đúng là |
|---|---|---|---|
| `cần mua 2 tỷ 5 - 3 tỷ` | mua | trần 2 tỷ | 2,5 tới 3 tỷ |
| `cần mua 2 tỷ 2 - 2 tỷ 5` | mua | trần 2 tỷ | 2,2 tới 2,5 tỷ |
| `cần thuê 8tr 5 - 9tr` | thuê | trần 8 triệu | 8,5 tới 9 triệu |
| `cần mua 2 tỷ 5 ~ 3 tỷ` | mua | trần 2 tỷ | 2,5 tới 3 tỷ |
| `cần mua 2 tỷ 5 đến 3 tỷ` | mua | 2,5 tới 3 tỷ | (đúng) |
| `tìm thuê tc 8tr 7-8/11` | thuê | trần 8 triệu | (đúng, ngày không thành phần lẻ) |

Nguyên nhân: trong mẫu «khoang», nhánh phần lẻ viết cách của đầu dưới (`alec`) mang `CACH_LE` — lookahead cấm đúng dấu
nối mà mẫu khoảng đòi ngay sau đó. Khoảng không khớp nên mẫu «mot» lấy «2 tỷ» làm trần.

Sửa: bỏ `CACH_LE` khỏi nhánh `alec` của mẫu «khoang» (dấu nối đã do `NOI` đòi, đầu trên do `TIEN("b")` đòi có đơn vị). Ở
mọi mẫu khác `CACH_LE` giữ nguyên, nên «tc 8tr 7-8/11» vẫn ra trần 8 triệu (đầu trên «8/11» không có đơn vị nên không phải
khoảng). Chỉ sửa khối «Ngân sách»; băm phần ngoài khối (YC1 AC-8) giữ nguyên.

Ma trận ca của `pipeline/scripts/yeu-cau-ngan-sach.test.mjs` thêm mã `khoảng lẻ rời` với bốn ca dương ở bảng trên, cộng ca
`đến` làm đối chứng và ca ngày giữ nguyên. Tổng ca ghim tăng tương ứng. Chiều đỏ: bản sao đột biến giữ `CACH_LE` ở nhánh
`alec` thì thông điệp «KHOANG LE ROI 2 tỷ 5 - 3 tỷ».

Đo lại trên DB máy thu bằng lệnh của YC1, gốc so là main 7e7b7073: mất 0, thuê từ 100 triệu 0, min > max 0; in số bài đổi
giá trị kèm mẫu.

## Nhóm B — đối chứng đỏ cho bộ dò của lệnh đo

`pipeline/scripts/do-ngan-sach-yeu-cau.mjs` có bốn lý do đỏ (`lyDoDo`): số có ngân sách giảm, có bài mất ngân sách, có bài
thuê từ 100 triệu/tháng, có bài min > max. Lượt chấm YC1 chỉ chứng được lý do «mất»; ba lý do kia in 0 mà chưa từng được
cho đỏ (YC1 Ngoài-5), và chiều đỏ min > max mà E7 của YC1 hứa không có đường chạy (YC1 Ngoài-1).

1. **Test thuần mới** `pipeline/scripts/do-ngan-sach-yeu-cau.test.mjs`, không DB: gọi `soSanh` + `lyDoDo` với hai bộ đọc
   giả trên cùng danh sách bài dựng sẵn.
   - Đối chứng dương: hai bộ đọc giống nhau thì không có lý do đỏ.
   - Bốn đột biến, mỗi đột biến bật đúng một lý do, thông điệp ghim:
     - bộ đọc mới làm rơi một bài và không thêm bài nào → `SO CO NGAN SACH GIAM` và `MAT NGAN SACH`;
     - bộ đọc mới làm rơi một bài nhưng đọc thêm một bài khác → chỉ `MAT NGAN SACH`;
     - bộ đọc mới trả 120 triệu cho một bài thuê → chỉ `THUE TU 100 TRIEU`;
     - bộ đọc mới trả min > max cho một bài → chỉ `MIN LON HON MAX`.
2. **`--tu-kiem` thành phép tự kiểm có nghĩa.** Chạy đúng bốn đột biến ấy qua `soSanh` + `lyDoDo` của chính tệp. Thoát 0 và
   in «YCNS-DO TU-KIEM PASS 4/4» khi mỗi đột biến bật đúng lý do của nó. Thoát 1 và gọi tên đột biến khi có một lý do không
   bật. Nối thành executor `ycns_tu_kiem` trong `_acceptance/config.yaml`.

## Ngoài phạm vi

- Lệnh đo lấy dịch vụ theo phát biểu thắng và chọn bài theo đường ghi thật (YC1 Ngoài-2, Ngoài-4 — đã ghi Known limits).
- Luật «mỗi mã ít nhất hai ca» đếm gộp và chiều đỏ «THIEU CA» của bảng ca (YC1 Ngoài-6, Ngoài-7 — Known limits).
- Bảng `inquiry_records` (YC0), luật nhận Yêu cầu (YC2).
