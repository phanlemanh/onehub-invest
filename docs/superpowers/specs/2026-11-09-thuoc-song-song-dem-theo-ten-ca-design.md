# Thước E4 của app-test-chiu-song-song đếm theo tên ca — thiết kế

Hàng P4 `thuoc-song-song-dem-theo-ten-ca`, giám sát mở ở P4-161 (09/11): «sửa E4 của app-test-chiu-song-song đếm theo tên
ca LDR thay vì tổng, đổi thước đã ký nên qua Cổng Phạm vi của Mạnh».

## Vấn đề

Hồ sơ đã ký `app-test-chiu-song-song` (ký 01/11) có E4 = `song-song.mjs lib`. Lệnh chạy TRỌN
`pipeline/scripts/luoc-do-rieng.test.mjs` và đòi đúng `ℹ pass 3`. Lúc ký tệp có ba ca LDR. Từ đó:

- `so-ghep-s06-nhan-danh-ba` thêm hai ca (chuỗi ca DDL, xếp hàng bị lock_timeout cắt) — main nay 5 ca;
- `khoa-nguon-nghi-khi-ddl-sua` (đang gác) thêm bốn ca `KN-` — nhánh ấy 9 ca.

Thước đếm tổng nên đỏ ngay khi tệp có ca mới, dù ba ca nó canh vẫn xanh. Hai ca mới còn giữ ACCESS EXCLUSIVE trên bảng public,
nên chạy trọn tệp trên DB chung là đúng loại test mà kho cấm chạy trên `oneinvest`.

Đo trên main 09/11: `pre-merge-check.sh . --slug app-test-chiu-song-song` đã ra 1 VIOLATION — bằng chứng hoá cũ vì
`pipeline/scripts/luoc-do-rieng.test.mjs` (nằm trong `paths` của E4) đổi sau `verified_commit` 65bf8e55. Mọi PR chạm tệp của
hồ sơ này phải ghim lại nó, và lượt ghim chạy cả năm eval.

Lượt ghim vấp thêm E5 (`probes/pham-vi.sh`): nó so tệp đổi với `git merge-base origin/main HEAD` của nhánh ĐANG đứng. Ở mọi
nhánh sau nhánh gốc, phép so ấy là của việc khác: không đổi gì thì «DIEM RE BANG HEAD — phép đo mù» (đo 09/11 trên main),
có đổi thì «NGOAI PHAM VI» cho tệp của hàng mới. E1 và E3 đã neo sẵn commit gốc `d96640c6` nên không vướng; E3 chạy trên
main 09/11 ra `ASSERT OK`.

## Cách sửa

1. **E4 đếm theo tên.** `song-song.mjs lib` khai đúng ba tên ca của AC-4 cũ, chạy tệp test với
   `--test-name-pattern` neo `^(…)$` của ba tên, rồi đòi: mỗi tên có dòng `✔ <tên>`, `ℹ pass 3`, `ℹ fail 0`; in
   `# ca theo tên: 3/3`. Thiếu tên nào → `CA LDR VANG: «<tên>»`. Ca khác trong tệp không chạy (không giữ khoá DDL trên DB
   chung). Probe rút mọi tên `test("…")` của tệp đang đứng và đòi tập ca chạy bằng đúng ba tên. Executor `atss_lib`
   chuyển sang DB thử (`db-thu.sh oneinvest_suite_atsslib`): đột biến «giữ 33033» cầm khoá tư vấn dùng chung, kho cấm chạy
   test giữ khoá trên `oneinvest`. Ba đột biến cũ giữ nguyên, chạy cùng bộ lọc. Bản chép tạm dọn ở `finally`. Hai đối chứng mới trên bản chép tạm của tệp test: đổi tên một ca →
   đỏ `CA LDR VANG` gọi đúng tên; thêm một ca LDR xanh ngoài danh sách → vẫn 3/3 và ca thêm không chạy; thêm ca `<tên ca 1> phụ` → không chạy (neo đủ tên).
2. **E5 neo khoảng commit của nhánh gốc.** `pham-vi.sh` so `a86804f7..2070958c` (điểm rẽ và đầu nhánh
   `fix/app-test-chiu-song-song` lúc ký — PR #267 gộp bằng `fcc42f9c`) thay cho merge-base của nhánh đang đứng. Luật cho
   phép, kiểm dòng ghim ở bốn hồ sơ đã ký và hai đối chứng giữ nguyên. Commit neo vắng → thoát 2. Hai commit neo là tổ
   tiên của `origin/main` (PR #267 gộp bằng merge commit), nên còn sau khi nhánh gốc bị xoá.
3. **Ghim lại** `app-test-chiu-song-song` bằng làn máy (`repin-lane.mjs --write`) trên nhánh này, sau khi xin lượt
   `ghim-lai`, rồi chạy lưới trước-gộp trên phạm vi diff của PR (không chỉ một hồ sơ). Không sửa `contract.md`, `evals.yaml`, `decisions.jsonl` hay chữ ký của hồ sơ đã ký: chữ AC-4 («3 ca xanh»)
   và E4 («`ℹ pass 3`») vẫn đúng với thước mới; chữ E5 («so merge-base») đọc là merge-base của nhánh gốc.

## Lối đã loại

- **Đổi `ℹ pass 3` thành `ℹ pass 5`**: lệch lại ngay khi `khoa-nguon-nghi-khi-ddl-sua` gộp (9 ca), và vẫn chạy ca DDL trên
  DB chung.
- **Khai E4/E5 `status: not-run` kèm `superseded_by` sang hồ sơ này** (nếp `auth-error-thu-lai-retry`): ô được thay phải là
  đúng phép đo ấy ở hồ sơ khác; ở đây giám sát giao sửa chính E4, và E5 không có hồ sơ nào thay.
- **Chép probe sang hồ sơ mới, để nguyên probe cũ** (nếp `the-gan-nhan-nguoi-dang`): hồ sơ cũ vẫn hoá cũ và lượt ghim vẫn
  chạy probe cũ đỏ — không gỡ được VIOLATION.

## Đặc tả UX

Bỏ — việc không chạm giao diện (sổ quyết định, dòng «bỏ đặc-tả-UX»).
