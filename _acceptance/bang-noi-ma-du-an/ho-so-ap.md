# Hồ sơ áp DA3 bang-noi-ma-du-an lên DB máy thu — bản phạm vi 27/11

Viết lại 28/11 theo phạm vi Mạnh duyệt 28/11 (sổ d-20261128T003900Z-45..48) và kế hoạch Gate 1.5. Bản 25/11 bỏ.

Không migration. Lượt áp chỉ ghi dữ liệu nối vào `project_links`, `project_link_rules` và `registry_aliases` (bí danh `du_an/<mã>`),
cho ba nguồn S07, S10, S16.

- S09 không áp: DA42 giữ đường nối S09, lệnh từ chối «S09 do DA42 nối».
- S08 không áp: thẻ luật DA55 giữ S08.
- `asset_nodes`, kể cả `catalog_tier`, không đổi. Mọi dòng `project_links` nguồn S08, S09 không đổi.
- Không lên cloud: hai bảng nối và `registry_aliases` không nằm trong FILL của `pipeline/sync-cloud.mjs`.

Áp sau khi PR gộp, từ `main`, theo chữ ký Cổng Bằng chứng. Lệch số thì DỪNG và báo GS, không sửa cho khớp.

## 1. Lệnh áp

Chạy ở checkout chính `~/dev/onehub-invest` đứng ở `main` có PR DA3, ngoài khung lượt nạp. Mỗi nguồn làm hai bước: dựng thẻ để in
băm, rồi áp đúng băm ấy. Mỗi lệnh `--ap` in tên và mã các luật, dạng `S07-K2#<id>, S07-K3#<id>, …`. Chép đủ danh sách này lại để
lùi.

```bash
cd ~/dev/onehub-invest/pipeline
for n in S07 S10 S16; do node noi-du-an-nguon.mjs --nguon $n --the /tmp/da3-the-$n.md; done   # so tổng ngả với mục 2 trước khi áp
node noi-du-an-nguon.mjs --ap --nguon S07 --bam <băm S07> --nguoi Mạnh
node noi-du-an-nguon.mjs --ap --nguon S10 --bam <băm S10> --nguoi Mạnh
node noi-du-an-nguon.mjs --ap --nguon S16 --bam <băm S16> --nguoi Mạnh
```

Chạy lại lệnh `--ap` lần hai thì phải in «đã áp, không đổi».

## 2. Số chạy thử

Đo 28/11 05:27Z trên DB máy thu, chỉ đọc (phiên đặt `default_transaction_read_only`), bằng mã nhánh. Thời điểm đo là sau khi DA42,
DA55 và PL36 đã áp. Số trùng đo 27/11 21:34Z (`evidence/bang-phu-s1.md` §8).

| Nguồn | K2 | K3 | T | Giữ nối sẵn | Chưa nối | Ô chưa nối: đổi phạm vi → sau nối |
|---|---|---|---|---|---|---|
| S07 | 11 | 62 | 274 | 0 | 5.727 (không khớp 5.719, không tỉnh 7, nhiều nút 1) | 6.074 → 5.727 |
| S10 | 0 | 0 | 0 | 0 | 119 (không có vị trí) | hiện riêng, không cộng |
| S16 | 1 | 2 | 1 | 5 | 11 | 20 → 11 |

Nối theo hạng nút đích (S07):

| Căn cứ | Đã xác minh | Ứng viên S06 | Ứng viên S08 |
|---|---|---|---|
| K2 | 0 | 0 | 11 |
| K3 | 1 | 47 | 14 |
| T | 11 | 198 | 65 |

Ô «Mã nguồn chưa nối» tính bằng `oSo` của màn trên `docDanhBa`:
- main hôm nay: 370;
- mã nhánh trước áp (đổi phạm vi): 6.169, gồm S06 8, S07 6.074, S08 18, S09 49, S16 20. Hai dòng riêng không cộng vào ô: S09 tập cũ
  232 và S10 119;
- sau áp: 5.813.

Lúc áp chạy lại mục 1 phần thẻ, rồi so tổng ngả với bảng trên. Lệch thì dừng.

## 3. Sao lưu trước khi áp

```bash
mkdir -p ~/onehub-backups/db
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc \
  -t project_links -t project_link_rules -t registry_aliases -t asset_nodes oneinvest \
  > ~/onehub-backups/db/da3-truoc-ap-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/da3-truoc-ap-*.dump                    # phải khác 0 byte
docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc \
  "SELECT (SELECT count(*) FROM project_links), (SELECT count(*) FROM project_link_rules), (SELECT count(*) FROM registry_aliases), (SELECT count(*) FROM asset_nodes)"   # ghi lại
```

## 4. Cách lùi

Đảo đủ đúng danh sách `rule_id` mà các lệnh `--ap` ở mục 1 in ra, gồm K2, K3, T, noi-san, trang-thai. Mỗi `rule_id` một lệnh. Lùi
không xoá dòng nào:
- bí danh nghỉ (`retired_at`);
- dòng nối về `chua_noi`, lý do `dao-luat`;
- dòng luật ghi người và giờ đảo.

```bash
node noi-du-an-nguon.mjs --dao <rule_id> --nguoi Mạnh
```

Lùi cần lời Mạnh lúc lùi. Lối cuối là khôi phục bản sao lưu mục 3; giá phải trả là mất mọi dòng ghi vào bốn bảng sau lúc sao lưu.

**Chạy thử cách lùi trên DB thử chép từ DB máy thu:** `bash _acceptance/bang-noi-ma-du-an/lui/chay-thu-lui.sh`, chạy dưới khoá s4,
TRƯỚC Cổng Bằng chứng (CHUNG.md điểm 13). Kết quả và dòng sổ «chạy thử đường lùi <giờ> — đạt» ghi vào đây khi chạy xong.

## 5. Lệnh kiểm sau

```bash
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
Q "SELECT pl.source, pl.status, r.can_cu, count(*) FROM project_links pl LEFT JOIN project_link_rules r ON r.id = pl.rule_id
    WHERE pl.source IN ('S07','S10','S16') GROUP BY 1,2,3 ORDER BY 1,2,3"     # bằng mục 2
Q "SELECT source, count(*) FROM registry_aliases WHERE kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\_an/%'
    AND source IN ('S07','S16') GROUP BY 1"                                     # mỗi dòng noi một bí danh: bằng số dòng noi ở lệnh trên (S07 347)
Q "SELECT source, status, count(*) FROM project_links WHERE source IN ('S08','S09') GROUP BY 1,2"   # bằng số sao lưu (S08 159/18, S09 172/49)
for n in S07 S10 S16; do node noi-du-an-nguon.mjs --nguon $n --the /tmp/da3-sau-$n.md; done        # thẻ sau áp: mọi dòng là giu hoặc chua_noi như đã ghi
```

Sau đó mở màn Ops máy thu `/ops/registry` và đọc ô «Mã nguồn chưa nối»: phải là 5.813. Hai dòng riêng phải hiện kèm nhãn, không cộng
vào ô: «S09 232/232 chưa có ở danh bạ S09 mới» và «S10 119/119 không có vị trí». Báo GS số thật cạnh số chạy thử.
