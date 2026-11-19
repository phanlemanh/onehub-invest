# Nhật ký áp lên DB máy thu — DA40 thuoc-tinh-can-s16, 19/11/2026

Hồ sơ đã ký: `_acceptance/thuoc-tinh-can-s16/` (PR #491). Lệnh áp, số chạy thử đã ký, cách lùi, lệnh kiểm sau ở
`_acceptance/thuoc-tinh-can-s16/ap-may-thu.md` — tệp đó giữ nguyên bản đã ký; nhật ký áp ghi ở đây (quy ước giám sát 19/11:
nhật ký áp máy thu ở `docs/ops/nhat-ky-ap/<ngày>-<mã>-<slug>.md`, không sửa hồ sơ đã ký). Mục 3, 4, 5 dưới đây là mục của
`ap-may-thu.md`.

## Số đối chiếu mới (thay khối mục 3 cho lượt áp này)

Lời Mạnh ở phiên giám sát lúc 2026-11-19T02:39:41Z (mã câu hỏi h-20261119T004426Z-235), nguyên văn: «Nhận, theo khuyến nghị», trả lời câu «Nhận bộ số mới (+2 căn Grand Park) làm số đối chiếu cho lượt áp tối nay?». Khối đã ký ở mục 3 của `ap-may-thu.md` giữ nguyên; lượt áp này đối chiếu theo khối dưới.

Đo 2026-11-19 00:37–00:42Z trên bản chép mới của DB máy thu, code `main` 0e76e7553: áp 113 hai lần, áp 118, bộ nạp thật nạp 95.798/95.798 (bỏ 0),
chạy thử, `--ghi`, `kiem.sh that`. Bản chép đã xoá.

Tổng: phát biểu 441.193 · căn danh bạ có thuộc tính 84.822 · căn có bí danh S16 111.331 · căn có giá chủ đầu tư 11.852 · tầng lệch 41 · mã hai toà
trong snapshot 862 · mã có thuộc tính chưa có căn danh bạ 10.114. Diện tích thứ hai: tim tường 69.678 (cao tầng) + đất 15.144 (thấp tầng).

Thứ tự cột: nối · thông thuỷ/sàn · tim tường hoặc đất · PN · WC · hướng · loại hình · giá chủ đầu tư.

```chay-thu
grand-park | 37591 | 37591 | 37591 | 35976 | 436 | 28316 | 36973 | 1850
ocean-park | 32097 | 32097 | 32097 | 27440 | 22063 | 31808 | 30919 | 9999
ocean-park-2 | 9791 | 9791 | 9791 | 9791 | 0 | 2492 | 9791 | 3
ocean-park-3 | 2797 | 2797 | 2797 | 2797 | 0 | 2782 | 2797 | 0
smart-city | 2546 | 2546 | 2546 | 2546 | 2476 | 2497 | 2502 | 0
```

Khác khối đã ký đúng 6 ô, đều ở grand-park và đều +2: nối, thông thuỷ, diện tích thứ hai, PN, hướng, loại hình.

Lưu ý khi đối chiếu: `kiem.sh that` so với khối mục 3 và bảng phủ ca đã ký, nên sẽ thoát 1 và báo 6 ô lệch này. Theo lời trên, `kiem.sh that` đỏ đúng 6 ô grand-park đó thì không tính là lệch; bất kỳ ô đỏ nào khác thì dừng và báo giám sát.

## Nguyên nhân chênh

Job đêm 18/11 `zalo-import-daily`, bước dựng danh bạ chạy lần đầu trên mã của #490, đúc thêm 2 căn grand-park.
`pipeline/logs/zalo-import.log` dòng 33259: «S16: khoá mới 2, mốc 2026-11-18T17:06:39.709908Z». Hai căn có `first_seen` đúng giây đó và có thuộc tính thật trong snapshot.

## Lệnh đếm căn S16 đúc mới kể từ mốc (chạy ngay trước bước chạy thử)

```bash
docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "SELECT count(*) FROM registry_aliases a WHERE a.source='S16' AND a.kind='ma_nguon' AND a.retired_at IS NULL AND a.object_key LIKE 'unt\_%' AND a.first_seen > '2026-11-18T17:06:39.709908Z'"
```

Kết quả đo 2026-11-19: 0 căn (tổng căn có bí danh S16: 111.331).

Quy tắc khi lại chênh, theo lời trên: chênh thêm mà khớp đúng số căn S16 đúc mới ghi trong log «S16: khoá mới N» kể từ mốc 17:06:39Z ngày 18/11 thì vẫn áp và ghi rõ; chênh kiểu khác thì dừng.

## Lượt thu lỗi

Manifest snapshot ghi 6.456 lượt thu lỗi. Các lượt này không nằm trong khối số vì khối chỉ đếm 95.798 item thu được; căn tương ứng hiện «Chưa có thuộc tính» trên trang dự án.

## Chạy thay bộ nạp

Lời Mạnh: «Cho P1 chạy thay» — chỉ lệnh nạp, chỉ khi ZCode kẹt hoặc vắng (giám sát chuyển lúc 15:02Z ngày 19/11). ZCode đã nhận vòng
1911-1 nhưng im từ 09:36Z; điều phối liên làn báo kênh (claudedp-1911-6) rồi nhắn P1 «được chạy thay» lúc 15:46Z. Lệnh:
`DATABASE_URL=… node pipeline/import-s16-chi-tiet.mjs <thư mục snapshot sv14 thu 2026-11-18T00:30:57Z> --may-thu`, từ checkout chính ở
`main` 6932c66d2, sau khi áp 113 và 118. Kết quả 15:46:49Z: «nạp 95798/95798 dòng stg_s16_can_chi_tiet (đọc 95798 item, snapshot 1 dòng
airbnb_snapshots); bỏ 0 kind-lạ, 0 thiếu-du-an, 0 thiếu-mã-căn» — đúng kỳ vọng 95.798/0/0. (Lần gọi đầu thiếu `DATABASE_URL` nên dừng trước
khi mở DB, không ghi gì.)

## Kết quả áp

Người chạy: phiên P1, đợt dot0-cam-mau. Áp từ checkout chính ở `main` **6932c66d2** (sau #497).

| Bước | Giờ (UTC, 19/11) | Kết quả |
|---|---|---|
| Kiểm trước | 15:00–15:30 | 113 chưa áp; 0 phát biểu S16 trên căn; lượt S03 15′ cuối (22:00 VN) xong trước khi áp; câu đọc `field_assertions` chạy dài lúc đó nằm trên DB thử `oneinvest_suite_*`, không khoá DB thật |
| 1. Sao lưu | 15:30:09–15:30:13 | `state/sao-luu/truoc-113-20261119T153009Z.dump` 39.839.896 B · `state/sao-luu/luoc-do-truoc-113-20261119T153009Z.sql` 554.688 B |
| 2. Áp 113 (hai lần), 118 | 15:30:21–15:30:22 | `ON_ERROR_STOP=1`, không lỗi; lần hai chạy lại sạch (`INSERT 0 4` như lần một) |
| Nạp (chạy thay, mục trên) | 15:46:49 | 95.798/95.798, bỏ 0/0/0 |
| Căn S16 đúc mới sau mốc 17:06:39Z | 15:46:53 | 0 (bí danh S16 sống 111.331) |
| Chạy thử | 15:46:53–15:46:54 | khớp từng ô khối «Số đối chiếu mới» |
| `--ghi --db-that` | 15:47:03–15:47:16 | ghi 441.193 dòng mới, kèm `ANALYZE field_assertions` |
| 5. `kiem.sh that` | 15:47:16–15:47:20 | 40/40 ô, thoát 1, lệch đúng 6 ô grand-park (+2) đã được nhận; không ô nào khác |
| 5. Mắt nhìn `/ops/registry` (dev :3456 máy thu, tài khoản ops thử) | ~15:52 | grand-park (id 16) «Căn có thuộc tính 37.591», giá chủ đầu tư 1.850, chưa vào danh bạ 0 · smart-city (id 4) 2.546 · ocean-park-3 (id 3) 2.797, chưa vào danh bạ 792; tải 4–6 giây |

Số thật cạnh số đối chiếu (khối «Số đối chiếu mới»):

| Chỉ số | Thật | Đối chiếu |
|---|---|---|
| Phát biểu | 441.193 | 441.193 |
| Căn danh bạ có thuộc tính | 84.822 | 84.822 |
| Căn có bí danh S16 | 111.331 | 111.331 |
| Căn có giá chủ đầu tư | 11.852 | 11.852 |
| Tầng lệch | 41 | 41 |
| Mã hai toà trong snapshot | 862 | 862 |
| Mã có thuộc tính chưa có căn danh bạ | 10.114 | 10.114 |
| Tim tường + đất | 69.678 + 15.144 | 69.678 + 15.144 |

```chay-thu-that
grand-park | 37591 | 37591 | 37591 | 35976 | 436 | 28316 | 36973 | 1850
ocean-park | 32097 | 32097 | 32097 | 27440 | 22063 | 31808 | 30919 | 9999
ocean-park-2 | 9791 | 9791 | 9791 | 9791 | 0 | 2492 | 9791 | 3
ocean-park-3 | 2797 | 2797 | 2797 | 2797 | 0 | 2782 | 2797 | 0
smart-city | 2546 | 2546 | 2546 | 2546 | 2476 | 2497 | 2502 | 0
```

Đường lùi từ giờ: chỉ lùi dữ liệu (mục 4 của `ap-may-thu.md`, câu UPDATE rút phát biểu S16) hoặc khôi phục từ sao lưu trên; lùi lược đồ `lui/113-lui.sql`
không còn dùng được vì đã `--ghi`. Không job đêm nào chạy lại lượt nạp hay `--ghi` (mục 0): lần thu S16 sau muốn lên màn phải chạy tay lại.
