# Review findings: s03-tran-thoi-gian-luot-nap (round 1)

Không có finder nào chết; review đầy đủ.

## Trong hợp đồng

- **Năm log mẫu của E9 bị .gitignore loại, AC-9 đỏ trên checkout sạch**
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh:7`
  severity: high
  AC: AC-9
  source: conventions
  detail: do-luot-dem.test.sh đọc mau/*.log, nhưng .gitignore:23 (`*.log`) loại cả năm tệp nên `git ls-files` không có thư mục mau/. Đã chạy thử trên bản `git archive HEAD`: cả năm ô báo «không đọc được mau/...», rc=1, không in DO-LUOT-DEM OK. E9 chỉ xanh ở worktree đang giữ tệp chưa commit, nên bằng chứng AC-9 không tái lập được. Cần đưa mẫu vào kho (`git add -f` hoặc đổi đuôi tệp).

- **Hình dạng 5 — Tuyên phủ lớp nhưng chỉ có điểm-case: ô vòng hồ sơ của AC-1 thiếu hai lời hứa mã thoát và không chạy transform**
  file: `scripts/zalo-import-tran.test.mjs:102`
  severity: high
  AC: AC-1
  source: measurement
  detail: Contract AC-1 hứa cho cả snapshot tin lẫn hồ sơ: dòng TIMEOUT, lượt thoát 124, state giữ mốc cũ, không bước transform nào chạy, «vòng tin và vòng hồ sơ mỗi vòng một ca». Ca (a) kiemAC1Tin assert đủ, còn ca (b) dòng 102-108 chỉ assert TIMEOUT, state hồ sơ, JOB FAIL nap-ho-so và sổ nạp rỗng; không có assert r.status === 124 và không có doesNotMatch bước transform-. E1 (b) trong evals.yaml cũng bỏ đúng hai ô này. Phần bỏ sót che một lệch thật: chạy bản sao script với một snapshot hồ sơ và ZALO_IMPORT_TRAN_NAP=0 cho mã 124 nhưng vẫn chạy truoc-lan-claude, transform-zalo, transform-media, refresh-bait-gap, xep-hang-gia, doc-gop-hang-ngay, enrich-run, trái lời hứa «không bước transform nào chạy» của AC-1 (zalo-import-daily.sh dòng 250 ghi hồ sơ hỏng không chặn chuỗi tin). Ca (b) vẫn xanh nên hợp đồng và hành vi lệch nhau mà bộ đo không báo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khoá mang PID tái dùng không bao giờ được gỡ, job nạp kẹt vô hạn**
  Người dùng thấy gì: Sau khi máy khởi động lại, một khoá cũ có thể bị nhận nhầm là đang chạy và các lượt nạp tin Zalo sẽ bỏ qua âm thầm cho tới khi có người gỡ khoá.
  Căn cứ: Hiếm gặp, không mất dữ liệu, người vận hành gỡ khoá bằng tay được ngay, nhưng việc nạp tin bị đứng mà không có báo lỗi.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: known-limits

- **Trần tổng của lượt nhanh ngắn hơn trần nạp, tồn đọng trên 20 phút không tiến được**
  Người dùng thấy gì: Khi có tồn đọng lớn sau một đợt đứt thu, các lượt nạp nhanh ban ngày cứ nạp lại cùng đoạn đầu và không bao giờ tiến tới bước xử lý; chỉ lượt nửa đêm mới gỡ được tồn đọng.
  Căn cứ: Không mất dữ liệu và tự hết sau lượt 00:00, nhưng tin mới chậm lên màn cả ngày khi có tồn đọng; sửa là việc riêng nhỏ.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Dưới launchd đồng hồ tự chết vì TERM cả nhóm, không còn SIGKILL sau ân hạn**
  Người dùng thấy gì: Nếu một bước nạp bị treo và không chịu dừng khi bị yêu cầu, lượt sẽ kết thúc nhưng bước treo vẫn sống và có thể chạy chồng lên lượt sau.
  Căn cứ: Chỉ xảy ra khi bước con phớt lờ tín hiệu dừng, không làm sai dữ liệu đã nạp, và có thể dọn bằng tay; nhưng khó phát hiện nên đáng một việc riêng.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Lệnh kiểm sau áp tìm dấu DO_KILL đã không còn trong script**
  Người dùng thấy gì: Bước kiểm tiến trình đồng hồ sót trong hướng dẫn áp lên máy thu có thể báo lệch giả hoặc không thấy đồng hồ sót thật, làm người áp bối rối.
  Căn cứ: Chỉ là bước kiểm phụ trong tài liệu, không ảnh hưởng dữ liệu, sửa một dòng hướng dẫn là xong.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: medium
  Đề xuất: known-limits

- **do-luot-dem.sh chấm nhầm lượt trước khi lượt đêm nay dừng sớm**
  Người dùng thấy gì: Công cụ đo thời lượng lượt đêm có thể báo ĐẠT bằng số của đêm trước khi lượt đêm nay dừng sớm vì lỗi.
  Căn cứ: Chỉ làm số đo sau áp lạc quan trong ca hiếm, người đọc log vẫn thấy lỗi thật, không mất dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **Lượt nhanh bị trần tổng 20′ cắt trước trần nạp 30′ nên state không tiến, tồn đọng nạp lại từ đầu mỗi lượt**
  Người dùng thấy gì: Khi tồn đọng quá 20 phút, các lượt nhanh ban ngày lặp lại cùng đoạn và không tiến; chỉ lượt nửa đêm rút được tồn đọng.
  Căn cứ: Không mất dữ liệu và tự hết sau lượt 00:00, nhưng tin chậm lên màn khi có tồn đọng; trước nhánh này lượt nhanh không bị kẹt như vậy.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Vòng hồ sơ báo TIMEOUT 124 giả khi không còn hồ sơ nào chờ nạp**
  Người dùng thấy gì: Lượt nạp có thể báo lỗi hết thời gian và ghi lỗi dù không còn hồ sơ nào bị hoãn, gây cảnh báo giả.
  Căn cứ: Ca hiếm (đúng lúc vượt mốc), dữ liệu không mất, lượt sau chạy lại bình thường; chỉ gây nhiễu báo lỗi.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **do-luot-dem.sh kết luận ĐẠT bằng số của lượt cũ khi lượt đêm mới thoát sớm**
  Người dùng thấy gì: Công cụ đo có thể báo ĐẠT cho một đêm mà lượt nạp hỏng sớm, vì đang đọc số của lượt cũ.
  Căn cứ: Chỉ làm bước kiểm sau áp lạc quan trong ca hiếm; lỗi thật vẫn hiện trong log, không ảnh hưởng dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **Lệnh kiểm đồng hồ sót trong README tìm dấu không tồn tại và tự khớp chính nó**
  Người dùng thấy gì: Bước kiểm đồng hồ sót trong hướng dẫn áp báo sai: có thể báo lệch dù máy sạch, hoặc không thấy đồng hồ sót thật.
  Căn cứ: Chỉ là tài liệu hướng dẫn, không đụng dữ liệu, sửa một dòng là xong.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: log mẫu của do-luot-dem không round-trip từ script thật, che lỗi chấm sai lượt bị cắt ở phần nạp**
  Người dùng thấy gì: Công cụ đo thời lượng lượt đêm có thể báo ĐẠT sai đúng ở ca sự cố 5 giờ 38 khi lượt bị cắt ở phần nạp, vì log mẫu không giống log thật.
  Căn cứ: Chỉ làm bước kiểm sau áp kém tin cậy ở một số ca cắt, không mất dữ liệu; người đọc log vẫn thấy dòng cắt.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: lệnh kiểm «còn đồng hồ» trong README tìm một dấu không còn tồn tại, không có đối chứng dương**
  Người dùng thấy gì: Trên máy thu sau áp, không có cách kiểm đáng tin xem còn đồng hồ mồ côi hay không, vì lệnh kiểm tìm sai dấu.
  Căn cứ: Việc kiểm trên máy thật đã có test phủ trước khi gộp, và đồng hồ sót chỉ là tiến trình phụ, không mất dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: high
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
