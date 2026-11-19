# GT5 `khoa-gom-hai-tang` — Bảng phủ ca (S1, đo chỉ đọc ngày 19/11)

Số đếm trên DB máy thu, chỉ đọc. Chưa viết mã. Tệp không chép chữ bài của tin.

## 1. Bảng phủ ca

Tổng thể: **7.307 tin S03 đang sống, 76.508 bài.**

| Chiều | Giá trị | Số tin | Xử lý đề xuất | Ai đọc đầu ra phía sau |
|---|---|---:|---|---|
| Số bản chữ của tin | 1 bản | 5.914 | Giữ nguyên tin, `offer_id` không đổi | Mọi người đọc của `sale_offers` |
| | 2–3 bản | 1.067 | Xét gộp tầng hai | Như trên |
| | 4–9 bản | 254 | Xét gộp tầng hai | Như trên |
| | Từ 10 bản | 72 | Xét gộp tầng hai, soát kỹ rổ hàng (GT8) | Như trên |
| Nhánh khoá hiện tại | Đủ phường và diện tích | 2.590 | Khoá không có người đăng: cần xét lại | GT6, `xep-hang-gia` |
| | Thiếu phường hoặc diện tích | 4.717 | Khoá có người đăng và mã | GT6, `xep-hang-gia` |
| Người đăng trong tin | Từ 2 người | 6 | Quyết định 10/11: khác người là hai tin | Danh bạ Người, `sellers` |
| Mã toà, căn | Bộ tìm cũ đọc được | 3.896 | Giữ | PL20 `block_raw`, GT6 |
| | Bộ tìm mới đọc được | 4.582 | Nhận chữ thường, 1–4 chữ số | PL20 `block_raw`, GT6 |
| | Hai bản chữ khác mã, chỉ bộ mới thấy | 79 | Tách tin | PL20, lát nhãn `hai-khu-ghep-b` |
| Phân khu | Hai bản chữ khác phân khu theo tên danh bạ | 12 | Tách tin | `offer_project`, PL20 |
| | Hai bản chữ khác phân khu theo tên viết tắt | 160 | Tách tin, cần bổ sung từ điển viết tắt | `offer_project`, PL20 |
| Tin có ít nhất một dấu hiệu tách | Toàn bộ | 234 | Lập bảng `offer_id` cũ → mới | Mọi người đọc của `sale_offers` |
| | Trong căn hộ Ocean Park 1, Grand Park | 220/5.937 (3,7%) | Bật sau khi PL20 chấm xong | PL20 AC-8, tệp đóng băng |
| Từ điển phân khu | Tin thuộc dự án có nút phân khu | 6.982/7.086 | Dự án chưa có nút: khai ở Cổng Phạm vi | Bước gom |

Nhánh khoá đếm gần đúng theo cột `area_id` và `area_m2` của tin.

## 2. Thước

Nhãn audit 09–10/11 còn trên máy thu, ở `research-local/s03-gom-tin-audit-20261109/`.

| Mẫu | Số dòng | Còn đối chiếu được | Nhãn |
|---|---:|---:|---|
| Tin nhiều bản chữ | 80 | 80/80 | 34 cùng căn, 20 khác căn, 18 rổ, 5 không rõ, 3 bài tìm |
| Cặp tin nghi tách nhầm | 40 | 40/40 | 20 khác căn, 10 rổ, 6 cùng căn, 3 không rõ, 1 không phải tin |

**Đo thử dấu hiệu tách trên mẫu 80 tin (chưa phải khoá thật):**

| Nhãn người | Dấu hiệu nói tách | Dấu hiệu nói giữ |
|---|---:|---:|
| Khác căn | 15 | 5 |
| Cùng căn | 0 | 34 |

- Không tin cùng căn nào bị tách nhầm, nhưng còn 5/20 tin khác căn chưa bắt được.
- Gộp nhầm còn lại ước 5/39 = 12,8% trên tin có nhãn cùng hoặc khác căn, **chưa đạt ngưỡng dưới 5%** của hàng.
- Danh sách viết tắt của phép thử được chọn sau khi đọc vài dòng của chính mẫu này, nên số trên có thể lạc quan. Cần một mẫu giữ riêng để chốt.
- Nhãn được gắn trên thành phần tin ngày 09/11; bài mới vào sau đó đang được tính cùng.

## 3. Việc phải chốt ở Cổng Phạm vi

1. Cách bắt 5 tin khác căn còn sót, và mẫu giữ riêng để đo lại.
2. Từ điển viết tắt phân khu (`ori`, `rb`, `bs`, `gh`…): danh bạ hiện chưa có các tên này.
3. Loại nhiễu của bộ tìm mã mới: `coc#`, `ocp#`, `gd#`, `x##`.
4. Cửa sổ nối bản chữ (đề xuất 7 ngày) và ngưỡng chữ giống (đề xuất 0,9) khi một bên thiếu trường.
5. Nhánh khoá đủ phường và diện tích hiện không có người đăng, trái quyết định 10/11 là khác người thì hai tin.

## 4. Rào của giám sát

- Khoá mới nằm sau công tắc mặc định tắt; cách lùi là tắt công tắc.
- Chỉ bật trên máy thu sau khi PL20 chấm xong và đo AC-8.
- Hồ sơ có bảng đổi `offer_id` cũ → mới cho tệp đóng băng và lát nhãn `hai-khu-ghep-b` của PL20.
- Có phép chạy thử trên bản sao DB trước khi áp.
- GT8 bật trước GT5, vì GT5 chỉ gom bài một căn.
