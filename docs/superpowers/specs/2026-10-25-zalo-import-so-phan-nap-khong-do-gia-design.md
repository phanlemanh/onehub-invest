# Thiết kế — zalo-import-so-phan-nap-khong-do-gia

Căn cứ: Cổng Bằng chứng `transform-zalo-boc-job-run` 25/10 — Mạnh chọn «Ngoài-4: mở hợp đồng mới»; giám sát P4-35.

## Vấn đề

ZJ-AC-5 (`scripts/zalo-import-job.test.mjs`) hứa «vòng transform-zalo-boc-job-run không đổi phần nạp làn ZCode». Nó đo
bằng cách so tệp ở CÂY LÀM VIỆC với bản ở `merge-base HEAD origin/main`. Sau khi vòng ấy vào main, phép đo vẫn chạy trong
bộ `scripts/*.test.mjs` (executor `scripts`, `/verify`) và đọc bất cứ thay đổi nào của phần nạp — kể cả thay đổi hợp lệ của
ZCode — như một vi phạm.

## Cách làm

Lời hứa là sự thật lịch sử về MỘT commit: commit sửa của vòng ấy, `ec71694` («bọc job_run cho transform-zalo và
refresh-bait-gap»). ZJ-AC-5 mới so phần nạp của `ec71694^` với `ec71694` (cả hai qua `git show`), không đọc cây làm việc,
không dùng merge-base. Sự thật ấy không đổi theo thời gian nên ca không bao giờ đỏ oan, và vẫn chạy thật trên main (bỏ
nhánh `t.skip`). Kiểm commit có trong lịch sử trước (`git cat-file -e`), thiếu thì đỏ «thiếu lịch sử git».

## Phép đo

`scripts/zalo-import-job-lan.test.mjs`: dựng worktree git tạm từ HEAD (trong thư mục tạm), sửa một dòng trong phần nạp của
tệp bọc ở cây làm việc tạm (mô phỏng ZCode sửa hợp lệ), rồi chạy (a) bản `zalo-import-job.test.mjs` hiện tại → thoát 0;
(b) bản cũ của chính tệp test (lấy bằng `git show 12b8942:…`) → thoát ≠ 0, dòng lỗi «ZJ-AC-5 phần nạp của tệp bọc đã đổi»
— đối chứng rằng mô phỏng thật sự tái hiện lỗi đỏ giả. Ca chiều đỏ của phép so mới: cặp (trước, sau) giả có `import_one`
đổi → hàm so báo lệch.

## Không làm

- ZJ-AC-3 ghim hành vi nạp (5 lần thử ECONNREFUSED, state giữ mốc) — đổi hành vi nạp là đổi hợp đồng của làn ZCode, ca đỏ
  là tín hiệu đúng.
- Đổi tệp bọc `scripts/zalo-import-daily.sh`.
