# Đo CG10 trên bản chép DB máy thu (AC-9)

Lệnh: `bash pipeline/scripts/gia-tot-du-an-db.sh do` — DB thử `oneinvest_n1_cg10_do` chép từ DB máy thu (db/db-thu.sh), áp 104,
view offer_project (bản chép thân 105 của DV7 — DB máy thu chưa áp 105), 106; chấm hai lần; đếm độc lập. Chạy 15/11/2026 12:47Z,
giữ khoá s4 của đợt, nhánh `feat/gia-tot-cap-du-an` @ 6e905784.

## Điểm xong (đối chiếu sau khi áp lên máy thu)

| Thước | Bản chép 15/11 | Đích |
|---|---|---|
| Tin căn hộ có hạng cấp dự án (thước MN1) | **13.400** | ≥ 10.000 |
| Danh sách `/ops/deals?project=1` (Vinhomes Ocean Park 1) — đếm qua chính câu `dealsSql` của app | **140 căn** (141 tin) | ≥ 100 căn |
| Nhãn «Giá tốt» cấp dự án | bán 915 · thuê giá/m² 1.196 · thuê giá tháng × PN 577 | — |
| Dải m² dự án × PN | 288 nhóm, 7.056 mẫu | — |
| Bước chấm | 6,1 giây/lượt | — |

Mẫu số: tin đang rao bán 51.778 · thuê 60.572.

## Tin S03 (mốc MS2 — lát l03)

Trên cùng bản chép: **4.109 tin S03** có hạng cấp dự án (thuê 3.071 · bán 1.038), trong đó **841** mang nhãn «Giá tốt»; 4.008 trong số
đó là căn hộ. Độ lệch so mặt bằng S06 đọc ở cột «Giảm so thước» của `/ops/deals` (thước cấp dự án gồm tin mọi nguồn cùng dự án).

## Bảng đếm (cấp · bán/thuê · thước · ô · số tin)

```
du_an  · rent_lt · gia-m2       · chi-so            · 5069
du_an  · rent_lt · gia-m2       · nhan:gia-tot      · 1196
du_an  · rent_lt · gia-thang-pn · chi-so            · 2060
du_an  · rent_lt · gia-thang-pn · nhan:gia-tot      · 577
du_an  · sale    · gia-m2       · chi-so            · 3684
du_an  · sale    · gia-m2       · nhan:gia-tot      · 915
phuong · rent_lt · gia-m2       · chi-so            · 38498
phuong · rent_lt · gia-m2       · nhom-duoi-5       · 368
phuong · rent_lt · gia-m2       · re-trong-phuong   · 10382
phuong · rent_lt · gia-thang-pn · chi-so            · 234
phuong · rent_lt · gia-thang-pn · nhom-duoi-5       · 13
phuong · rent_lt · gia-thang-pn · re-trong-phuong   · 36
phuong · sale    · gia-m2       · chi-so            · 32589
phuong · sale    · gia-m2       · nhom-duoi-5       · 644
phuong · sale    · gia-m2       · re-trong-phuong   · 8542
(không chấm theo lý do: chua-ro-loai, thieu-phuong, thieu-gia, ngoai-khoang, phi-ly, thieu-dt-va-pn — như CG9)
```

## Kiểm độc lập

`lech=0` · `khong_dung_lai=0` · `sai_khoa=0` · `nhan_nhom_duoi_10=0` · `tong_lech=0` · `lan_hai_khac=0` → KẾT: đạt.

Đối chứng: «nhóm theo phường thay dự án» → `sai_khoa=15475` (đỏ đúng); «mỗi tin một phiếu» → `lech=90600` (đỏ đúng).
