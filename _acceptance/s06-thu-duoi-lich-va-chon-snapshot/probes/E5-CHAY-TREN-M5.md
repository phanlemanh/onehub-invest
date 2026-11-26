# E5 (chọn-nạp trên bộ nạp thật) — cách chạy hai lượt trên M5

Phiên chấm M5 chỉ đọc tệp này, không hỏi lại. Mọi lệnh chạy trên M5, DB là cụm dùng một lần của `db/db-thu.sh`
(không chạm `one-invest-db`).

## 0. Điều kiện trước

- Probe cần snapshot thật do bộ thu đuôi ghi (phép đo 24 giờ của ZC17, 231 tệp, 3,2 MB). Trên Mac mini nó nằm ở
  `~/dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h/snapshots/hcmc/`. Trên M5 phải có bản chép, rồi đặt
  `S06_DUOI_DO=<thư mục chứa snapshots/hcmc>`. Thiếu thì probe in `KHONG CO PHEP DO` và thoát 2: đó KHÔNG phải kết quả
  E5, báo GS để chép, đừng chạy với dữ liệu viết tay.
- Không có tệp nào của thư mục này được commit (luật kho: không commit snapshot).

## Lượt 1 trên M5 (26/11 17:41Z) hỏng vì probe, đã sửa

Kết quả ở `evidence/m5-e5-9614ab0af.txt`: cả hai lượt chết vì lỗi của probe, không phải của mã đo. (1) Probe đè `snapshot_id` trong
stg trước khi ghi sổ nạp cho snapshot lượt quét đủ → vi phạm khoá ngoại. (2) Bản chép snapshot giữ quyền chỉ-đọc → ghi tệp hỏng cho
ca nạp lỗi bị từ chối. U2 sửa cả hai, và probe nay in `PROBE HONG: …` rồi thoát 2 khi tự hỏng (khác `CHON-NAP DO`). Chạy lại
CẢ HAI lượt ở đầu nhánh mới (thay `9614ab0af` bằng sha đầu nhánh lúc chạy; mã làn thu không đổi). Lượt đối chứng có thể in
thêm `DOI CHUNG HONG` ở vòng 5 vì mã cũ không nạp gì: vẫn tính là đỏ.

## 1. Lượt xanh — đầu nhánh

```bash
git worktree add /tmp/zc18-xanh <sha40 đầu nhánh lúc chạy>
cd /tmp/zc18-xanh
S06_DUOI_DO=<…> bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
```
Kỳ vọng: thoát 0, dòng cuối `CHON-NAP OK`, có `fixture tu writer that`, không có `NAP LAI`.

## 2. Lượt đối chứng đỏ — probe mới + mã làn thu cũ 7173fc21a

Probe lấy từ đầu nhánh; CHỈ hai tệp mã của làn thu đổi về bản cũ (bộ nạp, migration giữ nguyên):
```bash
git worktree add /tmp/zc18-do <sha40 đầu nhánh lúc chạy>
cd /tmp/zc18-do
git checkout 7173fc21a -- scripts/thu-duoi-s06.sh pipeline/lib/thu-duoi-moc.mjs   # đối chứng AC-5; E11/E12 cũng đỏ ở đây
git diff --stat HEAD   # phải đúng hai tệp trên
S06_DUOI_DO=<…> bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs
```
Kỳ vọng: dòng cuối `CHON-NAP DO`, thoát khác 0. Trên mã cũ có hai lỗi: argv của `node -e` lệch một đối số (bước chọn-nạp
không nạp gì — đỏ ngay ở vòng chọn đầu, «nạp 0» thay vì nạp gói S2), và soát «chưa nạp» theo dòng stg (`NAP LAI` sau lượt
quét đủ đè). Đỏ ở dòng nào cũng được tính là đối chứng đỏ, miễn dòng cuối `CHON-NAP DO` và các ca điều khiển (`khoa go`,
mã 3/4/5) in ra trước. Lượt in `CHON-NAP OK` trên mã cũ thì probe hỏng: báo GS, không ghi xanh. Dòng `PROBE HONG` ở bất kỳ lượt nào: không phải kết quả E5, báo GS.

## 3. Ghi kết quả

Một tệp `_acceptance/s06-thu-duoi-lich-va-chon-snapshot/evidence/m5-e5-<sha ngắn đầu nhánh>.txt` (lượt 1 ở tệp `m5-e5-9614ab0af.txt`, giữ nguyên) gồm: hai lệnh đã chạy, sha mỗi
worktree (`git rev-parse HEAD` + `git diff --stat HEAD` của lượt đỏ), mã thoát, và toàn bộ stdout của mỗi lượt. Commit
`test(acceptance): ZC18 E5 trên M5 — xanh <mã> / đối chứng đỏ <mã>`, đẩy lên `feat/s06-thu-duoi-lich-va-chon-snapshot`.
Gỡ hai worktree tạm sau khi xong.

Chưa đo ở lượt này: E11 (số vùng), E12 (nghỉ sau chặn) — mã ZCode chưa có, probe chưa có ca.

## Lượt 27/11 (sau fc3fa4a7a)

Probe có thêm ca E11 (phạm vi vùng) và E12 (nghỉ sau chặn). Kỳ vọng ở lượt xanh: thêm bảy dòng `vung mac dinh: …`,
`vung ngoai danh sach: …`, `vung cau hinh hai vung: …`, `chan: …`, `chan giua chung: …`, `con han: …`, `het han: …`.
Lượt đối chứng trên 7173fc21a: các dòng E11/E12 đỏ cùng các ca AC-5. U2 đã chạy thử trên Mac mini với bản chép chỉ-đọc
(xanh trên đầu nhánh, đỏ 5 ca trên wrapper 7fe8bb5b0) trước khi giao.
