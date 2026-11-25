# Review findings: s03-jpg-path-fallback (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **kiem.sh của ZC15 vẫn dựng và đọc collector/dist của cây, trong khi zc15/zc16_media_test chạy rm -rf dist (đúng lỗi đua mà S4 r1 đã sửa ở ZC16)**
  Người dùng thấy gì: Khi chấm chung hai hồ sơ, bước kiểm sau áp của ZC15 có thể lúc đỏ lúc xanh dù mã đúng. Người dùng cuối không bị ảnh hưởng, chỉ người chấm có thể phải chạy lại.
  Căn cứ: Chỉ làm bước chấm thiếu ổn định, không động tới dữ liệu hay người dùng, chạy lại là xong, và lỗi nằm ở hồ sơ của hàng khác.
  file: `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **Tên tệp media giờ băm theo URL đã tải, không còn là sha256(URL trong payload.media) như DATA-CONTRACT ghi, mà hợp đồng không được cập nhật**
  Người dùng thấy gì: Tài liệu mô tả cách đặt tên tệp ảnh đã lệch so với hành vi thật cho ảnh tải qua đường thử lại. Phía đọc dữ liệu dùng tên tệp ghi sẵn nên hiện chưa hỏng gì.
  Căn cứ: Chỉ là tài liệu lệch, không mất hay lộ dữ liệu, phía đọc chưa gãy; sửa tài liệu có thể làm sau trong một hàng riêng.
  file: `collector/src/core/media-fetch.ts`
  severity: medium
  Đề xuất: known-limits

- **Lý do lỗi của lần thử lại bỏ /jpg/ bị nuốt, meta ghi nhầm thành http-400**
  Người dùng thấy gì: Khi ảnh lỗi cả hai lần, sổ chỉ ghi lỗi 400 ban đầu nên không phân biệt được lỗi mạng tạm thời với link chết. Tỉ lệ lỗi 400 đo sau khi áp có thể cao hơn thực tế một chút.
  Căn cứ: Chỉ làm số đo sau áp lẫn thêm vài ca lỗi mạng, không mất ảnh hay dữ liệu mới, và hợp đồng đã chủ ý chọn cách ghi này.
  file: `collector/src/core/media-fetch.ts`
  severity: low
  Đề xuất: known-limits

- **Round-trip ZC15 so với merge-base origin/main sẽ đỏ giả ngay khi ZC15 đã gộp vào main**
  Người dùng thấy gì: Sau khi ZC15 gộp vào nhánh chính, bước kiểm của ZC15 có thể báo đỏ giả dù mã đúng. Người ký có thể bị nhầm là có lỗi thật.
  Căn cứ: Chỉ gây báo đỏ giả ở bước kiểm, không ảnh hưởng người dùng hay dữ liệu, và sửa bằng cách ghim lại mốc so sánh khi cần.
  file: `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **kiem.sh của ZC15 vẫn dựng vào collector/dist dùng chung, đua với rm -rf dist của zc16_media_test và zc15_media_test**
  Người dùng thấy gì: Bước kiểm của ZC15 có thể cho kết quả không ổn định khi chạy cùng lúc với bài kiểm của hồ sơ khác. Chỉ ảnh hưởng người chấm.
  Căn cứ: Không đụng dữ liệu hay người dùng, chạy lại là qua, và đã có cách sửa mẫu ở hồ sơ ZC16.
  file: `_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đột biến thu-moi-loi ghim thông điệp «không thử lại», nhưng chuỗi này luôn có trong tên ca nên ghim không có tác dụng**
  Người dùng thấy gì: Bước tự thử có thể báo đã bắt được lỗi dù ca đỏ là do lý do khác, nên chưa chứng minh chắc là việc thử lại sai chỗ sẽ bị phát hiện. Phần mã tải ảnh chạy cho người dùng không đổi.
  Căn cứ: Chỉ làm bằng chứng kiểm thử yếu hơn công bố, không gây mất ảnh hay sai dữ liệu, và các ca test hành vi chính vẫn tồn tại.
  file: `_acceptance/s03-jpg-path-fallback/probes/tu-thu.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — soát rò tên trên mẫu canh-gac chỉ là một phép kiểm âm, không xem mã thoát và không có đối chứng dương**
  Người dùng thấy gì: Nếu bộ kiểm sau áp hỏng giữa chừng, phép soát rò tên vẫn báo ổn. Có thể bỏ sót một lần rò tên nguồn trong đầu ra.
  Căn cứ: Chỉ là phép soát lỏng ở công cụ nội bộ, không có rò thật được chỉ ra, và người ký còn đọc các mục khác của bộ kiểm.
  file: `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — khuon-media-files đo chữ khai báo type MediaFileEntry thay vì khoá thật sự được ghi vào meta.mediaFiles**
  Người dùng thấy gì: Phép kiểm khuôn dữ liệu ảnh chỉ đọc phần khai báo, nên một đường ghi thêm khoá lạ có thể lọt. Hiện chưa thấy khoá thừa nào được ghi.
  Căn cứ: Rủi ro chỉ xảy ra nếu sau này có ai thêm khoá lạ, hiện không có hậu quả với người dùng, và sửa rẻ khi có đợt đổi khuôn.
  file: `_acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — ca ZC9 đọc mã nguồn bằng regex thay vì đo hành vi**
  Người dùng thấy gì: Một ca test có thể đỏ chỉ vì đổi tên hằng số dù hành vi vẫn đúng. Người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ gây báo đỏ giả nhẹ khi sửa mã sau này, đã có ca hành vi bù, nên chi phí sửa không đáng.
  file: `collector/src/test/media-fetch.test.ts`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 5/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s03-media-r2-allowlist/ap-may-thu/kiem.sh, _acceptance/s03-jpg-path-fallback/probes/tu-thu.sh, _acceptance/s03-media-r2-allowlist/probes/khuon-media-files.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
