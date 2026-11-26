# E5 (chọn-nạp trên bộ nạp thật) — cách chạy hai lượt trên M5

Phiên chấm M5 chỉ đọc tệp này, không hỏi lại. Mọi lệnh chạy trên M5, DB là cụm dùng một lần của `db/db-thu.sh`
(không chạm `one-invest-db`).

## 0. Điều kiện trước

- Probe cần snapshot thật do bộ thu đuôi ghi (phép đo 24 giờ của ZC17, 231 tệp, 3,2 MB). Trên Mac mini nó nằm ở
  `~/dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h/snapshots/hcmc/`. Trên M5 phải có bản chép, rồi đặt
  `S06_DUOI_DO=<thư mục chứa snapshots/hcmc>`. Thiếu thì probe in `KHONG CO PHEP DO` và thoát 2: đó KHÔNG phải kết quả
  E5, báo GS để chép, đừng chạy với dữ liệu viết tay.
- Không có tệp nào của thư mục này được commit (luật kho: không commit snapshot).

## 1. Lượt xanh — đầu nhánh

```bash
git worktree add /tmp/zc18-xanh 9614ab0af11202e6dbef2228cc14d9f2eeb04a13
cd /tmp/zc18-xanh
S06_DUOI_DO=<…> bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
```
Kỳ vọng: thoát 0, dòng cuối `CHON-NAP OK`, có `fixture tu writer that`, không có `NAP LAI`.

## 2. Lượt đối chứng đỏ — probe mới + mã làn thu cũ 7173fc21a

Probe lấy từ đầu nhánh; CHỈ hai tệp mã của làn thu đổi về bản cũ (bộ nạp, migration giữ nguyên):
```bash
git worktree add /tmp/zc18-do 9614ab0af11202e6dbef2228cc14d9f2eeb04a13
cd /tmp/zc18-do
git checkout 7173fc21a -- scripts/thu-duoi-s06.sh pipeline/lib/thu-duoi-moc.mjs
git diff --stat HEAD   # phải đúng hai tệp trên
S06_DUOI_DO=<…> bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
```
Kỳ vọng: dòng cuối `CHON-NAP DO`, thoát khác 0. Trên mã cũ có hai lỗi: argv của `node -e` lệch một đối số (bước chọn-nạp
không nạp gì — đỏ ngay ở vòng chọn đầu, «nạp 0» thay vì nạp gói S2), và soát «chưa nạp» theo dòng stg (`NAP LAI` sau lượt
quét đủ đè). Đỏ ở dòng nào cũng được tính là đối chứng đỏ, miễn dòng cuối `CHON-NAP DO` và các ca điều khiển (`khoa go`,
mã 3/4/5) in ra trước. Lượt in `CHON-NAP OK` trên mã cũ thì probe hỏng: báo GS, không ghi xanh.

## 3. Ghi kết quả

Một tệp `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/evidence/m5-e5-9614ab0af.txt` gồm: hai lệnh đã chạy, sha mỗi
worktree (`git rev-parse HEAD` + `git diff --stat HEAD` của lượt đỏ), mã thoát, và toàn bộ stdout của mỗi lượt. Commit
`test(acceptance): ZC18 E5 trên M5 — xanh <mã> / đối chứng đỏ <mã>`, đẩy lên `feat/s06-thu-duoi-lich-va-chon-snapshot`.
Gỡ hai worktree tạm sau khi xong.

Chưa đo ở lượt này: E11 (số vùng), E12 (nghỉ sau chặn) — mã ZCode chưa có, probe chưa có ca.
