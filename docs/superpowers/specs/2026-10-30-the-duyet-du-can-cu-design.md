# the-duyet-du-can-cu — thẻ duyệt đủ căn cứ (PL3)

Ngày: 2026-10-30 · Dãy U1 · Hạng T3 · Hồ sơ `_acceptance/the-duyet-du-can-cu/` · Mã phủ C0.2, C0.3

## Vì sao

Câu giao PL3 (`docs/plan/lo-trinh.json`): «Người duyệt mở /ops/review và thấy mọi trường kèm căn cứ, ảnh tin và toàn văn
tin, không có «AI tự tin %», rồi quyết kèm lý do được ghi audit cùng giao dịch». Mạnh duyệt Cổng Đáng 30/10 (câu «Xếp
theo bốn làn»). Gốc ở review phân loại §2 L04 (thẻ thiếu căn cứ) và L15 (audit thủng).

Hiện trạng trên main `e182721f`, đo 30/10:

| Lỗ của L04/L15 | Hôm nay | Còn lại cho PL3 |
|---|---|---|
| «AI tự tin %» | UI1 (Q9) đã gọt `ai_confidence` và vế «tự tin NN%» của căn cứ | thẻ ghép căn vẫn hiện «Điểm B: 0.85» — chính là số L04 nói «không phải độ tự tin của ai cả» |
| Căn cứ từng trường | chỉ trường xung đột luật↔AI hiện căn cứ | trường không xung đột chỉ có giá trị; thẻ ghép căn không có căn cứ nào cho trường |
| Ảnh tin | NH1 (#192) đọc ảnh từ bảng `media` | ảnh chỉ tới vai quản trị; người duyệt vai Vận hành không thấy ảnh |
| Toàn văn | evidence lưu 300 ký tự đầu; Tin A cắt `line-clamp-2`; tên nhóm dính đầu đoạn tin | toàn văn có sẵn ở DB máy thu (S03 `stg_zalo_posts.text`, S06 `stg_chotot_ads.payload.body`) |
| Gợi ý mặc định | `agent/src/enrich/run.ts:143` gắn cứng `ai_suggestion = 'apply'` | bỏ ở bên ghi |
| Audit | TV1 đã ghi audit trong cùng transaction với quyết định | route không nhận lý do; `decision_note` có từ 029 nhưng 0 dòng có giá trị từ người |

## Phạm vi

PL3 là phần C0.2 + C0.3. Thẻ duyệt v2 (phát biểu theo lớp đủ mọi nguồn, đoạn trích tô trong toàn văn, bất đồng mọi cặp,
quyết định thành nhãn đo) là PL23 — `lo-trinh.json` cho PL23 `dung_tren: ["PL3", "PL16"]`. Dòng «PL3 gộp vào PL23» ở
§7.0 của review phân loại có trước lời Mạnh 30/10 xếp PL3 thành một làn riêng; vòng này theo lời 30/10 và lộ trình.

## Cách làm

1. **Căn cứ từng trường, đọc từ phát biểu (PL15).** `sale_offers.field_provenance` ghi cho năm trường trục
   (`property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw`) lớp căn cứ (`evidence_tier`) và phương pháp
   (`assertion_method`). Hàm thuần `lib/ops/review-can-cu.ts` biến nó thành nhãn CONTEXT.md («Sự thật · Trường có cấu
   trúc của nguồn», «Quan sát có trích dẫn · Bộ đọc tin», «Giá trị có trước — chưa có căn cứ»…). Trường ngoài năm trục
   (giá, diện tích, giá/m², phường, tầng) chưa có phát biểu: ô căn cứ ghi «Chưa ghi căn cứ — đọc từ tin». Không trường
   nào hiện thiếu ô căn cứ.
2. **Thẻ ghép căn = bảng so từng trường.** Thay hai khối `OfferCard` bằng một bảng: hàng = trường, cột = Tin A · Tin B ·
   So (Khớp / Lệch / Thiếu, tính tất định trong `review-can-cu.ts`). Mỗi ô giá trị kèm dòng căn cứ của tin đó. Bỏ «Điểm
   B». Suy luận của AI (`ai_suggestion` + `ai_reasoning`) hiện thành một khối nhãn «Suy luận của AI — không phải căn cứ»,
   đứng SAU bảng; không đổi thứ tự hay màu nút.
3. **Thẻ bổ sung tin.** Mọi trường đề xuất (xung đột hay không) hiện: trường · giá trị · phương pháp (Luật E1 / LLM E2) ·
   căn cứ (`basis` đã gọt độ tự tin); không có `basis` → «Chưa ghi căn cứ».
4. **Toàn văn.** Bộ tải `lib/ops/review-context.ts` đọc, trong MỘT truy vấn cho cả hàng duyệt, toàn văn và
   `field_provenance` của mọi tin trên thẻ: S03 bài mới nhất theo `post_ids`, S06 `payload->>'body'` theo
   `originating_system_key`; S05 và nguồn khác chưa có toàn văn ở máy thu → «Không có toàn văn ở máy thu». Tên nhóm
   (tầng C) là dòng meta riêng, không dính vào đoạn tin. Không cắt ký tự, không `line-clamp`; giữ xuống dòng. Evidence
   cũ trong `review_queue` không bị sửa.
5. **Ảnh tin cho người duyệt.** Theo Hỏi-1 (khuyến nghị): vai Vận hành trở lên thấy ảnh ĐÃ TẢI về máy thu (đi qua
   `/api/zalo-media`); ảnh chỉ có URL gốc (mang tên miền nguồn, tầng A) vẫn chỉ quản trị viên thấy, ô ảnh ghi một câu
   cho vai còn lại.
6. **Không gợi ý mặc định.** `agent/src/enrich/run.ts` ghi `ai_suggestion = NULL` cho thẻ bổ sung tin mới; thẻ không
   đọc `ai_suggestion` để chọn nút hay đổi kiểu nút. Dòng cũ đang mang `'apply'` không sửa (không ghi dữ liệu hàng loạt).
7. **Lý do.** Ô «Lý do» (`ui/field` + `ui/textarea`) ở chân sheet, trên hàng nút. Theo Hỏi-2 (khuyến nghị): bắt buộc cho
   mọi quyết định — nút tắt khi ô trống; route trả 400 khi `reason` vắng, toàn khoảng trắng hay dài hơn 1.000 ký tự,
   không đổi dòng nào. Lý do ghi vào `review_queue.decision_note` và `ops_audit.detail.ly_do` trong CÙNG transaction
   với quyết định; audit hỏng → ROLLBACK cả hai. Không migration (cột có từ 029).
8. **Vai và cổng không đổi.** Nhánh cloud và nhánh vai viewer giữ nguyên; bộ tải toàn văn + căn cứ chỉ chạy khi
   `xemNoiDungTin(user)`.

Ngoài vòng: đoạn trích tô trong toàn văn, phát biểu của mọi nguồn, nhãn đo từ quyết định (PL23); duyệt trên cloud
(TV13); sửa evidence/`ai_suggestion` cũ trong DB; phát biểu cho giá/diện tích/phường (ngoài trục PL15).

## Đặc tả UX

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: /ops/review (bảng hàng chờ) → bấm một hàng → sheet chi tiết: bảng trường kèm căn cứ, dải ảnh, toàn văn → gõ
  lý do → bấm quyết định → sheet báo «Đã …», bảng làm mới (điểm ra: bảng hàng chờ).
- Biên: tin không có toàn văn ở máy thu; trường không có phát biểu; tin không có ảnh đã tải; vai Vận hành gặp tin chỉ có
  URL ảnh gốc; thẻ đã quyết (ô lý do thành dòng chỉ đọc «Lý do: …»).
- Lỗi & quay lại: route trả lỗi → dòng «Lỗi: …» cạnh nút, lý do vừa gõ giữ nguyên, bấm lại được.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Sheet ghép căn | quyết hai tin có cùng căn không, kèm lý do | bảng hàng chờ / bảng hàng chờ |
| Sheet bổ sung tin | quyết áp hay bỏ giá trị đề xuất, kèm lý do | bảng hàng chờ / bảng hàng chờ |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-ghep-can-du | Sheet ghép căn | bảng trường Tin A/Tin B/So, mỗi ô có dòng căn cứ; ảnh; toàn văn hai tin | gõ lý do, quyết |
| ST-ghep-can-thieu-van | Sheet ghép căn | ô toàn văn «Không có toàn văn ở máy thu» | quyết theo bảng + ảnh |
| ST-bo-sung-du | Sheet bổ sung tin | từng trường đề xuất: phương pháp + căn cứ; xung đột hai bên | chọn bên (nếu xung đột), gõ lý do, quyết |
| ST-bo-sung-khong-can-cu | Sheet bổ sung tin | trường ghi «Chưa ghi căn cứ» | quyết hoặc Để sau |
| ST-anh-chi-goc | Sheet (vai Vận hành) | ô ảnh: «Ảnh của tin chỉ có ở nguồn — quản trị viên xem được» | quyết không ảnh |
| ST-ly-do-trong | Sheet | nút quyết tắt, gợi ý «Ghi lý do trước khi quyết» | gõ lý do |
| ST-loi-ghi | Sheet | «Lỗi: …» cạnh nút, lý do giữ nguyên | bấm lại |
| ST-da-quyet | Sheet | badge trạng thái + «Lý do: …» chỉ đọc | đóng sheet |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Lý do: bắt buộc, tối đa 1.000 ký tự (đếm hiện ở `FieldDescription`), cắt khoảng trắng hai đầu trước khi gửi.
- Toàn văn: giữ xuống dòng (`whitespace-pre-line`), `translate="no"`, không cắt; dài thì sheet cuộn (ScrollArea có sẵn).
- 390 px: bảng so giữ bốn cột, chữ xuống dòng trong ô; không cuộn ngang trang (design-pass đo khung bảng 357/357).
- Trường ngoài trục: câu «Chưa ghi căn cứ — đọc từ tin» đứng một lần ở cột Trường; trường trục mang căn cứ từng tin.
- Không có toàn văn ở máy thu: khối nói ra rồi hiện đoạn đầu đã lưu trên thẻ (nếu có).

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `ui/table` | dùng | bảng so trường, có sẵn |
| `ui/field` + `ui/textarea` | ghép | ô lý do có nhãn, mô tả, lỗi |
| `reui/badge` | dùng | Khớp/Lệch/Thiếu và lớp căn cứ |
| `ui/item` | dùng | trường đề xuất của thẻ bổ sung tin (đang dùng) |
| `ReviewPhotos` | dùng | dải ảnh đã có (UI1) |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: luồng hiển nhiên — UI1 đã dựng hàng chờ + sheet chi tiết theo `@reui/solution-agents-5`; PL3 chỉ đổ nội dung
vào sheet, không đổi khuôn.
<!-- UX-SPEC-TEMPLATE>>> -->
