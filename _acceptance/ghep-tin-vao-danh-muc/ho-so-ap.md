# Áp PL20 lên DB máy thu — năm thứ cho lời áp (ROADMAP §3 mục 50)

Chữ ký Cổng Bằng chứng của hồ sơ này kèm lời áp những gì dưới đây lên **DB máy thu** (`oneinvest` :5433): migration **117**
(trường `universal_property_id` trên tin, view `offer_building`) và **lượt gắn đầu** — phát biểu toà hoặc vùng trên từng bài S03
của Ocean Park 1 và Grand Park, bốn `rule_id` `ghep-toa-cot`, `ghep-toa-cot-chuan`, `ghep-toa-chu-model`, `ghep-toa-model`
(nguồn `model` đang tắt trong mã). Từ lúc đó, bước gắn tự chạy cuối mỗi lượt nạp S03 (`transform-zalo.mjs`, sau COMMIT, giao
dịch riêng, khoá `pg_try_advisory_xact_lock(hashtext('ghep-toa'))`, trần 60 giây). **Cloud:** không gì lên cloud — view và
trường chỉ ở máy thu, `field_assertions` không nằm trong danh sách đồng bộ.

**Điều kiện lúc áp.**

- PR PL20 đã gộp, checkout chính `~/dev/onehub-invest` đã kéo `main`. GS chạy lệnh và báo số thật cạnh số chạy thử.
- **113 và 118 của DA40 đã áp trước** (thứ tự 113 → 118 → 117). 117 tự dừng khi thiếu 113 (`117: cần áp 113 trước`). Nếu lúc
  áp PL20 hồ sơ DA40 chưa áp hai tệp này thì áp chúng theo hồ sơ của DA40, không theo hồ sơ này.
- **Sau khi đã áp 117 và có dòng `universal_property_id`, KHÔNG áp lại 113** (cũng không áp lại khối 2, 3 của nó): CHECK của 113
  không có mã `universal_property_id` nên sẽ bị từ chối, hoặc — nếu chưa có dòng — làm bước gắn lỗi ở lượt kế. Cần áp lại 113 thì
  áp lại 117 ngay sau.
- DA46 (nối phân khu, P2) không bắt buộc trước 117: thiếu DA46 thì độ phủ thấp hơn đôi chút (phần 2), không sai. Áp DA46 sau thì
  lượt nạp kế tự gắn thêm.
- Khung: ngoài lượt nạp S03 (mỗi 15 phút, 07:00–22:00 giờ VN) cho số đếm sạch. Lỡ trùng lượt nạp cũng an toàn: khoá tư vấn chỉ cho
  một bên ghi, bên kia bỏ lượt và in một dòng `JOB WARN [ghep-toa] lượt khác đang ghi`.
- Gộp code trước khi áp 117 thì mỗi lượt nạp in một dòng `JOB WARN [ghep-toa] chưa áp migration 117, bỏ qua lượt gắn` — vô hại,
  không có cảnh báo nào bắt dòng này; nên áp trong cùng buổi gộp.

## 1. Lệnh áp

Mọi lệnh chạy ở `~/dev/onehub-invest`. `Q` đọc, `P` ghi (máy thu không có `psql` trên host):

```bash
cd ~/dev/onehub-invest
Q(){ docker exec -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -Atc "$1"; }
P(){ docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -q; }
R="'ghep-toa-cot','ghep-toa-cot-chuan','ghep-toa-chu-model','ghep-toa-model'"
```

### 1a. Kiểm điều kiện

```bash
Q "SELECT to_regclass('public.stg_s16_can_chi_tiet') IS NOT NULL, to_regclass('public.v_s16_gia_cdt') IS NOT NULL"   # phải t|t (113, 118)
Q "SELECT to_regclass('public.offer_building') IS NOT NULL"                                                            # phải f
Q "SELECT count(*) FROM field_assertions WHERE rule_id IN ($R)"                                                        # phải 0
```

### 1b. Áp 117 (hai lần — lần hai phải sạch)

```bash
P < db/migrations/117_ghep_toa_tren_tin.sql
P < db/migrations/117_ghep_toa_tren_tin.sql
Q "SELECT to_regclass('public.offer_building') IS NOT NULL,
          pg_get_constraintdef(oid) LIKE '%universal_property_id%' FROM pg_constraint
    WHERE conname = 'field_assertions_field_chk' AND conrelid = 'public.field_assertions'::regclass"                    # phải t|t
```

117 không tạo bảng, không đổi dòng: thay CHECK trục trường (tập của 113 + `universal_property_id`), thay thân hàm trigger 082 tại
chỗ, thêm một dòng `ref_lookup`, dựng view `offer_building`.

### 1c. Lượt gắn đầu

```bash
cd pipeline
node scripts/ghep-tin-danh-muc-do.mjs --chi-doc                       # số khô ngay trước khi ghi — chép vào báo cáo
node -e 'import("./lib/ghep-tin-danh-muc-ghi.mjs").then(async ({ buocGhepToa }) => {
  const pg = (await import("pg")).default; const c = new pg.Client({ connectionString: "postgres://oneinvest:oneinvest@localhost:5433/oneinvest" });
  await c.connect(); await buocGhepToa(c); await c.end(); })'
cd ..
```

Lệnh in một dòng `ghep-toa: <gắn>/<tổng> tin gắn · <n> xung đột · chèn <n> · rút 0`. Dòng `JOB WARN [ghep-toa] …` thay cho dòng ấy
nghĩa là chưa ghi gì: đọc lý do, DỪNG và báo. Chạy lại lệnh một lần nữa: phải `chèn 0 · rút 0`.

## 2. Số chạy thử

**Số trên màn đổi sau khi áp** (AC-8): ô «tin căn hộ S03 của Ocean Park 1 và Grand Park gắn được toà, phân khu, cụm» (tử số
`status = 'gan'` của view `offer_building` trên mẫu số tin căn hộ S03 hai khu) hiện **0** (view chưa có trên máy thu), sau áp lên
khoảng **4.193 / 7.992 = 52,5%** (theo lượt chạy khô 24/11 dưới đây; số thật lấy lại ở 1c).

**Chạy khô trên chính DB máy thu, 24/11 06:15Z** (chỉ đọc, `ghep-tin-danh-muc-do.mjs --chi-doc`, mã tại `49b99576d`, 6,6 giây):
**4.193 / 7.992 = 52,5%** tin căn hộ S03 hai khu gắn được (tin bán 1.613 / 2.948 = 54,7%); mức toà 2.790 · mức vùng 1.403 · xung
đột 23 (0,5% số đã gắn, trần 1%); OP1 1.360 · GP 2.833. Theo nguồn (lũy kế): A 3.462 · B +76 · C +144 · F +511 · D, G 0 (nguồn
model tắt). **Mốc so lúc áp là dòng này** (lệch quá 2 điểm phần trăm thì DỪNG và báo).

Chạy khô cũ, giữ để so — **trên chính DB máy thu** (19/11, chỉ đọc, `ghep-tin-danh-muc-do.mjs --chi-doc`, trước DA46): **3.448 / 6.757 = 51,0%**
tin căn hộ S03 của hai khu gắn được (tin bán 1.373 / 2.499 = 54,9%); mức toà 2.390, mức vùng 1.058, xung đột 15 (0,4% số đã gắn);
OP1 1.172 · GP 2.276. Theo nguồn: A 2.932 · B 62 · C 113 · F 341 · D, G 0 (nguồn model tắt). Thời gian 4,4 giây. Số trên máy thu
đổi theo lượt nạp: lúc áp lấy lại bằng lệnh khô ở 1c và so với dòng 24/11 ở trên.

**Bản chép DB máy thu, chuỗi đầy đủ 113 → 118 → 117 → lượt gắn** (`probes/do-phu.sh`, chép mới DB, tự xoá):

Lượt 19/11 (chép mới DB máy thu, trước DA46), thoát 0:

| Ô | Số |
|---|---|
| Lượt gắn | `ghep-toa: 3448/6757 tin gắn · 15 xung đột · chèn 37385 · rút 0`, không cảnh báo |
| Độ phủ (tử số view `offer_building` `gan` / tin căn hộ S03 hai khu) | **3.448 / 6.757 = 51,03%** (ngưỡng 50%) |
| Theo khu · theo mức | OP1 1.172 · GP 2.276 · toà 2.390 · vùng 1.058 |
| Theo nguồn | A 2.932 · B 62 · C 113 · F 341 |
| Trước đọc bù → sau lượt 1 → sau lượt 2 | 46,91% → 50,02% → 51,03% |
| Xung đột | 15 tin = 0,44% số đã gắn (trần 1%) |
| View so hàm gắn | 3.448 = 3.448 |
| Phép đếm độc lập (không nhập lib của hàng) | 3.451; lệch 3 = 0,09% (trần 0,5%); chỉ máy gắn 1, chỉ phép đếm gắn 4 |
| Cấy dòng của `rule_id` khác | tử số không đổi |
| Chiều đỏ: gỡ 19.661 phát biểu của một khu | thoát 1, lệch 1.175 tin |

Số trùng chạy khô trên chính DB máy thu cùng ngày (3.448 / 6.757). Số dòng chèn khi áp thật xấp xỉ **37.385**.

**Không phá lượt nạp** (`probes/khong-pha.sh`, bản chép): bước gắn lần đầu 5,2 giây (trần 60); `offer_project` không đổi; danh sách
tệp snapshot không đổi; bài thử không được gắn (chiều đỏ: cấy bài thử đã gắn thì lệnh thoát 1 và gọi tên bài).
**Chạy lại** (`probes/chay-lai.sh`): lượt hai 0 chèn, 0 rút.

**Đường lùi trên bản chép** (`probes/lui.sh`):

Lượt 19/11 (bản mẫu `oneinvest_suite_mau`, chép từ DB máy thu trong 24 giờ), thoát 0:

| Ô | Số |
|---|---|
| Lượt gắn đầu | 3.339 / 6.554 tin gắn · 14 xung đột · chèn **35.545** dòng · rút 0 |
| Sau `lui-117.sql` | 0 dòng sống của bốn `rule_id` (rút 35.545) · view `offer_building` không còn |
| Bước gắn sau lùi | đúng một dòng `JOB WARN [ghep-toa] chưa áp migration 117, bỏ qua lượt gắn`, không ghi |
| Dấu ngoài hàng (phát biểu của mọi `rule_id` khác kể cả đã rút, `offer_project`, tin S03) | trùng trước lượt gắn · 7.289 tin S03 |
| Áp lại 117 sau lùi | gắn lại đúng 35.545 dòng sống |
| Chiều đỏ: bản lùi chỉ bỏ view | thoát 1, «sau lùi còn 35545 dòng sống của bốn rule_id» |

Số dòng lớn hơn số tin vì mỗi bài gắn được một dòng và một tin S03 gộp nhiều bài.

## 3. Sao lưu trước áp

Ngay trước bước 1b, sau một lượt nạp S03 đã xong. `pg_dump` chạy trong container:

```bash
mkdir -p ~/onehub-backups/db
docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -Fc oneinvest \
  > ~/onehub-backups/db/truoc-117-pl20-$(date -u +%Y%m%dT%H%M%SZ).dump
ls -la ~/onehub-backups/db/truoc-117-pl20-*.dump        # phải khác 0 byte
Q "SELECT count(*), count(*) FILTER (WHERE retracted_at IS NULL) FROM field_assertions"   # ghi lại — đối chiếu sau lùi
```

## 4. Cách lùi

**Đường lùi có đích — CẦN lời Mạnh lúc lùi.** Chữ ký phủ việc ÁP; lùi chỉ khi Mạnh gõ lời lùi lúc đó.

```bash
P < _acceptance/ghep-tin-vao-danh-muc/lui/lui-117.sql
Q "SELECT count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)"     # phải 0
Q "SELECT to_regclass('public.offer_building') IS NOT NULL"                                  # phải f
```

`lui-117.sql` trong một giao dịch: rút mọi dòng sống của bốn `rule_id` (`retract_reason = 'lui-pl20'`; rào chỉ-thêm 045 cấm
xoá) rồi bỏ view `offer_building`. Từ lượt nạp kế, bước gắn thấy thiếu view thì chỉ in `JOB WARN [ghep-toa] chưa áp migration
117` và không ghi. Chỉ đọc qua view (P1, Ops) thì thấy view mất — đó là đích của lùi.

**Phần dư có chủ đích:** CHECK trục trường và thân trigger 082 của 117 giữ nguyên (rộng hơn 113 đúng một mã, không chặn dòng nào
113 cho phép); dòng `ref_lookup` `universal_property_id` giữ; các dòng đã rút vẫn nằm trong bảng. Không áp lại khối 2, 3 của 113:
dòng `universal_property_id` đã rút làm CHECK của 113 bị từ chối. (Dòng «Lùi» ở đầu tệp 117 còn ghi «áp lại khối 2 và 3 của
113» — viết trước khi đo đường lùi; tệp đã commit nên không sửa, hồ sơ này thắng.)

**Chỉ tắt một nguồn (giữ phần còn lại):** bỏ `rule_id` khỏi `NGUON_BAT` trong `pipeline/lib/ghep-tin-danh-muc.mjs`, gộp; lượt nạp
kế rút hết dòng của đúng nguồn đó (AC-6).

**Lối cuối — khôi phục bản sao lưu** (khi đường lùi có đích lệch):

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db pg_restore -U oneinvest -h localhost -d oneinvest --clean --if-exists \
  < ~/onehub-backups/db/truoc-117-pl20-<thời điểm>.dump
```

**Giá:** mất mọi dòng ghi vào DB máy thu sau lúc sao lưu (lượt nạp S03, S06, job đêm, thẻ đã duyệt); nạp lại được từ bản thu gốc
nhưng tốn một lượt nạp và các bước sau nó.

## 5. Lệnh kiểm sau

```bash
Q "SELECT status, muc, count(*) FROM offer_building GROUP BY 1, 2 ORDER BY 1, 2"     # gan|toa · gan|vung · xung_dot — so phần 2
Q "SELECT rule_id, field, count(*) FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R) GROUP BY 1, 2 ORDER BY 1, 2"
Q "SELECT count(*) FROM (SELECT subject_key, field FROM field_assertions WHERE retracted_at IS NULL AND rule_id IN ($R)
    GROUP BY 1, 2 HAVING count(*) > 1) x"                                             # phải 0 — mỗi bài nhiều nhất một dòng sống mỗi trường
Q "SELECT count(*) FROM offer_building b JOIN offer_project p USING (offer_id) WHERE p.status <> 'mot_du_an'"  # tin gắn mà dự án chưa một — ghi lại
```

Lượt nạp S03 kế tiếp (log `zalo-import-daily`): phải có dòng `ghep-toa: … · chèn <nhỏ> · rút <nhỏ>`, không có `JOB WARN [ghep-toa]`.
Số thật phải khớp số chạy khô ở 1c (tử số `gan` của `offer_building` lệch không quá 0,5%); lệch thì DỪNG và báo, không tự sửa cho
khớp. Báo số thật cạnh số chạy thử vào kênh của đợt.
