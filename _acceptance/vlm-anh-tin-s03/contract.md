---
schema_version: 1
feature: VLM đọc ảnh tin S03 cho bài mà chữ không đủ và ghi thêm vào bảng nhãn bạc với nguồn «ảnh» — ảnh từ đĩa, mỗi ảnh khác nhau đọc một lần, đo Qwen local, Haiku và DeepSeek V4.1 Flash 1017; chữ và trường gửi đi không kèm tầng A, ảnh tự in tên nguồn thì gắn nhãn
slug: vlm-anh-tin-s03
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline, agent]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-01-vlm-anh-tin-s03-design.md
---

# Acceptance Contract: vlm-anh-tin-s03

## Context

KC3, dựng trên KC1. Mạnh duyệt Cổng Đáng 02/11 với ngưỡng: đọc đúng giá và loại hình ≥ 90% trên mẫu gắn tay, số bài chữ không
đủ có nhãn bạc tăng, 0 URL zdn hết hạn bị gửi đi. Tập đọc thật đo 02/11 là 2.392 bài chữ thiếu dữ kiện có tệp ảnh trên đĩa sau khi
ghép, gồm 3.708 lượt ảnh nhưng chỉ 911 ảnh khác nhau. Nhãn bạc là đề xuất, không ghi canonical (luật 7).

Mạnh 02/11, nguyên văn: «Sửa theo bốn đề xuất rồi dựng lại thẻ. Về phần lộ nguồn gắn nhãn chứ ko chặn. Để tôi xem xét và tìm giải pháp sau.»
Luật 6 chưa đổi: chữ và trường do máy gửi không kèm tầng A. Riêng điểm ảnh có thể tự in logo hay tên nguồn thật (ảnh QR mời nhóm, ảnh chụp màn
hình), máy không gạt được; vòng này gắn nhãn và đếm, không chặn, để Mạnh có số khi tìm giải pháp.

Mạnh 02/11, nguyên văn: «Đo lường bổ sung DeepSeek V4.1 Flash (1017)». Danh sách Gateway đo cùng ngày: `deepseek/deepseek-v4.1-flash-1017` nhận ảnh, có 22 nhà cung cấp, 11 bên cam kết không giữ dữ liệu.

## Criteria

- **AC-1** (cross-layer) Given bài S03 gồm: thiếu giá có ảnh riêng · thiếu dấu hiệu BĐS có ảnh gán từ bài chỉ-ảnh · thiếu loại hình có ảnh · đủ cả ba có ảnh · thiếu nhưng không ảnh · Yêu cầu có ảnh · bài chỉ-ảnh không gán · bài thử, When chọn bài cần đọc, Then chỉ ba bài đầu được chọn, mỗi bài mang đúng lý do thiếu và đúng danh sách ảnh.
- **AC-2** (cross-layer) Given entry ảnh gồm: tệp thật · entry có `error` · tệp không có trên đĩa · đường có `..` · tệp quá 5 MB · tệp không phải ảnh · entry thiếu `sha256` · nhiều entry cùng `sha256` trong một bài · bài có hơn 4 ảnh khác nhau, When dựng danh sách ảnh, Then chỉ tệp thật được đọc, gộp `sha256` trong bài trước rồi mới tính trần 4 ảnh, mỗi ảnh giữ mang `sha256` (thiếu thì băm từ byte tệp), các ảnh bị bỏ được đếm theo lý do; bài không còn ảnh thì không có yêu cầu nào tới model và không có dòng nhãn.
- **AC-3** (cross-layer) Given bài chỉ-ảnh ghép có chữ là URL zdn, chữ có SĐT, dòng stg có `group_name`/`sender_name`/`sender_id`/`conversation_id`, When gọi `--model haiku` và `--model deepseek` qua Gateway giả, `--model qwen` qua MTPLX giả, cùng ghi thân yêu cầu, Then mỗi yêu cầu có đúng một ảnh base64 đúng byte tệp cộng câu hỏi cố định; yêu cầu qua Gateway có cờ không giữ dữ liệu và không dùng để huấn luyện; yêu cầu DeepSeek ghi đúng model `deepseek/deepseek-v4.1-flash-1017` và chỉ cho phép nhà cung cấp Baseten; có 0 chữ bài, 0 chuỗi `zdn.vn`, 0 URL, 0 SĐT, 0 giá trị của các trường kia, 0 `snapshot_id`, 0 tên tệp. Phần chữ còn lọt URL vào hàm gọi thì không có yêu cầu nào đi và dòng nhãn mang `error_kind = lo-url`.
- **AC-4** (cross-layer) Given trả lời hợp lệ, When chạy lệnh trên DB local trong ROLLBACK, Then `silver_labels` có một dòng mỗi `post_id` và model với `prompt_version = vlm-s03-v1`, `probabilities.nguon = "anh"`, băm nội dung prompt, giá, loại hình thuộc sổ từ vựng, số phòng ngủ, diện tích, mã căn, toà, dự án, số ảnh riêng, số ảnh ghép, lý do thiếu, và mảng `anh` ghi kết quả và `quote` từng ảnh; dòng chữ KC1 của cùng bài vẫn còn; hai bài cùng chữ khác `post_id` ra hai dòng; chạy lại thêm 0 dòng và 0 lần gọi với dòng tốt; dòng lỗi được đọc lại và thay bằng kết quả tốt; đổi nội dung prompt mà giữ nguyên bản thì lệnh thoát mã 2; đổi bản thì có yêu cầu mới; cột `quote` là `quote` các ảnh nối lại, đã gạt SĐT, `quote_ok` là NULL.
- **AC-5** (cross-layer) Given một lô chạy thật trên DB local với backend giả trong ROLLBACK, When đối chiếu trước và sau, Then băm `sale_offer_records`, `sale_offers`, `properties`, `listing_records`, `stg_zalo_posts`, `media` không đổi và `silver_labels` không có trong `FILL` của `pipeline/sync-cloud.mjs`.
- **AC-6** (cross-layer) Given trả lời JSON hỏng, giá trị ngoài từ vựng, giá không phải số, lỗi 401/500, When chạy CLI thật một lô, Then ảnh lỗi mạng hay JSON hỏng để lại `error_kind` và lượt sau chỉ gọi lại ảnh đó; giá trị ngoài từ vựng hay giá không phải số chỉ làm trường đó rỗng, ghi vào `truong_la`, ảnh vẫn tính đã đọc tốt; lô đi tiếp, `ai_calls` có đủ dòng; trần `--tran-usd` dừng trước ảnh vượt và thoát mã 4, ở lô lẫn `--gold`, kể cả khi trả lời không kèm chi phí thì tính theo đơn giá đã khai; `--thu` không đổi số dòng `silver_labels`; thiếu `--model` hoặc `--model` ngoài `haiku`, `qwen`, `deepseek` thoát mã 2.
- **AC-7** (cross-layer) Given phiếu do `--rut-mau` thật sinh rồi điền đáp án biết trước, gồm ảnh có giá, ảnh ghi rõ «không có giá», ảnh ghi «không có một giá» (bảng nhiều giá, chỉ có giá theo m²), ảnh ghi «không thể hiện loại hình», ô bỏ trống, ảnh đánh dấu «không thuộc bài», ảnh đánh dấu lộ nguồn, When chạy `--gold` từng model với backend giả, Then chỉ ảnh đã gắn mới có yêu cầu tới model, ô trống 0 yêu cầu, mỗi lần gọi có dòng `ai_calls`; lệnh in cho giá: số ảnh có giá, tỉ lệ đúng trên các ảnh đó (lệch ≤ 1%, model trả rỗng là sai), số ảnh không có giá mà model đọc ra giá; cho loại hình: tỉ lệ đúng trên ảnh có thể hiện loại hình (model trả rỗng là sai); một model chỉ «đạt» khi đạt 90% cả hai thước, «chưa đủ mẫu» khi dưới 30 ảnh ở một thước; số báo không xét đạt: phòng ngủ, diện tích, mã căn, toà, dự án, loại ảnh, tỉ lệ có trọng số theo số bài dùng chung; số ảnh người đánh lộ nguồn và số model gắn đúng; tách ảnh riêng và ảnh ghép, «chưa đủ mẫu» riêng khi nhóm ghép dưới 15 ảnh, số ô trống bị loại, số «không thuộc bài»; không đổi số dòng `silver_labels`; không in chữ bài.
- **AC-8** (cross-layer) Given DB có dòng nhãn ảnh tốt, dòng rỗng, dòng lỗi và bài chưa đọc, When chạy `pipeline/vlm-anh-s03.mjs --dem` và `--rut-mau`, Then `--dem` in theo từng model và bản prompt: tập đọc theo từng lý do; số bài tốt (`error_kind` rỗng và có giá hoặc loại hình), rỗng, lỗi, chưa đọc, cộng lại bằng tập đọc; số bài lấp đúng lý do thiếu của nó (thiếu giá thì có giá, thiếu loại hình thì có loại hình); tách nhóm bài chỉ có ảnh dùng từ 10 bài; số bài có tập ảnh đã đổi sau lần đọc; số lượt ảnh, số ảnh khác nhau, số ảnh theo loại, số ảnh và số bài mang nhãn lộ nguồn (ảnh đếm theo `sha256`); và tệp không có mã gọi model; `--rut-mau` rút mỗi `sha256` tối đa một lần, phân tầng đều ba nhóm (ảnh dùng từ 10 bài, ảnh có lượt ghép, còn lại), ra phiếu tái lập được với cùng seed, không chứa dự đoán model, chỉ ghi trong `research-local/`, mỗi ảnh ghi đường mở ảnh, số lượt riêng, số lượt ghép, số bài dùng chung, và bài đại diện chọn theo seed, ưu tiên bài có ảnh này qua ghép.
- **AC-9** (cross-layer) Given lô thử thật 100 bài bằng `--model qwen` ghi DB local, không ảnh nào rời máy, When chạy `--dem --kiem-lo-that` và đọc `docs/research/s03-vlm-anh-do.md`, Then lệnh thoát 0 chỉ khi tập đọc lớn hơn 0, có ít nhất 1 dòng Qwen tốt và các nhóm cộng lại bằng tập đọc; báo cáo nêu số bài có nhãn ảnh và số bài lấp đúng lý do trước và sau, tỉ lệ JSON hỏng, số `lo-url`, số dòng có giá và có từng trường thêm, số ảnh theo loại, số ảnh mang nhãn lộ nguồn, số ảnh khác nhau so với số lượt, thời gian thật, ước thời gian hết tập đọc tính theo số `sha256` chưa đọc, và không có chữ bài hay tên nguồn thật.
- **AC-10** (cross-layer) Given ma trận: ba bài dùng chung một `sha256` · bài hai ảnh trả giá khác nhau · bài một ảnh có giá một ảnh rỗng · bài một ảnh tốt một ảnh lỗi 500 · ảnh mà model trả `lo_nguon: true`, When chạy một lô rồi lô thứ hai có thêm bài mới cùng ảnh đã đọc, Then số yêu cầu tới model bằng số `sha256` khác nhau và lô hai chỉ gọi ảnh chưa đọc tốt cùng model; mỗi bài vẫn có dòng riêng, mỗi ảnh ghi `so_bai_dung_chung` tính trên cả tập đọc; trường cấp bài lấy giá trị khác rỗng duy nhất, hai giá trị khác nhau thì rỗng kèm `xung_dot`; bài có ảnh lỗi giữ kết quả ảnh tốt, mang `error_kind`, lô sau đúng một yêu cầu; dùng lại cho `quote` khớp lượt đọc đầu; ảnh mang nhãn lộ nguồn vẫn được đọc, nhãn ghi `lo_nguon: true` và `so_anh_lo_nguon`, không lớp nào loại ảnh đó.

## Coverage

Trục rút từ quét hình thái, preset entity-feature đổi sang đối tượng «một bài cần đọc ảnh».

- Trục A — Chữ của bài: thiếu giá | thiếu dấu hiệu | thiếu loại hình | đủ | Yêu cầu | chỉ-ảnh [thước CE: `pipeline/transform-zalo.mjs`, `pipeline/lib/gop-anh.mjs`, số đo DB 02/11] → AC-1.
- Trục B — Ảnh: nguồn riêng | nguồn ghép | tệp tốt | entry lỗi | thiếu tệp | đường xấu | quá cỡ | sai định dạng | quá số lượng [thước CE: `pipeline/media-rows.mjs`, số đo 500 tệp, NGÀNH: giới hạn 5 MB mỗi ảnh của tài liệu Claude Vision] → AC-2.
- Trục C — Rời máy: ảnh | chữ in trong ảnh | chữ bài | URL | SĐT | trường nhóm/người | định danh snapshot [thước CE: AGENTS.md luật 6, ô cơ hội, ảnh QR đo 02/11] → AC-3, AC-10.
- Trục D — Kết cục một bài: nhãn tốt | JSON hỏng | giá trị lạ | lỗi mạng | trần chi phí | hai ảnh trái giá [thước CE: Coverage KC1 trục B] → AC-4, AC-6, AC-10.
- Trục F — Lặp ảnh: dùng một bài | dùng chung nhiều bài | đã đọc ở lượt trước [thước CE: `sha256` có ở 3.708/3.708 lượt ảnh, đo 02/11] → AC-8, AC-10.
- Trục G — Model: Qwen local | Haiku qua Gateway | DeepSeek V4.1 Flash 1017 qua Gateway [thước CE: `/v1/models` của MTPLX khai `supports_vision`, gọi thử 3 ảnh 02/11; danh sách model và nhà cung cấp của Gateway 02/11] → AC-3, AC-6, AC-7.
- Trục E — Lớp đo: ma trận giả | DB ROLLBACK | lô thật | phiếu người [thước CE: ngưỡng của ô cơ hội] → AC-5, AC-7, AC-8, AC-9.

Later: bài chỉ-ảnh không gán (KC4), chạy hết bài cũ, lịch đêm, 4.832 bài đủ ba điều kiện vẫn thiếu diện tích hay phòng ngủ, 120 bài có hơn 4 ảnh, SĐT người đăng gốc và mã kho in trong ảnh, giải pháp cho ảnh lộ nguồn (Mạnh tìm sau). Never: đọc ảnh bằng URL gốc (URL có hạn, ngưỡng 0 URL).

## Đường đo

- Đọc đúng giá và loại hình ≥ 90% (định nghĩa ở Hỏi-6): từ `agent/scripts/vlm-anh-run.ts --gold` trên phiếu Mạnh gắn, báo riêng Qwen, Haiku, DeepSeek, một model phải đạt cả hai thước · AC-7, AC-8 bảo đảm lệnh và phiếu; số thật có ở Cổng Giá trị.
- Số bài chữ không đủ có nhãn bạc tăng: từ `pipeline/vlm-anh-s03.mjs --dem` trước và sau lô, chỉ đếm nhãn tốt, kèm số bài lấp đúng lý do thiếu và tách nhóm ảnh dùng chung · AC-8, AC-9.
- 0 URL zdn bị gửi: từ Gateway giả ghi thân yêu cầu và đếm `lo-url` của lô thật · AC-3, AC-9.

## Out of scope

- Ghi nhãn vào canonical hay `stg_*`; PL5 đọc nhãn ảnh để đổi tin — vòng sau (luật 7).
- Bài chỉ-ảnh có tệp mà không gán được vào bài chữ (3.538 bài) — KC4.
- Tải lại ảnh đã lỗi: hơn một nửa bài chỉ-ảnh (10.023/19.520) không có tệp trên đĩa — làn thu, báo riêng.
- Chạy hết tập đọc và lịch chạy đêm — quyết sau khi có số đo và chi phí thật.
- Migration tách cột giá, loại hình, nguồn — khi PL5 cần đọc.
- Decisions API đọc ảnh (chờ Mạnh ở Hỏi-3) — đường SDK qua Gateway đang dùng không có đầu vào ảnh; API gốc `/v1/decisions` theo `docs/research/decision-models-landscape.md` nhận ảnh nhưng chưa thử. GLM-V vướng điều khoản theo ghi chú hàng.
- Đọc thêm ảnh mới của bài đã có dòng tốt — chỉ đếm là «tập ảnh đã đổi».
- Lọc hay chặn ảnh lộ nguồn — Mạnh chốt 02/11 gắn nhãn, giải pháp tính sau.
- Chạy Haiku hay DeepSeek trên lô thật — hai model cloud chỉ chấm phiếu mẫu; chạy lô bằng model cloud quyết sau khi có số.
- Thu nhỏ ảnh, gạt chữ in trên ảnh, sửa tệp cũ trong `agent/`.

## Notes

Số ≥ 90% cần phiếu người gắn nên không phải điều kiện S4: S4 chứng minh lệnh đo đúng, số thật vào Cổng Giá trị (Hỏi-2). S4 không gửi ảnh nào ra khỏi máy; lần gửi cloud duy nhất là Haiku và DeepSeek chấm phiếu sau khi Mạnh đã xem từng ảnh mẫu. S4 chỉ gọi máy giả nên chưa chứng minh model cloud chạy thật; lần chạy thật đầu tiên là lượt chấm phiếu.

- Known limits — chọn ở Cổng Bằng chứng 2026-11-02:
  - Ngoài-2: Gõ giá sai dạng trong phiếu thì ảnh đó lặng lẽ bị bỏ khỏi mẫu chấm, nên kết luận «đạt» có thể dựa trên mẫu nhỏ hơn người chạy tưởng.
  - Ngoài-3: Lượt chấm phiếu bằng model cloud chỉ có sổ ghi các lần gọi, không có nhật ký chi tiết từng ảnh đã gửi.
  - Ngoài-4: Phân loại ảnh dùng bộ tên tự đặt, chưa đối chiếu chuẩn ngành, nên các bước sau có thể phải đổi tên hoặc quy đổi lại.
  - Ngoài-5: Chữ chép từ ảnh có thể chứa tên nguồn thật và được lưu trong bảng nhãn nội bộ; bảng này không lên cloud, giải pháp lộ nguồn Mạnh tính sau.
  - Ngoài-6: Bộ kiểm phần chọn bài và đếm không chạy trong lượt kiểm chung của CI, chỉ chạy bằng lệnh riêng.
  - Ngoài-7: Lệnh mẫu chấm phiếu ghi đường dẫn tương đối không chạy được; người chạy cần đường dẫn đầy đủ.
  - Ngoài-8: Báo cáo đo nói mọi số lấy từ lệnh đếm, nhưng hai số trong đó không tái lập được bằng lệnh đã ghi.
  - Ngoài-9: Dịch vụ model lỗi tạm thời lúc chấm phiếu thì ảnh lỗi bị tính như model đọc sai, có thể ra «không đạt» mà lệnh vẫn báo thành công.
  - Ngoài-10: Cơ sở dữ liệu trục trặc thì ảnh vẫn được gửi ra cloud nhưng không có dòng sổ ghi lại và lệnh không báo lỗi.
  - Ngoài-11: Chạy lệnh chấm phiếu đúng như mẫu chỉ nhận về chữ «Error», không biết thiếu tệp hay hỏng phiếu.
  - Ngoài-13: Gõ sai ngày lọc thì lệnh không báo lỗi mà chạy trên mọi bài, tốn thêm thời gian so với dự định.
  - Ngoài-14: Ca kiểm bảng đếm không in chữ bài dùng dữ liệu vốn không có chữ, nên không phát hiện được nếu sau này bảng đếm lộ chữ bài.
