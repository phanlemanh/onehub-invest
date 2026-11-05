---
schema_version: 1
feature: MCP ReUI của kho gửi kèm key giấy phép (đọc từ biến môi trường) và kiểu giao diện của app, để phiên Claude dùng được gói Pro mà không phải đăng nhập
slug: reui-mcp-key
owner: phanlemanh@gmail.com
risk_tier: T1      # một tệp cấu hình công cụ dev; không đổi dữ liệu, quyền, luồng hay mã chạy
surfaces: [config]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: reui-mcp-key

## Context

Mạnh hỏi «Kiểm tra mcp reui pro» 05/11. Key trong `REUI_LICENSE_KEY` đúng gói Pro: gọi thẳng `mcp.reui.io/api/mcp`
kèm `Authorization: Bearer <key>` thì `get_project_context` trả `plan: pro` và tìm khối có kết quả Pro. Nhưng `.mcp.json`
chỉ khai `url`, không gửi header nào → máy chủ trả 401 kèm `WWW-Authenticate` OAuth → phiên báo «cần đăng nhập».
Kiểu giao diện của app là `base-nova` (`app/components.json`), nên header `X-Reui-Style` khai đúng kiểu đó.

Hồ sơ có mặt vì PR chạm `.mcp.json` (ngoài `t1_skip_globs`).

## Criteria

- AC-1: Given `.mcp.json`, When đọc mục `reui`, Then `headers.Authorization` = `Bearer ${REUI_LICENSE_KEY:-}` (tham chiếu
  biến, không có giá trị key thật trong kho) và `headers.X-Reui-Style` = `style` trong `app/components.json`.
- AC-2: Given biến `REUI_LICENSE_KEY` có giá trị, When gọi `initialize` rồi `tools/call get_project_context` tới `url` của
  mục `reui` với đúng các header ấy, Then trả `plan: pro`.
- AC-3: Given không có header `Authorization`, When gọi `initialize`, Then HTTP 401 (chiều đỏ: đúng trạng thái trước bản sửa).

Kiểm: `python3 -m json.tool .mcp.json` và lệnh `curl` của AC-2/AC-3 (ghi trong mô tả PR).

## Out of scope

- OOS-1: Mục `reui` phạm vi user ở `~/.claude.json` (ngoài kho) cũng thiếu key — người sửa trên máy.
- OOS-2: Duyệt máy chủ MCP của kho (`enabledMcpjsonServers`) — người bấm khi phiên mới hỏi; không sửa `.claude/settings.json`
  (thuộc `t3_paths`).
