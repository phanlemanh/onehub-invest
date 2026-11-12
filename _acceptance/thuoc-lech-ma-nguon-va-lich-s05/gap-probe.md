---
slug: thuoc-lech-ma-nguon-va-lich-s05
at: 2026-11-11T09:47:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E2 chỉ đòi ca DB xanh; không đòi độ tươi thật có mã từ S10 trở lên, không đòi ca gọi đúng hàm của AC-1 | DB không có S10, S11 hoặc ca dùng khuôn lỏng `^S` thì AC-2 vẫn xanh mà chưa gặp mã hai chữ số | Ca in số phần tử mã từ S10 (lớn hơn 0), gọi chiMaNguon, chiều đỏ tiêm `chotot/x` | fixed: AC-2 và E2 đòi dòng «TL-AC-2 độ tươi mã từ S10: n» với n lớn hơn 0, ca gọi chiMaNguon và chiều đỏ tiêm `chotot/x` |
| P1 | evals | Tự kiểm một đột biến «3 days» qua bộ dựng giả không phân biệt hai kiểm (bằng hằng, ≥ 4 ngày); thiếu đối chứng biên và quy đổi đơn vị | Thông điệp FAIL ghim không khớp kiểm thật sự bắn; mặc định «96 hours» đỏ oan hoặc lọt | Hai đột biến tách nhau mỗi đột biến một dòng FAIL; dương «4 days», «96 hours» | fixed: AC-3 và E4 khai hai đột biến tách nhau, quy đổi days, hours, weeks, hai đối chứng dương |
| P1 | evals | E5 chỉ đọc YAML; không chứng bộ máy của kit công nhận con trỏ | Kit không nhận cặp not-run và superseded_by, lượt ghim lại khoa-nap-s05-paused vẫn đỏ | Gọi bộ chứng của kit trên cây | fixed: AC-4 và E5 gọi `chungThayBoi` của lib/evidence-core.cjs — trước chữ ký phải trả `ho-so-thay-chua-ky` (mọi điều kiện trước chữ ký đã qua), bản chép bỏ thẻ trả `thay-khong-nhan`; hợp đồng mang thẻ `khoa-nap-s05-paused/E11`, `/E12`; giới hạn ghi ở Notes |
| P2 | evals | Quét mã báo cáo chỉ ba khuôn regex, không ma trận hình thái | `startsWith('S0')` hay `slice(0,3)` lọt quét | Ma trận năm hình thái viết trước, tự kiểm từng hình thái | fixed: AC-5 và E6 khai năm hình thái, tự kiểm năm bản chép mỗi bản một dòng |
| P2 | decisions | d-3 trích AC-9 không quyết cửa sổ mặc định; d-4 lấy tiền lệ làm lời quyết cho việc đổi thước hồ sơ Mạnh đã ký | Cổng đọc như đã chốt, người ký không được hỏi | Ghi lại nguồn đúng hoặc đưa lên câu hỏi | fixed: d-6 thay d-3 bằng nguồn một-lối; d-7 thay d-4 thành câu hỏi cho Mạnh ở Cổng Phạm vi |
