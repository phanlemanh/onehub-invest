# Số chạy thử TG1 trên bản chép oneinvest_u1_tg1

Chạy lúc 2026-11-16T06:03:43.353Z · 0.26 giây (áp 108 + đọc + dựng nháp + ghi) · ghi {"tao":28,"cap_nhat":0,"giu_da_quyet":0,"khong_doi":0}

| Lớp | Lệnh dựng nháp | Đếm độc lập |
|---|---|---|
| so_mot_du_an | 13 | 13 |
| so_chua_ghi | 10 | 10 |
| so_nhieu_du_an | 3 | 3 |
| ngoai_so | 2 | 2 |
| so_khong_bai | 1 | 1 |
| **nhóm có bài / số thẻ** | **28** | **28** |

Nhóm có từ 5 bài đọc: 24 (sàn một nửa = 12)

| Ô | Nhóm có giá trị |
|---|---|
| dự án | 21 |
| phường | 21 |
| phân khu | 0 |
| bán/thuê | 24 |

**ĐẠT**

Bản chép dựng lại lúc 06:03Z ngày 16/11 (sau lượt ghi offer_project 03:59Z); số giống lượt 00:47Z.

## Chất lượng nháp (E8, cùng bản chép)

Dựng nháp bỏ qua sổ cho 13 nhóm sổ ghi đúng một dự án: dự án đứng đầu nháp trùng dự án của sổ ở **12/13** nhóm (đạt khi từ
9). Nhóm không khớp: S03-N026 — nháp trống ô dự án (nhóm có ít bài nêu tên dự án, dưới ngưỡng ≥ 3 bài và ≥ 10%).

## Ý nghĩa cho bước áp

- Sau khi áp và dựng nháp trên DB máy thu: `kiem-sau.sql` phải in `so_the` = `nhom_co_bai` ≈ 28, mọi thẻ `nhap`, 0 thẻ thiếu
  lịch sử. Ô phân khu trống ở mọi thẻ là đúng luật (không nhóm nào có ≥ 50% bài nêu cùng một phân khu).
- Lệnh dựng nháp mất dưới một giây; không cần khung giờ riêng ngoài luật chung (ngoài 17:00–18:00Z, tải dưới 14).
