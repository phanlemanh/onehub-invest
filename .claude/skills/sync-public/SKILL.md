---
name: sync-public
description: Đẩy data-api và app (đã sanitise) từ monorepo private ra 2 repo public onehub-data-api và onehub-invest-app.
disable-model-invocation: true
---

# /sync-public — chỉ chạy khi user gọi

Thao tác này **công bố ra repo public**. Trước khi chạy:

1. `git status` sạch và đang ở `main` đã cập nhật — script đẩy theo `main`.
2. Quét rò rỉ trong phần sắp public:
   ```bash
   git grep -n -I -E "0[35789][0-9]{8}|SUPABASE_SERVICE|sk-[A-Za-z0-9]{20}|password\s*=" -- data-api app ':!app/node_modules'
   ```
   Có kết quả đáng ngờ → dừng, báo user.
3. Kiểm overlay còn khớp: file nào trong `app/` chứa query thật/quản trị Zalo phải có stub
   tương ứng ở `tools/public-overlay/app/`.
4. Tóm cho user: commit sẽ đẩy, file overlay sẽ thay. Chờ user xác nhận.
5. `bash tools/sync-public.sh` (permission `ask` sẽ hỏi lần nữa). Báo link 2 repo và SHA đã đẩy.

Lưu ý: nhánh lỗi của script dùng force push subtree cho onehub-data-api.
