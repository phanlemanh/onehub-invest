---
schema_version: 1
feature: Nhà đầu tư thấy tin S03 trên trang tin rao, kể cả tin không nói phường (mang khu vực cấp thị trường), kèm nhãn «Chưa xác minh»
slug: s03-len-cong
owner: phanlemanh@gmail.com
risk_tier: T3      # ngả B (Mạnh chọn 03/11): thêm migration 069 sửa bộ phân xử, khớp t3_paths db/migrations/**
surfaces: [cli, web]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-02-s03-len-cong-design.md
---

# Acceptance Contract: s03-len-cong

## Context

Kế hoạch ra mắt §3 việc 3. Cổng TR1 đòi đủ loại hình, giá, diện tích, khu vực; đo 17:38Z sau lượt đêm, 1.265 tin S03 có giá và diện tích qua ngưỡng cổng mà chỉ 28 có khu vực và 81 có
loại hình; đủ cả bốn trường chỉ 2 tin. Hàng này mở hai chặn đó và gắn nhãn. AC-8, AC-9 chỉ làm được sau khi #274 gộp. Nhãn dùng để đo do tác tử gắn, không phải nhãn vàng.

## Acceptance criteria

- AC-1: Given ma trận nhóm × chữ (khai một thị trường + không phường; khai một + có phường; khai một + phường thị trường khác; chưa khai; khai hai), When transform gán khu vực, Then đúng lần lượt: mã thị trường, mã phường, mã thị trường của nhóm (Hỏi-2), trống, trống; tin mang mã thị trường có `phuong_raw` trống và `confidence` không phải `high`; ca đỏ trên bản đột biến bỏ điều kiện «đúng một» ghim mã ca.
- AC-2 (cross-layer): Given DB thử có tin S03 mang mã thị trường, When chạy 300, 400, 500, Then `market_metrics`, `area_breakdowns` giống hệt bản không có các tin đó; `market_asset_stats` không có dòng cấp thị trường, băm dòng cấp phường không đổi và khác rỗng. Bản đột biến bỏ lọc ở 500 phải đỏ.
- AC-3 (cross-layer): Given cùng DB thử, When chạy `refresh-bait-gap`, `resolve-properties`, `reassign-areas`, `bac-du-lieu`, Then `v_ruler_p2_area` không có dòng cấp thị trường, `bait_gap_pct` các tin đó trống, không có cặp ứng viên chứa chúng kể cả hai tin S03 cùng mã thị trường, trong khi cặp đối chứng cùng phường vẫn sinh, `area_id` giữ nguyên, ảnh chụp bậc dữ liệu tính chúng vào đúng thị trường thay vì `chua-ro`.
- AC-4: Given ma trận đáp án loại hình theo chữ (cụm tường minh mỗi loại một dòng; bài nói hai loại; «PN», «căn» đứng một mình; chữ im), When bộ đọc chạy, Then mỗi dòng đúng đáp án, ca đỏ ghim mã ca. Given 383 bài nhãn của audit, Then in hai số riêng, mỗi số kèm số nhận và mẫu số: theo chữ đúng ≥ 85%, theo nhóm trên đối chứng giữ lại (bài nói rõ loại, bỏ bài đó khỏi phiếu nhóm) đúng ≥ 85%; nhận tổng ≥ 50% số bài có nhãn loại.
- AC-5 (cross-layer): Given migration 069 trên DB thử và ma trận phát biểu loại hình, When phân xử, Then chỉ có `inferred` một giá trị thì cột nhận giá trị đó và `field_provenance` ghi `tier: inferred`; `inferred` hai giá trị thì cột `unknown` kèm `goi_y`; có `observed` hay `fact` thì lớp đó thắng; trường khác chỉ có `inferred` vẫn không vào cột (ca `chi-inferred` của `phan-xu-ma-tran.json` giữ nguyên); phân xử lại mọi tin hiện có không đổi ô nào. 069 áp được cả khi có và khi chưa có 067, 068, ở cả hai thứ tự với 068, và giữ nguyên `fp_sdt` cùng hai mốc `offer_status` của 068; bản hàm không có điểm vá thì dừng lỗi, DB không đổi. Given bài S03, When transform chạy hai lần, Then phát biểu đúng bậc: từ chữ `observed`, từ nhóm `inferred`, cùng phương pháp `e1_rule`; nhóm dưới 20 bài hay dưới 85% không sinh phát biểu; chữ nói rõ thì nhóm không phát biểu; lần hai không thêm dòng; nhóm tụt dưới ngưỡng thì phát biểu suy cũ bị rút; nhóm đổi đa số thì chỉ còn một phát biểu sống và cột theo giá trị mới; tin hai bài với hai giá trị suy trái nhau thì cột `unknown` kèm `goi_y`; `observed` ở bài A và `inferred` khác giá trị ở bài B thì `observed` thắng, `lower_disagree: true`; phát biểu `e1_rule` của bộ khác không bị rút.
- AC-6: Given tệp sổ thử, When chạy `khai-so-nhom`, Then không `--ghi` thì DB không đổi; có `--ghi` thì `market_codes`, `note` đúng và có dòng nhật ký; chạy lại không thêm nhật ký; mã thị trường lạ hay đơn vị lạ thì thoát khác 0, DB không đổi; `enabled`, `status` không đổi; stdout chỉ có số đếm, không khoá nhóm, không tên nhóm. Given nháp thật ở `research-local/`, Then lệnh in đủ 30 đơn vị và thẻ của 16 tên nhóm (19 đơn vị theo nháp); thiếu thì thoát khác 0.
- AC-7 (cross-layer): Given bản sao DB, When transform bản có với sổ nháp và bản nền, Then tập `offer_id` trùng khít (bản đột biến đưa khu vực vào khoá gom lệch, đối chứng đỏ); giá, diện tích, kind của từng tin không đổi; in số tin qua từng chặn của `VISIBLE` kèm mẫu số, không in chữ bài.
- AC-8 (cross-layer, sau #274): Given tin S03 và S06 trên DB thử, When gọi `/api/v1/offers` và mở trang tin rao, Then tin S03 có `unverified: true`, S06 `false`, phản hồi không có mã nguồn; tin chỉ có loại hình `inferred` và mã thị trường có mặt theo đúng `VISIBLE` (bản bỏ phát biểu thì biến mất); lọc theo thị trường có tin cấp thị trường, lọc theo phường không có; thẻ S03 hiện «Chưa xác minh» bằng Badge cỡ mặc định, thẻ S06 không; 375 và 1280 px, sáng và tối đều không tràn.
- AC-9 (sau #274): Given DB thử mang bản sao sau lượt SV1 và sổ đã duyệt, When đo, Then in số tin lên cổng theo đúng `VISIBLE` so với đích 900, và sai nặng trên mẫu 30 tin máy chấm so với đích 10%, ghi rõ nhãn do tác tử gắn. Sai nặng là một trong: sai bán hay thuê, sai loại hình, sai thị trường, giá hay diện tích lệch trên 20%. Mẫu chọn bằng seed cố định, chia theo nguồn loại hình (chữ, nhóm, LLM). Dưới đích thì báo đúng số, không hạ thước (kế hoạch §1: ngưỡng chỉ cảnh báo); số lên cổng không vượt 50 là đường gãy, thoát khác 0.
- AC-10: Given diff so với main, When quét dòng thêm, Then `pipeline/sync-cloud.mjs` không đổi, `collection_units` không vào danh sách sync; không tên nguồn thật, khoá nhóm, chữ bài; tệp sổ nằm ở `research-local/` được `git check-ignore` xác nhận; không tệp nào dưới route S03 của Ops và `collector/openclaw` đổi. Đối chứng: chèn tên thật vào dòng thêm giả thì thước đỏ, định danh có sẵn trong dòng không đổi thì không đỏ.
- AC-11 (cross-layer): Given tin có cột `property_type` chỉ từ phát biểu `inferred`, đủ `street_raw`, `bathrooms`, When enrich chọn tin và định tuyến, Then tin vẫn được chọn; đề xuất LLM được ghi, áp xong `observed` thắng và `field_provenance` đổi lớp; E1 không được áp thẳng lên ô này; tin có loại hình `observed` vẫn giữ luật giá trị cũ thắng. When hoàn tác đề xuất LLM (cùng giá trị hay khác giá trị) hoặc đề xuất E1 trùng giá trị trên chủ thể đó, Then cột về giá trị suy, `tier: inferred`, phát biểu suy còn sống. Ca đỏ: bản `route.ts` và bản `run.ts` bỏ nhận biết `inferred`, mỗi bản ghim «SL1-AC-11».
- AC-12: Given cặp tin S03 loại hình `inferred` và S06, When bộ chấm ghép căn xét cặp, Then loại hình suy không tự ra kết luận: khác loại vẫn `thieu_loai` và `unsure`, cùng loại, giá và phường khớp vẫn `unsure`. Given cùng cặp mà S03 là `observed`, Then giữ kết quả `no`, `yes` như cũ. Ca đỏ: bản đọc cột thô ghim «SL1-AC-12».

## Coverage

- Trục nhóm × chữ của khu vực: AC-1. Thước: ma trận, mỗi tổ hợp một dòng.
- Trục bên đọc khu vực: 300, 400, 500, thước, bait, ghép, reassign, 610, API, `data-api` deals (AC-2, AC-3, AC-8). Thước: E13 quét `sale_offers` và `market_asset_stats` toàn kho, so ma trận viết trước; bên đọc lạ thì đỏ.
- Trục loại hình: chữ, nhóm, LLM đã có, chạy lại, bên ghi đè sau (AC-4, AC-5, AC-11).
- Trục bên đọc cột mang giá trị suy: enrich, bộ chấm ghép, cổng, sync, bậc dữ liệu (AC-11, AC-12). Thước: E13 quét thêm `property_type`, `field_provenance`. Thước: ma trận và 383 nhãn audit (`[CE chưa kiểm chứng]`: nhãn tác tử).
- Trục sổ: đọc, ghi, chạy lại, lỗi (AC-6).
- Trục toàn bộ: khoá gom và các chặn của cổng (AC-7, AC-9).
- Trục luật: tầng A, cloud, S03 an toàn (AC-10).

## Đường đo

- «S03 lên cổng ≥ 900 tin» và «sai nặng ≤ 10%»: `pipeline/scripts/do-s03-len-cong.mjs`, AC-9.
- «Tin cấp thị trường không có dấu hiệu theo phường và không làm lệch rollup»: AC-2, AC-3.

## Out of scope

- Suy phường từ tên dự án; thêm nhóm S03.
- Ghi dự án từ thẻ nhóm; LLM đọc chữ (LS1).
- Áp sổ, nạp lại S03 trên DB chung hay cloud trong vòng này: giám sát xếp lượt sau khi Mạnh duyệt sổ. Số trên cổng cloud đọc ở báo cáo 07:30 của kế hoạch, sau lượt đó.
- Đổi đường sync; đưa sổ nhóm lên cloud.
- Cho `inferred` vào cột ở trường khác `property_type`.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-03:
  - Ngoài-1: Tài liệu từ vựng chuẩn vẫn nói suy luận không bao giờ vào cột, trong khi hệ thống nay cho phép riêng loại hình. Người hoặc tác tử đọc tài liệu có thể hiểu sai hành vi thật.
  - Ngoài-2: Con số độ đúng khi đoán loại nhà theo nhóm có thể trông tốt hơn thực tế vì thước đo gần như lặp lại ngưỡng của luật. Người duyệt có thể tin vào số này hơn mức nó đáng tin.
  - Ngoài-3: Nếu đề xuất loại nhà của LLM bị bỏ qua thay vì áp dụng, bài kiểm tra vẫn báo ổn. Tin có thể giữ loại nhà suy đoán lâu hơn dự kiến mà không ai hay.
  - Ngoài-4: Chưa có bài kiểm tra nào xác nhận thẻ tin từ nguồn đã xác minh, khi hiển thị thật trên trang, không bị gắn nhãn «Chưa xác minh». Nếu hỏng, nhà đầu tư sẽ thấy nhãn sai trên tin đáng tin.
  - Ngoài-5: Một ca kiểm về hai tin cùng thị trường luôn báo xanh nên không bắt được lỗi ở chỗ đó. Người dùng không bị ảnh hưởng, vì hệ thống vốn không ghép hai tin cùng nguồn với nhau.
  - Ngoài-6: Nếu ai đổi ngưỡng lệch giá hay diện tích sang mức khác 20% thì ca kiểm vẫn xanh. Số tin «sai nặng» báo cho người quyết có thể hơi lệch so với thước đã hứa.
  - Ngoài-8: Bài kiểm khu vực chỉ chắc chắn bắt được lỗi ở các tin cấp thị trường. Nếu tin có phường bị mất độ tin cậy cao, bài kiểm này vẫn xanh.
  - Ngoài-9: Luật cho tin đăng ở hai bài khai hai thị trường khác nhau chỉ được thử trên dữ liệu dựng tay. Chưa thấy lỗi thật, nhưng nếu cách ghi đổi dạng thì bài kiểm vẫn xanh.
  - Ngoài-10: Một số rất ít tin bán đất nền có thể hiện trên trang tin rao với nhãn loại hình là căn hộ. Nhà đầu tư xem tin đó sẽ thấy loại hình sai.
  - Ngoài-11: Tin lấy từ nhóm S05 hiện trên trang tin rao mà không có nhãn «Chưa xác minh», nên người xem tưởng tin đã được đối chiếu.
  - Ngoài-12: Danh sách các chỗ đọc khu vực được kiểm theo tên tệp, còn phần ghi chú kết luận về từng chỗ không được máy kiểm. Ghi chú sai vẫn có thể lọt mà không báo đỏ.
  - Ngoài-13: Kiểm tra chống lộ thông tin chỉ chứng minh được là bắt tên nguồn thật; với tên nhóm và nội dung bài, chưa chắc nó báo đỏ khi có rò rỉ.
  - Ngoài-15: Phép kiểm xác nhận tin loại hình đã xác thực vẫn giữ giá trị cũ còn yếu, có thể không bắt được lỗi ghi đè nhầm.
  - Ngoài-17: Nếu có lỗi làm mọi tin S03 đều không được xếp độ tin cậy cao, bài kiểm tra hiện tại vẫn báo xanh. Nhà đầu tư có thể thấy tin có phường bị hạ độ tin cậy mà không ai phát hiện.
  - Ngoài-18: Một vài script vận hành và truy vấn phụ ngoài các thư mục chính có thể đọc dữ liệu khu vực theo cách lạ mà bài kiểm tra không phát hiện. Số liệu ở các công cụ nội bộ đó có thể lệch mà không ai biết.
  - Ngoài-19: Một ca kiểm tra trang tin rao đang đọc dữ liệu thật thay vì dữ liệu giả, nên có thể đỏ khi máy không có cơ sở dữ liệu. Người dùng cuối không thấy thay đổi nào.
  - Ngoài-22: Phép kiểm tra rằng thước giá không có dòng cấp thị trường luôn xanh nên không bắt được lỗi nếu sau này có người đổi cách tạo căn. Hiện người dùng không thấy số sai.
  - Ngoài-23: Một phép so sánh số liệu phường trước và sau khi thêm tin cấp thị trường không phân biệt được bản đúng với bản sai, dù số liệu thật hiện không bị lệch.
  - Ngoài-24: Phép kiểm chống lộ khoá nhóm và nội dung bài chưa được thử bằng mẫu giả, nên chưa chắc nó bắt được nếu có rò rỉ. Hiện chưa thấy rò rỉ nào.
  - Ngoài-25: Hai phép kiểm phụ về mẫu lệch và tin tách nhỏ chưa từng được chứng minh là biết báo đỏ, nên có thể im lặng khi có sai.
  - Ngoài-26: Nếu sau này có nguồn khác lên cổng, nhãn «Chưa xác minh» có thể gắn sai mà phép kiểm hiện tại không phát hiện. Hiện chỉ S03 và S06 hiển thị.
  - Ngoài-27: Một chú thích trong ca kiểm tra nói đã kiểm Hà Nội nhưng thực tế chưa kiểm, nên trang của vùng Hà Nội khi chỉ có tin cấp thị trường chưa được thử riêng.
  - Ngoài-28: Khi nhiều lệnh chấm chạy cùng lúc trên máy chưa có DB thử, bằng chứng có thể đỏ giả hoặc đo trên dữ liệu thiếu. Không ảnh hưởng người dùng cuối, chạy lại từng lệnh là qua.
  - Ngoài-29: Trên máy chưa có DB thử, một phép kiểm về ranh giới dữ liệu nhạy cảm có thể đỏ vì không nối được chứ không vì vi phạm. Người dùng cuối không thấy gì.
  - Ngoài-30: Hồ sơ cho người ký mô tả sai ba tệp là đã sửa trong hàng này, dù thực tế chúng không đổi. Sản phẩm không bị ảnh hưởng.
  - Trong hợp đồng, AC-3: phép kiểm chỉ đòi số tin tính vào đúng thị trường tăng ít nhất 2 trong khi ca gieo 15 tin, nên nếu tính thiếu thì ca vẫn xanh (Mạnh đồng ý ghi sau chữ ký, cùng ngày).
  - Trong hợp đồng, AC-1: ca kiểm không ghim số dòng ma trận khu vực, nên xoá bớt một dòng vẫn xanh (Mạnh đồng ý ghi sau chữ ký, cùng ngày).
