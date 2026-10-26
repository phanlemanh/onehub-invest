# Review findings: ops-dong-chay-df0 (round 1)

## Trong hợp đồng

- **Cửa sổ của listing ngắn hạn (S01) lệch một ngày vì ép timestamptz sang date theo múi giờ phiên DB**
  file: `app/src/lib/data-flow-queries.ts:196`
  severity: low
  AC: AC-2
  source: bugs
  detail: `$1` được dùng hai lần: `fetched_at >= $1` trong subquery ở target list, nên Postgres suy kiểu là timestamptz, và `last_seen >= $1::date`. Giá trị truyền vào là 00:00 giờ VN (vnDayStart), tức 17:00Z của ngày hôm trước. Phép ép `::date` chạy theo TimeZone của phiên. Pool trong lib/db.ts không đặt timezone, và DB PostGIS docker mặc định UTC, nên kết quả ra ngày hôm trước. Hệ quả: cửa sổ 7d/30d của `listings` gộp thêm một ngày, làm lệch số stored/withWard của hàng S01 và lát «Thuê ngắn hạn» trong biểu đồ Loại giao dịch. Sửa: truyền riêng khoá ngày VN (vnDayKey) cho vế date, hoặc dùng `($1 AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`.
  lý do vào hợp đồng: AC-2 đòi số listing S01 theo 7 ngày đúng đáp án và mục ngoài khoảng 7 ngày không vào tổng; lệch một ngày làm gộp thừa một ngày.

- **Hình dạng 4 (âm tính một mình) + 1 (đo hàm phụ thay đầu ra): chiều đỏ của 'DF-AC-2 S06 min' là phép so luôn đúng, không đột biến code nào**
  file: `app/tests/ops-dong-chay.test.tsx:262`
  severity: medium
  AC: AC-2
  source: measurement
  detail: Dòng 262-263: `const dotBien = (o: number) => o; assert.notEqual(dotBien(rows[0].o), 2, ...)`. Thực chất đây là assert.notEqual(5, 2): fixture có 5 tin S06 nên phép so luôn qua, dù getDataFlow hay s06Readable viết thế nào. Đột biến không chạm code thật, nên «chiều đỏ» E2 hứa ('đột biến readable = offers → ca đỏ S06 readable 5 ≠ 2') không đo được gì. Chiều xanh (dòng 261) cũng chỉ gọi hàm thuần `s06Readable(o, a)` với số đếm test tự truy vấn. Lược đồ `${S}_min` được dựng nhưng getDataFlow không chạy trên nó (pool gắn vào lược đồ S qua DATABASE_URL ở dòng 14). Vì vậy lời hứa E2 'lược đồ thứ hai … → S06 readable 2' được đo ở hàm phụ, không phải ở đầu ra getDataFlow. Nếu bỏ dòng 294 `s06Flow.readable = s06Readable(...)` trong data-flow-queries.ts, ca này vẫn xanh. Ca DF-AC-2 chính (S06 readable 3 với 3 tin / 4 quảng cáo) cũng không bắt được lỗi này, vì min(3,4) = 3 = offers.
  lý do vào hợp đồng: phép đo AC-2 về «đọc được» của S06 bằng min(tin, bài nhận) không chạm đầu ra thật nên không chứng minh được AC này.

- **Hình dạng 4 (âm tính một mình, thiếu đối chứng dương): nhánh 'một nguồn received > 0' của DF-AC-8 chỉ assert chữ trống vắng mặt**
  file: `app/tests/ops-dong-chay.test.tsx:463`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Dòng 462-463 render `FlowSankey` với sf('S03', 10, 4, 2, 0) rồi chỉ có `assert.doesNotMatch(root.textContent, /Chưa có bài trong khoảng này/)`. E8 hứa đối chứng dương 'có role=img aria-label bắt đầu Đường ống:' (flow-journey.tsx dòng 212-213 có sẵn thuộc tính này), nhưng test không có assert nào như vậy. Nếu FlowSankey render rỗng, render nhầm nhánh khác hoặc không vẽ đường ống, ca vẫn xanh. Phép đo âm này không có gì dương đi kèm để phân biệt 'không có chữ trống' với 'không có gì'.
  lý do vào hợp đồng: AC-8 đòi đường ống chỉ hiện Empty khi khoảng không có bài; phép đo nhánh có bài không xác nhận đường ống thật sự được vẽ.

- **Hình dạng 4 (âm tính một mình): 'DF-AC-3 DB thật' xanh rỗng khi public.sale_offers không có dòng nào**
  file: `app/tests/ops-dong-chay.test.tsx:339`
  severity: low
  AC: AC-3
  source: measurement
  detail: Dòng 331-339 gom theo nguồn rồi `for (const [src, x] of by) assert.equal(x.sql, x.ts, ...)`. Không có assert nào kiểu by.size > 0 hay rows.length > 0, nên DB local rỗng (hoặc sale_offers bị truncate) cho 0 vòng lặp và ca vẫn xanh. Lời hứa E3 'complete theo nguồn = đếm levelOf theo nguồn' khi đó không được đo, mà kết quả không cho biết điều này.
  lý do vào hợp đồng: AC-3 đòi trên cùng tập tin, số «đủ trường lõi» do SQL đếm bằng số tin levelOf xếp B1/B2; ca xanh khi không có dòng nào nên không đo được điều AC hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khoá màu mới trong palette.ts thiếu tiền tố `ops` và không có dòng trong data-color.md, làm đỏ b3-check data-color và contrast**
  Người dùng thấy gì: Người vận hành không thấy gì sai trên trang; chỉ là bộ kiểm màu của dự án báo đỏ vì bảng màu mới chưa được khai theo đúng quy ước. Nếu để vậy, các lần kiểm sau sẽ luôn đỏ và che mất lỗi thật.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng để đỏ sẽ làm nhiễu mọi lần kiểm về sau; sửa rẻ và nên làm ở một việc riêng có ghi sổ quyết định về ma trận màu.
  file: `app/src/components/charts/palette.ts`
  severity: medium
  Đề xuất: new-contract

- **Trang /ops/data-flow làm đỏ ba lệnh của harness B1 Ops (shell, one-way, dialogs), trước đây ba lệnh này đều đạt**
  Người dùng thấy gì: Trang chạy bình thường với người vận hành, nhưng bộ kiểm giao diện Ops của dự án sẽ báo đỏ vì trang mới chưa được khai vào danh sách trang Ops đã chuẩn hoá.
  Căn cứ: Người dùng không gặp lỗi và không mất dữ liệu, nhưng bộ kiểm đỏ kéo dài sẽ chặn hoặc làm nhiễu các lần kiểm Ops khác; sửa là khai báo trang mới, chi phí thấp.
  file: `app/src/components/shell/nav.tsx`
  severity: medium
  Đề xuất: new-contract

- **next-env.d.ts bị commit kèm đường dẫn chế độ dev (.next/dev/types)**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ là một tệp cấu hình do máy lập trình tự sinh bị lẫn vào bản lưu và có thể đổi qua đổi lại giữa các lần chạy.
  Căn cứ: Không có hậu quả với người dùng hay dữ liệu, tự hết khi hoàn tệp về bản chính; ghi nhận hoặc hoàn tệp ở lần sửa kế tiếp là đủ.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: known-limits

- **Số «đề xuất làm giàu» luôn là 0: lọc status = 'pending' nhưng enrichment_proposals không có trạng thái này**
  Người dùng thấy gì: Đầu trang Dòng chảy dữ liệu luôn ghi «0 đề xuất làm giàu» dù hàng đợi đang có việc, nên người vận hành tưởng không còn gì chờ xử lý.
  Căn cứ: Con số sai im lặng làm người vận hành bỏ sót việc đang chờ, nhưng không mất dữ liệu và chỉ là một con số tóm tắt; sửa rất rẻ nên nên gom vào một việc riêng.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Biểu đồ «Chặng theo ngày» không thêm điểm 0 cho ngày trống, nên che mất những ngày nguồn im**
  Người dùng thấy gì: Khi thu thập ngừng vài ngày, biểu đồ vẫn vẽ đủ điểm bằng các ngày cũ hơn nên trông bình thường, che mất việc nguồn đã im và không khớp với tổng ở các ô số phía trên.
  Căn cứ: Biểu đồ gây hiểu nhầm đúng lúc cần phát hiện sự cố, nhưng các ô số vẫn đúng và không mất dữ liệu; sửa không đắt nên làm ở một việc riêng.
  file: `app/src/components/ops/data-flow/stage-trend-chart.tsx`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
