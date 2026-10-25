# Điểm quyết định — ops-facts-so-tong-hop (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Đường số đi từ máy local tới trang cloud (năm khối → bộ soát → ingest → ops_heartbeat → hàm đọc → ba trạng thái) | 5 bước nối tiếp + 3 nhánh trạng thái | `luong-nam-khoi` |
| Hỏi-1 — tập job trong khối jobs | 2 nhánh rẽ | `hoi-1-tap-job` |
| Bảy dòng sổ máy đã quyết (d-…-1 → d-…-6, d-…-8/9) | mỗi dòng 1 lựa chọn, không nối bước | dưới ngưỡng: 1 |

## Đề bài `luong-nam-khoi`
- Loại: luồng dữ liệu trái → phải.
- Nút: Máy local (push-ops-facts) dựng năm khối [độ tươi · job launchd · lockdown · bản ghi 24h · thẻ chờ duyệt], mỗi khối có mốc đo → Bộ soát tầng A (còn tên thật thì dừng, không gửi) → Route ingest trên cloud → Bảng ops_heartbeat → Hàm đọc chung readOpsFacts.
- Ba nhánh ra từ hàm đọc: «chưa có số» · «số tươi ≤ 45′» · «số cũ > 45′» (theo từng khối); khối không đo được mang chữ lỗi, không bao giờ 0.
- AC liên quan: AC-1, AC-7, AC-8, AC-9.

## Đề bài `hoi-1-tap-job`
- Loại: hai nhánh lựa chọn.
- Gốc: «Khối job gồm những job nào?»
- Nhánh A (máy khuyên): mọi job launchd khai trong pipeline/cron (12 job, cả job chạy liên tục) → trang cloud thấy cả job chạy liên tục bị chết.
- Nhánh B: chỉ job chạy theo lịch → trang cloud không thấy job chạy liên tục chết.
- AC liên quan: AC-6.
