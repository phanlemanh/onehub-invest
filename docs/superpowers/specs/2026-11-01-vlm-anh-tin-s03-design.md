# Thiết kế: VLM đọc ảnh tin S03 (KC3 `vlm-anh-tin-s03`)

Hồ sơ: `_acceptance/vlm-anh-tin-s03/` · Dựng trên KC1 (`nhan-bac-model-lon-s03`) · Mạnh duyệt Cổng Đáng 02/11.

## Mục tiêu

Bài S03 mà chữ không đủ (thiếu giá, dấu hiệu BĐS hoặc loại hình) nhưng có ảnh rao: model đọc ảnh và ghi thêm một dòng nhãn
bạc nguồn «ảnh». Nhãn bạc là đề xuất, không ghi canonical (luật 7). Ảnh lấy từ bản đã tải về máy, gửi base64, không kèm tầng A.

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

Ba điều lệch so với câu vì sao của hàng:

- ~16.000 của hàng là mô phỏng RM1 trên mọi bài. Tập đọc được thật là 2.392 bài chữ.
- Cột `media_files` có dòng không đồng nghĩa có ảnh: nhiều entry là tải lỗi. Chưa tới một nửa bài chỉ-ảnh (9.497/19.520) có tệp
  trên đĩa. Đây là việc của làn thu, ngoài vòng này.
- Phần lớn bài chỉ-ảnh có **chữ chính là URL zdn**. Gửi chữ nguyên trạng sẽ làm hỏng ngưỡng «0 URL zdn», nên chữ gửi model phải
  bỏ URL trước.

Ảnh xem thử có sơ đồ phân khu không có giá: tỉ lệ ảnh mang giá chưa biết, nên «đúng» không được tính bài cùng rỗng (mục Đo).

## Thiết kế

```
stg_zalo_posts ─ loadStgPosts (gạt bài thử)
   └ pipeline/lib/vlm-anh.mjs      thuần: lý do thiếu, ghép ảnh (ganBaiAnh), đường tệp (localFile), kiểm tệp, chữ sạch URL
   ├ pipeline/vlm-anh-s03.mjs      CLI không gọi model: --dem (đường đo) · --rut-mau (phiếu gắn tay, seed cố định)
   └ agent/src/agents/vlm-anh-s03.ts  hỏi Haiku bằng generateText + phần ảnh base64, chặn URL trước khi gửi
        └ agent/scripts/vlm-anh-run.ts CLI: --model haiku --limit --since --thu --tran-usd --gold
              └ silver_labels (SQL_GHI của KC1), ai_calls (recordCallDb)
```

**Chọn bài.** Đơn vị là bài chữ, cộng ảnh riêng của nó và ảnh các bài chỉ-ảnh `ganBaiAnh` gán vào (cùng luật PL28). Theo Hỏi-4, mặc định gồm cả ảnh ghép và nhãn ghi số ảnh mỗi loại. Lý do thiếu:
`thieu_gia` (parsePost không ra giá) · `thieu_dau_hieu` (`coDauHieuBds` sai) · `thieu_loai_hinh` (không có từ loại hình và
không có số phòng). Yêu cầu (`laYeuCau`) bị loại. Bài chỉ-ảnh không gán được thuộc KC4.

**Ảnh.** Chỉ đọc đĩa qua `localFile` (đã chặn `..`) và `SNAPSHOTS_DIR`. Bỏ ảnh khi: entry lỗi, thiếu tệp, quá 5 MB, byte đầu
không phải JPEG/PNG/WEBP. Tối đa 4 ảnh một bài (p95), lấy theo thứ tự. Không còn ảnh thì không gọi model. Không có đường nào
lấy ảnh từ URL.

**Gửi đi.** Một tin gồm chữ đã qua `stripPII` và đã bỏ URL, cộng các phần ảnh base64. Không gửi `group_name`, `sender_*`,
`conversation_id`, `snapshot_id`, tên tệp. Hàm chặn soát phần chữ của yêu cầu ngay trước lúc gọi: còn `http`/`zdn.vn` thì không
gửi, ghi `error_kind = lo-url`. Thêm một lớp ở `fetch` là thừa, vì phép đo Gateway giả đã soát thân yêu cầu thật.

**Ghi.** `silver_labels` qua `SQL_GHI`, `prompt_version = vlm-s03-v1`, `text_hash` của bài chữ. Khoá duy nhất có
`prompt_version` nên dòng ảnh sống cạnh dòng chữ của KC1. `probabilities` = `{nguon:"anh", price_vnd, property_type, so_anh,
so_anh_ghep, ly_do:[…]}`. `quote` là chữ đọc trên ảnh đã qua `stripPII`; `quote_ok = NULL` vì không có chuỗi để so. Khoá có `post_id`,
nên bài đăng lại cùng chữ vẫn có dòng riêng. Dòng tốt không đọc lại. Dòng lỗi được đọc lại ở lượt sau và thay bằng kết quả tốt, bằng câu
ghi riêng `ON CONFLICT … DO UPDATE … WHERE silver_labels.error_kind IS NOT NULL`; lỗi tạm không khoá bài vĩnh viễn.

**Đo.** Phiếu có lựa chọn rõ «không có giá» và «ảnh không thuộc bài»; ô trống bị loại khỏi mẫu số và được đếm. `--gold` không
ghi DB. Thước giá tính trên bài CÓ giá trong ảnh: lệch ≤ 1% là đúng, model trả rỗng là sai. Bài không có giá mà model đọc ra giá báo
riêng. Dưới 30 bài có giá thì báo «chưa đủ mẫu», không kết luận. Tất cả tách ảnh riêng và ảnh ghép. `--dem` chỉ đếm nhãn tốt
(không lỗi, có giá hoặc loại hình), in dòng lỗi riêng, nên một lô hỏng không làm số tăng.

## Vì sao không

- **Decisions API**: `experimental_evaluate` chỉ nhận `state` JSON và câu hỏi choice/score/boolean, không có phần ảnh, không trả
  được số giá. Ngưỡng là «Haiku hoặc Decisions», nên vòng này đo Haiku.
- **Migration thêm cột**: chạm `db/migrations/**` (ngoài ranh giới, lên T3), trong khi `probabilities jsonb` đủ cho giai đoạn đo.
  Khi PL5 cần đọc thì tách cột bằng backfill từ jsonb.
- **Lớp model trong pipeline**: pipeline không có gói `ai`, và Mạnh chốt dùng lại lớp AI SDK của `agent/`.
- **Thu nhỏ ảnh**: p95 654 KB, dưới hẳn trần 5 MB; thêm phụ thuộc xử lý ảnh chưa có số đo chứng minh (luật 11).

## Chi phí

Lô thử 100 bài và phiếu 60 bài dùng chung trần 1 USD. Ước chạy hết tập đọc tính từ chi phí thật của lô thử, ghi ở `docs/research/s03-vlm-anh-do.md`.
Chạy hết bài cũ không thuộc vòng này.

## Ngoài phạm vi

Xem `## Out of scope` của hợp đồng.
