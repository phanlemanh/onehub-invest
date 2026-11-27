# HT28 — đối chứng khoá phụ «rồi tên» của `/api/v1/markets` chạy trên DB

## Vấn đề
HT23 (PR #542, đã gộp 04b9ddc3b) xếp `/api/v1/markets` theo `listing_count DESC, m.name`. Test
`app/tests/api-markets-khong-s02.test.tsx` ca HT23-AC-2 kiểm thứ tự trả ra, nhưng đối chứng cho nửa «bằng nhau thì theo
tên» (`theoChen`) chỉ sắp mảng thử bằng JS và một chú thích giả định Postgres giữ thứ tự chèn. Postgres không bảo đảm thứ
tự giữa các dòng bằng nhau khi không có khoá phụ, nên nếu route lỡ bỏ `, m.name` thì test có thể không đỏ. Mạnh ký HT23
với hai finding này làm hạn chế đã biết, đo bổ sung chuyển sang HT28 (sổ HT23 d-20261125T132821Z-15, -16).

## Khuôn route ở 04b9ddc3b (trích nguyên văn)
Câu SQL nằm trong `pool.query(` dưới dạng chuỗi backtick, tham số `[country, limit]` (`$1` = mã quốc gia, `$2` = giới
hạn); SELECT ngoài là `m.id, m.name, m.country_code, m.listing_count`; mệnh đề xếp là
`ORDER BY m.listing_count DESC, m.name`, rồi `LIMIT $2`.

## Thiết kế
1. **Đối chứng trên DB, dựa trên SQL thật của route.** Test đọc `app/src/app/api/v1/markets/route.ts`, rút câu SQL nằm
   trong lời gọi `pool.query(` (chuỗi backtick đầu tiên sau nó). Chạy câu ấy trên cùng DB thử với `$1 = 'zz'`, `$2 = 5`:
   ra đúng `MONG`. Thay khoá phụ `m.name` bằng `m.name DESC` rồi chạy lại: thứ tự hai cặp bằng số tin đảo
   (Beta trước Alpha, Gamma trước Aaa), khác `MONG`. Cặp hai chiều này chứng rằng tập thử có cặp bằng số tin và chính khoá
   phụ của route quyết thứ tự trong cặp — không dựa vào thứ tự vật lý.
2. **Soát văn bản khoá phụ.** Hàm thuần `coKhoaPhuTheoTen(sql)` CHỈ xét mệnh đề `ORDER BY` (từ `ORDER BY` tới `LIMIT`
   hay hết câu): trả `true` khi danh sách khoá là đúng `m.listing_count DESC` rồi `m.name` (tăng dần). `m.name` ở SELECT
   không tính. Ca test: `true` với SQL rút từ route; đối chứng âm là bản chỉ sửa trong `ORDER BY` (bỏ `, m.name`) mà SELECT
   vẫn còn `m.name` → `false`, thông điệp ghim «route mất khoá phụ rồi tên»; thêm `m.name DESC` → `false`. Đây là chiều
   đỏ tất định cho đột biến bỏ khoá phụ, thứ mà phép so thứ tự trên DB không bảo đảm bắt được.
3. **Gỡ đối chứng mô hình JS** `theoChen` và chú thích «sort ổn định giữ thứ tự chèn». Giữ thứ tự chèn ngược tên (vẫn có
   ích: tăng xác suất route mất khoá phụ đỏ ở phép so thứ tự), chú thích mới ghi nguyên cụm «chiều đỏ tất định nằm ở
   HT28-AC-2».
5. **Tên ca để lệnh chấm lọc được:** «HT28-AC-1 …», «HT28-AC-2 …». Mỗi eval chạy đúng một ca bằng `--test-name-pattern`
   và đòi dòng `ℹ pass 1`, nên ca bị bỏ qua hay không khớp tên thì eval đỏ.
4. Không sửa route, không sửa tiêu chí HT23. Hàng chỉ chạm tệp test.

## Ngoài phạm vi
- Rút khuôn SQL thành hằng xuất khẩu của route (đổi mã sản phẩm để test dễ hơn) — không cần, đọc văn bản đủ.
- Sửa các test khác dùng tên DB dự phòng «…_khong_dung» (lưu ý đã báo GS 25/11).

## Sau áp HT23
Prod 2026-11-25 18:11:28Z (GS đo sau gộp 04b9ddc3b): `GET /api/v1/markets?country=vn&limit=5` trả 5 dòng, 0 khoá
`marketScore`, xếp theo số tin rồi tên. Trước gộp: 5/5 dòng có `marketScore`.
