# HT46 — test thu đuôi S06 không phụ thuộc tiến trình thật của máy (design)

Hồ sơ: `_acceptance/thu-duoi-nhuong-luot-khong-dung-may-that/` (T2, hàng nền). Nguồn: GS giao 28/11 sau PL43 vòng 4.

## Vấn đề

`scripts/thu-duoi-s06.sh` bước 2 nhường lượt quét đủ bằng `pgrep -f "scripts/chotot-daily.sh"` trên TOÀN máy. Hai ca của
`pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs` chạy wrapper thật với `PATH` thật (`...process.env`), nên khi lượt nạp
ngày thật của máy thu đang chạy (05:30 và 14:00 giờ VN, mỗi lượt > 30 phút), wrapper in «nhường lượt — script nạp ngày đang
chạy», thoát 0, không nạp gì. Ca thứ hai đỏ ở «snapshot C mới thật phải được nạp» (PL43 vòng 4, `pipeline_b` 1/872, 28/11
~07:15Z). Trên M5 (không có bộ thu) ca xanh. Mọi lượt S4 hay làn ghim trên Mac mini rơi vào hai khung giờ đó đỏ oan một ca,
mất một lượt khoá s4 khoảng 1,5 giờ.

Đo S1 trên 2beb7d6ba (28/11 07:31Z): dựng một tiến trình `bash <tạm>/scripts/chotot-daily.sh` rồi chạy wrapper thật → «nhường
lượt», thoát 0. Cùng lúc `pgrep -f` còn thấy `chotot-daily.sh` thật của máy (lượt 14:00) và cả vòng chờ của một phiên khác có
chuỗi ấy trong dòng lệnh.

## Thiết kế

Sửa test, không sửa wrapper — hành vi mặc định ở máy thu giữ nguyên từng byte.

1. `pipeline/scripts/thu-duoi-chon-nap-e2e.test.mjs`: hai ca đặt một thư mục shim lên đầu `PATH` của wrapper, trong đó
   `pgrep` giả luôn thoát 1 («không có lượt quét đủ»). Cùng nếp `scripts/thu-duoi-s06.test.mjs` đã dùng từ ZC18 (MỞ LẠI
   2611-27 lần 3). `node` và phần còn lại của `PATH` giữ nguyên.
2. Tệp test mới `pipeline/scripts/thu-duoi-nhuong-luot.test.mjs` (không DB): dựng một tiến trình thật có dòng lệnh chứa
   `scripts/chotot-daily.sh`, chạy wrapper (bản trong cây, hoặc bản chỉ định bằng `THU_DUOI_NHUONG_WRAPPER` cho phép đo đột
   biến) với `pgrep` THẬT và `node` shim ghi lời gọi; đòi thoát 0, có dòng «nhường lượt», 0 lời gọi node. Tiến trình giả bị
   giết trong `finally`. Ca này không phụ thuộc máy: có lượt thật chạy song song thì wrapper vẫn nhường — kết quả không đổi.
3. Không đổi `scripts/thu-duoi-s06.sh`. Lối đi qua biến môi trường cho mẫu tiến trình (gợi ý của GS) bị bỏ: nó thêm một núm
   ở mã chạy thật để phục vụ test, trong khi shim `PATH` đạt cùng cách ly mà không chạm mã chạy thật.

## Phép đo

- `probes/e2e-khi-quet-du-song.mjs` (AC-1): trên DB của riêng lượt (`db-thu.sh --chay-trong`), dựng tiến trình giả khớp mẫu,
  kiểm `pgrep` thật thấy nó, chạy tệp e2e của cây (đòi 2 pass, 0 fail, 0 skip), rồi chạy bản tệp e2e ghim ở 2beb7d6ba trong
  cùng điều kiện (đòi đỏ ở «snapshot C mới thật phải được nạp»). Hai chiều trong một lượt.
- `config:executors.test.ht46_nhuong` (AC-2): tệp test mới.
- `probes/dot-bien-nhuong.mjs` (AC-3): bản chép wrapper với nhánh nhường lượt đổi thành `if false; then` → tệp test mới phải đỏ.
- `probes/pham-vi.mjs` (AC-4): tệp đổi trong ranh giới; `scripts/thu-duoi-s06.sh` bằng origin/main.
- `config:executors.test.s06tl_test` (AC-5): test shim ZC18.
- `probes/soat.mjs` (AC-6): rút lại danh sách tệp mã gọi `pgrep`/`pidof`/`launchctl list` và đối chiếu với `soat-tien-trinh.md`.

## Ngoài phạm vi

Mẫu `pgrep -f` khớp cả tiến trình không phải lượt nạp ngày (một shell đang chờ có chuỗi ấy trong dòng lệnh) — đó là hành vi
chạy thật ở máy thu, đổi thì đổi mặc định; ghi vào `soat-tien-trinh.md` làm việc riêng.

## Bỏ đặc tả UX

Hàng không chạm giao diện (surfaces: cli).
