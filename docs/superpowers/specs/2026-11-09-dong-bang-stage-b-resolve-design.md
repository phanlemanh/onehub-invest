# Đóng băng Stage B và thẻ Ghép căn — thiết kế

Hàng `dong-bang-stage-b-resolve` (dãy P3, đợt dot0-cam-mau). Câu giao: V7 của bản tổng hợp «gắn căn» 08/11 — «Đóng băng
Stage B + thẻ entity_match (duyệt không ghi gì; không vá — DB1/GC thay)», theo quyết định Q1 của Mạnh: gắn căn = nhận diện
duy nhất (`docs/product/FRAMING.md` §3.4, dòng «Gắn căn = nhận diện duy nhất (Mạnh chốt 08/11)»). Spec gắn căn ghi cùng
việc: `docs/superpowers/specs/2026-11-08-gan-can-dinh-danh-duy-nhat-design.md` §2 («đóng băng Stage B (V7)»).

## 1. Hiện trạng (đo DB máy thu 09/11, chỉ đọc)

- `pipeline/resolve-properties.mjs` Stage B chạy mỗi đêm trong `scripts/chotot-daily.sh` (bước `resolve-properties`):
  xoá mọi cặp `pending`/`needs_llm` của `property_candidates`, rồi dựng lại cặp tin S03/S05 ↔ tin S06 «cùng phường, diện
  tích lệch dưới 15%, giá/m² lệch dưới 20%». Đây là «giống nhau», không phải «là cùng một» — trái Q1.
- `agent/scripts/judge-run.ts` (chạy tay, không có lịch) chấm cặp `needs_llm` và gieo thẻ `review_queue`
  `item_type = 'entity_match'` («Ghép căn» ở `/ops/review`); nó cũng tự rút thẻ khi một bên rời kho.
- Duyệt thẻ (`/api/v1/ops/review/[id]/decide`) chỉ đổi `property_candidates.status` sang `merged`/`rejected`/`pending`;
  không bước nào đọc `merged` để ghi `property_offers` — duyệt không gắn tin vào căn nào.
- Số: 748 cặp (558 `needs_llm`, 190 `pending`); thẻ Ghép căn 7 đang chờ (mới nhất 30/10), 1 duyệt, 11 bác; 11 dòng audit.
- Bên đọc thẻ đang chờ: hàng duyệt (`app/src/lib/ops/review-nap.ts`), ba số đầu trang (`review-dau-trang.ts`), đếm theo
  loại cho vai viewer (`components/ops/review-content.tsx`), số «Hàng duyệt» của trang dòng chảy
  (`lib/data-flow-queries.ts`), H1 của báo cáo ngày (`scripts/bao-cao-ngay.mjs`), bản tin cloud (`scripts/lib/ops-local.mjs`
  `readReviewQueue`), «căn đang chờ ghép» ở Căn giá tốt (`review-cho-ghep.ts`), kiểm HD11 (`pipeline/do-the-duyet.mjs`).

## 2. Thiết kế

Đóng băng = dừng sinh, dừng hiện, giữ nguyên dữ liệu. Không vá luật cặp, không thêm cờ bật/tắt, không migration.

1. **Stage B không chạy.** Bỏ khối Stage B khỏi `chayResolve`: không câu nào chạm `property_candidates` (kể cả câu
   DELETE đầu khối). Thay bằng đúng một dòng log `Stage B: đóng băng (V7) — không dựng cặp mới`. Stage A giữ nguyên từng
   câu. 748 cặp cũ giữ nguyên làm lịch sử.
2. **judge-run không chấm.** Lối vào CLI (`main`) in `judge-run: Ghép căn đóng băng (V7) — không chấm, không gieo hay rút
   thẻ` rồi thoát 0, trước khi mở kết nối DB hay gọi model. Hàm `chamMotLuot` và test của nó giữ nguyên (đọc lại khi DB1/GC
   cần mẫu).
3. **Thẻ Ghép căn đang chờ không hiện, không đếm.** Một vị từ SQL dùng chung `THE_DONG_BANG_SQL =
   "(item_type = 'entity_match' AND status = 'pending')"` (tệp mới `app/src/lib/ops/review-dong-bang.ts`); mọi câu đọc thẻ
   ở §1 thêm `NOT <vị từ>`. `review-cho-ghep` trả rỗng (không còn thẻ chờ nào để báo). Bên đọc `.mjs` (bản tin cloud, HD11)
   chép đúng chuỗi vị từ; một test quét mọi câu `FROM|JOIN review_queue` của cây và so chuỗi vị từ giữa các nơi. Thẻ Ghép căn ĐÃ QUYẾT vẫn hiện ở «Đã quyết» và mở được bằng
   `?card=`.
4. **Không ghi dữ liệu.** Vòng không đổi dòng nào của `review_queue`, `property_candidates`, `property_offers`,
   `properties`; route decide không sửa (đường dẫn T3) — thẻ chờ không còn lộ ra nên không ai tới được nút duyệt.
5. **Tài liệu.** ROADMAP §2 as-built, `pipeline/CLAUDE.md` (dòng resolve-properties), `agent/CLAUDE.md` nếu nhắc judge-run.

Thay thế: danh bạ vật thể (DB1, `pipeline/danh-ba-vat-the.mjs`) và chuỗi gắn căn GC0–GC3 (bảng nối tin → nút) — hàng riêng,
không thuộc vòng này.

## 3. Lựa chọn và căn cứ

| # | Lựa chọn | Nguồn căn cứ |
|---|---|---|
| L1 | Đóng băng, không vá luật cặp | mục tiêu — FRAMING §3.4 «Gắn căn = nhận diện duy nhất»; spec gắn căn §2 |
| L2 | Giữ 748 cặp cũ, không xoá | một lối — xoá là khó đảo và mất mẫu cho DB1/GC |
| L3 | judge-run dừng ở lối vào CLI, giữ hàm | một lối — xoá tệp phá test đang xanh, không thêm gì |
| L4 | Không sửa route decide | một lối — đường dẫn T3; thẻ chờ đã không lộ ra |
| Hỏi-1 | 7 thẻ đang chờ: ẩn khỏi hàng chờ và mọi số đếm (khuyên) · để nguyên · máy đóng bằng một lượt ghi | chỉ người — nghĩa sản phẩm ở /ops/review |
| Hỏi-2 | Không thêm chữ báo trên /ops/review (khuyên) · thêm một Alert «Ghép căn đã đóng băng» | chỉ người — gu nhìn, ai cần biết |

## 4. Rủi ro

- Năm tệp test app gieo thẻ Ghép căn đang chờ qua bộ nạp (`ops-duyet-nhip`, `viewer-the-duyet`, `review-queue`,
  `ops-duyet-hop-hang-muc`, `the-duyet-du-can-cu`) — phải đổi mồi sang thẻ đã quyết hay loại thẻ khác, không nới phép đo.
- HD11 (`do-the-duyet`) sau đóng băng đo 0 thẻ → xanh rỗng; ghi rõ ở Known limits, không giả là «đủ dữ liệu».
- `s03-len-cong.itest` ca «tin cấp thị trường không thành cặp» thành đúng theo cấu tạo khi Stage B không chạy — ghi lại.

## Đặc tả UX

Bỏ (dòng sổ «bỏ đặc-tả-UX»): vòng không thêm hay đổi thành phần giao diện nào; danh sách và số đếm ít đi đúng các thẻ
Ghép căn đang chờ, trạng thái trống có sẵn của bảng lo phần còn lại.
