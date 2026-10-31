# Bảng so của thẻ ghép căn đọc giá trị sống — thiết kế (HD6, `the-so-doc-gia-tri-song`)

Hàng HD6 của lộ trình. Nguồn: audit hàng duyệt `docs/research/audit-hang-duyet-3010.md` §3.4 (H9, H10), hiển thị của H1;
hàng `the-so-doc-gia-tri-song` ở §5.1. Cổng Đáng: Mạnh quyết ở §7.1 («các điều còn lại theo đề xuất»).

## Vấn đề

- **H10:** `EntityMatchCard` dựng bảng so từ `evidence` chụp lúc sinh thẻ (`review-card.tsx`). Tin được bóc lại hay đã nghỉ
  thì thẻ vẫn hiện số cũ, cạnh căn cứ mới mà `loadReviewContext` đọc từ `sale_offers`.
- **H9:** `soGiaTri` coi `unknown` (loại hình chưa rõ) là một giá trị, nên «Chưa rõ ↔ Nhà riêng» thành **Lệch**. Đây là tín
  hiệu giả, nghiêng về «Khác căn»; đúng ra là **Thiếu**.
- **H1 (phần hiển thị):** 12 thẻ 22/10 trỏ tới Tin A đã đổi khoá. Hôm nay cả 12 đã quyết, nhưng thẻ không nói gì về chuyện
  tin rời kho.

## Cách làm

1. **`loadReviewContext` đọc thêm giá trị sống.** `CONTEXT_SQL` lấy thêm mười trường của bảng so từ `sale_offers` (giá,
   diện tích, giá/m², `phuong_raw`, PN, WC, loại hình, `street_raw`, `block_raw`, `floor_raw`). Đây là cùng nguồn mà bộ
   gieo thẻ (`agent/src/tools/native.ts`) đọc, nên giá trị sống và giá trị lúc chấm so được với nhau từng ô.
   `OfferContext` thêm khoá `ben`:
   - tin còn trong `sale_offers` → `ben` là `BenGhepCan`;
   - tin không còn → `ben: null` (rời kho).
2. **`EntityMatchCard` dựng bảng so từ `ben` khi có.**
   - Mỗi bên có `context.offer_x.ben` thì đọc giá trị sống.
   - Không có ngữ cảnh (thẻ dựng đứng riêng, hay ngữ cảnh đời trước thiếu khoá `ben`) thì đọc `evidence` như cũ.
   - Ô có giá trị sống khác giá trị trong `evidence` hiện thêm một dòng phụ `text-xs` muted «Lúc chấm: <giá trị>».
3. **`unknown` tính là Thiếu.** `soGiaTri` coi `unknown` như ô trống, nên hàng hiện nhãn So «Thiếu». Ô vẫn hiện «Chưa rõ»
   qua `RawLabel`, như hiện tại.
4. **Bên rời kho.**
   - Thẻ hiện `Alert` (thành phần đã cài, biến thể `warning`) đứng đầu thân thẻ: «Tin A không còn trong kho» hay «Tin B
     không còn trong kho» (cả hai bên thì hai dòng, mỗi bên một dòng). Không câu nào khác ngoài chữ của audit.
   - Ba nút quyết bị khoá (`disabled`) kể cả khi ô lý do đã có chữ.
   - Bên rời kho thì bảng so đọc `evidence` cho bên đó, vì không còn giá trị sống.

Không đổi: route decide (`app/src/app/api/v1/ops/**`, `t3_paths`) — đóng thẻ có tin rời kho là việc của hàng P3
`the-ghep-can-tin-roi-kho` (judge-run); thẻ bổ sung tin (`agent_output`); nhánh viewer và cloud của `/ops/review` (dừng
trước `loadReviewContext`).

## Đặc tả UX

<!-- ux-spec:start -->
- **Màn:** sheet chi tiết thẻ ghép căn ở `/ops/review` (vai `ops`/`admin`, máy thu). Không màn mới.
- **Khuôn IA đã chọn + căn cứ:** giữ khuôn của PL3 (bảng so → suy luận AI → ảnh/toàn văn → nút ở chân sheet). Một khuôn khả
  dĩ, không tra mẫu.
- **Trạng thái:**
  | Trạng thái | Hiện gì |
  |---|---|
  | Hai bên sống, khớp evidence | Bảng so như hôm nay, số đọc từ kho |
  | Hai bên sống, có ô đổi từ lúc chấm | Ô hiện giá trị sống + dòng phụ «Lúc chấm: …» |
  | Một bên rời kho | Alert warning đầu thân thẻ «Tin A không còn trong kho» + nút quyết khoá; bên đó đọc evidence |
  | Thẻ đã quyết, có bên rời kho | Alert như trên; khu nút là trạng thái đã quyết (không nút) |
  | Thẻ đứng riêng không ngữ cảnh | Như hôm nay (đọc evidence), không Alert |
- **Thành phần:** `Alert` (`@/components/reui/alert`, đã dùng ngay trên thẻ cho khối suy luận AI), `Badge` So có sẵn, chữ phụ
  `text-xs text-muted-foreground`. Không thành phần mới, không chuyển động mới.
- **Chữ:** «Tin A không còn trong kho», «Tin B không còn trong kho», «Lúc chấm: <giá trị>» — đều lấy từ câu giao của audit.
<!-- ux-spec:end -->

## Phép đo

Test `app/tests/the-so-gia-tri-song.test.tsx` (khuôn `the-duyet-du-can-cu.test.tsx`: lược đồ tạm, jsdom, ReviewCard thật,
bản đột biến cho chiều đỏ) + probe chỉ SELECT trên DB máy thu (bỏ qua có lý do dưới CI) + design gate hai tệp giao diện.
