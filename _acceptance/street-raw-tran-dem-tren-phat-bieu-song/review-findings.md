## Trong hợp đồng

- **Hình dạng 5 (bảng phủ ca chỉ có ca điểm) kèm hình dạng 1 (grep mã nguồn): hàng «phát biểu sống trúng > 50» không được đo trên đường chạy thật**
  file: `pipeline/scripts/street-raw-tran-dem.test.mjs:36`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Bảng phủ ca của contract.md có hàng 3: «Sổ nguồn có token chung chung, tin cũ | phát biểu sống > 50 | PL41 dừng». Diff này bỏ `kiemTranTenNguon(trung.length, "phát biểu sống")` khỏi `docPhatBieuTenNguonS06`. Từ nay đường dừng ấy chỉ còn dựa vào việc transform truyền `nPhatBieuSong: phatBieuTenNguon.length` vào `demTenNguonLuot`. Ba chỗ đo không chạm tới dây nối đó. (a) TD-AC-3 (dòng 36-40) tự đưa số `nPhatBieuSong: 51` vào hàm thuần, nên chỉ kiểm phép cộng `trungMoi + nPhatBieuSong`. (b) TD-AC-4 (dòng 43-50) chỉ dò chuỗi `"demTenNguonLuot(cacO,"` và `"kiemTranTenNguon(demLuot.tran,"` trong mã nguồn, không đọc đối số `nPhatBieuSong`. (c) probes/tran.mjs có ca 1 assert 0 phát biểu sống (dòng 63-66) và ca 2 cũng 0 phát biểu sống, nên không ca DB nào có phát biểu sống trúng. Probe PL39 ban-chep.mjs (dòng 196-208) cũng chỉ cấy 51 tin mới. Hệ quả: đổi transform thành `nPhatBieuSong: 0`, hoặc bỏ hẳn khoá đó (undefined thì `tran` thành NaN, `NaN > 50` là false nên không dừng), thì TD-AC-1..4, E1, E2 vẫn xanh. Lời hứa AC-4 «Phá từng nhánh thì đúng ca giữ nó đỏ» vì vậy không đúng cho nhánh phát biểu sống. Bảng phủ ca có 4 hàng nhưng ca đo được dây nối thật chỉ phủ hàng 2 và 4.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khi sổ nguồn thêm mục mới, trần bỏ qua phuong_raw/district_raw đang lưu của tin cũ, nên lượt chạy xanh mà không báo**
  Người dùng thấy gì: Khi danh sách tên nguồn cần che được thêm mục mới, các tin đã thu từ trước vẫn có thể giữ chữ mang tên nguồn ở ô phường và quận. Job vẫn chạy xanh và không báo lỗi nào, nên không ai biết ngay.
  Căn cứ: Chỉ xảy ra khi danh sách tên nguồn đổi, hiếm và do người soát danh sách chủ động làm. Dữ liệu vẫn bị chặn ở bước gửi lên cloud nên không lộ ra ngoài, và sửa sau thì rẻ.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
