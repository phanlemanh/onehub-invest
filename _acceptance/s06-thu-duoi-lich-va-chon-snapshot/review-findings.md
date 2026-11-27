# Review findings: s06-thu-duoi-lich-va-chon-snapshot (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dấu nhận ca của đột biến bo-kiem-pid-song khớp hai ca test, một ca thuộc nhánh khác**
  Người dùng thấy gì: Phép thử kiểm tra việc bỏ kiểm tiến trình cũ còn sống có thể báo đã bắt được lỗi trong khi thực ra chỉ một ca khác đỏ. Hành vi của bộ thu không bị ảnh hưởng, chỉ là bằng chứng chấm lỏng hơn mức hứa.
  Căn cứ: Nhẹ với người dùng vì chỉ làm bằng chứng nghiệm thu lỏng hơn, không làm mất hay lộ dữ liệu; người chấm đọc tên ca là thấy, và sửa sau vẫn rẻ.
  file: `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Dấu của bo-kiem-pid-song khớp cả ca «ĐANG trong khoảng nghỉ», ca này không dựng nhánh pid còn sống**
  Người dùng thấy gì: Phép thử đột biến có thể báo xanh dù ca đúng nhánh khoá bận không phải ca làm đỏ. Người dùng không thấy khác biệt vì hành vi thu vẫn đúng.
  Căn cứ: Nhẹ vì chỉ ảnh hưởng độ tin của bằng chứng nghiệm thu, không ảnh hưởng dữ liệu hay lịch thu; trùng với lỗi đã nêu nên ghi một lần là đủ.
  file: `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Vòng 1 chọn-nạp giả định tin hanoi (snapshot thứ 5, 6) không trùng list_id với S2 nhưng không kiểm**
  Người dùng thấy gì: Nếu sau này đổi bộ dữ liệu đo, phép thử có thể báo lỗi nạp giả trong khi mã nạp không sai. Hiện tại không ảnh hưởng kết quả.
  Căn cứ: Nhẹ vì chỉ gây báo đỏ giả khi đổi dữ liệu đo, người chấm thử lại là thấy, không mất hay lộ dữ liệu thật.
  file: `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Shape 4 (negative-only assertion): the marker self-check in dot-bien.mjs only checks that a fake marker matches 0 cases. Nothing checks that each real marker matches exactly the intended case.**
  Người dùng thấy gì: Phép tự kiểm của công cụ chấm chỉ biết dấu giả không khớp gì, chưa chắc dấu thật khớp đúng một ca. Người dùng không bị ảnh hưởng trực tiếp.
  Căn cứ: Nhẹ vì chỉ làm bằng chứng nghiệm thu thiếu một lớp chặt, hành vi thật đã đúng và có thể bổ sung sau với chi phí thấp.
  file: `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Test e2e chọn-nạp rơi về Postgres chung :5433 khi thiếu TEST_DATABASE_URL_ADMIN; ca đầu không có nhánh bỏ qua (r1)**
  Người dùng thấy gì: Nếu chạy bài kiểm tra này sai cách, nó có thể tạo rồi xoá cơ sở dữ liệu tạm ngay trên kho dữ liệu chung của máy thu, thay vì một kho riêng. Thiếu kho thì bài kiểm tra báo đỏ chứ không bỏ qua.
  Căn cứ: Chỉ ảnh hưởng người chạy test, chỉ chạm cơ sở dữ liệu tạm đặt tên riêng chứ không đụng dữ liệu thật, và chạy lại là xong.
  file: `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test e2e ghi thư mục tạm vào trong cây kho (pipeline/.e2e-root*), không được gitignore (r1)**
  Người dùng thấy gì: Nếu lượt chạy bài kiểm tra bị ngắt giữa chừng, vài thư mục tạm có thể sót lại trong kho và làm lẫn danh sách tệp chưa theo dõi.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu, người dùng tự xoá được và chỉ xảy ra khi test bị giết.
  file: `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Chú thích plist nói vòng chồng bị flock chặn, nhưng wrapper dùng khoá mkdir (r1)**
  Người dùng thấy gì: Một dòng ghi chú trong tệp lịch mô tả sai cách hệ thống chống chạy chồng, có thể làm người đổi nhịp hiểu nhầm.
  Căn cứ: Chỉ là chữ ghi chú, hành vi thật vẫn đúng, sửa sau rẻ và không ảnh hưởng người dùng cuối.
  file: `pipeline/cron/com.oneinvest.thu-duoi-s06.plist`
  severity: low
  Đề xuất: wont-fix

- **Chú thích executor và probe phạm vi ghi số không khớp mã (r1)**
  Người dùng thấy gì: Các con số ghi trong chú thích về số ca kiểm tra và số tệp được phép đổi không khớp thực tế, nên người chấm có thể đối chiếu lệch.
  Căn cứ: Chỉ sai chữ trong hồ sơ, không đổi hành vi hay dữ liệu, người ký nhìn lại là phát hiện được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Wrapper treats airbnb_snapshots as the durable 'already loaded' log, but import-chotot writes that row BEFORE the stg upserts and outside any transaction, so an import that fails partway is never retried (r1)**
  Người dùng thấy gì: Nếu việc nạp tin rao đứt giữa chừng, phần tin chưa nạp sẽ không được thử lại ở vòng sau và chỉ quay lại khi có lượt quét đủ hằng ngày.
  Căn cứ: Tin vẫn được bổ sung lại sau một ngày bởi lượt quét đủ nên chỉ chậm chứ không mất hẳn, và chỉ xảy ra khi nạp bị đứt giữa chừng.
  file: `scripts/thu-duoi-s06.sh`
  severity: medium
  Đề xuất: known-limits

- **A snapshot that can never be loaded is picked again every round and blocks every older unloaded snapshot of that city (r1)**
  Người dùng thấy gì: Một bản thu hỏng không nạp được sẽ bị chọn lại mỗi 5 phút, báo lỗi mãi và chặn các bản thu cũ hơn của cùng thành phố, nên tin của thành phố đó có thể ngừng cập nhật.
  Căn cứ: Gây kẹt lặp lại và làm chậm dữ liệu một thành phố cho tới khi có người dọn bản hỏng, nhưng không mất dữ liệu và sửa là một việc riêng.
  file: `scripts/thu-duoi-s06.sh`
  severity: medium
  Đề xuất: new-contract

- **The lock can be stolen while it is being taken: a new run removes the lock of a run that is still alive (r1)**
  Người dùng thấy gì: Nếu hai lượt chạy tay và chạy theo lịch trùng đúng một khoảnh khắc, cả hai có thể cùng thu và nạp cùng lúc.
  Căn cứ: Khe hở rất hẹp, chủ yếu khi chạy tay trùng lịch, nạp trùng không làm mất dữ liệu và chạy lại được, nên chi phí sửa lớn hơn hậu quả.
  file: `scripts/thu-duoi-s06.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca 'khuôn plist không đè ba giá trị' grep khuôn mẫu, không soát plist đã cài (r1)**
  Người dùng thấy gì: Bài kiểm tra chỉ soát tệp mẫu chứ không soát tệp lịch thật sau khi cài, nên nếu bộ cài sau này tự thêm cấu hình ghi đè thì không bài nào báo.
  Căn cứ: Hiện chưa có ghi đè nào xảy ra và lịch chưa được cài, nên nguy cơ thấp; có thể ghi nhận rồi soát lại khi cài thật.
  file: `scripts/thu-duoi-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert sự có mặt trong khi lời hứa là quan hệ): 'catMoc: dưới trần → KHÔNG ghi lại file' chỉ soát danh sách tên tệp (r1)**
  Người dùng thấy gì: Bài kiểm tra chưa chứng minh chắc rằng danh sách mốc không bị ghi lại khi chưa vượt trần, nên nếu có ghi lại thì bài vẫn xanh.
  Căn cứ: Nếu ghi lại thừa thì chỉ tốn một lần ghi tệp, không mất dữ liệu, và có thể siết bài kiểm tra sau.
  file: `scripts/thu-duoi-s06.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
