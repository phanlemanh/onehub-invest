# Review findings: ghep-tin-vao-danh-muc (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đầu migration 117 ghi cách lùi trái với lui-117.sql**
  Người dùng thấy gì: Người vận hành đọc dòng hướng dẫn lùi trong migration rồi làm theo sẽ gặp một bước lùi chắc chắn báo lỗi giữa chừng. Tệp lùi thật thì đúng.
  Căn cứ: Chỉ là chữ ghi chú sai, không mất dữ liệu và không ảnh hưởng người dùng cuối; người làm đối chiếu tệp lùi thật sẽ thấy ngay, và sửa lúc nào cũng rẻ.
  file: `db/migrations/117_ghep_toa_tren_tin.sql`
  severity: low
  Đề xuất: known-limits

- **Đường lùi của 117 không lấy khoá tư vấn 'ghep-toa': lượt gắn chạy song song có thể để lại dòng sống sau khi lùi**
  Người dùng thấy gì: Nếu lùi đúng lúc một lượt gắn đang chạy, vài tin có thể còn dấu gắn toà dù tính năng đã gỡ.
  Căn cứ: Chỉ xảy ra khi lùi trùng đúng khoảnh khắc lượt gắn đang ghi, rất hiếm; hậu quả nhẹ và chạy lùi lần nữa là dọn được.
  file: `_acceptance/ghep-tin-vao-danh-muc/lui/lui-117.sql`
  severity: low
  Đề xuất: wont-fix

- **Chú thích 'Lùi' trong migration 117 mâu thuẫn với lui-117.sql; làm theo chú thích thì lỗi**
  Người dùng thấy gì: Hướng dẫn lùi ở đầu migration chỉ sai ở phần chữ, người làm theo sẽ bị lỗi ở bước lùi.
  Căn cứ: Không đụng dữ liệu hay người dùng cuối, chỉ làm người vận hành mất thời gian; sửa sau rất rẻ.
  file: `db/migrations/117_ghep_toa_tren_tin.sql`
  severity: low
  Đề xuất: known-limits

- **Trần 60 giây chỉ phủ giao dịch ghi; phần đọc đầu vào (docDauVao) của bước gắn không có trần**
  Người dùng thấy gì: Nếu bước đọc dữ liệu để gắn toà bị kẹt, lượt nạp tin hằng ngày có thể treo mãi và không báo cảnh báo, dù tin đã nạp xong.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu kẹt bất thường; tin đã nạp không mất, khởi động lại lượt chạy là gỡ được, nhưng có thể không ai biết nó đang treo.
  file: `pipeline/lib/ghep-tin-danh-muc-ghi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): ca phải đỏ của đột biến trong migration.sh được ghim bằng TÊN TEST, mà tên test đã in ra cả khi ca đó xanh**
  Người dùng thấy gì: Phép thử giả lỗi cho rào kiểm của cơ sở dữ liệu có thể báo đạt dù không đúng ca cần đỏ, nên bằng chứng yếu hơn lời hứa.
  Căn cứ: Rào thật vẫn có và các test khác kiểm nó; chỉ là bằng chứng chứng minh rào bị phá yếu hơn mức ghi, không làm sai dữ liệu người dùng.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/migration.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4: chỗ ghim của đột biến trong xung-dot.sh là tên test luôn in ra, không phải thông điệp lỗi**
  Người dùng thấy gì: Phép thử giả lỗi cho việc phát hiện tin gắn hai nơi chỉ chứng minh có một ca nào đó đỏ, chưa chắc đúng ca định kiểm.
  Căn cứ: Hành vi gắn tin không sai vì lỗi này; chỉ bằng chứng nghiệm thu yếu đi, nới lại sau không ảnh hưởng người dùng.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4: chay-lai.sh và ham-gan.sh có đột biến ghim bằng tên test thay vì thông điệp**
  Người dùng thấy gì: Vài phép thử giả lỗi cho việc chạy lại và gắn vùng có thể xanh dù không đúng ca cần đỏ, nên bằng chứng yếu hơn lời hứa.
  Căn cứ: Không làm sai tin nào trên cổng; chỉ giảm độ tin của bằng chứng, các đột biến khác vẫn ghim đúng.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: đối chiếu với phép đếm độc lập chỉ so hiệu số đếm, không so tập tin**
  Người dùng thấy gì: Hai cách đếm có thể gắn hai nhóm tin khác nhau mà vẫn ra cùng con số, nên con số 50% chưa chứng minh hai bên gắn đúng cùng các tin.
  Căn cứ: Rủi ro chỉ nằm ở bằng chứng đối chiếu; độ đúng thật đã có phép chấm mẫu người ở nhóm khác đo, và sửa phép so sau này rẻ.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: không có vòng ghi → sửa → đọc cho tệp đóng băng; chỉ kiểm hàm băm của bên ghi**
  Người dùng thấy gì: Nếu phần đọc tệp mẫu đã đóng băng thôi kiểm tra, việc sửa trộm mẫu chấm có thể không bị phát hiện bởi bộ test hiện có.
  Căn cứ: Chỉ ảnh hưởng độ chặt của khâu chấm chất lượng nội bộ, không đụng dữ liệu người dùng; thêm test sau rất rẻ.
  file: `pipeline/scripts/ghep-tin-danh-muc-lat-nhan.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: «cấy dòng của rule_id khác thì tử số không đổi» là phép âm tính một mình, không có đối chứng dương**
  Người dùng thấy gì: Phép thử cấy dòng lạ có thể xanh vì lý do khác, nên chưa chắc chứng minh số tin đã gắn không bị dòng lạ làm lệch.
  Căn cứ: Không làm sai số trên màn; chỉ bằng chứng nghiệm thu có thể rỗng, bổ sung đối chứng sau là rẻ.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay sẵn cả trang 'dat'/'hut' rồi đưa vào gopKetQua**
  Người dùng thấy gì: Phép kiểm cách gộp kết quả hai vòng chấm dùng số tự viết, chưa chứng minh ngưỡng và cỡ mẫu được giữ khi gộp thật.
  Căn cứ: Kết quả chấm thật đã tính ở bước chấm riêng nên số báo cáo không sai theo; chỉ thêm test là xong, không động tới người dùng.
  file: `pipeline/scripts/ghep-tin-danh-muc-cham.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 6/11 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghep-tin-vao-danh-muc/lui/lui-117.sql, _acceptance/ghep-tin-vao-danh-muc/probes/migration.sh, _acceptance/ghep-tin-vao-danh-muc/probes/xung-dot.sh, _acceptance/ghep-tin-vao-danh-muc/probes/chay-lai.sh, _acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
