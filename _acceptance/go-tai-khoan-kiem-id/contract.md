---
schema_version: 1
feature: Route gỡ tài khoản thu DELETE /api/v1/ops/zalo/accounts từ chối id rỗng hoặc không có trong danh sách tài khoản trước khi gọi openclaw
slug: go-tai-khoan-kiem-id
owner: phanlemanh@gmail.com
risk_tier: T3      # chạm app/src/app/api/v1/ops/** (t3_paths)
surfaces: [api]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-24
design_doc: docs/superpowers/specs/2026-10-24-go-tai-khoan-kiem-id-design.md
lo_trinh_ma: ON14
---

# Acceptance Contract: go-tai-khoan-kiem-id

## Context

Hàng ON14 (T3), YC1 — sự cố P1-7 23/10: ma trận phép đo gọi `DELETE /api/v1/ops/zalo/accounts` với id rỗng, route chạy
`openclaw channels logout --account ""` vì `deleteZaloAccount` (`app/src/lib/zalo-admin.ts:145`) gọi logout trước khi kiểm
id. Mọi phép đo dưới đây chạy với openclaw GIẢ (`HOME`/`PATH` giả trong thư mục tạm), không chạm `~/.openclaw` hay tài
khoản thật (zalo-safety.md). «Openclaw giả» ghi argv mỗi lần được gọi thành một dòng trong tệp nhật ký giả.

## Criteria

- AC-1: Given `openclaw.json` giả có tài khoản `default`, `acc2`, `acc3` và openclaw giả, When gọi handler `DELETE` thật với bearer ops và thân thiếu `id`, `id: ""`, `id: "   "`, `id: 5`, `id: null`, Then mỗi lần 400, nhật ký openclaw giả rỗng và `openclaw.json` giữ nguyên từng byte; đối chứng dương trên cùng fixture: `id: "acc2"` làm nhật ký có đúng một dòng; chiều đỏ: bản sao `zalo-admin.ts` bỏ dòng gọi bước kiểm id, gọi `deleteZaloAccount("")` → nhật ký openclaw giả nhận lệnh logout và ca đỏ nêu «logout với id rỗng».
- AC-2: Given cùng fixture, When gọi `DELETE` với `id` có khoảng trắng — `" acc2 "`, `"acc2 "`, `"acc 2"`, `"acc2\n"`, Then mỗi lần 400, nhật ký openclaw giả rỗng, `openclaw.json` giữ nguyên (không cắt khoảng trắng rồi gỡ `acc2`).
- AC-3: Given fixture có thêm khoá dạng cờ `--channel` trong danh sách tài khoản, When gọi `DELETE` với id không gỡ được — `"khong-co"`, `"../acc2"`, `"ACC2"` (không có trong danh sách), `"default"`, `"--channel"` (có trong danh sách nhưng dạng cờ), Then mỗi lần 400 với `error` chứa đúng thông điệp của lớp mình («không có trong danh sách tài khoản» · «không xoá được tài khoản default» · «id dạng cờ»), nhật ký openclaw giả rỗng, `openclaw.json` giữ nguyên từng byte; chiều đỏ: bản sao `zalo-admin.ts` chỉ kiểm thành viên → `deleteZaloAccount("--channel")` làm nhật ký giả nhận logout và ca đỏ nêu «dạng cờ».
- AC-4: Given cùng fixture, When gọi `DELETE` với `id: "acc2"` rồi với khoá thật ngoài khuôn `id: "Acc_5"`, Then mỗi lần 200 `{ ok: true }` và nhật ký openclaw giả thêm đúng một dòng, argv đúng `channels logout --channel zalouser --account <id>`; `openclaw.json` không còn id đó, còn nguyên `default` và `acc3`; có tệp sao lưu `openclaw.json.bak-*`.
- AC-5: Given cây `app/src` và danh sách chỗ logout viết trước (đúng 1: `app/src/lib/zalo-admin.ts` · `deleteZaloAccount`), When quét tĩnh mọi chuỗi literal `"logout"` trong các tệp có chữ `openclaw`, Then tập chỗ tìm thấy bằng đúng danh sách và mỗi chỗ có lời gọi `requireDeletableAccount(` đứng trước trong cùng hàm; chiều đỏ: (a) bản sao đưa khối logout lên trước bước kiểm → vi phạm nêu tệp và «logout trước bước kiểm id»; (b) bản sao thêm hàm dựng mảng argv `["channels", "logout", …]` không qua bước kiểm → thước bắt được, nêu tệp.
- AC-6: Given tệp test đặt `HOME`/`PATH` giả rồi mới import động `zalo-admin` và route (không import tĩnh), When rào an toàn chạy trong `before()` trước mọi ca, Then `os.homedir()`, realpath của `zaloAdminPaths().openclaw` và `.config` đều nằm dưới thư mục tạm — sai thì `before()` ném lỗi và không ca nào gọi handler hay `deleteZaloAccount`; chiều đỏ: hàm kiểm rào gọi với `HOME` thật trả vi phạm nêu «HOME thật» (không gọi handler).

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Ma trận lớp đầu vào `id` viết trước: {thiếu, `""`, chỉ khoảng
trắng, không phải chuỗi} (AC-1) · {đệm hai đầu, đệm cuối, khoảng trắng giữa, xuống dòng} (AC-2) · {đúng khuôn mà không có,
`default`, khoá dạng cờ có trong danh sách, dạng đường, chữ hoa} (AC-3) · {id thật đúng khuôn, khoá thật ngoài khuôn} (AC-4) ·
đường gọi logout trong mã {gọi trực tiếp, mảng argv dựng riêng} (AC-5) · rào an toàn của chính phép đo (AC-6).

## Đường đo

- Ngưỡng ô cơ hội «Gọi với id rỗng, id có khoảng trắng, id lạ: 400, openclaw giả không nhận lệnh nào» — số từ nhật ký openclaw
  giả + mã HTTP của handler thật trong `app/tests/go-tai-khoan-kiem-id.test.tsx` · AC-1, AC-2, AC-3.
- «id có thật: openclaw giả nhận đúng một lệnh logout» — cùng tệp test · AC-4.
- «phép thử tĩnh: mọi lời gọi logout đứng sau bước kiểm id» — thước quét tĩnh trong cùng tệp test · AC-5.
- Điều kiện để mọi phép đo trên an toàn (openclaw giả, không `~/.openclaw`) — rào trong `before()` · AC-6.

## Out of scope

- Route đăng nhập `POST /api/v1/ops/zalo/login` nhận `accountId` tuỳ ý rồi spawn `openclaw channels login` (cùng loại lỗ,
  khác hàng — ghi làm ý cho mốc khép).
- Route nhóm `POST /api/v1/ops/zalo/groups` và giao diện `/ops/sources` (UI không đổi; lỗi 400 hiện qua toast có sẵn).
- Nhánh đăng nhập phiên (cookie) của route — phép đo đi nhánh bearer ops; auth không đổi.

## Notes

- Phép đo không bao giờ gọi `openclaw` thật, không đọc/ghi `~/.openclaw`, không gọi route trên dev server đang chạy.
- `DATABASE_URL` của test trỏ cổng đóng: dòng `ops_audit` của ca thành công không được ghi vào DB local dùng chung (và không
  được đo).
- Known limits — chọn ở Cổng Bằng chứng 2026-10-24:
  - Ngoài-3: phép kiểm bản sao lưu khi gỡ tài khoản chỉ đòi có tệp sao lưu trong thư mục, nên nếu sau này bước sao lưu bị gỡ thì phép kiểm này không báo.
  - Ngoài-4: thước quét tĩnh chỉ nhận ra bước kiểm id bằng chữ, nên một dòng kiểm bị biến thành chú thích vẫn qua thước; các ca chạy thật vẫn bắt id rỗng và id lạ.
