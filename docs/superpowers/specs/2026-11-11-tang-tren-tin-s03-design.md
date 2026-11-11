# Tầng trên tin S03 (DV4)

Hàng `tang-tren-tin-s03` (DV4, nhóm định vị S03, đợt `dinh-vi-gom-tin-s03-1011`), migration 095 do giám sát cấp. Hạng máy suy T3 vì chạm
`db/migrations/**` (lộ trình ghi T2). Căn cứ: đo 09/11 (`onehub-invest-tri-thuc:raw/2026-11-10-dinh-vi-gom-tin-s03-1011/s03-dinh-vi-phan-tich-20261109.md` §2: 702/4.801 tin căn hộ
S03 ghi tầng, phần lớn là dải; `floor_raw` của S03 bằng 0), audit 02/11 §10 (`docs/research/s03-audit-trich-xuat-0211.md`), và phần tầng đã làm dở của SV2
(nhánh `claude/s03-luu-tang-huong`, tạm dừng 02/11 giữa S3).

## Ranh giới với SV2

SV2 `s03-luu-tang-huong` (Mạnh duyệt Cổng Phạm vi 02/11, đóng băng 05/11) gồm tầng và hướng. DV4 nhận trọn phần tầng; SV2 khi nối lại chỉ còn hướng
(`unit_facing`, hai trục từ vựng hướng, dòng DQ hướng). Hai hàng cùng nới một CHECK và cùng sửa bộ đọc trong `pipeline/transform-zalo.mjs`, nên phần chung
chỉ được làm một lần. Bộ đọc tầng lấy lại từ nhánh SV2 (đã có ma trận đáp án), dựng lại trên main hiện tại. Giám sát sửa lời hàng SV2.

## Hai trường, kiểm RESO DD 2.1

Tra bản DD 2.1 local (`research-local/reso/dd-2.1.json`, ngày 11/11):

| Field DD 2.1 | Kiểu | Nghĩa | Dùng cho |
|---|---|---|---|
| `UnitFloorLocation` (Property) | chuỗi, tối đa 3 ký tự, không danh sách giá trị | tầng nơi căn rao bán/cho thuê nằm | số tầng |
| `EntryLevel` (Property) | số thập phân | tầng của lối vào chính | không dùng: tin nói tầng của căn, không nói lối vào |
| `StoriesTotal`, `Stories` | số | tổng số tầng của toà / của nhà | không dùng ở đây: «nhà 5 tầng» là `stories` (061) |

| Trường | Cột `sale_offer_records` | Giá trị | RESO |
|---|---|---|---|
| Tầng | `floor_raw` (có từ 030) | số tầng `1`–`999`, chữ số không đệm (`12`) | `UnitFloorLocation` |
| Dải tầng | không có cột | `low` · `mid` · `high` | không có field chuẩn → extension, đủ 6 điều kiện ADR-0011 |

**Dải tầng tách khỏi `floor_raw` (câu hỏi Hỏi-1 ở thẻ).** SV2 (02/11) lưu «tầng cao» thẳng vào `floor_raw`. `UnitFloorLocation` tối đa 3 ký tự và là
một tầng cụ thể, nên một dải không hợp; ghi chú của hàng DV4 cũng đòi dải là extension nếu không có field chuẩn. Tách ra thì `floor_raw` giữ đúng nghĩa
RESO cho mọi nguồn (S06 đều là số), và bên đọc đang có (`review-can-cu.ts`, `judge-entity.ts`, `do-the-duyet`) không phải biết giá trị chữ.

**Dải không có cột.** Dải ở phát biểu và `field_provenance` của tin (bộ phân xử dựng `field_provenance` cho mọi trường). Thêm cột phải dựng lại view
`sale_offers`, vốn có danh sách cột tường minh từ 079 mà nhiều hàng đang sửa song song; câu giao chỉ đòi phát biểu. Cần cột thì mở hàng sau.

## Migration 095

1. CHECK `field_assertions_field_chk` = tập của 082 cộng `floor_raw`, `floor_band`. Hàng nào sau đó định nghĩa lại CHECK này (PL18 078, SV2 khi nối lại)
   phải giữ hai trường; ghi vào sổ migration.
2. Trigger miền giá trị trên phát biểu, mọi phương pháp: `floor_raw` khớp `^[1-9][0-9]{0,2}$`, `floor_band` thuộc `low|mid|high`; sai thì RAISE nêu tên trường.
3. Phát biểu `legacy` cho mọi `floor_raw` đã có (747 tin S06, từ 030), khuôn cắt chuyển PL15: mỗi dòng gắn `offer_id` của chính nó, chỉ đỡ tin đã sinh ra
   nó; đứng TRƯỚC trigger miền để giá trị cũ ngoài miền (4 tin S06 mang `0`) vẫn được giữ, còn từ nay về sau thì bị từ chối. Chạy hai lần không thêm dòng.
4. `resolve_offer_fields`: vá thân hàm đang có theo khuôn mốc của 068/069 (thêm `floor_raw` vào ba chỗ dựng cột), không chép cả hàm, để áp được ở mọi thứ tự với các migration vá khác. Không có `coalesce` với giá trị cũ.
5. Sổ từ vựng `ref_lookup`: `assertion_field` thêm `floor_raw` «Tầng» (`UnitFloorLocation`), `floor_band` «Dải tầng» (local); trục mới `floor_band`
   (`low` «Tầng thấp», `mid` «Tầng trung», `high` «Tầng cao»).

Chỉ DB local. Áp máy thu là lời riêng của Mạnh; không áp cloud, không đổi `pipeline/sync-cloud.mjs`. `floor_raw` vốn có trong danh sách sync, nên tầng số của
S03 tới `/ops/**` ở cloud theo lượt sync kế (cùng đường với tầng S06 hôm nay, không tới Invest).

## Bộ đọc

`docTang(text)` trong `pipeline/transform-zalo.mjs`, chuyển từ `docTangHuong` của SV2 (bỏ phần hướng), luật, không LLM. Trả `{ floor, floorBand, trich }`:

- **Số tầng chỉ khi có từ dẫn** «tầng», «lầu» + số: «tầng 12», «lầu 5», «Tầng: 7», «tầng 5/30» (ra 5). «T12», «T4/2027» KHÔNG đọc. Đo 11/11 trên 122
  nghìn bài S03: 6.388 bài có «T<số>/20xx» (tháng bàn giao); 986 bài có «T<số>» trần mà không có chữ «tầng», «lầu»; mẫu ngẫu nhiên 40 bài trong đó: 0/40
  là tầng (tháng, thứ, tên toà «T16», «T21»). «tang» không dấu + số: 0 bài, nên không nhận làm từ dẫn (không dấu dễ là «tăng»).
- **Không đọc:** «nhà 5 tầng», «3 tầng» (số đứng trước là số tầng của nhà); «tầng 2-3», «tầng 1 và 2» (nhiều tầng); số theo sau «m», «m2».
- **Tầng từ mã căn** dạng toà + tầng + trục («S1.12.08», «GH3-1203» ra 12); mã che tầng («PR6xx20») ra null.
- **Dải:** «tầng cao», «tầng trung cao» → `high`; «tầng trung», «trung tầng», «tầng vừa» → `mid`; «tầng thấp» → `low`. Có số thì chỉ ghi số.
- **Bài nhiều mã căn** (cùng luật trục ở SV1): để trống, chờ PL18 tách căn.
- **Trích dẫn:** `trich` là đoạn chữ khớp nguyên văn trong bài sau chuẩn hoá NFC (vd «tầng 12», «S1.12.08»). Phát biểu chỉ ghi khi `trich` có thật trong
  chữ bài.

Phát biểu: `transform-zalo@dv4`, lớp `observed`, phương pháp `parser`, mỗi bài một dòng mỗi trường, `evidence = {"trich": "<đoạn>"}`. Không vào khoá gom, nên
`offer_id` không đổi. Bài đổi giá trị ở lượt sau → dòng cũ rút `thay-boi-luot` (writeAssertions `replaceOwn`).

DB chưa áp 095 (CHECK chặn): transform kiểm trước, in cảnh báo nêu số 095, bỏ phát biểu tầng, phần còn lại chạy như cũ.

## ADR-0011, sáu điều kiện cho `floor_band`

1. Tra cứu: DD 2.1 không có field dải tầng (`UnitFloorLocation` là một tầng, ≤3 ký tự); `dd: null`, `checked_on: 2026-11-11` trong `pipeline/mappings.yaml`.
2. Lý do VN: môi giới VN thường che số tầng và chỉ nói dải («tầng trung») — 09/11 phần lớn tin S03 ghi tầng là dải.
3. Migration 095.
4. Ràng buộc: trigger miền `low|mid|high` + trục từ vựng `floor_band`.
5. Khai trong `pipeline/mappings.yaml` (trường + trục từ vựng); `floor_raw` sửa `dd: null` cũ thành `UnitFloorLocation`.
6. DQ: dòng `s03-floor-fill` trong `pipeline/sql/450_dq_checks.sql` — `skip` khi S03 chưa có phát biểu tầng hay dải, `pass` khi tỉ lệ tin căn hộ S03 có tầng
   hoặc dải từ 5%, `fail` khi dưới; nhãn diễn giải ở `app/src/lib/dq-labels` cùng PR (luật đợt 30/10).

## Ma trận viết trước (đáp án)

Câu do người viết, không lấy từ bài thật. Mỗi dòng là MỘT ca có mã riêng (`M1`…); test assert từng ca và in danh sách mã đã chạy.

| Mã | Chữ | floor | floorBand |
|---|---|---|---|
| M1 | tầng 12 | 12 | |
| M2 | lầu 5 | 5 | |
| M3 | Tầng: 7 | 7 | |
| M4 | TẦNG 9 | 9 | |
| M5 | tầng 5/30 | 5 | |
| M6 | S1.12.08 | 12 | |
| M7 | GH3-1203 | 12 | |
| M8 | PR6xx20 | | |
| M9 | tầng cao | | high |
| M10 | tầng trung cao | | high |
| M11 | tầng trung | | mid |
| M12 | trung tầng | | mid |
| M13 | tầng vừa | | mid |
| M14 | tầng thấp | | low |
| M15 | tầng 15, tầng cao | 15 | |
| M16 | bàn giao T4/2027 | | |
| M17 | T12 view sông | | |
| M18 | toà T21 | | |
| M19 | xem nhà T7 | | |
| M20 | nhà 5 tầng | | |
| M21 | 3 tầng | | |
| M22 | tầng 2-3 | | |
| M23 | tầng 1 và 2 | | |
| M24 | tầng 0 | | |
| M25 | tầng 1234 | | |
| M26 | tang 12 | | |
| M27 | gia tang 5 trieu | | |
| M28 | S1.12.08 và S2.05.01 tầng cao | | |

## Đo trên mẫu đọc tay (Hỏi-2 ở thẻ)

Mẫu: 300 bài S03 rút ngẫu nhiên có hạt giống cố định trên DB máy thu (chỉ đọc) — 200 bài có từ «tầng», «lầu» hay mã căn đủ, 100 bài không có
(trong đó có bài mang «T<số>/20xx» và bài mang «T<số>» trần). Một tác tử tươi đọc tay từng bài KHÔNG thấy kết quả bộ đọc, ghi đáp án (`floor`, `floorBand`) vào
`research-local/tang-tren-tin-s03/mau-doc-tay.jsonl` (gitignored; chữ bài không vào kho). Thước:

- đúng = bài bộ đọc ra giá trị trùng đáp án / bài bộ đọc ra giá trị ≥ 95%;
- sót = bài đáp án có tầng mà bộ đọc để trống — in số, không chặn (bộ đọc chọn chắc hơn đủ); in riêng số sót do «T<số>» trần;
- 0 bài mang «T<số>/20xx» mà không có từ dẫn bị đọc thành tầng.

## Tin S06 mới

S06 hiện không ghi `floor_raw` ở transform: 747 giá trị có từ lượt chép một lần của 030, tin S06 cuối cùng có tầng vào ngày 21/10, tin vào sau đều trống
cả trước và sau 095. Vì vậy 095 không làm tin S06 mới mất tầng. Ghi phát biểu tầng cho S06 từ `floornumber` của stg là việc riêng (ngoài phạm vi).

## Giới hạn đã biết trước

- Tầng trong mã viết liền «S801» không đọc (audit 02/11: chưa kiểm cách tách).
- Bài nhiều căn để trống tầng tới khi PL18 tách căn.
- Dải không có cột, không lên cloud; chỉ ở phát biểu và `field_provenance`.
- Hai bài của một tin ghi khác tầng: phân xử chọn theo số bài và báo `conflict`, không gộp.
