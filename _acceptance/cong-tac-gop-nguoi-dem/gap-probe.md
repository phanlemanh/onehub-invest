---
slug: cong-tac-gop-nguoi-dem
at: 2026-10-31T14:44:12Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract, evals | Chiều bật chỉ đo qua dungNguoi gọi thẳng, không qua bước đêm buocDem; đối chứng E7 truyền gop: true | buocDem không đọc công tắc (hằng gop: false) mà E1, E2, E7 vẫn xanh; bật trên máy thu job đêm không bao giờ gộp | Vế đêm trong E2 (dòng bat → buocDem không truyền gop → cùng tập cặp), đối chứng dòng tat; E7 lượt 0 và 1 qua buocDem | fixed: AC-2 thêm buocDem, E2 thêm vế đêm + đối chứng, E7 ghi rõ lượt qua buocDem |
| P1 | contract | Trục CLI dựng không có AC; không quét lời gọi mã thật truyền gop | dung-nguoi.mjs truyền gop: true, người chạy tay COMMIT gộp thật dù công tắc tắt | AC-9/E9 tiến trình con dung-nguoi.mjs --thu; E8 quét lời gọi dungNguoi( mã thật không mang khoá gop, có đối chứng dương | fixed: thêm AC-9 + E9, mở rộng AC-8/E8 |
| P1 | design, sổ | Tiền đề #250 không gộp riêng không được giữ bằng gì; dòng sổ thứ tự gộp ghi kho_dao false | Giám sát gộp #250 riêng vì đã ký và xanh, lượt đêm gộp thật ~195 người | Bằng chứng #250 ở dạng nháp | fixed: #250 chuyển nháp kèm ghi chú (gh pr view 250 → isDraft true); giám sát xác nhận «công tắc mặc định TẮT là điều kiện gộp»; dòng sổ mới thay dòng cũ |
| P2 | sổ, contract OOS-3 | Câu trích OOS-4 HD13 không quyết việc tắt có tách lại không | Bật rồi tắt trên máy thu thì ~195 người vẫn merged, chỉ còn tách từng người | Dòng sổ căn cứ đúng | fixed: dòng sổ mới (mot-loi) thay dòng cũ — vòng này công tắc chưa từng bật trên máy thu (OOS-1), tách hàng loạt không lý do trái nếp --tach --ly-do; hoàn hàng loạt là hàng riêng nếu cần |
| P2 | design, contract | Không bảng ops_audit → tắt chưa có trục và eval; SELECT lỗi làm hỏng giao dịch | DB thiếu ops_audit: bộ đọc bắt lỗi, mọi câu sau của buocDem ném current transaction is aborted | Ca đổi tên ops_audit trong SAVEPOINT, câu kế tiếp chạy được | fixed: trục thêm «không bảng», AC-3 thêm vế, E1 thêm ca; bộ đọc dùng to_regclass trước, không bắt lỗi |
