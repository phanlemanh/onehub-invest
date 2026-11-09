# Kế hoạch dùng lại — bai-nhan-tru-bai-chi-anh (DF6)

Vòng không thêm thành phần: chỉ đổi dữ liệu và mẫu số của các khung có sẵn trên `/ops/data-flow`.

## Screen: Dòng chảy dữ liệu
Pattern: none — trang DF0 đã dựng (Sankey chuyển thể @reui/chart-49, lưới @reui data-grid); DF6 chỉ thêm nút và đổi mẫu số

| Slot | Rung | Use | Reason |
|---|---|---|---|
| Sankey «Đường ống» — nút mới | 3 | FlowJourney | khung vẽ có sẵn (chuyển thể chart-49), thêm nút ở `flow-sankey-data.ts` |
| màu nút «Đọc thành Yêu cầu» (chặng «Yêu cầu») | 6 | palette cyan-500 · dark:cyan-400 | màu định danh nhóm (luật ReUI 2: palette thô có cặp dark:); token chart-2 ở chế độ tối trùng tông xanh lá của «Gắn căn» — design-pass Nhóm 1 |
| bảng đọc khi rê chuột | 3 | FlowReadout | tỉ lệ bước theo nút đứng trước, không đổi mã |
| dòng «Chưa tách bài chỉ-ảnh…» | 3 | reui/frame (FrameFooter) | một dòng chữ phụ ở chân khung Đường ống, cạnh câu ước lượng S06 có sẵn |
| lưới «Chất lượng từng chặng» | 3 | QualityGrid | đổi mẫu số ô «Đọc được» ở `quality-rows.ts` |
| ô «Đọc được» của «Chặng theo ngày» | 3 | StageTrendChart | đổi mẫu số ô tỉ lệ |
