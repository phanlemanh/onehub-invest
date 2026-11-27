# Đề xuất cho kit và gói `dieu-phoi` (HT9 `db-thu-tach-khoi-cum-that`, ngoài phạm vi sửa ở kho này)

Kho không sửa bản chép kit. Các mục dưới là đề xuất, gửi người giữ kit theo nếp «lỗi kit → gửi cho kit».

## 1. Dùng lại kết quả suite cho hai hồ sơ cùng một commit — hướng (d) của GS

- Hiện trạng: mỗi lượt chấm chạy lại `feature_loop.suite_keys` từ đầu, kể cả khi hồ sơ khác vừa chấm đúng sha ấy, hay round sau
  chỉ đổi `_acceptance/`. HT12 r2 (24/11) chạy lại pipeline_a/b dù chúng đã chạy ở r1 trên cây mã y hệt; GS phải phán tay bỏ.
- Đề xuất: khoá kết quả suite theo (lệnh, cây mã ngoài `_acceptance/` — băm `git rev-parse HEAD^{tree}` lọc). Trùng khoá thì
  carry kết quả, ghi `suites_carry` như `evals_carry` của làn ghim lại.

## 2. Khử trùng lệnh theo lõi sau `--` của `suite-neu-doi`

- Ca đo 25/11 (GS, lượt HT23 của P3): eval trỏ `executors.test.app_ui` = `cd app && npm test`, suite `app_ui` =
  `node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'`. Hai chuỗi khác nhau, kit không khử trùng. Bộ app chạy hai lần
  song song, tải máy 1′ lên 156–169 trên 12 nhân.
- Kho không sửa được bằng một dòng cấu hình sạch: 72 `evals.yaml` trỏ `executors.test.app_ui`.
- Đề xuất: khi khử trùng, coi lệnh bọc `suite-neu-doi.mjs <tên> -- '<lõi>'` là cùng lệnh với `<lõi>`. Chạy một lần, dùng kết
  quả cho cả hai, chỉ khi bộ lọc quyết «chạy».

## 3. Dòng «ca dữ liệu thật» trên thẻ Cổng Bằng chứng

- Vòng này in dòng ấy vào đầu ra suite `pipeline_that`, để báo cáo bằng chứng chép lại (AC-11). Dòng đó là «chạy trong lượt
  này» hoặc «không kích — lần xanh gần nhất trên main: <ngày> (<sha>)».
- Đề xuất: thẻ Cổng Bằng chứng tự rút dòng ấy (khuôn `^ca dữ liệu thật: `) và in cạnh verdict. Người ký thấy ngay ca dữ liệu
  thật được chứng ở đâu.

## 4. Chấm song song nhiều khe s4

- Hôm nay chặn chấm song song là khoá s4 của đợt, không phải tên DB. Tên DB theo pid đã có, và cụm dùng một lần của vòng này có
  trần 2.
- Đề xuất cho `dieu-phoi`: khe s4 thứ hai cho lượt chấm mà suite chỉ chạy trên cụm dùng một lần (không chép bản dữ liệu thật). Mở
  khi có số đo phút giữ khoá sau áp (`ap-may-thu/kiem-sau.sh`).
