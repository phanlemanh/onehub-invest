# Thiết kế — go-tai-khoan-kiem-cfg-truoc-logout

Căn cứ: Cổng Bằng chứng `nhom-moi-requiremention` (ON24) 25/10 — Mạnh chọn «Ngoài-1: mở hợp đồng mới» (sổ dòng
`d-20261025T012441Z-7`); luật 8 (an toàn Zalo); `.claude/rules/zalo-safety.md` (phép đo chỉ chạy openclaw giả).

## Vấn đề

`deleteZaloAccount` (`app/src/lib/zalo-admin.ts`): kiểm id → `openclaw channels logout` → đọc lại cấu hình → xoá tài khoản →
`writeCfg` (cửa ghi duy nhất, `assertZaloCfgSafe` đứng đầu). Khi `openclaw.json` đang phạm bất biến bộ canh ở phần KHÔNG
liên quan tài khoản bị gỡ (vd nhóm của `default` `requireMention:false`), `writeCfg` ném sau khi phiên đã bị đăng xuất:
route trả 400, tài khoản còn trong cấu hình nhưng phiên Zalo đã mất — gỡ nửa chừng.

## Cách làm

1. Sau `requireDeletableAccount`, dựng bản cấu hình SẼ ghi (`structuredClone(cfg)` bỏ `accounts[accountId]`) và gọi
   `assertZaloCfgSafe` trên bản ấy — TRƯỚC lệnh logout. Phạm → ném đúng thông điệp của `assertZaloCfgSafe` (route trả 400),
   không lệnh openclaw nào chạy, cấu hình giữ nguyên.
2. Kiểm bản SAU khi gỡ, không kiểm bản hiện tại: tài khoản bị gỡ mà chính nó đang phạm (vd nhóm của nó `requireMention:false`)
   vẫn gỡ được — gỡ nó làm cấu hình sạch hơn; kiểm bản hiện tại thì đường duy nhất còn lại là sửa tay `openclaw.json`.
3. Giữ nguyên phần sau logout (đọc lại, xoá, `writeCfg` kiểm lần hai): CLI có thể ghi cấu hình trong lúc logout.

## Phép đo

`app/tests/go-tai-khoan-kiem-cfg.test.tsx` — khung của `go-tai-khoan-kiem-id`: HOME/PATH trỏ thư mục tạm, openclaw giả ghi
argv vào `spy.log`, cấu hình chép trong thư mục tạm, DATABASE_URL cổng đóng, không import tĩnh `zalo-admin`/route; gọi
route `DELETE` thật. Ma trận vi phạm viết trước theo các lớp của `zaloConfigViolations` (L2, L3, groupPolicy, L3b, hỏng);
chiều đỏ là bản sao `zalo-admin.ts` bỏ bước kiểm trước logout.

## Không làm

- CLI tự ghi một cấu hình phạm trong lúc logout — `writeCfg` vẫn chặn, nhưng phiên đã đăng xuất (rất hiếm; giữ như cũ).
- Đổi bước kiểm id (`go-tai-khoan-kiem-id`) hay bộ kiểm `zaloConfigViolations` (ON24).
- Giao diện `/ops/sources` (thông điệp 400 đã hiện như mọi lỗi gỡ).
