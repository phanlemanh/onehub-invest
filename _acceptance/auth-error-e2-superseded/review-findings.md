# Review findings: auth-error-e2-superseded (round 1)

Finder không chết; không có cảnh báo review dở dang.

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ô E2 thiếu contract.md của hồ sơ thay trong paths, trong khi test kiểm AC-1 ở chính tệp đó (lệch mẫu AER-AC-4)**
  Người dùng thấy gì: Nếu sau này có người sửa hoặc bỏ tiêu chí AC-1 trong hồ sơ thay, lưới cảnh báo bằng chứng cũ sẽ không tự báo ô E2 là lỗi thời. Người dùng cuối không bị ảnh hưởng; chỉ làm sổ nghiệm thu kém nhạy với thay đổi về sau.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; chỉ là độ nhạy của sổ nghiệm thu, lỗi sẽ lộ khi có người sửa hồ sơ và có thể bổ sung sau với chi phí rất nhỏ.
  file: `_acceptance/auth-error-e2-superseded/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «thêm khoá ở cây đang kiểm → ca so cặp vẫn xanh» được kiểm trên đầu vào không hề chứa khoá thêm**
  Người dùng thấy gì: Phép kiểm cho vế «thêm khoá ở cây đang kiểm không làm ca so cặp đỏ» chưa thực sự đặt khoá thêm vào nguồn được đọc, nên nếu sau này logic đọc bị đổi thì ca vẫn xanh lặng. Người dùng cuối không thấy gì; chỉ làm lưới kiểm kém chặt hơn ở vế này.
  Căn cứ: Không ảnh hưởng người dùng cuối, không mất dữ liệu; rủi ro chỉ xuất hiện nếu ai đó đổi cách so cặp về sau, và sửa cần đụng tệp kiểm của hồ sơ khác nên nên làm thành việc riêng.
  file: `_acceptance/auth-error-e2-superseded/evals.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/2 lỗi rơi vào file không bộ đo nào phủ (_acceptance/auth-error-e2-superseded/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
