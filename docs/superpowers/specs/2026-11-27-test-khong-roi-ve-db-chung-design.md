# HT35 — test không rơi về DB chung (test-khong-roi-ve-db-chung)

GS giao 27/11. Hàng nền, miễn số trên màn. T2, chấm trên M5.

## Vì sao

Ngày 21/11, `pipeline/import-s09-danh-ba.test.mjs` bị chạy trần trên máy thu. Thiếu `DATABASE_URL` nên nó dùng chuỗi mặc định
`localhost:5433/oneinvest`, tức DB chung. Test tự dựng bảng `stg_s09_danh_ba` rồi ghi 24 bản thu test và 40 dòng vào DB máy thu.
Lượt áp DA42 tối 27/11 vì thế phải xin Mạnh lời xoá.

## Làm gì (GS phán tách 27/11: HT35 nhỏ hôm nay, HT36 phần còn lại)

Chỉ hai tệp thuộc lớp sự cố «tự dựng bảng thật rồi ghi»:

1. `pipeline/import-s09-danh-ba.test.mjs`: cherry-pick nguyên commit zk @3cb318df3, giữ đúng từng byte và tác giả.
   - Bản vá ném lỗi khi thiếu `DATABASE_URL`, nên CI trên GitHub (không đặt biến) sẽ đỏ. Đây là lỗi tích hợp với CI.
   - Chỉnh ở lớp gọi, một dòng: `urlCiChoPhep(...) ?? xacThucUrlSuite(...)`. Không đổi `xacThucUrlSuite` và không đổi ca 2711-1.
2. `scripts/check-freshness.test.mjs`: tệp dựng lược đồ tạm và bảng `LIKE public.*` rồi ghi. Thay chuỗi mặc định bằng
   `urlDbTestGhi({ ten })`.

Rào chung đặt trong `pipeline/lib/db-thu-chot.mjs`, là lib chốt chặn đã có của kho. Hai hàm mới:

- **Ngoài CI:** chỉ nhận DB `oneinvest_suite_*`. Thiếu URL hay sai tên thì ném lỗi trước mọi kết nối.
- **`CI=true`:**
  - Thiếu URL thì dùng DB dịch vụ của `ci-test.yml`, theo luật Mạnh chốt ở HT23 (`api-markets-khong-tra-so-s02`).
  - URL tên khác `oneinvest` thì nhận. Bước `scripts` của `suite-neu-doi` đặt `oneinvest_ci_scripts_<pid>`.
  - URL ghi tường minh tên `oneinvest` thì từ chối, cả khi `CI=true`.

Bốn lệnh chấm đang chạy `check-freshness.test` trần (`executors.test.scripts`, `check_freshness`, `sl_freshness`, `s08l_do`)
được bọc `db/db-thu.sh … --chay`, giống `nk_db` đã làm. Không bọc thì làn ghim lại của các hồ sơ đã ký trỏ tới chúng sẽ đỏ.
Phép đo của các lệnh này không đổi; chỉ DB chạy đổi từ DB chung sang DB của riêng lượt.

## Đo

Thêm ca vào `pipeline/scripts/db-thu-chot.test.mjs`. Tệp này không nối DB nào:

- **RV-1:** ma trận hàm rào, gồm ngoài CI, CI thiếu URL, `ci_scripts` và tên DB chung khi CI.
- **RV-2:** chạy trần từng tệp trong phạm vi ở ba ca: URL DB chung, thiếu URL, và CI cộng URL DB chung. URL trỏ cổng chết
  127.0.0.1:9. Kỳ vọng thoát lỗi, có lời từ chối, không có ECONNREFUSED, 0 ca chạy.
- **RV-3:** đột biến. Bản chép cạnh bản thật thay dòng rào bằng URL trần. Kỳ vọng không còn lời từ chối và tệp đi tới chỗ
  thử nối DB, nhận ra qua đúng thông điệp bỏ qua khi DB không tới. Ca 2711-1 tự gọi tệp với URL DB chung thật ở :5433, nên
  bản đột biến PHẢI bỏ ca đó.
- **E4:** chạy thật hai tệp qua `db-thu`, vẫn xanh.

Chiều đỏ đã thử: bỏ rào ở `check-freshness.test.mjs` thì RV-2 đỏ («thiếu lời từ chối») và RV-3 đỏ («không thấy dòng rào để
phá»).

## Bảng phủ, và phần để lại cho HT36

Bảng phủ ở `_acceptance/test-khong-roi-ve-db-chung/bang-phu.md`. 70 tệp có khuôn `DATABASE_URL ?? …`. 66 tệp rơi về DB chung,
trong đó 52 tệp có ghi mà chưa rào.

Đề xuất cho S1 của HT36, chưa làm:

- **A:** CI đổi tên DB thành `oneinvest_suite_ci` và đặt `DATABASE_URL` ở bốn job, để rào theo tên không cần nhánh CI.
- **B:** 52 tệp gọi `urlDbTestGhi`. Hoặc cân phương án chặn ở một chỗ (khuôn nối DB dùng chung) kèm luật lint «chặn mới» cho
  khuôn `DATABASE_URL ?? "…/oneinvest"`.

## Giới hạn đã biết

Ai đó tự đặt `CI=true` trên máy mà không đặt URL thì rào nhường, và test chạy trên `localhost:5433/oneinvest`. Đây cùng luật
với HT23. Runner CI thật không có DB chung.
