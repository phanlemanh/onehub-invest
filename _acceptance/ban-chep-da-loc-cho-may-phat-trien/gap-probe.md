---
slug: ban-chep-da-loc-cho-may-phat-trien
at: 2026-11-25T00:28:00Z
verdict: findings
p0: 3
p1: 1
p2: 1
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Bộ soát chỉ quét giá trị text/json, bỏ mảng text và DDL đổ sang (hàm, view, COMMENT, DEFAULT, CHECK, enum) | Hàm hay cột text[] mang tên nguồn, bộ soát xanh, dump rời máy | Ma trận cấy tám ô, đối chứng dương ở text[] | fixed: AC-3, E3, design §2 bước 5 quét cả mảng và DDL, ma trận tám ô + đối chứng dương |
| P0 | design | Căn cứ d-2 và d-4 trích câu chỉ liên quan, không quyết lựa chọn | Người duyệt tưởng đã chốt nên không xét lối danh sách riêng | Đọc lại câu trích có tự loại lối khác không | fixed: d-2, d-4 thay bằng dòng mới (supersedes) căn cứ một-lối có lối chết nêu được |
| P0 | design | d-3 ghi một-lối nhưng lối dựng từ migration chưa chết | Máy tự chọn đổ lược đồ DB sống, kéo đối tượng sót lại | Ghi lối khác và giá, hoặc đưa người | human-gate1: d-3 thay bằng Hỏi-4 (supersedes), khuyên đổ DB + soát DDL |
| P1 | contract | AC-1 «mọi bảng khác 0 dòng» mâu thuẫn AC-5 và spatial_ref_sys; extension PostGIS chưa khai | E1 đỏ thật, hoặc ngoại lệ tự thêm che bảng lọt | Danh sách ngoại lệ tường minh + ca đỏ + kiểm extension | fixed: AC-1, E1 nêu source_registry, spatial_ref_sys; ca cấy bảng ngoài danh sách; kiểm postgis |
| P2 | evals | E8 ca đỏ có thể đỏ ở sha mà không đo nhánh so số dòng | Bộ so số dòng sai mà E8 vẫn xanh | Tách hai ca, ghim thông điệp | fixed: AC-8, E8 hai ca đỏ ghim «sha256» và tên bảng |

Ngoài bảng: E2 khai executor test nhưng trỏ executors.script — fixed: đổi thành script.
