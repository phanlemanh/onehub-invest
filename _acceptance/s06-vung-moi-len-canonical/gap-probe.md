---
slug: s06-vung-moi-len-canonical
at: 2026-10-31T11:16:10Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn đổi khoá `areas` (064) ghi máy quyết, kho_dao=false; câu trích bộ nạp tỉnh không quyết việc đổi khoá dữ liệu có sẵn; lối ánh xạ sang mã dài vẫn sống; lựa chọn chạm cloud (sync xoá 32 dòng) và mã thị trường công khai | Mạnh duyệt thời điểm áp mà chưa ai chọn giữa đổi khoá và ánh xạ; sau áp, liên kết/API dùng vn-thanh-pho-* gãy | Dòng sổ chỉ-người, kho_dao true, ba lối kèm giá | human-gate1: thành Hỏi-3 (dòng sổ mới supersedes dòng cũ), khuyến nghị đổi khoá + rào AC-2 + đếm AC-10 |
| P1 | contract | Điều kiện an toàn chỉ đếm saved_markets trên cloud; sáu khoá ngoại khác và cột chữ không ai đếm; không AC nào đo sync khi đổi khoá | Cloud còn dòng trỏ mã dài → lượt sync đầu lỗi (RESTRICT) hay xoá lặng (CASCADE) ngay trước 05/11 | Đếm chỉ-đọc mọi bảng khoá ngoại + cột chữ trên cloud = 0 trước khi áp | fixed: thêm AC-10 + E12 (lệnh đếm liệt bảng từ catalog, chạy được trên bản chép và cloud); sync chỉ có khoá chính duy nhất ở areas (đo 31/10) nên upsert +32 rồi xoá −32 không va UNIQUE khác |
| P1 | evals | E8 không ghim mẫu số tỉ lệ có phường | Mẫu số suy từ area_id → tỉ lệ luôn 100% | Mẫu số theo city_code ánh xạ; đối chứng đỏ xoá area_id 30% | fixed: AC-8 + E8 ghim mẫu số theo city_code, in số NULL, thêm đối chứng đỏ |
| P1 | evals | Fixture E4 viết tay theo khuôn bên đọc; tiền tố snapshot chưa ghim; thành phố chưa có snapshot bị bỏ qua im lặng | ZCode nạp tiền tố khác → reassign lặng lẽ bỏ Đà Nẵng thật, E4 vẫn xanh | Fixture qua importer thật + tiền tố từ cities.ts; khoá thiếu snapshot in dòng | fixed: AC-3 ghim khoá = id cities.ts (tiền tố snapshot), AC-4/E4 dựng thư mục đúng khuôn collector và nạp qua importer thật, khoá thiếu snapshot in một dòng; AC-8 bắt buộc ranh giới Đà Nẵng thật |
| P2 | evals | E3 đo chuỗi vắng mặt thay vì quan hệ «tập thành phố chỉ từ module» | Viết cứng 'vn-da-nang' vào transform, E3 vẫn xanh | Quét /vn-[a-z-]+/ + ca thêm khoá vào module | fixed: AC-3 + E3 thêm quét /vn-[a-z-]+/ và ca quan hệ thêm khoá giả |
