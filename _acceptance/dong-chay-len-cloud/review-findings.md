# Review findings: dong-chay-len-cloud (round 1)

## Trong hợp đồng

- **Hình dạng 5 (tuyên cả lớp nhưng chỉ kiểm vài điểm): DC-AC-3 «câu tổng hợp chỉ chạm data_flow_snapshot» chỉ chặn hai mẫu cụ thể**
  AC: AC-3
  file: `app/tests/dong-chay-cloud.test.tsx:407`
  severity: medium
  source: measurement
  detail: Tên ca và E3 tuyên cho cả lớp: mọi câu tổng hợp mà getDataFlow gửi đi chỉ chạm data_flow_snapshot. Assert thật ở dòng 407 lại là danh sách đen hai mẫu: `assert.ok(!seen.some((s) => /enrichment_proposals|GROUP BY/i.test(s)))`, cộng thêm việc có một câu đọc data_flow_snapshot (dòng 406). Không có ma trận viết trước kiểu «mọi câu trong `seen` thuộc tập cho phép {đọc data_flow_snapshot, câu records sale_offers, câu bài gốc stg_*, câu review_queue}». Bằng chứng là chính lúc này getDataFlow vẫn gửi một câu tổng hợp ngoài bảng tính sẵn (`SELECT count(*) AS review FROM review_queue …`, data-flow-queries.ts:220) và ca vẫn xanh. Nếu sau này thêm lại một câu như `SELECT count(*) FROM sale_offers …` hay một câu sum/count có FILTER mà không dùng GROUP BY, ca này không bắt được.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khối dataFlow trên cloud bị ép kiểu thẳng, không kiểm khuôn như các khối bản tin khác**
  Người dùng thấy gì: Nếu bản tin từ máy thu bị hỏng hoặc lệch phiên bản, trang Dòng chảy trên cloud có thể sập cả vùng, hoặc vẽ số sai như số thật thay vì báo «không đo được».
  Căn cứ: Chỉ xảy ra khi bản tin bị hỏng hoặc lệch phiên bản, hiếm khi gặp. Người vận hành tải lại hoặc chờ lượt đẩy sau là hết, không mất dữ liệu. Sửa sau không đắt.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **Máy thu luôn coi số tính sẵn là «fresh» bất kể tuổi, nên khi làm tươi gãy thì trang local im lặng hiện số cũ**
  Người dùng thấy gì: Nếu bước làm tươi số liệu hỏng nhiều lượt liền, trang trên máy thu vẫn hiện số cũ như số hiện hành mà không có cảnh báo, chỉ có một dòng chữ xám ghi giờ tính. Người vận hành có thể tin nhầm số đã cũ.
  Căn cứ: Số cũ được trình bày như số mới là hậu quả khá nặng với người chỉ nhìn trang hằng ngày. Dữ liệu không mất và vẫn có mốc giờ nhỏ để đối chiếu. Thêm cảnh báo sau là việc nhỏ, rẻ.
  file: `app/src/lib/data-flow-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Lỗi 42P01 (bảng data_flow_snapshot chưa có) bị nuốt thành «none», kèm chữ báo sai nguyên nhân**
  Người dùng thấy gì: Khi migration chưa áp lên DB máy thu, trang hiện «chờ làm tươi» trong khi chờ mãi cũng không có số. Người xem không biết nguyên nhân thật là thiếu bước cài đặt.
  Căn cứ: Chỉ xảy ra trong khoảng giữa lúc gộp và lúc áp migration, và được gỡ bằng một lần áp migration. Không mất dữ liệu, chỉ làm trang local trống tạm thời kèm chữ gây hiểu nhầm. Sửa chữ báo rất rẻ.
  file: `app/src/lib/data-flow-queries.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
