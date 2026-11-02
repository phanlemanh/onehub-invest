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

**Số tin S03 sau lượt đêm có SV1:** đo 17:38Z, xem mục «Số đo lại sau lượt đêm».

## Thiết kế

Làm theo hai đợt trong một hàng, một PR.

**Đợt pipeline, làm ngay.**

1. **Sổ nhóm.** Lệnh `pipeline/khai-so-nhom.mjs --tep <tệp> [--ghi]` đọc tệp đã duyệt ở `research-local/`, ghi `market_codes` và `note`
   của đơn vị S03, kèm dòng nhật ký như đường `/ops/sources` (`app/src/lib/so-don-vi.ts`). Mặc định chỉ in số đếm. Mã thị trường
   không có trong `areas`, hay đơn vị không có trong sổ, làm cả lượt dừng. Không đổi `enabled`, `status`. Tệp không vào kho.
   Thẻ nhóm nằm ở `note`; bên đọc là LS1, không phải hàng này.
2. **Khu vực cấp thị trường.** Trong `transform-zalo.mjs`: không khớp phường và nhóm khai đúng một thị trường thì `area_id` là mã thị
   trường đó; `phuong_raw` trống, `confidence` không lên `high`. Nhóm chưa khai hay khai nhiều thị trường: giữ `NULL`. Chữ nói phường của thị trường
   khác: nhận mã của nhóm (Hỏi-2; 2/1.035 tin theo số đo dưới).
3. **Loại hình** (Hỏi-1). Từ chữ: cụm tường minh, bài nói cả hai thì không nhận. Từ nhóm: chữ im, nhóm có từ 20 bài nói rõ loại và từ
   85% cùng một loại, là cách `mucDichNhom` đang làm với bán và thuê. Ghi bằng phát biểu `e1_rule`: từ chữ là `observed`, từ nhóm
   là `inferred`, nên LLM (LS1) và người vẫn thắng được. `sync-cloud` đã chép cột `property_type` và `area_id`, nên không đổi đường sync.
3b. **Migration 069, ngả B (Mạnh chọn 03/11).** Bộ phân xử (từ 061) không bao giờ cho `inferred` vào cột (luật OCP1 26/10), nên thiết kế bản đầu sai: 553 tin suy từ
   nhóm sẽ vẫn `unknown` và không lên cổng. 069 nới hẹp: riêng `property_type`, không có lớp trên và đúng một giá trị suy thì cột nhận giá trị đó, provenance ghi
   `tier: inferred`. Hai giá trị suy trái nhau thì về `unknown`. Trường khác giữ luật cũ. Hôm nay không có phát biểu `property_type` lớp `inferred`, nên không ô nào đang có đổi.
   068 (SĐT S06) cũng vá `resolve_offer_fields` và có thể gộp sau 069. Giám sát chốt 069 đi trước; SV2 nối lại sau 05/11 lấy số từ 070 và dựng thân hàm trên main đã có 069, số 067 bỏ trống. Vì vậy 069 không chép thân hàm mà vá thân hàm đang có trên DB (`pg_get_functiondef`), không khớp đúng một chỗ thì dừng lỗi. Migration áp sau 069 mà chép thân hàm bản cũ sẽ làm mất luật này; AC-5 đọc hàm thật trên DB thử để bắt ca đó.
3c. **Enrich vẫn ghi đè được.** `agent/src/enrich/route.ts` (`isEmpty`, «giá trị cũ thắng») và câu chọn tin của `run.ts` đọc cột: thêm nhận biết provenance `inferred`, coi là ô trống; không có
   bước này thì LLM không bao giờ đề xuất trên các tin đó (AC-11).
4. **Hai bên đọc** 500, 610 như bảng trên.

**Đợt sau #274.**

5. Phản hồi tin có cờ `unverified` (S03 là đúng), không có mã nguồn. Thẻ tin hiện nhãn «Chưa xác minh». Tin cấp thị trường hiện tên thị
   trường, không vào lọc phường.
6. Đo trên cổng: số tin theo đúng `VISIBLE`, mẫu 30 tin máy chấm sai nặng.

## Số đo lại sau lượt đêm (17:38Z, DB chung, chỉ đọc)

Giám sát đo 17:37Z, em đo lại 17:38Z, khớp từng số.

| Chặng | Số tin S03 |
|---|---|
| Tổng, đều là bán hoặc thuê dài hạn | 3.158 |
| Có giá và diện tích | 1.272 |
| Qua ngưỡng giá hợp lý của cổng | 1.265 (bán 876, thuê 389) |
| Có loại hình / có khu vực, trên tổng 3.158 | 128 / 39 |
| Đủ giá, diện tích, loại hình / thêm khu vực | 81 / 2 |

Ước trên 1.265 tin, cùng cách đếm biểu thức và sổ nháp, chưa qua bộ đọc thật:

| Thước | Kết quả |
|---|---|
| Có loại hình (đã có + chữ + nhóm) | 81 + 266 + 694 = 1.041 |
| Có khu vực (đã có + nhóm khai một thị trường) | 28 + 1.033 = 1.061 |
| **Phần giao, ước số lên cổng** | **839 (bán 542, thuê 297)** |
| Phần giao nếu bỏ suy từ nhóm (chỉ đã có + chữ) | 286 |
| Nhóm khai một thị trường: có phường / chỉ cấp thị trường | 23 / 1.035 |
| Trong 1.035: chữ có tên phường thuộc thị trường khác | 2 |

**Đích ≥ 900 ước hụt 61 tin.** 900 là 71% của 1.272 tin; phần giao ước đạt 66%. 553 trong 839 tin lấy loại hình bằng suy từ nhóm, nên
AC-9 chia mẫu theo nguồn loại hình là bắt buộc. Phần còn thiếu trông vào 207 tin chưa có sổ, LS1, và số tin mọc thêm; không nới thước
để đủ số. `stg_zalo_posts` vẫn dừng ở 05:00Z, nên số này là của lượt đêm, chưa có tin từ sau mốc đó.

Lượt đêm chỉ gọi transform, chưa chạy `reassign-areas` rồi 300, 400. Không cần chạy trước khi đo: `reassign-areas.mjs`, 300 và 400 không
đọc `sale_offers`, và `transform-zalo.mjs` không ghi `listings`.

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

Kế hoạch đã ghi ngưỡng ≥ 900 chỉ cảnh báo, không chặn ra mắt. AC-9 báo đúng số, không hạ thước; không vượt 50 mới là gãy đường.

## Bên đọc cột `property_type` khi cột mang giá trị suy luận (ngả B)

| Bên đọc | Ảnh hưởng | Xử lý |
|---|---|---|
| `offers-public.ts` `VISIBLE` | Tin lên cổng, đúng ý định; thẻ có nhãn «Chưa xác minh» | Không đổi |
| `sync-cloud` | Chép giá trị; `field_provenance` không lên cloud | Không đổi; cổng không phân biệt lớp, đã có nhãn cho cả S03 |
| `enrich/run.ts`, `enrich/route.ts` | Ô thôi «trống», LLM không đề xuất | Ô `inferred` mở cho LLM, không mở cho E1 vì E1 có thể suy từ tên nhóm và sẽ vượt lên `observed`; AC-11 |
| `tools/native.ts` → `judge-entity.ts` `apNguong` | Loại suy tự ra `yes`, `no` khi ghép căn | Câu đọc của `native.ts` trả `unknown` khi lớp là `inferred`; AC-12 |
| `revert_enrichment` (066) | Hoàn tác đề xuất LLM thì cột về giá trị suy, không về `unknown` | Chốt: hoàn tác trả về trạng thái trước đề xuất; người muốn bác giá trị thì phát biểu `hitl`. AC-11 đo |
| `offer_core_complete`, `610`, `600` | Tin tính là đủ, độ phủ loại hình tăng | Đúng nghĩa cổng; số tăng ghi ở AC-9 |
| `resolve-properties` chặng B | `p1` S03, S05 không xét loại hình; chỉ `p2` S06 xét | Không đổi |

## Đặc tả UX

<!-- ux:ia --> Khuôn IA: giữ thẻ tin của TR1, không màn mới, không tra mẫu vì chỉ thêm một nhãn.
<!-- ux:states --> Trạng thái: tin S03 có nhãn; tin khác không. Tin cấp thị trường hiện tên thị trường ở chỗ phường. Lọc phường không chứa tin cấp thị trường.
<!-- ux:copy --> Chữ: «Chưa xác minh», `<Badge variant="warning-light">` cỡ mặc định; thêm thuật ngữ vào `CONTEXT.md` cùng commit.
<!-- ux:responsive --> 375 px và 1280 px, sáng và tối, do AC-8 chụp.

## Không làm

Cho `inferred` vào cột ở trường khác `property_type` · đọc khu vực từ tên dự án, ghép phường theo dự án · thêm nhóm · ghi dự án từ thẻ · LLM (LS1) · đổi `VISIBLE` nếu Hỏi-1 không chọn · ghi sổ
hay nạp lại trên DB chung khi chưa có lượt giám sát xếp.
