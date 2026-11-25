# Review findings: goi-thang-anthropic (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ lọc gta_luoi giấu mọi VIOLATION của chính hồ sơ, không chỉ các dòng chờ ký như AC-9 đòi**
  Người dùng thấy gì: Bước kiểm trước khi gộp có thể báo xanh dù hồ sơ nghiệm thu của chính tính năng này còn một lỗi hình thức nào đó. Tính năng đọc tin và gọi model vẫn chạy đúng, chỉ là lưới an toàn lỏng hơn mức hợp đồng mô tả.
  Căn cứ: Hậu quả nhẹ: không mất dữ liệu, không ảnh hưởng người dùng cuối, chỉ có nguy cơ lọt một lỗi hồ sơ mà con người vẫn soát ở cổng ký; sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **con_lai bỏ sót bài đang gọi khi lượt dừng sớm vì hết tiền hoặc sai khoá**
  Người dùng thấy gì: Khi lượt đọc tin dừng sớm vì hết tiền, con số báo còn bao nhiêu bài chưa đọc thấp hơn thực tế một bài. Người vận hành có thể tưởng còn ít việc hơn khi chạy bù.
  Căn cứ: Hậu quả nhẹ: chỉ lệch một bài trong con số báo cáo, không mất hay hỏng dữ liệu, và lần chạy bù kế tiếp tự đếm lại đúng từ sổ thật.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: lỗi Gateway hết tiền trong ca tự lùi «cả hai cạn»**
  Người dùng thấy gì: Một ca thử trường hợp cả hai đường gọi model đều hết tiền dùng lỗi giả do người viết tự dựng, nên nếu thư viện thật đổi cách báo lỗi thì ca này vẫn xanh trong khi đêm thật có thể xử lý khác.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra nếu nhà cung cấp đổi định dạng lỗi; không mất dữ liệu, các ca khác đã đo lỗi thật, và nếu có lệch thì lần chạy bù sẽ lộ ngay và sửa được sau.
  file: `agent/tests/goi-thang-anthropic.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
