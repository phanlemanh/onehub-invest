# Bảng phủ ca — che-ten-nguon-khong-lay-tu-dau (S1, 17/11/2026)

Đếm trên DB máy thu (localhost:5433, chỉ đọc) bằng `discovery/phu-ca.mjs` và `discovery/tu-dau.mjs`. Chỉ in mã S0x, loại
biến thể, độ dài, số dòng trúng — không in tên. Khớp ở đây là regex không phân biệt dấu (`~*`), KHÔNG có luật biên từ của
lõi, nên số với biến thể < 4 ký tự là cận trên.

Cột «ai đọc phía sau»: biến thể của một token đi vào (1) bộ che `maskSourceNames` (Ops: dòng log, /ops/registry, người bán…)
và (2) bộ soát `guardValues` của sync-cloud và push-ops-facts (trúng là DỪNG lượt đẩy).

## Mỗi dòng sổ × biến thể × chỗ trúng

```
mã | token | loại | dài | asset_nodes theo node_type | registry_aliases | bảng cloud trúng (bảng:số dòng)
S01 | ten | du | 6 | 0 | 1 | areas:1,listings:4,sale_offers:1
S01 | id0 | du | 16 | 0 | 0 | areas:1
S01 | id0 | lien | 15 | 0 | 0 | 0
S01 | id0 | tu-dau | 6 | 0 | 1 | areas:1,listings:4,sale_offers:1
S01 | id1 | du | 14 | 0 | 0 | 0
S01 | id1 | lien | 13 | 0 | 0 | 0
S01 | id1 | tu-dau | 6 | 0 | 1 | areas:1,listings:4,sale_offers:1
S02 | ten | du | 6 | 0 | 0 | area_sources:3,dq_check_results:75
S02 | id0 | du | 15 | 0 | 0 | 0
S02 | id0 | lien | 14 | 0 | 0 | 0
S02 | id0 | tu-dau | 6 | 0 | 0 | area_sources:3,dq_check_results:75
S03 | ten | du | 4 | 0 | 0 | sale_offers:97
S03 | id0 | du | 9 | 0 | 0 | 0
S03 | id0 | lien | 8 | 0 | 0 | 0
S03 | id0 | tu-dau | 4 | 0 | 0 | sale_offers:97
S03 | id1 | du | 11 | 0 | 0 | 0
S03 | id1 | lien | 10 | 0 | 0 | 0
S03 | id1 | tu-dau | 4 | 0 | 0 | sale_offers:97
S03 | id2 | du | 10 | 0 | 0 | 0
S03 | id2 | lien | 9 | 0 | 0 | 0
S03 | id2 | tu-dau | 4 | 0 | 0 | sale_offers:97
S03 | id3 | du | 9 | 0 | 0 | 0
S03 | id3 | lien | 7 | 0 | 0 | 0
S04 | ten | du | 3 | project:1 | 0 | areas:500,sale_offers:25,asset_nodes:1,properties:18
S04 | id0 | du | 14 | 0 | 0 | 0
S04 | id0 | lien | 13 | 0 | 0 | 0
S05 | ten | du | 15 | 0 | 0 | 0
S05 | ten | lien | 14 | 0 | 0 | 0
S05 | ten | tu-dau | 8 | 0 | 0 | 0
S05 | id0 | du | 14 | 0 | 0 | 0
S05 | id0 | lien | 13 | 0 | 0 | 0
S05 | id0 | tu-dau | 5 | 0 | 0 | 0
S06 | ten | du | 7 | 0 | 0 | 0
S06 | ten | lien | 6 | 0 | 0 | 0
S06 | id0 | du | 10 | 0 | 0 | 0
S06 | id0 | lien | 9 | 0 | 0 | 0
S06 | id0 | tu-dau | 6 | 0 | 0 | 0
S07 | ten | du | 17 | 0 | 0 | 0
S07 | ten | lien | 15 | 0 | 0 | 0
S07 | ten | tu-dau | 10 | 0 | 0 | 0
S07 | id0 | du | 12 | 0 | 0 | 0
S07 | id0 | lien | 10 | 0 | 0 | 0
S08 | ten | du | 11 | 0 | 0 | 0
S08 | ten | lien | 10 | 0 | 0 | 0
S08 | ten | tu-dau | 7 | 0 | 0 | 0
S08 | id0 | du | 12 | 0 | 0 | 0
S08 | id0 | lien | 10 | 0 | 0 | 0
S10 | ten | du | 14 | 0 | 0 | 0
S10 | ten | lien | 13 | 0 | 0 | 0
S10 | ten | tu-dau | 11 | 0 | 0 | 0
S10 | id0 | du | 13 | 0 | 0 | 0
S10 | id0 | lien | 11 | 0 | 0 | 0
S11 | ten | du | 22 | 0 | 0 | 0
S11 | ten | lien | 19 | 0 | 0 | 0
S11 | ten | tu-dau | 11 | 0 | 0 | 0
S11 | id0 | du | 13 | 0 | 0 | 0
S11 | id0 | lien | 10 | 0 | 0 | 0
S12 | ten | du | 22 | 0 | 0 | 0
S12 | ten | lien | 19 | 0 | 0 | 0
S12 | ten | tu-dau | 9 | 0 | 0 | 0
S13 | ten | du | 30 | 0 | 0 | 0
S13 | ten | lien | 27 | 0 | 0 | 0
S13 | ten | tu-dau | 9 | 0 | 0 | 0
S14 | ten | du | 24 | 0 | 0 | 0
S14 | ten | lien | 21 | 0 | 0 | 0
S14 | ten | tu-dau | 9 | 0 | 0 | 0
S15 | ten | du | 22 | 0 | 0 | 0
S15 | ten | lien | 20 | 0 | 0 | 0
S15 | ten | tu-dau | 15 | 0 | 0 | 0
S16 | ten | du | 14 | 0 | 0 | 0
S16 | id0 | du | 19 | 0 | 0 | 0
S16 | id0 | lien | 17 | 0 | 0 | 0
```

## Biến thể từ-đầu: thừa hay riêng

```
S01 token1 từ-đầu dài 6: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S01 token2 từ-đầu dài 6: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S02 token1 từ-đầu dài 6: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S03 token1 từ-đầu dài 4: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S03 token2 từ-đầu dài 4: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S03 token3 từ-đầu dài 4: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S05 token0 từ-đầu dài 8: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S05 token1 từ-đầu dài 5: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S06 token1 từ-đầu dài 6: trùng tên đủ của chính nguồn=true · tên danh bạ chứa từ đứng riêng=0
S07 token0 từ-đầu dài 10: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S08 token0 từ-đầu dài 7: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S10 token0 từ-đầu dài 11: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S11 token0 từ-đầu dài 11: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S12 token0 từ-đầu dài 9: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S13 token0 từ-đầu dài 9: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S14 token0 từ-đầu dài 9: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
S15 token0 từ-đầu dài 15: trùng tên đủ của chính nguồn=false · tên danh bạ chứa từ đứng riêng=0
```

Đọc: biến thể từ-đầu hiện nay hoặc thừa (trùng tên đủ/viết liền của token khác cùng nguồn — S01, S02, S03, S06), hoặc là chữ
riêng chưa trúng chỗ nào (S05, S07, S08, S10–S15). Dòng S16 hiện là bản chữa tạm (tên viết liền, chỉ slug) nên không sinh
từ-đầu; ô S16 ở dạng sẽ trả về (tên hai từ + tên miền) đếm sau khi GS cấp giá trị cục bộ (U1-1711-10).

## Ô S16 ở dạng sẽ trả về (GS cấp cục bộ 18/11, tệp đã xoá sau khi đếm)

Tên 15 ký tự, hai từ; hai định danh (tên miền). `S16*` = dòng giả định, chưa có trong sổ.

```
S16* | ten | du | 15 | 0 | 0 | 0
S16* | ten | lien | 14 | 0 | 0 | 0
S16* | ten | tu-dau | 8 | project:8 | 114760 | listings:32,area_breakdowns:20,sale_offers:1010,sellers:91,asset_nodes:42,properties:125
S16* | id0 | du | 18 | 0 | 0 | 0
S16* | id0 | lien | 16 | 0 | 0 | 0
S16* | id0 | tu-dau | 6 | 0 | 0 | areas:3355,listings:12,area_breakdowns:2,sale_offers:1,area_sources:3,dq_check_results:47
S16* | id1 | du | 19 | 0 | 0 | 0
S16* | id1 | lien | 17 | 0 | 0 | 0
```

Đọc: chỉ biến thể từ-đầu gây hại — từ đầu của tên (8 ký tự, thương hiệu chủ đầu tư) trúng 8 nút dự án, 114.760 bí danh danh
bạ và ≈ 1.320 dòng bảng đi cloud; từ đầu của tên miền thứ nhất (6 ký tự, từ chung) trúng 3.355 dòng `areas`. Biến thể đủ và
viết liền của cả ba token trúng 0 chỗ.

## Tổng hợp cho quyết định

| Nhóm nguồn | Biến thể từ-đầu | Chỗ trúng hôm nay |
|---|---|---|
| S01, S02, S03, S06 | trùng tên đủ/viết liền của chính nguồn (thừa) | như tên đủ |
| S05, S07, S08, S10–S15 | chữ riêng | 0 danh bạ, 0 bảng cloud |
| S16 (dạng trả về) | thương hiệu dự án + từ chung | 8 nút dự án, 114.760 bí danh, ≈ 4.700 dòng bảng cloud |

## Log job: chỗ CHỈ biến thể từ-đầu che được (`discovery/log-tu-dau.mjs`, 22 tệp `pipeline/logs/*.log`, 3 MB cuối mỗi tệp)

S05 định danh thứ nhất (từ đầu 5 ký tự): 89 dòng chứa, 60 dòng CHỈ từ đầu che được. S05 tên: 29 dòng chứa, 0 dòng chỉ từ đầu che
được. S07, S08, S10–S15: 0 dòng. `ops_heartbeat`: 0. → bỏ hẳn biến thể từ đầu (lối A) hở 60 dòng S05; cần khai theo dòng.
