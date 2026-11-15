# Review findings: du-an-cua-tin-len-dinh-vi (round 4)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E8-network.txt không chứa dữ liệu mạng: lệnh thu bị lỗi «Unknown command: network» nhưng vẫn được lưu làm bằng chứng**
  Người dùng thấy gì: Tệp bằng chứng về lỗi mạng của trang Dòng chảy dữ liệu bị rỗng, nên chưa chứng minh được trang tải không có phản hồi lỗi. Người dùng không thấy khác biệt trên màn hình.
  Căn cứ: Chỉ ảnh hưởng độ chắc của hồ sơ nghiệm thu, không ảnh hưởng dữ liệu hay màn hình của người dùng, và chạy lại bộ thu là bù được, nên ghi lại là đủ.
  file: `_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-network.txt`
  severity: medium
  Đề xuất: known-limits

- **Ảnh E8-step1/step2 cuộn ngang làm mất cột Nguồn, không đọc được ô Định vị nào là của S03, S06 như bước eval yêu cầu**
  Người dùng thấy gì: Ảnh chụp màn hình Chất lượng từng chặng bị cắt mất cột tên nguồn, nên người ký phải suy từ thứ tự dòng để biết số nào của nguồn nào. Màn hình thật không bị lỗi.
  Căn cứ: Chỉ làm người ký khó đối chiếu hơn, số liệu đúng đã được kiểm ở bước khác, và chụp lại ảnh rẻ nên không cần chặn.
  file: `_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-step1.png`
  severity: medium
  Đề xuất: known-limits

- **Bằng chứng mạng E8 hỏng âm thầm: lệnh `playwright-cli network` không tồn tại, lỗi bị ghi vào tệp như thể là dữ liệu**
  Người dùng thấy gì: Bộ thu bằng chứng ghi nhầm trang hướng dẫn thay cho dữ liệu mạng mà không báo lỗi, nên hồ sơ có thể làm người đọc tưởng đã kiểm mạng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Rủi ro chỉ là hồ sơ nghiệm thu nói quá điều đã kiểm, không làm mất hay lộ dữ liệu, và thu lại bằng chứng là xong.
  file: `_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-network.txt`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: offer_project trong lược đồ tạm là bảng tám cột gõ tay (r3)**
  Người dùng thấy gì: Một số bài test của màn dòng chảy dùng bảng mẫu tự gõ tay thay cho bảng thật. Nếu sau này cấu trúc bảng thật đổi, các test ấy vẫn báo xanh dù màn hình có thể đã lệch.
  Căn cứ: Chỉ làm test kém nhạy chứ không làm người dùng thấy số sai hôm nay, và bài kiểm trên dữ liệu thật vẫn bắt được lệch; ghi lại là đủ.
  file: `app/tests/ops-dong-chay-fixture.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: DV7-AC-10a grep chữ trong sao-luu.sh, kiem-sau.sql, README mà không chạy (r3)**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận các tệp sao lưu và kiểm sau có chứa đúng chữ cần thiết, chứ chưa chạy thử chúng. Nếu một câu trong tệp kiểm sau viết sai, người áp lên máy thu chỉ phát hiện lúc chạy thật.
  Căn cứ: Hậu quả nhẹ vì lỗi nếu có sẽ lộ ngay khi người ký chạy lệnh kiểm sau, không mất dữ liệu, và có thể sửa rồi chạy lại.
  file: `pipeline/tests/offer-project-lui.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính đứng một mình: data_level_units không chứa 'offer_located(' (r3)**
  Người dùng thấy gì: Bài kiểm xác nhận rằng cách tính bậc dữ liệu không gọi từng tin một chỉ bằng việc không thấy một cái tên trong mã. Nếu về sau có người viết lại theo kiểu chậm bằng tên khác, bài kiểm vẫn xanh và việc tính bậc có thể chậm đi mà không ai báo.
  Căn cứ: Số liệu người dùng thấy vẫn đúng, chỉ có nguy cơ chậm đi về sau, và một bài đo thời gian riêng đã canh giới hạn tốc độ nên ghi lại là đủ.
  file: `pipeline/tests/offer-project.itest.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-network.txt, _acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-step1.png) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
