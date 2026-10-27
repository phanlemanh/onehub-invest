# Chuẩn hoá từ ngữ «tin» ↔ «listing» (27/10)

Mạnh giao (27/10): soát chỗ lệch giữa «listing» và «tin», tự quyết đổi ở đâu cho chuẩn nhất, và sửa từ gốc
**khi dữ liệu còn ít**. Để lâu, sửa gốc sai sẽ tốn công hơn nhiều. Bảng chuẩn đã chép vào `CONTEXT.md` (mục
«Tài sản & tin»). Tệp này là căn cứ: soát gì, lệch ở đâu, quyết gì, làm khi nào.

## 1. Gốc của lệch

RESO gọi một bản ghi resource `Property` là **một lần niêm yết (listing)**, với khoá `ListingKey`. Hiểu theo
RESO thì «listing» chính là **tin rao** của ta. Sản phẩm thì dùng «Listing» cho **chỗ cho thuê ngắn hạn
tự thu** (Airbnb), cả ở nhãn UI, ở bảng `listings`, ở `/api/v1/listings` lẫn slug `listings`. Hai nghĩa
cùng sống trong kho, và mỗi khi ai đó chép tên trường RESO thành tên cột của ta thì nghĩa thứ hai lại
chui vào.

Kho đã có sẵn một lệ giải: `offer_id` ↔ RESO `ListingKey` (reso-khung §2). Code gọi tin là `offer`, còn tên
RESO chỉ nằm ở cột đối chiếu. Việc chuẩn hoá ở đây là **biến lệ đó thành luật**, rồi sửa những chỗ đi trái
luật.

## 2. Luật (chép vào CONTEXT.md)

1. **`listing` trong code, bảng, API và URL chỉ dành cho chỗ cho thuê ngắn hạn** (Airbnb, S01/S02).
2. **Tin rao trong code là `offer`** (`offer_id`, `offer_status`, `property_offers`, `/api/v1/offers`). Tên RESO
   `Listing*` (`ListingKey`, `ListingId`, `ListingAgreement`…) chỉ nằm ở cột RESO của `mappings.yaml`,
   reso-khung và ADR. Không bao giờ dùng chúng làm tên cột hay tên trục của ta.
3. **«Tin» là khái niệm cha** của tin rao và listing: lớp giữa của «tin → căn» (ADR-0013 §1), RESO `Property`.
   Kiến trúc và FRAMING gọi lớp này là «Tin», không phải «tin đăng».
4. **Chữ UI**: «Listing» = Airbnb. Tin bán/thuê là «Tin rao»; «Tin» đứng một mình chỉ dùng khi chỗ đó chỉ có tin
   rao (cột bảng tin, thẻ «Tin A» / «Tin B»). Bài thô trong nhóm là «Bài». Không gọi tin bán/thuê là «listing».

## 3. Bảng chuẩn

| Khái niệm | Nhãn UI | Nhãn ngắn | Code | Bảng | API / slug | RESO |
|---|---|---|---|---|---|---|
| Bản ghi niêm yết từ nguồn (khái niệm cha của hai dòng kế) | Tin | — | — | `sale_offers` + `listings` | — | resource `Property` |
| Bài thô trong nhóm cộng đồng | Bài | — | `post` | `stg_zalo_posts` | — | — |
| Tin bán hoặc cho thuê dài hạn đã chuẩn hoá | Tin rao | Tin | `offer` | `sale_offers` → `offers` (Đ2) | `/api/v1/offers` | resource `Property` · `ListingKey` ↔ `offer_id` |
| … có `kind = sale` | Tin bán | — | `kind = sale` | — | — | PropertyType Residential… |
| … có `kind = rent_lt` | Tin cho thuê | — | `kind = rent_lt` | — | — | ResidentialLease + Monthly |
| Ý định của một bài/tin (rao · tìm · không phải tin) | Ý định tin | — | `offer_intent` (Đ1) | cột ở PL5 | — | local extension (gần nhất `SavedSearch`) |
| Chỗ cho thuê ngắn hạn tự thu | Listing | — | `listing` | `listings`, `listing_records` | `/api/v1/listings` · `listings` | không có mô hình STR, là local extension |
| Một căn nhà (gộp nhiều tin) | Căn nhà | Căn | `property` | `properties` | — | UPI + resource `Building` |

## 4. Lệch và quyết định

| Mã | Chỗ | Lệch | Quyết định | Tầng | Khi nào | Để lâu thì |
|---|---|---|---|---|---|---|
| **Đ1** | trục `listing_intent` (`offer · wanted · not_listing`): `pipeline/mappings.yaml`, ba tệp `vocab.generated`, seed `ref_lookup` (043), test sổ, ADR-0013 §9, reso-khung, PL5 | «listing» theo nghĩa RESO, trái luật 1–2 | **Đổi ngay** → `offer_intent`, `not_listing` → `not_offer`; nhãn giữ nguyên | T3 (migration) | trước PL5 | Hiện cột chưa có, chưa dòng nào mang giá trị. Sau PL5 phải đổi tên cột, CHECK, transform, phát biểu đã ghi, và schema cloud |
| **Đ2** | bảng `sale_offers` / `sale_offer_records`, code `sale_offer` | Chứa cả tin cho thuê (`rent_lt`) nên chữ «sale» sai nghĩa. API (`/api/v1/offers`) và cột (`offer_id`) thì đã gọi là `offer` | **Đổi** → `offers` / `offer_records`, giữ view tương thích `sale_offers` trong một kỳ | T3, hàng riêng | sau khi các dãy đang chạy khép | Đổi tên bảng không tốn theo số dòng (chỉ là metadata). Cái tăng theo thời gian là số chỗ code gọi tên: hôm nay khoảng 120 tệp code (app 23 · data-api 8 · pipeline 39 · agent 10 · db 17 · scripts 15), collector 0 |
| **Đ3** | CONTEXT.md: «Tin» chưa có trong khai báo; «Listing» chưa ghi rằng có nghĩa RESO khác | Hai nghĩa không ghi rõ | Thêm khối **Tin** (khái niệm cha + nhãn ngắn), ghi luật 1–4 ở **Listing**, thêm _Avoid_ «listing bán», «listing thuê dài hạn» (không thêm «listing» trơn hay «tin listing»: bộ quét chữ Ops sẽ đỏ trên trang Airbnb và trên «Thông tin listing»). Kèm: «gửi tin» → «gửi tin nhắn» (Khoá an toàn), «tách tin»/«các tin gần đây» → bài (Quy định ngữ cảnh) | T1 | PR này | — |
| **Đ4** | FRAMING §1, §2, §3.1, §5 («tin đăng» ×5, «mạng lưới listing»), ADR-0013 Bối cảnh + §1, reso-khung §1 + §6, ROADMAP §3 #13 | Dùng từ đã nằm trong _Avoid_ và «listing» theo nghĩa RESO | «tin đăng» → «tin rao» hoặc «tin» (lớp), «mạng lưới listing» → «mạng lưới tin rao». Chỉ đổi chữ, không đổi nghĩa; FRAMING ghi nhật ký §9 | T1 | PR này | — |
| **Đ5** | `/ops/collections` › Luồng 7 ngày: nút chế độ «Tin Cộng đồng» | Chế độ này vẽ cả bài thô lẫn tin rao, nên «Tin» lẫn với «Bài» | → «Cộng đồng» (cặp nút «Listing» / «Cộng đồng») | đi cùng Đ1 | cùng hàng Đ1 | — |

## 5. Không đổi, và vì sao

- **«Listing» cho Airbnb** (nhãn, bảng `listings`, `/api/v1/listings`, `listing_records`, `stg_*listings`): nhãn sản
  phẩm đã quen, và Airbnb cũng gọi chính chỗ ở là listing. Luật 1 giữ nghĩa này một mình; đổi đi thì tốn mà
  không thêm gì.
- **Chữ trong prompt LLM** («tin đăng» ở `agent/src/agents/enrich-text.ts`, `judge-entity.ts`,
  `pipeline/scripts/bench-gate.mjs`): đây không phải nhãn UI. Đổi chữ prompt có thể đổi hành vi model nên phải đo
  lại bench. Để đến lần sửa prompt kế tiếp có bench.
- **Hồ sơ lịch sử** (`_acceptance/**`, `docs/superpowers/**`, bản phạm vi đã cắt, nhật ký): là bản ghi tại thời
  điểm viết, không sửa ngược.
- **`docs/research/**`, `docs/architecture/classification-enrich-review.md`**: nhắc `listing_intent` như một
  đề xuất có ngày. Bỏ qua ở Đ1, trừ reso-khung (bảng field đang sống, theo ADR-0013).
- **Nhãn vai nguồn «Rao vặt công khai»** (S06): tên vai, đã nằm trong _Allow_.

## 6. Còn mở

- Bản thô của S06 (`stg_chotot_ads`) chưa có tên: «Bài» hiện chỉ định nghĩa cho nhóm cộng đồng. Đặt khi một
  trang Ops cần hiện nó.
