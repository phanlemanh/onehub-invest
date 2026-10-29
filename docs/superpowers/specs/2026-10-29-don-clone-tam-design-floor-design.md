# don-clone-tam-design-floor — bộ test design-floor không để rác trong TMPDIR

Hàng P3 của đợt dieu-phoi-dot0-cam-mau (Mạnh «Duyệt cả 8», 29/10). Gốc: Ngoài-1 của `m2-ac10-so-cap-co-dinh` — ca
clone sau-gộp bỏ lại khoảng 350MB mỗi lượt chạy.

## Vấn đề

Bốn chỗ trong `scripts/design-floor/` tạo thư mục tạm bằng `mkdtempSync` và không bao giờ xoá:

| Tiền tố | Nơi tạo | Cỡ mỗi thư mục | Đếm trên máy 29/10 |
|---|---|---|---|
| `sau-gop-*` | `fresh-sau-gop.test.mjs` (`cloneWithConfigKey`) | ~118MB (clone đủ kho) | 18 |
| `design-floor-*` | `test-helpers.mjs` (`copyRepo`) | nhỏ | 687 |
| `cap-config-*` | `test-helpers.mjs` (`soCapConfig`) | rất nhỏ | 298 |
| `reuse-plan-*` | `reuse-plan.test.mjs` (`WORK`, `plan-*`) | nhỏ | 18 |

Executor `design_floor_gen` (`node --test scripts/design-floor/*.test.mjs`) chạy ở mọi lượt chấm và ghim lại, nên đĩa đầy
dần không tín hiệu. Bản clone `--shared` còn trỏ object qua alternates của worktree: worktree bị gỡ thì clone sót hỏng.

## Cách sửa

- `test-helpers.mjs` thêm `tempDir(prefix)`: `mkdtempSync(path.join(tmpdir(), prefix))`, ghi đường vào một tập; lần gọi
  đầu đăng ký `process.once('exit', …)` xoá (`rmSync` recursive + force) mọi đường đã ghi. Dọn khi TIẾN TRÌNH thoát nên phủ
  cả thư mục mức module, thư mục tạo trong hàm trợ giúp, và ca đỏ giữa chừng (assert ném vẫn để tiến trình thoát bình
  thường).
- Bốn chỗ tạo đổi sang `tempDir`. `fresh-sau-gop` và `reuse-plan` (thư mục con `plan-*` nằm trong `WORK`) dùng nó; không
  tệp nào khác trong `scripts/design-floor/` gọi `mkdtempSync` trực tiếp.
- Ca đo mới `tmp-sach.test.mjs`:
  - chạy mọi tệp `*.test.mjs` khác của thư mục trong tiến trình con với `TMPDIR` trỏ một thư mục rỗng mới (bỏ
    `NODE_TEST_CONTEXT` để `node --test` lồng chạy thật), rồi đòi thư mục đó rỗng và đầu ra có dòng `ok` của ca diff
    M2-AC-10 và ca sau-gộp (a) — chống xanh vô nghĩa;
  - cặp đỏ cùng thước: chạy bản test ở `89730e6b` (main trước hàng) trên bản clone với `TMPDIR` rỗng mới → thư mục còn
    các tiền tố trên, thước gọi tên từng tiền tố;
  - ca ném giữa chừng: tiến trình con nhập `tempDir`, tạo thư mục, rồi ném → thoát khác 0 và thư mục đã mất; đối chứng
    đỏ: cùng tiến trình tạo bằng `mkdtempSync` trần → thư mục còn;
  - quét nguồn: 0 lời gọi `mkdtempSync(` trong `scripts/design-floor/*.mjs` ngoài `tempDir`; bản sao có chèn một lời gọi
    → thước gọi `<tệp>:<dòng>`.

## Không làm

- Không xoá các thư mục rác đang có trên máy (hơn nghìn thư mục) — xoá dữ liệu trên máy người dùng không thuộc vòng;
  lệnh dọn tay nêu trong mô tả PR.
- Không đổi bộ test khác ngoài `scripts/design-floor/`, không nối CI.

## Rủi ro

- Ca đo chạy lại cả bộ hai lần (bản mới, bản cũ trên clone) — thêm khoảng 20–30 giây cho `design_floor_gen`.
- `process.on('exit')` không chạy khi tiến trình bị SIGKILL; khi đó thư mục còn — giới hạn đã biết.
