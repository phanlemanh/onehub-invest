---
schema_version: 1
feature: Tin S03 ghi tầng (số tầng hay dải cao, trung, thấp) mang phát biểu tầng có trích dẫn, ở field đã kiểm RESO
slug: tang-tren-tin-s03
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/** khớp t3_paths (lộ trình ghi T2)
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-11
design_doc: docs/superpowers/specs/2026-11-11-tang-tren-tin-s03-design.md
---

# Acceptance Contract: tang-tren-tin-s03

## Context

Đo 09/11: 702/4.801 tin căn hộ S03 (15%) ghi tầng trong chữ, phần lớn là dải («tầng trung»); `floor_raw` của S03 đang trống và `field_assertions` chưa
nhận trường tầng. Hàng DV4 thêm migration 095 cho hai trường tầng, một bộ đọc tầng ở `pipeline/transform-zalo.mjs` (lấy lại từ phần tầng của SV2, nhánh
`claude/s03-luu-tang-huong`), và phát biểu tầng có trích dẫn. Tra RESO DD 2.1: số tầng ứng `UnitFloorLocation` (chuỗi ≤3 ký tự); dải tầng không có
field chuẩn nên là extension `floor_band` đủ 6 điều kiện ADR-0011. DV4 nhận trọn phần tầng của SV2; SV2 khi nối lại chỉ còn hướng.

Source input: hàng DV4 của `docs/plan/lo-trinh.json`; Cổng Đáng «Build cả bốn» (Mạnh 10/11). Migration 095 (giám sát cấp 11/11).

## Criteria

- AC-1: Given DB thử đã có schema của main (tới 088) và một tin S06 có `floor_raw`, When áp 095 hai lần, Then:
  - không lỗi; `field_assertions` nhận trường `floor_raw` và `floor_band`; một trường lạ (`floor_lol`) vẫn bị từ chối;
  - tin S06 có đúng một phát biểu `legacy` cho `floor_raw` sau lần một, lần hai không thêm;
  - ma trận viết trước ghi qua phát biểu ở mọi phương pháp: nhận `12`, `1`, `999`, `lower`, `middle`, `upper`; từ chối `0`, `1234`, `012`, `abc`,
    `tầng 5`, `tầng cao` cho `floor_raw` và `cao`, `UPPER`, `high`, `mid` cho `floor_band`, mỗi dòng từ chối có thông điệp nêu tên trường.
- AC-2 (cross-layer): Given bản DB thử chép từ DB máy thu, When áp 095 rồi `resolve_offer_fields` toàn bộ trong giao dịch ROLLBACK, Then từng cặp
  (`offer_id`, `floor_raw`) đã có giữ nguyên, các cột khác của phân xử không tin nào đổi; Given một tin S06 đã qua 095, When ghi lại qua `writeOffers` hai
  lượt, Then `floor_raw` còn nguyên.
- AC-3: Given ma trận viết trước ở mục «Ma trận viết trước» của design doc, When bộ đọc tầng chạy từng dòng, Then:
  - mỗi ca (mã `M1`…`M28`) ra đúng `floor`, `floorBand` của đáp án, một assert mỗi ca;
  - «bàn giao T4/2027», «T12 view sông», «toà T21», «xem nhà T7» ra null cả hai;
  - mỗi giá trị khác null có `trich` là một đoạn có thật trong chữ đã chuẩn hoá NFC;
  - bản đột biến bỏ chặn «tầng 2-3» thì đỏ, thông điệp ghim mã ca.
- AC-4 (cross-layer): Given bài S03 có tầng trên DB thử đã áp 095, When chạy transform S03 hai lần, Then:
  - phát biểu `floor_raw`, `floor_band` đúng chủ thể bài, lớp `observed`, phương pháp `parser`, `evidence.trich` đúng đoạn trong bài;
  - cột `floor_raw` của tin bằng số tầng đọc được; dải chỉ ở phát biểu và `field_provenance`;
  - lần hai không thêm dòng; bài đổi giá trị thì phát biểu cũ rút lý do `thay-boi-luot`;
  - hai bài một tin khác tầng thì `field_provenance.floor_raw.conflict` là true.
- AC-5: Given mẫu 300 bài S03 rút ngẫu nhiên có hạt giống (200 có từ dẫn tầng hay mã căn đủ, 100 không, gồm bài mang «T<số>/20xx») và đáp án do tác tử
  tươi đọc tay không thấy kết quả bộ đọc, When bộ đọc chạy trên mẫu, Then:
  - đúng / (bài bộ đọc ra giá trị) ≥ 95%;
  - 0 bài mang «T<số>/20xx» không có từ dẫn bị đọc thành tầng;
  - in số sót (đáp án có, bộ đọc trống) kèm mẫu số, và riêng số sót do «T<số>» trần; in số, không in chữ bài.
- AC-6 (cross-layer): Given DB chưa áp 095, When chạy transform S03 mã mới, Then lượt chạy xong, in cảnh báo nêu số 095, số tin không đổi, không có
  phát biểu tầng; Given đã áp 095, Then ghi đủ.
- AC-7: Given sáu điều kiện ADR-0011, When kiểm, Then:
  - `pipeline/mappings.yaml` có `floor_raw` trỏ `UnitFloorLocation` và `floor_band` với `dd: null`, rationale, `checked_on`, cùng trục từ vựng `floor_band`;
  - `node pipeline/vocab.mjs --check` xanh và `--check-db` xanh trên DB thử đã áp 095;
  - dòng DQ `s03-floor-fill` là `skip` khi S03 chưa có phát biểu tầng, `pass` khi tỉ lệ tin căn hộ S03 có tầng hoặc dải từ 5%, `fail` khi dưới;
  - nhãn diễn giải của `s03-floor-fill` có trong `app/src/lib/dq-labels`.
- AC-8 (cross-layer): Given toàn bộ bài S03 trên bản DB thử, When transform bản mới (đã áp 095) trong giao dịch ROLLBACK, Then:
  - tập `offer_id` trùng khít bản nền (tầng không vào khoá gom); bản đột biến đưa tầng vào khoá thì lệch (đối chứng đỏ);
  - tin căn hộ S03 có tầng hoặc dải trong 8–25%; in số kèm mẫu số, không in chữ bài;
  - dòng DQ `s03-floor-fill` chạy trên đúng đầu ra đó ra `pass` và tỉ lệ nó in khớp số trên.
- AC-9: Given diff của hàng so với main, When quét, Then:
  - `pipeline/sync-cloud.mjs` không đổi, không có lệnh áp cloud, không tệp nào dưới route Zalo đổi;
  - không tệp nào của diff chứa tên nguồn thật lấy từ `source_registry` local (đối chứng: tên đó trong tệp giả thì quét đỏ);
  - tệp mẫu đọc tay nằm ở `research-local/` và `git check-ignore` xác nhận.

## Coverage

- Trục giá trị × nơi ghi: đúng/sai × hai trường × mọi phương pháp, trường lạ (AC-1). Thước: mỗi dạng sai một dòng ma trận, có ca đỏ.
- Trục dữ liệu cũ: tin S06 có tầng, mọi nguồn khác không (AC-1, AC-2). Thước: so từng cặp trước và sau trên bản DB thử.
- Trục đọc: số có từ dẫn × mã căn × dải × «T<số>» trần × số tầng của nhà × nhiều tầng × nhiều mã (AC-3). Thước: ma trận viết trước.
- Trục độ đúng thật: mẫu đọc tay 300 bài (AC-5). `[CE chưa kiểm chứng]`: đáp án do một tác tử đọc, không người duyệt.
- Trục lượt chạy: lần đầu, chạy lại, bài đổi, bất đồng (AC-4). Thước: đếm dòng phát biểu, đọc `field_provenance`.
- Trục triển khai: DB chưa áp, đã áp (AC-6).
- Trục toàn bộ: khoá gom và độ phủ (AC-8). Thước: so tập `offer_id`.
- Trục luật: ADR-0011, DQ có nhãn, ranh giới cloud, SPL (AC-7, AC-9).

## Đường đo

- «Trên mẫu đọc tay, tầng đọc đúng từ 95%»: `pipeline/scripts/do-tang-tren-tin.mjs --mau` · AC-5.
- «mốc kiểu «T4/2027» không bị đọc thành tầng»: ma trận AC-3 và đếm trên mẫu AC-5.
- «field_assertions nhận field tầng, field lạ vẫn bị từ chối»: AC-1.
- «nạp lại không nhân phát biểu»: AC-1 (legacy), AC-4 (transform hai lần).

## Out of scope

- Hướng (`unit_facing`) — còn ở SV2 khi nối lại.
- Cột riêng cho dải tầng, đưa dải lên cloud, Invest, API.
- Ghi phát biểu tầng cho tin S06 mới từ stg (S06 không ghi `floor_raw` cho tin vào sau 21/10, trước và sau 095 như nhau).
- Tầng trong mã viết liền «S801»; tách bài nhiều căn (PL18); gắn tầng vào căn danh bạ (PL20).
- Đọc tầng bằng LLM (E2/PL18).
- Áp 095 lên DB máy thu hay cloud; chạy lại transform trên DB chung (lời riêng của Mạnh, giám sát xếp).

## Notes
