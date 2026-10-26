---
slug: ranh-gioi-khu-vuc-dung
at: 2026-10-25T09:43:55Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Sổ d-3 ghi máy quyết, kho_dao false, nhưng việc dọn xoá dòng areas/metrics và qua FK cascade xoá saved_markets (dữ liệu người dùng); sync-cloud phản chiếu nên phần xoá lên cloud | Lượt sync kế tiếp xoá khu vực trên cloud, cascade xoá thị trường người dùng đã lưu ở khu vực tỉnh; log in id không khôi phục được | Thay d-3 bằng dòng chỉ-người kho_dao true cho saved_markets; AC-3 theo lựa chọn; đếm saved_markets trỏ khu vực lạc trước/sau | human-gate1: dòng sổ mới thay d-3 thành Hỏi-3 (chỉ-người, kho_dao true; khuyến nghị không xoá khu vực còn saved_markets, đếm chỉ đọc saved_markets trên cloud trước khi áp thật); AC-3 thêm ca giữ khu vực có saved_markets |
| P0 | design | Design §2.5 áp lên DB local ở S3, trước Cổng 2; cloud-sync đẩy phần xoá lên cloud trước chữ ký; nghi lượt đêm chạy reassign bản cũ đảo ngược trạng thái đo | Áp chiều nay, cloud đổi trong 15 phút khi Cổng 2 chưa ký; hoặc trạng thái đo bị lượt đêm đảo | Ghi rõ thời điểm áp; đo sau lượt đêm hoặc chặn sync tới khi ký | human-gate1: Hỏi-4 (chỉ-người, kho_dao true) khuyến nghị S3/S4 chỉ đo trong một transaction rồi ROLLBACK, áp thật sau chữ ký Cổng Bằng chứng; AC-6/AC-7/AC-8 đo trong transaction. Vế lượt đêm: rejected — reassign-areas không có trong lịch chạy (chỉ pipeline/finalize-hanoi.sh chạy tay) |
| P1 | evals | E6/E7 không ghim mốc trước khi áp, không đối chứng dương | Script so hcmc với chính nó hoặc lấy tập lạc rỗng nên luôn xanh | Ghim mốc trước; chạy trên trạng thái cũ phải đỏ | fixed: chế độ --thu chụp trạng thái trước trong cùng transaction — trước phải đỏ đúng dòng extent và «Tỉnh…», tập khu vực lạc trước phải khác rỗng, hcmc so trước = sau, in số cả hai phía |
| P1 | evals | Mồi stg_osm_boundaries tự dựng theo khuôn bên đọc; không AC chặn tập phường hợp lệ rỗng/teo | Snapshot thật thiếu tag thì 0 phường hợp lệ, bước dọn xoá trọn Hà Nội và TP.HCM | Mồi chép payload dòng thật; AC dừng khi tập hợp lệ rỗng hoặc teo | fixed: AC-1 mồi cấp 6 chép payload từ một dòng thật của stg_osm_boundaries; AC-9 mới (dừng khi tập phường hợp lệ rỗng hoặc dưới một nửa số con hiện có, chiều đỏ snapshot mất tag) + E9 |
| P2 | evals | E1/E3 đo chuỗi có mặt trong log thay cho quan hệ | Log in số đếm sai hoặc in id sau khi đã xoá mà vẫn xanh | E1 so số in ra với count thật; E3 kiểm thứ tự | fixed: E1 so con số «bỏ N dòng khác cấp» với count(*) trong cùng transaction; E3 đổi thành ca khu vực có saved_markets được giữ (dòng còn nguyên) theo Hỏi-3 |
