# Đo bảng hạng giá trên bản chép DB máy thu — CG9 bang-hang-gia-m2

Bản chép `oneinvest_u1_cg9` (db/db-thu.sh, 14/11/2026 ~12:30 giờ VN), áp 104 trên bản chép, chạy `pipeline/scripts/hang-gia-do.mjs`
(bước chấm hai lần + đếm độc lập bằng SQL viết riêng). Không ghi gì lên DB máy thu.

Mẫu số (tin đang rao): bán 45.725 · thuê dài hạn 54.260. Bước chấm: 2,8 giây/lượt.

| Loại tin | Có nhãn «Rẻ trong phường» | Chỉ số (không nhãn) | Không chấm |
|---|---|---|---|
| Bán | 8.477 | 32.929 | 4.319 (phi lý 1.244 · ngoài khoảng 925 · thiếu phường 674 · nhóm dưới 5 659 · thiếu giá 607 · chưa rõ loại 210) |
| Thuê | 10.725 | 41.470 | 2.065 (phi lý 948 · thiếu phường 286 · ngoài khoảng 241 · nhóm dưới 5 373 · chưa rõ loại 167 · thiếu cả m² lẫn PN 50) |

Phép đếm độc lập: lech=0 · khong_dung_lai=0 · so_khac_loai=0 · nhan_nhom_duoi_10=0 · tong_lech=0 · lan_hai_khac=0 → đạt.
Đối chứng hỏng (bản 420 «mỗi tin một phiếu»): lech > 0 → đỏ đúng.

Lượt đo đầu (cùng ngày, trước hai sửa ở S3) ra lech=27.391 và 20.902 tin bị loại «phi lý»: căn S06 có tin ở hai phường mất phiếu ở
một nhóm, và luật «phòng quá nhỏ» loại oan nhà phố (diện tích đất). Cả hai đã sửa, có ca test riêng (CG9-AC-2, CG9-AC-3).
