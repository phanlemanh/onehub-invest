# Review findings: sdt-s06-ghep-tai-khoan (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Số S06, kể cả số ghép, tự vào danh bạ Người và view sellers ngay trong lượt chotot-daily, trái với phạm vi trên thẻ Mạnh ký**
  Người dùng thấy gì: Ngay lần chạy thật đầu tiên, số điện thoại S06 (kể cả số suy ra từ tài khoản) sẽ tự hiện trong danh sách người bán và dấu băm của chúng lên cloud, dù thẻ Mạnh ký ghi là chưa hiện. Người ký đã duyệt dựa trên mô tả này nên có thể phải duyệt lại.
  Căn cứ: Nặng vì số có thể sai người lộ ra danh sách người bán và lên cloud trái với điều đã ký, nhưng số gốc vẫn ở máy và chặn hoặc sửa mô tả trước lần ghi thật đầu tiên thì còn rẻ, sau khi đã lên cloud thì khó rút lại.
  file: `pipeline/transform-chotot.mjs`
  severity: high
  Đề xuất: new-contract

- **Lệnh đo --thu nạp migration chưa merge trên DB oneinvest dùng chung, không có rào DB thử và không giữ khoá 33033**
  Người dùng thấy gì: Khi chạy phép đo trên cơ sở dữ liệu dùng chung, nó có thể làm các job thu hoặc nạp chạy cùng lúc bị chờ hoặc kẹt trong chốc lát. Dữ liệu thật không đổi vì lượt đo được hoàn tác.
  Căn cứ: Nhẹ với người dùng vì dữ liệu không mất và chỉ ảnh hưởng khi lượt đo trùng giờ thu; người chạy tự tránh được bằng cách chọn giờ, còn dựng DB thử riêng thì tốn công hơn mức rủi ro.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Probe ranh giới E9 không phủ hết phạm vi AC-9 và làn ZCode**
  Người dùng thấy gì: Phép kiểm ranh giới có thể báo xanh dù sau này có người sửa nhầm vào các script thu hoặc đẩy dữ liệu lên cloud. Hiện chưa có tệp nào như vậy bị sửa.
  Căn cứ: Nhẹ vì hôm nay không có vi phạm nào và lỗi chỉ làm lưới an toàn lỏng hơn; có thể bổ sung sau với chi phí rất thấp.
  file: `_acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh`
  severity: low
  Đề xuất: known-limits

- **Số S06 tự vào danh bạ và sellers ngay trong job, trái với OOS-2 trên thẻ ký và thiết kế**
  Người dùng thấy gì: Thẻ nghiệm thu nói số S06 chưa hiện trong danh sách người bán, nhưng thực tế chúng sẽ hiện và dấu băm lên cloud ngay lần ghi thật đầu tiên. Khi số ghép bị rút, bản ghi trong danh bạ cũng không tự rút theo.
  Căn cứ: Nặng vì thẻ đã ký mô tả sai điều sẽ xảy ra với dữ liệu người bán và số có thể sai người nằm lại trong danh bạ; nên xử lý trước khi ghi thật vì sau đó khó dọn.
  file: `_acceptance/sdt-s06-ghep-tai-khoan/card-plain.json`
  severity: high
  Đề xuất: new-contract

- **Hàm bị ghi đè thì lượt transform xoá xuất xứ trước khi bộ gán dừng; áp lại 068 không khôi phục, tin ẩn giữ số ghép vĩnh viễn**
  Người dùng thấy gì: Nếu sau này một thay đổi cơ sở dữ liệu khác ghi đè hàm phân xử rồi mới áp lại phần giữ số, các tin đã có số ghép sẽ mất dấu nguồn gốc. Về sau tin nào chuyển sang ẩn số vẫn giữ số ghép mà hệ thống không phát hiện.
  Căn cứ: Mức vừa vì chỉ xảy ra khi thứ tự áp migration bị đảo, nhưng khi xảy ra thì luật tin ẩn số không nhận số ghép bị phá một cách im lặng và không tự sửa được; nên xử lý cùng lúc với migration kế tiếp.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: new-contract

- **Import mới làm hỏng harness E6, E7 của hồ sơ s06-vung-moi-len-canonical**
  Người dùng thấy gì: Hồ sơ nghiệm thu của đợt S06 vùng mới đã ký sẽ báo đỏ khi chấm lại, dù tính năng của nó không hỏng. Điều này có thể chặn các thay đổi sau đó chạm vào cùng tệp.
  Căn cứ: Nhẹ với người dùng cuối vì không ảnh hưởng dữ liệu, nhưng gây đỏ giả ở cổng chấm lại và sửa rất rẻ, nên mở việc nhỏ riêng cho hồ sơ kia.
  file: `scripts/s06-vung-moi/acceptance.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình): nhánh chính của ghep_lech_tu_tin không có chiều đỏ nào, chỉ có assert bằng 0**
  Người dùng thấy gì: Phép đo phát hiện số ghép trỏ sai tin chưa từng được chứng minh là bắt được lỗi, nên con số 0 có thể không đáng tin hoàn toàn. Hiện chưa thấy số ghép nào sai.
  Căn cứ: Nhẹ vì chưa có lỗi thật và chỉ làm bằng chứng yếu đi; có thể bổ sung ca đỏ sau mà không ảnh hưởng dữ liệu.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca GS-RF về account_id khoảng trắng và phone_hidden chuỗi chỉ assert null, không có đối chứng dương**
  Người dùng thấy gì: Một ca kiểm về tài khoản trống hoặc cờ ẩn số dạng chuỗi có thể vẫn xanh dù bộ ghép số hỏng. Chưa có bằng chứng bộ ghép đang sai.
  Căn cứ: Nhẹ vì chỉ là độ tin cậy của phép kiểm, không làm mất hay sai dữ liệu, và thêm đối chứng sau rất rẻ.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ của E9 không nằm trong lệnh eval, cmd chỉ chạy đường xanh**
  Người dùng thấy gì: Phép kiểm ranh giới chỉ được chạy ở trường hợp không có gì sai, nên chưa chứng minh được nó thật sự báo đỏ khi có tệp cấm bị sửa.
  Căn cứ: Nhẹ vì không ảnh hưởng người dùng và hôm nay không có tệp cấm nào bị đổi; sửa rẻ nhưng không gấp.
  file: `_acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): regex ranh giới bỏ lọt tệp đẩy cloud và script thu, nạp mà AC-9 hứa không đổi**
  Người dùng thấy gì: Phép kiểm sẽ không cảnh báo nếu ai đó sửa script đẩy dữ liệu lên cloud hoặc script thu và nạp. Hiện chưa có tệp nào như vậy bị sửa.
  Căn cứ: Nhẹ vì chưa có vi phạm nào và chỉ làm lưới an toàn thưa hơn lời hứa; bổ sung sau với chi phí thấp.
  file: `_acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt trong khi lời hứa là quan hệ): ô «giữ nguyên» chỉ kiểm rule_id, không so khoá sau với khoá trước**
  Người dùng thấy gì: Với những tin được giữ nguyên số, nếu thông tin nguồn gốc của số bị đổi nhẹ thì phép kiểm vẫn xanh. Chưa thấy trường hợp nào đổi thật.
  Căn cứ: Nhẹ vì chỉ làm phép kiểm lỏng hơn mô tả, dữ liệu không bị sai ngay, và chặt lại sau rẻ.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): dòng stg và bước «importer xoá số» của AC-4 không đi qua writer thật**
  Người dùng thấy gì: Phép kiểm mô phỏng việc lượt thu làm mất số theo cách đơn giản hơn lượt thu thật, nên có thể bỏ sót tình huống thu lại làm đổi mã tài khoản hoặc cờ ẩn số. Chưa có ca nào như vậy được thấy.
  Căn cứ: Mức nhẹ đến vừa vì rủi ro là số bị mất hoặc ghép sai khi thu lại, nhưng dựng lại được từ dữ liệu thu và phụ thuộc vào bộ thu bên làn khác sắp thay.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): chiều đỏ E8 «COMMIT thay ROLLBACK» và «thoát 1» chỉ là giá trị đưa tay vào kiemBatBien**
  Người dùng thấy gì: Chưa có phép kiểm nào chứng minh lệnh đo thật sự báo lỗi và thoát khi dữ liệu bị đổi hoặc bất biến sai. Đường thành công thì vẫn đã chạy được.
  Căn cứ: Nhẹ vì lệnh đo chỉ chạy do người và không sửa dữ liệu khi đường chính hoạt động; sửa thêm ca đỏ thật khá tốn công so với rủi ro.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo môi trường tác giả thay vì cây đang kiểm): bản hàm phân xử dưới test được đọc cứng từ public của DB dùng chung**
  Người dùng thấy gì: Phép kiểm dựa vào phiên bản hàm đang có trong cơ sở dữ liệu dùng chung, nên nếu có thay đổi mới chưa áp thì kết quả xanh có thể không phản ánh đúng mã đang kiểm.
  Căn cứ: Nhẹ vì hiện hai bản khớp nhau và không ảnh hưởng dữ liệu; chỉ cần chú ý khi có migration mới định nghĩa lại hàm.
  file: `pipeline/scripts/gan-sdt-s06.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 6/14 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/sdt-s06-ghep-tai-khoan/probes/ranh-gioi.sh, _acceptance/sdt-s06-ghep-tai-khoan/card-plain.json, scripts/s06-vung-moi/acceptance.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

