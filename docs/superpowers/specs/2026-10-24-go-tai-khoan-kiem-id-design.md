# Gỡ tài khoản thu kiểm id trước khi gọi openclaw (ON14 · `go-tai-khoan-kiem-id`) — thiết kế

Hàng ON14 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, T3 vì chạm `app/src/app/api/v1/ops/**`). Câu giao: «Route gỡ
tài khoản thu DELETE /api/v1/ops/zalo/accounts từ chối id rỗng hoặc không có trong danh sách tài khoản trước khi gọi
openclaw». Gốc: sự cố P1-7 23/10 — ma trận phép đo gọi DELETE với id rỗng, route chạy
`openclaw channels logout --account ""`. Đã kiểm không hại (watchdog ok), lỗ còn nguyên. An toàn Zalo:
`.claude/rules/zalo-safety.md`, `docs/ops/runtime-map.md`.

## 1. Lỗi (đọc mã 24/10)

| Chỗ | Hiện tại | Hậu quả |
|---|---|---|
| Route `DELETE` (`app/src/app/api/v1/ops/zalo/accounts/route.ts`) | `(body.id ?? "").trim()` rồi gọi thẳng `deleteZaloAccount` | id rỗng/thiếu thành `""`; id đệm khoảng trắng bị cắt rồi gỡ |
| `deleteZaloAccount` (`app/src/lib/zalo-admin.ts:145`) | chỉ chặn `"default"`, rồi **chạy `openclaw channels logout --account <id>` TRƯỚC** khi đọc config; id không có trong config chỉ bị phát hiện SAU lệnh logout (và bị bỏ qua lặng, trả `ok`) | id rỗng, id lạ, id dạng cờ (`--channel`) đều tới được openclaw; route trả 200 cho id không tồn tại |

## 2. Thiết kế

1. **Bước kiểm id ở thư viện, trước mọi lệnh openclaw.** Thêm hàm `requireDeletableAccount(cfg, accountId)` trong
   `zalo-admin.ts`: id phải là chuỗi không rỗng, không chứa khoảng trắng, không mở đầu bằng `-` (khoá dạng cờ sửa tay
   trong config không bao giờ tới argv của openclaw), khác `"default"`, và CÓ trong `channels.zalouser.accounts` của
   `openclaw.json`. KHÔNG đòi khuôn `SLUG` của `createZaloAccount`: khoá thật sửa tay ngoài khuôn (chữ hoa, gạch dưới) vẫn
   gỡ được từ /ops. Mỗi lớp sai ném lỗi mang thông điệp riêng (ghim trong phép đo): «id rỗng» · «id có khoảng trắng» ·
   «id dạng cờ» · «không xoá được tài khoản default» · «không có trong danh sách tài khoản». `deleteZaloAccount` đọc config → gọi bước kiểm → rồi mới logout (best-effort như cũ) → gỡ
   config (sao lưu `.bak-*` như cũ). Đặt ở thư viện để mọi đường gọi (route hôm nay, đường khác mai sau) đều qua cổng.
2. **Route không cắt khoảng trắng.** `DELETE` truyền `body.id` nguyên văn khi là chuỗi, ngược lại `""`; mọi lỗi của bước
   kiểm → 400 kèm thông điệp (giữ khung try/catch hiện có). Id «đệm khoảng trắng» là id lạ — 400, không gỡ.
3. Không đổi UI: `zalo-accounts.tsx` gửi đúng `accountId` lấy từ danh sách, lỗi đã hiện bằng toast «Không gỡ được tài khoản».
   Không đổi sổ bề mặt API (`api-surface.ts`): route, phương thức, chế độ giữ nguyên.

## 3. Phép đo (an toàn Zalo: chỉ openclaw giả)

- `app/tests/go-tai-khoan-kiem-id.test.tsx` dựng thư mục tạm: `HOME` giả có `.openclaw/bin/openclaw` là script ghi argv
  mỗi lần gọi thành một dòng vào tệp nhật ký giả, cùng một bản `openclaw` giả đặt đầu `PATH`; `openclaw.json` giả có
  `default`, `acc2`, `acc3`. `OPS_API_TOKEN` giả cho nhánh bearer. `DATABASE_URL` trỏ cổng đóng để `auditOpsWrite` (lửa-
  rồi-quên, tự bắt lỗi) không ghi vào DB local dùng chung. Đặt env TRƯỚC import động (hằng `OPENCLAW` tính lúc nạp module).
  Không bao giờ chạm `~/.openclaw` thật. `zalo-admin.ts` xuất `zaloAdminPaths()` → `{ openclaw, config }` (đường mà module
  thật sự dùng). **Rào an toàn chạy trước mọi ca**: tệp test KHÔNG import tĩnh `zalo-admin` hay route (import tĩnh được
  kéo lên trước lệnh đặt env); sau khi đặt env và import động, ca đầu tiên assert `os.homedir()`, realpath của
  `zaloAdminPaths().openclaw` và `.config` đều nằm dưới thư mục tạm — sai thì ném lỗi ở `before()`, mọi ca sau (kể cả ca
  dương và chiều đỏ) không chạy. Chiều đỏ của rào: hàm kiểm rào gọi với HOME thật → trả vi phạm (không gọi handler).
- Ma trận viết trước gọi handler `DELETE` thật: id rỗng/thiếu/không phải chuỗi · id có khoảng trắng · id lạ (đúng khuôn mà
  không có, `default`, dạng cờ, dạng đường, chữ hoa) → 400, nhật ký giả rỗng, `openclaw.json` giữ nguyên từng byte. Đối chứng
  dương trên cùng fixture: `acc2` → 200, nhật ký giả đúng một dòng logout. Chiều đỏ: bản sao `zalo-admin.ts` bỏ dòng gọi bước
  kiểm, nạp từ thư mục tạm, gọi với id rỗng → nhật ký giả nhận lệnh logout.
- Fixture `openclaw.json` có thêm khoá dạng cờ `--channel` và khoá thật ngoài khuôn `Acc_5`: DELETE `--channel` → 400
  «id dạng cờ», nhật ký rỗng; chiều đỏ: bản sao chỉ kiểm thành viên → nhật ký nhận logout với `--channel`.
- Phép thử tĩnh: quét `app/src/**/*.ts(x)`, trong mọi tệp có chữ `openclaw`, tìm mọi chuỗi literal `"logout"` (bắt cả lời
  gọi trực tiếp lẫn mảng argv dựng riêng); mỗi chỗ phải có lời gọi `requireDeletableAccount(` đứng trước trong cùng hàm.
  Danh sách chỗ viết trước: đúng 1 chỗ — `app/src/lib/zalo-admin.ts` · `deleteZaloAccount`; số chỗ thước tìm thấy phải bằng
  đúng danh sách. Chiều đỏ: (a) bản sao đưa khối logout lên trước bước kiểm → vi phạm nêu tệp và «logout trước bước kiểm id»;
  (b) bản sao thêm một hàm dựng mảng argv `["channels", "logout", …]` không qua bước kiểm → thước bắt được và nêu tệp.

## 4. Ngoài phạm vi

- Route đăng nhập `POST /api/v1/ops/zalo/login` nhận `accountId` tuỳ ý rồi spawn `openclaw channels login` — cùng loại lỗ
  nhưng khác hàng; ghi làm ý cho mốc khép.
- Route nhóm `POST /api/v1/ops/zalo/groups` (đã kiểm tài khoản tồn tại trong `setZaloGroupEnabled`).
