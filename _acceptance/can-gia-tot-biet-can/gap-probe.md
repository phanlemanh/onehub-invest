---
slug: can-gia-tot-biet-can
at: 2026-11-02T23:52:39Z
verdict: findings
p0: 4
p1: 1
p2: 0
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals | AC-5 đòi căn thiếu thước, thiếu m² nằm trong bảng, trong khi `dealsSql` đòi `bait_gap_pct` khác NULL nên hai ca đó không có hàng; E5 không có đối chứng đỏ; AC-5 thiếu tag | Thợ bơm thẳng dữ liệu vào lưới để qua ca; eval xanh, thực tế «thiếu thước» chỉ hiện ở trang căn rời danh sách | Tách ma trận theo đường đi, số assert bằng số phần tử, đối chứng ghim | fixed: đã đọc `dealsSql`, xác nhận; AC-5 tách năm trường qua bảng, hai trường qua trang; thêm tag; E5 có đối chứng ghim |
| P0 | contract, evals, design | Không có eval vai nhân cloud, bảng trên cloud không có trạng thái; E10 không ghim dạng số, E11 không có đối chứng, không assert cấm tên nguồn thật [people-hien-so-goc#F2] | Nhánh cloud không qua `dealTheoVai`, vai Người xem trên production nhận SĐT; bảng cloud đọc `media` ra khối lỗi; so một dạng số ra 0 khớp giả | Ma trận vai trên lược đồ `CLOUD_ALLOW`, ST-ds-cloud, sáu dạng số, tên nguồn gài fixture | fixed: AC-7 và E7 phủ bảng, sheet, trang trên cloud theo bốn vai có đối chứng; thêm ST-ds-cloud; E6, E10 sáu dạng; E11 đối chứng; E6 gài tên nguồn |
| P0 | decisions, design, evals | Dòng tải hết 30 căn nói không ảnh hưởng người dùng là sai: `?can=` của căn ngoài danh sách không có gì để vẽ; ba dòng máy quyết thiếu căn cứ | Mở `?can=X` sau khi tin quá 45 ngày ra bảng trần, không báo lý do, đúng ca Hỏi-1 hứa không gãy | Chốt một hành vi, E7 đủ bốn lý do qua `?can=`, phép khi và chỉ khi giữa `getDeals` và `getDeal` | fixed: `?can=` ngoài danh sách chuyển sang trang một căn (dòng mới); E7, E8 đo; ba dòng viết lại ở stage gate1 đúng lời Mạnh chốt, sửa giá phải trả |
| P0 | decisions | Dòng ảnh, chữ bài trên cloud ghi một lối nhưng lối chờ TV9, TV10 không chết, và kèm lựa chọn chỉ người có: ngưỡng đọc ở máy thu; dòng bỏ `?path=` nêu lối chết chưa đủ | Mạnh ký và tưởng ngưỡng SỐNG áp cho đội từ xa; trên cloud đa số căn chỉ đạt 3 trên 5 câu | Câu hỏi trên thẻ về nơi đọc ngưỡng, Đường đo ghi nơi đọc | human-gate1: Hỏi-6, máy khuyên đọc ở máy thu cho hàng này; fixed: dòng `?path=` viết lại nêu đúng lý do; Hỏi-1 tới Hỏi-5 đã nằm trên thẻ, dòng gate1 ghi khi Mạnh trả lời |
| P1 | contract, evals, design | Trạng thái tải, trống, lỗi của bảng không có AC; tab mặc định và tab rỗng chưa chốt; «Đủ để gọi» hôm nay tối đa 1 căn; E9 có bước không làm được trên 4 căn thật | DB lỗi mà mọi eval xanh; phiên chấm sớm gặp tab 0 căn; người chấm ghi đạt bước không thấy | Ca cho từng trạng thái, phân bố ba tab, nhánh khai trước ở E9 | fixed: AC-7 và E7 phủ trạng thái bảng; tab mặc định «Tất cả», thêm ST-ds-tab-trong, dòng sổ định nghĩa; E8 in phân bố; E9 có nhánh «không đo được trên dữ liệu thật» |
