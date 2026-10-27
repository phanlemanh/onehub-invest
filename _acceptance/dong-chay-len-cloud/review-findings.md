# Review findings: dong-chay-len-cloud (round 2)

## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): «điểm ngày trên DOM bằng khối» của DC-AC-6 chỉ được đo bằng một doesNotMatch**
  AC: AC-6
  file: `app/tests/dong-chay-cloud.test.tsx:594`
  severity: medium
  source: measurement
  detail: AC-6 hứa «trên DOM … điểm ngày bằng số trong khối» và E6 hứa «nhãn ngày bằng khối». Trong vòng lặp ba cửa sổ, phía DOM chỉ có `assert.doesNotMatch(txt(root), /Chưa có số theo ngày trong khoảng này/)`. Đây là một assertion âm tính: không có đối chứng dương nào đọc nhãn ngày (XAxis) hay giá trị theo ngày từ DOM rồi so với `block.days`. Vế duy nhất đụng tới days là `assert.deepStrictEqual(flow[k], block[k])` trong cloudPageProblems (dòng 562-567), nhưng vế này so prop `el.props.flow` chứ không so DOM. Trong jsdom, AreaChart của Recharts không có kích thước nên gần như không vẽ ra tick ngày nào. Vì vậy biểu đồ có vẽ sai ngày, vẽ thiếu điểm, hay không vẽ gì (miễn là không rơi vào nhánh `empty`) thì ca vẫn xanh.

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): lưới «Theo nhóm thu» ở DC-AC-6 chỉ kiểm tên nhóm có mặt**
  AC: AC-6
  file: `app/tests/dong-chay-cloud.test.tsx:606`
  severity: low
  source: measurement
  detail: AC-6 hứa «trên DOM, số chặng từng nguồn, số tin đủ năm trường lõi, nhóm và điểm ngày bằng số trong khối». Phía nhóm chỉ có `assert.ok(names.some((n) => n.includes(g.group)))`, tức là tên nhóm có mặt ở ô đầu của một hàng nào đó. Các số received/readable/offers của từng nhóm trên lưới không được so với `blocks.all.groups[i]` (khác với hàng nguồn, nơi cloudPageProblems so từng ô). Ngoài ra ca chỉ đo cửa sổ «all», không đo 7d (cửa sổ có số nhóm khác: Nhóm A 2/2/1). Lưới có vẽ sai số nhóm thì ca vẫn xanh. E6 thu hẹp xuống «tên từng nhóm», nhưng hợp đồng AC-6 nói «bằng số trong khối».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khối dataFlow trên cloud bị ép kiểu thẳng, không kiểm khuôn như các khối bản tin khác**
  Người dùng thấy gì: Nếu máy thu và cloud chạy hai phiên bản lệch nhau, trang Dòng chảy trên cloud có thể sập cả vùng số liệu thay vì báo «không đo được», hoặc vẽ một con số sai như số thật.
  Căn cứ: Chỉ xảy ra khi hai phía lệch phiên bản, người dùng tải lại hoặc đợi bản tin kế là hết, nhưng lúc đó họ có thể đọc nhầm số; sửa sau không đắt vì các khối khác đã có khuôn kiểm sẵn.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Chỉ một tên nhóm trong khối dataFlow trúng bộ soát là cả bản tin bị chặn, trong khi khối s03 miễn đúng tên đó**
  Người dùng thấy gì: Nếu một tên nhóm cộng đồng có chứa tên nguồn thật, toàn bộ bản tin sức khoẻ không lên cloud, và mọi trang Ops trên cloud báo «cũ» sau khoảng 45 phút dù máy thu vẫn khoẻ.
  Căn cứ: Hiếm gặp nhưng khi gặp thì cả đội vận hành mất nhịp tim hệ thống từ xa cho tới khi có người xử lý; không lộ dữ liệu, nên chọn cách chặn hẹp hơn là một quyết định riêng của người ký.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bước refresh-data-flow hỏng mỗi lượt 15′ từ lúc pull main cho tới khi áp 051 lên DB local**
  Người dùng thấy gì: Trong khoảng sau khi gộp mã mới mà chưa áp migration lên máy thu, mỗi lượt đồng bộ 15 phút báo lỗi đỏ, dù phần đồng bộ chính vẫn chạy.
  Căn cứ: Chỉ là cảnh báo đỏ tạm thời, không mất dữ liệu, tự hết ngay khi áp migration; ghi một dòng vào bước triển khai là đủ.
  file: `scripts/cloud-sync.sh`
  severity: low
  Đề xuất: known-limits

- **LocalOnlyAlert bị dùng ở máy thu cho trạng thái «chưa làm tươi»**
  Người dùng thấy gì: Trên máy thu, khi số tính sẵn chưa có hoặc chưa áp migration, trang hiện khung «chỉ xem ở máy thu», nói sai nguyên nhân thật là thiếu bước làm tươi.
  Căn cứ: Chỉ là chữ gây hiểu nhầm với người vận hành đang ngồi ở máy thu, không mất dữ liệu và không ảnh hưởng người dùng cuối; sửa chữ rất rẻ khi có dịp.
  file: `app/src/components/ops/data-flow/data-flow-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Máy thu luôn coi số tính sẵn là «fresh», không bao giờ báo số cũ khi bước làm tươi gãy**
  Người dùng thấy gì: Trên máy thu, nếu bước làm tươi hỏng nhiều lượt liền, trang vẫn vẽ số cũ như số mới và chỉ có dòng giờ nhỏ ở đầu trang để nhận ra.
  Căn cứ: Người vận hành có thể tin nhầm số cũ ở máy thu trong nhiều giờ mà không ai báo, nhưng giờ tính vẫn hiện ra và cloud thì đã báo cũ; thêm cảnh báo là một việc nhỏ riêng.
  file: `app/src/lib/data-flow-queries.ts`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 5 (thiếu ma trận viết trước): DC-AC-8 so bậc trên lưới với chính levelOf mà lưới dùng để vẽ**
  Người dùng thấy gì: Bài kiểm tự động cho cột bậc tin trên cloud có thể vẫn xanh dù bậc hiển thị sai hàng loạt, nên lỗi nối khu vực cho tin có thể lọt tới người vận hành.
  Căn cứ: Lỗi nếu có sẽ là bậc hiển thị sai trên một bảng chỉ đọc, người vận hành thấy và báo được; phần tập tin hiển thị vẫn được ghim, và kiểm tay ở phiên nghiệm thu sau ship bù được.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): numericRegions ở trạng thái vắng/lỗi của DC-AC-7 chỉ có đối chứng dương cho 1/4 đầu dò**
  Người dùng thấy gì: Bài kiểm tự động cho lời hứa «vắng hoặc lỗi thì không hiện số 0» có ba trong bốn đầu dò chưa được chứng minh là bắt được lỗi, nên nếu đổi chữ tiêu đề vùng thì có thể lọt số 0 giả.
  Căn cứ: Hậu quả chỉ xảy ra nếu sau này ai đó đổi chữ tiêu đề vùng và vô tình lọt số 0; một đầu dò còn lại vẫn canh, và sửa sau chỉ là thêm vài phép so.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
