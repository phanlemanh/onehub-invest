## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 — lời hứa là quan hệ («tệp không đổi so với merge-base») nhưng phép đo chỉ chạy test xanh**
  Người dùng thấy gì: Lúc này các ca kiểm cũ vẫn nguyên và đều xanh, nên người dùng không bị ảnh hưởng. Về sau nếu ai đó lặng lẽ nới các ca kiểm cũ, bước chấm vẫn báo đạt và lỗi so đường có thể lọt qua.
  Căn cứ: Hiện chưa có hậu quả nào với người dùng vì các ca kiểm cũ chưa bị đụng, rủi ro chỉ phát sinh nếu về sau có người sửa lén; ghi lại hạn chế này rẻ hơn nhiều so với dựng thêm bước kiểm.
  file: `_acceptance/duong-thang-n-khong-dau/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

