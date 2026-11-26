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

## 2. Số chạy thử trên bản chép DB máy thu

Lệnh: `bash _acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh AC-4`. Lượt chép DB máy thu sang DB thử chỉ đọc DB nguồn.

| Ô | Mong (đếm 26/11) | Chạy thử |
|---|---|---|
| lô `doc-toan-bo-loai-hinh` (độc lập true, hạn ngày áp + 14) | 1.993 | chờ lượt `ban-chep.sh` |
| lô `truoc-doc-lap-loai-hinh` (độc lập false) | 187 | chờ lượt `ban-chep.sh` |
| lô `truoc-doc-lap-toa` (độc lập false) | 110 | chờ lượt `ban-chep.sh` |
| giá trị tự ghi trước 24/11 còn thiếu lô | 0 | chờ lượt `ban-chep.sh` |
| áp lần hai: băm cột `lo_id`/`ghi_tam`, số lô | không đổi | chờ lượt `ban-chep.sh` |

## 3. Sao lưu trước khi áp

```bash
mkdir -p ~/onehub-backup && docker exec -e PGPASSWORD=oneinvest one-invest-db pg_dump -U oneinvest -h localhost -d oneinvest \
  -t enrichment_proposals -Fc > ~/onehub-backup/enrichment_proposals-truoc-129-$(date +%Y%m%dT%H%M%S).dump
```

`ghi_tam_lo`, `ghi_tam_o` chưa có trước 129 nên không cần sao lưu. Hai hàm bị thay (`revert_enrichment`, `unit_data_level`)
nằm nguyên văn trong khối lùi.

## 4. Cách lùi

```bash
docker exec -i -e PGPASSWORD=oneinvest one-invest-db psql -U oneinvest -h localhost -d oneinvest -v ON_ERROR_STOP=1 \
  < _acceptance/ghi-tam-do-sau-co-han/probes/lui-129.sql
```

Một giao dịch: gỡ ba hàm mới (`rut_lo_ghi_tam`, `ghi_ket_qua_do_bu`, `xet_han_ghi_tam`), hai cột (`lo_id`, `ghi_tam`), hai bảng
(`ghi_tam_lo`, `ghi_tam_o`); nạp lại nguyên văn `revert_enrichment` bản 066 và `unit_data_level` bản 087. Lùi không đổi giá trị
nào trên tin (2.290 giá trị đã áp giữ nguyên, chỉ mất lô và cờ). Đã có lô bị rút thì giá trị đã rút KHÔNG tự về lại khi lùi —
áp lại bằng lệnh người là việc riêng.

Chạy thử trên bản chép (cùng lượt `ban-chep.sh`): chờ lượt.

Lùi mã (lượt hằng đêm quay về chốt NB11) là revert commit gộp của PR; chỉ lùi DB mà giữ mã mới thì bộ chạy đêm lỗi vì thiếu bảng
lô — luôn lùi mã trước, DB sau.

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
