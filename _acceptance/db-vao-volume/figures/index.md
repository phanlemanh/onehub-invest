# Hình tại điểm quyết định — db-vao-volume (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 cách chuyển (chép vật lý vs pg_restore) — d-20261029T080917Z-2 | 9 bước nối tiếp + 2 nhánh (chép / pg_restore) | `chuyen-du-lieu` |
| Hỏi-5 lúc chuyển (trong S3, merge trước CN 19:30) — d-…-15 | 4 mốc nối tiếp + 2 nhánh (merge kịp / quá hạn) | gộp vào `chuyen-du-lieu` (dải mốc dưới cùng) |
| Hỏi-2 sửa diff check-db-autostart | dưới ngưỡng: 2 bước, 1 nhánh | — |
| Hỏi-3 chỗ gắn volume | dưới ngưỡng: 1 bước, 2 nhánh tĩnh | — |
| Hỏi-4 chỗ khôi phục thử | dưới ngưỡng: 1 bước, 2 nhánh tĩnh | — |

## Đề bài hình `chuyen-du-lieu`

- Loại: flowchart ngang (swimlane 2 làn: «container cũ one-invest-db» · «volume onehub_pgdata + container mới»), dải mốc thời gian ở dưới.
- Nút làn trên: sao lưu + khôi phục thử (khoi-phuc-ok) → tiền điều kiện → pg_ctl stop -m fast → đổi tên one-invest-db-cu-YYYYMMDD, restart=no (GIỮ, không xoá) ; làn dưới: chép thư mục 17/ vào volume → tar --diff + pg_controldata → compose up (project onehub-db) → đếm số dòng → force-recreate → đếm lại.
- Nhánh: từ «chép vật lý» rẽ phụ nét đứt «lối khác: pg_restore bản dump (~20–40′ ngừng, dựng tay ALTER SYSTEM, DB của ZCode, pg_cron)»; mũi tên lùi nét đứt từ cuối về container cũ: «--lui: bật lại bản lùi».
- Dải mốc: Gate 1.5 ký → báo liên làn → chuyển (3–6′ ngừng, ngoài ±20′ job launchd) → Cổng Bằng chứng → merge trước CN 01/11 19:30 (nhánh: quá hạn → lùi hoặc hoãn job tuần).
- AC: AC-3…AC-9.
