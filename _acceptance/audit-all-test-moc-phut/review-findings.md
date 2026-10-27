# Review findings: audit-all-test-moc-phut (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích đầu tệp test chưa liệt kê bản giả date mới**
  Người dùng thấy gì: Người đọc mã kiểm thử có thể không biết trong môi trường thử có một lệnh xem giờ bị thay bằng bản giả. Người dùng cuối không thấy gì khác biệt, kết quả kiểm thử vẫn đúng.
  Căn cứ: Chỉ là thiếu một dòng chú thích, không ảnh hưởng người dùng hay dữ liệu, ai đọc tệp cũng tự hiểu được và thêm sau rất rẻ nên không cần mở việc riêng.
  file: `scripts/audit-all.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 — tuyên quét LỚP («mọi chỗ script đọc giờ») nhưng kiểm kê chỉ là danh sách điểm-case viết tay**
  Người dùng thấy gì: Nếu sau này ai đó thêm vào script kiểm tra một cách đọc giờ lạ ngoài danh sách đã khai, bộ kiểm thử có thể vẫn báo xanh và không cảnh báo sớm về nguy cơ chập chờn theo phút.
  Căn cứ: Rủi ro chỉ là bài kiểm thử có thể chập chờn trở lại trong tương lai, không mất hay lộ dữ liệu, người vận hành thử lại được; hiện script chưa có nguồn giờ nào như vậy nên chấp nhận và ghi lại giới hạn.
  file: `_acceptance/audit-all-test-moc-phut/probes/qua-phut.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — chỉ đếm số ca trong khi lời hứa «không bớt ca nào» là quan hệ tập hợp**
  Người dùng thấy gì: Nếu có người lỡ bỏ một ca kiểm thử cũ rồi thêm hai ca mới, phép kiểm vẫn báo đủ số ca và bỏ sót việc mất một ca bảo vệ.
  Căn cứ: Chỉ xảy ra khi có thao tác sửa tệp kiểm thử cố ý hoặc nhầm, người rà soát đọc thay đổi sẽ thấy ngay, không ảnh hưởng người dùng cuối; khó xảy ra nên ghi lại là đủ.
  file: `_acceptance/audit-all-test-moc-phut/probes/lap.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
