# Hồ sơ áp DA3 bang-noi-ma-du-an lên DB máy thu

> **Bản 25/11, CHƯA dùng được.** Phạm vi đổi 27/11 (sổ d-20261127T213940Z-36): S09 không áp, K2 vào danh sách luật, số đổi.
> Hồ sơ áp viết lại ở S3 sau khi Mạnh duyệt Cổng Phạm vi bản 27/11; chữ ký Cổng Bằng chứng chỉ phủ bản viết lại.

Không migration. Việc áp chỉ ghi dữ liệu nối vào `project_links`, `project_link_rules`, `registry_aliases` (bí danh `du_an/<mã>`)
cho bốn nguồn S07, S09, S10, S16. `asset_nodes` không đổi. Không lên cloud: hai bảng nối và `registry_aliases` không nằm trong FILL
của `pipeline/sync-cloud.mjs`.

Áp sau khi PR gộp, từ `main`, theo chữ ký Cổng Bằng chứng; DA3 gộp sau DA55 (tệp `doc.ts`, `registry-view.tsx`).

## 1. Lệnh áp

Chạy ở checkout chính sau `git pull --ff-only origin main`. Mỗi nguồn hai bước: dựng thẻ (in băm), rồi áp đúng băm ấy.

```bash
cd ~/dev/onehub-invest/pipeline
for n in S07 S09 S10 S16; do node noi-du-an-nguon.mjs --nguon $n --the /tmp/da3-the-$n.md; done
node noi-du-an-nguon.mjs --ap --nguon S07 --bam <băm S07> --nguoi Mạnh
node noi-du-an-nguon.mjs --ap --nguon S09 --bam <băm S09> --nguoi Mạnh
node noi-du-an-nguon.mjs --ap --nguon S10 --bam <băm S10> --nguoi Mạnh
node noi-du-an-nguon.mjs --ap --nguon S16 --bam <băm S16> --nguoi Mạnh
```

Mỗi lệnh `--ap` in `rule_id` của từng luật; ghi lại để lùi.

Trước khi áp, so tổng theo ngả của bốn thẻ với số chạy thử ở mục 2. Lệch thì dừng và báo, không áp. Nguyên nhân hay gặp: DA55 đã
đúc nút S08, nên ngả T của S07 có thể trúng thêm nút.

## 2. Số chạy thử (bản chép DB máy thu 25/11, `evidence/dau-cuoi.md`)

| Nguồn | K3 | T | Giữ nối sẵn | Chưa nối | Ô chưa nối: đổi phạm vi → sau nối |
|---|---|---|---|---|---|
| S07 | 48 | 209 | 0 | 5.817 (không khớp 5.809, không tỉnh 7, nhiều nút 1) | 6.074 → 5.817 |
| S09 | 6 | 1 | 2 (trong 7 nối) | 337 | 344 → 337 |
| S10 | 0 | 0 | 0 | 119 (không có vị trí) | hiện riêng, không cộng |
| S16 | 4 | 1 | 5 (cả 5 đã chép cứng) | 15 | 20 → 15 |

Ô trên màn: 529 (phạm vi cũ) → 6.623 (đổi phạm vi) → 6.354 (sau nối).

## 3. Sao lưu trước khi áp

```bash
docker exec one-invest-db pg_dump -U oneinvest -d oneinvest -Fc \
  -t project_links -t project_link_rules -t registry_aliases -t asset_nodes > ~/onehub-sao-luu/da3-truoc-ap-$(date -u +%Y%m%dT%H%M%SZ).dump
```

Kiểm tệp không rỗng: `ls -l` thấy kích thước khác 0, và `pg_restore -l <tệp> | grep -c TABLE` ra 4.

## 4. Cách lùi

Đảo đủ mọi luật của lượt (in ở mục 1), mỗi `rule_id` một lệnh. Không xoá dòng nào: bí danh nghỉ (`retired_at`), dòng về `chua_noi`
lý do `dao-luat`, dòng luật ghi người và giờ đảo.

```bash
node noi-du-an-nguon.mjs --dao <rule_id> --nguoi Mạnh
```

Đã chạy thử trên bản chép:
- E5 (`probes/ap.sh`): đảo T trước, rồi đảo hết. S07 còn 0 dòng nối, số dòng không giảm, bí danh còn hiệu lực bằng trước áp.
- E9 (`probes/dau-cuoi.sh`): sau khi đảo đủ luật của bốn nguồn, ô về 6.623 (cột đổi phạm vi). S07 6.074, S09 344, S16 20.

Bản sao lưu ở mục 3 chỉ dùng khi đảo không đủ, và khôi phục nó cần lời riêng của Mạnh.

## 5. Lệnh kiểm sau khi áp

```bash
docker exec -e PGOPTIONS='-c default_transaction_read_only=on' one-invest-db psql -U oneinvest -d oneinvest -c "
  SELECT pl.source, pl.status, r.can_cu, count(*) FROM project_links pl LEFT JOIN project_link_rules r ON r.id = pl.rule_id
   WHERE pl.source IN ('S07','S09','S10','S16') GROUP BY 1,2,3 ORDER BY 1,2,3;
  SELECT source, count(*) FROM registry_aliases WHERE kind = 'ma_nguon' AND retired_at IS NULL AND value LIKE 'du\_an/%'
   AND source IN ('S07','S09','S16') GROUP BY 1 ORDER BY 1;"
cd ~/dev/onehub-invest/pipeline
for n in S07 S09 S10 S16; do node noi-du-an-nguon.mjs --nguon $n --the /tmp/da3-sau-$n.md; done
```

Kỳ vọng:
- Số dòng theo nguồn × trạng thái × luật bằng mục 2.
- Số bí danh bằng số dòng nối: S07 257, S09 7, S16 5.
- Bốn thẻ dựng lại cho cùng tổng theo ngả.
- Gọi lại `--ap` với băm mới in «đã áp, không đổi».
- Ô «Mã nguồn chưa nối» trên `/ops/registry` của máy thu ghi 6.354, cộng phần S08 đổi do DA55 nếu DA55 áp trước.

Áp xong báo số thật cạnh số chạy thử. Lệch thì dừng và báo, không tự sửa cho khớp.
