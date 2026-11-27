# HT35 — test không rơi về DB chung (test-khong-roi-ve-db-chung)

GS giao 27/11. Hàng nền, miễn số trên màn. T2, chấm trên M5.

## Vì sao

Ngày 21/11 có người chạy trần `pipeline/import-s09-danh-ba.test.mjs` trên máy thu. Thiếu `DATABASE_URL` nên tệp dùng chuỗi
mặc định `localhost:5433/oneinvest`, tức DB chung. Test tự dựng bảng `stg_s09_danh_ba` rồi ghi 24 bản thu test và 40 dòng vào
DB máy thu. Vì vậy lượt áp DA42 tối 27/11 phải xin Mạnh lời xoá.

## Làm gì

GS phán tách ngày 27/11: hàng này nhỏ, làm hôm nay; phần còn lại để HT36. GS chỉnh phán cùng ngày theo quy ước sẵn có của kho.

Hành vi, dùng `chotDbThu` sẵn có (`pipeline/lib/db-thu-chot.mjs`, chế độ `khiThieu: "bo-qua"`):

- URL trỏ DB thử → chạy.
- Thiếu `DATABASE_URL` → bỏ qua cả tệp có lời, thoát 0.
- URL trỏ tên DB khác → thoát 2 kèm lời từ chối.

Cả ba nhánh đều xảy ra trước mọi kết nối. Không có nhánh CI riêng.

Hai tệp trong phạm vi, cùng lớp sự cố «tự dựng bảng thật rồi ghi»:

1. `scripts/check-freshness.test.mjs`: tệp này dựng lược đồ tạm và bảng `LIKE public.*` rồi ghi. P1 gắn
   `chotDbThu({ ten, khiThieu: "bo-qua" })` vào tệp.
2. `pipeline/import-s09-danh-ba.test.mjs`: zk đang sửa lại bản vá theo đúng hành vi trên, kèm ca DT-AC-7. P1 chờ LL chuyển
   sha, rồi cherry-pick khớp từng byte, giữ tác giả. P1 không tự chỉnh tệp của zk.

Danh sách cho phép của `chotDbThu` mở thêm đúng mẫu `oneinvest_ci_scripts_<số>`. Đây là DB trống mà bước scripts của
`suite-neu-doi` tự dựng rồi xoá trong lượt chấm. Không mở thì `check-freshness.test` bị từ chối ngay trong lượt chấm.

Bốn lệnh chấm đang chạy `check-freshness.test` trần được bọc bằng `db/db-thu.sh … --chay`, như `nk_db` đã làm: `executors.test.scripts`,
`check_freshness`, `sl_freshness`, `s08l_do`. Không bọc thì sau HT35 chúng xanh rỗng, vì tệp bỏ qua khi thiếu URL. Phép đo của
các lệnh này giữ nguyên; chỉ DB chạy đổi từ DB chung sang DB của riêng lượt.

## Đo

Các ca thêm vào `pipeline/scripts/db-thu-chot.test.mjs`. Tệp này không nối DB nào; ca chạy trần trỏ cổng chết 127.0.0.1:9.

- **RV-1:** ma trận tên DB. Nhận `oneinvest_ci_scripts_<số>` và `oneinvest_suite_*`. Từ chối `oneinvest` và các tên gần giống.
- **RV-2:** chạy trần từng tệp trong phạm vi.
  - URL DB chung → thoát 2, có lời từ chối, không nối. Kết quả giữ nguyên cả khi `CI=true`.
  - Thiếu URL → bỏ qua có lời, thoát 0.
  - Ca cổng chết chạy trước, nên tệp đã mất rào không bao giờ được chạy ở ca thiếu URL.
- **RV-3:** đột biến. Bản chép cạnh bản thật bỏ dòng rào → không còn lời từ chối, tệp đi tới chỗ thử nối DB. Ca này chỉ dùng
  cổng chết.
- **`kiem-ht35.mjs chay`:** chạy thật qua `db-thu`, đòi 0 fail và 0 ca bỏ qua.
- **Ba phép kiểm tĩnh:**
  - tệp S09 khớp byte bản zk;
  - lệnh chấm đã bọc `db-thu`;
  - bảng phủ khớp kho.

## Bảng phủ, và phần để lại cho HT36

Bảng phủ nằm ở `_acceptance/test-khong-roi-ve-db-chung/bang-phu.md`. Kho có 70 tệp mang khuôn `DATABASE_URL ?? …`. Trong đó 66
tệp rơi về DB chung, và 52 tệp có ghi mà chưa rào.

Đề xuất cho S1 của HT36 (chưa làm):

- **A:** CI đổi tên DB thành `oneinvest_suite_ci` và đặt `DATABASE_URL` ở bốn job. Như vậy các ca cần DB chạy lại được trên CI
  GitHub.
- **B:** 52 tệp gọi `chotDbThu`. Hoặc cân phương án chặn ở một chỗ (khuôn nối DB dùng chung), kèm luật lint «chặn mới» cho khuôn
  `DATABASE_URL ?? "…/oneinvest"`.

## Ghi thật thà

Sau HT35, ca nạp S09 và ca của `check-freshness.test` không còn chạy trên CI GitHub. Trước đây chúng chạy nhờ rơi về DB dịch vụ;
nay CI không đặt URL nên cả tệp bỏ qua. Chúng chỉ còn chạy ở lượt chấm qua `db-thu` và ở bước scripts của `suite-neu-doi`.
