# AU11-AC-3 chờ PostGIS tạm sẵn sàng thật, không đỏ chập chờn dưới tải

Hàng `au11-ac3-postgis-tam-chap-chon`, dãy P2, giám sát đợt mở ngày 12/11 (ưu tiên -10). Hàng này chặn lượt ghim lại bốn hồ
sơ sau au3 trên PR #424 (thước lệch).

## Bối cảnh

`scripts/ci-test-module.test.mjs` (hồ sơ AU11 `ci-test-module`) dựng một PostGIS docker dùng một lần
(`kartoza/postgis:17-3.5`) rồi chạy năm ca AU11-AC-3. Hai lượt ghim lại liền nhau của #424 (`repin-20261111T232011Z-98952`,
`repin-20261112T005641Z-28835`) đều đỏ đúng các ca này. Lỗi là «Connection terminated unexpectedly», cả hai lần thử trong mỗi
lượt. Chạy riêng tệp khi máy rảnh thì 9/9 xanh.

Gốc lỗi đã xác nhận bằng log container ngày 12/11. Ảnh kartoza khởi tạo xong thì in «Postgres initialisation process completed
.... restarting in foreground», tắt postgres rồi khởi động lại. Log vì vậy có HAI dòng «database system is ready to accept
connections».

Bước chờ cũ trả về quá sớm. Nó gọi `pg_isready` qua `docker exec` và lệnh này đã báo up ngay sau dòng thứ nhất. Sau đó test ngủ
thêm 3 giây cố định rồi mới kết nối. Dưới tải, lần khởi động lại rơi vào đúng lúc test đang kết nối, nên kết nối bị cắt.

## Thiết kế

Chỉ sửa `scripts/ci-test-module.test.mjs`; không sửa `scripts/ci-db-init.mjs` (vật sản phẩm của AU11).

1. **Hàm thuần `daQuaKhoiDongLai(log)`.** Trả `true` khi và chỉ khi trong `log` có dòng mốc khởi động lại
   `Postgres initialisation process completed` VÀ có từ hai dòng `ready to accept connections` trở lên. Không dựa vào thứ tự
   dòng: `docker logs` trả stdout (mốc của entrypoint) và stderr (dòng của postgres) thành hai luồng, nối hai luồng thì mốc đứng
   trước cả dòng sẵn sàng lần một (lượt chấm r1 bắt lỗi này ở bản «SAU dòng mốc»).
2. **Bước chờ mới trong `before`.**
   - Vòng lặp tối đa 180 giây đọc `docker logs <tên>` tới khi `daQuaKhoiDongLai` đúng.
   - Sau đó kết nối thật từ host qua cổng đã ánh xạ và chạy `SELECT 1`. Phải thành công hai lần liên tiếp cách nhau 1 giây;
     lần nào lỗi thì đếm lại từ đầu.
   - Quá hạn thì ghi `setupErr` có tên bước (`chưa thấy khởi động lại sau khởi tạo` hoặc `SELECT 1 chưa ổn định`). Các ca gọi
     `ready()` sẽ đỏ với thông điệp đó, không phải «Connection terminated» mù.
   - Bỏ `pg_isready` và giấc ngủ 3 giây cố định.
3. **Ca đối chứng, không cần docker.**
   - Tên ca: `AU11-AC-3 bước chờ PostGIS tạm qua được lần khởi động lại sau khởi tạo`.
   - Dùng bản ghi log thật rút gọn của kartoza, cắt ở hai thời điểm: trước dòng mốc (chỉ có dòng «ready» thứ nhất) và sau dòng
     «ready» thứ hai.
   - Hàm mới trả false rồi true. Luật cũ («có dòng ready là xong», tương đương pg_isready) trả true ngay ở thời điểm thứ nhất.
     Đây là chiều đỏ, ghim thông điệp `BUOC CHO CU TRA VE TRUOC KHI KHOI DONG LAI`.
4. **Hàm chờ tách được.** `choPostgisTam({ docLog, chayTruyVan, han })` nhận hàm đọc log, hàm truy vấn và thời hạn. `before()`
   truyền vào `docker logs <tên> 2>&1` (gộp stdout và stderr — postgres ghi ra stderr) và kết nối thật từ host. Ba ca thuần
   chứng đường hết hạn và đường đếm lại bằng nguồn giả.
5. **Bằng chứng dưới tải, có chiều đỏ.**
   - Probe `probes/duoi-tai.mjs` bật số tiến trình đốt CPU bằng `os.availableParallelism()` và in ra.
   - Trước hết chạy BẢN CŨ của tệp (dựng từ `git show origin/main:` ra tệp tạm cạnh tệp thật) tới 10 lần dưới tải. Phải có ít
     nhất một lần đỏ chứa «Connection terminated»; không có thì thoát khác 0 với «TAI KHONG TAI HIEN LOI CU», nghĩa là tải chưa
     đủ để chứng gì.
   - Rồi chạy bản mới 10 lần dưới cùng tải, đòi 10/10 xanh.
   - Lưu `docker logs` thật của một container, đòi `daQuaKhoiDongLai` ra true và dòng mốc khớp bộ log trong test.
   - Luôn dọn tiến trình đốt CPU và container tạm.
6. **Giữ nguyên ca cũ.** Probe `probes/cho-tinh.mjs` so mọi thông điệp assert của các ca AU11-AC-3, AU11-AC-4 ở merge-base với
   tệp mới, đòi không còn `pg_isready` và không chạm `scripts/ci-db-init.mjs`.

## Ngoài phạm vi

- `scripts/ci-db-init.mjs` và các ca AU11-AC-4.
- Đổi ảnh PostGIS hay cấu hình docker của máy.
- Các test khác cũng dựng container tạm.
