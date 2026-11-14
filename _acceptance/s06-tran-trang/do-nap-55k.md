# Đo chuỗi đêm S06 với trần 210 — s06-tran-trang AC-4

Đo 14/11, 08:46Z–09:13Z, dưới khoá `duong-nen` của đợt, trần 60 phút. Mỗi lượt thu ghi bằng vùng và giờ thu, không
ghi đường snapshot.

- **DB thử:** `db/db-thu.sh` chép cả lược đồ lẫn dữ liệu của DB máy thu vào DB thử `oneinvest_p2_s06do`, mất 61 giây. Hai
  lượt nạp nối tiếp trên cùng DB này: lượt 16 nghìn trước, lượt 55 nghìn sau. DB thử đã xoá sau khi đo.
- **Tải máy (1 phút):** 14,1–15,4 lúc dựng DB và nạp lượt 16 nghìn, hơi trên ngưỡng 14 giám sát đặt. Còn 6,0–8,9 trong
  lượt 55 nghìn và hộp resolve-properties.
- **Việc chạy cùng:** lượt chấm của dãy khác đang chạy trên máy. Không có bước thu hay nạp S03, S06 nào chạy trên DB thử.

## Hai lượt thu

| Lượt | Giờ thu (UTC) | Tin | Bước thu (manifest) |
|---|---|---|---|
| Trần 25 (lượt thường) | 07:00:03 → 07:10:38 | 16.189 | 10′35″ |
| Trần 210 (lượt thử của ZCode, chưa nạp) | 07:47:15 → 08:23:39 | 55.686 | 36′25″ |

Chia theo vùng, trần 210: hanoi 8.417 · hcmc 30.424 · da-nang 7.011 · binh-duong 9.698 · hai-phong 136. Lượt trần 25: hanoi
4.128 · hcmc 4.490 · da-nang 3.420 · binh-duong 4.013 · hai-phong 138.

Bước thu dài thêm 25′50″ (gấp 3,4 lần), không 403/429.

## Nạp trên DB thử

| Bước | Lượt 16 nghìn | Lượt 55 nghìn |
|---|---|---|
| import (năm vùng) | 34″ | 40″ |
| transform-chotot | 2′19″ | 2′09″ |
| reassign-areas | 1″ | 2″ |
| 300_metrics + 400_breakdowns | 1″ | 0″ |
| Dòng `stg_chotot_ads` sau lượt | 100.424 (không đổi) | 107.928 (+7.504) |

- **Lượt 16 nghìn:** cả 16 nghìn tin đã có sẵn trong bảng (lượt này đã được nạp vào máy thu), nên đây là lượt chỉ
  cập nhật.
- **Lượt 55 nghìn:** chỉ thêm 7.504 dòng mới vì bảng đã chứa 100 nghìn tin từ các lượt trước. Riêng vùng binh-duong
  NẠP HỎNG (mục dưới), nên số dòng mới thực tế khi nạp đủ sẽ cao hơn chút.
- **transform-chotot:** khoảng 2 phút ở cả hai lượt. Bước này chạy trên toàn bảng nên không tăng theo cỡ lượt thu.

### Phát hiện chặn: một tin thiếu `region_v2` làm hỏng nạp cả vùng

Snapshot binh-duong trần 210 có 1 trong 9.698 tin thiếu `region_v2`. Tin này có `region` nhưng không có `area_v2`.

- `import-chotot.mjs` ghi `NOT NULL` cho cột này, nên lượt nạp vùng thoát 1 với lỗi `23502 null value in column
  "region_v2"`, và cả vùng không vào bảng.
- Trong `scripts/chotot-daily.sh`, nạp hỏng đặt `IMPORT_FAILED=1` và chuỗi dừng TRƯỚC transform. Một tin lạ như vậy là
  đủ để cả chuỗi đêm S06 không chạy transform và resolve-properties.
- Trang sâu nhiều tin lạ hơn, nên nâng trần 210 làm ca này dễ xảy ra hơn.
- Bộ nạp là làn ZCode. Đã báo giám sát để trả liên làn.

## resolve-properties — ước lượng, không chạy trọn

Chạy trên DB thử sau lượt 55 nghìn, trong hộp 20 phút, rồi bị ngắt đúng hẹn (mã 143).

- **Số cụm Stage A:** 88.969. Đếm bằng chính biểu thức cụm của tệp nguồn, trên toàn bộ tin S06 có toạ độ, diện tích và
  giá.
- **Trong 20 phút:** `properties` tăng từ 84.323 lên 84.936 (+613), `property_offers` từ 94.274 lên 94.923 (+649).
- **Không đo được tốc độ cụm/phút:** bước này không in tiến độ, và bộ đếm chèn/cập nhật của bảng không đọc được trên DB
  thử. Số căn mới chỉ đếm các cụm chưa có căn, không đếm cụm đã khớp.

Ước lượng: resolve-properties duyệt TOÀN BỘ cụm S06 mỗi lượt, không chỉ tin của lượt mới, nên thời lượng theo số cụm,
không theo số tin thu.

- Lượt 55 nghìn làm bảng tin tăng khoảng 7,5%. Nạp đủ binh-duong thì có thể khoảng 10%.
- Số cụm vì vậy tăng cùng cỡ, và resolve-properties dài thêm khoảng 8–15%: lượt 85 phút thành khoảng 92–98 phút, lượt
  hơn 4 giờ thành khoảng 4 giờ 20–4 giờ 40.
- **Mức sai:** lớn. Thời lượng hôm nay dao động từ 85 phút tới hơn 4 giờ theo khoá chờ và deadlock, rộng hơn nhiều so
  với phần tăng do cỡ bảng. Tốc độ theo cụm chưa đo. Việc đo và tăng tốc thuộc hàng RP1.
- Lượt đầu tiên sau khi gộp sẽ thêm nhiều căn mới hơn các lượt sau.

## Chuỗi đêm với trần mới

Lịch launchd `com.oneinvest.chotot`: 07:00Z và 22:30Z (14:00 và 05:30 giờ VN). Bước của chuỗi: thu → nạp →
transform-chotot → transform-media → refresh-bait-gap → resolve-properties. Phép đo không gồm transform-media và
refresh-bait-gap. reassign-areas, 300 và 400 không thuộc chuỗi S06 và đều xong dưới 3 giây.

| Lượt | Thu | Nạp + transform | resolve-properties (ước) | Kết thúc dự kiến |
|---|---|---|---|---|
| 07:00Z | 36′ | khoảng 3′ | 92′ tới khoảng 4 giờ 40 | khoảng 09:15Z tới khoảng 12:25Z, cộng transform-media |
| 22:30Z | 36′ | khoảng 3′ | như trên | khoảng 00:45Z tới khoảng 03:55Z; lượt sáng nay với trần 25 xong gộp căn khoảng 04:20Z, cộng thêm khoảng 30–40′ thì khoảng 04:50–05:00Z |

## Kết luận

- **Cửa S03 16:55Z–17:15Z:** không lấn. Lượt 07:00Z kết thúc muộn nhất khoảng 12:30–13:00Z, còn hơn 4 giờ trước cửa S03.
  Lượt 22:30Z bắt đầu sau cửa.
- **Hai lượt trong ngày:** không chồng. Lượt 22:30Z kéo tới khoảng 05:00Z trong ca xấu, lượt chiều bắt đầu 07:00Z, còn
  khoảng 2 giờ.
- **resolve-properties:** dài thêm khoảng 8–15% vì bảng tin lớn hơn. Đây là ước lượng, mức sai lớn.
- **Đề xuất:** giữ giờ. Không cần chia lượt vì thời gian.
- **NHƯNG chưa nên gộp** khi bộ nạp còn hỏng cả vùng vì một tin thiếu `region_v2` (mục trên). Với trần 210, ca này đã
  xảy ra ngay ở lượt thử, và nó dừng cả chuỗi trước transform. Cần ZCode sửa bộ nạp trước, ví dụ bỏ hoặc gắn mặc định
  cho tin thiếu `region_v2` thay vì huỷ cả vùng, hoặc đặt trần cũ qua biến môi trường cho tới khi sửa xong.
