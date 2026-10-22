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
