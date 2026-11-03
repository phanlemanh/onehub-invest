---
schema_version: 1
feature: Người vận hành quét Căn giá tốt trên một bảng có tab và lọc, mở sheet một căn để biết căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai, so với các căn cùng tiêu chí; căn thiếu dữ liệu ghi rõ thiếu gì; vai Người xem không nhận ảnh, chữ bài, liên hệ
slug: can-gia-tot-biet-can
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-03-can-gia-tot-biet-can-design.md
---

# Acceptance Contract: can-gia-tot-biet-can

## Context

Phiên nghiệm thu `people-hien-so-goc` 03/11 chấm 3, «Không sử dụng được», vì vai Vận hành không biết thẻ là căn gì. Hàng CG1 mở ảnh và chữ bài cho vai đó (ADR-0007 đã cho phép, thẻ duyệt đã làm), thay lưới thẻ bằng bảng có tab và lọc, thêm sheet một căn, danh sách căn cùng tiêu chí, trang một căn và chứng minh giá tốt. Mạnh chốt dạng bảng cộng sheet ở Cổng Phạm vi 03/11: người vận hành cần nhìn nhiều, so nhanh, chuyển nhanh. Danh sách hôm nay có 4 căn; đủ 20 căn là việc của CG2.

## Criteria

- AC-1 (cross-layer): Given lược đồ tạm có căn đủ dữ liệu, căn không ảnh, căn loại hình `unknown` và căn giảm trên 35%, When vai Vận hành mở `/ops/deals` qua page thật, Then mỗi hàng của bảng có tên căn (loại hình, m², phòng ngủ, phường), giá, giá/m², mức giảm kèm thước và số tin, tình trạng, nút gọi; căn có ảnh hiện ảnh đầu của đúng căn đó, căn không ảnh hiện ô chưa có ảnh và không có thẻ `img`; thứ tự mặc định đúng thứ tự của `dealsSql`, căn «Cần xác minh» đứng cuối.
- AC-2 (cross-layer): Given căn có mã toà, tầng, số căn, số nhà, tên đường và SĐT, When vai Vận hành mở căn đó trong sheet và trên trang `/ops/deals/<offerId>` qua page thật, Then cả hai bề mặt dùng chung một phần thân và hiện đúng từng mục đó, phường, quận, giá, diện tích, phòng ngủ, nguồn, độ tin trích xuất, ngày thấy, số lần đăng, tên người đăng, nhóm, số tin và liên kết `tel:+84…`; mục không có dữ liệu ghi «chưa có» trong sheet, không có dòng rỗng trên trang.
- AC-3 (cross-layer): Given căn có 13 dòng ảnh gồm ảnh đã tải và ảnh lấy hộ, chữ bài dài hơn 200 ký tự, When vai Vận hành hay `admin` mở sheet và trang một căn, Then có đúng 12 ảnh theo `media_order`, chữ bài đầy đủ; HTML không chứa URL gốc của ảnh, `?path=` hay `listing_url`; `dealMediaSrc` không còn trong `app/src` và mục 4 của `scripts/check-portal-compliance.mjs` đạt.
- AC-4 (cross-layer): Given các căn giảm 4,9%, 5%, 22%, 35%, 36%, 50% và 50,1% trong lược đồ tạm, When mở bảng, sheet và trang một căn, Then 5% tới 50% vào danh sách, 4,9% và 50,1% không vào; trên 35% mới có nhãn «Cần xác minh»; thanh giảm có vạch ngưỡng đặt đúng 35%; khối «Vì sao giá tốt» hiện giá/m², thước phường, số tin dựng thước, mức giảm đúng theo dữ liệu; ba ngưỡng trên trang và trong câu SQL đọc cùng một hằng số; đổi thước trong lược đồ tạm thì số hiện đổi theo.
- AC-5 (cross-layer): Given ma trận mỗi lần thiếu đúng một trong: loại hình, địa chỉ dưới phường, ảnh, chữ bài, SĐT (căn vẫn trong danh sách) và số m², thước (không tính được mức giảm nên căn rời danh sách), When gọi `thieuGi` và vẽ, năm trường đầu qua bảng và sheet, hai trường sau qua trang một căn, Then khối «Còn thiếu» nêu đúng một nhãn đúng mục đó; năm trường đầu: hàng của căn ở tab «Còn thiếu» với đúng số mục; hai trường sau: trang có cả nhãn «Đã rời danh sách» và nhãn thiếu; căn đủ không có khối này và ở tab «Đủ để gọi»; căn `unknown` ghi «Chưa rõ loại hình».
- AC-6 (cross-layer): Given căn có ảnh, chữ bài, tên, SĐT, When vai Người xem mở bảng, sheet và trang một căn qua page thật, Then HTML, cây phần tử và dữ liệu đưa xuống trình duyệt không chứa ảnh, chữ bài, tên, nhóm, số ở mọi dạng, không có cột «Gọi ai» và trường lọc «Ảnh», danh sách cùng tiêu chí không có ảnh, khối «Còn thiếu» không nói căn thiếu ba thứ đó, vẫn hiện đủ số chứng minh và phường, không có toà, tầng, số căn, số nhà; tên nguồn thật không xuất hiện ở vai nào, chỉ mã `S0x`; khách không đăng nhập không vào được bảng và trang.
- AC-7 (cross-layer): Given mã căn không có, căn rời danh sách, DB không có bảng và cột của máy thu, danh sách trống, và lỗi DB khác, When mở bảng, `?can=<offerId>` hay trang một căn, Then lần lượt thấy: «Không tìm thấy căn này» có liên kết về danh sách; trang căn kèm nhãn «Đã rời danh sách» nêu đúng lý do (quá 45 ngày, giảm dưới 5%, giảm trên 50%, không tính được mức giảm), `?can=` của căn ngoài danh sách chuyển sang trang đó; trên cloud bảng, sheet, trang đều chạy, có số chứng minh, người liên hệ theo vai và câu «Ảnh, chữ bài chỉ có ở máy thu», không có ô ảnh, không có trường lọc «Ảnh», không nói căn thiếu; trống có «Chưa có căn nào giảm từ 5%…» kèm hành động, lọc không ra căn nào có câu trống kèm nút xoá chip, tab không có căn có câu trống; đang tải có khung xương; khối lỗi có Thử lại. Câu truy vấn của bản cloud chỉ đọc cột có trong `CLOUD_ALLOW` của `pipeline/sync-cloud.mjs`.
- AC-8 (cross-layer): Given DB máy thu thật, When đối chiếu chỉ đọc qua loader, Then 100% căn trong danh sách có đủ giá/m², thước, số tin, mức giảm hoặc có nhãn thiếu tương ứng; mọi căn có dòng `media` có từ một ảnh; mọi căn có bài gốc có chữ; in số căn đạt từng câu theo định nghĩa ở mục Đường đo, ghi rõ là số định hướng; in phân bố ba tab; mọi căn có trong `getDeals` khi và chỉ khi `getDeal` không nêu lý do rời; đếm trước và sau bằng nhau.
- AC-10 (cross-layer): Given máy thu đang chạy, When đăng nhập thật bằng tài khoản thử ba vai và tải HTML cùng dữ liệu RSC của `/ops/deals` và mọi trang một căn, Then vai Người xem 0 lần xuất hiện SĐT, tên, chữ bài, đường dẫn ảnh của căn; vai Vận hành và `admin` có đủ; mỗi căn có dòng `media` có ít nhất một ảnh vai Vận hành tải được, trừ căn mà mọi ảnh chỉ còn link gốc đã hết hạn (nguồn từ chối khi thử trực tiếp); link gốc còn sống mà vai Vận hành không tải được là vi phạm, và phải có ít nhất một căn tải được ảnh; vai Người xem bị từ chối ở cả `?media=` và `?snapshot=`; in tỉ lệ tải được theo từng đường và số căn chỉ còn link hết hạn.
- AC-11 (cross-layer): Given lược đồ tạm có căn đủ ba tab và nhiều phường, When dùng tab, chip lọc, sắp xếp và chuyển căn qua hàm và thành phần thật, Then mỗi căn thuộc đúng một trong ba tab «Đủ để gọi», «Cần xác minh», «Còn thiếu»; số trên tab tính theo chip lọc đang bật; chip Phường, Loại hình, Nguồn, Ảnh với «là» và «không phải» ra đúng tập căn; J và K đi đúng thứ tự đang thấy qua cả ranh trang và dừng ở hai đầu; `?can=<offerId>` mở đúng căn khi tải lại, đóng sheet thì bỏ tham số và hàng vừa xem giữ nền chọn.
- AC-12: Given căn đang xem và ma trận viết trước: cùng phường khác loại hình, khác phường, diện tích đúng biên ±25%, ngoài biên, căn loại hình `unknown`, căn không có diện tích, căn giảm trên 35%, When mở tab «Căn cùng tiêu chí», Then số trên tab và các hàng đúng tập cùng phường, cùng loại hình, diện tích ±25%; tiêu chí không biết thì bỏ và nhãn nói rõ; căn cần xác minh đứng cuối; hàng «Căn này» đứng đầu làm mốc, mỗi căn khác có giá, tr/m², chênh tr/m² đúng dấu, mức giảm; bấm một hàng thì sheet chuyển sang căn đó, vẫn ở tab này; không có căn nào thì có câu trống và nút «Xem mọi căn trong phường», bấm ra đúng mọi căn cùng phường.

## Coverage

- Trục A — Vai phiên: khách | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`] → AC-1, AC-3, AC-6, AC-10.
- Trục B — Bề mặt: hàng của bảng | sheet tab Chi tiết | sheet tab Căn cùng tiêu chí | trang một căn | dữ liệu đưa xuống trình duyệt | tệp ảnh [thước CE: Đặc tả UX mục 2 và `/api/zalo-media`] → AC-1, AC-2, AC-6, AC-10, AC-12.
- Trục C — Năm câu: căn nào | ở đâu | ảnh gì | vì sao giá tốt | gọi ai [thước CE: ngưỡng SỐNG của `opportunity.md`] → AC-1, AC-2, AC-3, AC-4.
- Trục D — Trường thiếu: loại hình | m² | địa chỉ dưới phường | ảnh | chữ bài | SĐT | thước → AC-5, AC-8.
- Trục E — Mức giảm so ngưỡng: 4,9 | 5 | 35 | 36 | 50 | 50,1 [thước CE: `NGHI_NGO_PCT`, `dealsSql`] → AC-4, AC-7.
- Trục F — Nơi chạy và trạng thái: máy thu | cloud (bảng, sheet, trang) | lỗi DB | không tìm thấy | đã rời danh sách | danh sách trống | lọc trống | đang tải → AC-7.
- Trục G — Thao tác quét: tab | chip lọc | sắp xếp | J, K | `?can=` | hàng vừa xem [thước CE: Đặc tả UX mục 4] → AC-11.
- Trục H — Tiêu chí cùng loại: phường | loại hình | diện tích biên ±25% | không biết loại hình | không biết diện tích | giảm trên 35% → AC-12.
- Chân ngành: `[NGÀNH: RESO PropertyType, UnparsedAddress, Media]` → AC-1, AC-2, AC-3.

## Đường đo

- 100% căn hiện đủ số chứng minh hoặc nêu thiếu gì: đối chiếu trên DB máy thu · AC-8 bảo đảm.
- Trả lời từ 4 trên 5 câu ở từ 80% căn chỉ bằng trang một căn: người chấm ở Cổng Giá trị khi danh sách đủ 20 căn (cần CG2). Máy chỉ in số định hướng ở AC-8 theo định nghĩa: «căn nào» = loại hình khác `unknown`; «ở đâu» = có toà hoặc đường, chỉ có phường thì không đạt; «ảnh gì» = có ít nhất một ảnh; «vì sao» = đủ bốn số; «gọi ai» = có SĐT.
- Ngưỡng CHẾT «hơn nửa mẫu phải mở nguồn ngoài mới biết căn ở đâu»: người đọc ở Cổng Giá trị, máy không đo; AC-8 in số căn đạt «ở đâu» theo cột để biết sớm.
- Phiên chấm sớm trên 4 căn của giả định 1: Mạnh chấm trên bản thật ngay sau khi hàng giao, trước CG2, là số định hướng; ngưỡng «chọn 5 căn» chỉ đọc được từ khi có từ 5 căn.
- Vai Người xem không nhận ảnh, chữ, SĐT: page thật · AC-6; đăng nhập thật · AC-10.
- Nơi đọc mọi ngưỡng của mục này: bản máy thu ở hàng này (ảnh, chữ bài chưa lên cloud), theo câu trả lời Hỏi-6.
- Chọn 5 căn trong 10 phút, Mạnh chấm kín từ 7/10: chỉ đọc ở Cổng Giá trị, máy không đo.

## Out of scope

- Lọc theo toà, dự án, đường, lọc phía máy chủ và xếp hạng theo độ tin, khu vực: CG3. Chip lọc của hàng này chỉ lọc các căn đã tải (tối đa 30).
- Tin S06 vào danh sách, sửa định nghĩa ở `CONTEXT.md`, phân trang phía máy chủ, sheet tải theo căn và danh sách cùng tiêu chí đọc từ máy chủ: CG2.
- Căn cùng tiêu chí lấy từ tin ngoài danh sách Căn giá tốt: chưa có số đo cho thấy cần; hàng này chỉ so trong danh sách.
- Sheet không che bảng, bấm được bảng khi đang mở: phải sửa `ui/sheet` là mã vendor.
- Ảnh và chữ bài của Căn giá tốt trên cloud: dữ liệu chưa lên (TV9, TV10); hàng này chỉ nói rõ khi chạy trên cloud.
- Ghi kết quả xác minh, nhãn biên tập, hiện trên Invest: CG5, CG6, CG7.
- Bản đồ vị trí căn: hôm nay 0 căn có toạ độ.
- Tách tên đường hay mã toà từ chữ bài: thuộc `pipeline/`, chưa có số đo cho thấy cần; chữ bài hiện đầy đủ để người đọc.
- AC-9 (đi trọn đường trên bản chạy thật ở sáng, tối và 390 px) không còn là tiêu chí, Mạnh chọn ở trần lượt: lượt chấm 3 đo thấy đạt mọi phần trừ bảng ở 390 px cuộn ngang bên trong (906 px trong khung 348 px, cột đã ẩn vẫn giữ độ rộng); trang không tràn, mức giảm vẫn thấy không phải cuộn. Hạn chế đã biết: thanh cuộn thừa đó còn, và phần này ship không có bằng chứng máy ở lượt chấm cuối.

## Notes

- Dạng bảng cộng sheet và lọc vào hàng này là Mạnh chốt 03/11. Hàng CG3 giữ phần còn lại; khi mở CG3 phải sửa câu giao và số tiêu chí theo phần đã giao ở đây.
- Lời cũ của `people-hien-so-goc` AC-6 và `portal-deals-airdna/E5` («vai Vận hành không ảnh, chữ bài») hết đúng từ hàng này; hai hồ sơ cũ không sửa, test `danh-ba-nguoi-deals-lien-he` đổi theo lời mới trong hàng này.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-03:
  - Ngoài-1: Thẻ để ký phạm vi vẫn nói hai nhóm kiểm tra còn được một tiêu chí đã bị cắt đỡ. Người ký có thể tưởng phần ở màn hình nhỏ vẫn có bằng chứng máy, trong khi thực tế không có.
  - Ngoài-2: Một ảnh chụp trong hồ sơ nghiệm thu còn hiện rõ tên người đăng của một căn, dù báo cáo nói đã làm mờ. Tên này vốn là thông tin công khai của người rao, nên không lộ bí mật nào, chỉ là hồ sơ ghi sai.
  - Ngoài-3: Hồ sơ nghiệm thu khẳng định đã làm mờ tên người đăng nhưng một khung ảnh vẫn đọc được tên. Người đọc hồ sơ bị báo sai, còn người dùng ứng dụng không bị ảnh hưởng.
  - Ngoài-4: Thẻ ký phạm vi còn ghi một tiêu chí đã bị cắt như đang bảo vệ hai nhóm kiểm tra. Người ký thấy thẻ tự mâu thuẫn với phần hạn chế đã biết ngay trên cùng thẻ.
  - Ngoài-6: Mức giảm lẻ hiện là «4.9%» (dấu chấm) trong khi giá hiện «1,5 tỷ» (dấu phẩy), nên một màn có hai kiểu viết số. Số vẫn đúng, chỉ lệch kiểu viết tiếng Việt.
  - Ngoài-7: Địa chỉ trang có đuôi tiếng Việt «?can=» thay vì tên tiếng Anh theo quy ước đặt tên. Người dùng không thấy khác biệt khi dùng.
  - Ngoài-11: Khi danh sách trên 15 căn, mở lại căn ở trang 2 rồi đóng sheet thì bảng quay về trang 1 và người vận hành mất chỗ đang duyệt. Hiện chỉ có 4 căn nên chưa gặp.
  - Ngoài-12: Một số chỗ hiện mức giảm lẻ chưa có phép kiểm tự động, nên sau này sửa nhầm có thể không bị phát hiện. Người dùng hôm nay không thấy lỗi.
  - Ngoài-13: Phép kiểm dòng «Ngưỡng» trên trang một căn quá lỏng, nên bỏ dòng này đi có thể vẫn không bị bắt. Hiện dòng vẫn hiển thị đúng.
  - Ngoài-14: Phép kiểm tự động chưa đọc địa chỉ trang đúng như bản chạy thật, nên có thể bỏ sót lỗi khi tải lại hay bấm quay lại. Chưa có dấu hiệu lỗi thật.
  - Ngoài-15: Thẻ nhỏ hiện khi rê chuột có lề trong hẹp hơn các thẻ khác một chút. Chỉ lệch giao diện, không ảnh hưởng thông tin.
  - Ngoài-16: Liên kết ở dòng Phường có khoảng đệm khác các nút còn lại. Người dùng vẫn bấm bình thường.
  - Ngoài-17: Khi một tab như Đủ để gọi hết căn, người vận hành chỉ thấy câu thông báo mà không có nút quay về tab Tất cả. Họ tự bấm tab Tất cả được.
  - Ngoài-18: Người sửa mã sau này có thể hiểu nhầm cách tên nguồn thật được che khi lỗi. Người dùng hiện tại không thấy gì khác.
  - Ngoài-19: Bài quét tự động có thể không bắt được nếu ai đó vô tình đưa đường dẫn ảnh gốc vào vài tệp phụ. Hiện chưa có lỗi thật nào lộ ra.
  - Ngoài-20: Một ca kiểm cũ về bản cloud chỉ lặp lại điều nó tự đặt sẵn nên không bắt được lỗi. Người dùng không thấy khác biệt gì, chỉ là một lớp kiểm yếu thừa.
