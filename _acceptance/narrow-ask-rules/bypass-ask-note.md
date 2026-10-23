# Hook «ask» có còn hỏi khi phiên chạy bypassPermissions?

Câu hỏi then chốt của hồ sơ: các phiên con chạy chế độ bypass. Luật `permissions.ask` trong
settings vẫn hỏi ở bypass (tài liệu nói rõ, và số đo 17 phiên khớp). Hook PreToolUse trả
`permissionDecision: "ask"` thì sao?

## Tài liệu (code.claude.com, tra 2026-10-23)

- hooks: `"ask"` «prompts the user to confirm» — không gắn điều kiện chế độ.
- permissions, mục «Extend permissions with hooks»: hook có thể «deny the tool call, force a
  prompt, or skip the prompt».
- permission-modes: danh sách «không chế độ nào tự duyệt» KHÔNG nhắc hook ask; tài liệu không
  có câu nào nói hook ask bị bỏ qua ở bypass. → Tài liệu không trả lời thẳng.

## Mã CLI đã cài (Claude Code 2.1.309, `~/.local/share/claude/versions/2.1.309`)

Đọc chuỗi trong bản build (minified), đường xử lý quyền của một lệnh gọi công cụ:

1. Vòng hook PreToolUse gặp `permissionBehavior === "ask"` thì dựng quyết định
   `{behavior: "ask", …}` và trả ra dưới dạng `hookPermissionResult`.
2. Hàm giải quyết quyền nhận kết quả đó: với hook `ask`, nó chỉ tra luật **deny/ask** trong
   settings (deny thắng, ask rule thì đi đường prompt đầy đủ); không có luật nào khớp thì gọi
   hàm hỏi người (`canUseTool`) với chính quyết định `ask` của hook làm quyết định ép
   (force decision). Nhánh này không đi qua chỗ kiểm `mode === "bypassPermissions"` —
   kiểm chế độ chỉ nằm ở đường tra luật allow/mode khi hook KHÔNG ép quyết định.
3. Log nội bộ của nhánh: «Hook returned 'ask' … requires the full permission pipeline».

Kết luận của máy: hook `ask` ép hộp hỏi kể cả ở bypass. Đây là đọc mã đã biên dịch, không phải
phép thử sống — `claude -p` trên máy này không đăng nhập được (OAuth hết hạn) và phiên đang chạy
chỉ nạp hook lúc khởi động, nên không thử trực tiếp được trong vòng này.

## Thử sống (30 giây, cho người ký)

Mở một phiên Claude Code MỚI trên nhánh này (hoặc sau merge), chế độ bypass, rồi bảo nó chạy:

```bash
D=$(mktemp -d) && git -C "$D" init -q -b main && cd "$D" && git push
```

Repo tạm đứng ở `main`, không có remote: hook phải hiện hộp hỏi kèm lý do bắt đầu bằng «Cổng
onehub:» (thư mục lấy từ `mktemp` nên lý do là «không biết thư mục git…»). Bấm Từ chối. (Lỡ cho chạy cũng vô hại — git chỉ báo
«No configured push destination».)

Nếu KHÔNG hiện hộp hỏi: hook ask bị bỏ qua ở bypass → không merge; đổi hook sang chặn (exit 2)
khi `permission_mode` là `bypassPermissions`.
