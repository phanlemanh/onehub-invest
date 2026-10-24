# Đăng nhập tài khoản thu kiểm id (`login-kiem-id`) — thiết kế

Hàng phát sinh của dãy P3 (T3 vì chạm `app/src/app/api/v1/ops/**`), từ mục Out of scope của ON14 `go-tai-khoan-kiem-id`.
Câu giao: «Route POST /api/v1/ops/zalo/login từ chối accountId không có trong danh sách tài khoản trước khi spawn
openclaw channels login». Cổng Đáng: build (P3-34, Mạnh «Đồng ý»). An toàn Zalo: `.claude/rules/zalo-safety.md`,
`docs/ops/runtime-map.md` — phép đo không spawn `openclaw channels login` thật.

## 1. Lỗi (đọc mã 24/10, sau ON14)

| Chỗ | Hiện tại | Hậu quả |
|---|---|---|
| Route `POST` (`app/src/app/api/v1/ops/zalo/login/route.ts`) | chỉ chặn `accountId` rỗng/thiếu; mọi lỗi của `startZaloLogin` → 500 | id có khoảng trắng, id lạ, id dạng cờ đều đi tiếp |
| `startZaloLogin` (`app/src/lib/zalo-admin.ts`) | spawn `openclaw channels login --channel zalouser --account <id>` không kiểm id | id dạng cờ (`--channel`) vào argv như một cờ; id lạ mở một phiên đăng nhập cho tài khoản không có trong config |
| Thư mục ảnh QR | hằng `/tmp/openclaw` | phép đo hoặc ghi/đọc thư mục chạy thật của gateway, hoặc chờ 20 giây mỗi lần gọi |

## 2. Thiết kế

1. **Một bước kiểm id dùng chung.** Tách các điều kiện của `requireDeletableAccount` (ON14) thành
   `requireAccountId(cfg, accountId, { allowDefault })`: id phải là chuỗi không rỗng, không khoảng trắng, không mở đầu
   bằng `-`; rồi `default` (gỡ: từ chối «không xoá được tài khoản default»; đăng nhập: cho qua — `default` luôn có
   trong danh sách, kể cả layout cũ không ghi `accounts.default`); rồi phải có trong `channels.zalouser.accounts`.
   Thông điệp và thứ tự kiểm của ON14 giữ nguyên từng chữ. `requireDeletableAccount` và hàm mới
   `requireLoginAccount` là hai lớp vỏ mỏng. Lỗi của bước kiểm là `AccountIdError` (lớp con của `Error`).
2. **`startZaloLogin` đọc config và gọi `requireLoginAccount` TRƯỚC mọi việc khác** (trước cả nhánh trả phiên đăng
   nhập đang chạy), rồi mới spawn.
3. **Route `POST`** lấy `accountId` nguyên văn khi là chuỗi (không cắt khoảng trắng), ngược lại `""`; `AccountIdError`
   → 400, lỗi khác → 500 như cũ. Bỏ nhánh «thiếu accountId» riêng (bước kiểm báo «id rỗng»).
4. **Thư mục QR đọc từ `OPENCLAW_QR_DIR`, mặc định `/tmp/openclaw`** (nơi CLI thật ghi QR — chạy thật không đặt biến
   này). `zaloAdminPaths()` trả thêm `qrDir` để rào an toàn của phép đo kiểm nó.
5. Không đổi `GET`/`DELETE` của route login (đọc trạng thái, huỷ tiến trình con của chính app), không đổi UI
   (`zalo-accounts.tsx` gửi `accountId` lấy từ danh sách; lỗi 400 hiện qua toast có sẵn), không đổi sổ bề mặt API.

## 3. Phép đo (an toàn Zalo: chỉ openclaw giả)

- `app/tests/login-kiem-id.test.tsx`, cùng khuôn ON14: `HOME`, `PATH`, `OPENCLAW_QR_DIR` trỏ thư mục tạm; openclaw giả
  ghi argv vào `spy.log`, ghi một ảnh QR giả `openclaw-zalouser-qr-<id cuối argv>.png` vào `OPENCLAW_QR_DIR`, rồi thoát —
  riêng id `acc3` thì ghi QR rồi ngủ (giả một phiên đăng nhập đang chờ). Import động sau khi đặt env; rào kiểm
  `homedir()`, `openclaw`, `config`, `qrDir` nằm dưới thư mục tạm — chạy trong `before()` VÀ trên `zaloAdminPaths()` của
  mỗi bản sao đột biến trước khi gọi bản sao (một hàm nạp bản sao duy nhất làm việc đó).
- Ma trận viết trước gọi handler `POST` thật với bearer ops (AC-1…AC-5): id rỗng/thiếu/không phải chuỗi/JSON hỏng ·
  khoảng trắng · id lạ, dạng đường, chữ hoa, khoá kế thừa của Object (`constructor`, `__proto__`, `toString`,
  `hasOwnProperty`), khoá dạng cờ có trong config → 400 đúng thông điệp lớp, `spy.log` rỗng. Id thật `acc2`, khoá thật
  ngoài khuôn `Acc_5` → 200; `default` có và vắng trong config → 200; `qrBase64` bằng base64 của ảnh QR giả, đúng một dòng
  argv login. Chiều đỏ trên bản sao: bỏ dòng gọi bước kiểm → id rỗng lọt; chỉ kiểm thành viên → `--channel` lọt; kiểm
  thành viên bằng `in` → `constructor` lọt.
- Phiên dở (AC-6): một lượt `acc3` đang chạy, rồi `--channel` và `khong-co` vẫn 400, không trả QR của `acc3`;
  `cancelZaloLogin("acc3")` dọn tiến trình giả.
- Thước tĩnh (AC-7): mọi literal `login` (nháy kép, nháy đơn, template, chuỗi chứa `channels login`) trong tệp có chữ
  `openclaw` dưới `app/src` có `requireLoginAccount(` đứng trước trong cùng hàm; danh sách viết trước: đúng 1 chỗ —
  `zalo-admin.ts` · `startZaloLogin`. Chiều đỏ: spawn trước bước kiểm; mảng argv nháy đơn; chuỗi lệnh gộp.
- QR khi chạy thật (AC-9): tiến trình con không có `OPENCLAW_QR_DIR` đọc `zaloAdminPaths().qrDir` = `/tmp/openclaw`
  (không spawn gì); chiều đỏ: bản sao mặc định `os.tmpdir()`.
- Hồi quy ON14 (AC-10): `app/tests/go-tai-khoan-kiem-id.test.tsx` vẫn xanh nguyên 11 ca sau khi tách bước kiểm.

## 4. Ngoài phạm vi

- `GET /api/v1/ops/zalo/login?account=` (chạy `openclaw channels status`, chỉ đọc) và `DELETE` (huỷ tiến trình con app
  đã spawn) — không nhận lệnh ghi nào tới openclaw.
- Route nhóm `POST /api/v1/ops/zalo/groups` (đã kiểm tài khoản tồn tại trong `setZaloGroupEnabled`).
