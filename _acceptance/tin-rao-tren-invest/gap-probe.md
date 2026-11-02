---
slug: tin-rao-tren-invest
at: 2026-11-02T03:40:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Thiết kế và sổ còn chữ của hướng tab cũ: lỗi «vài phút» ở tab Tin rao. Bán nay là mặc định, nên cả trang không `kind` lỗi tới khi có tường lửa và catch-up, mà gói Vercel chưa kiểm. Không eval đo sync bản mới trên cloud thiếu cột. | Ký, gộp, kéo về rồi mới biết gói không có giới hạn tần suất; mọi link listings lỗi nhiều ngày; mốc 05/11 trượt mà eval vẫn xanh. | Kiểm gói trước; thay dòng sổ; eval sync trên lược đồ thiếu cột và `?kind=sale`, `?kind=rent_st` trước catch-up. | human-gate1: đảo tường lửa lên trước gộp, cửa sổ lỗi còn vài phút; sổ, AC-3, E3, Notes, hình đã sửa. Tra tài liệu Vercel: có ở mọi gói, Hobby một luật, có báo cáo đòi nâng gói khi chọn 429; gói tài khoản chưa xác định nên phép thử 429 là bước đầu. Đọc mã: sync mới chỉ cảnh báo lệch schema, không dừng; E4c đo. |
| P0 | contract, design | AC-1 chỉ xét theo cột; tên và số của tin không hiện vẫn lên cloud. Phạm vi dòng là lựa chọn của người, khó đảo. Không thước đo vai đọc trực tiếp trên Supabase. | Mạnh ký «hai cột» và tưởng chỉ tin hiện được mới lên; số của tin cũ nằm trên cloud; nếu anon đọc được thì lộ cả danh bạ không qua tường lửa. | Dòng sổ chỉ-người về phạm vi dòng; đếm trên lược đồ vai cloud; kiểm anon trước sync. | human-gate1: câu hỏi mở hai cột nay nêu rõ mọi dòng, kèm lối khác. Đo: bảng có 0 dòng S02, S08; E2b giữ mốc. Sync đã có `gateAnon` dừng lượt trước khi gửi nếu anon đọc được, ghi ở thiết kế và Notes; không dựng thêm cơ chế. |
| P1 | evals, design | «Người gọi cũ không đổi» chỉ đo tập khoá; trần mới có thể rơi vào nhánh cũ; không có bảng link nội bộ không `kind`; E8 dựa vào tệp test đang sửa. Cùng dạng [chuyen-huong-ma-thi-truong#F2]. | `?market=…&limit=200` chỉ còn 50 dòng mà E4 xanh; khách từ trang chi tiết thuê ngắn hạn về danh sách rơi sang Bán. | So từng dòng với bản trước vòng; bảng link; so diff listings-browse. | fixed: E4 thêm ma trận nhánh cũ và đối chứng đỏ; sửa link ở `insight-page` và `listing-sections` sang `?kind=rent_st`, sửa mô tả marketing; E8 thêm bảng link và giới hạn diff của listings-browse. |
| P1 | evals, design | Skeleton, lỗi vùng, nút khoá, ảnh hỏng, tên trống không có ô đo; AC-7 đi qua giao diện mà không tag; E7 không có ca kèm lọc; E10 không hỏi S02, S08; E8u bật lọc có số rồi mới đổi sắp xếp trong khi chỉ có 3 tin có số. | Vùng lỗi thiếu Thử lại mà eval xanh, đúng màn khách thấy trước catch-up; người chấm E8u gặp 0 tin ở bước sắp xếp. | Thêm ô E9, ST tên trống, ô ward ở E7, tag AC-7, câu E10, đổi bước E8u. | fixed: E9, E7, E7u mới, AC-7 tag cross-layer, ST-ten-trong, E10, E8u. |
| P2 | contract, design | Ba bản số cho cùng câu hỏi; «chưa hứa ổn định» không có ở đâu đo. | Mạnh đọc ba con số; người ngoài nối MCP rồi vỡ khi đổi trường. | Một bộ số kèm định nghĩa; E6 assert câu trong mô tả. | fixed: hồ sơ dùng một bộ 39.827 theo điều kiện `lib/offers-public.ts`, sổ thay dòng cũ; E6 đo câu chưa hứa ổn định có đối chứng đỏ. |
