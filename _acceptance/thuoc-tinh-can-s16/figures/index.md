# Điểm quyết định Cổng Phạm vi — thuoc-tinh-can-s16

| Điểm | Đếm (N5) | Hình |
|---|---|---|
| Hỏi-1 giá CĐT S16 lên Invest/cloud | 2 nhánh, không bước nối tiếp | dưới ngưỡng: 2 nhánh rẽ một lần — gộp vào hình luồng dữ liệu |
| Hỏi-2 hướng ban công | 2 nhánh | dưới ngưỡng: bảng số trong bang-phu-ca §2 rõ hơn hình |
| Hỏi-3 phát biểu (A) thẳng hay view tạm (C) trước | 2 nhánh × 3 bước (stg → phân xử → màn) | cần hình — luồng dữ liệu A vs C |
| Phương án A (phát biểu Unit + view giá) | 4 bước nối tiếp | cần hình — cùng hình trên |
| bỏ design-pass | 1 | dưới ngưỡng |

Đề bài hình «luong-du-lieu»: flowchart; nút: tệp thu (làn thu) → snapshot mngt-can-chi-tiet → stg_s16_can_chi_tiet (113) →
lệnh thuoc-tinh-can-s16 --ghi → field_assertions (Unit, S16, fact) → v_unit_thuoc_tinh → lớp đọc → trang dự án Danh bạ; nhánh
stg → v_s16_gia_cdt → lớp đọc; nhánh C nét đứt stg → view tạm → lớp đọc; ranh «máy thu» bao toàn bộ, sync-cloud ở ngoài có gạch
chéo (Hỏi-1). AC liên quan: AC-1, AC-5, AC-6, AC-7, AC-8, AC-9.

Vẽ dạng mermaid trong design.md §3a (vòng chính không dispatch bộ vẽ để giữ hạn mức tuần — ghi chú cho người duyệt).
