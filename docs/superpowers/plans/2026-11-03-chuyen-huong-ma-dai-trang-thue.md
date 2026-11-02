# Kế hoạch: ô rent trong ma trận chuyển hướng mã dài

Mọi task sửa cùng một tệp nên làm tuần tự, `independent: false`.

## Task 1: ô rent trong itest
- Files: `app/tests/chuyen-huong-ma-thi-truong.itest.tsx`
- Verify: `node scripts/chuyen-huong-ma-thi-truong/acceptance.mjs app`
- Phục vụ: E1, E2, E3, E4, E5
- independent: false

## Task 2: bộ kiểm đòi đủ dòng nhóm ô
- Files: `scripts/chuyen-huong-ma-thi-truong/acceptance.mjs`
- Verify: đổi tạm một dòng log trong itest, lệnh trên phải đỏ `có ô: <nhóm>`
- Phục vụ: E5
- independent: false

## Task 3: phá thử vật thật
- Files: `rent/page.tsx` sửa tạm rồi hoàn lại
- Verify: `segment: "sale"` làm lệnh trên đỏ «chuyển sai đích»
- Phục vụ: E5
- independent: false
