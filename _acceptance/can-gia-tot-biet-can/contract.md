---
schema_version: 1
feature: Người vận hành mở một căn trên Căn giá tốt và biết căn nào, ở đâu, ảnh gì, vì sao giá tốt, gọi ai; căn thiếu dữ liệu ghi rõ thiếu gì; vai Người xem không nhận ảnh, chữ bài, liên hệ
slug: can-gia-tot-biet-can
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-03-can-gia-tot-biet-can-design.md
---

# Acceptance Contract: can-gia-tot-biet-can

## Context

Phiên nghiệm thu `people-hien-so-goc` 03/11 chấm 3, «Không sử dụng được», vì vai Vận hành không biết thẻ là căn gì. Hàng CG1 mở ảnh và chữ bài cho vai đó (ADR-0007 đã cho phép, thẻ duyệt đã làm), thêm trang một căn và chứng minh giá tốt. Danh sách hôm nay có 4 căn; đủ 20 căn là việc của CG2.

## Criteria

- AC-1 (cross-layer): Given lược đồ tạm có căn đủ dữ liệu, căn không ảnh và căn loại hình `unknown`, When vai Vận hành mở `/ops/deals` qua page thật, Then mỗi thẻ có tên căn (loại hình, m², phòng ngủ, phường), giá, mức giảm và liên kết tới `/ops/deals/<offerId>`; căn có ảnh hiện ảnh đầu của đúng căn đó, căn không ảnh hiện «Chưa có ảnh» và không có thẻ `img`.
- AC-2 (cross-layer): Given căn có mã toà, tầng, số căn, số nhà, tên đường và SĐT, When vai Vận hành mở trang một căn qua page thật, Then trang hiện đúng từng mục đó, phường, giá, diện tích, tên người đăng và liên kết `tel:+84…`; mục không có dữ liệu không hiện dòng rỗng.
- AC-3 (cross-layer): Given căn có 13 dòng ảnh gồm ảnh đã tải và ảnh lấy hộ, chữ bài dài hơn 200 ký tự, When vai Vận hành hay `admin` mở trang một căn, Then có đúng 12 ảnh theo `media_order`, chữ bài đầy đủ; HTML không chứa URL gốc của ảnh, `?path=` hay `listing_url`; `dealMediaSrc` không còn trong `app/src` và mục 4 của `scripts/check-portal-compliance.mjs` đạt.
- AC-4 (cross-layer): Given các căn giảm 4,9%, 5%, 22%, 35%, 36%, 50% và 50,1% trong lược đồ tạm, When mở danh sách và trang một căn, Then 5% tới 50% vào danh sách, 4,9% và 50,1% không vào; trên 35% mới có nhãn «Cần xác minh»; khối «Vì sao giá tốt» hiện giá/m², thước phường, số tin dựng thước, mức giảm đúng theo dữ liệu; ba ngưỡng trên trang và trong câu SQL đọc cùng một hằng số; đổi thước trong lược đồ tạm thì số hiện đổi theo.
- AC-5: Given ma trận mỗi lần thiếu đúng một trong: loại hình, số m², địa chỉ dưới phường, ảnh, chữ bài, SĐT, thước, When gọi `thieuGi` và vẽ trang, Then khối «Còn thiếu» nêu đúng một nhãn đúng mục đó; căn đủ không có khối này; căn `unknown` ghi «Chưa rõ loại hình».
- AC-6 (cross-layer): Given căn có ảnh, chữ bài, tên, SĐT, When vai Người xem mở danh sách và trang một căn qua page thật, Then HTML và cây phần tử không chứa ảnh, chữ bài, tên, nhóm, số ở mọi dạng, khối «Còn thiếu» không nói căn thiếu ba thứ đó, vẫn hiện đủ số chứng minh và phường, không có toà, tầng, số căn, số nhà; khách không đăng nhập không vào được cả hai trang.
- AC-7 (cross-layer): Given mã căn không có, căn rời danh sách, DB không có bảng và cột của máy thu, và lỗi DB khác, When mở trang một căn, Then lần lượt thấy: «Không tìm thấy căn này» có liên kết về danh sách; trang căn kèm nhãn «Đã rời danh sách» nêu đúng lý do (quá 45 ngày, giảm dưới 5%, giảm trên 50%, mất thước); số chứng minh, người liên hệ và câu «Ảnh, chữ bài chỉ có ở máy thu» không nói căn thiếu; khối lỗi có Thử lại. Câu truy vấn của bản cloud chỉ đọc cột có trong `CLOUD_ALLOW` của `pipeline/sync-cloud.mjs`.
- AC-8 (cross-layer): Given DB máy thu thật, When đối chiếu chỉ đọc qua loader, Then 100% căn trong danh sách có đủ giá/m², thước, số tin, mức giảm hoặc có nhãn thiếu tương ứng; mọi căn có dòng `media` có từ một ảnh; mọi căn có bài gốc có chữ; in số căn đạt từng câu theo định nghĩa ở mục Đường đo, ghi rõ là số định hướng; đếm trước và sau bằng nhau.
- AC-9: Given bản đang chạy với phiên vai Vận hành, When đi từ danh sách tới trang một căn, phóng to ảnh, quay về, ở sáng, tối và 390 px, Then mọi căn có dòng `media` hiện được ít nhất một ảnh thật, ảnh không tải được hiện «Ảnh hỏng» chứ không vỡ, tỉ lệ ảnh hỏng được ghi, không tràn ngang ở 390 px, liên kết gọi bấm được, chữ đọc được ở cả hai nền.
- AC-10 (cross-layer): Given máy thu đang chạy, When đăng nhập thật bằng tài khoản thử ba vai và tải HTML cùng dữ liệu RSC của `/ops/deals` và mọi trang một căn, Then vai Người xem 0 lần xuất hiện SĐT, tên, chữ bài, đường dẫn ảnh của căn; vai Vận hành và `admin` có đủ; mỗi căn có dòng `media` có ít nhất một ảnh vai Vận hành tải được; vai Người xem bị từ chối ở cả `?media=` và `?snapshot=`; in tỉ lệ tải được theo từng đường.

## Coverage

- Trục A — Vai phiên: khách | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`] → AC-1, AC-3, AC-6, AC-10.
- Trục B — Bề mặt: thẻ danh sách | trang một căn | dữ liệu đưa xuống trình duyệt | tệp ảnh [thước CE: Đặc tả UX mục 2 và `/api/zalo-media`] → AC-1, AC-2, AC-6, AC-10.
- Trục C — Năm câu: căn nào | ở đâu | ảnh gì | vì sao giá tốt | gọi ai [thước CE: ngưỡng SỐNG của `opportunity.md`] → AC-1, AC-2, AC-3, AC-4.
- Trục D — Trường thiếu: loại hình | m² | địa chỉ dưới phường | ảnh | chữ bài | SĐT | thước → AC-5, AC-8.
- Trục E — Mức giảm so ngưỡng: 4,9 | 5 | 35 | 36 | 50 | 50,1 [thước CE: `NGHI_NGO_PCT`, `dealsSql`] → AC-4, AC-7.
- Trục F — Nơi chạy và trạng thái: máy thu | cloud | lỗi DB | không tìm thấy | đã rời danh sách | đang tải → AC-7, AC-9.
- Chân ngành: `[NGÀNH: RESO PropertyType, UnparsedAddress, Media]` → AC-1, AC-2, AC-3.

## Đường đo

- 100% căn hiện đủ số chứng minh hoặc nêu thiếu gì: đối chiếu trên DB máy thu · AC-8 bảo đảm.
- Trả lời từ 4 trên 5 câu ở từ 80% căn chỉ bằng trang một căn: người chấm ở Cổng Giá trị khi danh sách đủ 20 căn (cần CG2). Máy chỉ in số định hướng ở AC-8 theo định nghĩa: «căn nào» = loại hình khác `unknown`; «ở đâu» = có toà hoặc đường, chỉ có phường thì không đạt; «ảnh gì» = có ít nhất một ảnh; «vì sao» = đủ bốn số; «gọi ai» = có SĐT.
- Ngưỡng CHẾT «hơn nửa mẫu phải mở nguồn ngoài mới biết căn ở đâu»: người đọc ở Cổng Giá trị, máy không đo; AC-8 in số căn đạt «ở đâu» theo cột để biết sớm.
- Phiên chấm sớm trên 4 căn của giả định 1: Mạnh chấm trên bản thật ngay sau khi hàng giao, trước CG2, là số định hướng; ngưỡng «chọn 5 căn» chỉ đọc được từ khi có từ 5 căn.
- Vai Người xem không nhận ảnh, chữ, SĐT: page thật · AC-6; đăng nhập thật · AC-10.
- Chọn 5 căn trong 10 phút, Mạnh chấm kín từ 7/10: chỉ đọc ở Cổng Giá trị, máy không đo.

## Out of scope

- Lọc mua bán, thuê, khu vực, toà, đường và bảng xếp hạng: CG3.
- Tin S06 vào danh sách và sửa định nghĩa ở `CONTEXT.md`: CG2.
- Ảnh và chữ bài của Căn giá tốt trên cloud: dữ liệu chưa lên (TV9, TV10); hàng này chỉ nói rõ khi chạy trên cloud.
- Ghi kết quả xác minh, nhãn biên tập, hiện trên Invest: CG5, CG6, CG7.
- Bản đồ vị trí căn: hôm nay 0 căn có toạ độ.
- Tách tên đường hay mã toà từ chữ bài: thuộc `pipeline/`, chưa có số đo cho thấy cần; chữ bài hiện đầy đủ để người đọc.

## Notes

- Lời cũ của `people-hien-so-goc` AC-6 và `portal-deals-airdna/E5` («vai Vận hành không ảnh, chữ bài») hết đúng từ hàng này; hai hồ sơ cũ không sửa, test `danh-ba-nguoi-deals-lien-he` đổi theo lời mới trong hàng này.
