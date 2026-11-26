# Áp `db-thu-tach-khoi-cum-that` (HT9)

Hàng này không ghi gì vào DB máy thu. Nó chỉ đổi cách lượt chấm chạy suite pipeline: hai nửa chạy trên cụm PostGIS dùng một lần,
30 ca cần dữ liệu thật thành suite `pipeline_that` kích hẹp. Gộp PR là áp.

## 1. Lệnh áp

Không có lệnh áp lên DB máy thu. Sau khi GS gộp PR bằng `gh pr merge`:

```bash
git -C ~/dev/onehub-invest pull --ff-only origin main
```

Từ lượt chấm kế, `executors.suite.pipeline_a|b` chạy `db-thu.sh --chay-trong`, còn `pipeline_that` chạy khi nhánh đổi vùng hẹp.
Soát ca dữ liệu thật hằng ngày: GS gọi `node scripts/pipeline-that-hang-ngay.mjs` trên checkout chính (đứng ở `main`) ở nhịp đầu
ngày, không plist.

## 2. Số chạy thử

Số thật của lượt chấm S4 ghi ở `evidence-report.md` của hồ sơ: tổng thời gian hai nửa pipeline trên cụm dùng một lần (E2b, đích
≤ 20′, nền 69′ của HT12 r1) và giây dựng cụm + migration mà `db-thu.sh` in. Test `scripts/db-thu-trong.test.mjs`: một lượt lành
gồm dựng cụm + migration ~20 s.

## 3. Sao lưu trước

Không cần: không lệnh nào ghi DB máy thu, không migration. Đổi phạm vi sao lưu (AC-7): bản sao lưu đêm sau gộp thôi chép DB
`oneinvest_suite_*` (~11,9 GB hôm 25/11), tên DB bỏ ghi ở `thong-tin.txt` của bản sao lưu.

## 4. Cách lùi

Revert PR của hàng (`gh pr create` một PR revert, GS gộp). `test:a`/`test:b` về `--chay` trên bản chép, `suite_keys` về bảy
khoá, `db-sao-luu.sh` lại chép DB suite. Container dùng một lần còn sót (lượt bị SIGKILL) tự dọn ở lượt `--chay-trong` kế; dọn
tay: `docker ps -a --filter name=^one-invest-db-thu- --format '{{.Names}}'` rồi `docker rm -f -v <tên>` — chỉ tên mang tiền tố
`one-invest-db-thu-`, không bao giờ `one-invest-db`.

## 5. Lệnh kiểm sau

Sau khi có vài lượt chấm mới (mốc áp = giờ PR gộp, ISO):

```bash
bash _acceptance/db-thu-tach-khoi-cum-that/ap-may-thu/kiem-sau.sh <mốc áp ISO>
```

In hai dòng: `nền 99′ (n=15, p75 174′)` và `sau áp <x>′ (n=<k>, …)`; chưa có lượt nào sau mốc thì in «chưa có lượt nào sau áp».
Số là khoảng cấp s4 (cấp → cấp hay thu hồi kế) — cận trên của phút giữ khoá.
