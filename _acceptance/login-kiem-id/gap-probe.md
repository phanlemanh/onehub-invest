---
slug: login-kiem-id
at: 2026-10-24T10:16:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
claims_input: ok
---

# Phản biện context sạch — login-kiem-id

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ma trận AC-3 thiếu lớp khoá kế thừa của Object (constructor, __proto__, toString, hasOwnProperty) | Kiểm thành viên bằng accounts[id] hay in thì constructor qua, openclaw giả nhận login --account constructor; E1–E4 vẫn xanh | Thêm 4 id vào AC-3/E3, ghim thông điệp; chiều đỏ bản sao kiểm bằng in | fixed: AC-3 thêm 4 khoá kế thừa + chiều đỏ (b) bản sao kiểm bằng in; Coverage cập nhật |
| P1 | contract | Không AC nào ghim mặc định thư mục QR khi chạy thật; d-3 mot-loi chưa giết lối tiêm tham số | Mặc định viết thành os.tmpdir() thì chạy thật /ops không bao giờ hiện QR, mọi eval vẫn xanh vì đều đặt OPENCLAW_QR_DIR | Ca tiến trình con không đặt biến, assert qrDir = /tmp/openclaw; chiều đỏ os.tmpdir() | fixed: thêm AC-9 + E9; dòng sổ mới supersedes d-3 nêu lối tiêm tham số chết vì phép đo đi qua handler route |
| P1 | evals | Rào chỉ kiểm module gốc; ca đỏ gọi startZaloLogin của bản sao đột biến | Bản sao phân giải đường khác thì ca đỏ spawn openclaw thật trong khi rào đã xanh | Rào chạy trên zaloAdminPaths() của bản sao trước khi gọi | fixed: AC-8/E8 đòi một hàm nạp bản sao duy nhất chạy rào trên bản sao trước khi trả nó |
| P2 | contract | Bước kiểm phải đứng trước nhánh trả phiên đăng nhập đang chạy — không AC nào đo | Có phiên acc2 dở, POST --channel trả 200 kèm QR acc2 | Ca openclaw giả không thoát, id sai vẫn 400 | fixed: thêm AC-6 + E6 (phiên acc3 dở, --channel và khong-co 400, dọn bằng cancelZaloLogin) |
| P2 | evals | Thước tĩnh chỉ đo có mặt chuỗi requireLoginAccount(, không so biến, chỉ một dạng literal | Đường spawn dùng nháy đơn hay chuỗi lệnh gộp lọt thước; hoặc kiểm biến khác với biến vào argv | So biến kiểm với phần tử sau --account; liệt dạng literal | fixed một phần: AC-7 bắt nháy đơn, template, chuỗi chứa channels login, mỗi dạng một chiều đỏ; deferred: so quan hệ biến — ghi Out of scope (cùng hạn chế ON14 Ngoài-4), ca chạy thật AC-1…AC-6 đo hành vi |
