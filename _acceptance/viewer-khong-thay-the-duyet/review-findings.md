# Review findings: viewer-khong-thay-the-duyet (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Executor viewer_the_duyet thiếu chú thích, chú thích của nó bị dồn sang dòng dev_ops_account**
  Người dùng thấy gì: Người đọc bảng cấu hình nghiệm thu có thể hiểu nhầm bước kiểm nào thuộc hồ sơ nào. Người dùng cuối của cổng không thấy khác biệt nào.
  Căn cứ: Chỉ là một dòng ghi chú đặt lệch chỗ, không đổi hành vi nào của sản phẩm, không mất hay lộ dữ liệu, và chỉnh lại khi tiện tay rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Che postGroup với viewer và dẫn luật 6 làm căn cứ là đọc sai: tên nhóm là tầng C, cùng trang vẫn hiện cho viewer**
  Người dùng thấy gì: Vai người xem sẽ không thấy tên nhóm trong khung xem chi tiết bài, dù tên nhóm vẫn hiện ở chỗ khác trên cùng trang. Không có dữ liệu nào bị lộ, chỉ là che hơi dư và lời giải thích trong mã dẫn luật chưa chính xác.
  Căn cứ: Hậu quả nhẹ vì chỉ che nhiều hơn mức cần, không lộ gì cho người xem, và hợp đồng đã ký chủ động yêu cầu che cả hai thứ này.
  file: `app/src/components/ops/data-flow/data-flow-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng bộ dò chỉ phủ một phần lớp): VT-AC-8 kiểm 'khong-doc' bằng TIN_HIEU chỉ có 4 tên cột**
  Người dùng thấy gì: Sau này, nếu có người thêm một màn Ops đọc nội dung thẻ hay ảnh tin theo cách bộ kiểm không nhận ra và tự khai là không đọc, vai người xem có thể thấy nội dung mà bộ kiểm tự động không báo đỏ. Hiện tại không có màn nào như vậy bị chỉ ra.
  Căn cứ: Rủi ro chỉ xảy ra ở thay đổi tương lai và vẫn còn bước duyệt của người, hiện chưa có màn nào lộ nội dung; mở rộng bộ dò sau này không mất dữ liệu và không đắt.
  file: `app/tests/viewer-the-duyet.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã nguồn thay vì đầu ra): VT-AC-4 'thân trang tự đọc phiên' chỉ grep page.tsx và data-flow-content.tsx**
  Người dùng thấy gì: Nếu sau này ai đó sửa trang dòng chảy để dùng một người đăng nhập cố định thay vì phiên thật, bộ kiểm tự động có thể vẫn xanh trong khi vai người xem bị đối xử sai. Hiện tại trang vẫn đọc đúng người đăng nhập.
  Căn cứ: Hiện không có sai lệch thật nào với người dùng; nguy cơ chỉ có khi mã bị sửa sai về sau, và người tự thử được trên màn hình (bước chụp màn hình của AC-9) sẽ thấy ngay.
  file: `app/tests/viewer-the-duyet.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip qua writer): VT-AC-6 tự dựng payload ops_heartbeat**
  Người dùng thấy gì: Nếu cách hệ thống ghi dữ liệu dòng chảy lên cloud lệch với dữ liệu mẫu trong bộ kiểm, bộ kiểm vẫn có thể xanh dù trang cloud hiện trạng thái lỗi. Với vai người xem và vai vận hành thì kết quả vẫn giống nhau.
  Căn cứ: Không liên quan việc lộ nội dung cho vai người xem, chỉ là bộ kiểm có thể bỏ lọt một lệch khuôn dữ liệu; lệch khuôn đó người dùng tự thấy khi mở trang và sửa không mất dữ liệu.
  file: `app/tests/viewer-the-duyet.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
