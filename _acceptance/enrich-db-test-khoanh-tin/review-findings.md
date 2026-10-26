# Review findings: enrich-db-test-khoanh-tin (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **tam-lan.sh tính số lời gọi runEnrich ($so) nhưng không kiểm; vế mới của E2 (năm lượt dry bốc đúng tin của ca, bỏ UPDATE khoanh thì ca đỏ) không được probe đo**
  Người dùng thấy gì: Phép kiểm tự động chưa chứng minh được rằng bước kiểm tra phụ mới thêm vào bài test thật sự có mặt và biết báo đỏ. Người dùng sản phẩm không bị ảnh hưởng gì, chỉ là bằng chứng nghiệm thu yếu hơn lời mô tả.
  Căn cứ: Chỉ ảnh hưởng độ chắc của bằng chứng cho một bài test nội bộ, không mất hay lộ dữ liệu của người dùng, và nếu sau này bước kiểm phụ bị xoá mất thì người làm sẽ thấy ngay khi đọc lại bài test.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (khẳng định âm tính đứng một mình, không đối chứng dương, không ghim thông điệp): câu khẳng định dry mới của AC-6 chưa có phép đối chứng nào trong probe, dù evals.yaml E2 hứa có**
  Người dùng thấy gì: Chưa có phép thử máy móc cho thấy bước kiểm phụ trong bài test sẽ đỏ khi bị phá; việc thử đó mới chỉ ghi bằng chữ trong nhật ký. Người dùng sản phẩm không thấy khác biệt nào.
  Căn cứ: Hậu quả chỉ là bằng chứng nghiệm thu một bài test nội bộ kém chặt, không động đến dữ liệu hay tính năng người dùng, và đã có ghi chép tay về lần thử phá.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ kiểm điểm-case): probe in số khối runEnrich mà không so với số mong đợi, nên khối dry có biến mất thì probe vẫn qua**
  Người dùng thấy gì: Phép kiểm chỉ in ra số lời gọi mà không so với con số cần có, nên nếu một đoạn kiểm trong bài test bị xoá thì phép kiểm vẫn báo xanh. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Mức nhẹ, chỉ làm một phép kiểm nội bộ lỏng hơn lời mô tả, không ảnh hưởng người dùng và sửa không đáng công vì cùng khoảng hở đã được nêu ở hai điểm trên.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: low
  Đề xuất: wont-fix

- **Phép đếm 'tin hoan khac' của E2 lệch với luật chọn tin thật của selectOffers, nên lượt ghim lại có thể đỏ giả (r2 · tệp đã đổi)**
  Người dùng thấy gì: Khi ghim lại hồ sơ, phép kiểm đối chứng có thể báo đỏ nhầm trên một số dữ liệu đặc biệt, làm người kiểm mất công điều tra. Không ảnh hưởng gì đến tính năng người dùng.
  Căn cứ: Chỉ gây báo đỏ oan cho người kiểm, không làm lọt lỗi hay mất dữ liệu, và hiện dữ liệu thật chưa gặp tình huống này; chạy lại là rõ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

- **Chú thích đầu probe tam-lan.sh vẫn nói đối chứng với origin/main, trái với hành vi đã ghim 106cbd3 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một dòng ghi chú trong công cụ kiểm có thể khiến người đọc hiểu sai cách đối chứng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là ghi chú sai chữ, không đổi kết quả kiểm hay dữ liệu, sửa sau rất rẻ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: low
  Đề xuất: known-limits

- **tam-lan.sh đếm «tin hoãn khác» lỏng hơn hàng ưu tiên thật của selectOffers, nên đối chứng có thể đỏ oan (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm đối chứng có thể báo lỗi nhầm khi dữ liệu thử có tin thiếu nội dung. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ gây báo lỗi oan cho người kiểm, không làm mất hay lộ dữ liệu, và dữ liệu hiện tại chưa gặp tình huống này.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (bản chép tay theo khuôn bên đọc): cổng đối chứng của E2 đếm 'tin hoãn khác' bằng bản chép tay thiếu của CTE loose trong selectOffers, bỏ mất bộ lọc text (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm đối chứng dựa vào bản sao luật chọn tin có thể lệch khi luật gốc đổi, dẫn tới báo đỏ nhầm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm công cụ kiểm kém tin cậy ở một chiều (đỏ oan), không gây hỏng tính năng hay mất dữ liệu; có thể sửa khi ghim lại hồ sơ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (phép đo âm tính không đối chứng dương): khi DB không có tin hoãn khác, E2 vẫn đạt mà không có đối chứng nào chứng phép đo phân biệt được (r2 · tệp đã đổi)**
  Người dùng thấy gì: Trên cơ sở dữ liệu sạch, phép kiểm vẫn báo đạt dù không chứng minh được bản sửa tốt hơn bản cũ. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng yếu hơn trong tình huống hiếm, không gây lỗi cho người dùng; ghi lại là đủ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: low
  Đề xuất: known-limits

- **Phép đối chứng của E2 lấy origin/main động nên sẽ đỏ vĩnh viễn ngay khi nhánh được merge (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi bản sửa được merge, lần kiểm lại bằng chứng này sẽ báo đỏ dù test đã đúng, làm người nghiệm thu tưởng có lỗi.
  Căn cứ: Chỉ gây báo đỏ giả khi kiểm lại sau merge, không mất dữ liệu và không ảnh hưởng người dùng cuối; ghi chú để người nghiệm thu biết là đủ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

- **Probe mới lệch pattern probe có sẵn của kho: không nhận gốc kho qua "$PWD", thiếu pipefail, config thiếu dòng chú thích nhóm (r1)**
  Người dùng thấy gì: Cách viết các kiểm tra nghiệm thu mới hơi khác các kiểm tra cũ trong kho, nên người bảo trì có thể thấy lạ, nhưng kết quả kiểm vẫn đúng.
  Căn cứ: Chỉ là khác biệt về cách trình bày, không ảnh hưởng kết quả hay người dùng, nên không đáng mở thêm việc.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Phép đối chứng của E2 dựa vào origin/main và trạng thái DB dùng chung: hỏng hẳn sau khi merge, báo đỏ sai trên DB sạch (r1 · tệp đã đổi)**
  Người dùng thấy gì: Kết quả kiểm chứng việc sửa đỏ ngẫu nhiên có thể báo đỏ sai khi cơ sở dữ liệu máy không còn sẵn các tin hoãn, hoặc sau khi bản sửa đã vào nhánh chính.
  Căn cứ: Chỉ làm bằng chứng kiểm lại không tái lập được, không đụng dữ liệu hay người dùng; ghi rõ là chỉ chạy đúng trước khi merge là đủ.
  file: `_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/enrich-db-test-khoanh-tin/probes/tam-lan.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
