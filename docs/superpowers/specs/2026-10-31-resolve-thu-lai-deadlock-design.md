# resolve-thu-lai-deadlock — design

Hồ sơ: `_acceptance/resolve-thu-lai-deadlock/` · hàng phát sinh của đợt dot0-cam-mau, dãy P3 (giám sát thêm 31/10,
lời Mạnh «Giao gói khuyến nghị»). T2.

## Vấn đề (đo trên log)

`pipeline/logs/chotot.log`, lượt chotot-daily 30/10 ~22:3xZ:

```
error: deadlock detected   code: '40P01'   at main (pipeline/resolve-properties.mjs:72)
Process A waits for AccessShareLock on relation sale_offers (view); blocked by process B.
Process B waits for AccessExclusiveLock on relation property_offers; blocked by process A.
JOB FAIL [chotot-daily] bước resolve-properties mã 1
```

Câu bị huỷ là `INSERT INTO property_offers … SELECT … FROM sale_offers` của Stage A: câu khoá `property_offers` (RowExclusive)
rồi mới mở view `sale_offers`. Phiên B giữ khoá trên view `sale_offers` rồi xin khoá độc quyền trên `property_offers` — dáng
của một lệnh DDL (áp lại migration 044 trong giao dịch, như hồ sơ `deals-phi-ly-test-theo-view` đã đo 26/10), không phải
cloud-sync: sync-cloud đọc local trong `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY` và lượt 22:22Z/22:40Z của nó đều
xanh. Vụ `SYNC FAIL [read] … deadlock detected` 26/10 là sync-cloud ở phía bị huỷ của cùng dáng — ngoài phạm vi (P3-134).

resolve-properties chạy không giao dịch tường minh: mỗi câu tự commit, và mỗi câu đã an toàn khi chạy lại (Postgres huỷ trọn
câu bị chọn làm nạn nhân; `ON CONFLICT DO NOTHING`, `GREATEST`, `INSERT … RETURNING` của cụm chưa có).

## Thiết kế

1. `pipeline/lib/thu-lai-deadlock.mjs` — `boc(client, opts)` trả `{ query(sql, params) }`:
   - lỗi `code === '40P01'` → chờ rồi chạy lại đúng câu đó; tối đa **3 lần thử lại** (4 lần chạy), chờ **500 · 1000 · 2000 ms**;
   - lỗi khác (mọi mã, kể cả lỗi kết nối) → ném ngay, không thử lại;
   - hết lượt → ném lỗi 40P01 cuối cùng (resolve thoát 1 như trước, cùng thông điệp);
   - mỗi lần thử lại in MỘT dòng stderr: `resolve-properties: deadlock (40P01) ở «<nhãn câu>», thử lại <k>/3 sau <ms>ms` —
     nhãn là 40 ký tự đầu của câu SQL đã gộp khoảng trắng, không in tham số;
   - `opts.cho` (hàm chờ) và `opts.lan`/`opts.nhip` tiêm được cho test; `boc` đếm số lần thử lại (`soLanThuLai`).
2. `pipeline/resolve-properties.mjs` — thân `main` tách thành `export async function chayResolve(c, opts)` nhận client đã
   kết nối; mọi `c.query` đổi thành `q.query` của `boc(c, opts)`; chữ SQL, thứ tự câu, tham số giữ nguyên từng byte. Cuối lượt,
   có thử lại thì in thêm `resolve-properties: thử lại sau deadlock <n> lần`; không có thì không in gì thêm.
3. Không thêm giao dịch, không đổi thứ tự khoá, không đổi chotot-daily.sh.

## Kiểm

- Unit (không DB): client giả ném 40P01 n lần → ma trận n = 0…4, lỗi mã khác, nhịp chờ, dòng log.
- Itest (DB thử `oneinvest_p3_rtld_<pid>` ở :5433, tạo đầu tệp, xoá cuối tệp — không chạm `oneinvest`): lược đồ tối thiểu
  có `sale_offers` là VIEW trên `sale_offer_records` (như 044). Dựng deadlock THẬT: lúc resolve chạy câu
  `INSERT INTO property_offers` đầu tiên, phiên thứ hai `LOCK sale_offers` rồi `LOCK property_offers` (ACCESS EXCLUSIVE) — đúng
  vòng chờ của log. Resolve phải hoàn tất và bảng kết quả bằng lượt sạch trên cùng mồi; đối chứng đỏ: tắt thử lại
  (`lan: 0`) thì cùng vũ đạo làm resolve ném 40P01.
- Tĩnh: tập chữ SQL resolve gửi đi bằng bản chụp từ base `82a53e0a`; không còn `c.query(` trực tiếp trong resolve.

## Ngoài phạm vi

sync-cloud (P3-134) · mã khác 40P01 (40001, 55P03, 53300) · thử lại cả lượt/giao dịch · sửa phía DDL gây khoá · bước khác của
chotot-daily.
