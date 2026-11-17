# Số chạy thử TG1 trên bản chép oneinvest_u1_tg1

Chạy lúc 2026-11-16T13:23:27.835Z · 0.53 giây (áp 108 + đọc + dựng nháp + ghi) · ghi {"tao":0,"cap_nhat":0,"giu_da_quyet":4,"khong_doi":22}

| Lớp | Lệnh dựng nháp | Đếm độc lập |
|---|---|---|
| so_mot_du_an | 13 | 13 |
| so_chua_ghi | 8 | 8 |
| so_nhieu_du_an | 3 | 3 |
| ngoai_so | 2 | 2 |
| so_khong_bai | 3 | 3 |
| **nhóm có bài / số thẻ** | **28** | **26** |

Nhóm có từ 5 bài đọc: 24 (sàn một nửa = 12)

| Ô | Nhóm có giá trị |
|---|---|
| dự án | 21 |
| phường | 21 |
| phân khu | 0 |
| bán/thuê | 24 |

**ĐỎ**: số thẻ 28 ≠ số nhóm có bài đếm độc lập 26

## Vì sao lượt này ĐỎ, và con số nào là con số thật

Mốc cũ trong hợp đồng AC-7 là **27**; sau khi lệnh dựng nháp gạt bài thử (bản vá 1eccf666, cùng định nghĩa
`pipeline/lib/test-posts.mjs` như mọi transform đọc `stg_zalo_posts`), số nhóm thật có bài là **26**. Mốc 27 của AC-7
chưa được sửa — đổi lời một tiêu chí đã qua Cổng Phạm vi và Cổng 1.5 là việc của người ký, nên nó đi lên thẻ Cổng Bằng
chứng thành một dòng riêng (sổ quyết định `d-20261116T111833Z-24`, loại `revisit`, serves AC-7).

Dòng ĐỎ không phải vì dựng thẻ sai. Năm lớp đều khớp từng đôi một (13/13, 8/8, 3/3, 2/2, 3/3) và bốn lớp có bài
cộng lại đúng 26; `ghi` cho thấy lượt chỉ chạm 26 nhóm (22 không đổi + 4 giữ đã quyết, 0 tạo mới). Cái vỡ là
`count(*) FROM group_address_cards` = **28**: bản chép còn hai thẻ của hai nhóm TOÀN bài thử (TN-138, TN-140) do
lượt dựng nháp TRƯỚC khi có bộ lọc, và `ghiNhap` không có nhánh nào gỡ thẻ của nhóm thôi đủ điều kiện.

Không dựng lại bản chép để lấy màu xanh: xem `discovery/vong-6-hai-cho-do.md`.

## Chất lượng nháp (E8, cùng bản chép)

Dựng nháp bỏ qua sổ cho 13 nhóm sổ ghi đúng một dự án: dự án đứng đầu nháp trùng dự án của sổ ở **12/13** nhóm (đạt khi từ
9). Nhóm không khớp: S03-N026 — nháp trống ô dự án (nhóm có ít bài nêu tên dự án, dưới ngưỡng ≥ 3 bài và ≥ 10%).

## Ý nghĩa cho bước áp

- Sau khi áp và dựng nháp trên DB máy thu: `kiem-sau.sql` phải in `so_the` = `nhom_co_bai` = **26** (máy thu áp 108 lần
  đầu nên bảng thẻ rỗng, không có thẻ mồ côi như bản chép), mọi thẻ `nhap`, 0 thẻ thiếu lịch sử. Ô phân khu trống ở mọi
  thẻ là đúng luật (không nhóm nào có ≥ 50% bài nêu cùng một phân khu).
- **Các lần chạy SAU trên máy thu**: hễ quy tắc gạt đổi hay bài bị gỡ khỏi `stg_zalo_posts`, thẻ của nhóm thôi đủ điều
  kiện sẽ nằm lại và `kiem-sau.sql` báo lệch y như lượt này. Hồ sơ chưa có lệnh chữa — người ký quyết sửa trong hàng này
  hay cắt hàng riêng.
- Lệnh dựng nháp mất dưới một giây; không cần khung giờ riêng ngoài luật chung (ngoài 17:00–18:00Z, tải dưới 14).
