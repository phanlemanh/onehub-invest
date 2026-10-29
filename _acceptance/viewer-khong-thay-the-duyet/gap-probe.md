---
slug: viewer-khong-thay-the-duyet
at: 2026-10-27T04:05:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | decisions | lý do bỏ chụp màn sai: AGENTS.md cho tài khoản thử trên DB local qua dev-ops-account | trang viewer hiện thẻ qua một đường client không qua props, mọi ca test xanh; Mạnh ký mà chưa ai nhìn trang bằng vai viewer | một lượt chụp màn bằng tài khoản viewer-test@local.test | fixed: AC-9 + E9 ui-check (viewer và admin); dòng sổ approach supersedes dòng bỏ ui-observed; mở CLI dev-ops-account thêm --vai viewer |
| P0 | decisions | bỏ định danh tài khoản thu ở /ops/collections ra ngoài là chọn nghĩa sản phẩm, máy không được tự quyết | cấp vai viewer cho một người, người đó thấy id tài khoản thu (tầng A) ở /ops/collections | một câu hỏi ở Cổng Phạm vi | human-gate1: Hỏi-1 (khuyên mở hàng riêng; lối khác che với viewer ngay vòng này), supersedes dòng descope |
| P1 | contract | không kiểm kê mọi trang và route ops đọc nội dung tin | một trang ops khác (deals, quality) đọc bài gốc cho viewer, hợp đồng xanh | bảng kiểm kê khớp tập route trên đĩa | fixed: AC-8 + E8 với đối chứng route giả |
| P1 | evals | E2 đo có chữ trong HTML, không đo dữ liệu đã truy vấn và props truyền xuống | thành phần client nhận nội dung qua props nhưng chưa vẽ, HTML sạch, dữ liệu vẫn tới trình duyệt | dòng truy vấn trả về + JSON props | fixed: E2 bắt kết quả pool.query và duyệt cây phần tử, đối chứng câu chọn đủ cột |
| P1 | evals | ma trận vai thiếu owner, OPS_EMAILS; cờ xemBaiGoc không đo | so sánh role === 'ops' lọt admin và owner, ca hai vai xanh | ma trận 6 kiểu × 2 trang + cờ | fixed: AC-3 + E3 MA_TRAN 12 ô kèm xemBaiGoc, đối chứng role === 'ops' |
