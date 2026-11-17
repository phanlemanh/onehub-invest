# Review findings: ngoai-n-tu-dinh-tuyen-bat (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca NNTD-DOI so dòng máy với sổ của cây LÀM VIỆC, không phải mốc ghim — và evals.yaml không khai các tệp đó trong paths**
  Người dùng thấy gì: Phép đo so sánh máy với lựa chọn của người có thể đổi kết quả sau này nếu sổ của các hồ sơ cũ có thêm dòng mới. Người dùng cuối không thấy gì; chỉ làm số kiểm kém ổn định khi chạy lại.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của phép đo khi chạy lại về sau, không ảnh hưởng dữ liệu hay việc ký hiện tại, và sửa được bất cứ lúc nào.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hồ sơ đang mở nhưng không gắn vào việc nào trong docs/plan/lo-trinh.json**
  Người dùng thấy gì: Bản đồ lộ trình hiện một mục đỏ báo hồ sơ này chưa thuộc việc nào. Không ảnh hưởng hành vi hệ thống, chỉ làm bản đồ kém gọn.
  Căn cứ: Chỉ là sổ sách theo dõi, không mất dữ liệu, thêm mã việc sau là hết, rẻ.
  file: `LO-TRINH.html`
  severity: medium
  Đề xuất: known-limits

- **Executor nntd_luoi biến lỗi chạy của pre-merge-check.sh thành ĐẠT**
  Người dùng thấy gì: Phép kiểm lưới trước khi gộp có thể báo đạt dù lưới không chạy được. Người dùng không thấy ngay, nhưng một lỗi có thể lọt qua bước kiểm này.
  Căn cứ: Là lưới an toàn phụ, còn nhiều lớp kiểm khác chặn gộp, và sửa sau không tốn kém.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Script đo đặt ở gốc thư mục hồ sơ thay vì probes/**
  Người dùng thấy gì: Một tệp đo nằm khác chỗ so với nếp thường dùng. Không ảnh hưởng người dùng.
  Căn cứ: Thuần thẩm mỹ thư mục, không có hậu quả nào, di chuyển tốn công hơn lợi ích.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: wont-fix

- **Executor nntd_luoi trả exit 0 khi pre-merge-check.sh không chạy được (AC-8 xanh giả)**
  Người dùng thấy gì: Phép kiểm lưới trước khi gộp có thể xanh giả khi lưới không chạy. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Là lớp kiểm phụ đã được ghi nhận, hậu quả nhẹ vì còn các cổng khác, sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **NNTD-DOI đếm «dòng người vắng» thành «đảo thật», và không mở rộng dòng khoảng Ngoài-a đến Ngoài-b**
  Người dùng thấy gì: Khi thiếu dòng của người, phép đo có thể coi là máy đảo lựa chọn của người và làm tỉ lệ rủi ro nhìn cao hơn thật. Hiện dữ liệu chưa gặp ca này.
  Căn cứ: Lỗi nếu xảy ra sẽ đỏ ồn chứ không im, không mất dữ liệu, sửa sau rẻ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: medium
  Đề xuất: known-limits

- **docSo nuốt im dòng JSONL hỏng**
  Người dùng thấy gì: Nếu sổ quyết định có dòng hỏng, phép đo bỏ qua âm thầm thay vì báo. Người dùng cuối không gặp.
  Căn cứ: Sổ do công cụ sinh nên hiếm hỏng, và hậu quả chỉ là số đo lệch nhẹ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: wont-fix

- **Vế tongMuc === 38 là hằng so hằng, mẫu số không đếm lại từ review-findings**
  Người dùng thấy gì: Con số tổng 38 mục trong bằng chứng là lời khai chứ không phải số đo lại. Người dùng không thấy khác biệt.
  Căn cứ: Số khác đã được đo thật ở chỗ khác và người ký xem được, nên hậu quả nhẹ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: known-limits

- **Contract Coverage còn số cũ «11 mục còn lại», mâu thuẫn AC-3 và số đo (10)**
  Người dùng thấy gì: Một dòng mô tả trong hồ sơ ghi số cũ, còn lại đều đúng 10. Có thể gây hiểu nhầm nhỏ khi đọc.
  Căn cứ: Con số chính thức ở tiêu chí đã đúng, chỉ lệch một dòng chú thích, không đáng sửa.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/contract.md`
  severity: low
  Đề xuất: wont-fix

- **Assertion âm-tính-một-mình: executor nntd_luoi (E9/AC-8) nuốt mã thoát của lưới, không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm lưới có thể báo đạt khi lưới gãy hoặc đổi cách in. Người dùng cuối không thấy ngay.
  Căn cứ: Là lớp kiểm phụ, còn các lớp khác chặn gộp, và sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: NNTD-CHEP (AC-2) coi hai tệp cùng VẮNG là «khớp byte»**
  Người dùng thấy gì: Phép đo có thể coi hai tệp cùng thiếu là khớp. Thực tế bốn tệp đều có mặt nên người dùng không bị ảnh hưởng.
  Căn cứ: Kịch bản này gần như không xảy ra vì tệp kit luôn có trong kho, nên hậu quả rất nhỏ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: wont-fix

- **Quyết định đổi luật cổng của Mạnh chỉ nằm ở khoá config + hợp đồng, không vào ROADMAP §3 (r1)**
  Người dùng thấy gì: Quyết định của Mạnh về việc máy tự xếp một số mục chưa được ghi vào sổ quyết định chung. Người hoặc phiên làm việc khác đọc sổ ấy vẫn thấy luật cũ, trong khi cổng đã chạy theo luật mới.
  Căn cứ: Không mất dữ liệu và cổng vẫn chạy đúng; rủi ro là người đọc sau hiểu sai luật, và có thể bổ sung ghi chép bất cứ lúc nào.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: new-contract

- **Cờ --rev chỉ ghim một nửa phép so của AC-5: dòng người đọc từ cây làm việc, không từ mốc ghim (r1)**
  Người dùng thấy gì: Công cụ kiểm số mục máy xếp so với lựa chọn của người có thể cho kết quả lệch nếu sau này có ai sửa sổ quyết định của sáu hồ sơ cũ. Hiện chưa lệch.
  Căn cứ: Hôm nay con số vẫn đúng nên không ảnh hưởng người dùng; nếu lệch thì báo đỏ chứ không âm thầm sai, và sửa sau không tốn kém.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ca NNTD-BAN/NNTD-CHEP ghim kit bằng basename và bị biến môi trường AG_ROOT vô hiệu hoá (r1)**
  Người dùng thấy gì: Nếu ai đó cố tình chỉ công cụ kiểm sang một bản kit khác, bằng chứng vẫn báo đạt dù không đo trên đúng bản 2.37.0.
  Căn cứ: Chỉ xảy ra khi chủ động đặt biến môi trường; chạy bình thường vẫn đo đúng, nên hậu quả nhẹ và chỉ cần ghi rõ điều kiện đo.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: known-limits

- **dungGoc() ném ngoại lệ trần thay vì một dòng ĐỎ có tên, và để lại thư mục tạm (r1)**
  Người dùng thấy gì: Khi công cụ kiểm gặp sự cố hạ tầng, nó dừng bằng thông báo lỗi khó đọc và để lại vài thư mục tạm trên máy.
  Căn cứ: Chỉ tốn chút dung lượng tạm và người chạy vẫn thấy lỗi; sửa không đáng so với hậu quả.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: wont-fix

- **Executor nntd_luoi nuốt lỗi của chính pre-merge-check.sh (AC-8 xanh giả) (r1)**
  Người dùng thấy gì: Bước kiểm trước khi gộp có thể báo đạt dù công cụ kiểm của cổng không chạy được, và che luôn vi phạm thật của chính hồ sơ này.
  Căn cứ: Lỗi có thể khiến một PR có vấn đề lọt qua nhưng cần lưới sập đúng lúc, và các lưới khác vẫn chặn; sửa sau không khó nhưng cần cẩn thận.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **--rev chỉ ghim nửa phép so của NNTD-DOI: dòng người đọc từ cây làm việc, không từ mốc ghim (r1)**
  Người dùng thấy gì: Công cụ so lựa chọn của máy với lựa chọn của người đọc một vế từ bản hiện tại thay vì bản đã ghim, nên có thể lệch nếu sổ cũ bị sửa.
  Căn cứ: Hiện hai bản giống hệt nên không ảnh hưởng ai; nếu lệch sẽ báo đỏ và sửa sau rẻ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Contract Coverage còn số cũ «11 mục còn lại», mâu thuẫn AC-3 (10) (r1)**
  Người dùng thấy gì: Một dòng mô tả trong hợp đồng còn ghi 11 mục còn lại trong khi các chỗ khác và số đo thật là 10.
  Căn cứ: Chỉ là lệch con số ở phần ghi chú, không đổi hành vi cổng; người đọc dễ nhận ra và sửa chữ rất rẻ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/contract.md`
  severity: low
  Đề xuất: wont-fix

- **bam() trả sentinel "vang" cho tệp vắng → NNTD-CHEP (AC-2) có nhánh ĐẠT rỗng (r1)**
  Người dùng thấy gì: Công cụ kiểm bản kit có thể báo khớp nếu một tệp cần so vắng ở cả hai phía, dù chẳng so được gì.
  Căn cứ: Hiện đủ bốn tệp nên kết quả đúng; chỉ rủi ro khi tên tệp đổi và dễ sửa sau.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: known-limits

- **PR mở hồ sơ không thuộc việc nào trong kế hoạch — LO-TRINH tự báo 48 → 49 chỗ cần sửa (r1)**
  Người dùng thấy gì: Bản đồ lộ trình báo thêm một chỗ cần sửa vì việc này chưa có hàng trong kế hoạch phát triển.
  Căn cứ: Chỉ là sổ kế hoạch thiếu một hàng, không ảnh hưởng người dùng và thêm hàng sau là việc nhỏ.
  file: `LO-TRINH.html`
  severity: low
  Đề xuất: new-contract

- **Assertion âm-tính-một-mình: nntd_luoi xanh cả khi lưới trước-gộp sập (không đối chứng dương, không ghim thông điệp) (r1)**
  Người dùng thấy gì: Bước kiểm trước khi gộp có thể báo đạt khi lưới kiểm của cổng sập, và không giới hạn hai dòng chờ đúng như hợp đồng hứa.
  Căn cứ: Cần lưới sập đúng lúc mới sai, hiện chưa xảy ra; ghi lại để người ký biết giới hạn của thước.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA: mẫu số 38 là hằng trong bảng khai của bộ đo, không phải số đếm từ review-findings (r1)**
  Người dùng thấy gì: Tổng 38 mục trong báo cáo được khai sẵn trong công cụ chứ không đếm lại từ hồ sơ, nên một sai lệch nhỏ giữa các hồ sơ có thể không bị phát hiện.
  Căn cứ: Con số hiện đúng và các số liên quan được đo độc lập; chỉ là độ chắc của bằng chứng, sửa sau rẻ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: known-limits

- **Assertion âm-tính không có đối chứng dương: NNTD-CHEP đạt khi cả hai phía tệp đều vắng (r1)**
  Người dùng thấy gì: Công cụ kiểm bản kit có thể báo khớp một cách rỗng nếu tên tệp gõ sai hoặc tệp đổi tên.
  Căn cứ: Hiện không xảy ra và nếu xảy ra chỉ làm bằng chứng yếu đi chứ không hỏng dữ liệu; sửa sau rẻ.
  file: `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
