---
slug: dong-chay-len-cloud
at: 2026-10-27T01:17:22Z
verdict: findings
p0: 4
p1: 1
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | E6 chỉ dựng component trong jsdom, không đi qua route page và nhánh nhận ra cloud — lớp lỗi [df0-dem-de-xuat-lam-giau#F2] | page.tsx giữ cổng stg_* cũ trước component; E6 xanh, prod vẫn khung chỉ-máy-thu | Ca render đúng route với query tiêm vào lược đồ không stg_*; đột biến giữ cổng cũ đỏ | fixed: DataFlowContent rời page.tsx sang mô-đun dùng chung (route và bài kiểm cùng một mô-đun); E6 gọi chính mô-đun đó trên lược đồ không stg_*, đối chứng dương nhánh máy thu, đột biến giữ cổng stg_* cũ đỏ; DOM so chặng, đủ trường lõi, nhóm, ngày |
| P0 | evals | E4 chỉ kiểm khoá cấp một; phần tử lồng không có danh sách viết trước, Hỏi-2 là khó đảo | 600 chép CTE nhóm mang mã nhóm; khoá cấp một vẫn đúng, E4/E5 xanh, mã nhóm lên cloud mỗi 15′ | Ma trận khoá mọi tầng, quét đệ quy, đột biến groupId và offerId riêng | fixed: AC-4/E4 quét đệ quy mọi đường khoá theo ma trận viết trước cho cấp một và từng phần tử; hai đột biến groups[].groupId, sources[].offerId đỏ nêu đường khoá; đối chứng dương bản tin thật 0 vi phạm |
| P0 | design | Lối chết của d-7 (bỏ design-pass) không thật; mặt cloud không có ui-check | Alert chồng số trên cloud; jsdom chỉ dò chữ nên xanh | Lối chết thật hoặc ui-check chế độ cloud | fixed: d-7 thay bằng dòng có lối chết thật — migration chưa merge không được thử trên :5433 (giám sát dặn 27/10) nên không bản chạy nào có bảng 051 trước merge, cloud chỉ có khối sau merge; AC-11 ui-check máy thu cũng bỏ vì cùng lý do (dòng «bỏ ui-observed»); mặt prod đo ở phiên nghiệm thu sau ship, ghi ở Đường đo |
| P0 | design | Độ tươi theo measured_at của lần đẩy, 600 gãy vẫn «tươi»; câu trích d-4 cắt trước phần chữ trạng thái; E7 đọc ngưỡng từ hằng code | 600 gãy nhiều giờ, cloud ghi «số đo lúc <giờ hiện tại>», E7 xanh | Độ tươi theo computed_at; ngưỡng viết trước 45′ | fixed: measured_at của khối = computed_at cũ nhất của bảng (AC-4); d-4 thay bằng dòng trích hàng «Cũ > 45′» của bảng ADR-0014; E7 có hằng viết trước 45×60×1000 so FACTS_STALE_MS và ca computed_at 3 giờ trước + bản tin mới → Alert theo giờ computed_at |
| P1 | contract | Ngưỡng SỐNG không có Đường đo; không ca nào đo máy thu = cloud; E6 chỉ so «Bài nhận» | Nhánh cloud lệch days một ngày; E6 xanh, prod khác máy thu | Section Đường đo; ca deep-equal hai nhánh, đột biến lệch ngày | fixed: thêm section Đường đo (vế prod → phiên nghiệm thu sau ship); AC-10/E10 deep-equal phần tổng hợp hai nhánh ba cửa sổ, đột biến dời days[0].day đỏ; E6 so chặng, đủ trường lõi, nhóm, ngày |
