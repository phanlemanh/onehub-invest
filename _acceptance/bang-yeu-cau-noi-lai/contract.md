---
schema_version: 1
feature: Lớp bài Yêu cầu — transform S03 ghi phát biểu ý định (luật = observed, nhãn Haiku = inferred), bộ phân xử ghi mỗi bài Yêu cầu thành một dòng inquiry_post_records khoá theo post_id, chỉ DB local
slug: bang-yeu-cau-noi-lai
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [data, cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-26
design_doc: docs/superpowers/specs/2026-11-26-bang-yeu-cau-noi-lai-design.md
---

# Acceptance Contract: bang-yeu-cau-noi-lai

## Context

YC0 (ROADMAP §3 mục 43 Q1; Mạnh «Mở ngay» 26/11 03:39Z, ngoại lệ mục 53 chỉ cho YC0, YC5). GS phán 26/11 theo ADR-0013 câu 3,
4 và đồng ý tách: YC0 = lớp bài + ý định (migration 136); YC9 `tieu-chi-yeu-cau-phat-bieu` = tiêu chí qua phát biểu + phân
xử; YC5 sau YC9. Mốc đo 14 ngày 12–26/11 trên DB máy thu: **11.101 bài Yêu cầu** (luật ∧ model 3.909 · luật một mình 6.272 ·
chỉ model 920); dịch vụ trống **1.472**, loại hình trống **1.890** (mốc cho YC9). Bảng phủ ca: design doc.

## Criteria

### AC-1 — Lược đồ 136
Given migration `db/migrations/136_inquiry_post_records.sql`,
When áp hai lần lên DB thử,
Then có bảng `inquiry_post_records`, view sống `inquiries` (`retired_at IS NULL AND intent_status = 'song'`), hàm
`resolve_inquiry_fields`; CHECK `inquiry_id = source || ':' || originating_system_key`, `source` dạng `S0x`, `intent_status` ∈
{song, cho-duyet}, `kind` ∈ {sale, rent_lt, rent_st}, `property_type` ∈ sổ trục, `budget_min_vnd ≤ budget_max_vnd`,
`retired_reason` có khi và chỉ khi `retired_at` có; `field_assertions_field_chk` nhận thêm `listing_intent`, `kind`,
`budget_min_vnd`, `budget_max_vnd` và vẫn nhận mọi trường cũ; lần hai không lỗi; migration ghi 0 dòng. Chiều đỏ: mỗi CHECK một
dòng vi phạm ra lỗi đúng tên ràng buộc; phát biểu `listing_intent` giá trị ngoài sổ bị trigger từ chối.

### AC-2 — Sổ, từ vựng, DQ, CONTEXT, phụ lục ADR
Given khối `inquiries` trong `pipeline/mappings.yaml` và bốn trường mới trong trục `assertion_field`,
When chạy `vocab.mjs --check`, `--lint`, `--check-db` trên DB thử đã áp 136,
Then cả ba xanh; `dq-enum-vocab` có mục cho `inquiries`; CONTEXT «Yêu cầu» không còn «là tính năng sau» và nêu khoá mức bài;
phụ lục «11 câu áp cho Yêu cầu» trong `docs/adr/` có đủ 11 mục.

### AC-3 — Phát biểu ý định từng bài (hàm thuần)
Given ma trận viết trước, nhãn dựng đúng cột `silver_labels`: luật ∧ nhãn inquiry · luật, chưa nhãn · luật, nhãn offer · chỉ
nhãn inquiry, parsePost không ra loại · chỉ nhãn inquiry, parsePost ra loại tin · tin rao không nhãn · bài thử chữ Yêu cầu ·
nhãn mới `json_ok=false` nói inquiry đè nhãn cũ hợp lệ nói offer · nhãn cũ inquiry, nhãn mới offer,
When `phatBieuYDinh` sinh dòng,
Then mỗi bài ra đúng tập dòng viết trước (field `listing_intent`, giá trị, lớp, method, `rule_id`, `evidence.label_id`); bài
thử không dòng nào; ca parsePost ra loại tin theo Hỏi-1b.

### AC-4 — Phân xử và ghi theo khoá bài (cross-layer)
Given DB thử (ROLLBACK) đã áp 136 và cắt chuyển, bài của ma trận AC-3 cộng hai bài cùng người cùng chữ khác ngày, nhãn chèn vào
`silver_labels` bằng khuôn cột của bộ ghi nhãn thật,
When chạy transform-zalo hai lần,
Then mỗi bài Yêu cầu đúng một dòng `inquiry_id = 'S03:<post_id>'` (hai bài cùng chữ là hai dòng); luật nhận → `song`; chỉ nhãn →
`cho-duyet` (Hỏi-1a), dòng có trong bảng và VẮNG trong `inquiries`; `intent_assertion_ids` trỏ đúng phát biểu thắng; cột tiêu
chí NULL; lượt hai thêm 0 dòng, 0 phát biểu. Đối chứng: câu đọc nhãn bỏ lọc `json_ok` thì ca «nhãn hỏng đè» đổi kết quả, đỏ
gọi tên bài.

### AC-5 — Nghỉ, sống lại, lượt một phần, không xoá (cross-layer)
Given một bài Yêu cầu sống A,
When (i) chạy transform trên tập bài KHÔNG chứa A; (ii) chữ A đổi thành tin rao rồi chạy lại; (iii) đổi về rồi chạy lại,
Then (i) A vẫn sống; (ii) A nghỉ `het-y-dinh` (dòng còn, phát biểu luật bị rút); (iii) A sống lại cùng `inquiry_id`; không câu
`DELETE` nào nhắm `inquiry_post_records` trong `pipeline/**` (trừ test) và migration 136 — răng quét đỏ gọi tên tệp khi cấy
DELETE vào bản sao `transform-zalo.mjs` và vào một tệp SQL.

### AC-6 — Chưa áp 136 thì bỏ bước (cross-layer)
Given DB thử chưa áp 136,
When chạy transform-zalo,
Then không lỗi, không phát biểu ý định nào, in đúng một dòng «chưa áp 136».

### AC-7 — Tin rao không đổi (cross-layer)
Given cùng một tập bài,
When chạy transform-zalo trên DB thử chưa áp 136 và trên DB thử đã áp 136,
Then tập `sale_offers` (khoá và mọi cột) như nhau, kể cả tin mà bài có phát biểu `listing_intent`; khác thì đỏ gọi tên tin.

### AC-8 — Ô /ops/data-flow đọc bảng thật (cross-layer)
Given DB thử đã áp 136 có bài Yêu cầu sống và chờ duyệt,
When chạy `refresh-data-flow.mjs` rồi đọc dòng S03,
Then ô «Đọc thành Yêu cầu» trong bảng dòng chảy mà màn `/ops/data-flow` đọc bằng số bài trong `inquiries` (không gồm chờ
duyệt); trên DB chưa áp 136 ô giữ đường tính lại cũ.

### AC-9 — Thước trên bản chép dữ liệu thật (cross-layer)
Given bản chép DB máy thu (db-thu, ROLLBACK) đã áp 136,
When chạy transform rồi `pipeline/scripts/do-yeu-cau.mjs --kiem`,
Then tập `post_id` sống ∪ chờ duyệt BẰNG tập đếm độc lập (luật qua `nhanhCuaBai` ∪ nhãn qua SQL `silver_labels`, lọc Hỏi-1) —
0 vắng, 0 thừa; mỗi nguồn ≥ 90% mốc toàn bộ (luật ∧ model 4.946 · luật một mình 18.329 · chỉ model, parsePost không ra loại
1.243); chạy lần hai không đổi; `source` chỉ `S0x`; danh sách bảng sync-cloud đọc được, có `sale_offers` (đối chứng dương) và
không có `inquiry_post_records` lẫn `inquiries`.

### AC-10 — Không hồi quy
Given cây sau sửa,
When chạy hai nửa suite pipeline và suite app,
Then xanh.

## Coverage

- Trục A — lược đồ: bảng + view + hàm | khoá = nguồn:post_id | CHECK (+rent_st, intent_status, trường phát biểu) | nghỉ có lý do
  | áp lại [AC-1] · sổ + DQ + CONTEXT + phụ lục [AC-2]
- Trục B — ai là Yêu cầu: luật∧nhãn | luật một mình | luật vs nhãn offer | chỉ nhãn × parsePost (hai ô) | tin rao | bài thử |
  nhãn hỏng đè | nhãn mới đổi ý [AC-3, AC-4]
- Trục C — vòng đời: ghi | chạy lại | cùng chữ khác bài | lượt một phần | nghỉ | sống lại | chưa áp 136 [AC-4, AC-5, AC-6]
- Trục D — không phá, nhìn thấy: tin rao [AC-7] · ô data-flow [AC-8] · dữ liệu thật [AC-9] · suite [AC-10]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Tiêu chí (dịch vụ, loại hình, PN, ngân sách, diện tích, khu, dự án) — YC9; gom Nhu cầu 7 ngày — YC4; hết hạn — YC6; màn
  `/ops/inquiries` — YC5; S05; bài chỉ ảnh.
- Siết hay mở rộng luật Yêu cầu, bài luật bắt nhầm — GT8.
- Nhãn người «Không phải Yêu cầu» (ngưỡng SỐNG của ô cơ hội) — ngăn duyệt của YC5, xem dòng sổ descope.
- Đưa bảng lên cloud; danh tính người đăng.
- Bài tìm viết tắt («tìm studio», «tìm 1pn») đang lọt thành tin rao thuê — PL42 `yeu-cau-khong-thanh-tin-thue`, gộp trước YC0.
- Thiếu hụt phiên kiểm Inquiry 26/11 nêu, không kéo vào vì mỗi thứ cần hàng riêng có số đo: chỉ 35 nhãn vàng inquiry (đo
  precision cần mẫu lớn hơn); `silver_labels` không lưu ngân sách/tiêu chí (YC9 đọc từ chữ); chưa có vai «người tìm» trong danh
  bạ người; chưa có trạng thái và lịch sử ngân sách của Yêu cầu (YC4, YC6); chưa có DQ, độ tươi, chỉ số cho Yêu cầu (YC7, YC8).

## Đường đo

- Ô màn: `/ops/data-flow` nhánh «Đọc thành Yêu cầu» (S03) đổi từ «bài luật nhận, tính lại» sang «bài Yêu cầu sống trong bảng»
  ← AC-8. Lệnh đo: `node pipeline/refresh-data-flow.mjs` rồi đọc dòng S03.
- Ô DB: `SELECT count(*) FROM inquiries WHERE source='S03'` — từ «bảng không tồn tại» lên ≈ 23.275 bài (mốc 14 ngày 10.181)
  ← AC-9. Lệnh đo: `node pipeline/scripts/do-yeu-cau.mjs`.
- «Nạp lại giữ nguyên» ← AC-4 (lượt hai thêm 0) + AC-5 (lượt một phần không nghỉ) + AC-9 (hai lần không đổi).

## Notes

- Người đăng Yêu cầu là tầng C (Q3); bảng không lưu danh tính người đăng.
- Áp lên DB máy thu là DDL thật trên DB local: năm thứ ở design doc; chữ ký Cổng Bằng chứng kèm lời áp.
