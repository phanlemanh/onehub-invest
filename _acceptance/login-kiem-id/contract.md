---
schema_version: 1
feature: Route POST /api/v1/ops/zalo/login từ chối accountId không có trong danh sách tài khoản trước khi spawn openclaw channels login
slug: login-kiem-id
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm app/src/app/api/v1/ops/** (t3_paths)
surfaces: [api]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-24-login-kiem-id-design.md
---

# Acceptance Contract: login-kiem-id

## Context

Hàng phát sinh của dãy P3, từ Out of scope của ON14 `go-tai-khoan-kiem-id` (cùng loại lỗ YC1, sự cố P1-7 23/10).
`startZaloLogin` (`app/src/lib/zalo-admin.ts`) spawn `openclaw channels login --account <id>` với id tuỳ ý. Mọi phép
đo chạy với openclaw GIẢ (`HOME`/`PATH`/`OPENCLAW_QR_DIR` giả trong thư mục tạm) — không bao giờ spawn
`openclaw channels login` thật, không chạm `~/.openclaw` hay `/tmp/openclaw` (zalo-safety.md). «Openclaw giả» ghi argv
mỗi lần được gọi thành một dòng trong tệp nhật ký giả và ghi một ảnh QR giả cho id cuối argv.

## Criteria

- AC-1: Given `openclaw.json` giả có tài khoản `default`, `acc2`, `acc3`, `--channel`, `Acc_5` và openclaw giả, When gọi handler `POST` thật của route login với bearer ops và thân thiếu `accountId`, `accountId: ""`, `"   "`, `5`, `null`, thân không phải JSON, thân JSON `null`, Then mỗi lần 400, nhật ký openclaw giả rỗng; trừ `"   "` thì `error` là «id rỗng»; đối chứng dương trên cùng fixture: `accountId: "acc2"` làm nhật ký có đúng một dòng; chiều đỏ: bản sao `zalo-admin.ts` bỏ dòng gọi bước kiểm của đăng nhập, gọi `startZaloLogin("")` → nhật ký nhận lệnh login và ca đỏ nêu «login với id rỗng».
- AC-2: Given cùng fixture, When gọi `POST` với `accountId` có khoảng trắng — `" acc2 "`, `"acc2 "`, `"acc 2"`, `"acc2\n"`, Then mỗi lần 400 với `error` «id có khoảng trắng», nhật ký openclaw giả rỗng.
- AC-3: Given cùng fixture, When gọi `POST` với id không có trong danh sách — `"khong-co"`, `"../acc2"`, `"ACC2"`, và các khoá kế thừa của Object `"constructor"`, `"__proto__"`, `"toString"`, `"hasOwnProperty"` — và với `"--channel"` (có trong danh sách nhưng dạng cờ), Then mỗi lần 400 với `error` đúng lớp («không có trong danh sách tài khoản» · «id dạng cờ»), nhật ký openclaw giả rỗng; chiều đỏ: (a) bản sao `zalo-admin.ts` chỉ kiểm thành viên → `startZaloLogin("--channel")` làm nhật ký nhận lệnh login, ca đỏ nêu «dạng cờ»; (b) bản sao kiểm thành viên bằng `in` thay cho `Object.hasOwn` → `startZaloLogin("constructor")` làm nhật ký nhận lệnh login, ca đỏ nêu «khoá kế thừa».
- AC-4: Given cùng fixture, When gọi `POST` với `"acc2"` rồi khoá thật ngoài khuôn `"Acc_5"`, Then mỗi lần 200, `qrBase64` bằng base64 của ảnh QR giả của chính id đó, và nhật ký thêm đúng một dòng có argv đúng `channels login --channel zalouser --account <id>`.
- AC-5: Given cùng fixture, When gọi `POST` với `"default"`, rồi với `"default"` lần nữa trên config KHÔNG có `accounts.default` (layout cũ), Then mỗi lần 200, `qrBase64` bằng base64 của ảnh QR giả của `default`, nhật ký thêm đúng một dòng `channels login --channel zalouser --account default` — tài khoản thu chính luôn đăng nhập lại được.
- AC-6: Given một lượt đăng nhập `acc3` đang chạy (openclaw giả của `acc3` ghi QR rồi không thoát), When gọi `POST` với `"--channel"` rồi `"khong-co"`, Then mỗi lần 400 với `error` đúng lớp, không trả QR của `acc3`, và nhật ký vẫn đúng một dòng (của `acc3`); tiến trình giả của `acc3` được huỷ ở cuối ca.
- AC-7: Given cây `app/src` và danh sách chỗ login viết trước (đúng 1: `app/src/lib/zalo-admin.ts` · `startZaloLogin`), When quét tĩnh mọi literal `login` trong các tệp có chữ `openclaw` — chuỗi `"login"`, `'login'`, `` `login` ``, và chuỗi chứa `channels login` —, Then tập chỗ tìm thấy bằng đúng danh sách và mỗi chỗ có lời gọi `requireLoginAccount(` đứng trước trong cùng hàm; chiều đỏ: (a) bản sao đưa bước kiểm xuống sau lệnh spawn → vi phạm nêu tệp và «login trước bước kiểm id»; (b) bản sao thêm hàm dựng mảng argv `['channels', 'login', …]` (nháy đơn) không qua bước kiểm; (c) bản sao thêm hàm dựng chuỗi lệnh `"openclaw channels login --account " + id` — (b) và (c) thước đều bắt, nêu tệp.
- AC-8: Given tệp test đặt `HOME`/`PATH`/`OPENCLAW_QR_DIR` giả rồi mới import động `zalo-admin` và route (không import tĩnh), When rào an toàn chạy trong `before()` trước mọi ca VÀ trên `zaloAdminPaths()` của mỗi bản sao đột biến trước khi gọi bản sao, Then `os.homedir()`, realpath của `openclaw`, `config` và `qrDir` đều nằm dưới thư mục tạm — sai thì không ca nào (kể cả ca đỏ) gọi handler hay `startZaloLogin`; chiều đỏ: hàm kiểm rào với `HOME` thật, và với `qrDir` = `/tmp/openclaw`, trả vi phạm nêu đường lạc.
- AC-9: Given một tiến trình con với `HOME`/`PATH` giả và KHÔNG có biến `OPENCLAW_QR_DIR` (như chạy thật), When nạp `zalo-admin` và đọc `zaloAdminPaths().qrDir` (không gọi `startZaloLogin`, không spawn openclaw), Then giá trị đúng `/tmp/openclaw`; chiều đỏ: bản sao đặt mặc định `join(os.tmpdir(), "openclaw")` ra giá trị khác và ca đỏ nêu «QR mặc định».
- AC-10: Given bước kiểm id của việc gỡ tài khoản (ON14) được tách thành bước kiểm dùng chung, When chạy `app/tests/go-tai-khoan-kiem-id.test.tsx`, Then đủ 11 ca `GT-AC-*` vẫn xanh (thông điệp, thứ tự kiểm và hành vi gỡ không đổi).

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Ma trận lớp đầu vào `accountId` viết trước: {thiếu, `""`,
chỉ khoảng trắng, không phải chuỗi, JSON hỏng, JSON null} (AC-1) · {đệm hai đầu, đệm cuối, khoảng trắng giữa, xuống
dòng} (AC-2) · {đúng khuôn mà không có, dạng đường, chữ hoa, khoá kế thừa của Object, khoá dạng cờ có trong danh sách}
(AC-3) · {id thật đúng khuôn, khoá thật ngoài khuôn} (AC-4) · {`default` có trong config, `default` vắng trong config}
(AC-5) · {id sai khi đang có phiên đăng nhập dở} (AC-6) · đường spawn login trong mã {gọi trực tiếp, mảng argv nháy
đơn, chuỗi lệnh gộp} (AC-7) · rào an toàn của phép đo {module gốc, bản sao đột biến} (AC-8) · thư mục QR khi chạy thật
(AC-9) · hồi quy việc gỡ (AC-10).

## Đường đo

- Ngưỡng ô cơ hội «id rỗng, id có khoảng trắng, id dạng cờ, id lạ: 400, openclaw giả không nhận lệnh nào» — số từ nhật
  ký openclaw giả + mã HTTP của handler thật trong `app/tests/login-kiem-id.test.tsx` · AC-1, AC-2, AC-3.
- «id có thật: đúng một lệnh login với argv đúng» — cùng tệp test · AC-4, AC-5 (`default`), AC-6 (khi có phiên dở).
- «phép thử tĩnh: mọi lời gọi channels login đứng sau bước kiểm id» — thước quét tĩnh trong cùng tệp test · AC-7.
- Điều kiện để mọi phép đo trên an toàn (openclaw giả, không `~/.openclaw`, không `/tmp/openclaw`) — rào trong
  `before()` và trên mỗi bản sao · AC-8; chạy thật vẫn đọc QR ở `/tmp/openclaw` · AC-9.

## Out of scope

- `GET` (đọc trạng thái qua `openclaw channels status`) và `DELETE` (huỷ tiến trình con app đã spawn) của route login.
- Route nhóm `POST /api/v1/ops/zalo/groups` và giao diện `/ops/sources` (UI không đổi; lỗi 400 hiện qua toast có sẵn).
- Nhánh đăng nhập phiên (cookie) của route — phép đo đi nhánh bearer ops; auth không đổi.
- Thước tĩnh AC-7 không so quan hệ «id được kiểm chính là id đưa vào argv» — nó đòi lời gọi bước kiểm đứng trước trong
  cùng hàm (cùng hạn chế ON14 Ngoài-4); các ca chạy thật AC-1…AC-6 đo hành vi.

## Notes

- Phép đo không bao giờ spawn `openclaw` thật, không đọc/ghi `~/.openclaw` hay `/tmp/openclaw`, không gọi route trên
  dev server đang chạy.
- `OPENCLAW_QR_DIR` chỉ là chỗ nối cho phép đo; chạy thật không đặt nên vẫn đọc `/tmp/openclaw`, nơi CLI thật ghi QR.
