# m2-ac10-so-cap-co-dinh — ca M2-AC-10 so cặp commit cố định

Hàng P3 của đợt dieu-phoi-dot0-cam-mau. Gốc: Ngoài-2/4/11 ở Cổng Bằng chứng `dung-m2-song-song` (Mạnh chọn «mở hợp đồng
mới», 29/10).

## Vấn đề

Ca «M2-AC-10 diff config.yaml so merge-base origin/main chỉ thêm hai dòng executors của hồ sơ» trong
`scripts/design-floor/fresh.test.mjs` so `_acceptance/config.yaml` của HEAD với `merge-base HEAD origin/main`. Câu đó chỉ
đúng trên nhánh `feat/dung-m2-song-song` trước khi gộp. Sau PR #165 (main `98757b5f`), merge-base = HEAD nên diff rỗng
và ca đỏ trên main; nhánh nào sau này sửa `config.yaml` cũng đỏ theo; bản tải nông không có `origin/main` thì đỏ vì lỗi
git. Đã đo trên main: `node --test scripts/design-floor/*.test.mjs` → 41 pass, 1 fail (đúng ca này).

## Cách sửa

Bất biến «chỉ thêm hai dòng» thuộc về MỘT lần sửa: commit `3b3a33e5` (S1 của `dung-m2-song-song`) là commit duy nhất
đổi `config.yaml` của hồ sơ đó (`git log origin/main -- _acceptance/config.yaml`). Phép so ghim vào cặp blob cố định
`3b3a33e5^:_acceptance/config.yaml` → `3b3a33e5:_acceptance/config.yaml`, đúng khuôn `aer-ac2-so-cap-co-dinh`.

- Hàm so thuần `soCapConfig(before, after)` trả `{ added, removed }` (dòng thêm/bớt, không tính dòng tiêu đề diff) — đọc
  qua `git diff --no-index --unified=0` trên hai tệp tạm, để cặp đỏ chạy trên CÙNG hàm với bản «sau» bị sửa.
- `blobAt(sha, path)` đọc blob bằng `git show`; trước đó `requireCommit(sha)` kiểm `git cat-file -e <sha>^{commit}`,
  thiếu thì ném lỗi ghim «thiếu commit ghim <sha> … git fetch --unshallow» — không bỏ qua lặng.
- Hai ca còn lại của M2-AC-10 (không khoá `design_floor`, kit đọc «bậc M1»; cặp đỏ trên bản chép) giữ nguyên — chúng đọc
  HEAD và là bất biến đúng cho tới khi một hàng T1 riêng bật M2.
- Thêm `scripts/design-floor/fresh-sau-gop.test.mjs`: dựng bản clone `--shared` của kho, chép mã `scripts/design-floor`
  đang có vào, commit thêm một khoá vào `config.yaml`, đặt `origin/main` = HEAD (đúng trạng thái «sau khi gộp, có PR khác
  sửa config»), chạy `fresh.test.mjs` của bản mới → thoát 0; chạy bản `fresh.test.mjs` ở `98757b5f` trên cùng cây → thoát
  khác 0 và nêu ca M2-AC-10 diff. Đó là cặp hai chiều của lời hứa chính.

## Không làm

- Ngoài-5 (test ghim số đếm của nguồn đang sống): Mạnh chọn «ghi Known limits» ở Cổng Bằng chứng — giữ nguyên.
- Không sửa hợp đồng hay `evals.yaml` đã ký của `dung-m2-song-song`. Câu `expected` của E12 còn nhắc merge-base; khai
  `superseded_by` cho ô đó (nếu cần) là việc hồ sơ riêng như `auth-error-e2-superseded`. Hồ sơ đó chỉ được ghim lại bằng
  làn máy nếu lưới trước-merge báo hoá cũ.
- Không nối test vào CI (`ci-test.yml` ngoài vùng hàng).

## Rủi ro

- Ca clone tốn vài giây (chạy `fresh.test.mjs` hai lần); chấp nhận vì nó là phép đo duy nhất của trạng thái «sau gộp».
- Kho tải nông thiếu `3b3a33e5` hay `98757b5f` → hai ca đỏ có tên (chiều an toàn).
