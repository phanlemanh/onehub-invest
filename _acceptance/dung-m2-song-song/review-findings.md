# Review findings: dung-m2-song-song (round 2)

## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E10: câu 'expected' vẫn nói 'trên hai tệp' trong khi inputs đã thêm contract.md làm tệp thứ ba**
  Người dùng thấy gì: Một câu mô tả kết quả mong đợi trong bộ kiểm tra vẫn ghi hai tệp trong khi thực tế đối chiếu ba tệp. Người dùng cuối không thấy gì, tính năng chạy đúng; chỉ có nguy cơ người chấm đọc nhầm đề bài.
  Căn cứ: Hậu quả nhẹ: chỉ là một câu ghi chú cũ, không mất hay lộ dữ liệu, không ảnh hưởng người dùng, và có thể sửa lại bất cứ lúc nào với chi phí rất thấp nên ghi nhận rồi ship như hiện tại.
  file: `_acceptance/dung-m2-song-song/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Test M2-AC-10 so diff config.yaml với merge-base origin/main: đỏ vĩnh viễn sau khi merge, và đỏ trên mọi nhánh sau có sửa config.yaml (r1)**
  Người dùng thấy gì: Sau khi gộp vào nhánh chính, một phép kiểm trong bộ kiểm bền sẽ báo đỏ dù không có lỗi thật, và nhánh sau nào thêm bước kiểm vào cấu hình cũng bị đỏ theo. Người làm các vòng sau sẽ mất công truy tìm một cảnh báo giả.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ gây đỏ giả cho người phát triển; sửa rẻ nhưng đổi cách đo mà hợp đồng đã viết nên cần một việc riêng.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **Câu hỏi judgment E10 xếp ví dụ c-* vào bậc 3, ngược với SKILL.md, hợp đồng AC-5 và registry (bậc 2, template) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một câu hỏi dùng để chấm luật thiết kế ghi sai bậc của các ví dụ mẫu, nên người chấm có thể chấm sai một tài liệu đúng. Sản phẩm giao cho người làm giao diện không bị ảnh hưởng.
  Căn cứ: Chỉ làm lệch một lần chấm nội bộ, người chấm đọc lại là thấy; không mất dữ liệu và không chạm người dùng cuối.
  file: `_acceptance/dung-m2-song-song/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Test M2-AC-10 so diff config.yaml với merge-base origin/main sẽ đỏ vĩnh viễn ngay sau khi merge (r1)**
  Người dùng thấy gì: Ngay sau khi gộp, bộ kiểm của công cụ thiết kế sẽ đỏ vì một phép đo chỉ đúng trên nhánh làm việc. Mọi lần chạy lại về sau đều mang cảnh báo giả này.
  Căn cứ: Đây là đỏ giả gây nhiễu cho người phát triển, không hại người dùng cuối; sửa rẻ nhưng phải đổi cách đo mà hợp đồng đã chốt nên tách thành việc riêng.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Test registry/tokens ghim số đếm của nguồn đang sống, nên đỏ ngay khi làm theo luật mới thêm vào SKILL.md (r1)**
  Người dùng thấy gì: Khi ai đó thêm một thành phần mới vào danh mục hoặc một màu mới vào bảng màu, bộ kiểm sẽ báo đỏ dù công cụ vẫn chạy đúng. Người làm phải cập nhật các con số cho khớp.
  Căn cứ: Chỉ là việc cập nhật số khi nguồn đổi, không mất dữ liệu và người làm thấy ngay nguyên nhân; chấp nhận như hiện tại là hợp lý.
  file: `scripts/design-floor/gen-registry.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **gen-tokens bỏ lặng một số khai báo, trái với cam kết 'không khai báo nào bị bỏ lặng' (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này bảng màu được viết theo một vài kiểu hợp lệ nhưng hiếm, công cụ sinh bảng màu có thể bỏ sót một giá trị mà không báo lỗi. Hiện tại bảng màu không dùng các kiểu đó.
  Căn cứ: Chưa có tác động nào ở hiện trạng và chỉ xảy ra nếu bảng màu đổi cách viết; ghi lại là đủ, sẽ tính tới khi bật chế độ chính thức.
  file: `scripts/design-floor/gen-tokens.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (quét LỚP nhưng chỉ có điểm-case): AC-5 chỉ chặn sàn `seen >= 46`, không ghim tổng số mã block viết trước (r1)**
  Người dùng thấy gì: Bộ kiểm có thể không phát hiện nếu một mẫu giao diện bị rơi khỏi danh mục do viết sai định dạng. Hiện danh mục đang đủ.
  Căn cứ: Rủi ro chỉ là bỏ sót một mẫu trong danh mục nội bộ, người làm giao diện tra lại là thấy; không mất dữ liệu.
  file: `scripts/design-floor/gen-registry.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (quét LỚP nhưng chỉ có điểm-case): `description = ô File` của AC-5 chỉ kiểm 3 bản ghi viết tay (r1)**
  Người dùng thấy gì: Phần mô tả của đa số mẫu trong danh mục chưa được bộ kiểm đối chiếu từng cái. Nếu có mô tả lấy nhầm cột thì sẽ không bị phát hiện tự động.
  Căn cứ: Hậu quả nhẹ là mô tả sai chữ trong danh mục nội bộ, tự sửa được khi phát hiện; không chạm người dùng cuối.
  file: `scripts/design-floor/gen-registry.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (quét LỚP nhưng chỉ có điểm-case): `variants` của 'mọi cva' chỉ đối chiếu 4/17 thành phần (r1)**
  Người dùng thấy gì: Danh sách biến thể (kiểu, cỡ) của phần lớn thành phần chưa được bộ kiểm đối chiếu độc lập. Nếu có sai lệch thì sẽ chỉ lộ ra khi ai đó dùng thử.
  Căn cứ: Sai lệch nếu có chỉ làm kế hoạch dùng lại bị từ chối nhầm hoặc cho qua nhầm ở bước nội bộ, dễ phát hiện và sửa.
  file: `scripts/design-floor/gen-registry.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): «bộ đọc cva bỏ qua variants ngoài lời gọi cva» không có đối chứng dương trên cùng fixture (r1)**
  Người dùng thấy gì: Một phép kiểm có thể xanh một cách tầm thường nên không chứng minh được công cụ bỏ qua đúng các khai báo biến thể không thuộc thành phần. Công cụ hiện chạy đúng trên dữ liệu thật.
  Căn cứ: Chỉ làm giảm độ tin cậy của bộ kiểm nội bộ; không có lỗi nhìn thấy được và người phát triển tự bổ sung được.
  file: `scripts/design-floor/gen-registry.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo checkout/trạng thái git của tác giả thay vì cây đang kiểm): M2-AC-10 diff theo `merge-base HEAD origin/main` (r1)**
  Người dùng thấy gì: Một phép kiểm phụ thuộc vào việc máy đã tải đủ lịch sử nhánh chính hay chưa, nên có thể đỏ trên bản tải nông hoặc sau khi gộp. Kết quả đổi theo máy chứ không theo mã.
  Căn cứ: Gây đỏ giả cho người phát triển và CI chứ không hại người dùng cuối; tự khỏi khi tải đủ lịch sử nhưng sẽ lặp lại, nên đáng xử lý trong một việc riêng.
  file: `scripts/design-floor/fresh.test.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (quét LỚP nhưng chỉ có điểm-case): giá trị nguyên văn của 9 khai báo @theme riêng không có ma trận (r1)**
  Người dùng thấy gì: Giá trị của chín cỡ bo góc và phông chữ riêng chỉ được kiểm tên, chưa kiểm từng giá trị. Nếu chép sai thì bộ kiểm sẽ không báo.
  Căn cứ: Rủi ro thấp vì các giá trị này đã khớp nguồn hiện tại và sai lệch nếu có sẽ thấy ngay trên giao diện, sửa lại được.
  file: `scripts/design-floor/gen-tokens.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): AC-9 hứa «buộc» nhưng chỉ đo chữ trong SKILL.md/loop.md (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hiện luật dùng lại thành phần chỉ được viết thành hướng dẫn cho người làm giao diện, chưa có cơ chế máy chặn khi họ bỏ qua. Việc chặn thật sẽ đến khi bật bậc sau.
  Căn cứ: Người làm vẫn thấy luật và không mất dữ liệu nào; việc chặn tự động nằm trong lộ trình bật M2 nên ghi nhận như giới hạn hiện tại là đủ.
  file: `_acceptance/dung-m2-song-song/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
