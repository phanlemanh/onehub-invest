---
slug: can-gia-tot-sua-ba-loi
at: 2026-11-03T22:01:42Z
verdict: findings
p0: 3
p1: 2
p2: 0
claims_input: ok
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ bỏ ui-observed chỉ nêu Ngoài-10 nhưng bỏ cả ba mục; Ngoài-5, Ngoài-9 xem được trên DB máy thu [can-gia-tot-biet-can#F4] | Câu mới dài hơn vỡ nhãn ở 390 px, jsdom không có layout nên xanh | Frame chỉ đọc ở 390 px và màn hình | fixed: thêm AC-5, E7; hạng 31 ghi giới hạn ở Notes; dòng sổ mới supersedes |
| P0 | contract | Dòng không lọc Na trích câu không quyết gì về Na | Na là N/A thì 47 tin hiện tên giả và ca kiểm ghim nó | Đo 47 tin theo sender và nguồn | fixed: đo 04/11 là một người thật (2 SĐT, một nhóm, 47/47 trùng sender); căn cứ đổi sang tenTin có sẵn |
| P0 | contract | Loại Invest không có số đo; căn cứ dòng bỏ quét và dòng crumb trích câu không quyết [so-ghep-s06-nhan-danh-ba#F1] | Trang công khai vẫn hiện unknown sau mốc 05/11 mà không ai quyết | Đếm unknown qua điều kiện hiện công khai | fixed: đo 0 tin; dòng descope riêng; tách và viết lại căn cứ |
| P1 | design, evals | Chỉ tuyên một nguồn giới hạn; E3 chấm vài hạng; Trục C khai ca không có | Đồng hạng ở ranh: crumb mở ?can= rồi chuyển ngược, E3 vẫn xanh | Quan hệ trên cả 33 căn, đồng hạng, căn cần xác minh ngoài giới hạn, đối chứng hằng | fixed: viết lại AC-3, E3 |
| P1 | evals | E4 không đo vế không sửa ca cũ; E1 thiếu phép dương, thiếu ma trận viết ra; E2 đo chuỗi có mặt; thiếu cloud [can-gia-tot-biet-can#F2] | Sửa ca CGT mà E4 vẫn xanh; câu in dấu trừ vẫn xanh | Diff chỉ thêm; ma trận mười dòng; so nguyên câu | fixed: thêm E6, viết lại E1, E2, thêm paths |
