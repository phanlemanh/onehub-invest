---
schema_version: 1
feature: Áp hay hoàn tác một đề xuất làm giàu thì mọi tin chung bài đăng được phân xử lại; dữ liệu đã lệch được sửa một lần; hai ca đỏ của bộ test phát biểu xanh lại trên main, và test dòng chảy cloud tự dọn lược đồ tạm
slug: phat-bieu-db-do-tren-main
owner: phanlemanh@gmail.com
risk_tier: T3      # db/migrations/** (t3_paths) + ghi lại ô dữ liệu thật đi lên cloud qua sync
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-10-31-phat-bieu-db-do-tren-main-design.md
---

# Acceptance Contract: phat-bieu-db-do-tren-main

## Context

Hai ca của `pipeline/scripts/phat-bieu-db.itest.mjs` đỏ trên main. PD-AC-1 đỏ vì câu đếm cột không lọc lược đồ, trong khi DB
chung còn 20 lược đồ tạm sót của `app/tests/dong-chay-cloud.test.tsx`. PD-AC-8 đỏ vì lỗi thật có từ 045: `apply_enrichment`
và `revert_enrichment` chỉ phân xử lại tin của đề xuất, còn phát biểu đi theo post sang mọi tin chung post. Đo 31/10 trên bản
chép DB máy thu: 29 tin lệch cột (6 tin sống), 34 ô cắt chuyển lệch.

Căn cứ: phat-bieu-va-phan-xu#d-20261026T234901Z-26 (phát biểu đi theo post) · migration 063 do liên làn cấp · lời Mạnh 31/10
qua giám sát «Cho xoá dc_cloud_* sau khi sao lưu, sửa test tự dọn (P2 làm)».

## Criteria

- AC-1: Given một post nằm trong hai bản ghi tin A và B, và đề xuất làm giàu của A còn chờ, When `apply_enrichment` áp đề
  xuất (do máy hoặc do người), Then năm cột và `field_provenance` của cả A lẫn B bằng đúng kết quả phân xử trên phát biểu sống,
  và một tin C không chung post giữ nguyên từng byte.
- AC-2: Given đề xuất đã áp trên A khi A và B chung post, When `revert_enrichment` hoàn tác nó, Then cột của cả A lẫn B về
  đúng kết quả phân xử sau khi rút phát biểu, và tin C giữ nguyên.
- AC-3: Given đề xuất trên tin không chung post với tin nào, When áp hoặc hoàn tác, Then hàm trả cùng số và đổi cùng các dòng
  như bản trước 063 (số đề xuất áp, trạng thái đề xuất, căn liên kết).
- AC-4: Given test nạp lại 045 và 059 trong giao dịch trên DB đã có 059, When test gọi `apply_enrichment`, Then hàm chạy là
  bản 063, nên AC-1 vẫn đúng qua bộ nạp test.
- AC-5: Given bản chép DB máy thu chưa có 063, When áp 063 (sửa dữ liệu trong migration theo Hỏi-1), Then mọi bản ghi tin có cột và nguồn gốc ô bằng kết quả phân xử
  (`resolve_offer_fields(NULL)` sau đó đổi 0 bản ghi), cắt chuyển thử trả 0 ô lệch, có một dòng audit nêu số bản ghi xét và
  đổi, và áp lần hai đổi 0 bản ghi.
- AC-6: Given bản chép DB máy thu đã áp 063 mà vẫn còn lược đồ tạm sót, When chạy trọn
  `pipeline/scripts/phat-bieu-db.itest.mjs`, Then mọi ca xanh, gồm PD-AC-1 và PD-AC-8.
- AC-7: Given lược đồ `dc_<tiền tố>_<pid>` của test dòng chảy cloud (tiền tố theo Hỏi-2) mà tiến trình `<pid>` đã chết, và việc
  vận hành xoá lược đồ sót theo Hỏi-2 đã xong, When test chạy, Then các lược đồ ấy bị xoá; lược đồ của tiến trình còn sống và lược đồ khác tiền tố giữ nguyên; và khi test bị ngắt bằng SIGTERM hay
  SIGINT sau khi đã tạo lược đồ, không còn lược đồ nào mang pid của nó.
- AC-8: Given toàn bộ thay đổi, When chạy bộ test pipeline, bộ test app, typecheck và lint app, Then tất cả xanh.

## Coverage

Quét không gian (preset test-matrix), ba trục. Mỗi ô đi qua cả hai hàm ghi phát biểu:
- Hàm × người ghi: {`apply_enrichment`, `revert_enrichment`} × {máy (`e2_llm`), người (`hitl`)} — AC-1, AC-2.
  [thước CE: hai bộ ghi phát biểu duy nhất gọi phân xử theo tập tin trong 045/059]
- Quan hệ tin với post: {chung post với tin sống, chung post với tin đã nghỉ, không chung post} — AC-1…AC-3. [thước CE:
  2.518 chủ thể nằm trong ≥2 bản ghi trên DB máy thu 31/10]
- Đường chạy: {DB đã áp 063, test nạp lại 045/059 trong giao dịch, bản chép dữ liệu thật} — AC-4…AC-6. [thước CE: bộ nạp
  `pipeline/lib/nap-045.mjs` + hai ca đỏ trên main 25ce701b]

Ô bị cắt có lý do ở Out of scope.

## Out of scope

- Xoá 20 lược đồ `dc_*` sót trên DB chung — việc vận hành theo lời Mạnh (6 hay 20 chờ chốt), làm ngoài hợp đồng, ghi sổ.
- Bộ ghi phát biểu của transform S03/S05/S06 vẫn phân xử theo tập tin của lượt; tin đã nghỉ chung post chỉ lệch nguồn gốc ô
  (không hiện ở đâu) — mục sửa dữ liệu của 063 dọn một lần.
- Đổi luật phân xử hay thứ tự lớp/phương pháp.
- Các thay đổi của PL5 trên `phat-bieu-db.itest.mjs` (tệp này chỉ sửa một dòng).

## Đường đo

- Không có ô cơ hội với ngưỡng (hàng sửa lỗi do giám sát giao); thước sống là PD-AC-8 trên DB máy thu sau khi áp: 0 ô lệch.

## Notes
