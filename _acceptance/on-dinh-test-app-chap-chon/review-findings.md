# Review findings: on-dinh-test-app-chap-chon (round 3)

## Trong hợp đồng

Không có finding nào map được vào AC ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **LOP_LOG = 5 viết cứng, không suy ra từ LOCKDOWN_LAYERS (r1)**
  Người dùng thấy gì: Hôm nay không ảnh hưởng người dùng. Nếu sau này có người thêm một lớp mới vào khối khoá an toàn của trang vận hành, bài kiểm này có thể bỏ sót lớp đó mà vẫn báo xanh.
  Căn cứ: Chỉ là bài kiểm nội bộ, chưa có lớp mới nào nên chưa mất gì, và người thêm lớp sau này có thể sửa kèm ngay lúc đó với chi phí thấp.
  file: `app/tests/ops-facts-so-tong-hop.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Probe đối chứng ghi tệp test tạm vào app/tests/ mà không có trap dọn khi bị ngắt (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu người chạy kiểm bị ngắt giữa chừng, một tệp kiểm thử cũ hay chập chờn có thể nằm lại trong thư mục kiểm thử và gây đỏ ngẫu nhiên ở lần chạy sau. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người vận hành khi ngắt giữa chừng, xoá tay tệp thừa là xong, không mất dữ liệu và không đụng sản phẩm.
  file: `_acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh`
  severity: low
  Đề xuất: wont-fix

- **Đối chứng AC-2: pgrep giả chỉ tới được phía app, phía bên ghi vẫn gọi /usr/bin/pgrep thật, nên bằng chứng «hai phía gọi» là sai (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bằng chứng nghiệm thu nói quá: nó khẳng định trình đo giả được cả hai phía dùng, trong khi thật ra chỉ một phía dùng. Người dùng sản phẩm không thấy gì, nhưng người ký có thể tin kịch bản mô phỏng rộng hơn thực tế.
  Căn cứ: Không ảnh hưởng người dùng cuối và bản sửa vẫn ổn định; chỉ là lời mô tả bằng chứng chưa khớp cơ chế thật, có thể ghi rõ giới hạn này khi ký.
  file: `_acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: đếm «có mặt» (goi > 0) thay cho quan hệ «hai phía cùng gọi pgrep giả», và bên ghi thực ra không gọi nó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo trong bằng chứng chỉ chứng minh trình đo giả được gọi ít nhất một lần, không chứng minh cả hai phía đều dùng nó. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Trùng với điểm về bằng chứng nói quá ở trên, hậu quả chỉ là độ tin cậy của lời mô tả nghiệm thu, không ảnh hưởng người dùng hay dữ liệu.
  file: `_acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng âm «bản cũ đỏ ≥ 1/3» không ghim thông điệp hay lớp gây đỏ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bước đối chứng có thể báo thành công dù bản cũ đỏ vì lý do khác với lý do đã nêu. Người dùng sản phẩm không bị ảnh hưởng, chỉ làm bằng chứng nghiệm thu yếu hơn.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; chỉ làm bằng chứng đối chứng kém chặt, ghi lại là đủ vì bản sửa đã xanh ổn định.
  file: `_acceptance/on-dinh-test-app-chap-chon/probes/ops-doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: AC-1 chỉ kiểm âm tính «fail 0», không đối chứng dương số ca pass như expected đã hứa (r1)**
  Người dùng thấy gì: Nếu có ca kiểm bị bỏ qua hoặc xoá nhầm, bước kiểm lặp vẫn báo xanh. Người dùng cuối không bị ảnh hưởng, nhưng bài kiểm có thể kém bao phủ mà không ai hay.
  Căn cứ: Không ảnh hưởng sản phẩm hay dữ liệu; nguy cơ chỉ xảy ra nếu ai đó sau này xoá ca kiểm, và vòng duyệt thay đổi thường lộ việc đó.
  file: `_acceptance/on-dinh-test-app-chap-chon/probes/ops-lap.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
