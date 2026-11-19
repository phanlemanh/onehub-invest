# Review findings — on12-ac5-bo-dong-s03-moc-ngay (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đối chứng E1 lấy bản ca từ origin/main động: sau khi gộp thì bước đối chứng hết đỏ, E1 thất bại khi chạy lại**
  Người dùng thấy gì: Sau khi bản sửa được gộp, bước chứng minh «bản cũ từng đỏ» sẽ không còn đỏ nữa, nên chạy lại hồ sơ này trên nhánh chính sẽ báo thất bại dù mã không hỏng. Người dùng cuối không bị ảnh hưởng, chỉ người chấm lại hồ sơ gặp báo động giả.
  Căn cứ: Chỉ gây báo động giả cho người chấm lại về sau, không mất dữ liệu và không ảnh hưởng người dùng; chỉ cần ghi chú là hồ sơ chỉ chạy được trước khi gộp.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **doi-chung.sh tự exec vô hạn khi DATABASE_URL trỏ DB không phải oneinvest_suite_* (CI hoặc DB khác DB chung)**
  Người dùng thấy gì: Trong một số môi trường chạy (máy CI hoặc DB khác DB chung) bước chấm này có thể treo mãi không kết thúc. Người dùng cuối không thấy gì, chỉ lượt chấm bị kẹt.
  Căn cứ: Chỉ làm treo lượt chấm trong môi trường hiếm, tự dừng được bằng cách huỷ lượt chạy, không đụng dữ liệu hay người dùng.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/mã nguồn thay vì đầu ra): vế «bảng đọc hằng chung» chỉ đo bằng grep mã nguồn, không bằng hành vi**
  Người dùng thấy gì: Việc bảng chất lượng dữ liệu thật sự bỏ dòng mới chỉ được kiểm bằng việc đọc mã, chưa chạy thử trên dữ liệu. Nếu sau này có người sửa lệch, bảng có thể hiện thêm một dòng không cần thiết mà bước chấm không bắt được.
  Căn cứ: Hậu quả nhẹ, chỉ là một dòng thừa trên trang chất lượng, tự hết khi sửa lại; chi phí thêm phép đo chạy thật cao hơn so với rủi ro.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
