---
context: standalone
reaction: nac-1
---
# Design-pass trang-chi-tiet-tin

Chạy trên route thật, DB thử `oneinvest_tct`, phiên máy tự nhìn sau khi có mã (Cổng Phạm vi đã ghi `bỏ design-pass` vì lúc đó chưa có mã).

## Ma trận đã xem

| Ca | Khổ | Chủ đề | Kết quả |
|---|---|---|---|
| Tin S06 đủ, có số chưa xác minh | rộng | tối | Đọc được; hai cột; liên hệ ở cột phụ |
| Tin S03 có nhãn tin | 375 | tối | Không tràn ngang; khối liên hệ cách đỉnh 328 px |
| Tin cấp thị trường | rộng | tối | Tên thị trường, không liên kết, không khối tin cùng tiêu chí |
| Id lạ | rộng | tối | 404, câu chung, nút về danh sách |
| Thẻ trên trang Bán | rộng | sáng | Thân thẻ và tên mở tin; liên kết phường đi trang phường |

Ma trận đủ của E1u, E9 chấm ở S4.

## Findings đã sửa

- Khối giá lặp lại dòng thông số đã có ở tiêu đề: bỏ.
- Studio hiện «Phòng ngủ 0»: đổi thành «Studio».
- Thanh điều hướng tô «Cho thuê» cả khi xem tin bán: bỏ tô với id `offer_…`.
