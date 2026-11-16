# Review findings: job-step-ghi-thoi-luong (round 1)

## Trong hợp đồng

- **Tuyên quét LỚP nhưng chỉ có điểm-case: phép đo phạm vi của AC-10 không tồn tại dưới dạng assert nào**
  AC: AC-10
  file: `_acceptance/job-step-ghi-thoi-luong/evals.yaml:72`
  severity: medium
  source: measurement
  detail: E10 (và AC-10 trong contract.md dòng 76–83) khai một phép đo riêng: «Phép đo phạm vi: `git diff origin/main -- scripts/job-exit.test.mjs scripts/zalo-import-job.test.mjs` chỉ có các khối chạm đúng hai chỗ ấy, không khối nào khác» và «logic quét không đổi». Executor `jst_regress` trong _acceptance/config.yaml chỉ là `node --test` năm bộ test job; không bộ nào (kể cả job-step-thoi-luong.test.mjs, vốn đã có sẵn khuôn đọc `git diff -U0` ở hàm kiemRanhGioiLan dòng 445–461) chạy phép diff ấy. Mệnh đề «đúng hai chỗ, không hơn» của AC-10 vì vậy chỉ nằm trong văn bản, không có assert nào đỏ khi nó bị vi phạm.
  rationale: AC-10 khẳng định đúng hai sửa đổi và yêu cầu phép so git diff giới hạn; không có phép đo nào chạy mệnh đề ấy nên AC-10 chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phép đo ghi đè tệp nguồn thật trong cây làm việc (khác hẳn khuôn cây tạm của mọi bộ test job)**
  Người dùng thấy gì: Khi chạy bộ kiểm thử, tệp nạp tin thật bị sửa tạm rồi trả lại. Nếu lượt kiểm bị ngắt giữa chừng hoặc trùng lúc lượt nạp định kỳ chạy, lượt nạp có thể chạy sai hoặc tệp còn dính dòng tạm.
  Căn cứ: Hiếm khi xảy ra, chỉ lúc chạy kiểm thử ở thư mục chính, và người dùng khôi phục được bằng cách đưa tệp về bản đã lưu; sửa sau không đắt.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Dòng JOB STEP mang nhãn bước khác dòng JOB FAIL kề bên, trái hợp đồng ghi trong job-step.sh**
  Người dùng thấy gì: Khi bước nạp hồ sơ hỏng, dòng ghi thời lượng và dòng báo hỏng mang hai tên bước khác nhau. Ai đọc nhật ký để ghép cặp sẽ thấy hai dòng lệch nhau đúng ở ca hỏng.
  Căn cứ: Chỉ làm nhật ký khó đọc hơn ở lượt hỏng, không mất hay sai dữ liệu, và sửa nhãn sau rất rẻ.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Lưới hồi quy AC-10 không phủ hết tệp bọc đang dùng job-step.sh**
  Người dùng thấy gì: Một số job khác dùng chung bộ chạy bước không nằm trong lưới kiểm tra hồi quy của vòng này. Chạy thử đều xanh, chỉ là chưa được canh tự động.
  Căn cứ: Chưa có gì vỡ, rủi ro là về sau thay đổi có thể làm hỏng job ngoài lưới mà không ai hay; bổ sung sau rẻ.
  file: `_acceptance/job-step-ghi-thoi-luong/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Phép đo phụ thuộc trạng thái git cục bộ (origin/main, cây bẩn) và lời gọi ngoài không có trần thời gian**
  Người dùng thấy gì: Kết quả kiểm thử phụ thuộc bản origin/main đã tải về máy và những sửa chưa lưu khác. Máy chưa tải mới có thể thấy lỗi khó hiểu.
  Căn cứ: Chỉ gây đỏ nhầm hoặc thông báo khó đọc, chạy lại sau khi tải mới là hết; không ảnh hưởng dữ liệu.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Test ghi đè tệp nguồn có theo dõi trong cây làm việc — đua với các bộ test chạy song song, hỏng cây nếu bị ngắt**
  Người dùng thấy gì: Khi nhiều bộ kiểm thử chạy song song, một bộ có thể đọc phải tệp nạp tin đang bị sửa tạm nên đỏ ngẫu nhiên. Nếu bị ngắt giữa chừng, tệp thật còn dính dòng chèn.
  Căn cứ: Đỏ ngẫu nhiên chỉ cần chạy lại, tệp bị dính dòng tạm khôi phục được từ bản đã lưu; hiếm và sửa sau rẻ.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Lưới ranh giới làn báo đỏ nhầm với thay đổi nằm NGAY DƯỚI dòng mốc (off-by-one)**
  Người dùng thấy gì: Nếu sau này ai thêm một dòng hợp lệ ngay sát dưới dòng ranh giới làn, bộ kiểm sẽ báo đỏ nhầm là sửa sai làn. Hiện chưa dòng nào rơi vào ca này.
  Căn cứ: Chỉ gây báo đỏ nhầm, người làm thấy ngay và dời dòng đi hai chỗ là qua; không mất dữ liệu.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **`banGoc()` nuốt lỗi của `git show` — bản đối chứng rỗng làm phép so mã thoát trở thành trivially-true**
  Người dùng thấy gì: Nếu máy chưa tải bản gốc, một số ô so sánh có thể xanh giả hoặc báo lỗi chỉ sai hướng. Người đọc sẽ đi soi nhầm chỗ.
  Căn cứ: Chỉ làm bộ kiểm kém tin cậy trong tình huống thiếu bản gốc, tải lại là hết; không chạm người dùng cuối.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đột biến chiều đỏ JST-AC-6 bị JS thay `$1`/`$2` thành nhóm bắt — dòng sinh ra không phải đột biến đã khai, ca đỏ qua vì lý do khác**
  Người dùng thấy gì: Một ca thử cố ý làm hỏng để chứng minh bộ kiểm bắt được lỗi, lại làm hỏng sai kiểu. Bộ kiểm vẫn xanh nhưng chưa chứng minh được điều nó định chứng minh.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bằng chứng yếu hơn đã khai; sửa rẻ khi có dịp.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Lối thoát sớm của vòng nạp tin không in dòng `truoc-lan-claude` — lượt hỏng vắng mặt trong sổ thời lượng**
  Người dùng thấy gì: Các lượt nạp hỏng sớm hoặc bận khoá không có dòng thời lượng, nên số đo thời gian chỉ phản ánh các lượt lành. Người đọc có thể tưởng lượt ấy không chạy.
  Căn cứ: Số đo lệch về phía lượt tốt nhưng chỉ là chỉ báo nội bộ, không mất dữ liệu; ghi giới hạn là đủ.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: hai khẳng định "không có Permission denied / No such file" không có đối chứng dương, và đột biến được khai cho chúng không thể làm chúng đỏ**
  Người dùng thấy gì: Hai kiểm tra rằng môi trường chỉ đọc không sinh lỗi quyền chưa được chứng minh là có thể đỏ. Nếu sau này có lỗi ghi tệp câm, bộ kiểm có thể không bắt được.
  Căn cứ: Chưa có lỗi thật, rủi ro là bỏ sót hồi quy trong tương lai; bổ sung ca đối chứng sau không đắt.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: assert vô hiệu, không bao giờ đỏ được theo cấu tạo**
  Người dùng thấy gì: Một dòng kiểm tra trong bộ kiểm luôn đúng nên không có tác dụng. Không làm sai kết quả nào.
  Căn cứ: Vô hại, chỉ là dòng thừa; sửa không đem lại lợi ích đáng kể.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Tuyên quét LỚP nhưng chỉ có điểm-case: ma trận chiều đỏ khai trong evals.yaml rộng hơn số ca thật trong dotBien**
  Người dùng thấy gì: Bằng chứng kiểm thử khai phủ nhiều trường hợp lỗi hơn số trường hợp thật sự được thử. Một số biến thể lỗi chưa có bằng chứng là bị bắt.
  Căn cứ: Chưa có lỗi thật nào bị lọt, chỉ là bằng chứng mỏng hơn lời khai; ghi giới hạn là hợp lý.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tuyên quét LỚP nhưng chỉ có điểm-case: hai đột biến đã khai trong evals.yaml không tồn tại trong bộ test**
  Người dùng thấy gì: Hai kiểu lỗi mà hồ sơ nghiệm thu nói là đã thử thì thực ra chưa được thử trong bộ kiểm. Hồ sơ nói nhiều hơn bằng chứng có.
  Căn cứ: Không ảnh hưởng người dùng; nên ghi rõ giới hạn để người ký không đọc quá mức, sửa sau rẻ.
  file: `_acceptance/job-step-ghi-thoi-luong/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Assert "chuỗi có mặt" trong khi lời hứa là quan hệ giữa các giá trị: mã thoát kiểm bằng includes, 'ra=1' khớp cả 'ra=127'**
  Người dùng thấy gì: Kiểm tra mã thoát chỉ xem chuỗi có chứa số, nên mã 127 vẫn lọt qua ô kiểm mã 1. Một lỗi trả sai mã có thể không bị phát hiện.
  Căn cứ: Chưa có lỗi thật, chỉ là bộ kiểm kém chặt trong ca hiếm; sửa bằng so sánh chính xác rất rẻ.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Assert "chuỗi có mặt" thay cho quan hệ: lượt chỉ-đọc của AC-6 không kiểm mã từng bước, chỉ kiểm số dòng và một mã thoát hằng**
  Người dùng thấy gì: Ở môi trường chỉ đọc, bộ kiểm không xác nhận mã của từng bước mà chỉ đếm dòng. Nếu mã bị lệch trong môi trường ấy thì có thể không ai hay.
  Căn cứ: Chưa có lỗi thật và chỉ ảnh hưởng độ chặt của bộ kiểm; bổ sung kiểm sau không đắt.
  file: `scripts/job-step-thoi-luong.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/16 lỗi rơi vào file không bộ đo nào phủ (_acceptance/job-step-ghi-thoi-luong/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
