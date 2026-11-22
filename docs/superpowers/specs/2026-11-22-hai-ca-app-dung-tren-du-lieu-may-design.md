# HT3 · hai-ca-app-dung-tren-du-lieu-may

Ngày 2026-11-22 · dãy U1 · T2 · hồ sơ `_acceptance/hai-ca-app-dung-tren-du-lieu-may/`. GS phán cách sửa (tin 22/11).

## Phân loại (đo 22/11)

- Worktree tạm tại origin/main b28bdbd3d, DB thử chép mới: cả hai đỏ. Lùi main 21/11 3c529c0b4: đỏ y hệt → đỏ do dữ liệu.
- CI #520 job `app`: cả hai ca DB «﹣» (bỏ qua) — `npm test` của CI không có `DATABASE_URL`; SD-AC-6 tự bỏ khi `CI`.

## DO3-AC-7

Bảng lát (`lam-giau-bang.tsx` `BangLuoi`, pageSize 10) xếp ô theo số; `phanRa` luôn gán ô chưa gắn và `hienO` luôn giữ nó, nhưng
ô ấy đứng cuối. Dữ liệu máy: 28 ô phường có số → ô chưa gắn ở trang 3. (Giả thuyết ban đầu «dữ liệu hết dòng thiếu phường sau
DA45» SAI — bỏ.) Sửa: soát trên `latThayDoi(data.duong, "phuong")` (mô hình dòng mọi trang), chiều đỏ xoá ô chưa gắn khỏi dữ
liệu lát; assert hiện trạng «>10 ô có số thì ô chưa gắn không ở trang 1» để ngày ai ghim nó lên đầu thì ca báo. Không nới
pageSize (đổi cách vẽ trong test).

## SD-AC-6

Luật hiển thị (GS duyệt): số thật → có `broker_n_ads`; số suy → `broker_n_ads` = `n_ads` của số trong danh bạ, null khi số
chưa có người; màn hiện «Chưa rõ số tin» khi null. `dealsSql` không đọc cột suy → ca tự nối `sale_offers.seller_phone_inferred`
+ `sellers.n_ads`. Đọc dealsSql không trần (trần 500 cũ che 163 tin). Tin tự cấy đặt ở cặp phường × loại hình có thước
(`THUOC_CUNG_LOAI`); số suy cấy SAU bước đêm vì bước gán số qua người đăng rút số suy không có Người làm căn cứ.

Số đo hôm nay: 170 tin bán P1 số suy (đều S03 «s03-qua-nguoi-dang»), 149 có số tin, 21 null; trong tập dealsSql 45 ngày: 522
số thật, 55 số suy có số tin, 12 số suy null.
