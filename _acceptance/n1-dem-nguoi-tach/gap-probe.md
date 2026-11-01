---
slug: n1-dem-nguoi-tach
at: 2026-11-01T06:02:00Z
verdict: findings
p0: 1
p1: 1
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ d-3 giấu hẳn số cặp đã tách khỏi người vận hành, nguồn mot-loi chỉ làm chết lối thêm khoá tach= vào detail; lối in ra stdout hay dòng riêng không bị loại. | Cổng 1 duyệt mà Mạnh không biết đang đồng ý giấu số cặp đã tách; một lệnh tách sai làm cặp rời N1 im lặng. | Đổi d-3 thành câu hỏi người, hoặc viết lại lối chết cho mọi lối. | fixed: dòng S1 mới supersedes d-3 — in «danh-ba-sdt:n1 <nguồn> cap_da_tach=<k>» ra stdout bước đêm (AC-8, E8), khuôn detail giữ; lối dòng ghi thứ 12 / khoá tach= ghi lối chết vì đổi thứ dq-labels.ts ngoài vùng đang đọc. |
| P1 | evals | Phép đo DB dùng client giả viết tay đúng khuôn bên đọc; không round-trip từ câu ghi tách thật. | Câu đọc split lệch giá trị với câu ghi thật; E5–E7 xanh mà N1 đêm vẫn đỏ. | Ca chuỗi sinh trạng thái bằng hàm tách thật rồi docDuLieu → tinhSo. | fixed: AC-7/E7 dựng bảng người trong bộ nhớ, trạng thái đặt bằng SQL.gop và SQL.tach nhập từ danh-ba-nguoi.mjs, đọc lại qua câu của docDuLieu; giới hạn: không chạy tachNguoi trọn (cần dungNguoi + DB), DB thử ngoài hàng. |
| P2 | evals | Mẫu khuôn detail N1 chép tay, không rút từ dq-labels.ts. | dq-labels đổi mẫu, E6 vẫn xanh mà nhãn ops hỏng. | Rút mẫu từ dq-labels.ts, đối chứng âm. | fixed: E6 rút mẫu từ app/src/lib/dq-labels.ts (chỉ đọc), đối chứng detail thêm tach= đỏ «DETAIL N1 LECH NHAN OPS». |
| P2 | contract | Ô trục «không có bí danh» gán cho AC-3 nhưng không ca nào đo cặp thiếu người cùng tập đã tách khác rỗng. | Vế lọc mới bỏ «có người theo SĐT», cặp không bí danh bị đếm, ma trận cũ vẫn xanh. | Ca cặp không bí danh + daTach khác rỗng, đối chứng bỏ vế. | fixed: AC-9/E9 thêm, đối chứng bỏ vế k != null đỏ «N1 DEM CAP KHONG NGUOI»; Coverage trỏ AC-9. |
