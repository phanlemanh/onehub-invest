---
slug: do-the-duyet-du-du-lieu
at: 2026-10-30T23:30:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-1 trích audit §5.1 «độ đầy 10 trường mỗi bên theo nguồn», câu đó không quyết nguồn giá trị (sale_offers hay evidence của thẻ), mẫu số (bên rời kho) hay danh sách trường | Mạnh ký vì tưởng chỉ duyệt đề xuất audit trong khi AC-1 ghim lựa chọn chưa ai quyết; bên rời kho kéo tỉ lệ độ đầy xuống, số không so trước/sau được | Dòng sổ chi-nguoi kèm khuyến nghị và lối khác; AC-1 theo lựa chọn | fixed: Hỏi-2 (chi-nguoi, supersedes d-1) — khuyến nghị đọc sale_offers, loại bên rời kho khỏi mẫu số; AC-1 ghi theo khuyến nghị, chờ Mạnh ở Cổng Phạm vi |
| P0 | design | Dòng sổ d-3 trích Hỏi-3 của do-danh-ba-sdt, không phải quyết định cho hàng này; audit §5.1 đặt chỗ ở pipeline/sql/450_*; kho_dao false dù bước chạy trong job thật | Cổng 1 duyệt sai chỗ đặt và nhịp; chọn 450_* thì AC-3, AC-4, AC-7 viết lại | Dòng chi-nguoi: cloud-sync hay SQL 450, ghi giá từng lối, kho_dao có lý do | fixed: Hỏi-3 (chi-nguoi, kho_dao true, supersedes d-3) — khuyến nghị bước cuối cloud-sync; ghi giá: 450_* chỉ chạy trong finalize-hanoi.sh mỗi Chủ nhật |
| P1 | contract | Không thước ngoài cho số so; E2, E6 so với câu đo cùng người viết | Lệnh và probe cùng hiểu sai khoá evidence mà eval vẫn xanh | Oracle ngoài lệnh: số audit trên DB 30/10, hoặc thước thay thế | fixed: AC-6/E6 so anh-ops/anh-admin với bộ đọc ảnh thật của app (review-media.ts theo vai); số audit 30/10 không dựng lại được (DB trôi) — ghi giới hạn ở Notes; roi-kho và do-day còn chỉ câu đo độc lập |
| P1 | evals | AC-3 hứa dòng fail không đổi mã thoát, không eval nào đo | Lệnh thoát 1 khi có fail → JOB FAIL mỗi lượt cloud-sync mà E3, E4 xanh | Ca --write có fail → exit 0, đối chứng đỏ | fixed: E3 thêm fixture so>0 ở ba kiểm đầu, --write thoát 0 và có dòng fail; đối chứng 'FAIL DOI MA THOAT' |
| P1 | contract | Không AC đo phía cloud; bước ghi đứng sau sync-cloud | Dòng the-duyet:* không lên cloud mà mọi eval local xanh | Câu đọc thật của bước sync mang đủ dòng hôm nay | fixed: AC-8/E4b — FILL + selectList + localReadSql thật của sync-cloud.mjs trả đủ dòng the-duyet:* trên DB thử; đối chứng 'KHONG LEN CLOUD'; lên cloud trễ một lượt (≤ 15 phút) ghi trong AC |
