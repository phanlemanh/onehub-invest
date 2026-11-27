# PL20 — Chấm độ đúng trên lát hai-khu-ghep-b (n1) · hai-khu-ghep-c (n2)

Tệp đầu ra máy đóng băng: `b537a022f5821c802ce84bcda33db22f761d84cdb9f61593a181c790494256a5` (n1) · `c42fa719a731ae12ccaa97bba5cdbd74a9c6f471d75b01112a119d1471ad5658` (n2). Ngưỡng: cận dưới Wilson 95% từ 0.95, mỗi nhóm 110 bài.

**Kết luận: chưa đạt.** Nguồn phải tắt: C, F.

| Nhóm | Nguồn | Đã chấm | Đúng | Sai | Cận dưới Wilson | Trạng thái |
|---|---|---:|---:|---:|---:|---|
| n1 | A, B | 110/110 | 109 | 1 | 0.9503 | dat |
| n2 | C, F | 110/110 | 108 | 2 | 0.9361 | hut |

## Theo nguồn

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | A | 108 | 107 | 99.1% |
| n1 | B | 2 | 2 | 100.0% |
| n2 | F | 89 | 87 | 97.8% |
| n2 | C | 21 | 21 | 100.0% |

## Theo mức gắn

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | toa | 94 | 94 | 100.0% |
| n1 | vung | 16 | 15 | 93.8% |
| n2 | vung | 89 | 87 | 97.8% |
| n2 | toa | 21 | 21 | 100.0% |

## Theo khu

| Nhóm | Phần | Đã chấm | Đúng | Tỉ lệ |
|---|---|---:|---:|---:|
| n1 | 1 | 39 | 39 | 100.0% |
| n1 | 16 | 71 | 70 | 98.6% |
| n2 | 1 | 14 | 14 | 100.0% |
| n2 | 16 | 96 | 94 | 97.9% |

## Bài máy sai — soát lỗ danh bạ trước khi kết luận

| Nhóm | Bài | Máy gắn | Người ghi (toà · khu) | Quy về danh bạ |
|---|---|---|---|---|
| n1 | 19440fe2b2c8fd114b49296b75cf54c2 | vung/49 | — · the sapphire 1 | không quy được |
| n2 | 00e5c7bbba8cc05376a5ef1b3991f4ee | vung/389 | — · the rainbow | vung=48 |
| n2 | 3605b344d86c8576e148fc0e05540c31 | vung/389 | — · the rainbow | vung=48 |

## Số để đối chiếu

```json
{"dat":false,"nguon_phai_tat":["C","F"],"nhom":{"n1":{"tong":110,"n":110,"dung":109,"sai":1,"chua_gan":0,"lech":[],"ds_sai":[{"ref_id":"19440fe2b2c8fd114b49296b75cf54c2","may":"vung/49","nhan":[{"building":null,"subzone":"the sapphire 1","quy":{}}]}],"theo_nguon":{"A":{"n":108,"dung":107},"B":{"n":2,"dung":2}},"theo_muc":{"toa":{"n":94,"dung":94},"vung":{"n":16,"dung":15}},"theo_khu":{"1":{"n":39,"dung":39},"16":{"n":71,"dung":70}},"wilson":0.9503,"trang":"dat"},"n2":{"tong":110,"n":110,"dung":108,"sai":2,"chua_gan":0,"lech":[],"ds_sai":[{"ref_id":"00e5c7bbba8cc05376a5ef1b3991f4ee","may":"vung/389","nhan":[{"building":null,"subzone":"the rainbow","quy":{"vung":"48"}}]},{"ref_id":"3605b344d86c8576e148fc0e05540c31","may":"vung/389","nhan":[{"building":null,"subzone":"the rainbow","quy":{"vung":"48"}}]}],"theo_nguon":{"F":{"n":89,"dung":87},"C":{"n":21,"dung":21}},"theo_muc":{"vung":{"n":89,"dung":87},"toa":{"n":21,"dung":21}},"theo_khu":{"1":{"n":14,"dung":14},"16":{"n":96,"dung":94}},"wilson":0.9361,"trang":"hut"}},"lat":"hai-khu-ghep-b (n1) · hai-khu-ghep-c (n2)","tep":"`b537a022f5821c802ce84bcda33db22f761d84cdb9f61593a181c790494256a5` (n1) · `c42fa719a731ae12ccaa97bba5cdbd74a9c6f471d75b01112a119d1471ad5658` (n2)"}
```
