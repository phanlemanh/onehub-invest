---
slug: go-tai-khoan-kiem-id
at: 2026-10-24T09:44:00Z
verdict: findings
p0: 2
p1: 1
p2: 2
claims_input: ok
---

# Phản biện context sạch — go-tai-khoan-kiem-id

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design + contract + evals (AC-1, AC-4) | Không có AC/eval fail-closed chứng minh hằng OPENCLAW và đường openclaw.json đã trỏ vào thư mục tạm TRƯỚC khi ca dương và chiều đỏ (cố ý cho logout chạy) được chạy | Import tĩnh kéo zalo-admin lên trước lệnh đặt HOME → ca đỏ chạy openclaw logout --account "" THẬT, lặp sự cố P1-7; ca dương sửa ~/.openclaw thật | Rào trong before(): homedir + realpath openclaw/config dưới thư mục tạm, sai thì không ca nào chạy; chiều đỏ HOME thật | fixed: thêm AC-6 + E6 (rào before(), cấm import tĩnh, zaloAdminPaths(), chiều đỏ HOME thật); design §3 |
| P0 | design + decisions (d-3) | d-3 ghi mot-loi nhưng lối khác chưa chết; khuôn SLUG chạm người dùng thật (khoá ngoài khuôn không gỡ được từ /ops) | Tài khoản thật sửa tay có chữ hoa/gạch dưới bấm Gỡ nhận 400 mãi, Mạnh phải sửa tay ~/.openclaw | Hỏi Mạnh hoặc viết lại lối chết có ràng buộc | fixed: bỏ khuôn SLUG — chỉ chặn rỗng/khoảng trắng/'-' đầu/default/không thành viên; dòng sổ mới supersedes d-3; AC-4 thêm khoá thật ngoài khuôn Acc_5 gỡ được |
| P1 | contract + evals (AC-3/E3) | Fixture chỉ default/acc2/acc3 nên mọi ca AC-3 bị chặn nhờ kiểm thành viên; phần chặn dạng cờ không có phép đo; «nêu lý do» không ghim | Bản chỉ kiểm thành viên qua cả E3, khoá dạng cờ có thật trong config vẫn tới argv | Thêm khoá --channel vào fixture; ghim thông điệp từng lớp; chiều đỏ bản chỉ kiểm thành viên | fixed: fixture có khoá --channel, thông điệp ghim theo lớp, chiều đỏ bản sao chỉ kiểm thành viên |
| P2 | contract + evals (AC-5/E5) | Thước tĩnh chỉ đòi ≥1 chỗ, không danh sách viết trước, không phủ mảng argv dựng riêng | Logout thứ hai qua mảng argv lọt mẫu quét, thước vẫn xanh | Danh sách tệp:hàm viết trước, số chỗ bằng đúng; chiều đỏ mảng argv | fixed: danh sách viết trước (zalo-admin.ts · deleteZaloAccount), quét mọi literal "logout" trong tệp có chữ openclaw, chiều đỏ (b) mảng argv |
| P2 | evals (E6) | E6 gắn AC-4 nhưng chỉ chạy tsc/eslint, «không lỗi mới» không có baseline | AC-4 có eval xanh không đo lời hứa của nó | Tách khỏi AC, ghim baseline | fixed: bỏ E6 cũ — tsc + eslint đã chạy mỗi lượt qua suite_keys (executors.test.app); E6 nay là rào AC-6 |
