## Trong hợp đồng

- **Ca pii-cot (b) «qua bên ghi» không đi tới bên ghi: gatePii dừng lượt trước khi đọc local, nên ca này chỉ đo lại ca (a)**
  AC: AC-7
  file: `pipeline/scripts/check-cloud-sync.mjs:1142`
  severity: low
  source: bugs
  detail: Ca (b) thêm `so_giay_to` vào CẢ local LẪN cloud rồi coi PASS là bằng chứng rằng một cột local ngoài danh sách bị chặn ở đường ghi, cloud không nhận giá trị nào. Nhưng trong `syncOnce`, `gatePii(exec)` (sync-cloud.mjs, bước 1b) chạy TRƯỚC bước đọc local và chỉ xem catalog của cloud. Vì cloud đã có cột `sale_offers.so_giay_to`, lượt sync ném `PhaseError("gate", "LEAK GATE FAIL (trước khi gửi): cột ngoài danh sách cho phép: sale_offers.so_giay_to")` trước khi đọc dòng local nào, nên đường ghi không bao giờ chạy. Đây đúng là cơ chế của ca (a). Kiểm tra phụ `count(*) WHERE so_giay_to IS NOT NULL = 0` vì vậy luôn đúng, kể cả khi đường ghi có lỗi. Thông điệp PASS và nội dung mong đợi của E7 trong evals.yaml («ĐỎ-ĐÚNG qua bên ghi: cột local ngoài danh sách → gate đỏ, cloud không mang cột») mô tả một hành vi mà ca này không đo. Muốn đo thật đường ghi thì phải có cột ở local mà cloud không có (khi đó selectList loại cột chưa duyệt), hoặc cho gate trước tạm qua. Còn không thì nên đổi nhãn cho khớp: đây chỉ là cổng soát catalog cloud trước khi gửi.
  lý do thuộc hợp đồng: AC-7(b) đòi cột ấy có ở LOCAL rồi sync-cloud chạy «đi qua bên ghi», nhưng ca đo thực tế bị gate chặn trước khi đọc local nên phần bên ghi không được kiểm.

- **Hình dạng 4, khẳng định âm tính đứng một mình: ca pii-cot (b) «qua bên ghi» luôn đúng vì gate chặn trước khi đọc local**
  AC: AC-7
  file: `pipeline/scripts/check-cloud-sync.mjs:1143`
  severity: medium
  source: measurement
  detail: Ca (b) thêm cột `so_giay_to` có giá trị ở LOCAL và một cột cùng tên ở CLOUD, rồi khẳng định «cột local ngoài danh sách → gate đỏ, cloud không mang cột» bằng `SELECT count(*) ... WHERE so_giay_to IS NOT NULL` = 0. Nhưng `gatePii` chỉ đọc catalog CLOUD và chạy ở bước 1b, trước khi đọc local (sync-cloud.mjs: «dừng trước khi đọc local và tráo»). Gate đỏ là do cột trên cloud, giống hệt ca (a); cột local không đóng vai trò gì. Con số 0 giá trị khác rỗng vì thế đúng theo cấu trúc, bất kể bên ghi có lọc cột theo CLOUD_ALLOW hay không. Ca không có đối chứng dương (ví dụ bản sao gỡ gatePii để cho thấy cột local thật sự lên được cloud), nên nhãn «qua bên ghi» không được đo.
  lý do thuộc hợp đồng: AC-7(b) đòi chứng minh bảng cloud không mang cột ấy sau khi sync đi qua bên ghi, nhưng con số 0 luôn đúng do gate chặn trước và không có đối chứng dương.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ soát miễn trọn zaloGroups[i].name nên tên nguồn thật nằm trong tên nhóm vẫn lên cloud, trái luật pii-spl**
  Người dùng thấy gì: Nếu tên một nhóm cộng đồng có lẫn tên thật của nguồn dữ liệu, tên đó vẫn được đẩy lên cloud và hiện trên trang vận hành. Tên nguồn thật lẽ ra phải giữ kín trong máy.
  Căn cứ: Hậu quả là lộ tên nguồn thật ra ngoài máy, và đã lên cloud thì khó thu hồi; nhưng chỉ xảy ra khi tên nhóm trùng tên nguồn, và sửa không đắt nên nên mở một việc riêng.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: new-contract

- **Sổ vận hành bảo DROP COLUMN tay trên Supabase prod, trái luật 2 và đụng migration 022/031 đã commit**
  Người dùng thấy gì: Hướng dẫn vận hành bảo người trực xoá cột bằng tay trên cơ sở dữ liệu thật. Lần cập nhật cấu trúc dữ liệu kế tiếp có thể tạo lại đúng cột đó và việc đồng bộ lại bị dừng.
  Căn cứ: Không mất dữ liệu người dùng nhưng có thể làm đồng bộ lên cloud kẹt lặp đi lặp lại, và cấu trúc cloud lệch khỏi bản gốc không ai theo dõi; cần một đường chính thống nên đáng làm riêng.
  file: `docs/ops/runtime-map.md`
  severity: medium
  Đề xuất: new-contract

- **TIER_A_TABLES thiếu enrichment_proposals và ops_audit, hai bảng mà header migration đã đánh dấu tầng A**
  Người dùng thấy gì: Hai bảng dữ liệu nội bộ về đề xuất làm giàu và nhật ký vận hành, vốn chỉ được ở máy local, nếu có dòng trên cloud thì cổng chặn rò rỉ vẫn báo xanh. Dữ liệu nội bộ có thể nằm trên cloud mà không ai biết.
  Căn cứ: Hậu quả là có thể lộ dữ liệu nội bộ mà cổng không cảnh báo, nhưng hiện chưa có dấu hiệu hai bảng này được đẩy lên; thêm tên vào danh sách rất rẻ nhưng cần Mạnh chốt danh sách tầng A.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: AC-9 tự viết phản hồi /api/v1/ops/collections, không đi vòng push-ops-facts → ops_heartbeat → route**
  Người dùng thấy gì: Phép thử trang nguồn dữ liệu dùng dữ liệu mẫu viết tay, nên nếu sau này khâu gửi bản tin đổi cách đặt tên trường, phép thử vẫn báo xanh trong khi trang có thể hiện sai.
  Căn cứ: Chỉ là phép thử yếu hơn, người dùng không mất gì ngay, và các phép thử khác trong repo đã bao phần nối ghi-đọc; ghi lại hạn chế là đủ.
  file: `app/tests/soat-tang-a.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3/5, so một hàm với chính nó và không đối chiếu kỳ vọng từng ca: AC-6 «cùng kết quả từng ca»**
  Người dùng thấy gì: Phép thử so khớp tên nguồn khó bắt được lỗi nếu bộ soát bỏ sót vài tên, vì nó chỉ so hai đường với nhau chứ không so với đáp án mong đợi từng ca.
  Căn cứ: Chỉ làm giảm độ tin cậy của phép thử chứ không làm lộ dữ liệu; bộ soát thật vẫn chạy, nên ghi lại hạn chế là hợp lý.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6, đường dẫn trỏ về checkout chính và HOME thật: AC-10 đo dữ liệu máy tác giả và xanh suông ở nơi khác**
  Người dùng thấy gì: Phép thử trên bản tin thật chỉ có ý nghĩa ở máy của Mạnh; trên máy khác hoặc CI nó có thể báo xanh dù chẳng kiểm được gì.
  Căn cứ: Không ảnh hưởng người dùng cuối vì đây là kiểm tra nội bộ; chỉ cần ghi rõ phép thử này chỉ đáng tin trên máy thu.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
