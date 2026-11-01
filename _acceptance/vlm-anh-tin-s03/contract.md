---
schema_version: 1
feature: VLM đọc ảnh tin S03 cho bài mà chữ không đủ và ghi thêm vào bảng nhãn bạc với nguồn «ảnh» — ảnh từ đĩa, gửi base64, không kèm tầng A
slug: vlm-anh-tin-s03
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline, agent]
status: draft
design_doc: docs/superpowers/specs/2026-11-01-vlm-anh-tin-s03-design.md
---

# Acceptance Contract: vlm-anh-tin-s03

## Context

KC3, dựng trên KC1. Mạnh duyệt Cổng Đáng 02/11 với ngưỡng: đọc đúng giá và loại hình ≥ 90% trên mẫu gắn tay, số bài chữ không
đủ có nhãn bạc tăng, 0 URL zdn hết hạn bị gửi đi. Tập đọc thật đo 02/11 là 2.392 bài chữ thiếu dữ kiện có tệp ảnh trên đĩa sau khi
ghép. Nhãn bạc là đề xuất, không ghi canonical (luật 7). Tầng A không rời máy (luật 6).

## Criteria

- **AC-1** Given bài S03 gồm: thiếu giá có ảnh riêng · thiếu dấu hiệu BĐS có ảnh gán từ bài chỉ-ảnh · thiếu loại hình có ảnh · đủ cả ba có ảnh · thiếu nhưng không ảnh · Yêu cầu có ảnh · bài chỉ-ảnh không gán · bài thử, When chọn bài cần đọc, Then chỉ ba bài đầu được chọn, mỗi bài mang đúng lý do thiếu và đúng danh sách ảnh.
- **AC-2** (cross-layer) Given entry ảnh gồm: tệp thật · entry có `error` · tệp không có trên đĩa · đường có `..` · tệp quá 5 MB · tệp không phải ảnh · bài có hơn 4 ảnh, When dựng danh sách ảnh, Then chỉ tệp thật được đọc, tối đa 4 ảnh, các ảnh bị bỏ được đếm theo lý do; bài không còn ảnh thì không có yêu cầu nào tới Gateway và không có dòng nhãn.
- **AC-3** (cross-layer) Given bài chỉ-ảnh ghép có chữ là URL zdn, chữ có SĐT, dòng stg có `group_name`/`sender_name`/`sender_id`/`conversation_id`, When gọi Haiku qua Gateway giả ghi thân yêu cầu, Then thân có ảnh base64 đúng byte tệp; có 0 chuỗi `zdn.vn`, 0 URL, 0 SĐT, 0 giá trị của các trường kia, 0 `snapshot_id`, 0 tên tệp. Chữ còn lọt URL vào hàm gọi thì không có yêu cầu nào đi và dòng nhãn mang `error_kind = lo-url`.
- **AC-4** (cross-layer) Given trả lời hợp lệ, When chạy lệnh trên DB local trong ROLLBACK, Then `silver_labels` có một dòng mỗi `post_id` với `prompt_version = vlm-s03-v1`, `probabilities.nguon = "anh"`, giá, loại hình thuộc sổ từ vựng, số ảnh riêng, số ảnh ghép, lý do thiếu; dòng chữ KC1 của cùng bài vẫn còn; hai bài cùng chữ khác `post_id` ra hai dòng; chạy lại thêm 0 dòng và 0 lần gọi với dòng tốt; dòng lỗi được đọc lại và thay bằng kết quả tốt; `quote` đã gạt SĐT, `quote_ok` là NULL.
- **AC-5** (cross-layer) Given một lô chạy thật trên DB local với backend giả trong ROLLBACK, When đối chiếu trước và sau, Then băm `sale_offer_records`, `sale_offers`, `properties`, `listing_records`, `stg_zalo_posts`, `media` không đổi và `silver_labels` không có trong `FILL` của `pipeline/sync-cloud.mjs`.
- **AC-6** (cross-layer) Given trả lời JSON hỏng, giá trị ngoài từ vựng, giá không phải số, lỗi 401/500, When chạy CLI thật một lô, Then bài đó thành `unknown` hoặc trường rỗng kèm `error_kind`, lô đi tiếp, `ai_calls` có đủ dòng; trần `--tran-usd` dừng trước bài vượt và thoát mã 4; `--thu` không đổi số dòng `silver_labels`; `--model` khác `haiku` thoát mã 2.
- **AC-7** (cross-layer) Given phiếu do `--rut-mau` thật sinh rồi điền đáp án biết trước, gồm bài có giá, bài ghi rõ «không có giá», ô bỏ trống, bài đánh dấu «ảnh không thuộc bài», When chạy `--gold` với Gateway giả, Then lệnh in cho giá: số bài có giá, tỉ lệ đúng trên các bài đó (lệch ≤ 1%, model trả rỗng là sai), số bài không có giá mà model đọc ra giá; cho loại hình: tỉ lệ đúng trên bài đã gắn; tách ảnh riêng và ảnh ghép, số ô trống bị loại, số «ảnh không thuộc bài»; cờ đạt 90% cho từng thước và «chưa đủ mẫu» khi dưới 30 bài có giá; không đổi số dòng `silver_labels`; không in chữ bài.
- **AC-8** (cross-layer) Given DB có dòng nhãn ảnh tốt, dòng lỗi và bài chưa đọc, When chạy `pipeline/vlm-anh-s03.mjs --dem` và `--rut-mau`, Then `--dem` in tập đọc theo từng lý do, số bài có nhãn tốt (`error_kind` rỗng và có giá hoặc loại hình), số dòng lỗi, số chưa đọc, và tệp không có mã gọi model; `--rut-mau` ra phiếu tái lập được với cùng seed, không chứa dự đoán model, chỉ ghi trong `research-local/`, mỗi bài ghi ảnh riêng hay ảnh ghép.
- **AC-9** (judgment) Given lô thử thật 100 bài trần 1 USD qua Gateway ghi DB local, When đọc `docs/research/s03-vlm-anh-do.md`, Then báo cáo nêu số bài có nhãn ảnh trước và sau, tỉ lệ JSON hỏng, số `lo-url`, số dòng có giá, chi phí thật, ước chi phí hết tập đọc, và không có chữ bài hay tên nguồn thật.

## Coverage

Trục rút từ quét hình thái, preset entity-feature đổi sang đối tượng «một bài cần đọc ảnh».

- Trục A — Chữ của bài: thiếu giá | thiếu dấu hiệu | thiếu loại hình | đủ | Yêu cầu | chỉ-ảnh [thước CE: `pipeline/transform-zalo.mjs`, `pipeline/lib/gop-anh.mjs`, số đo DB 02/11] → AC-1.
- Trục B — Ảnh: nguồn riêng | nguồn ghép | tệp tốt | entry lỗi | thiếu tệp | đường xấu | quá cỡ | sai định dạng | quá số lượng [thước CE: `pipeline/media-rows.mjs`, số đo 500 tệp, NGÀNH: giới hạn 5 MB mỗi ảnh của tài liệu Claude Vision] → AC-2.
- Trục C — Rời máy: ảnh | chữ | URL | SĐT | trường nhóm/người | định danh snapshot [thước CE: AGENTS.md luật 6, ô cơ hội] → AC-3.
- Trục D — Kết cục một bài: nhãn tốt | JSON hỏng | giá trị lạ | lỗi mạng | trần chi phí [thước CE: Coverage KC1 trục B] → AC-4, AC-6.
- Trục E — Lớp đo: ma trận giả | DB ROLLBACK | lô thật | phiếu người [thước CE: ngưỡng của ô cơ hội] → AC-5, AC-7, AC-8, AC-9.

Later: bài chỉ-ảnh không gán (KC4), chạy hết bài cũ, lịch đêm. Never: đọc ảnh bằng URL gốc (URL có hạn, ngưỡng 0 URL).

## Đường đo

- Đọc đúng giá và loại hình ≥ 90% (định nghĩa ở Hỏi-3): từ `agent/scripts/vlm-anh-run.ts --gold` trên phiếu Mạnh gắn · AC-7, AC-8 bảo đảm lệnh và phiếu; số thật có ở Cổng Giá trị.
- Số bài chữ không đủ có nhãn bạc tăng: từ `pipeline/vlm-anh-s03.mjs --dem` trước và sau lô, chỉ đếm nhãn tốt · AC-8, AC-9.
- 0 URL zdn bị gửi: từ Gateway giả ghi thân yêu cầu và đếm `lo-url` của lô thật · AC-3, AC-9.

## Out of scope

- Ghi nhãn vào canonical hay `stg_*`; PL5 đọc nhãn ảnh để đổi tin — vòng sau (luật 7).
- Bài chỉ-ảnh có tệp mà không gán được vào bài chữ (3.538 bài) — KC4.
- Tải lại ảnh đã lỗi: hơn một nửa bài chỉ-ảnh (10.023/19.520) không có tệp trên đĩa — làn thu, báo riêng.
- Chạy hết tập đọc và lịch chạy đêm — quyết sau khi có số đo và chi phí thật.
- Migration tách cột giá, loại hình, nguồn — khi PL5 cần đọc.
- Decisions API đọc ảnh — SDK không có đầu vào ảnh; Qwen local và GLM-V không dùng được theo ghi chú hàng.
- Thu nhỏ ảnh, gạt chữ in trên ảnh, sửa tệp cũ trong `agent/`.

## Notes

Số ≥ 90% cần phiếu người gắn nên không phải điều kiện S4: S4 chứng minh lệnh đo đúng, số thật vào Cổng Giá trị (Hỏi-1).
