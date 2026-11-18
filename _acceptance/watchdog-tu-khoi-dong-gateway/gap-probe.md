---
slug: watchdog-tu-khoi-dong-gateway
at: 2026-11-17T23:08:45Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design, contract | Dòng sổ giới hạn đã biết (reason=unknown → khởi động lại lặp) dẫn muc-tieu bằng câu Ngoài-7 của VHZ1, không quyết lựa chọn; trái ngưỡng SỐNG «không khởi động lại lặp»; không ca nào ghim hành vi reason=unknown | Phiên chết đúng lúc status treo: mỗi 6 giờ watchdog khởi động lại gateway thật, tới 4 lần/ngày, không báo CẦN QUÉT QR; Cổng 1 ký vì AC-3 chỉ đo reason=session | Hỏi cho Mạnh kèm hệ quả; AC và eval PHIEN-CHET-UNKNOWN ghim số lời kickstart qua ba mốc 6 giờ | human-gate1: thành Hỏi-1 (chi-nguoi, dòng sổ supersedes); AC-3 thêm ca reason=unknown do heartbeat thật sinh, E3 thêm PHIEN-CHET-UNKNOWN (3 lời qua ba mốc, 0 dòng QR) |
| P0 | evals, design | Chốt cô lập không gồm CLI OpenClaw; SO-STUB «chỉ status» là khẳng định âm tính không đối chứng dương [l6d-down-keo-dai-ly-do#F1] | CLI thật thắng hoặc CLI không tìm thấy: sổ stub rỗng mà SO-STUB vẫn PASS, phép đo chạm gateway thật | Thêm openclaw vào chốt command -v và CLI giả trong HOME lượt, ca CLI-VANG-DO; SO-STUB đòi ≥1 lời status mỗi lượt; quét bản chép không đường tuyệt đối ra ngoài | fixed: AC-6 (đối chứng dương), AC-7 (bảy lệnh, CLI giả, quét đường tuyệt đối, CLI-VANG-DO); E6, E7 cập nhật |
| P0 | design, contract | Căn cứ «gateway chết lặng không hồi sinh» khai mot-loi nhưng lối kia (hồi sinh có dấu) không chết; lời giám sát không được trích | Gateway rơi khỏi launchd không do alert(): watchdog exit 0 mỗi 5′ không ghi gì, kênh đứt nhiều giờ | Căn cứ muc-tieu có trích; ghi Out of scope kèm hệ quả | fixed: dòng sổ mới (supersedes) dẫn muc-tieu định nghĩa P1 trên L6(b) ở docs/ops/de-xuat-van-hanh-on-dinh-1411.md; AC-5 ghi rõ hành vi có sẵn trên main không đổi; Out of scope thêm mục hồi sinh gateway chết hẳn, chỉ L6(d) báo |
| P1 | contract, evals | AC-7 không ghim p1-state, p1-tat, tệp heartbeat thật và biến ZALO_* thừa hưởng từ shell chấm | Bản chép trỏ tệp trạng thái thật: TRAN-6H ghi lan= thật chặn P1 6 giờ, TAT-TEP để lại cờ tắt thật; P1_TAT=1 trong shell làm E1 đỏ khó hiểu | Băm thêm ba tệp, env dựng từ đầu, quét bản chép không đường tuyệt đối | fixed: AC-7 và E7 CO-LAP băm p1-state, p1-tat, tệp heartbeat thật (có/vắng + băm), env lượt dựng từ đầu, quét đường tuyệt đối |
| P1 | evals | Quét tĩnh P1 không đòi mốc đúng 1 lần, vùng khác rỗng, không gồm hàm helper, không ca eval chuỗi | Đổi chữ mốc thì vùng rỗng và PASS rỗng; helper đặt trên mốc ghi openclaw.json lọt | Mốc đúng 1 lần, vùng chứa kickstart, gom thân hàm được gọi; ma trận thêm ba bản | fixed: AC-6 và E6 P1-CHI-DOC đòi mốc đúng 1 lần, vùng chứa launchctl kickstart, gồm thân hàm được gọi; P1-CHI-DOC-DO ma trận sáu bản (thêm helper, eval chuỗi, đổi mốc) |
