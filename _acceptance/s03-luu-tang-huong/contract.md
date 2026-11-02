---
schema_version: 1
feature: Lưu tầng và hướng của tin S03 bằng migration 067, hướng là một trường kèm nhãn «của cái gì», nhiều giá trị
slug: s03-luu-tang-huong
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/** khớp t3_paths
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-s03-luu-tang-huong-design.md
---

# Acceptance Contract: s03-luu-tang-huong

## Context

Audit S03 §10: hướng ở 20% bài, tầng ở 7,6% bài, hiện không có chỗ lưu. Mạnh chốt một trường hướng kèm nhãn và «Chọn làm hết». Hàng chỉ đọc và lưu,
không ghép căn; hướng không lên cloud; tầng đi theo cột `floor_raw` đã có trong sync nên tới `/ops/**` ở cloud (câu hỏi ở thẻ). Nhãn dùng để đo do tác tử gắn, không có người gắn, không phải nhãn vàng.

## Acceptance criteria

- AC-1: Given DB thử đã có schema tới 066 và một tin S06 có `floor_raw`, When áp 067 hai lần, Then không lỗi, `field_assertions` nhận trường `floor_raw` và `unit_facing`, `sale_offer_records` và view `sale_offers` có cột `unit_facing`,
  và sau lần hai vẫn đúng một phát biểu `legacy` cho tin đó (lần một là 1, lần hai không thêm).
- AC-2: Given ma trận viết trước gồm giá trị đúng («12», «tầng cao», «tầng thấp», «balcony:southeast», «unspecified:northeast,southeast», «door:north») và sai («abc», «1234», «tầng 5», «cao», «balcony:nam», «sideways:east», «balcony:», «balcony:east,east», «balcony:west,east» vì chưa sắp), When
  ghi phát biểu ở mọi phương pháp và ghi thẳng cột `unit_facing`, Then giá trị đúng được nhận, giá trị sai bị từ chối với thông điệp nêu tên trường.
- AC-3 (cross-layer): Given mọi tin có `floor_raw` từ trước, When áp 067 rồi `resolve_offer_fields` toàn bộ trên bản sao DB, Then từng cặp (`offer_id`, `floor_raw`) giữ nguyên và các cột khác của phân xử không tin nào đổi. Given một tin S06 đã qua 067, When ghi lại tin đó qua `writeOffers` hai lượt, Then `floor_raw` còn nguyên.
- AC-4: Given ma trận đáp án trong design doc mục «Ma trận viết trước», When bộ đọc chạy, Then mỗi dòng ra đúng giá trị của đáp án, và ca đỏ trên bản đột biến ghim mã ca. Given 250 bài nhãn của audit (tác tử gắn, cũng là nguồn của bộ đọc nháp), Then hướng đúng ≥ 100/109 và thừa ≤ 2/141.
- AC-5: Given ma trận đáp án trong design doc, When bộ đọc chạy, Then mỗi dòng ra đúng. Given 250 bài nhãn của audit, Then khoảng đúng ≥ 22/25, số đúng ≥ 4/5, thừa mỗi loại ≤ 2.
- AC-6 (cross-layer): Given bài S03 có tầng và hướng trên DB thử, When chạy transform hai lần, Then phát biểu `floor_raw`, `unit_facing` có đúng chủ thể, lớp quan sát, phương pháp parser; cột của tin đúng giá trị; lần hai không thêm dòng. Given hai bài một tin khác giá trị, Then `field_provenance` báo `conflict`.
  Given bộ đọc đổi giá trị của một bài, Then phát biểu cũ bị rút lý do `thay-boi-luot` và cột theo giá trị mới.
- AC-7 (cross-layer): Given toàn bộ bài S03 trên bản sao DB, When transform bản có và bản đột biến đưa hướng vào khoá gom, Then bản có trùng khít tập `offer_id` của bản nền và bản đột biến lệch (đối chứng đỏ); tin có hướng trong 25–35%, tin có tầng trong 6–15%; tin có bất đồng tầng hoặc hướng ≤ 15% số tin có giá trị đó; in số kèm mẫu số, không in chữ bài.
- AC-8: Given sáu điều kiện ADR-0011, When kiểm, Then `pipeline/mappings.yaml` có `unit_facing` với `dd: null`, rationale, `checked_on`; `floor_raw` trỏ `UnitFloorLocation`; nhãn và tám hướng ở sổ từ vựng; `node pipeline/vocab.mjs --check` và `--check-db` trên DB thử xanh; `reso-khung-phan-loai.md` tách hướng S03 khỏi
  `DirectionFaces`; dòng DQ `s03-unit-facing-fill` là `skip` khi chưa có phát biểu, `pass` khi đủ, `fail` khi có phát biểu mà dưới 5%.
- AC-9: Given diff của hàng so với main, When quét, Then `pipeline/sync-cloud.mjs` không đổi, `unit_facing` không có trong danh sách sync, không có lệnh áp cloud, không tệp nào dưới route Zalo đổi; mọi tệp thêm hay sửa không chứa tên nguồn thật lấy từ `source_registry` local (đối chứng: tên đó có trong tệp giả thì quét đỏ); tệp nhãn nằm ở `research-local/` và `git check-ignore` xác nhận, không tệp nào của diff chứa câu lấy từ 250 bài.
- AC-10 (cross-layer): Given DB chưa áp 067, When chạy transform S03 mã mới, Then lượt chạy xong, in cảnh báo nêu số migration, số tin không đổi, không có phát biểu mới của hai trường; Given đã áp 067, Then ghi đủ.
- AC-11: Given `floor_raw` là «tầng cao», «tầng trung», «tầng thấp», When hàng Tầng của thẻ ghép căn (`review-can-cu.ts`), bộ chấm ghép (`judge-entity.ts`) và `do-the-duyet` đọc, Then không lỗi, chữ hiện nguyên, hàng so coi là thiếu chứ không phải lệch; giá trị số so như cũ. Không đổi giao diện.

## Coverage

- Trục giá trị × nơi ghi: đúng/sai × phát biểu/cột (AC-2). Thước: mỗi dạng sai một dòng ma trận, có ca đỏ.
- Trục dữ liệu cũ × nguồn: S06 có tầng, nguồn khác không (AC-3). Thước: so toàn bảng trước và sau.
- Trục đọc: hướng × từ dẫn/không/nơi chốn/nhiều mã; tầng × số/mã/khoảng/số tầng của nhà (AC-4, AC-5). Thước: ma trận và 250 nhãn của audit (`[CE chưa kiểm chứng]`: nhãn tác tử, một người gắn).
- Trục lượt chạy: lần đầu, chạy lại, bài đổi, bất đồng (AC-6). Thước: đếm dòng phát biểu và đọc `field_provenance`.
- Trục toàn bộ: khoá gom và độ phủ (AC-7). Thước: so tập `offer_id`.
- Trục luật: ADR-0011, ranh giới cloud, SPL (AC-8, AC-9).
- Trục triển khai và bên đọc: DB chưa áp, đã áp; bên đọc gặp giá trị chữ (AC-10, AC-11).

## Đường đo

- «Tầng và hướng đọc được đi tới phát biểu của tin»: `pipeline/scripts/do-luu-tang-huong.mjs` đếm trên bản sao DB, bảo đảm bởi AC-6, AC-7.
- «Trường hướng khai đủ 6 điều kiện ADR-0011»: bảo đảm bởi AC-8.

## Out of scope

- Ghép trục vào danh mục, tới căn (PL20) và tách bài nhiều căn (PL18).
- Đưa hướng lên cloud, Invest, API công khai; đưa tầng lên Invest (sync-cloud là T3 riêng; TR1 chưa cần).
- Suy hướng từ trục hay từ S08; đọc tầng trong mã viết liền «S801».
- Áp 067 lên cloud; chạy lại transform trên DB chung (giám sát xếp lượt).
- Đổi S08 khỏi `DirectionFaces`, và thẻ nhóm.

## Notes
