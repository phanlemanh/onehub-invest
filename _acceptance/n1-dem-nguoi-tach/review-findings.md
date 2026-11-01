# Review findings: n1-dem-nguoi-tach (round 3)

## Trong hợp đồng

Không có finding nào map vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **evals.yaml E4 ghi n1.so S03 = 1, nhưng test N1T AC-4 khẳng định 2**
  Người dùng thấy gì: Con số ghi trong bản mô tả bằng chứng không khớp con số mà phép kiểm thật in ra. Người ký đối chiếu hai bên có thể nhầm là có lỗi, dù chức năng vẫn đúng.
  Căn cứ: Chỉ là chữ ghi lệch trong tài liệu, không ảnh hưởng người dùng hay dữ liệu, sửa lại sau rất rẻ và không mất gì.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E9 mô tả daTach = {pS}, nhưng test dùng pZ (một party không mang SĐT nào)**
  Người dùng thấy gì: Bản mô tả bằng chứng gọi tên một người khác với người mà phép kiểm thật dùng, kết quả kiểm vẫn đúng. Chỉ gây hơi khó đối chiếu khi đọc.
  Căn cứ: Lệch tên không đổi kết quả và không chạm người dùng; tự sửa được bất cứ lúc nào bằng một dòng chữ.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **E4 trong evals.yaml đòi n1.so S03 = 1, nhưng test N1T AC-4 lại khẳng định 2**
  Người dùng thấy gì: Con số kỳ vọng ghi trong bằng chứng khác con số phép kiểm thật cho ra, nên người ký có thể thấy hai số khác nhau. Chức năng đếm người vẫn chạy đúng.
  Căn cứ: Chỉ là sai lệch tài liệu, không mất hay lộ dữ liệu, sửa sau rất rẻ.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/mã nguồn thay vì đầu ra): AC-8 kiểm main in bằng inBang qua regex trên văn bản tệp**
  Người dùng thấy gì: Việc bước đêm có thật sự in dòng số cặp đã tách hay không chỉ được kiểm gián tiếp qua nội dung mã. Nếu sau này ai đó đổi cách in, phép kiểm có thể vẫn báo xanh dù dòng ấy không còn hiện.
  Căn cứ: Rủi ro nhẹ: nếu dòng này mất thì chỉ thiếu một dòng thông tin trong nhật ký đêm, không mất dữ liệu, và người vận hành nhìn thấy ngay khi đọc log.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: known-limits

- **E4 trong evals.yaml ghi n1.so S03 = 1, nhưng test N1T AC-4 lại khẳng định 2 (r2)**
  Người dùng thấy gì: Tài liệu bằng chứng ghi một con số khác với số mà phép kiểm thực sự dùng. Người ký đối chiếu sẽ thấy lệch, nhưng người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là lời mô tả sai trong giấy tờ nghiệm thu, không làm sai số liệu của người dùng, sửa lại sau rất rẻ.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **E9 trong evals.yaml mô tả daTach = {pS}, nhưng test dùng pZ (r2)**
  Người dùng thấy gì: Mô tả bằng chứng gọi tên một người khác với ca kiểm thực tế, chỉ gây khó đối chiếu cho người ký. Người dùng cuối không thấy gì.
  Căn cứ: Hậu quả chỉ là nhầm tên khi đọc giấy tờ, không mất hay lộ dữ liệu, sửa sau rất rẻ.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Phần expected của E4 trong evals.yaml ghi n1.so S03 = 1, nhưng test khẳng định 2 (r2)**
  Người dùng thấy gì: Tài liệu bằng chứng ghi sai một con số so với ca kiểm đã chạy xanh. Người dùng cuối không bị ảnh hưởng, chỉ người ký cổng có thể bị rối.
  Căn cứ: Sai lệch nằm ở giấy tờ, không ở hành vi sản phẩm, nên nhẹ và sửa sau gần như không tốn gì.
  file: `_acceptance/n1-dem-nguoi-tach/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-8 kiểm main in bằng inBang qua grep mã nguồn, không chụp stdout (r2)**
  Người dùng thấy gì: Phép kiểm chưa chạy bước đêm thật để xem dòng in ra, nên nếu về sau dòng thống kê cặp đã tách bị in sai hoặc in đôi thì có thể không bị phát hiện. Hiện chưa thấy lỗi thật nào.
  Căn cứ: Rủi ro chỉ là bỏ sót một dòng thông tin in ra màn hình của bước đêm, không mất hay lộ dữ liệu, và có thể bổ sung phép kiểm sau.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/n1-dem-nguoi-tach/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
