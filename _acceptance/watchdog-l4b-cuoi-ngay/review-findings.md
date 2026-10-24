# Review findings: watchdog-l4b-cuoi-ngay (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC — 12/12 eval đạt)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **gateway.log bị coi là «file mới» (khác inode hay số dòng lớn hơn thật) thì watchdog quét lại cả lịch sử và tắt gateway vì sự cố cũ**
  Người dùng thấy gì: Nếu tệp log của gateway bị ghi lại cùng tên (sao lưu rồi khôi phục, sửa bằng công cụ ghi đè) hoặc marker còn định dạng cũ, watchdog gặp lại các dòng agent-turn của sự cố 20/10 và tắt Zalo, tin ngừng chảy tới khi có người bật lại. Lỗ này đã có trên main từ trước, vòng này không gây ra; chế độ «history» mới chỉ chặn được ca marker hỏng trường số.
  Căn cứ: Hướng hỏng là tắt nhầm (an toàn, không gửi tin vào nhóm) chứ không phải mù, nhưng mỗi lần tắt nhầm là mất tin cho tới khi người khởi động lại, và các ca kích hoạt đều hiếm; đáng mở một việc riêng thay vì giữ bản sửa marker đang tốt hơn main.
  file: `scripts/zalo-watchdog.sh`
  severity: medium
  Đề xuất: new-contract
