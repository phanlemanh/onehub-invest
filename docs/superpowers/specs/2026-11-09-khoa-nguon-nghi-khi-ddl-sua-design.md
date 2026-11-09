# khoaNguon nghỉ khi bảng bị khoá DDL ngoài 33033 — thiết kế

Hồ sơ: `_acceptance/khoa-nguon-nghi-khi-ddl-sua/` · hạng T2 · dãy P4 đợt `dot0-cam-mau` (giám sát duyệt P4-160, 09/11).

## Bối cảnh

`pipeline/lib/luoc-do-rieng.mjs` cho các bộ thử DB chạy song song: mỗi ca dựng một lược đồ riêng trong giao dịch sẽ
ROLLBACK, chép rỗng các bảng cần dùng, rồi đặt `search_path` vào đó. Trước khi chép, `khoaNguon` lấy ACCESS SHARE trên
mọi bảng nguồn bằng một câu `LOCK TABLE … NOWAIT`. Bị chặn thì nó nhả hết, xếp hàng khoá tư vấn 33033 (khoá mà các ca nạp
DDL trong test giữ suốt ca), rồi thử lại.

Ở Cổng Bằng chứng của `so-ghep-s06-nhan-danh-ba` (03/11), Mạnh chọn «mở hợp đồng mới» cho hai mục cùng một lỗi:

- Ngoài-1: khoaNguon không nghỉ 100 ms khi bị khoá DDL ngoài 33033 chặn, quay vòng hết `toiDa` rồi ném 55P03.
- Ngoài-3: khi 33033 rảnh mà bảng vẫn bị một khoá DDL khác giữ, quay hết lượt thử rồi ném 55P03.

Mục Ngoài-4 cùng hồ sơ (ghi Known limits, «thêm ca kiểm đi cùng việc sửa lỗi khoá») là ca test cho đúng nhánh này.

## Nguyên nhân (đọc mã)

```js
const toiLuot = lan > 0 && (await xepHangDdl(c));   // lấy được 33033 → true
…
} catch (e) {
  …
  if (!toiLuot) await new Promise((r) => setTimeout(r, 100));   // tới lượt thì KHÔNG nghỉ
} finally {
  if (toiLuot) await c.query("SELECT pg_advisory_unlock(33033)");
}
```

Ca DDL của bộ thử giữ 33033 trước khi khoá bảng. Vì vậy khi khoaNguon lấy được 33033 mà `LOCK … NOWAIT` vẫn thất bại,
kẻ chặn là một khoá KHÔNG đi qua 33033: migration chạy tay, `ALTER` của job khác, một phiên `psql`. Lúc đó 33033 rảnh,
vòng sau lấy lại nó ngay, nên vòng lặp không nghỉ lần nào. Nó hết `toiDa` (3000) trong vài giây rồi ném 55P03, dù kẻ chặn
chỉ cần thêm vài giây là xong. Chú thích của hàm hứa «Vẫn bị chặn (khoá DDL ngoài 33033) thì nghỉ 100 ms», nhưng mã
không làm đúng như vậy.

## Thiết kế

Mọi lần `LOCK … NOWAIT` thất bại vì 55P03 đều nghỉ 100 ms rồi mới thử lại, và chỉ nghỉ SAU khi đã nhả 33033:

```js
let duoc = false;
await c.query("SAVEPOINT khoa_nguon");
try { LOCK … NOWAIT; RELEASE; duoc = true; }
catch (e) { ROLLBACK TO; if (e.code !== "55P03" || lan >= toiDa) throw e; }
finally { if (toiLuot) unlock 33033; }
if (duoc) return lan;
await nghi(100);   // không giữ 33033, không giữ khoá bảng nào
```

- **Ca chuỗi DDL đi qua 33033** (lỗi đói khoá đã sửa ở vòng S4 r3 của so-ghep) không đổi. Khi tới lượt 33033 thì không
  ca DDL nào khác đang giữ bảng, nên NOWAIT thành công ngay và không có lần nghỉ nào thêm.
- **Nghỉ sau khi nhả 33033**: nghỉ trong lúc còn giữ 33033 sẽ chặn mọi ca nạp DDL đang xếp hàng 33033 thêm 100 ms mỗi
  vòng, đúng kiểu đói khoá ngược. Thứ tự này là một phần của hợp đồng (AC-3).
- **Trần chờ**: `toiDa` giữ 3000. Mỗi vòng nay có ít nhất 100 ms nghỉ, nên trần là khoảng 5 phút thay vì vài giây. Kẻ
  chặn giữ lâu hơn thế thì vẫn ném 55P03 như trước, giao dịch còn dùng được, và không giữ 33033.
- Không đổi chữ ký hàm, giá trị trả về (số lần thử lại) hay hành vi `xepHangDdl`. Mười tệp test đang dùng thư viện (liệt ở AC-5)
  chỉ dùng giá trị trả về như số đếm.

### Lối đã loại

- **Giữ nguyên mã, tăng `toiDa`**: không có lần nghỉ nào thì tăng `toiDa` chỉ đổi số giây quay rỗng; mỗi vòng vẫn gửi
  bốn câu lệnh tới Postgres. Lối này chết vì không chặn được việc quay rỗng (Ngoài-1).
- **Chờ bằng `LOCK` có `lock_timeout` thay vì NOWAIT**: chờ có hàng đợi trên khoá bảng sẽ xếp sau kẻ chặn, và trong
  lúc đó chặn mọi ca DDL đến sau (hàng đợi khoá Postgres là FIFO). Đây đúng là vòng deadlock mà thiết kế NOWAIT của
  app-test-chiu-song-song đã tránh. Lối này chết vì một ràng buộc đã đo.
- **Nghỉ trước khi nhả 33033** (đặt `setTimeout` trong `catch` như cũ, rồi bỏ điều kiện `!toiLuot`): giữ 33033 suốt
  100 ms mỗi vòng, nên ca nạp DDL đang xếp hàng phải chờ. AC-3 đo đúng chiều đỏ này.

## Đo

Bộ thử `pipeline/scripts/luoc-do-rieng.test.mjs` có thêm bốn ca, tiền tố `KN-`. Ba ca đầu dùng một phiên giữ ACCESS
EXCLUSIVE trên `public.field_assertions` mà KHÔNG giữ 33033 (kẻ chặn ngoài 33033). Mọi ca chạy trên DB của riêng lượt
(`db/db-thu.sh --chay`, không chạy trên DB chung):

1. **KN-AC-1**: kẻ chặn giữ 1,5 giây; gọi với hai bảng nguồn, bảng bị chặn đứng sau; `toiDa` 40. Đạt khi khoaNguon vào
   được sau khi kẻ chặn nhả, số lần thử nằm trong khoảng 5–25, không còn giữ 33033 và giữ ACCESS SHARE trên cả hai
   bảng. Hàm đo «giữ 33033» có đối chứng dương: một phiên đối chứng gọi `pg_advisory_lock(33033)` và hàm phải thấy khoá
   đó. Bản đột biến ném 55P03 hay trả về số lần thử > 25 đều đỏ với cùng một thông điệp.
2. **KN-AC-2**: kẻ chặn giữ suốt, `toiDa` 5. Đạt khi lời gọi ném đúng code 55P03 sau ít nhất 450 ms, giao dịch còn dùng
   được và không còn giữ 33033.
3. **KN-AC-3**: trong khoảng từ lúc gọi tới lúc khoaNguon trả về, một phiên thứ ba lấy mẫu `pg_locks` mỗi 20 ms (ít nhất
   30 mẫu). Đạt khi số mẫu thấy khoaNguon giữ 33033 không quá 50%; tỉ lệ đo được in ra. Mã đúng chỉ cầm 33033 trong
   vài câu lệnh mỗi vòng ~100 ms, còn bản nghỉ khi còn giữ cầm gần trọn vòng. Ngưỡng đặt ở giữa hai chiều để tải máy
   (nhiều phiên song song) không làm đỏ oan.
4. **KN-AC-6**: bảng nguồn không tồn tại. Đạt khi lời gọi ném ngay code 42P01 (dưới 250 ms, không thử lại) và giao
   dịch còn dùng được.

Chiều đỏ được chứng bằng bốn bản đột biến (`_acceptance/khoa-nguon-nghi-khi-ddl-sua/probes/dot-bien.mjs`, bản chép
tạm `.dot-<pid>`, không sửa tệp thật). Mỗi bản phải đỏ với thông điệp ghim:

- «mã cũ» (chỉ nghỉ khi chưa tới lượt) → ca 1 và ca 2;
- «nghỉ khi còn giữ 33033» → ca 3;
- «quên nhả 33033 khi vào được» → ca 1;
- «thử lại mọi mã lỗi» → ca 4.

Probe còn đối chiếu danh sách tệp test import thư viện với danh sách hồi quy của AC-5. Thời gian thêm của ca chuỗi DDL
qua 33033 không có thước riêng: hồi quy chỉ chứng các bộ thử vẫn xanh.
