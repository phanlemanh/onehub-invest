# Thiết kế: VLM đọc ảnh tin S03 (KC3 `vlm-anh-tin-s03`)

Hồ sơ: `_acceptance/vlm-anh-tin-s03/` · Dựng trên KC1 (`nhan-bac-model-lon-s03`) · Mạnh duyệt Cổng Đáng 02/11.

## Mục tiêu

Bài S03 mà chữ không đủ (thiếu giá, dấu hiệu BĐS hoặc loại hình) nhưng có ảnh rao: model đọc ảnh và ghi thêm một dòng nhãn
bạc nguồn «ảnh». Nhãn bạc là đề xuất, không ghi canonical (luật 7). Ảnh lấy từ bản đã tải về máy, gửi base64.

Mạnh 02/11 sửa thiết kế, nguyên văn: «Sửa theo bốn đề xuất rồi dựng lại thẻ. Về phần lộ nguồn gắn nhãn chứ ko chặn. Để tôi xem xét và tìm giải
pháp sau.» Bốn đề xuất: gắn nhãn ảnh lộ nguồn · đo hai model · đọc thêm trường · đọc mỗi ảnh một lần. Cùng ngày Mạnh thêm: «Đo lường bổ sung DeepSeek V4.1 Flash (1017)».

## Số đo đầu vào (DB local 02/11, chỉ số)

| Thước | Số |
|---|---|
| Bài S03 thật / bài chữ / bài chỉ-ảnh | 51.180 / 31.660 / 19.520 |
| Bài chỉ-ảnh có tệp trên đĩa / gán được / không gán | 9.497 / 5.959 / 3.538 |
| **Tập đọc của vòng này**: bài chữ thiếu dữ kiện, không phải Yêu cầu, có ≥ 1 tệp ảnh | **2.392** |
| ... theo lý do (một bài có thể nhiều lý do) | thiếu giá 1.396 · thiếu dấu hiệu 619 · thiếu loại hình 1.530 (chỉ thiếu loại hình 844) |
| ... theo nguồn ảnh | chỉ ảnh riêng 1.643 · chỉ ảnh ghép 741 · cả hai 8 |
| ... chữ khác nhau | 1.743 |
| Tệp ảnh mẫu 500: định dạng / p50 / p95 / lớn nhất | jpg · 209 KB · 654 KB · 3,4 MB |
| Lượt ảnh của tập đọc / ảnh khác nhau / trong trần 4 ảnh | 3.708 / 911 / 3.262 (mọi lượt có `sha256`) |
| Ảnh chỉ một bài dùng / ảnh dùng chung / ảnh dùng từ 10 bài | 407 / 504 / 74 |
| Bài chỉ có toàn ảnh dùng từ 10 bài | 1.489/2.392 |
| Tập đọc thiếu diện tích / phòng ngủ / mã toà-căn | 1.562 / 1.464 / 1.150 |

Ba điều lệch so với câu vì sao của hàng:

- ~16.000 của hàng là mô phỏng RM1 trên mọi bài. Tập đọc được thật là 2.392 bài chữ.
- Cột `media_files` có dòng không đồng nghĩa có ảnh: nhiều entry là tải lỗi. Chưa tới một nửa bài chỉ-ảnh (9.497/19.520) có tệp
  trên đĩa. Đây là việc của làn thu, ngoài vòng này.
- Phần lớn bài chỉ-ảnh có **chữ chính là URL zdn**. Vì vậy chữ bài không đi kèm ảnh; hàm chặn vẫn soát phần chữ của yêu cầu.

Ảnh xem thử có sơ đồ phân khu không có giá: tỉ lệ ảnh mang giá chưa biết, nên «đúng» không được tính bài cùng rỗng (mục Đo).

Sáu ảnh lặp nhiều nhất gồm quảng cáo thương hiệu, sơ đồ dự án, ảnh rao thật kèm giá, ảnh nội thất, ảnh QR mời nhóm, phối cảnh. Lặp không đồng nghĩa
vô giá trị, nên máy không tự bỏ ảnh lặp mà ghi `so_bai_dung_chung`. Ảnh QR mời nhóm tự in logo và tên nguồn thật.

Gọi thử Qwen local ngày 02/11 trên 3 ảnh thu nhỏ, prompt thô (không phải số đo): 1–3 giây mỗi ảnh; phòng ngủ đúng 3/3, diện tích 1/1, dự án 2/2; **giá
0/3** dù cả ba ảnh có giá; toà-căn 1 đúng, 1 thiếu, 1 sai; loại ảnh sai cả 3. Nên phải đo nhiều model, chưa kết luận được bên nào.

## Thiết kế

```
stg_zalo_posts ─ loadStgPosts (gạt bài thử)
   └ pipeline/lib/vlm-anh.mjs      thuần: lý do thiếu, ghép ảnh (ganBaiAnh), đường tệp (localFile), kiểm tệp, gom theo sha256, gộp nhãn bài
   ├ pipeline/vlm-anh-s03.mjs      CLI không gọi model: --dem (đường đo) · --rut-mau (phiếu gắn tay, seed cố định)
   └ agent/src/agents/vlm-anh-s03.ts  hỏi model bằng generateText, mỗi lượt một ảnh base64, chặn URL trước khi gửi
        └ agent/scripts/vlm-anh-run.ts CLI: --model qwen|haiku|deepseek --limit --since --thu --tran-usd --gold
              └ silver_labels (SQL_GHI của KC1), ai_calls (recordCallDb)
```

**Chọn bài.** Đơn vị là bài chữ, cộng ảnh riêng của nó và ảnh các bài chỉ-ảnh `ganBaiAnh` gán vào (cùng luật PL28). Theo câu hỏi về ảnh ghép (Hỏi-1 trên thẻ), mặc định gồm cả ảnh ghép và nhãn ghi số ảnh mỗi loại. Lý do thiếu:
`thieu_gia` (parsePost không ra giá) · `thieu_dau_hieu` (`coDauHieuBds` sai) · `thieu_loai_hinh` (không có từ loại hình và
không có số phòng). Yêu cầu (`laYeuCau`) bị loại. Bài chỉ-ảnh không gán được thuộc KC4.

**Ảnh.** Chỉ đọc đĩa qua `localFile` (đã chặn `..`) và `SNAPSHOTS_DIR`. Bỏ ảnh khi: entry lỗi, thiếu tệp, quá 5 MB, byte đầu
không phải JPEG/PNG/WEBP. Gộp `sha256` trong bài rồi lấy tối đa 4 ảnh khác nhau (p95), theo thứ tự. Không còn ảnh thì không gọi model. Không có đường nào
lấy ảnh từ URL.

**Đọc một lần.** Đơn vị gọi model là một ảnh khác nhau theo `sha256`, không phải một bài. Trước lô, máy nạp kết quả ảnh đã đọc tốt từ `probabilities.anh` của
các dòng cùng model và `prompt_version`, ảnh đó không gọi lại. Không có bảng hay tệp đệm mới. Dòng ghi băm nội dung prompt; nội dung đổi mà bản giữ nguyên thì lệnh thoát mã 2, để số `--gold` luôn khớp
nhãn trong DB (prompt nhiều khả năng phải sửa, vì Qwen thử thô đọc giá 0/3). `so_bai_dung_chung` tính trên cả tập đọc tại lúc chạy, không theo lô.

**Gửi đi.** Một tin gồm câu hỏi cố định cộng đúng một ảnh base64. Vì ảnh dùng chung cho nhiều bài có chữ khác nhau, chữ bài không đi kèm; đổi lại model mất ngữ
cảnh của bài, có thể đoán loại hình kém hơn, và `--gold` sẽ cho thấy. Không gửi `group_name`, `sender_*`, `conversation_id`, `snapshot_id`, tên tệp. Hàm chặn soát
phần chữ của yêu cầu ngay trước lúc gọi: còn `http`/`zdn.vn` thì không gửi, ghi `error_kind = lo-url`. Thêm một lớp ở `fetch` là thừa, vì phép đo máy giả đã soát
thân yêu cầu thật.

**Ba model.** `--model qwen` đi `getModel("qwen27b-khong-nghi")` tới MTPLX trên máy, 0 đồng, không rời máy. `--model haiku` đi `getModel("haiku")` qua Gateway. `--model deepseek` đi Gateway với id ghim `deepseek/deepseek-v4.1-flash-1017`;
`agent/src/runtime/models.ts` bị U1-87 cấm sửa, nên `vlm-anh-s03.ts` tự tạo `createGateway` cùng biến môi trường. Dòng của các model sống cạnh nhau vì khoá duy nhất có `model`.

**Định tuyến Gateway.** Danh sách Gateway 02/11 (`/v1/models/<id>/endpoints`): DeepSeek 1017 có 22 nhà cung cấp, 11 bên `has_zdr` đúng, 4 bên nén `fp8`, giá vào $0,035–0,30 mỗi triệu token. Không ghim thì ảnh có thể tới bên không cam kết không giữ
dữ liệu, và hai lần đo có thể đi hai bên khác nhau, số không so được. Mọi yêu cầu Gateway đặt `zeroDataRetention` và `disallowPromptTraining`; DeepSeek thêm `only: ["baseten"]` (cam kết đủ, không nén `fp8`, sẵn sàng 99,996% một ngày, $0,30 vào, $1,20 ra). Baseten lỗi thì
ảnh mang `error_kind`, không tự chuyển sang bên khác. Cam kết là thông tin Gateway khai, máy không tự kiểm được. Suy nghĩ của model tắt như Qwen, vì việc chỉ cần JSON ngắn.

**Ảnh lộ nguồn.** Điểm ảnh có thể tự in logo hay tên nguồn thật, máy không gạt được. Model trả `lo_nguon` (đúng hoặc sai, không ghi tên), nhãn được lưu và đếm,
**không lớp nào lọc hay chặn theo nhãn**. Prompt và mã trong kho không chứa tên nguồn thật. Kế hoạch chạy giữ ảnh rời máy ở mức ít nhất: S4 và lô thử dùng Qwen; lần gửi cloud duy nhất
là `--gold` với `haiku` và `deepseek` trên phiếu mẫu, sau khi Mạnh đã xem từng ảnh. Lệnh model cloud trên lô vẫn chạy được về kỹ thuật, nhưng chạy khi nào là quyết định của Mạnh.

**Ghi.** `silver_labels` qua `SQL_GHI`, `prompt_version = vlm-s03-v1`, `text_hash` của bài chữ. Khoá duy nhất có
`prompt_version` nên dòng ảnh sống cạnh dòng chữ của KC1. `probabilities` = `{nguon:"anh", price_vnd, property_type, bedrooms_total, living_area_m2,
unit_number, building_name, subdivision_name, so_anh, so_anh_ghep, so_anh_lo_nguon, xung_dot:[…], ly_do:[…], anh:[{sha256, loai_anh, lo_nguon, so_bai_dung_chung,
price_vnd, property_type, bedrooms_total, living_area_m2, unit_number, building_name, subdivision_name}]}`. Tên trường theo RESO (ADR-0011, câu giao PL13). `loai_anh` thuộc
`bang-gia | chup-man-hinh | so-do | noi-that | qr-quang-cao | khac`. Trường cấp bài lấy giá trị khác rỗng duy nhất của các ảnh; hai ảnh trái giá trị thì trường rỗng và tên trường vào `xung_dot`, không đoán. Giá trị ngoài từ vựng hay giá không phải số chỉ làm trường đó rỗng và vào `truong_la`, ảnh
vẫn tính đã đọc tốt. Ảnh lỗi mạng hay JSON hỏng để lại `error_kind` trên dòng, kết quả ảnh tốt vẫn giữ, lượt sau chỉ gọi lại ảnh lỗi. Mỗi ảnh có `quote` riêng; cột `quote` là các `quote` nối lại, đã qua `stripPII`; `quote_ok = NULL` vì không có chuỗi để so. Khoá có `post_id`,
nên bài đăng lại cùng chữ vẫn có dòng riêng. Dòng tốt không đọc lại. Dòng lỗi được đọc lại ở lượt sau và thay bằng kết quả tốt, bằng câu
ghi riêng `ON CONFLICT … DO UPDATE … WHERE silver_labels.error_kind IS NOT NULL`; lỗi tạm không khoá bài vĩnh viễn.

**Đo.** Phiếu rút theo ảnh khác nhau, mỗi `sha256` một lần, phân tầng đều ba nhóm (ảnh dùng từ 10 bài, ảnh có lượt ghép, còn lại), nếu không mẫu bị ảnh lặp làm lệch và nhóm ghép có thể rỗng. Phiếu ghi đường mở ảnh,
số lượt riêng, số lượt ghép, bài đại diện (chọn theo seed, ưu tiên bài có ảnh qua ghép, để «không thuộc bài» đo được rủi ro ghép), và các lựa chọn «không có giá», «không có một giá» (bảng nhiều giá, chỉ có giá theo m²), «không thể hiện loại hình», «không thuộc bài», «lộ nguồn», ô cho
từng trường thêm; ô trống bị loại khỏi mẫu số, được đếm, và **không gửi đi**: ảnh chưa gắn không rời máy. `--gold` không ghi DB. Thước giá tính trên ảnh CÓ giá: lệch ≤ 1% là đúng, model trả rỗng là sai. Ảnh không có giá
mà model đọc ra giá báo riêng. Dưới 30 ảnh có giá thì báo «chưa đủ mẫu», không kết luận; khi đó rút thêm bằng `--rut-mau --n`. Ngưỡng 90% chỉ xét giá và loại hình; một model phải đạt cả hai thước mới tính đạt, mỗi thước cần ít nhất 30 ảnh. Trường thêm, nhãn lộ nguồn và tỉ lệ có trọng số theo số bài dùng chung
chỉ báo số. Mỗi lần gọi của `--gold` có dòng `ai_calls`, để biết đã gửi gì. Tất cả tách ảnh riêng và ảnh ghép. `--dem` chia tập đọc thành bốn nhóm tốt (không lỗi, có giá hoặc loại hình), rỗng, lỗi, chưa đọc, cộng lại bằng tập đọc, nên một lô hỏng không làm số tăng; thêm số bài lấp đúng lý do thiếu, tách nhóm bài chỉ có ảnh dùng từ 10 bài, và số bài có tập ảnh đã đổi. Ảnh đếm theo `sha256`. `--kiem-lo-that` thoát khác 0 khi chưa có lô thật.

## Vì sao không

- **Decisions API**: `experimental_evaluate` chỉ nhận `state` JSON và câu hỏi choice/score/boolean, không có phần ảnh, không trả
  được số giá. Câu này chỉ đúng với đường SDK qua Gateway: `docs/research/decision-models-landscape.md` ghi API gốc `/v1/decisions` nhận ảnh, chưa thử, và đường gốc cần lớp gọi riêng. Vòng này đo Qwen, Haiku và DeepSeek.
- **Bí danh `deepseek-v4.1-flash`**: bí danh có thể đổi bản sau lần đo; Mạnh nói rõ bản 1017 nên ghim id.
- **Lọc ảnh lộ nguồn**: Mạnh 02/11 chốt gắn nhãn, không chặn; giải pháp tính sau.
- **Bỏ ảnh lặp**: trong ảnh lặp có ảnh rao thật kèm giá; bỏ là mất dữ liệu. Ghi số bài dùng chung để PL5 cân nhắc.
- **Migration thêm cột**: chạm `db/migrations/**` (ngoài ranh giới, lên T3), trong khi `probabilities jsonb` đủ cho giai đoạn đo.
  Khi PL5 cần đọc thì tách cột bằng backfill từ jsonb.
- **Lớp model trong pipeline**: pipeline không có gói `ai`, và Mạnh chốt dùng lại lớp AI SDK của `agent/`.
- **Thu nhỏ ảnh**: p95 654 KB, dưới hẳn trần 5 MB; thêm phụ thuộc xử lý ảnh chưa có số đo chứng minh (luật 11).

## Chi phí

Lô thử 100 bài chạy Qwen local, 0 đồng. Trần 1 USD chung dành cho Haiku và DeepSeek chấm phiếu mẫu 60 ảnh ở Cổng Giá trị. Ước thời gian hết tập đọc tính từ lô thử, ước tiền nếu dùng model cloud tính từ lượt chấm phiếu, ghi ở
`docs/research/s03-vlm-anh-do.md`. Chạy hết bài cũ không thuộc vòng này.

## Ngoài phạm vi

Xem `## Out of scope` của hợp đồng.
