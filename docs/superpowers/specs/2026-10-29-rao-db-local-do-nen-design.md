# rao-db-local-do-nen — script đo nền chỉ chạy trên DB local

Nguồn: Ngoài-2 của hồ sơ `do-nen-hieu-nang`. Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng ngày 29/10. Giám sát đợt
dieu-phoi-dot0-cam-mau tạo hàng P4 `rao-db-local-do-nen` (vùng `scripts/do-nen-hieu-nang/**`).

## Vấn đề

`scripts/do-nen-hieu-nang/do.mjs` đọc `DATABASE_URL` (mặc định DB local :5433) rồi ghi lên DB đó mà không kiểm host:
`CREATE EXTENSION pg_stat_statements`, tạo/xoay tài khoản admin `perf-test@local.test` (`ensureAccount`), và
`pg_stat_statements_reset()`. Shell có `DATABASE_URL` trỏ Supabase hay DB khác thì script ghi những thứ ấy lên DB đó — trái
luật 2 của AGENTS.md («không sửa tay DB production»). `scripts/dev-ops-account.mjs` đã có rào `assertLocalDatabaseUrl` (chỉ
nhận `postgres://` trên localhost/127.0.0.1/::1, từ chối `?host=`/`?hostaddr=` ghi đè) và đã export nó.

## Cách làm

- `do.mjs` import thêm `assertLocalDatabaseUrl` từ `../dev-ops-account.mjs` và gọi `assertLocalDatabaseUrl(DB_URL)` ngay sau
  dòng đọc `DB_URL`, ở đầu tệp. Mọi lệnh ghi DB đều chạy sau `sql.connect()`, nên một rào ở đầu chặn cả ba. Rào ném lỗi →
  Node in thông điệp của rào và thoát 1, trước khi mở kết nối hay dựng `next start`.
- Không đổi hành vi đo trên DB local. Hồ sơ cũ có eval đo 5 trang (`dn_trang`), dùng lại làm hồi quy.

## Phép đo

Đầu dò `_acceptance/rao-db-local-do-nen/probes/rao.mjs` chạy `do.mjs` thật trong tiến trình con:

| Ca | DATABASE_URL | Kỳ vọng |
|---|---|---|
| tên miền ngoài | `postgres://db.example.invalid:5432/x` | thoát ≠ 0, stderr có «chỉ chạy trên Postgres local», < 5 giây |
| IP ngoài | `postgres://203.0.113.1:5432/x` | như trên |
| ghi đè host | `postgres://localhost:5433/x?host=db.example.invalid` | thoát ≠ 0, stderr có «ghi đè host» |
| local, cổng không có DB (đối chứng dương) | `postgres://localhost:1/x`, `postgres://127.0.0.1:1/x`, `postgresql://localhost:1/x` | rào cho qua: lỗi là ECONNREFUSED, không có thông điệp rào |

Thêm hai phép:

- Soát thứ tự (trên mã đã bỏ comment): lời gọi `assertLocalDatabaseUrl(DB_URL)` đứng trước mọi chỗ mở kết nối
  (`new pg.Client`, `new pg.Pool`, `new Client`, `new Pool`, `.connect(`) và mọi lệnh ghi (`ensureAccount(`,
  `pg_stat_statements_reset`, `CREATE EXTENSION`). Đối chứng: bản chép chèn `new pg.Pool(` phía trên rào → «THU TU SAI».
  Đây là soát văn bản, không phải đo thứ tự thực thi — giới hạn ghi ở đây.
- Đột biến: bản chép `do.mjs` cùng thư mục, bỏ dòng rào, chạy với tên miền ngoài. Kỳ vọng stderr có ENOTFOUND/getaddrinfo
  (bản chép đi tới bước kết nối) và không còn thông điệp rào → «ban bo rao: do RAO VANG». Bản chép chết vì lỗi khác (cú
  pháp, thiếu module) hay vẫn in thông điệp rào → «DOT BIEN KHONG AP DUOC», đỏ.

## Hồ sơ đã ký bị chạm

`do.mjs` nằm trong `paths` eval của hồ sơ đã ký `do-nen-hieu-nang`, nên đổi nó làm hồ sơ ấy hoá cũ khi lưới trước-gộp chạy
không `--base`. Ghim lại trên nhánh này không làm được: eval phạm vi (E6) của hồ sơ ấy đo diff nhánh nên đỏ trên mọi nhánh
khác. Sau S4 round 1, giám sát duyệt thu phạm vi (P4-71): không ghim lại, ghi Known limit có tên trong hợp đồng; hồ sơ
`do-nen-hieu-nang` không đổi tệp nào. E4 của hồ sơ này chạy lại phép đo 5 trang trên do.mjs mới.

`.invalid` (RFC 2606) và `203.0.113.0/24` (TEST-NET-3) không bao giờ là máy thật. Khi có rào, không ca nào mở được kết nối ra
ngoài.

## Ngoài phạm vi

Các giới hạn đã ghi Known limits ở do-nen-hieu-nang (CREATE EXTENSION ngoài migration, nuốt lỗi `next start`, cột byte)
không sửa ở hàng này. Đầu dò `trang.sh` của hồ sơ cũ (đọc băm mật khẩu ops-test) cũng không đổi.
