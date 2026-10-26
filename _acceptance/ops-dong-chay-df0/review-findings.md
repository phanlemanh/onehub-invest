## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca 'DF-AC-3 DB thật' đòi DB local có dữ liệu nhưng không nằm trong scripts/ci-bo-qua.json, nên job ci-test/app sẽ đỏ trên CI**
  Người dùng thấy gì: Người vận hành không thấy khác biệt nào trên trang Dòng chảy dữ liệu. Nhưng khi mở PR, bước kiểm tự động sẽ báo đỏ vì máy kiểm không có dữ liệu thật, nên nhánh này không merge được cho tới khi khai báo ca kiểm đó là chỉ chạy ở máy thu.
  Căn cứ: Không mất hay lộ dữ liệu và không ảnh hưởng người dùng cuối, chỉ chặn merge; lỗi lộ ngay khi mở PR và chỉ cần khai báo thêm một dòng, nhưng thuộc cấu hình kiểm tự động ngoài các tiêu chí đã ký nên nên làm thành việc riêng.
  file: `app/tests/ops-dong-chay.test.tsx`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 (thông điệp ghim sai chỗ, assert bắt lỗi không ghim): chiều đỏ «ảnh phải thuộc đúng tin đang mở» của DF-AC-10 dải ảnh không thể nổ với chính đột biến mà E16 khai**
  Người dùng thấy gì: Người vận hành vẫn thấy đúng ảnh của từng tin. Chỉ có điều nếu sau này ai đó làm dải ảnh lấy nhầm tin, bài kiểm vẫn báo đỏ nhưng ghi lý do không đúng chỗ, gây khó tìm nguyên nhân.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; lỗi nhầm ảnh nếu có vẫn bị bắt ở bước khác, chỉ thông báo hơi lệch, nên ghi nhận là hạn chế đã biết.
  file: `app/tests/ops-dong-chay.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên một lớp nhưng chỉ có điểm-case): vế «bài thử» trong SQL tuyên «cùng ba dấu của pipeline/lib/test-posts.mjs» nhưng không có ma trận đối chiếu với testMarker**
  Người dùng thấy gì: Với các bài thử đặt tên lạ (ví dụ nhóm có chữ có dấu hoặc khoảng trắng đầu), số bài thô trên trang có thể lệch rất ít so với số ở bản tin, mà không có bài kiểm nào báo. Các dạng bài thử thông thường đã được gạt đúng.
  Căn cứ: Mức nhẹ, chỉ lệch vài bài ở trường hợp hiếm và không làm mất dữ liệu; người dùng không tự phát hiện được nhưng hậu quả nhỏ, nên ghi hạn chế đã biết và xử lý khi gộp một định nghĩa số ở vòng sau.
  file: `app/src/lib/data-flow-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Khoá màu mới trong palette.ts thiếu tiền tố `ops` và không có dòng trong data-color.md, làm đỏ b3-check data-color và contrast (r1)**
  Người dùng thấy gì: Người vận hành không thấy gì sai trên trang; chỉ là bộ kiểm màu của dự án báo đỏ vì bảng màu mới chưa được khai theo đúng quy ước. Nếu để vậy, các lần kiểm sau sẽ luôn đỏ và che mất lỗi thật.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng để đỏ sẽ làm nhiễu mọi lần kiểm về sau; sửa rẻ và nên làm ở một việc riêng có ghi sổ quyết định về ma trận màu.
  file: `app/src/components/charts/palette.ts`
  severity: medium
  Đề xuất: new-contract

- **Trang /ops/data-flow làm đỏ ba lệnh của harness B1 Ops (shell, one-way, dialogs), trước đây ba lệnh này đều đạt (r1)**
  Người dùng thấy gì: Trang chạy bình thường với người vận hành, nhưng bộ kiểm giao diện Ops của dự án sẽ báo đỏ vì trang mới chưa được khai vào danh sách trang Ops đã chuẩn hoá.
  Căn cứ: Người dùng không gặp lỗi và không mất dữ liệu, nhưng bộ kiểm đỏ kéo dài sẽ chặn hoặc làm nhiễu các lần kiểm Ops khác; sửa là khai báo trang mới, chi phí thấp.
  file: `app/src/components/shell/nav.tsx`
  severity: medium
  Đề xuất: new-contract

- **next-env.d.ts bị commit kèm đường dẫn chế độ dev (.next/dev/types) (r1)**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ là một tệp cấu hình do máy lập trình tự sinh bị lẫn vào bản lưu và có thể đổi qua đổi lại giữa các lần chạy.
  Căn cứ: Không có hậu quả với người dùng hay dữ liệu, tự hết khi hoàn tệp về bản chính; ghi nhận hoặc hoàn tệp ở lần sửa kế tiếp là đủ.
  file: `app/next-env.d.ts`
  severity: low
  Đề xuất: known-limits

- **Số «đề xuất làm giàu» luôn là 0: lọc status = 'pending' nhưng enrichment_proposals không có trạng thái này (r1 · tệp đã đổi)**
  Người dùng thấy gì: Đầu trang Dòng chảy dữ liệu luôn ghi «0 đề xuất làm giàu» dù hàng đợi đang có việc, nên người vận hành tưởng không còn gì chờ xử lý.
  Căn cứ: Con số sai im lặng làm người vận hành bỏ sót việc đang chờ, nhưng không mất dữ liệu và chỉ là một con số tóm tắt; sửa rất rẻ nên nên gom vào một việc riêng.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Biểu đồ «Chặng theo ngày» không thêm điểm 0 cho ngày trống, nên che mất những ngày nguồn im (r1)**
  Người dùng thấy gì: Khi thu thập ngừng vài ngày, biểu đồ vẫn vẽ đủ điểm bằng các ngày cũ hơn nên trông bình thường, che mất việc nguồn đã im và không khớp với tổng ở các ô số phía trên.
  Căn cứ: Biểu đồ gây hiểu nhầm đúng lúc cần phát hiện sự cố, nhưng các ô số vẫn đúng và không mất dữ liệu; sửa không đắt nên làm ở một việc riêng.
  file: `app/src/components/ops/data-flow/stage-trend-chart.tsx`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
