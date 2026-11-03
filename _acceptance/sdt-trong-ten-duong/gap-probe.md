---
slug: sdt-trong-ten-duong
at: 2026-11-03T04:26:54Z
verdict: findings
p0: 2
p1: 13
p2: 6
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract, evals, design | Định nghĩa độc lập chỉ được tuyên | Thước viết thiếu ngăn thì báo sạch khi số còn ở cột | Định nghĩa viết bằng lời, in định nghĩa rộng | fixed: mục Dãy số + AC-4; thước in số rộng |
| P0 | contract, evals | Không đo tới đường lên cloud | Lượt đồng bộ không chở NULL, API vẫn trả số sau khi PASS | AC đo lô đồng bộ, đếm cloud | fixed: AC-5; đếm cloud thành điều kiện đóng việc của giám sát ở Notes |
| P1 | evals | E4 thiếu đối chứng trước và tác dụng | Bản chép đã sạch thì sau = 0 rỗng | trước ≥ 1, rút ≥ 1, mục ≥ 1 | fixed: AC-4 |
| P1 | evals | Chiều đỏ chỉ gài một giá trị | Thước đếm sai bảng khác vẫn lọt | Ma trận đỏ 3 × 2 | fixed: E5; đột biến bỏ lớp ở E3, E4 |
| P1 | contract | Thiếu ranh giới chữ số của đường thật có ngăn | Chuỗi nhiều số nhà bị bỏ, không biết | Hàng ma trận, in số bị bỏ | fixed: hàng 17, Notes, đo 0 tin |
| P1 | contract, evals | Mẫu chỉ thử bên JS | Postgres hiểu khác JS, legacy không bị rút | 17 hàng qua toán tử ~ | fixed: E2 |
| P1 | contract, evals | AC-3 không toàn phần | Ca số ở cả ô và tin không được thử | Bảng 12 ô | fixed: Ma trận AC-3 |
| P1 | contract, evals | AC-2 không toàn phần | Nguồn cũ mang số, đổi chiều không được thử | Bảng 12 hàng | fixed: Ma trận AC-2 |
| P1 | contract, evals | Hoàn tác là âm tính không đối chứng | Không có mục log thì «không trả số» rỗng | Đảo ≥ 1, ca đỏ | fixed: E4 |
| P1 | contract, evals | Kiểm log theo chuỗi fixture | Số chuẩn hoá lọt qua so chuỗi | Định nghĩa độc lập, ca đỏ | fixed: E4, E5 quét cả mục go-sdt-duong |
| P1 | contract, evals | «Vẫn có đường» đo sự có mặt | Đổi chữ vẫn xanh, 0 trên 0 vẫn xanh | So từng tin, mẫu số | fixed: AC-4 |
| P1 | contract, decisions | Out of scope không có số | Số đi qua cột khác xuống API mà không biết | Số đếm từng dòng | fixed: đo 03/11, cột khác không lên cloud; dòng sổ descope |
| P1 | contract, evals | Không khớp lệnh job đêm | Job chạy phạm vi khác, tin cũ không được phân xử | Đối chiếu dòng lệnh | fixed: AC-4 đọc chotot-daily.sh; rút theo mọi phát biểu sống, không theo lượt |
| P1 | evals | Không đo chuyện không ghi DB chung | Ghi nhầm DB máy thu | Tên DB, từ chối | fixed: E5 |
| P1 | contract, evals | Hàng 8 DS1 không được trích | Duyệt mà không biết hàng nào | Trích nguyên hàng | fixed: AC-1, Notes |
| P2 | contract, evals | Phạm vi nguồn của AC-4 mập mờ | Đếm chỉ S06 làm lọt nguồn khác | Ghi rõ | fixed: mọi nguồn |
| P2 | contract, evals | E2 không đo xuất xứ ô | Ô NULL còn trỏ phát biểu đã rút | Cột xuất xứ | fixed: AC-2 |
| P2 | contract, evals | «Không in giá trị» không đo | Số vào bằng chứng công khai | Assert output | fixed: E5 |
| P2 | evals | paths thiếu tệp | Sửa assert.mjs mà E4 không bị đòi chạy lại | Thêm paths | fixed |
| P2 | design, contract | Số đếm không cộng khớp | Không kiểm lại được căn cứ | Bảng cộng đúng 55 | fixed: design doc |
| P2 | decisions | d-2 trích căn cứ sai | Không biết có lối khác | Dòng thay thế | fixed: dòng sổ supersedes; không thành Hỏi vì 0 chuỗi đường thật kèm số |
