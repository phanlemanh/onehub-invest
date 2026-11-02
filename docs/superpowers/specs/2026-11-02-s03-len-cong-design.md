# S03 lên cổng (SL1, `s03-len-cong`)

Căn cứ: `docs/plan/ra-mat-0511-so-luong-chat-luong.md` §3 việc 3 (Mạnh «Chốt, chuyển việc», 15:41:12Z 02/11);
`docs/research/s03-audit-trich-xuat-0211.md` §6. Phần giao diện và phép đo trên cổng làm sau khi #274 (TR1) gộp, theo lời giám sát.

## Vấn đề

Cổng của TR1 (`app/src/lib/offers-public.ts`, chặn `VISIBLE`) đòi đủ năm trường: loại hình, giá, diện tích, khu vực, còn mới.
Đo lúc 16:15Z ngày 02/11, trước lượt nạp SV1:

| Chặng | Số tin S03 |
|---|---|
| Có giá và diện tích | 891 |
| Qua ngưỡng giá hợp lý của cổng | 863 |
| Có khu vực | 64 (bán 56, thuê 8) |
| Có loại hình đã biết | 50 |

Kế hoạch tính thiếu chặn **loại hình**: nó chỉ nêu khu vực. Không xử lý chặn này thì dù mọi tin có khu vực, S03 vẫn chỉ lên 50 tin.
S03 chưa có bộ đọc loại hình; 96 phát biểu loại hình hiện có đến từ LLM và luật cũ.

## Hai phép kiểm kế hoạch chưa làm

**Rollup 300, 400 với khu vực cấp thị trường: không ảnh hưởng.** Hai tệp chỉ đọc `listings` (Airbnb), không đọc `sale_offers`.
AC-2 vẫn đo bằng cách so bảng trước và sau. Bên đọc bị ảnh hưởng thật ở chỗ khác:

| Bên đọc | Khi tin mang mã thị trường | Xử lý |
|---|---|---|
| `500_asset_stats.sql` | Sinh dòng trung vị cấp thị trường chỉ từ tin S03. Hôm nay 0 dòng cấp này; trang `/api/v1/asset-stats` và `queries.ts` sẽ đọc nhầm | Chỉ gom tin có khu vực cấp phường |
| `610_data_level.sql` | Tin rơi vào `chua-ro` vì chỉ tìm cha của khu vực | Khu vực là thị trường thì tính cho chính nó |
| `v_ruler_p2_area`, `refresh-bait-gap`, `deals.ts` | Thước theo căn; S03 không tạo căn nên không có thước cấp thị trường; `bait_gap_pct` để trống | Không đổi, AC-3 đo |
| `resolve-properties` chặng B | So cùng khu vực; S06 không có tin cấp thị trường nên không sinh cặp | Không đổi, AC-3 đo |
| `reassign-areas` | Chỉ dọn con của thị trường | Không đổi, AC-3 đo |

**Số tin S03 sau lượt SV1 lúc 17:00Z:** ghi ở hợp đồng khi lượt xong. Mô phỏng của audit là 223 tin nghỉ, 425 tin mọc.

## Thiết kế

Làm theo hai đợt trong một hàng, một PR.

**Đợt pipeline, làm ngay.**

1. **Sổ nhóm.** Lệnh `pipeline/khai-so-nhom.mjs --tep <tệp> [--ghi]` đọc tệp đã duyệt ở `research-local/`, ghi `market_codes` và `note`
   của đơn vị S03, kèm dòng nhật ký như đường `/ops/sources` (`app/src/lib/so-don-vi.ts`). Mặc định chỉ in số đếm. Mã thị trường
   không có trong `areas`, hay đơn vị không có trong sổ, làm cả lượt dừng. Không đổi `enabled`, `status`. Tệp không vào kho.
   Thẻ nhóm nằm ở `note`; bên đọc là LS1, không phải hàng này.
2. **Khu vực cấp thị trường.** Trong `transform-zalo.mjs`: không khớp phường và nhóm khai đúng một thị trường thì `area_id` là mã thị
   trường đó; `phuong_raw` trống, `confidence` không lên `high`. Nhóm chưa khai hay khai nhiều thị trường: giữ `NULL`. Chữ nói phường của thị trường
   khác: nhận mã của nhóm (Hỏi-2; 2/740 tin theo số đo dưới).
3. **Loại hình** (Hỏi-1). Từ chữ: cụm tường minh, bài nói cả hai thì không nhận. Từ nhóm: chữ im, nhóm có từ 20 bài nói rõ loại và từ
   85% cùng một loại, là cách `mucDichNhom` đang làm với bán và thuê. Ghi bằng phát biểu `e1_rule`: từ chữ là `observed`, từ nhóm
   là `inferred`, nên LLM (LS1) và người vẫn thắng được. Cột `property_type` nhận giá trị qua `resolve_offer_fields` như mọi phát biểu, `sync-cloud` đã
   chép cột này và `area_id`, nên không đổi đường sync.
4. **Hai bên đọc** 500, 610 như bảng trên.

**Đợt sau #274.**

5. Phản hồi tin có cờ `unverified` (S03 là đúng), không có mã nguồn. Thẻ tin hiện nhãn «Chưa xác minh». Tin cấp thị trường hiện tên thị
   trường, không vào lọc phường.
6. Đo trên cổng: số tin theo đúng `VISIBLE`, mẫu 30 tin máy chấm sai nặng.

## Số đo trước khi chọn (16:20Z, trước SV1, đếm bằng biểu thức, chưa qua bộ đọc thật)

| Thước | Kết quả |
|---|---|
| Loại hình lên được trên 863 tin (đã có + chữ + nhóm) | 50 + 185 + 376 = 611 |
| Độ đúng theo chữ, nhãn audit do tác tử gắn | 69/74 (93%) |
| Độ đúng theo nhóm, đối chứng giữ lại trên bài nói rõ loại | 3.837/4.177 (92%) |
| Nhóm đủ điều kiện suy loại | 12/31, cả 12 là căn hộ |
| Tin thuộc nhóm khai một thị trường theo sổ nháp | 748/863 |
| Trong đó chỉ lên cấp thị trường / có phường | 740 / 8 |
| Trong 740: chữ có tên phường thuộc thị trường khác | 2 |

Mẫu nhãn audit gần như toàn căn hộ (339/343), nên số theo nhóm trên nhãn (183/183) không nói gì và không được dùng làm căn cứ.

**Đích ≥ 900 chưa chắc đạt trong hàng này**: số thực tế là phần giao của loại hình và khu vực, nhỏ hơn 611; phần còn lại trông vào số tin mọc
sau SV1 và LS1. Kế hoạch đã ghi ngưỡng chỉ cảnh báo, không chặn ra mắt. AC-9 báo đúng số, không hạ thước; không vượt 50 mới là gãy đường.

## Đặc tả UX

<!-- ux:ia --> Khuôn IA: giữ thẻ tin của TR1, không màn mới, không tra mẫu vì chỉ thêm một nhãn.
<!-- ux:states --> Trạng thái: tin S03 có nhãn; tin khác không. Tin cấp thị trường hiện tên thị trường ở chỗ phường. Lọc phường không chứa tin cấp thị trường.
<!-- ux:copy --> Chữ: «Chưa xác minh», `<Badge variant="warning-light">` cỡ mặc định; thêm thuật ngữ vào `CONTEXT.md` cùng commit.
<!-- ux:responsive --> 375 px và 1280 px, sáng và tối, do AC-8 chụp.

## Không làm

Đọc khu vực từ tên dự án, ghép phường theo dự án · thêm nhóm · ghi dự án từ thẻ · LLM (LS1) · đổi `VISIBLE` nếu Hỏi-1 không chọn · ghi sổ
hay nạp lại trên DB chung khi chưa có lượt giám sát xếp.
