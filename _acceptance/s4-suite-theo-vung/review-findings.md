# Review findings: s4-suite-theo-vung (round 4)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mục vùng "app/probes" (đường thư mục trần) là mục chết — chú thích kèm nó khẳng định sai là cần**
  Người dùng thấy gì: Bảng vùng có một dòng thừa không tác dụng và lời chú thích sai, chỉ gây hiểu lầm cho người sửa bảng sau này; lượt chấm vẫn chạy đúng suite.
  Căn cứ: Không ảnh hưởng kết quả chấm của ai, chỉ là dòng thừa trong cấu hình; sửa sau rẻ nhưng không đáng mở việc riêng.
  file: `scripts/suite-neu-doi.mjs`
  severity: low
  Đề xuất: wont-fix

- **Phép thay đường tương đối khi chép .next/types chỉ bắt đúng hai cấp «../../» — tệp lồng sâu giữ độ sâu sai mà script vẫn báo thành công**
  Người dùng thấy gì: Khi dựng worktree chấm theo nhánh dự phòng, một số tệp kiểu có thể trỏ sai chỗ mà script vẫn báo thành công; lỗi chỉ lộ ra sau đó ở bước kiểm kiểu với thông báo khó hiểu.
  Căn cứ: Chỉ gặp ở nhánh dự phòng hiếm và người chấm tự dựng lại worktree được; lỗi lộ ra chứ không làm sai dữ liệu, nên ghi hạn chế đã biết.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **Lời hứa E3 trong evals.yaml lệch số ô với thước thật (24 vs 28) và lệch cả với chú thích trong config.yaml (18)**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi số ô kiểm khác với số thực chạy, người chấm vòng sau có thể hiểu nhầm phạm vi kiểm; chức năng không bị ảnh hưởng.
  Căn cứ: Chỉ là con số ghi sai trong tài liệu, không mất hay lộ dữ liệu; sửa lại bất cứ lúc nào ở vòng sau.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **git ls-files bị nuốt stderr: .worktreeinclude hỏng hay git lỗi cho danh sách rỗng, bước chép .env im lặng bỏ qua và script vẫn thoát 0**
  Người dùng thấy gì: Nếu danh sách tệp cần chép hỏng, worktree chấm có thể thiếu .env mà script vẫn báo xong, làm lượt chấm hỏng giả khó đoán nguyên nhân.
  Căn cứ: Chỉ xảy ra khi cấu hình hỏng, hiếm; hậu quả là lượt chấm đỏ giả, không mất dữ liệu, người dùng dựng lại worktree là xong.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **Bước chép .env không báo lỗi khi cp thất bại — không dòng in, không cờ, vẫn exit 0**
  Người dùng thấy gì: Nếu chép tệp môi trường thất bại giữa chừng, worktree thiếu .env nhưng lượt dựng vẫn được coi là thành công.
  Căn cứ: Ca lỗi quyền hoặc tệp biến mất hiếm gặp, hậu quả chỉ là lượt chấm đỏ giả và dựng lại được; không đụng dữ liệu thật.
  file: `scripts/dung-worktree-cham.sh`
  severity: low
  Đề xuất: known-limits

- **Vòng so lệnh trong probe không chốt vế gốc khác rỗng — khoá vắng ở cả hai phía cho "" = "" và probe xanh**
  Người dùng thấy gì: Phép kiểm cấu hình có thể báo xanh cho một lệnh cũ thực ra không còn tồn tại, nên một sửa đổi trong tương lai có thể lọt mà không ai thấy.
  Căn cứ: Hiện cấu hình đúng, rủi ro chỉ khi hàng sau gỡ hoặc đổi tên khoá; hậu quả nhẹ và vá sau rẻ.
  file: `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
  severity: low
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc — chiều đỏ của probe E6 dùng diff giả gõ tay, không rút từ config.yaml thật**
  Người dùng thấy gì: Phép tự kiểm của probe dùng dữ liệu gõ tay nên không chứng minh bắt được việc ai đó đổi lệnh thật; nó vẫn xanh khi lệnh thật đã khác.
  Căn cứ: Bản test chính đã đo trên cấu hình thật nên rủi ro bị che phần lớn; chỉ là lớp bảo vệ thứ hai yếu hơn mong muốn, sửa sau rẻ.
  file: `_acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E3 còn ghi «6 suite = 24 ô» trong khi thước đo 7 suite = 28 assert (r3 · tệp đã đổi)**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi sai số ô kiểm (24 thay vì 28), người chấm đọc có thể bối rối nhưng công cụ chạy đúng.
  Căn cứ: Chỉ là chữ trong hồ sơ, không ảnh hưởng người dùng, sửa một dòng lúc nào cũng được.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Test AC-7 không rửa DUNG_WT_CHINH khỏi môi trường thừa kế — có thể chạy vào checkout chính thật (r3)**
  Người dùng thấy gì: Nếu máy chấm tình cờ có sẵn một biến môi trường riêng, bài kiểm có thể chạy trên thư mục thật thay vì thư mục thử và báo đỏ khó hiểu.
  Căn cứ: Chỉ xảy ra khi môi trường bất thường, hậu quả là kết quả kiểm sai chứ không mất dữ liệu, chạy lại trong môi trường sạch là hết.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **quetNgoai đọc mọi đường của git ls-files mà không chắn ENOENT — lệch mẫu matGiuaChung có sẵn trong scripts/ (r3 · tệp đã đổi)**
  Người dùng thấy gì: Khi có tệp bị xoá trên đĩa mà chưa commit, bài kiểm vùng phủ sẽ báo lỗi khó hiểu thay vì nói rõ nguyên nhân.
  Căn cứ: Chỉ làm đỏ giả tạm thời ở máy đang làm dở, commit hoặc khôi phục tệp là hết, không mất dữ liệu.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **NGOAI_LE của AC-5 ghim vào chuỗi trong chú thích của module khác — làm job scripts của CI đỏ theo PR không liên quan (r3 · tệp đã đổi)**
  Người dùng thấy gì: Sửa một dòng chú thích ở nơi khác có thể làm kiểm tự động đỏ, khiến người làm mất thời gian dò nguyên nhân.
  Căn cứ: Gây phiền cho người làm chứ không ảnh hưởng người dùng cuối, và tự sửa được ngay bằng cập nhật danh sách ngoại lệ.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **dung-worktree-cham.sh nuốt cờ sai vị trí hoặc gõ nhầm mà vẫn chạy tiếp (r3)**
  Người dùng thấy gì: Gõ sai tên cờ thì lệnh dựng vẫn chạy bước kiểm kiểu tốn vài phút thay vì báo lỗi ngay.
  Căn cứ: Chỉ tốn thời gian, không mất dữ liệu, người dùng gõ lại đúng là xong.
  file: `scripts/dung-worktree-cham.sh`
  severity: low
  Đề xuất: known-limits

- **dung-worktree-cham nối nhầm node_modules của thư mục sinh app/.next sang checkout chính (r3)**
  Người dùng thấy gì: Sau khi đã dựng app trong thư mục chấm, chạy lại lệnh dựng có thể nối nhầm thư mục sinh sang checkout chính, làm kết quả kiểm kiểu lẫn sản phẩm dựng của nhánh khác.
  Căn cứ: Chỉ ảnh hưởng độ chính xác lượt chấm, xoá thư mục sinh rồi dựng lại là hết, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **next typegen lỗi bị nuốt hoàn toàn rồi âm thầm rơi về .next/types cũ, vẫn in «sinh … (next typegen)» (r3)**
  Người dùng thấy gì: Khi bước sinh kiểu hỏng, lệnh vẫn báo thành công và có thể dùng kiểu cũ, nên kiểm kiểu có thể xanh hoặc đỏ sai.
  Căn cứ: Chỉ làm sai kết quả chấm, chạy lại sau khi sửa môi trường là đúng, không mất dữ liệu.
  file: `scripts/dung-worktree-cham.sh`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml E3 expected còn «6 suite = 24 ô» trong khi thước đã là 7 suite / 28 assert (r3 · tệp đã đổi)**
  Người dùng thấy gì: Hồ sơ nghiệm thu còn ghi số cũ sáu suite ở vài chỗ, dễ gây hiểu nhầm cho người đọc.
  Căn cứ: Chỉ là chữ trong tài liệu, không ảnh hưởng người dùng, sửa nhanh lúc nào cũng được.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Phép quét canh phủ AC-5 bỏ im lặng mọi import không đuôi và alias @/ — lưới thưa hơn lời AC-5 (r3 · tệp đã đổi)**
  Người dùng thấy gì: Một tham chiếu viết kiểu rút gọn từ module này sang module khác có thể lọt khỏi phép kiểm vùng phủ, khiến lượt chấm bỏ sót suite.
  Căn cứ: Hôm nay chưa có ca nào vỡ và CI vẫn chạy đủ suite làm lưới đỡ, nên rủi ro thấp.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA — S4V-AC-6 đọc config.yaml bằng regex riêng, không bằng bộ đọc mà làn ghim lại dùng (r3 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó dời khối cấu hình sai chỗ, bài kiểm vẫn xanh nhưng bước ghim lại sẽ hỏng, chỉ lộ ra khi chạy thật.
  Căn cứ: Chỉ xảy ra khi có người sửa cấu hình sai và sẽ lộ ngay ở lần ghim kế tiếp, sửa lại là xong.
  file: `scripts/suite-neu-doi.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc — fake `next typegen` chỉ sinh đúng dạng mà perl rewrite mong đợi (r3)**
  Người dùng thấy gì: Bài kiểm dựng worktree dùng dữ liệu giả quá khớp nên có thể không bắt được lỗi với kiểu thật.
  Căn cứ: Chỉ làm bài kiểm kém sắc, lỗi nếu có sẽ lộ ở lượt chấm thật và chạy lại được.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình — vế «chạy lại không đổi gì» chỉ là doesNotMatch ba từ chưa bao giờ được ghim dương (r3)**
  Người dùng thấy gì: Bài kiểm vế chạy lại không đổi gì khá yếu nên có thể xanh dù thông điệp thay đổi.
  Căn cứ: Chỉ giảm độ tin cậy của bài kiểm, không ảnh hưởng người dùng và củng cố sau cũng được.
  file: `scripts/dung-worktree-cham.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ma trận viết-trước khai sai số ô — eval nói 24 assert, mã chốt 28, chú thích config nói 18 (r3 · tệp đã đổi)**
  Người dùng thấy gì: Ba tài liệu ghi ba con số khác nhau cho cùng một ma trận kiểm, dễ làm người đọc nghi ngờ.
  Căn cứ: Chỉ là chữ trong hồ sơ, không ảnh hưởng người dùng, sửa nhanh bất cứ lúc nào.
  file: `_acceptance/s4-suite-theo-vung/evals.yaml`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 3/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s4-suite-theo-vung/evals.yaml, _acceptance/s4-suite-theo-vung/probes/cau-hinh-khong-doi.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
