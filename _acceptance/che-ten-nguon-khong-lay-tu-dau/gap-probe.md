---
slug: che-ten-nguon-khong-lay-tu-dau
at: 2026-11-18T03:05:00Z
verdict: findings
p0: 1
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Không eval chứng tệp lên kho công khai không chứa giá trị thật S16; lui.sql có thể viết cứng dạng chữa tạm | Output E6 in token trúng → evidence-report lên kho công khai; hoặc lui.sql viết cứng tên viết liền | grep mọi biến thể từ tệp cục bộ trên hồ sơ và đầu ra = 0; lui.sql lấy từ sao lưu | fixed: thêm AC-9 + E9 (dò mọi biến thể gập trên hồ sơ, test, bảng ca, đầu ra lượt chấm; đối chứng chèn ≥ 1; thiếu tệp cục bộ → exit 2); AC-7 tệp lùi khôi phục S16 TỪ bản sao lưu |
| P1 | evals | Không eval cho bộ soát rời máy khi sổ rỗng hay hàm nạp lỗi | Hàm nạp nuốt lỗi thành [], sync-cloud đẩy cả lượt — hỏng mở | Ba đường rời máy dừng exit ≠ 0 khi không bảng và khi hàm nạp ném lỗi; đối chứng có sổ chạy qua | fixed: AC-4 thêm vế đóng chặt; E4c có ô không bảng + hàm nạp ném lỗi cho sync-cloud, push-ops-facts, do-hang-ngay |
| P1 | evals | E4a chỉ soát chuỗi; bốn chỗ đọc không có ca hành vi | offers-public bỏ token định danh → tên miền S16 lên Invest công khai, soát chuỗi vẫn xanh | Mỗi chỗ trong bảy một ca hành vi; chiều đỏ lọc bỏ định danh | fixed: E4c ma trận bảy chỗ × ba ca (thương hiệu qua, cụm hai từ và tên miền bị che/chặn), chiều đỏ offers-public rơi token định danh |
| P2 | contract | Việc nới tầng A ghi GS quyết; không nói chuỗi nào nay rời máy | Mạnh ký Cổng 1 tưởng GS có quyền nới, không thấy thương hiệu lên cloud trần | Dòng sổ chờ Mạnh; Notes kê hai thứ lên cloud không che; E8 hỏi thêm | human-gate1: dòng sổ gate1 Hỏi Mạnh (decided_by trống); Notes kê hai thứ; E8 thêm ý «chuỗi nào trước bị chặn nay lên cloud» |
