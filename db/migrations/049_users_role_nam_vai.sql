-- 049_users_role_nam_vai.sql — TV1 quyen-bon-vai-mot-cho: users.role chỉ nhận năm vai (user, viewer, ops, admin, owner).
-- docs/research/ops-tu-van-hanh-nguon-saas.md §3.5 (bảng vai); bậc và quyền từng hành động ở app/src/lib/ops-access.ts.
-- Không gán vai cho ai — cấp owner/viewer cho tài khoản thật là việc của người. Đo 27/10 (chỉ đếm): local user=1, admin=2;
-- cloud admin=1 → ràng buộc qua không sửa dữ liệu. Áp Supabase prod: Mạnh chạy tay tệp này; lùi:
--   ALTER TABLE users DROP CONSTRAINT users_role_chk;
-- Idempotent: chỉ thêm khi bảng users trong search_path chưa có ràng buộc cùng tên.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_chk' AND conrelid = 'users'::regclass
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_chk CHECK (role IN ('user', 'viewer', 'ops', 'admin', 'owner'));
  END IF;
END $$;
