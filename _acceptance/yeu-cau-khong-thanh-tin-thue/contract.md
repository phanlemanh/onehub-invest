---
schema_version: 1
feature: Bài tìm căn viết tắt («tìm 1pn…», «tìm studio…», «ac có gửi em») được luật xác định nhận là Yêu cầu, không còn thành tin rao thuê S03; dọn tin đã lọt bằng lượt transform
slug: yeu-cau-khong-thanh-tin-thue
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [data, cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-26-yeu-cau-khong-thanh-tin-thue-design.md
veto_state: mo
veto_opened_at: 2026-11-26T11:05:00Z
---

# Acceptance Contract: yeu-cau-khong-thanh-tin-thue

## Context

PL42, GS giao dãy P3 26/11, gộp trước YC0 (cùng tệp `yeu-cau.mjs`, `transform-zalo.mjs`). Đây là phần «bài tìm» của GT8/YC2;
rổ hàng và quảng cáo không làm ở đây. Mốc DB máy thu 26/11: 264 tin S03 chứa bài nhãn Haiku inquiry (nhãn 14 ngày); 51/1.165 tin
thuê «giá tốt» là tin rò cùng định nghĩa. Số thử luật mới: 76 và 13. Luật 7: luật xác định quyết; nhãn Haiku chỉ làm đối chứng đo. Bảng phủ ca: design doc.

## Criteria

### AC-1 — Luật nhận câu tìm viết tắt
Given ma trận viết trước: mỗi mẫu «giữ» của bảng phủ ca một câu có giá và một câu không giá (tìm N pn · tìm gấp · tìm studio ·
tim thue không dấu · cần studio/N pn · ac/anh chị/ai có gửi/nhắn em · khách e cọc hụt/chốt · em/mình tìm),
When `laYeuCau` và `suyLoai` đọc,
Then mỗi câu là Yêu cầu (`suyLoai` ra `kind = null`, nguồn `yeu-cau`).

### AC-2 — Tin rao thật không bị kéo vào (chiều đỏ của AC-1)
Given ma trận tin rao đối chứng, mỗi mẫu «giữ» của AC-1 ghép ít nhất một câu rao gần giống cùng tiền tố, có giá và không giá
(«em tìm khách thuê cho căn 2pn 8tr», «tìm gấp khách thuê studio 5tr», «cần cho thuê studio 6tr», «khách e chốt căn này rồi,
còn 1 căn 2pn 9tr», «căn 2pn full 8tr, ac có khách gửi em», …) cộng các câu «khách thuê cọc rồi», «đã có khách», «nhận ký gửi»,
When `suyLoai` đọc,
Then mỗi câu ra đúng `kind` của hàm cũ (ghim trong test); câu nào khác thì đỏ gọi tên mẫu.

### AC-3 — Chữ bài «cần thuê dài hạn» không thắng Yêu cầu
Given câu «Cần thuê dài hạn 2pn full 10tr», «Tìm thuê dài hạn studio», và đối chứng «Cho thuê dài hạn 2pn 10tr», «Căn 2pn thuê dài
hạn 10tr»,
When parsePost rồi `suyLoai` đọc,
Then hai câu đầu là Yêu cầu; hai câu đối chứng vẫn `rent_lt` nguồn chữ bài.

### AC-4 — Qua transform thật, dọn tin đã lọt và lùi được (cross-layer)
Given DB thử (ROLLBACK) với bài S03 tổng hợp: một tin rao thuê thật; một bài «Tìm 2pn full 8tr» đứng riêng; một tin gom gồm một
bài rao và một bài tìm cùng nhóm,
When (1) chạy transform-zalo với luật cũ (tiêm qua tham số khai trong test); (2) chạy với luật mới, hai lần; (3) chạy lại luật cũ,
Then (1) bài tìm thành tin rent_lt (chiều đỏ, gọi tên bài); (2) tin của bài tìm nghỉ giữ nguyên khoá, tin gom còn sống với
`post_ids` chỉ gồm bài rao, tin rao thật y nguyên, bài tìm rơi vào nhánh `yeu-cau` của `nhanhCuaBai`, lần chạy thứ hai không đổi
gì; (3) tin nghỉ sống lại cùng khoá.

### AC-5 — Thước trên bản chép dữ liệu thật (cross-layer)
Given bản chép DB máy thu (db-thu, ROLLBACK). Định nghĩa đếm: chỉ tin S03 đang sống (`sale_offers`); «tin rò» = tin có ít nhất
một bài mà nhãn Haiku hợp lệ mới nhất (json_ok không false) là `inquiry` và nhãn ghi từ 12/11 đến hết 26/11,
When `pipeline/scripts/do-yeu-cau-lot-tin.mjs --kiem` in khối «trước» trên bản chép, chạy transform-zalo rồi xếp hạng giá (420),
rồi in khối «sau»,
Then khối «trước» tái lập mốc 264 tin rò và 51 tin thuê «giá tốt» rò (±2, lệch thì thoát 1 «mốc lệch»); khối «sau»: tin rò ≤ 85
(thử 76), tin thuê «giá tốt» rò ≤ 16 (thử 13); số bài mà luật mới đổi sang Yêu cầu mà nhãn Haiku của chính bài khác `inquiry`
≤ 10; số tin rao thuê sau = trước − số tin thuê rút trọn (lệch thì thoát 1); in số tin thuê «giá tốt» trước/sau (mốc 1.165) và
nhánh Yêu cầu của data-flow trước/sau (đơn vị: bài). Biên của ngưỡng (≤ 85 so với thử 76, ≤ 16 so với thử 13) là khoảng 12%: bản chép dựng sau ngày đo
26/11 có thêm bài mới và nhãn mới, số trước/sau dịch vài tin; biên nhỏ hơn thì đỏ vì dữ liệu mới, không vì luật. Tệp mẫu `_acceptance/yeu-cau-khong-thanh-tin-thue/evidence/mau-tin-rut.md`
(chuỗi từ 8 chữ số trở lên che thành «#», kho công khai) gồm MỌI bài nhãn khác inquiry bị đổi, cộng 20 bài chọn ngẫu nhiên (hạt
giống cố định) trong số bài chưa nhãn bị đổi; mẫu dưới 20 bài thì thoát 1 «mẫu thiếu». Vượt ngưỡng nào thì thoát 1 gọi tên ngưỡng.

### AC-6 (judgment) — Bài bị đổi đúng là Yêu cầu
Given tệp mẫu của AC-5,
When người chấm đọc từng bài,
Then mỗi bài là câu tìm căn của người thuê/mua (không phải tin rao); một bài là tin rao thật thì tiêu chí hỏng.

### AC-7 — Không hồi quy
Given cây sau sửa,
When chạy test luật loại tin hiện có (`transform-zalo-loai-tin*.test.mjs`) và hai nửa suite pipeline,
Then xanh, và hai tệp test cũ không đổi so với main (không ca cũ nào bị sửa kỳ vọng).

## Coverage

- Trục A — cách viết × có/không giá: tám mẫu giữ [AC-1] · mẫu bỏ «khách thuê» và tin rao đối chứng [AC-2] · chữ bài «cần thuê dài
  hạn» [AC-3]
- Trục B — đường thật: transform, tin gom, chạy lại [AC-4] · dữ liệu thật, giá tốt, data-flow [AC-5] · mẫu chấm tay [AC-6] · hồi
  quy [AC-7]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Rổ hàng, quảng cáo dịch vụ, tin cho thuê có chữ «tìm nhà» — GT8.
- Bài tìm không khớp mẫu nào (29 bài 14 ngày, viết tự do) — mở luật thêm cần đo precision riêng; YC0 giữ chúng ở ngăn chờ duyệt
  qua nhãn model.
- Đọc ngân sách hay tiêu chí của bài tìm — YC9. S05.

## Đường đo

- Ô DB: tin S03 chứa bài nhãn inquiry 264 → ≤ 100; tin thuê «giá tốt» là Yêu cầu 70 → ≤ 25 ← AC-5. Lệnh: `node
  pipeline/scripts/do-yeu-cau-lot-tin.mjs`.
- Ô màn: `/ops/data-flow` S03 nhánh Yêu cầu tăng, tin rao thuê giảm bằng số tin rút ← AC-5 (in trước/sau).

## Notes

- Không có lượt áp riêng: lượt đêm `zalo-import-daily.sh` (transform-zalo rồi 420) đưa luật vào hiệu lực sau gộp; xem design doc.
