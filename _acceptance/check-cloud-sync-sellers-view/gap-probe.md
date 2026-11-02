---
slug: check-cloud-sync-sellers-view
at: 2026-11-01T03:06:20Z
verdict: findings
p0: 0
p1: 1
p2: 3
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | Ô đối chứng «trigger lịch sử» của E1 chỉ đo psql có gãy hay không, không ghim vì sao gãy, và không đi qua đường dump() thật như AC-1 viết | Ô dump riêng sale_offer_records nạp vào DB trống không có areas và postgis — khoá ngoại tới areas làm psql gãy dù trigger có hay không; ô in ĐỎ-ĐÚNG vì lý do khác | Bắt stderr và ghim lý do: ô view chứa tên bảng nguồn kèm «does not exist»; ô trigger chứa «history_» kèm «does not exist»; ô trigger dùng đúng đầu ra dump() của thước mà không xoá trigger | fixed: hai ô nay bắt stderr và ghim lý do (view: «does not exist» + registry_aliases/sale_offer_records/sale_offers/parties/v_ruler; trigger: «history_…() does not exist»). Ô trigger dùng dump([...FILL, source_registry]) thật với cờ giuTrigger, nạp vào DB có postgis; nhánh đã xoá trigger được chứng nạp được bởi mọi ca dựng cloud mô phỏng. |
| P2 | evals | Regex xoá CREATE TRIGGER không có ô đếm hay ghim xoá những gì, và không bắt CREATE CONSTRAINT TRIGGER | Một trigger mà cloud thật cũng mang bị bỏ lặng khỏi cloud mô phỏng; hoặc câu trigger nhiều dòng không bị bắt, ca gãy EPIPE không tên | Tập trigger bị xoá phải đúng tập history_* của 059; đầu ra đã xoá không còn câu tạo trigger | fixed: dump() ghi mọi trigger bị bỏ vào TRIGGER_BO; ca sellers-view đỏ «TRIGGER LA» khi có tên ngoài history_tin_moi/history_doi_gia/history_doi_trang_thai (hoặc không bỏ trigger nào), và đỏ khi bản dump đã xử lý còn bất kỳ dòng CREATE TRIGGER / CREATE CONSTRAINT TRIGGER nào. |
| P2 | contract | Coverage khai trục «nguồn chưa áp 060 — dump như cũ» nhưng không eval nào chạy trên nguồn chưa áp 060/059 | Nhánh SELLERS_VIEW sai và BAN_GHI rỗng không được chạy; người duyệt tưởng trục đã phủ | Thêm eval với CLOUD_SYNC_SRC_DB trỏ bản sao trước 060, hoặc đưa trục ra Out of scope | fixed: trục chuyển sang Out of scope (máy thu đã áp 060, không còn bản sao trước 060 để đo); Coverage chỉ còn hai hình nguồn đo được. |
| P2 | evals | E1 so local mô phỏng với view nguồn bằng số dòng + md5 khoá; vế sync chỉ so số dòng — sáu cột còn lại không được so | Cột COPY lệch thứ tự hay kiểu so với DDL 022 mà khoá vẫn khớp; dữ liệu sai nằm cả hai phía, không ai bắt | Băm trọn bảy cột view↔local; sau sync băm cột cho phép local↔cloud; đối chứng đảo hai cột ngày | fixed: băm row_to_json trọn bảy cột view nguồn ↔ local mô phỏng; sau sync băm các cột CLOUD_ALLOW local ↔ cloud; ô ĐỎ-ĐÚNG đảo first_seen/last_seen thì băm lệch. |
