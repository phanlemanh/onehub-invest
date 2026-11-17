# Bảng phủ ca TG1 — nhóm S03 × thẻ × dự án × bài (đếm trên DB máy thu, chỉ đọc)

Đo lúc 2026-11-15 khoảng 20:05Z, câu đếm ở cuối tệp. Nhóm gom theo **khoá thật** (bỏ tiền tố `group:`, như `khoaNhomThat` của
`pipeline/lib/eval-labels.mjs`), nên ba nhóm đăng ký hai dòng (N004, N010, N005) tính một lần.

Cột: `ma` mã nhỏ nhất của nhóm · `bat` có dòng đang bật · `dong` số dòng sổ · `n_da` số dự án trên sổ · `n_tt` số thị trường ·
`n_bai` bài trong `stg_zalo_posts` · `bai_doc` bài đã qua bước đọc (silver_labels có ô `o`) · `bai_ten_da` bài đọc ra tên dự án
· `ten_da_khac` số tên dự án khác nhau · `ban` / `thue` bài đọc ra bán / thuê (`silver_labels.kind`).

```
ma|bat|dong|n_da|n_tt|n_bai|bai_doc|bai_ten_da|ten_da_khac|ban|thue
S03-N011|t|1|1|1|24178|2001|997|2|500|1049
S03-N003|t|1|1|1|23371|2341|1119|1|263|1752
S03-N028|t|1|1|1|18616|1649|1046|2|456|987
S03-N004|t|2|1|1|13468|1009|273|4|610|210
S03-N025|t|1|1|1|10937|1234|857|3|66|972
S03-N010|t|2|1|1|4773|461|164|4|290|62
S03-N015|t|1|1|1|3804|287|88|2|244|30
S03-N030|t|1|1|1|3436|444|308|2|83|301
S03-N021|t|1|1|1|2432|166|58|1|133|7
S03-N012|t|1|1|1|789|234|132|1|41|124
S03-N020|t|1|1|1|200|45|37|1|40|0
S03-N029|t|1|1|1|121|55|40|3|50|0
S03-N026|t|1|1|1|39|9|0|0|8|0
S03-N002|t|1|0|1|14850|1306|676|3|234|975
S03-N016|t|1|3|1|10869|928|321|5|674|25
S03-N007|t|1|0|0|3803|671|237|10|64|386
S03-N023|t|1|0|0|3538|287|23|2|239|28
S03-N027|t|1|0|1|2536|189|17|2|150|18
S03-N008|f|1|0|1|2291|348|210|1|67|266
S03-N005|t|2|3|1|509|137|30|6|99|1
S03-N017|t|1|3|1|291|61|10|1|27|11
S03-N009|t|1|0|1|58|7|0|0|0|6
S03-N019|t|1|0|1|25|5|2|1|5|0
S03-N014|t|1|0|0|2|1|0|0|1|0
S03-N001|t|1|0|1|1|1|0|0|1|0
S03-N013|f|1|0|0|1|||||
S03-N006|t|1|0|0||||||
(ngoài sổ)|||||9|5|2|1|2|0
(ngoài sổ)|||||3|||||
```

## Đọc bảng

| Lớp | Số nhóm | Nhóm | Đầu ra phía sau đọc |
|---|---|---|---|
| Có bài, sổ ghi đúng một dự án | 13 | N011 N003 N028 N004 N025 N010 N015 N030 N021 N012 N020 N029 N026 | luật `du-an-nhom-mot-du-an` (DV6) → `field_assertions` → `offer_project` (DV7) → ô Định vị, CG10 |
| Có bài, sổ chưa ghi dự án | 9 | N002 N007 N023 N027 N008 N009 N019 N014 N001 | chưa có gì — TG1 dựng nháp; TG2 đọc thẻ đã duyệt |
| Có bài, sổ ghi nhiều dự án | 3 | N016 N005 N017 | luật DV6 bỏ qua (nhóm lệch); thẻ giữ danh sách |
| Có bài, chưa có trong sổ | 2 | (ngoài sổ: 9 bài, 3 bài) | phải hiện ra để khai |
| Trong sổ, không bài | 2 | N013 (tắt, 1 bài), N006 | không cần thẻ |

Nhóm có bài theo khoá thật: **27** (25 trong sổ + 2 ngoài sổ); có thẻ đủ một dự án: **13**; thiếu: **14**. Con số 32/15 của
`bat_khi` đếm theo dòng sổ (trùng khoá), không theo nhóm thật — hợp đồng đếm theo khoá thật và nói rõ điều này.

Căn cứ dựng nháp: chỉ khoảng 6% bài đã qua bước đọc có ô `o` (8.529 bài). Nhóm thiếu lớn nhất có đủ căn cứ (N002: 676 bài đọc ra
tên, 3 tên; N007: 237 bài, 10 tên). Nhóm nhỏ (N009, N019, N014, N001, ngoài sổ) có dưới 10 bài đọc — nháp sẽ trống ô hoặc ít căn
cứ, thẻ phải nói rõ số bài làm căn cứ để người vận hành biết. Bán/thuê: nhiều nhóm lệch rõ (N003 263/1752 → thuê; N016 674/25 →
bán), vài nhóm cả hai.

## Câu đếm

```sql
WITH so AS (
  SELECT regexp_replace(group_key, '^(?:[^:]+:)?group:(?=.)', '') AS khoa, unit_code, enabled, status,
         cardinality(project_node_ids) AS n_da, cardinality(market_codes) AS n_tt
    FROM collection_units WHERE source_code = 'S03'),
so1 AS (SELECT khoa, min(unit_code) AS unit_code, bool_or(enabled) AS bat, count(*) AS dong, max(n_da) AS n_da, max(n_tt) AS n_tt FROM so GROUP BY khoa),
bai AS (SELECT regexp_replace(conversation_id, '^(?:[^:]+:)?group:(?=.)', '') AS khoa, count(DISTINCT post_id) AS n_bai
          FROM stg_zalo_posts WHERE conversation_id IS NOT NULL GROUP BY 1),
lb AS (
  SELECT regexp_replace(p.conversation_id, '^(?:[^:]+:)?group:(?=.)', '') AS khoa,
         count(DISTINCT p.post_id) FILTER (WHERE s.probabilities->'o'->'project'->>'v' IS NOT NULL AND s.probabilities->'o'->'project'->>'v' <> '') AS bai_ten_da,
         count(DISTINCT s.probabilities->'o'->'project'->>'v') AS ten_da_khac,
         count(DISTINCT p.post_id) FILTER (WHERE s.kind = 'sale') AS ban,
         count(DISTINCT p.post_id) FILTER (WHERE s.kind LIKE 'rent%') AS thue,
         count(DISTINCT p.post_id) AS bai_doc
    FROM stg_zalo_posts p JOIN silver_labels s ON s.source_code = 'S03' AND s.post_id = p.post_id
   GROUP BY 1)
SELECT coalesce(so1.unit_code, '(ngoài sổ)') AS ma, so1.bat, so1.dong, so1.n_da, so1.n_tt, bai.n_bai, lb.bai_doc, lb.bai_ten_da, lb.ten_da_khac, lb.ban, lb.thue
  FROM bai FULL JOIN so1 USING (khoa) LEFT JOIN lb USING (khoa)
 ORDER BY (so1.n_da = 1) DESC NULLS LAST, bai.n_bai DESC NULLS LAST;
```
