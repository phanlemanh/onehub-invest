# ZC20 s03-tai-bu-anh-bai-cu — thiết kế

## Mục tiêu

Mã tải bù ảnh S03 của bài cũ (`pipeline/backfill-s03-media-2511.mjs`) và quy tắc nạp lại raw giữ ảnh đã bù vào kho chính, với ba
điều kiện cổng của GS có phép đo.

## Cách làm (mã của làn thu, nhánh `zcode/s03-tai-bu-anh` @2f0865de9, LL soát ĐẠT)

- Mỗi lô (một ngày đăng) ghi MỘT snapshot zalo-agent MỚI: ảnh sống chép byte từ snapshot gốc, ảnh lỗi tải lại qua
  `fetchMessageMedia` của dist đã triển khai (cùng danh sách host và thử lại `/jpg/`), entry 404 giữ nguyên. Raw bất biến: không
  sửa hay xoá snapshot cũ. Gặp 403/429 dừng hẳn, thoát 3.
- Snapshot bù mang `manifest.coverage.loai = "tai-bu-anh-2511"`, tên theo giờ chạy. `sapXepReplay()` xếp snapshot bù phase cuối.
- `scripts/zalo-import-daily.sh`: khi state là `00000000T000000`, danh sách snapshot đi qua `sapXepReplay` trước khi nạp; lượt
  thường giữ thứ tự tên.
- DATA-CONTRACT «Quy tắc tiêu thụ» điều 7 ghi quy tắc, 5 tên snapshot bù và số bài theo ngày.

## Hai sửa tích hợp của ZT (LL cho phép 26/11)

- Lối vào của tệp backfill so `realpathSync(argv[1])` với `fileURLToPath(import.meta.url)` — khuôn của main (luật AC-3 lối
  vào: launchd gọi qua symlink).
- `zalo-import-daily.sh`: khối liệt kê snapshot giữ GIỐNG HỆT `apify-facebook-daily.sh` (luật BÁO 2510-5); vòng liệt kê chỉ gom
  danh sách, nhánh replay xếp lại, vòng nạp mang nguyên văn thân vòng cũ.

## Đo

Probe `probes/kiem.sh`: test backfill trên cụm PostGIS dùng một lần (`db/db-thu.sh --chay-trong`, đòi skipped 0), họ
zalo-import với HOME tạm, nap-argmax, AC-3 lối vào, DATA-CONTRACT điều 7, và hai đột biến (bỏ nhánh replay; sapXepReplay giữ
nguyên thứ tự) phải đỏ đúng ca.

## Đặc tả UX

Không chạm UI (bỏ có tên trong sổ quyết định).
