---
slug: mcp-tools-theo-so-be-mat
at: 2026-10-24T10:44:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
---
## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Dòng sổ d-1 (giữ oneinvest_get_offers với auth ops) trích dòng sổ bề mặt — câu đó chứng offers đang ops, không chọn giữa giữ và gỡ | Người ký tưởng lối giữ do nguồn mục tiêu quyết; nếu chủ hàng định gỡ thì AC-1/E1/MT1/MT7 đo sai mục tiêu mà vẫn xanh | d-1 trích câu QUYẾT giữ/gỡ, không có thì thành Hỏi | fixed: dòng d-…-6 thay d-1, trích câu trả lời audit Q3 của Mạnh «Đóng ngay (yêu cầu token ops); quyết công khai lại sau…» — chọn token ops, không gỡ; dòng feature giữ nguyên văn câu giao của lộ trình, AC-1 chọn nhánh thứ nhất |
| P1 | design | Design mục 5 hẹn một câu luật, E6 đòi ba ý (cùng commit kể cả thêm công cụ, nghĩa auth, tên phép đo) | Người làm viết một câu; hội đồng E6 phán không, AC-5 trượt sau khi mọi eval script xanh | Design mục 5 + AC-5 + E6 liệt đúng ba ý | fixed: design mục 5, AC-5 Then và E6 question/expected cùng liệt ba ý (a)(b)(c) |
| P2 | contract | Coverage tuyên phủ A×C nhưng ô endpoint-vắng, method-vắng không có MT; ô gốc-lạ không ghi lý do loại | Cài đặt bỏ qua lặng công cụ thiếu endpoint/method mà static vẫn xanh | Ma trận viết trước, mỗi ô một MT hay lý do loại; thêm MT9, MT10 | fixed: Coverage thành bảng 4×3 + phía đổi, thêm MT9 bỏ endpoint, MT10 bỏ method, ô loại có lý do; E3 mười ca |
| P2 | contract | d-2 (mot-loi) không giết lối gốc-mặc-định-ghi-đè; MT4 phạt gốc «public» cạnh ghi đè đúng nghĩa | Bản khai ghi đè đúng nghĩa nhận đỏ «khoá auth chung trái sổ» | d-2 nêu ràng buộc thật hoặc bỏ luật trái sổ khi mọi công cụ ghi đè khớp sổ | fixed: dòng d-…-7 thay d-2 — gốc là mặc định, auth riêng ghi đè; bỏ thông điệp «khoá auth chung trái sổ»; MT4 thành đối chứng dương ĐẠT |
| P2 | evals | B0 dùng git show trong lệnh mutation chung; MT1/MT7/B0 gắn offers=ops | Checkout nông hoặc khi PL2 mở lại offers đúng cả hai phía thì mutation đỏ trên thay đổi đúng | Ghi nơi chạy; đột biến theo chế độ tương đối | fixed: B0 tách ra chế độ historic (E2, khoá mcp_tools_historic) đọc CẢ bản khai lẫn sổ ở 1c6389b nên đóng băng theo thời điểm hàng; mutation không cần git; MT1/MT3/MT7 chọn chế độ khác chế độ sổ hiện tại |
