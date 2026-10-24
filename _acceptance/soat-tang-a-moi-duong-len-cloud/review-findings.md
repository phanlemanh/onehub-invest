# Review findings — soat-tang-a-moi-duong-len-cloud (round 2)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở vòng này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ soát miễn trọn zaloGroups[i].name nên tên nguồn thật nằm trong tên nhóm vẫn lên cloud, trái luật pii-spl (r1)**
  Người dùng thấy gì: Nếu tên một nhóm cộng đồng có lẫn tên thật của nguồn dữ liệu, tên đó vẫn được đẩy lên cloud và hiện trên trang vận hành. Tên nguồn thật lẽ ra phải giữ kín trong máy.
  Căn cứ: Hậu quả là lộ tên nguồn thật ra ngoài máy, và đã lên cloud thì khó thu hồi; nhưng chỉ xảy ra khi tên nhóm trùng tên nguồn, và sửa không đắt nên nên mở một việc riêng.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: new-contract

- **Sổ vận hành bảo DROP COLUMN tay trên Supabase prod, trái luật 2 và đụng migration 022/031 đã commit (r1)**
  Người dùng thấy gì: Hướng dẫn vận hành bảo người trực xoá cột bằng tay trên cơ sở dữ liệu thật. Lần cập nhật cấu trúc dữ liệu kế tiếp có thể tạo lại đúng cột đó và việc đồng bộ lại bị dừng.
  Căn cứ: Không mất dữ liệu người dùng nhưng có thể làm đồng bộ lên cloud kẹt lặp đi lặp lại, và cấu trúc cloud lệch khỏi bản gốc không ai theo dõi; cần một đường chính thống nên đáng làm riêng.
  file: `docs/ops/runtime-map.md`
  severity: medium
  Đề xuất: new-contract

- **TIER_A_TABLES thiếu enrichment_proposals và ops_audit, hai bảng mà header migration đã đánh dấu tầng A (r1)**
  Người dùng thấy gì: Hai bảng dữ liệu nội bộ về đề xuất làm giàu và nhật ký vận hành, vốn chỉ được ở máy local, nếu có dòng trên cloud thì cổng chặn rò rỉ vẫn báo xanh. Dữ liệu nội bộ có thể nằm trên cloud mà không ai biết.
  Căn cứ: Hậu quả là có thể lộ dữ liệu nội bộ mà cổng không cảnh báo, nhưng hiện chưa có dấu hiệu hai bảng này được đẩy lên; thêm tên vào danh sách rất rẻ nhưng cần Mạnh chốt danh sách tầng A.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2, fixture viết tay đúng khuôn bên đọc: AC-9 tự viết phản hồi /api/v1/ops/collections, không đi vòng push-ops-facts → ops_heartbeat → route (r1)**
  Người dùng thấy gì: Phép thử trang nguồn dữ liệu dùng dữ liệu mẫu viết tay, nên nếu sau này khâu gửi bản tin đổi cách đặt tên trường, phép thử vẫn báo xanh trong khi trang có thể hiện sai.
  Căn cứ: Chỉ là phép thử yếu hơn, người dùng không mất gì ngay, và các phép thử khác trong repo đã bao phần nối ghi-đọc; ghi lại hạn chế là đủ.
  file: `app/tests/soat-tang-a.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3/5, so một hàm với chính nó và không đối chiếu kỳ vọng từng ca: AC-6 «cùng kết quả từng ca» (r1)**
  Người dùng thấy gì: Phép thử so khớp tên nguồn khó bắt được lỗi nếu bộ soát bỏ sót vài tên, vì nó chỉ so hai đường với nhau chứ không so với đáp án mong đợi từng ca.
  Căn cứ: Chỉ làm giảm độ tin cậy của phép thử chứ không làm lộ dữ liệu; bộ soát thật vẫn chạy, nên ghi lại hạn chế là hợp lý.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6, đường dẫn trỏ về checkout chính và HOME thật: AC-10 đo dữ liệu máy tác giả và xanh suông ở nơi khác (r1)**
  Người dùng thấy gì: Phép thử trên bản tin thật chỉ có ý nghĩa ở máy của Mạnh; trên máy khác hoặc CI nó có thể báo xanh dù chẳng kiểm được gì.
  Căn cứ: Không ảnh hưởng người dùng cuối vì đây là kiểm tra nội bộ; chỉ cần ghi rõ phép thử này chỉ đáng tin trên máy thu.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
