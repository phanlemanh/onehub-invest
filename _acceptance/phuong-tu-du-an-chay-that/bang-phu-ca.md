# Bảng phủ ca DA45 (đếm chỉ đọc từ DB máy thu, 19/11)

Phạm vi đếm: `sale_offer_records` nguồn S03, cả tin đang ẩn (7.724 dòng). Tin đang hiện theo view `sale_offers`: S03 7.309, trong đó 72 có
phường; S05 30 (13 có phường); S06 119.432 (117.179 có phường). «Phường» là `areas.region_type = 'submarket'`.

| Ô phường hiện có | Dự án trên bài | Phát biểu phường từ thẻ nhóm | Số tin | Việc của hàng | Ai đọc phía sau |
|---|---|---|---:|---|---|
| tỉnh | một dự án, một phường | trùng phường dự án | 6.795 | nhận phường | giá tốt theo vị trí, trường lõi, sync cloud, cổng Invest |
| tỉnh | một dự án, một phường | khác phường dự án | 20 | **phải xem trước khi ghi** | như trên |
| trống | một dự án, một phường | khác phường dự án | 12 (đo 20/11, thêm ở S4) | theo lối Hỏi-1: nhận phường dự án | như trên |
| trống | một dự án, một phường | trùng phường dự án | 452 | nhận phường | như trên |
| trống | một dự án, một phường | không có | 107 | nhận phường | như trên |
| phường | một dự án, một phường | không có | 75 | giữ cột; 43 tin có phường khác phường dự án | như trên |
| phường | không có | không có | 3 | không đổi | như trên |
| tỉnh | nút dự án không có phường | có | 6 | không đổi | như trên |
| tỉnh | không có | có | 72 | ngoài phạm vi: cần đọc phát biểu thẻ nhóm | như trên |
| tỉnh | không có | không có | 9 | không đổi | như trên |
| trống | không có | không có | 170 | không đổi | như trên |
| trống | không có | có | 3 | ngoài phạm vi: cần đọc phát biểu thẻ nhóm | như trên |
| tỉnh | nhiều dự án khác nhau | có | 4 | không đổi: luật DA9 không kế thừa | như trên |
| trống | nhiều dự án khác nhau | có | 8 | không đổi: luật DA9 không kế thừa | như trên |

Nguồn S05, S06: ngoài phạm vi, vì luật DA9 chỉ đọc phát biểu dự án trên bài S03 và S06 đã có phường ở 98% tin.

## Hai nhóm cần người xem (tin đang hiện, đếm 19/11)

- **20 tin có phường theo thẻ nhóm khác phường theo dự án.** Đề bài của giám sát nêu 13; số 20 đếm cả tin mà thẻ nêu hai phường.
- **10 trong 20 tin ấy đổi tỉnh khi nhận phường:** 9 tin Vinhomes Ocean Park 2 và 1 tin Ecopark đang ở cấp Hà Nội sẽ sang phường thuộc Hưng Yên.
