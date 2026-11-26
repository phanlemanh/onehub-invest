# Review findings: s08-test-cach-ly-token (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lệnh chấm zc19_cach_ly tạo hai thư mục mktemp (HOME, TMPDIR) mà không bao giờ dọn**
  Người dùng thấy gì: Mỗi lần chấm hàng này để lại hai thư mục rỗng hoặc gần rỗng trên máy chấm. Người dùng sản phẩm không bị ảnh hưởng, chỉ máy chấm bẩn dần.
  Căn cứ: Hậu quả rất nhẹ, chỉ tốn một ít dung lượng trên máy chấm, hệ điều hành tự dọn thư mục tạm, kết quả chấm không sai, và sửa không đáng công mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Chốt «mã sản xuất không đổi» tự xanh khi git merge-base lỗi (fallback ẩn)**
  Người dùng thấy gì: Trong một số môi trường thiếu lịch sử git, phép kiểm xác nhận mã bộ thu không bị đụng tới có thể báo xanh dù mã đã bị sửa. Khi đó một thay đổi lẽ ra bị chặn có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ xảy ra khi môi trường chấm thiếu lịch sử, hiện mã đúng là không đổi nên chưa có hại thật, nhưng rào chắn có thể im lặng mất tác dụng và sửa sau thì rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/2 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
