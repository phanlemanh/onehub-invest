# Kế hoạch HT28 api-markets-doi-chung-tren-db

Một task, tuần tự (independent: false).

## Task 1 — Sửa `app/tests/api-markets-khong-s02.test.tsx`
- Files: `app/tests/api-markets-khong-s02.test.tsx`
- Việc: đưa `MONG` lên phạm vi tệp; thêm `sqlCuaRoute()` (rút chuỗi backtick đầu tiên sau `pool.query(` trong route.ts) và
  `coKhoaPhuTheoTen(sql)` (chỉ xét mệnh đề ORDER BY); ca «HT28-AC-1 …» chạy SQL route và bản khoá phụ `m.name DESC` trên DB
  thử; ca «HT28-AC-2 …» ba nhánh (a) (b) (c); gỡ `theoChen`, sửa chú thích thứ tự chèn (cụm «chiều đỏ tất định nằm ở HT28-AC-2»).
- Verify: `bash ../db/db-thu.sh oneinvest_suite_ht28 --chay node --import tsx --test tests/api-markets-khong-s02.test.tsx`
  xanh 4/4; lượt phá: bỏ `, m.name` khỏi route trong bản sao → HT28-AC-2 đỏ «route mất khoá phụ rồi tên», rồi hoàn lại;
  ba lệnh `ht28_ac1`, `ht28_ac2`, `ht28_khong_theo_chen`, `ht28_route_khong_doi` thoát 0.
- Phục vụ: E1, E2, E3, E4, E5.
