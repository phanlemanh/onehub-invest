# Áp DA46 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp đúng một việc lên **DB máy thu** (`oneinvest` :5433): nối bảy phân khu trùng theo thẻ
`the-noi.md`, băm `25e150a598dd6d7784d84c7aa8d13ffb26cce750e95e94de69d7dc6161199004`. Không có migration. **Cloud:** bảy nút nghỉ và bí danh mới lên
cloud ở lượt đồng bộ kế; meta chỉ mang băm khoá khu.

**Điều kiện lúc áp.** Sau khi PR gộp và checkout chính đã kéo `main`. Chạy trong khung **22:05–23:55 giờ VN** (Chủ nhật 20:30–23:55), ngoài lượt
nạp S03 15 phút, S06, job đêm và các lượt `refresh-bait-gap`. Bước khớp của thẻ luật không giữ khoá cố vấn của lượt dựng, nên không chạy chồng lượt dựng.

## 1. Lệnh áp

Mọi lệnh chạy ở `~/dev/onehub-invest`:

```bash
export DATABASE_URL=postgres://oneinvest:oneinvest@localhost:5433/oneinvest
node pipeline/phan-khu-s16.mjs --the-noi ~/onehub-backups/db/the-noi-da46-$(date -u +%Y%m%dT%H%M%SZ).md   # phải in đúng băm trên
node pipeline/phan-khu-s16.mjs --noi --bam 25e150a598dd6d7784d84c7aa8d13ffb26cce750e95e94de69d7dc6161199004 --nguoi Mạnh
```

Bước đầu in băm khác nghĩa là dữ liệu khu đã đổi: DỪNG, gửi thẻ mới cho Mạnh, lời ký cũ không còn hiệu lực. Lệnh áp in `đã nối lượt <rule_id>: 7 cặp`;
**ghi lại `rule_id`**, đường lùi và lệnh kiểm cần nó.

## 2. Số chạy thử

`node pipeline/scripts/phan-khu-s16-noi-that.mjs` trên bản chép mới của DB máy thu ngày 19/11, thoát 0:

| Ô | Số |
|---|---|
| Cặp nối | 7 (toà có S09 trên tổng toà: 6/7, 5/5, 4/4, 15/15, 11/11, 3/3, 5/5) |
| Ca không nối, chờ người xem | 6 |
| Toà đổi nút | 50, đều về đúng nút giữ lại; 0 toà khác đổi |
| Toà ở nút giữ lại sau áp | 41 = 11 · 42 = 16 · 40 = 4 · 23 = 7 · 43 = 5 · 33 = 3 · 27 = 5 |
| Toà ở bảy nút nghỉ | 0 |
| Thẻ luật phân khu dựng lại | 61 khu đã gán, 0 mới |
| Dựng lại năm dự án | 0 khoá mới, tổng nút giữ 429 |
| Đảo | dấu vân tay nút trùng trước áp, 0 toà lệch |

## 3. Sao lưu trước áp

```bash
mkdir -p ~/onehub-backups/db
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc oneinvest \
  > ~/onehub-backups/db/truoc-da46-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/truoc-da46-*.dump   # phải khác 0 byte
```

## 4. Cách lùi

Chạy khi Mạnh gõ lời lùi:

```bash
node pipeline/phan-khu-s16.mjs --dao-noi <rule_id> --nguoi Mạnh
```

Lệnh trả nút cha, meta, bí danh của 14 nút về đúng trước khi áp; dòng luật giữ lại và ghi người, giờ đảo. Lối cuối là khôi phục bản sao lưu ở phần 3,
giá là mất mọi dòng ghi vào DB máy thu sau lúc sao lưu.

## 5. Lệnh kiểm sau

```bash
node pipeline/phan-khu-s16.mjs --kiem-noi <rule_id>   # phải in «kiểm nối: đạt», thoát 0
docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc \
  "SELECT region_node_id, count(*) FROM v_toa_nut_vung WHERE region_node_id IN (23,27,33,40,41,42,43,382,388,391,392,394,395,397) GROUP BY 1 ORDER BY 1"
```

Số thật phải bằng phần 2; lệch thì DỪNG và báo, không tự sửa cho khớp. **Chạy lại `--kiem-noi` sau lượt đêm thật đầu tiên kể từ lúc áp** và báo số cạnh
số chạy thử. Xong báo P4: lát nhãn PL20 chỉ rút sau khi việc nối đã áp và bản PL20 có lọc nút nghỉ đã vào `main`.
