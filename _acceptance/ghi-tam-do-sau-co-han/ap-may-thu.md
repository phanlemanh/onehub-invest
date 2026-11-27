# Áp lên DB máy thu — NB10 ghi-tam-do-sau-co-han

Áp SAU KHI PR gộp, từ `main` của checkout chính `~/dev/onehub-invest`. Chữ ký Cổng Bằng chứng của Mạnh phủ đúng các bước dưới;
áp xong báo số thật cạnh số chạy thử, lệch thì dừng và báo, không tự sửa cho khớp.

## 1. Lệnh áp

```bash
cd ~/dev/onehub-invest && git pull --ff-only origin main
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 \
  < db/migrations/129_ghi_tam_lo.sql
```

Một giao dịch (`-1`). Lệnh không gọi model, không ghi cloud (bảng và cột mới không nằm trong danh sách sync).

129 vá đúng một khối trên thân `revert_enrichment` và `unit_data_level` ĐANG CHẠY (không chép thân từ tệp nào): DB máy thu chưa áp
066 (sổ GS từ 19/11), thân `revert_enrichment` ở đó là bản trước 066. Không thấy khối cần vá, hay thấy từ hai lần, thì cả giao dịch
huỷ và in tên hàm — không đổi gì.

## 2. Số chạy thử trên bản chép DB máy thu

Lệnh: `bash _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh AC-4`. Lượt chép DB máy thu sang DB thử chỉ đọc DB nguồn.
Đo trên M5 @fe6c96e69 (bản chép DB máy thu sang M5 26/11 05:45Z; mã 129 không đổi tới @19656da2e) — `evidence/m5-probe-fe6c96e69.txt`.

| Ô | Mong (đếm 26/11) | Chạy thử |
|---|---|---|
| lô `doc-toan-bo-loai-hinh` (độc lập true, hạn ngày áp + 14) | 1.993 | 1.993 |
| lô `truoc-doc-lap-loai-hinh` (độc lập false) | 187 | 187 |
| lô `truoc-doc-lap-toa` (độc lập false) | 110 | 110 |
| giá trị tự ghi trước 24/11 còn thiếu lô | 0 | 0 |
| áp lần hai: băm cột `lo_id`/`ghi_tam`, số lô | không đổi | không đổi (băm 6189ae1a…, 3 lô) |

## 3. Sao lưu trước khi áp

```bash
mkdir -p ~/onehub-backup && docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest \
  -t enrichment_proposals -Fc > ~/onehub-backup/enrichment_proposals-truoc-129-$(date +%Y%m%dT%H%M%S).dump
```

`ghi_tam_lo`, `ghi_tam_o` chưa có trước 129 nên không cần sao lưu. Hai hàm bị vá (`revert_enrichment`, `unit_data_level`) được
vá ngược trong khối lùi; muốn giữ bản thân hàm trước áp thì chép kèm:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "
  SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname IN ('revert_enrichment', 'unit_data_level')" \
  > ~/onehub-backup/ham-truoc-129-$(date +%Y%m%dT%H%M%S).sql
```

## 4. Cách lùi

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 \
  < _acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql
```

Một giao dịch: gỡ ba hàm mới (`rut_lo_ghi_tam`, `ghi_ket_qua_do_bu`, `xet_han_ghi_tam`); vá ngược `revert_enrichment` và
`unit_data_level` trên thân đang chạy (chỉ khi có dấu vá của 129, đóng khi lệch); gỡ hai cột (`lo_id`, `ghi_tam`), hai bảng
(`ghi_tam_lo`, `ghi_tam_o`). Lùi không đổi giá trị
nào trên tin (2.290 giá trị đã áp giữ nguyên, chỉ mất lô và cờ). Đã có lô bị rút thì giá trị đã rút KHÔNG tự về lại khi lùi —
áp lại bằng lệnh người là việc riêng.

Chạy thử (CHUNG điểm 13, 27/11, Mac mini — `evidence/lui-129-chay-thu.txt`): DB lượt chép từ bản mẫu = bản chép DB máy thu (chưa
áp 129) → ghi dấu trạng thái → áp 129 (ba lô 1.993 / 187 / 110) → nạp mẫu (ghi «đạt» cho một lô) → `lui-129.sql` → so dấu. Dấu gồm
md5 thân `revert_enrichment`, `unit_data_level`, `apply_enrichment`; ba hàm mới; hai bảng mới; cột của `enrichment_proposals`;
md5 dữ liệu đề xuất (id, trạng thái, giá trị, route); md5 giá trị tin (loại hình, toà).

| Dấu | Trước 129 | Sau 129 | Sau lùi |
|---|---|---|---|
| thân ba hàm | `3e344c1e…` | `e4b310b9…` | `3e344c1e…` |
| hàm mới · bảng mới | — · — | 3 hàm · `ghi_tam_lo`, `ghi_tam_o` | — · — |
| cột `enrichment_proposals` | `62ecc686…` | `997e076e…` | `62ecc686…` |
| dữ liệu đề xuất · giá trị tin | `300ecc95…` · `ca2c1c59…` | không đổi | không đổi |

Kết quả: DB về đúng trạng thái trước 129. Cùng phép so nằm ở cuối `probes/ban-chep.sh AC-4` (chạy trên bản chép đầy đủ).
Lượt cũ trên M5 @fe6c96e69 chỉ kiểm bảng và cột đã gỡ, và chạy sau bước bẫy 066 nên không so được thân hàm trước áp.

Lùi mã (lượt hằng đêm quay về chốt NB11) là revert commit gộp của PR; chỉ lùi DB mà giữ mã mới thì bộ chạy đêm lỗi vì thiếu bảng
lô — luôn lùi mã trước, DB sau.

## Thứ tự với 066

066 chưa áp lên máy thu và chờ Mạnh quyết đường gỡ E7 của hàng cũ — NB10 không kéo 066 theo. Nếu một ngày 066 được áp SAU 129, nó
thay `revert_enrichment` và làm mất bản vá của 129: lệnh rút bằng actor máy (`xet_han_ghi_tam`, lượt đêm) bị từ chối nguyên khối,
tổng kết lượt in «✗ xét hạn ghi tạm bị từ chối…», trường quá hạn vẫn dừng tự ghi. Ngay sau khi áp 066, chạy lại 129 (vá lại, lô
giữ nguyên) rồi kiểm:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 -1 \
  < db/migrations/129_ghi_tam_lo.sql
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "
  SELECT proname, prosrc ~ '129 \\(NB10' FROM pg_proc WHERE proname IN ('revert_enrichment', 'unit_data_level')"
```

Mong: cả hai dòng `t`. Đo trên bản chép (lượt `ban-chep.sh`, mục «bẫy thứ tự 066»): mất bản vá thì rút bằng actor máy bị từ chối, lô còn `dang-ghi`; chạy lại 129 thì bản vá phục hồi, ba lô giữ nguyên.

## 5. Lệnh kiểm sau khi áp

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "
  SELECT g.ma, g.doc_lap, g.han_do_bu, count(e.id)
    FROM ghi_tam_lo g LEFT JOIN enrichment_proposals e ON e.lo_id = g.ma AND e.status = 'applied'
   GROUP BY 1, 2, 3 ORDER BY 1"
node pipeline/scripts/rut-lo-ghi-tam.mjs --danh-sach
```

Mong: ba lô đúng số ở mục 2, hạn = ngày áp + 14, không ô nào dừng. Đêm kế sau khi áp (Hỏi-3: lượt đêm tự ghi lại ngay khi áp):
tổng kết của `enrich-run` có dòng `ghi tạm: <n> lô`, và mọi đề xuất `applied` route `corroborated` của lượt có `lo_id`:

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -At -c "
  SELECT count(*) FILTER (WHERE lo_id IS NULL), count(*) FROM enrichment_proposals
   WHERE status = 'applied' AND route = 'corroborated' AND applied_at >= '<ngày áp>'"
```

Mong: cột đầu bằng 0.
