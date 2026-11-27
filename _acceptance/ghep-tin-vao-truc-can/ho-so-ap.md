# Áp PL36 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433): migration **131**
(trường `universal_property_sub_id` trên tin, view `offer_unit`, thân `offer_building` nhanh hơn với đầu ra giữ nguyên), migration
**138** (view `offer_unit` đọc căn từ phát biểu — sửa finding S4 vòng 3) và **lượt
gắn đầu** — phát biểu trục hoặc căn trên từng bài S03 đã có toà của Ocean Park 1 và Grand Park, bốn `rule_id` `ghep-can-truc`,
`ghep-can-ma`, `ghep-can-truc-tang`, `ghep-can-tang-tu-ma`. Từ lúc đó, bước gắn tự chạy cuối mỗi lượt nạp S03 ngay sau bước gắn
toà (`transform-zalo.mjs`, giao dịch riêng, khoá `pg_try_advisory_xact_lock(hashtext('ghep-can'))`, trần 60 giây). **Cloud:** không
gì lên cloud — view và trường chỉ ở máy thu.

**Điều kiện lúc áp.**

- PR PL36 đã gộp, checkout chính `~/dev/onehub-invest` đã kéo `main`. GS chạy lệnh và báo số thật cạnh số chạy thử.
- **117 đã áp** (24/11). 131 tự dừng khi thiếu 117 (`131: cần áp 117 trước`).
- **Sau khi đã áp 131, KHÔNG áp lại 113 hay 117** (CHECK của hai tệp ấy thiếu mã `universal_property_sub_id`). Cần áp lại thì áp
  lại 131 rồi 138 ngay sau (áp lại 131 đưa view `offer_unit` về thân cũ; 138 luôn đi sau 131). Test nạp lại migration cũ dùng `sqlNapLaiDayDu` (sự cố 24/11 ở hồ sơ PL20 mục 6).
- Khung: ngoài lượt nạp S03 cho số đếm sạch. Lỡ trùng lượt nạp cũng an toàn: khoá tư vấn chỉ cho một bên ghi.
- Gộp code trước khi áp 131 thì mỗi lượt nạp in một dòng `JOB WARN [ghep-can] chưa áp migration 131, bỏ qua lượt gắn` — vô hại;
  nên áp trong cùng buổi gộp.

## 1. Lệnh áp

Mọi lệnh chạy ở `~/dev/onehub-invest`. `Q` đọc, `P` ghi:

```bash
cd ~/dev/onehub-invest
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q; }
R="'ghep-can-truc','ghep-can-ma','ghep-can-truc-tang','ghep-can-tang-tu-ma'"
```

### 1a. Kiểm điều kiện

```bash
Q "SELECT to_regclass('public.offer_building') IS NOT NULL, to_regclass('public.offer_unit') IS NOT NULL"   # phải t|f
Q "SELECT count(*) FROM field_assertions WHERE rule_id IN ($R)"                                              # phải 0
```

### 1b. Áp 131 rồi 138 (hai lần — lần hai phải sạch)

```bash
P < db/migrations/131_ghep_truc_can_tren_tin.sql
P < db/migrations/138_offer_unit_can_tu_phat_bieu.sql
P < db/migrations/131_ghep_truc_can_tren_tin.sql
P < db/migrations/138_offer_unit_can_tu_phat_bieu.sql
Q "SELECT pg_get_viewdef('offer_unit'::regclass) LIKE '%can_pb%'"                                            # phải t (thân 138)
Q "SELECT to_regclass('public.offer_unit') IS NOT NULL,
          pg_get_constraintdef(oid) LIKE '%universal_property_sub_id%' FROM pg_constraint
    WHERE conname = 'field_assertions_field_chk' AND conrelid = 'public.field_assertions'::regclass"           # phải t|t
time Q "SELECT count(*) FROM offer_building"                                                                  # dưới 10 giây (trước 42–55)
```

### 1c. Lượt gắn đầu

```bash
cd pipeline
node scripts/ghep-tin-truc-can-kho.mjs                                # số khô ngay trước khi ghi — chép vào báo cáo
node -e 'import("./lib/ghep-tin-truc-can-ghi.mjs").then(async ({ buocGhepCan }) => {
  const pg = (await import("pg")).default; const c = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect(); await buocGhepCan(c); await c.end(); })'
cd ..
```

Lệnh in một dòng `ghep-can: <gắn>/<tổng> bài gắn (trục <n> · căn <n>) · chèn <n> · rút 0`. Dòng `JOB WARN [ghep-can] …` thay cho
dòng ấy nghĩa là chưa ghi gì: đọc lý do, DỪNG và báo. Chạy lại lệnh một lần nữa: phải `chèn 0 · rút 0`.

## 2. Số chạy thử

**Số trên màn:** số tin căn hộ S03 hai khu gắn tới trục hoặc căn hôm nay là **0**. Chạy khô chỉ đọc trên DB máy thu 24/11
(`ghep-tin-truc-can-kho.mjs`, mã nhánh PL36):

| | OP1 | GP |
|---|---|---|
| Tin mức toà (`offer_building`) | 1.179 | 1.658 |
| → trục | 442 | 5 |
| → căn | 24 | 19 |
| Xung đột | 0 | 0 |
| Bài có toà · bài gắn trục · bài gắn căn | 22.689 · 8.886 · 558 | 14.661 · 9 · 79 |

Lượt gắn đầu chèn khoảng **9.532 dòng** (một dòng mỗi bài gắn được; 0 dòng tầng suy từ mã — bài nêu đủ tầng + căn đã có tầng của
bộ đọc chữ). Lý do không gắn theo bài: `khong-ma` 27.604 · `truc-ngoai-danh-ba` 212 (toà Pavilion, Z34, U38 chưa có trục trong
danh bạ) · `ma-khong-toa` 2. Số lúc áp so với số này; lệch quá 2 điểm phần trăm ở tỉ lệ tin OP1 xuống trục + căn thì DỪNG và báo.

**Căn qua bí danh (138), đo chỉ đọc 27/11** bằng `cd pipeline && node scripts/ghep-tin-truc-can-do-bi-danh.mjs`: 42.113 bài ·
trục 9.591 · căn 903 (qua trục + tầng 903, chỉ qua bí danh **0**) · căn active chỉ có bí danh 28.261 cả DB, 10.320/72.540 ở toà
hai khu. Lượt gắn đầu sau 138 ghi dòng mức căn kèm `evidence.unit`. Lúc áp chạy lại lệnh này trước mục 1c và chép số.

## 3. Sao lưu trước áp

Ngay trước bước 1b, sau một lượt nạp S03 đã xong:

```bash
mkdir -p ~/onehub-backups/db
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc oneinvest \
  > ~/onehub-backups/db/truoc-131-pl36-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/truoc-131-pl36-*.dump        # phải khác 0 byte
Q "SELECT count(*), count(*) FILTER (WHERE retracted_at IS NULL) FROM field_assertions"   # ghi lại — đối chiếu sau lùi
```

## 4. Cách lùi

**Đường lùi có đích — CẦN lời Mạnh lúc lùi.** Chữ ký phủ việc ÁP; lùi chỉ khi Mạnh gõ lời lùi lúc đó.

```bash
P < _acceptance/ghep-tin-vao-truc-can/lui/lui-131.sql
Q "SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)"     # phải 0
Q "SELECT to_regclass('public.offer_unit') IS NOT NULL"                                      # phải f
Q "SELECT status, muc, count(*) FROM offer_building GROUP BY 1, 2 ORDER BY 1, 2"             # như trước áp
```

`lui-131.sql` trong một giao dịch: rút mọi dòng sống của bốn `rule_id` (`retract_reason = 'lui-pl36'`), bỏ view `offer_unit` (lùi luôn 138),
dựng lại thân `offer_building` của 117 (chép nguyên văn; đầu ra như nhau, chỉ chậm hơn). Từ lượt nạp kế, bước gắn thấy thiếu view
thì chỉ in `JOB WARN [ghep-can] chưa áp migration 131` và không ghi.

**Phần dư có chủ đích:** CHECK trục trường, thân trigger 082 và dòng `ref_lookup` của 131 giữ nguyên (rộng hơn 117 đúng một mã).
**Không áp lại tệp 117**: các dòng `universal_property_sub_id` đã rút vẫn nằm trong bảng, CHECK của 117 sẽ bị từ chối.

**Chỉ tắt một nguồn:** bỏ `rule_id` khỏi `NGUON_BAT` trong `pipeline/lib/ghep-tin-truc-can.mjs`, gộp; lượt nạp kế rút hết dòng
của đúng nguồn đó (AC-6).

**Lối cuối — khôi phục bản sao lưu** (khi đường lùi có đích lệch):

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d oneinvest --clean --if-exists \
  < ~/onehub-backups/db/truoc-131-pl36-<thời điểm>.dump
```

**Giá:** mất mọi dòng ghi vào DB máy thu sau lúc sao lưu; nạp lại được từ bản thu gốc.

Đường lùi chạy thử trên bản chép ở mã đã ký: ghi vào mục này trước Cổng Bằng chứng.

## 5. Lệnh kiểm sau

```bash
Q "SELECT status, muc, count(*) FROM offer_unit GROUP BY 1, 2 ORDER BY 1, 2"          # gan|toa · gan|truc · gan|can · xung_dot — so mục 2
Q "SELECT rule_id, field, count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R) GROUP BY 1, 2 ORDER BY 1, 2"
Q "SELECT count(*) FROM (SELECT subject_key, field FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)
    GROUP BY 1, 2 HAVING count(*) > 1) x"                                             # phải 0 — mỗi bài nhiều nhất một dòng sống mỗi trường
Q "SELECT count(*) FROM (SELECT offer_id FROM offer_unit GROUP BY 1 HAVING count(*) > 1) x"   # phải 0 — không tin nào hai dòng
time Q "SELECT count(*) FROM offer_unit WHERE muc <> 'toa'"                                   # dưới 15 giây
Q "SELECT pg_get_viewdef('offer_unit'::regclass) LIKE '%can_pb%'"                              # phải t — thân 138
Q "SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id LIKE 'ghep-can-%'
    AND field = 'universal_property_sub_id' AND value NOT LIKE '%:*' AND evidence ->> 'unit' IS NULL"  # phải 0 — mọi dòng mức căn có unit
```

Lượt nạp S03 kế tiếp (log `zalo-import-daily`): phải có dòng `ghep-can: … · chèn <nhỏ> · rút <nhỏ>`, không có `JOB WARN [ghep-can]`.
Báo số thật cạnh số chạy thử vào kênh của đợt; lệch thì DỪNG và báo, không tự sửa cho khớp.
