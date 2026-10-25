---
slug: nhom-moi-requiremention
at: 2026-10-25T07:20:00Z
verdict: findings
p0: 0
p1: 4
p2: 2
claims_input: ok
---

# Phản biện context sạch — nhom-moi-requiremention

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Ma trận L3b không ghim giá trị `enabled` ở ca `requireMention:false`, không có ca `allow:false` | Hàm kiểm dùng lại vị từ `enabledKeys` (xét `allow`) hoặc `enabled === true` → phán sạch nhóm thiếu khoá `enabled` (lỗ 22/10) hay `allow:false`, bộ canh KILL | Thêm ca `enabled` vắng/null/0/chuỗi và `allow:false`, mỗi ca kèm `requireMention:false` | fixed: AC-4 thêm năm ca, AC-5 chạy cả năm |
| P1 | contract | AC-5 đòi «cùng phán» trên ma trận chọn tay, không gồm ca hỏng/sát ranh | Fixture chọn khít; hàm kiểm mù với dạng hỏng mà bộ canh KILL (python crash) | Quan hệ bao hàm: bộ canh phạm ⇒ hàm kiểm phạm, trên toàn ma trận + họ cấu hình hỏng; python thoát khác 0 = phạm; trích lúc chạy + băm ghim | fixed: AC-5 viết lại, AC-4 thêm lớp `hỏng` |
| P1 | contract | Rào AC-8 không phủ lượt chạy đoạn trích bộ canh và `DATABASE_URL` | Trích lố gọi `alert` → bootout/pkill gateway thật; python đọc `~/.openclaw` thật; POST 200 ghi `ops_audit` DB thật | Rào trên đường tệp python, env HOME giả, đoạn trích cấm alert/pkill/launchctl/osascript/$HOME, DATABASE_URL cổng đóng | fixed: AC-8 mở rộng + chiều đỏ đoạn trích có pkill |
| P1 | evals | Chưa eval chứng minh bước kiểm tự chặn đầu ra sai của chính thao tác (chiều đỏ gỡ kiểm cùng lúc) | Hàm kiểm duyệt nhóm hiệu dụng thay vì mọi phạm vi → bỏ sót groups cấp channel khi mọi tài khoản có groups riêng | Bản sao giữ kiểm, nhóm mới false → L3b nêu group:moi ở 4 bố cục; ca L3b cấp channel khi mọi tài khoản có groups riêng | fixed: AC-6 chiều đỏ (b), AC-4 ca mới |
| P2 | contract | AC-3 «tắt không bao giờ bị khoá» mâu thuẫn d-2 | Bỏ kiểm khi enabled=false qua tham số writeCfg → cấu hình có bindings vẫn bị ghi | Chốt một nghĩa; AC-6 thêm ca tắt nhóm khác; thước tĩnh cấm tham số bỏ kiểm | fixed: d-5, AC-3 sửa chữ, AC-6 thêm tắt, AC-7 chiều đỏ (c) |
| P2 | contract | Bố cục accounts.default không chốt có groups riêng hay không; AC-1 chỉ so mục nhóm mới | accounts.default kế thừa → mã tạo groups một nhóm, tài khoản chính mất nhóm kế thừa («0 tin») | Tách bố cục; so enabledGroups hiệu dụng mọi tài khoản trước/sau | fixed: AC-1 tách bố cục + so enabledGroups; d-4 chép groups kế thừa; acc kế thừa không phải default ghi Out of scope |
