---
schema_version: 1
feature: "Gỡ tài khoản Zalo kiểm bản cấu hình sau khi gỡ trước lệnh đăng xuất: cấu hình phạm bất biến bộ canh thì từ chối mà không đăng xuất phiên nào"
slug: go-tai-khoan-kiem-cfg-truoc-logout
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
veto_state: mo
veto_opened_at: 2026-10-25T03:41:08Z
design_doc: docs/superpowers/specs/2026-10-25-go-tai-khoan-kiem-cfg-truoc-logout-design.md
approved_by:
approved_at:
---

# Acceptance Contract: go-tai-khoan-kiem-cfg-truoc-logout

## Context

`deleteZaloAccount` gọi `openclaw channels logout` trước, còn bước kiểm bất biến bộ canh chỉ chạy trong `writeCfg` sau đó;
cấu hình đang phạm thì gỡ dừng nửa chừng (phiên đã đăng xuất, tài khoản còn trong cấu hình). Vòng này đưa bước kiểm bản
cấu hình sau khi gỡ lên trước lệnh logout. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-26) theo lựa chọn
«Ngoài-1: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng `nhom-moi-requiremention` 25/10.

Source input: `_acceptance/go-tai-khoan-kiem-cfg-truoc-logout/opportunity.md`.

## Criteria

- AC-1: Given `openclaw.json` mà phần còn lại sau khi gỡ tài khoản `acc2` phạm một lớp bất biến (bindings có entry; kênh bot
  `channels.zalo` có mặt; `groupPolicy` khác allowlist ở tài khoản khác; một nhóm của tài khoản khác `requireMention` không
  true; một tài khoản khác không phải object), When gọi `DELETE /api/v1/ops/zalo/accounts {id: "acc2"}`, Then trả 400 với
  thông điệp mở đầu «Cấu hình Zalo không an toàn, không ghi (luật 8)», openclaw không nhận lệnh nào, cấu hình giữ nguyên
  từng byte và `acc2` còn trong cấu hình.
- AC-2: Given cấu hình sạch, When gỡ `acc2`, Then trả 200, openclaw nhận đúng một lệnh `channels logout --channel zalouser
  --account acc2`, cấu hình sau đó không còn `acc2`, phần còn lại sạch theo `zaloConfigViolations`, và có bản sao lưu.
- AC-3: Given vi phạm chỉ nằm ở chính `acc2` (một nhóm của `acc2` `requireMention:false`), When gỡ `acc2`, Then trả 200,
  logout đúng một lần và cấu hình sau đó sạch.
- AC-4: Given bản sao `zalo-admin.ts` không có bước kiểm trước logout, When chạy ca AC-1 trên bản sao ấy, Then openclaw nhận
  lệnh logout của `acc2` (đối chứng: phép đo của AC-1 biết báo đỏ khi bước kiểm vắng).
- AC-5: Given phép đo chạy, When nạp module, Then HOME, openclaw và cấu hình mà module dùng nằm dưới thư mục tạm,
  DATABASE_URL trỏ cổng đóng, tệp test không import tĩnh `zalo-admin` hay route — không ca nào chạm `~/.openclaw` thật.
- AC-6: Given các ca của `go-tai-khoan-kiem-id` và `nhom-moi-requiremention`, When chạy lại, Then vẫn xanh.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — trạng thái cấu hình: sạch · phạm ở phần còn lại (5 lớp) · phạm chỉ ở tài khoản bị gỡ → AC-1, AC-2, AC-3
- Trục B — thứ tự kiểm/đăng xuất: có bước kiểm · bản sao không bước kiểm → AC-1, AC-4
- Trục C — rào an toàn phép đo và hồi quy → AC-5, AC-6
- Later: CLI ghi cấu hình phạm trong lúc logout.
- Never: phép đo gọi openclaw thật hay ghi `~/.openclaw`.

## Đường đo

- Thước: «cấu hình phạm (phần còn lại) → 400, openclaw giả 0 lệnh, cấu hình giữ nguyên» (SỐNG của ô cơ hội) · số từ:
  ca GC-AC-1 (ma trận 5 lớp) + GC-AC-4 (đối chứng: bản sao không bước kiểm vẫn đăng xuất) · bảo đảm bởi: AC-1, AC-4
- Thước: «cấu hình sạch → logout đúng một lần rồi gỡ» · số từ: ca GC-AC-2, GC-AC-3 · bảo đảm bởi: AC-2, AC-3
- CHẾT = một dòng ma trận GC-AC-1 có spy.log từ 1 dòng trở lên ở lượt chấm cuối của vòng (timebox = vòng này, tối đa 3
  lượt chấm S4).

## Out of scope

- CLI tự ghi một cấu hình phạm trong lúc logout (`writeCfg` vẫn chặn sau khi phiên đã đăng xuất).
- Đổi bước kiểm id hay bộ kiểm `zaloConfigViolations`.
- Giao diện `/ops/sources`.

## Notes
