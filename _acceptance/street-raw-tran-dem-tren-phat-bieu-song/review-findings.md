## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(Không có mục mới ở round này. Một mục từ round trước được mang sang và máy tự chèn.)

- **Khi sổ nguồn thêm mục mới, trần bỏ qua phuong_raw/district_raw đang lưu của tin cũ, nên lượt chạy xanh mà không báo (r1)**
  Người dùng thấy gì: Khi danh sách tên nguồn cần che được thêm mục mới, các tin đã thu từ trước vẫn có thể giữ chữ mang tên nguồn ở ô phường và quận. Job vẫn chạy xanh và không báo lỗi nào, nên không ai biết ngay.
  Căn cứ: Chỉ xảy ra khi danh sách tên nguồn đổi, hiếm và do người soát danh sách chủ động làm. Dữ liệu vẫn bị chặn ở bước gửi lên cloud nên không lộ ra ngoài, và sửa sau thì rẻ.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có mục nào.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
