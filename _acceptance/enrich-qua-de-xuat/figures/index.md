# Hình tại điểm quyết định — enrich-qua-de-xuat (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| d-1 đường ghi đề xuất + luật xác định · d-3 hai loại căn cứ · d-9 xung đột LLM↔E1 · lệch thiết kế gốc (ngưỡng confidence → căn cứ độc lập) | 5 nhánh rẽ (direct · corroborated-E1 · corroborated-asset_nodes · superseded · review) + 3 nhánh duyệt | `duong-gia-tri.html` |
| d-4 một thẻ mỗi offer | dưới ngưỡng: 1 nhánh | — |
| d-5 suite_keys | dưới ngưỡng: 0 bước | — |
| d-6/d-7 bỏ ui-observed, design-pass | dưới ngưỡng: 0 bước | — |
| d-8 ghi cũ ngoài phạm vi | dưới ngưỡng: 0 bước | — |
| [GIẢ ĐỊNH] ×2 trong Coverage | trùng d-3, d-4 | — |

## Đề bài `duong-gia-tri`

- Loại hình: sơ đồ luồng (flowchart) trái → phải.
- Nút: «Giá trị E1 (luật)» · «Giá trị LLM» → chuẩn hoá → các nhánh: E1 → «áp thẳng (direct)»; LLM + E1 cùng giá trị → «áp (corroborated · e1)»; LLM khớp node building → «áp tên chuẩn (corroborated · asset_nodes)»; LLM trái E1 → «superseded — Hỏi d-9»; LLM không căn cứ → «enrichment_proposals queued» → «thẻ /ops/review» → ba nhánh «Áp dụng → apply_enrichment (fill-gap + cascade properties)» · «Bỏ → rejected, không đẩy lại» · «Để sau → giữ queued, lượt sau mở thẻ mới». Mọi nhánh «áp» hội về một nút «apply_enrichment (hàm SQL duy nhất ghi sale_offers/properties)».
- Nhãn bằng chữ tiếng Việt, ghi rõ nút nào là «máy tự làm» và nút nào «người quyết».
- AC liên quan: AC-1 · AC-2 · AC-3 · AC-4 · AC-5 · AC-6 · AC-7.

## Nâng phạm vi 2026-10-23 (Cổng Phạm vi lần 2)

| Điểm | Đếm | Hình |
|---|---|---|
| revisit d-9 → thẻ đối chiếu khi E1 trái LLM (AC-7) + người chọn một bên (AC-11) | 3 bước nối tiếp (không áp → thẻ đối chiếu → chọn) + 3 nhánh chọn (luật · LLM · bỏ cả hai) | `xung-dot-doi-chieu.html` |
| ghép apply_enrichment + decide_enrichment_review, không migration mới | dưới ngưỡng: 2 bước | — |
| không siết luật E1 vòng này | dưới ngưỡng: 0 bước | — |
| hoàn tác 2 giá trị land — Hỏi | dưới ngưỡng: 2 nhánh | — |
| giữ cỡ 11 tiêu chí | dưới ngưỡng: 0 bước | — |

## Đề bài `xung-dot-doi-chieu`

- Loại hình: sơ đồ luồng trái → phải, hai làn: «trước (đã duyệt 22/10)» ở trên, «sau (đề nghị)» ở dưới, cùng điểm xuất phát.
- Xuất phát: «Tin "Nhà Gò Vấp 4 tầng" trong nhóm "…NHÀ ĐẤT…"» → «E1 (luật): land — từ khoá "đất" trong tên nhóm» và «LLM: house · tự tin 82%».
- Làn trước: «E1 thắng → land ghi thẳng vào sale_offers» + «LLM house: superseded, không ai thấy» (tô cảnh báo).
- Làn sau: «Không áp bên nào» → «Thẻ /ops/review: field Loại BĐS — Theo luật: land (căn cứ) · Theo LLM: house (căn cứ) · Bỏ cả hai» → người chọn → ba nhánh: «chọn LLM → apply_enrichment(house); land → rejected» · «chọn luật → apply_enrichment(land); house → rejected» · «Bỏ cả hai → cả hai rejected, lượt sau không đẩy lại». Ghi chú phụ: «E1 và LLM cùng giá trị, hoặc LLM im lặng → áp như cũ».
- Ghi rõ nút nào «máy tự làm», nút nào «người quyết».
- AC liên quan: AC-7 · AC-11.
