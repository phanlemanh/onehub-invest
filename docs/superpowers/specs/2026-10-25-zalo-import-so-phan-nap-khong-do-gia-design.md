# Thiết kế — zalo-import-so-phan-nap-khong-do-gia

Căn cứ: Cổng Bằng chứng `transform-zalo-boc-job-run` 25/10 — Mạnh chọn «Ngoài-4: mở hợp đồng mới»; giám sát P4-35.

## Vấn đề

ZJ-AC-5 (`scripts/zalo-import-job.test.mjs`) hứa «vòng transform-zalo-boc-job-run không đổi phần nạp làn ZCode». Nó đo
bằng cách so tệp ở CÂY LÀM VIỆC với bản ở `merge-base HEAD origin/main`. Sau khi vòng ấy vào main, phép đo vẫn chạy trong
bộ `scripts/*.test.mjs` (executor `scripts`, `/verify`) và đọc bất cứ thay đổi nào của phần nạp — kể cả thay đổi hợp lệ của
ZCode — như một vi phạm.

## Cách làm

Lời hứa là sự thật lịch sử về CẢ vòng ấy: tác động ròng của PR #96 lên main. PR vào main bằng merge commit `e962e78`
(cha 1 = main trước PR, cha 2 = đỉnh nhánh); trong vòng chỉ `ec71694` chạm tệp bọc. ZJ-AC-5 mới so phần nạp của
`e962e78^1` với `e962e78` (cả hai qua `git show`), không đọc cây làm việc, không dùng merge-base; mốc «nạp hỏng thì thoát 1»
phải có ở cả hai bản và phần cắt phải chứa `for try in 1 2 3 4 5`. Sự thật ấy không đổi theo thời gian nên ca không đỏ khi
ZCode sửa hợp lệ phần nạp, và vẫn chạy thật trên main (bỏ nhánh `t.skip`). Thiếu commit (bản sao nông, lịch sử bị cắt) thì
đỏ «thiếu lịch sử git» — cùng nếp ZJ-AC-4; CI hiện không chạy `scripts/*.test.mjs` và hai workflow có checkout đều dùng
`fetch-depth: 0`.

Rào làn cho các vòng làn Claude TƯƠNG LAI (một nhánh `feat/*` sau này sửa phần nạp) không có phép đo thay thế — ZJ-AC-5 vốn
chỉ là lời hứa của một vòng; ghi bằng dòng sổ `descope` có tên.

## Phép đo

`scripts/zalo-import-job-lan.test.mjs`: dựng worktree git tạm từ HEAD (trong thư mục tạm), sửa một dòng trong phần nạp của
tệp bọc ở cây làm việc tạm (mô phỏng ZCode sửa hợp lệ), rồi chạy (a) bản `zalo-import-job.test.mjs` hiện tại → thoát 0;
(b) bản cũ của chính tệp test (lấy bằng `git show 12b8942:…`) → thoát ≠ 0, dòng lỗi «ZJ-AC-5 phần nạp của tệp bọc đã đổi»
— đối chứng rằng mô phỏng thật sự tái hiện lỗi đỏ giả. Cây tạm xoá tệp bọc ở cây làm việc → ZJ-AC-5 vẫn xanh (không đọc
cây làm việc). Chiều đỏ: bản sao ca trỏ rev không có, và bản clone nông → «thiếu lịch sử git»; cặp giả có `import_one` đổi →
thông điệp nêu ZJ-AC-5, tệp bọc và rev.

## Không làm

- ZJ-AC-3 ghim hành vi nạp (5 lần thử ECONNREFUSED, state giữ mốc) — đổi hành vi nạp là đổi hợp đồng của làn ZCode, ca đỏ
  là tín hiệu đúng.
- Đổi tệp bọc `scripts/zalo-import-daily.sh`.
