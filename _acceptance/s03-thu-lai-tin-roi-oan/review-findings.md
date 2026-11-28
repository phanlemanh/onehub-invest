# Review findings: s03-thu-lai-tin-roi-oan (round 3)

## Trong hợp đồng

- **Hình dạng 5: lời hứa nói cả lớp dạng AC-1 nhận thêm, nhưng test câu tìm AC-3 chỉ có vài câu lẻ, không phải ma trận đủ dạng**
  AC: AC-3
  file: `pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs:78`
  severity: high
  source: measurement
  detail: Luật bất biến khai trong transform-zalo.mjs: «dạng chữ nào mới nhận làm dấu hiệu BĐS (A) thì câu tìm viết bằng dạng ấy vẫn là Yêu cầu (F)». Contract AC-3 cũng viết «ma trận câu tìm dùng đúng các dạng AC-1 nhận thêm». Mảng TIM (dòng 78–96) chỉ là câu lẻ cho «1 ngủ», «Stu/stu», «2pn» và vài cụm xin hàng. Nó không duyệt DANG (9 dạng) cùng diện tích trần, nên số assert khác số phần tử của lớp. Chạy thử bằng đúng helper `doc` của test, nhóm «ca-hai», LUAT_PL43: «Tìm BE5 Stu full đồ 8tr», «Cần BE5 Stu full đồ 8tr», «Ai có BE5 Stu 8tr ko ạ», «kiếm BE5 Stu full 8tr» đều ra rent_lt/don-vi-gia; «Tìm BE5 Stu tầm 2.6 tỷ» ra sale; «Cần 55m full đồ 8tr», «Ai có 55m 8tr ko ạ» ra rent_lt. Cả bảy câu, với LUAT_TRUOC_PL43, đều ra kind null/bo. Nghĩa là luật mới biến câu tìm viết bằng dạng mới «BE5 Stu» và diện tích trần thành tin rao, đúng điều AC-3 hứa không xảy ra, mà test vẫn xanh vì ma trận không phủ hai dạng ấy. Đối chứng `khongCap` (dòng 104–107) cũng chỉ chạy trên cùng danh sách lẻ đó.
  rationale: AC-3 hứa câu tìm viết bằng đúng các dạng AC-1 nhận thêm vẫn là Yêu cầu; finding chỉ ra câu tìm dạng «BE5 Stu» và diện tích trần thành tin rao mà test không phủ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **suyLoai mặc định chạy luật PL43, còn parsePost/laYeuCau/coDauHieuBds mặc định chạy luật cũ: ai gọi theo mặc định sẽ nhận luật nửa cũ nửa mới**
  Người dùng thấy gì: Một vài thước đo nội bộ có thể đo bằng bộ luật lai, nên con số so sánh trước/sau của chúng chưa phản ánh đúng đường đọc thật. Tin rao thật vào kho không bị ảnh hưởng.
  Căn cứ: Chỉ lệch ở công cụ đo nội bộ, không làm mất hay sai tin của người dùng, và sửa sau vẫn rẻ.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thước PL9 (eval-classify, cách đọc `parser`) vẫn chấm parsePost luật cũ trên bài S03, không phải bộ đọc mà transform S03 đang chạy**
  Người dùng thấy gì: Số đo độ đúng giá của một thước chất lượng có thể không khớp bộ đọc đang sinh tin. Người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ ảnh hưởng một số đo nội bộ, không đụng dữ liệu hiển thị, nhẹ và sửa sau không đắt.
  file: `pipeline/lib/eval-classify.mjs`
  severity: low
  Đề xuất: known-limits

- **Hợp đồng `parse` của runTransformZalo đổi từ một đối số sang hai đối số; các thước cũ truyền parse một đối số sẽ âm thầm chạy với phần D tắt**
  Người dùng thấy gì: Một số bài kiểm so sánh hai lượt có thể lệch nhẹ về cách đọc giá. Hiện chưa gây đỏ hay sai dữ liệu.
  Căn cứ: Chưa có ca nào sai, chỉ là rủi ro về sau cho người viết test, sửa sau rẻ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Dòng transform-zalo.mjs trong pipeline/CLAUDE.md chưa cập nhật luật PL43 và tham số `luatPl43`**
  Người dùng thấy gì: Tài liệu hướng dẫn cho người làm sau chưa nhắc luật mới, nên họ dễ dùng nhầm mặc định. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là thiếu ghi chú, không mất hay lộ dữ liệu, bổ sung sau rất rẻ.
  file: `pipeline/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **Mặc định luật lệch nhau: suyLoai mặc định luật PL43, parsePost mặc định luật cũ, nên do-va-doc-tin.mjs đo một bộ luật lai (từ vòng 2, chưa sửa)**
  Người dùng thấy gì: Thước đo số tin mọc/nghỉ có thể báo xanh hoặc đỏ sai so với thực tế. Tin trên cổng không đổi.
  Căn cứ: Ảnh hưởng độ tin cậy của một phép đo nội bộ, không làm hỏng dữ liệu người dùng, sửa sau không đắt.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thước PL43: phanLuatCua quy phần luật bằng mục đích nhóm khác với transform; khối «trước (luật cũ)» đếm nhánh Yêu cầu bằng luật mới**
  Người dùng thấy gì: Bảng đếm tin mới theo từng phần luật và mẫu chấm tay có thể lẫn vài tin vào nhầm phần. Tin vào kho không đổi.
  Căn cứ: Chỉ làm lệch số thống kê và mẫu chấm, người chấm vẫn soát từng tin nên bắt được, sửa sau không đắt.
  file: `pipeline/scripts/do-tin-roi-oan.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép đếm «nguồn độc lập thứ hai» của test DF6 gọi parsePost/laYeuCau luật cũ, trong khi nhanh-bai-s03 nay dùng LUAT_PL43**
  Người dùng thấy gì: Một bài kiểm đối chiếu độc lập có thể không bắt được lỗi nếu luật nhánh Yêu cầu hỏng sau này. Hiện vẫn xanh đúng.
  Căn cứ: Chỉ làm yếu lưới an toàn của test, không sai dữ liệu hiện tại, sửa sau rẻ.
  file: `app/tests/data-flow-bai-chi-anh.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: phanLuatCua được test bằng mục đích nhóm «ca-hai» viết tay, không phải giá trị thật mà bên gọi tính ra**
  Người dùng thấy gì: Mẫu 10 tin cần người chấm có thể lẫn vài tin không thuộc đúng phần luật. Người chấm vẫn đọc từng tin nên khó lọt sai.
  Căn cứ: Rủi ro nhỏ lên chất lượng mẫu chấm, không mất dữ liệu, sửa sau không đắt.
  file: `pipeline/scripts/do-tin-roi-oan.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1: helper `doc` trả giá của parsePost trước khi suyLoai sửa, không phải giá mà transform ghi ra**
  Người dùng thấy gì: Một số kiểm tra giá trong test đo ở bước giữa chứ không phải giá cuối trên tin. Hiện giá vẫn đúng.
  Căn cứ: Chưa gây sai tin nào, chỉ giảm độ chặt của test, sửa sau rẻ.
  file: `pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
