# Lỗi kit: eval `long_running` không chạy được ở phiên trong worktree cô lập

Ghi ngày 2026-11-03 từ lượt chấm 1 của hồ sơ này, để gửi kit. Kit 2.36.0, tệp `workflows/acceptance-verify.js`, khối `LENH-DAI`, hằng `BOC_NEN`.

## Hiện tượng

Eval khai `long_running` nhận prompt hai bước; bước khởi chạy nền bị công cụ Bash từ chối ngay lúc gửi, nên lệnh không chạy và lượt chấm ra BLOCKED. Lời từ chối:

> this command names git in a form too complex to verify that it stays inside the worktree

Không có nhật ký nào được tạo. Không khai `long_running` thì trần chờ là 30 phút, nên eval dài hơn cũng không qua: E7 của hồ sơ này chạy khoảng 74 phút.

## Nguyên nhân đã đo

Rào của phiên phản ứng với chữ `.gitignore` trong lệnh ghép. `BOC_NEN` có đoạn tự tạo `.acceptance-runs/.gitignore`. Lệnh không hề gọi git.

## Tái hiện

Chạy trong phiên Claude Code ở worktree cô lập, thay `<gốc>` bằng gốc worktree. Cùng khung lệnh, lệnh đo thay bằng `true`.

Bị từ chối (có đoạn `.gitignore`):

```text
D="<gốc>/.acceptance-runs/x/tai-hien"; mkdir -p "$D"; [ -f "<gốc>/.acceptance-runs/.gitignore" ] || printf '*\n' > "<gốc>/.acceptance-runs/.gitignore"; L="$D/a.log"; rm -f "$L" "$L.xong" "$L.qua-han"; date +%s > "$L.bat-dau.t" && mv -f "$L.bat-dau.t" "$L.bat-dau"; ( true
) > "$L" 2>&1 & P=$!; echo "$P" > "$L.pid"; wait "$P"; rc=$?; printf '\n__EXIT=%s\n' "$rc" >> "$L"; echo "$rc" > "$L.xong"; (exit $rc)
```

Chạy được (cùng lệnh, bỏ đúng đoạn `[ -f … ] || printf …`):

```text
D="<gốc>/.acceptance-runs/x/tai-hien"; mkdir -p "$D"; L="$D/b.log"; rm -f "$L" "$L.xong" "$L.qua-han"; date +%s > "$L.bat-dau.t" && mv -f "$L.bat-dau.t" "$L.bat-dau"; ( true
) > "$L" 2>&1 & P=$!; echo "$P" > "$L.pid"; wait "$P"; rc=$?; printf '\n__EXIT=%s\n' "$rc" >> "$L"; echo "$rc" > "$L.xong"; (exit $rc)
```

Đã chạy cả hai ngày 2026-11-03 và ra đúng như trên.

## Việc kèm, chưa tách nguyên nhân

Baseline của cùng lượt cũng không chạy lệnh nào, với lời từ chối khác: `this command is too complex to verify that it stays inside the worktree` (dòng `baseline-khong-do` trong `run-log.jsonl`). Chưa đo xem nó phản ứng với chữ nào.

## Hướng sửa để kit cân nhắc

Tách bước tạo tệp bỏ qua ra khỏi lệnh bọc, ví dụ một lần gọi riêng trước bước khởi chạy, hoặc để `s4-args.mjs` tạo sẵn tệp đó vì nó chạy ngoài workflow. Hồ sơ này không tự vá bản nào của kit.
