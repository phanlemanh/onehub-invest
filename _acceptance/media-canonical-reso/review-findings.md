# Review findings — media-canonical-reso (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **khong-lui.mjs lớp (1) giờ nuốt mọi vi phạm của chính hồ sơ trừ «evidence is stale», rộng hơn lời E12 expected**
  Người dùng thấy gì: Công cụ kiểm «hồ sơ cũ không bị lùi» có thể báo đạt dù chính hồ sơ ảnh này đang có một lỗi cấu trúc lạ. Người dùng cuối không thấy gì khác, nhưng người ký có thể tin kết quả đạt chắc hơn thực tế.
  Căn cứ: Hậu quả nhẹ và không ảnh hưởng dữ liệu hay người dùng cuối, vì cổng kiểm trước khi gộp vẫn chặn các lỗi đó ở bước sau; ghi lại giới hạn là đủ, sửa sau cũng rẻ.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: medium
  Đề xuất: known-limits

- **E9-network.txt lượt 2 bỏ danh sách request nên không còn bằng chứng cho điều kiện tiền /api/zalo-media → 200; báo cáo lại ghi network_observed: no-app-traffic**
  Người dùng thấy gì: Tệp bằng chứng mạng của lần chụp trang ảnh không còn ghi mã trả về của ảnh, và báo cáo ghi hai điều mâu thuẫn nhau. Ảnh chụp màn hình vẫn cho thấy ảnh hiện đúng, nên người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng độ đầy đủ của giấy tờ chứng minh, không làm mất ảnh hay dữ liệu; ảnh chụp đã chứng tỏ ảnh hiện được, và có thể chụp lại bằng chứng khi cần.
  file: `_acceptance/media-canonical-reso/evidence/E9-network.txt`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (chỉ đo chiều âm, không có đối chứng dương): lớp 1 của dongLa giờ bỏ qua MỌI dòng VIOLATION của chính media-canonical-reso, trừ «evidence is stale», và không ca nào kiểm chiều đỏ**
  Người dùng thấy gì: Công cụ kiểm «hồ sơ cũ không bị lùi» chưa có ca thử chứng minh nó thật sự báo đỏ khi gặp lỗi. Nếu nó hỏng âm thầm thì sẽ vẫn báo đạt.
  Căn cứ: Rủi ro là nhìn nhận sai chứ không mất dữ liệu hay hỏng tính năng người dùng; cổng kiểm khác vẫn chặn trước khi gộp, và thêm ca thử sau này không tốn nhiều.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bảng media của S05 được dựng sau transform-zalo (chỉ chạy S03), không sau transform-fb, nơi thật sự ghi tin S05 (r1)**
  Người dùng thấy gì: Tin Facebook (S05) mới về giữa hai lượt nạp đêm sẽ chưa có ảnh ở Hàng duyệt và hồ sơ tin cho tới đêm hôm sau, hiện «không có ảnh». Nguồn này đang tạm dừng nên hiện chưa ai gặp.
  Căn cứ: Hậu quả nhẹ vì nguồn đang dừng, ảnh tự có lại sau lượt đêm kế tiếp, không mất dữ liệu; sửa thuộc làn thu thập nên nên làm riêng khi bật lại nguồn.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Executor review_media_roundtrip còn trỏ tới tệp đã xoá app/scripts/review-media-roundtrip.ts (r1)**
  Người dùng thấy gì: Một lệnh kiểm cũ vẫn còn trong cấu hình nhưng đã mất tệp, nên ai chạy nhầm sẽ gặp thông báo lỗi khó hiểu. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người vận hành nếu chạy nhầm lệnh cũ, thấy lỗi ngay và không mất dữ liệu; chi phí dọn rất nhỏ nhưng không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **S05 offers written by apify-facebook-daily never get a transform-media run, so the media table goes stale until zalo-import-daily (r1)**
  Người dùng thấy gì: Khi bật lại nguồn Facebook, tin mới có thể thấy «không có ảnh» tới khoảng 18 giờ, và ảnh của bài đã chuyển sang tin khác tạm gắn vào tin cũ. Không có thông báo lỗi nào.
  Căn cứ: Hậu quả nhẹ và tự hết sau lượt đêm kế tiếp, không mất dữ liệu; hiện nguồn đang dừng nên chưa ai gặp, và việc sửa thuộc làn thu thập nên làm khi bật lại nguồn.
  file: `scripts/apify-facebook-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ NH-AC-3 không đo đột biến đã tuyên, chỉ notDeepEqual trên một đầu vào khác (r1)**
  Người dùng thấy gì: Bài thử kiểm tra thứ tự ảnh đã tải đứng trước chưa chứng minh được là sẽ bắt lỗi nếu thứ tự bị đảo. Ảnh hiện vẫn hiện đúng cho người dùng.
  Căn cứ: Không có hậu quả tức thời cho người dùng, chỉ làm lưới an toàn khi sửa sau này kém chặt hơn; bổ sung bài thử sau không tốn nhiều.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ NH-AC-6 «ảnh phải thuộc đúng tin đang mở» chỉ đổi dữ liệu vào, không đổi component (r1)**
  Người dùng thấy gì: Bài thử chưa chứng minh được việc hồ sơ tin chọn đúng ảnh của tin đang mở sẽ bị bắt nếu hỏng ở phần âm. Ảnh hiện cho người dùng vẫn đúng theo kiểm tra dương.
  Căn cứ: Không ảnh hưởng người dùng hiện tại vì phép kiểm dương đã phủ; chỉ làm lưới kiểm thử yếu hơn khai báo, sửa sau rẻ.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca 'NH-AC-3 hai bản regex' tự dựng lại luật của localFile trong test thay vì gọi hàm bên ghi (r1)**
  Người dùng thấy gì: Nếu luật nhận biết tên tệp ảnh ở phía ghi đổi sau này mà phía đọc không đổi theo, bài thử có thể vẫn xanh và ảnh có thể không hiện. Hiện hai phía đang khớp nhau.
  Căn cứ: Hiện không ai gặp lỗi, rủi ro chỉ xuất hiện khi sửa sau này và lúc đó ảnh chỉ thiếu chứ không mất dữ liệu; thêm phép kiểm trực tiếp sau rẻ.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Ảnh S05 dựng lại ở job zalo-import, không ở job dựng tin S05 (apify-facebook-daily) (r1)**
  Người dùng thấy gì: Tin S05 mới có thể chưa hiện ảnh trên Hàng duyệt và hồ sơ tin trong khoảng nửa ngày, tới lượt chạy đêm kế tiếp thì ảnh mới đủ.
  Căn cứ: Chỉ chậm hiện ảnh chứ không mất dữ liệu, tự hết sau lượt chạy kế tiếp, và nguồn S05 hiện đang dừng nên chưa ai gặp.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Ảnh của S05 không được dựng lại sau transform-fb: apify-facebook-daily không gọi transform-media (r1)**
  Người dùng thấy gì: Khi nguồn S05 được bật lại, tin S05 mới sẽ hiện «không có ảnh» trong Hàng duyệt và hồ sơ tin cho tới lượt chạy đêm sau, mà không có báo lỗi nào.
  Căn cứ: Hậu quả nhẹ vì chỉ trễ ảnh và tự hết sau lượt kế tiếp, nguồn S05 đang dừng nên chưa ảnh hưởng ai, nhưng cần nhớ khi bật lại nguồn này.
  file: `scripts/apify-facebook-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Bắt 42P01 làm che lỗi thiếu bảng media ở máy thu: ảnh mất hẳn và UI báo «không có ảnh» (r1)**
  Người dùng thấy gì: Nếu bảng ảnh chưa được dựng ở máy thu sau khi gộp, quản trị viên sẽ thấy mọi thẻ duyệt và hồ sơ tin không có ảnh và còn được báo «không có ảnh» thay vì thấy lỗi.
  Căn cứ: Chỉ xảy ra khi bước triển khai sau gộp bị bỏ sót, không mất dữ liệu và hết ngay khi áp bảng và chạy lại bước dựng ảnh; bước này đã có người được giao.
  file: `app/src/lib/ops/review-media.ts`
  severity: medium
  Đề xuất: known-limits

- **config.yaml còn executor review_media_roundtrip trỏ tới tệp đã xoá (r1)**
  Người dùng thấy gì: Người dùng cuối không bị ảnh hưởng; chỉ khi ai đó chạy lại phép kiểm cũ của hồ sơ trước thì gặp lỗi không tìm thấy tệp.
  Căn cứ: Không đụng tới người dùng hay dữ liệu, chỉ là một dòng cấu hình dọn dẹp rẻ khi có dịp, hiện chưa có gì chạy vào nó.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Probe khong-lui chấp nhận lớp 3 khi hồ sơ không còn lệnh nào (0/0 coi là xanh) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người dùng cuối không thấy gì; chỉ là bộ kiểm không-lùi có thể báo xanh trong một tình huống hiếm mà thực ra nó không đo được gì.
  Căn cứ: Rủi ro chỉ nằm ở công cụ kiểm của đội, không ảnh hưởng dữ liệu hay giao diện, và tình huống kích hoạt rất hiếm.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): chiều đỏ của NH-AC-3 không đo đột biến đã khai (r1)**
  Người dùng thấy gì: Nếu sau này ai đó làm lệch thứ tự ảnh đã tải và ảnh gốc, bộ kiểm có thể không gọi đúng tên ca bị lệch, nên khó tìm lỗi hơn.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm yếu khả năng phát hiện lỗi thứ tự ảnh sau này, và bổ sung phép đo là việc rẻ khi cần.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): truy vấn giả bỏ qua MEDIA_SQL, thứ tự media_order bên đọc không được đo (r1)**
  Người dùng thấy gì: Nếu thứ tự sắp xếp ảnh khi đọc bị mất, ảnh của tin S06 có thể hiện sai thứ tự mà các bài kiểm vẫn báo xanh.
  Căn cứ: Ảnh vẫn hiện đủ, chỉ có thể lệch thứ tự và quản trị viên nhìn là thấy ngay, không mất dữ liệu; nên ghi lại để hồ sơ sau bổ sung phép đo thứ tự.
  file: `app/tests/media-canonical.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): bộ phân loại dongLa của probe không lùi nuốt dòng VIOLATION lạ theo chuỗi con, và không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Người dùng cuối không thấy gì; bộ kiểm không-lùi có thể bỏ qua một số cảnh báo lạ của cổng kiểm trước khi gộp thay vì báo đỏ.
  Căn cứ: Chỉ làm yếu một lớp rào nội bộ chứ không chạm dữ liệu hay giao diện, và các lớp kiểm khác của cổng vẫn còn.
  file: `_acceptance/media-canonical-reso/probes/khong-lui.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): chiều đỏ của «NH-AC-6 hồ sơ tin S06» là phép so hiển nhiên đúng trên đầu vào cố ý sai (r1)**
  Người dùng thấy gì: Người dùng không bị ảnh hưởng; chỉ là một phép thử phụ không chứng minh thêm điều gì so với phép thử chính.
  Căn cứ: Phép thử chính đã đo đúng việc ảnh thuộc tin đang mở, nên sửa phép phụ không thêm bảo vệ đáng kể.
  file: `app/tests/media-canonical.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
