## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đối chứng E1 so với origin/main đang trôi: chạy lại sau khi gộp thì luôn đỏ «DOI CHUNG KHONG DO»**
  Người dùng thấy gì: Sau khi thay đổi này được gộp, phép kiểm chứng đối chiếu bản cũ không chạy lại được nữa và báo đỏ giả dù tính năng vẫn đúng. Người dùng cuối không bị ảnh hưởng, chỉ người soát lại hồ sơ về sau mới gặp.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm hồ sơ nghiệm thu khó chạy lại sau gộp; ghi lại để người soát sau biết là đủ, không cần sửa ngay.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): 'ok hang chung co s03-moc-ngay' khớp cả dòng comment, không đo hằng**
  Người dùng thấy gì: Một dòng kiểm trong bộ nghiệm thu có thể báo xanh dù hằng bị xoá, nên nó không tự bắt được lỗi đó. Người dùng cuối không thấy gì khác, vì các phép kiểm chạy thật vẫn bắt được lỗi.
  Căn cứ: Chỉ là lưới an toàn phụ yếu hơn mong muốn, còn phép kiểm chính vẫn phủ; hậu quả nhẹ và sửa sau không đắt.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ 'bảng và ca đọc MỘT hằng'): phía bảng chỉ được grep, đột biến AC-2 không đi qua dqLatestSql**
  Người dùng thấy gì: Bộ nghiệm thu chỉ chứng minh phía ca kiểm đọc chung một điều kiện, còn phía bảng chất lượng dữ liệu chỉ được kiểm bằng so khớp chữ. Nếu sau này hai nơi lệch nhau, bảng có thể hiện khác ca kiểm mà không bị bắt ngay.
  Căn cứ: Mã hiện tại đúng và rủi ro chỉ xảy ra nếu có người sửa lệch về sau; người dùng gặp tối đa là một dòng kiểm hiện sai ở trang vận hành nội bộ, sửa sau không đắt.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Đối chứng E1 lấy bản ca từ origin/main động: sau khi gộp thì bước đối chứng hết đỏ, E1 thất bại khi chạy lại (r1)**
  Người dùng thấy gì: Sau khi bản sửa được gộp, bước chứng minh «bản cũ từng đỏ» sẽ không còn đỏ nữa, nên chạy lại hồ sơ này trên nhánh chính sẽ báo thất bại dù mã không hỏng. Người dùng cuối không bị ảnh hưởng, chỉ người chấm lại hồ sơ gặp báo động giả.
  Căn cứ: Chỉ gây báo động giả cho người chấm lại về sau, không mất dữ liệu và không ảnh hưởng người dùng; chỉ cần ghi chú là hồ sơ chỉ chạy được trước khi gộp.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **doi-chung.sh tự exec vô hạn khi DATABASE_URL trỏ DB không phải oneinvest_suite_* (CI hoặc DB khác DB chung) (r1)**
  Người dùng thấy gì: Trong một số môi trường chạy (máy CI hoặc DB khác DB chung) bước chấm này có thể treo mãi không kết thúc. Người dùng cuối không thấy gì, chỉ lượt chấm bị kẹt.
  Căn cứ: Chỉ làm treo lượt chấm trong môi trường hiếm, tự dừng được bằng cách huỷ lượt chạy, không đụng dữ liệu hay người dùng.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/mã nguồn thay vì đầu ra): vế «bảng đọc hằng chung» chỉ đo bằng grep mã nguồn, không bằng hành vi (r1)**
  Người dùng thấy gì: Việc bảng chất lượng dữ liệu thật sự bỏ dòng mới chỉ được kiểm bằng việc đọc mã, chưa chạy thử trên dữ liệu. Nếu sau này có người sửa lệch, bảng có thể hiện thêm một dòng không cần thiết mà bước chấm không bắt được.
  Căn cứ: Hậu quả nhẹ, chỉ là một dòng thừa trên trang chất lượng, tự hết khi sửa lại; chi phí thêm phép đo chạy thật cao hơn so với rủi ro.
  file: `_acceptance/on12-ac5-bo-dong-s03-moc-ngay/probes/pham-vi.sh`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
