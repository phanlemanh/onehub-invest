# Áp lên máy thu — so-nguon-kho-khai-bao (migration 122)

Áp SAU khi PR gộp, theo chữ ký Cổng Bằng chứng. **Thứ tự bắt buộc: áp 122 khi checkout chính CHƯA kéo main**, rồi mới kéo. Mã mới
đọc cột của 122 và ném lỗi «source_registry chưa có cột cadence_hours — áp migration 122» khi sổ chưa có cột; 122 chỉ thêm cột và
dòng nên mã cũ vẫn chạy trên sổ đã áp. Cloud không gọi `readFreshness` (không có `source_registry`; `/ops` cloud đọc khối
`freshness` máy thu đẩy lên) — không có bước nào ở cloud, không DDL cloud.

Trong khoảng áp xong → kéo main (vài phút), mã cũ thấy S09 active mà không có hằng nhịp nên CLI in thêm «S09: nguồn active chưa
khai SLO»; S16 vẫn «chưa khai SLO» như hôm nay. Hết khi kéo main.

Tên thật S09, S17 nằm ở hai tệp cục bộ làn thu ghi: `.acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s09-mien.txt`,
`…/tam/s17-mien.txt` (git bỏ qua, quyền 600). Không chép vào hồ sơ, không in, không đưa lên kênh; dùng đúng một lần ở bước 3 và
máy đo tầng A rồi xoá ở bước 6.

## 1. Sao lưu trước (bắt buộc, trước mọi ghi)

```bash
bash _acceptance/so-nguon-kho-khai-bao/ap-may-thu/sao-luu.sh
```

→ `~/onehub-backups/db/source_registry-truoc-122-<giờ>.sql` (`pg_dump -t source_registry --data-only --column-inserts`, quyền 600).
Số mong đợi: 15 dòng.

## 2. Lệnh áp (hai lần, từ bản `origin/main`, checkout chính chưa kéo)

```bash
git -C ~/dev/onehub-invest fetch origin
git -C ~/dev/onehub-invest show origin/main:db/migrations/122_source_registry_family_cadence.sql > /tmp/122.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < /tmp/122.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 < /tmp/122.sql
```

Lần hai không đổi ô nào (ca NK-AC-1). Rồi điền tên S09, S17:

## 3. Điền tên thật S09, S17

```bash
node _acceptance/so-nguon-kho-khai-bao/ap-may-thu/tra-s09-s17.mjs --thu   # chạy khô: in số dòng sẽ đổi, luôn lùi, không ghi
node _acceptance/so-nguon-kho-khai-bao/ap-may-thu/tra-s09-s17.mjs         # ghi thật
```

Chạy khô mong đợi (đo 21/11 17:40Z trên bản chép đã áp 122, tệp thật): «CHẠY KHÔ (đã lùi, không ghi): S09 sẽ đổi 1 dòng (2 tên miền),
S17 sẽ đổi 1 dòng (6 tên miền)». Khác số này → dừng, báo giám sát. Đường tệp tên mặc định là đường tuyệt đối của thư mục đợt
(`/Users/manhphan/dev/onehub-invest/.acceptance-runs/dieu-phoi-dot0-cam-mau/tam`), nên chạy từ worktree nhánh hay checkout chính
đều đọc cùng tệp; `NK_TAM` chỉ dùng cho chạy thử với tệp giả.

Một giao dịch: `UPDATE … SET real_name, source_ids, match_whole = true WHERE code = $1 AND real_name IS NULL` cho từng mã, mỗi mã
phải đúng 1 dòng, không thì lùi cả hai. Dòng 1 của tệp → `real_name`; dòng tên miền → `source_ids`; dòng bắt đầu bằng «/» (tiền tố
đường dẫn API — từ chung 6–7 chữ, đo 21/11 trúng giả 30 chỗ trong kho) bỏ. In số dòng, số tên miền — không in giá trị.
Chạy từ worktree của nhánh (tệp chỉ có ở nhánh tới khi kéo) hoặc từ checkout chính sau bước 4 — trước bước 5.

## 4. Kéo main vào checkout chính

```bash
git -C ~/dev/onehub-invest pull --ff-only origin main
```

## 5. Lệnh kiểm sau

```bash
cd ~/dev/onehub-invest && node _acceptance/so-nguon-kho-khai-bao/probes/may-thu.mjs
node _acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs
```

`may-thu.mjs`: CLI `check-freshness --json` và `readFreshness` của app (hàm trang Thu thập đọc) trên DB máy thu, cùng mốc, so từng
hàng (lệch 0); S16 có hàng, không «chưa khai SLO»; S01 chỉ hanoi; S11 không hàng; S09 có hàng; bộ soát tầng A (`docSourceNameEntries`)
có mục cho S09, S17. Mong đợi: `MAY THU OK`. `tang-a.mjs`: quét lại trước khi xoá tệp tạm — `TANG-A OK`.

Số mong đợi theo chạy thử (`chay-thu.md`): 12 hàng, S01/hanoi tươi, S16/vn tươi (nhịp 192), **S09/vn quá hạn** — lần thu duy nhất
13/11 12:09Z, tuổi ~194 giờ > 192 lúc chạy thử; đây là số thật, không phải lỗi bước áp. S16 sẽ quá hạn từ ~26/11 (thu cuối 18/11)
tới khi làn thu đặt lịch. Lệch số chạy thử ở điều khác → dừng, báo giám sát, không tự sửa cho khớp.

## 6. Xoá tệp tên thật cục bộ

Ngay sau bước 5 (bước 5 còn cần tệp cho `tang-a.mjs`):

```bash
rm .acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s09-mien.txt .acceptance-runs/dieu-phoi-dot0-cam-mau/tam/s17-mien.txt
```

Báo giám sát đã xoá. Sau khi xoá, `tang-a.mjs` đọc tên từ sổ máy thu.

## Cách lùi

1. Lùi mã TRƯỚC: revert PR trên GitHub, `git -C ~/dev/onehub-invest pull --ff-only origin main` (mã cũ chạy được trên sổ đã áp).
2. Rồi DB: `docker exec -i … psql … -v ON_ERROR_STOP=1 < _acceptance/so-nguon-kho-khai-bao/ap-may-thu/lui-122.sql` — S11 về active
   (chỉ khi lý do đúng của 122), xoá dòng S09, S17 (khoá ngoại `collection_units` chặn nếu đã có đơn vị thu → giao dịch lùi, dừng,
   báo), trả `real_name` NOT NULL, bỏ năm cột.
3. Đối chiếu: `bash _acceptance/so-nguon-kho-khai-bao/ap-may-thu/kiem-lui.sh <tệp sao lưu bước 1>` → `LUI OK` (bảng trùng bản sao
   lưu). Lệch thì khôi phục từ bản sao lưu bằng tay, có giám sát.

## Sau áp

Bốn lời gọi `ap122NeuThieu` trong test (`ban-chep-chua-ap-122.md`) thành phép không khi 122 đã áp lên máy thu. Bản mẫu DB thử tự
dựng lại vì dấu lược đồ đổi. GS cắt hàng hạ tầng riêng để gỡ chúng; NK1 không làm việc đó.

Áp lại 122 sau khi lùi được (chạy thử: áp → lùi → `LUI OK`).
