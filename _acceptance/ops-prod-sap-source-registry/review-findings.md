# Review findings: ops-prod-sap-source-registry (round 1)

## Trong hợp đồng

- **Hình dạng 3: chỉ assert chuỗi có mặt, trong khi lời hứa là câu đó nằm ở đầu trang VÀ trong thông báo có tên**
  file:line: `app/tests/ops-cloud-khong-bang-nap.test.tsx:88`
  severity: medium
  AC: AC-2
  source: measurement
  detail: AC-2 hứa cả hai trang hiện «Độ tươi chỉ đo ở máy local» ở hai chỗ: đầu trang và thông báo có tên (LocalOnlyAlert). Nhưng ca OP-AC-2 chỉ kiểm `assert.ok(h.includes("Độ tươi chỉ đo ở máy local"))` trên toàn bộ HTML. Chuỗi này được sinh ở nhiều nơi: badge stats của PageHeader (`sloSummaryText(slo, true)` ở app/src/app/ops/page.tsx:28 và collections-view.tsx:64), ô KPI của OverviewTiles (overview-tiles.tsx:88), rồi mới đến AlertTitle của LocalOnlyAlert. Vì vậy nếu xoá `{localOnly ? <LocalOnlyAlert /> : null}` khỏi cả hai trang thì ca vẫn xanh, vì badge đầu trang vẫn chứa chuỗi. Phép đo không nói được chuỗi xuất hiện ở đâu, cũng không nói được có thông báo hay không. Đây đúng là trường hợp chỉ thấy chuỗi có mặt trong khi lời hứa là về vị trí và số lần xuất hiện. Nên ghim cả hai chỗ, ví dụ kiểm role=alert hoặc AlertTitle chứa LOCAL_ONLY_TEXT, và tách riêng phần badge đầu trang.
  Lý do thuộc hợp đồng: AC-2 hứa rõ câu hiện ở «đầu trang + thông báo có tên», mà phép đo chỉ kiểm chuỗi có mặt đâu đó nên không chứng minh được cả hai chỗ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phát hiện «cloud» bằng một cơ chế mới (to_regclass), lệch với helper isCloud() (VERCEL === "1") mà cùng trang đang dùng**
  Người dùng thấy gì: Trang Thu thập có thể hiếm khi tự mâu thuẫn: vừa báo độ tươi chỉ đo ở máy local, vừa hiện tuổi máy thu. Chỉ xảy ra khi môi trường và dữ liệu lệch nhau, không làm trang vỡ.
  Căn cứ: Hậu quả nhẹ, chỉ là hai dòng chữ có thể lệch nhau ở trường hợp hiếm, không mất dữ liệu và trang vẫn mở được; có thể gom về một cách nhận biết ở đợt dọn sau.
  file: `app/src/lib/ops-queries.ts`
  severity: low
  Đề xuất: known-limits

- **/ops trên cloud vẫn báo «không quá hạn» và «mọi nguồn đã có snapshot» dù không đo được độ tươi**
  Người dùng thấy gì: Trên bản cloud, trang tổng quan Ops vẫn hiện ô xanh kiểu «không có nguồn quá hạn» và «mọi nguồn đã có snapshot» dù thực tế chưa đo gì. Người vận hành có thể tưởng mọi thứ ổn.
  Căn cứ: Nguy cơ gây hiểu nhầm là thật nhưng đã có thông báo «chỉ đo ở máy local» ngay phía trên, không mất dữ liệu, và sửa phần hiển thị khá rẻ nên đáng làm thành việc riêng.
  file: `app/src/components/ops/overview/overview-tiles.tsx`
  severity: medium
  Đề xuất: new-contract

- **API /api/v1/ops/coverage trên cloud trả 200 với rows rỗng, không có cờ nào báo «chỉ đo ở local»**
  Người dùng thấy gì: Công cụ kiểm tra tự động gọi API độ phủ trên cloud sẽ thấy kết quả «ổn» dù không đo được gì, nên có thể báo đạt giả. Người đọc trang web thì vẫn thấy thông báo rõ.
  Căn cứ: Chỉ ảnh hưởng máy đọc chứ không ảnh hưởng người dùng trên trang, không mất dữ liệu, và thêm một cờ vào kết quả là việc nhỏ làm sau.
  file: `app/src/lib/ops-queries.ts`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 2: test tự dựng props cho CollectionsView (kể cả cờ localOnly) theo đúng khuôn bên đọc, bỏ qua bên ghi là CollectionsPage**
  Người dùng thấy gì: Nếu sau này ai đó làm mất dây nối ở trang Thu thập trên cloud, thông báo «chỉ đo ở máy local» sẽ biến mất mà bộ kiểm tra vẫn báo xanh. Hiện tại trang chạy đúng.
  Căn cứ: Hiện chưa có lỗi nào với người dùng, rủi ro chỉ là lỗi tương lai lọt qua kiểm tra, và có thể bổ sung kiểm tra sau mà không ảnh hưởng gì.
  file: `app/tests/ops-cloud-khong-bang-nap.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
