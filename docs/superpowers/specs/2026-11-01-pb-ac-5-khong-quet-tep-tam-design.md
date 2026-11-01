# pb-ac-5-khong-quet-tep-tam — PB-AC-5/PB-AC-6 không đỏ vì bản đột biến tạm của test khác

## Vấn đề

`pipeline/scripts/phat-bieu.test.mjs` quét cây thật:
- PB-AC-5 quét bằng `filesOfTree(ROOT)` (`pipeline/lib/scan-canonical-write.mjs`);
- PB-AC-6 quét bằng `findCallSites(ROOT)` và `kiemVai(ROOT)` (`pipeline/lib/enrich-call-sites.mjs`).

Cả hai đều `readdirSync` rồi mới `statSync`/`readFileSync` từng mục. `npm test` của pipeline chạy các tệp test song song.
`gia-ty-sau-khoang-trang.test.mjs` (và `gia-ty-chan-dong`, `cam-mau-s03`, `gop-anh`) ghi bản đột biến ẩn `.xx-mut-<pid>-<n>.mjs`
ngay trong `pipeline/`, nạp rồi xoá. Nếu bản đột biến bị xoá giữa lúc đọc tên và lúc stat, bộ quét ném `ENOENT` và PB-AC-5
đỏ, dù không có thay đổi nào liên quan. Đo 01/11 trên cây tạm có tiến trình sinh-xoá `.gs-mut-*.mjs` liên tục:
`filesOfTree` ném `ENOENT` 154/200 lượt.

Bản đột biến phải nằm cạnh `transform-zalo.mjs` vì nó import tương đối (`./lib/…`) và import gói `pg`, nên không chuyển ra
thư mục tạm được nếu không viết lại import. Hai bộ quét nằm ở `pipeline/lib/`, ngoài ranh giới của hàng.

## Cách sửa

Trong `phat-bieu.test.mjs`, thêm hàm `quetChiuTepTam(fn, lan = 100)`:
- chạy `fn()`; nếu nó ném lỗi `code === "ENOENT"` mà `basename(e.path)` bắt đầu bằng dấu chấm (tệp tạm ẩn), chạy lại;
- tối đa `lan` lần; lần cuối vẫn lỗi thì ném lỗi ấy;
- lỗi khác, hoặc `ENOENT` trên tệp không ẩn, ném ngay.

Trần 100: dưới tải thử nặng nhất đo được (77% lượt quét lỗi), xác suất 100 lượt liền cùng lỗi ≈ 4e-12 mỗi lời gọi; trên
cây thật, bản đột biến chỉ sống vài trăm mili giây nên thường chỉ cần quét lại một lần, và mỗi lần quét dưới 1 giây.

Một lượt quét thành công vẫn có thể đọc trúng một bản đột biến đang sống. Điều đó không làm đỏ: bản đột biến là bản sao của
tệp có sẵn (`transform-zalo.mjs`, `transform-media.mjs`…), vốn qua được cùng phép quét ghi thẳng, và không tệp nào trong số đó
nằm trong ma trận `CALL_SITES`.

Mọi lời gọi quét cây thật trong tệp (PB-AC-5 quét cây, PB-AC-6 chỗ gọi và hai đối chứng của nó) đi qua hàm này. Các
assertion của PB-AC-5/PB-AC-6 giữ nguyên. Một lượt quét thành công vẫn đọc trọn cây thật, nên không kiểm nào bị nới.
`gia-ty-sau-khoang-trang.test.mjs` không phải sửa.

## Test (cùng tệp, mã TT-AC-n)

- **TT-AC-1 dưới tải sinh-xoá:** cây tạm dưới `os.tmpdir()` có đủ năm thư mục quét, 200 tệp `.mjs` trong `pipeline/`. Một tiến
  trình con sinh-xoá `.gs-mut-*.mjs` liên tục trong cây tạm và báo số tệp đã sinh-xoá (đối chứng dương ≥ 200). Cả hai bộ quét
  (`filesOfTree(r)`, `findCallSites(r)`) qua `quetChiuTepTam` mỗi bộ 30 lượt: không lượt nào ném, `filesOfTree` mỗi lượt có đủ
  200 tệp thường. Chiều đỏ trên cùng cây và cùng tải: gọi thẳng từng bộ quét tới lần `ENOENT` đầu tiên, trần 400 lượt hoặc
  20 giây; không gặp thì đỏ. Tiến trình con luôn được dừng và cây tạm luôn được xoá trong `finally`, kể cả khi ca đỏ.
- **TT-AC-2 không nuốt lỗi thật:** `fn` ném `ENOENT` có `path` là tệp thường → ném ra, gọi 1 lần; ném `EACCES` → ném ra, gọi
  1 lần; ném `ENOENT` tệp ẩn mãi → ném sau đúng `lan` lần gọi (thử với `lan = 5`); ném `ENOENT` tệp ẩn một lần rồi thành công
  → trả kết quả, gọi 2 lần. Chiều đỏ: bản lỏng (chạy lại với mọi `ENOENT`) chạy cùng ma trận phải đỏ với thông điệp ghim.
- **TT-AC-3 mọi lời gọi quét cây thật đi qua lớp bọc:** đọc mã nguồn chính tệp test; mọi chỗ gọi `filesOfTree(ROOT`,
  `findCallSites(ROOT`, `kiemVai(ROOT` phải nằm trong `quetChiuTepTam(() => …)`, và số chỗ gọi ≥ 4. Chiều đỏ: cùng mã nguồn
  mà bỏ lớp bọc ở một chỗ thì bộ kiểm nêu đúng dòng ấy.
- Hồi quy: `cd pipeline && npm test` xanh, gồm PB-AC-5, PB-AC-6 và `gia-ty-sau-khoang-trang`.

## Giới hạn đã biết

- Sửa ở phía người quét, không ở phía người ghi: bộ quét khác trong kho đi qua `pipeline/` mà không có lớp bọc này vẫn có thể
  gặp lỗi cùng lớp. Sửa tận gốc là `filesOfTree`/`findCallSites` bỏ qua tệp ẩn ở `lib/` — ngoài ranh của hàng.
