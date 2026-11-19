---
schema_version: 1
feature: Trong sheet Căn giá tốt, tab «Căn cùng tiêu chí» và nút «Xem mọi căn trong phường» đếm, liệt kê căn cùng tiêu chí trên toàn tập đã lọc, không chỉ trang đang xem
slug: can-cung-tieu-chi-toan-tap
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: machine-cleared
approved_by: Mạnh
approved_at: 2026-11-19
design_doc: docs/superpowers/specs/2026-11-19-can-cung-tieu-chi-toan-tap-design.md
---

# Acceptance Contract: can-cung-tieu-chi-toan-tap

## Context

Hàng CG17, làm ngay sau CG3 trên cùng màn `/ops/deals`. Cổng Đáng: Mạnh «Làm cả ba» 2026-11-19T04:57:19Z (`opportunity.md`).
Từ CG3 danh sách đọc theo trang ở máy chủ, nên tab «Căn cùng tiêu chí» của sheet chỉ so trong trang đang xem: đo 19/11 trên tin bán,
trang 1 cỡ 15 có 12/15 dòng hiện 0 trong khi lệnh đếm toàn tập ra 1/15. Tiêu chí giữ nguyên lời Mạnh 02/11 (cùng phường, cùng loại hình,
diện tích ±25%, nới được về cả phường); vòng này chỉ đổi tập để so. Kèm AC-10 của CG3 trở lại (AC-9 dưới đây). Truy vấn chỉ chọn tin
nào hiện, không tính lại điểm (luật 10). Thiết kế: `design_doc`.

## Criteria

- AC-1 (cross-layer): Given tập căn viết trước có căn cùng tiêu chí nằm ở trang khác, căn ở đúng biên diện tích ±25% và ngay ngoài biên,
  hai phường trùng tên khác mã, và một căn có hai tin, When dựng trang 1 ở cỡ 15 và cỡ 50, Then số «Căn cùng tiêu chí» của mọi dòng bằng
  số đếm viết tay trên toàn tập đã lọc: cùng mã phường, cùng loại hình, diện tích trong ±25%, không tính chính căn đó, căn hai tin tính một lần; căn ứng viên không có
  diện tích hay chưa rõ loại hình không được tính khi căn đang xem có trường ấy (giữ luật của `canCungTieuChi` đã ký 02/11).
- AC-2 (cross-layer): Given một căn có hơn 20 căn cùng tiêu chí trải nhiều trang, When mở tab «Căn cùng tiêu chí», Then danh sách lấy từ toàn
  tập, đúng 20 căn phân biệt đầu theo thứ tự căn không cần xác minh trước, giảm nhiều trước, rồi mã căn tăng dần, mọi căn đều thoả tiêu chí, kèm câu «Hiện 20 / N căn
  cùng tiêu chí» với N bằng số trên nhãn tab.
- AC-3 (cross-layer): Given một căn, When bấm «Xem mọi căn trong phường», Then số là mọi căn cùng mã phường trên toàn tập đã lọc, bỏ tiêu chí
  loại hình và diện tích, danh sách là tối đa 20 căn đầu cùng thứ tự AC-2 kèm «Hiện 20 / M căn» khi M > 20; nút ghi số căn đó cả khi tab đang trống lẫn có danh sách; «Chưa có căn nào cùng tiêu chí» chỉ hiện khi
  số đếm ra 0, và khi số theo phường cũng 0 thì không có nút nới.
- AC-4: Given căn không có diện tích, căn chưa rõ loại hình, căn chưa gắn phường, When mở tab, Then tiêu chí thiếu bị bỏ và tab ghi đúng câu
  «Chưa có diện tích nên không so diện tích» hay «Chưa rõ loại hình nên không so loại hình»; căn chưa gắn phường ghi «Chưa gắn phường», số 0, không nút nới.
- AC-5 (cross-layer): Given cùng một căn, When đổi bán hay thuê, loại hình, vị trí (tỉnh, phường, dự án) hay tab đang mở, Then số và danh sách
  theo tập đã lọc bằng `kind`, `type`, `location`, `project`, không đổi theo tab; chọn một dự án thì chỉ so căn của dự án đó.
- AC-6: Given danh sách cùng tiêu chí có căn nằm trong trang đang xem và căn ở trang khác, When bấm từng căn, Then căn trong trang mở sheet ở
  chính căn đó và bảng dời đúng trang; căn ở trang khác mở trang một căn `/ops/deals/<mã>`.
- AC-7 (cross-layer): Given vai Người xem, Vận hành và người chưa đăng nhập, When gọi đường lấy danh sách cùng tiêu chí, Then người chưa đăng
  nhập hay không có quyền Ops bị từ chối, vai Người xem nhận danh sách không có tên, SĐT, ảnh, chữ bài, địa chỉ dưới phường, vai Vận hành
  nhận đủ; trên lược đồ cloud không có bảng của máy thu, số và danh sách vẫn chạy.
- AC-8: Given từng trạng thái `ST-cung-tieu-chi-*`, When dựng tab, Then lúc tải có `Skeleton`, lỗi có «Thử lại» và bấm lại thì tải lại, hai ca
  trống đúng chữ và đúng nút; đổi căn bằng J/K khi kết quả của căn cũ về muộn thì tab chỉ hiện kết quả của căn đang xem.
- AC-9 (cross-layer): Given DB máy thu, mọi phép so đọc trong MỘT snapshot nhất quán, When mở màn không lọc, Then 15/15 dòng đầu là căn «Giá tốt»
  cấp dự án, số trên tab khớp lệnh đếm độc lập, đi hết các trang được đúng `tong` mã phân biệt, chọn Vinhomes Ocean Park 1 cho số bằng lệnh đếm với
  mã `1`, số «Căn cùng tiêu chí» của mọi dòng trang 1 ở cỡ 15 và 50 bằng lệnh đếm độc lập, `/ops/deals` trả HTML xong trong 3 giây và danh
  sách cùng tiêu chí của căn thuê có nhiều căn cùng tiêu chí nhất về trong 1,5 giây, trung vị ba lần khi máy yên (ghi tải máy);
  màn đọc được ở sáng, tối, 390 px không cuộn ngang trang, và vai Người xem không thấy cột «Gọi ai».
- AC-10 (cross-layer): Given căn bán ở trang 3 của danh sách theo trang (ngoài 30 căn đầu của danh sách cũ), căn thuê, căn nằm ở trang 1, và căn
  đã rời tập, When mở `/ops/deals/<mã>` rồi bấm crumb «Căn giá tốt», Then căn còn trong tập về danh sách đúng `kind` và đúng trang chứa căn, sheet mở ở
  căn đó, không quay lại trang một căn; căn đã rời tập về `/ops/deals`. Gồm Ngoài-3 của CG3 — Mạnh chọn mở hợp đồng mới tại Cổng Bằng chứng CG3 19/11.

## Coverage

Quét theo khuôn ma trận kiểm thử. Số trong ô đếm từ DB máy thu 19/11, một snapshot `REPEATABLE READ READ ONLY`, trên tập của bước đọc nhẹ
(nhãn hạng, 45 ngày, dưới trung vị 5–50%), mỗi căn một dòng.

| Trục | Giá trị và số căn | Ai đọc đầu ra | AC |
|---|---|---|---|
| Kind | bán 7.613 · thuê 9.711 | Tab «Căn cùng tiêu chí» | AC-1, AC-5 |
| Số căn cùng tiêu chí (toàn tập) | bán: 0 ở 476 căn · trung vị 11 · p90 53 · lớn nhất 144; thuê: 0 ở 551 · trung vị 12 · lớn nhất 720 | Nhãn tab, câu «Hiện 20 / N» | AC-1, AC-2, AC-3 |
| Trang 1 hôm nay | bán cỡ 15: 12 dòng hiện 0, đúng ra 1 · cỡ 50: 44 hiện 0, đúng ra 5; thuê cỡ 15: 15 hiện 0, đúng ra 0 | Người vận hành | AC-1, AC-9 |
| Tiêu chí bị bỏ | thuê không diện tích 736 · chưa rõ loại hình 0 · chưa gắn phường 0 | Dòng «bỏ tiêu chí» | AC-4 |
| Nới về phường | trung vị bán 62, thuê 104; lớn nhất 224, 730 | Nút «Xem mọi căn trong phường» | AC-3 |
| Căn nhiều tin | 493 căn bán có từ hai tin (đo 18/11 ở CG3) | Số đếm | AC-1 |
| Bộ lọc | kind × type × vị trí × tab | Số và danh sách | AC-5 |
| Nơi căn được bấm | trong trang · trang khác | Sheet hay trang một căn | AC-6 |
| Vai | chưa đăng nhập · Người xem · Vận hành · Quản trị | Dữ liệu gửi xuống trình duyệt | AC-7 |
| Nơi chạy | máy thu · cloud | Số, danh sách | AC-7 |
| Trạng thái tab | tải · có · trống · trống phường · lỗi · về muộn | Người vận hành | AC-8 |
| Phép đo trên DB máy thu | một snapshot · máy yên | Người ký | AC-9 |
| Crumb trang một căn (Ngoài-3 CG3) | căn trang 1 · căn trang 3 · căn thuê · căn rời tập | Người vận hành duyệt nhiều căn | AC-10 |

Ô bỏ, ngoài phạm vi: tiêu chí số phòng ngủ, toà, tầng (lời Mạnh 18/11, hàng sau). `[GIẢ ĐỊNH]` không có dòng nào.

## Đường đo

- Số dòng trang 1 hiện «0 căn cùng tiêu chí» so với lệnh đếm toàn tập (bán cỡ 15: hôm nay 12, đích 1; cỡ 50: hôm nay 44, đích 5):
  `probes/do-may-thu.sh` đo trên DB máy thu, đọc trong một snapshot (AC-1, AC-9).
- «Chưa có căn» chỉ hiện khi lệnh đếm ra 0: AC-3.
- Năm ý của AC-10 cũ của CG3: AC-9.

## Out of scope

- Thêm tiêu chí số phòng ngủ, toà, tầng, đường vào «cùng tiêu chí» (lời Mạnh 18/11: hàng sau).
- Đổi tiêu chí hay biên ±25% đã chốt 02/11.
- Sheet đầy đủ (ảnh, chữ bài, mặt bằng) cho căn ở trang khác: căn ấy mở bằng trang một căn.
- Danh sách lùi khi chưa có bảng hạng: giữ so trong danh sách đang tải.
- Bảng tính sẵn, migration, API công khai `/v1/deals`.

## Known limits

- Số trên nhãn tab là số của lần tải trang; sau một lượt nạp giữa chừng, danh sách khi mở tab có thể lệch vài căn so với nhãn. Danh sách ghi tổng của chính nó.

## Notes

- Ngoài-1 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Một tệp cấu hình tự sinh bị đổi lẫn vào thay đổi này. Người dùng không thấy gì khác, chỉ làm lịch sử thay đổi rối hơn. — `app/next-env.d.ts`
- Ngoài-2 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Cách viết một số trang bị uốn theo bài kiểm thử, nên sau này ai sắp xếp lại mã có thể làm bài kiểm thử hỏng mà không rõ lý do. Người dùng cuối không thấy ảnh hưởng. — `app/src/app/ops/deals/[offerId]/page.tsx`
- Ngoài-3 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Cùng một khuôn dữ liệu được khai ở hai chỗ, nếu sau này một bên đổi mà bên kia quên thì tab có thể hiện sai. Hiện hai bên đang khớp nên người dùng chưa gặp gì. — `app/src/components/ops/deal-similar.tsx`
- Ngoài-4 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Một tệp tự sinh bị đổi lẫn vào thay đổi này và sẽ lật qua lại mỗi lần chạy. Người dùng không thấy ảnh hưởng nào. — `app/next-env.d.ts`
- Ngoài-5 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Bài kiểm thử giao diện dùng dữ liệu tự viết nên nếu phần lấy dữ liệu đổi khuôn thì bài vẫn xanh trong khi tab có thể hiện sai số hoặc sai danh sách. Hiện chưa có bằng chứng tab hiện sai. — `app/tests/can-cung-tieu-chi-bam.test.tsx`
- Ngoài-6 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Bài kiểm thử chỉ đổi từng bộ lọc một, nên lỗi chỉ xuất hiện khi kết hợp nhiều bộ lọc (ví dụ chọn dự án rồi đổi tab) có thể lọt qua. Người dùng khi đó có thể thấy số hoặc danh sách lệch. — `app/tests/can-cung-tieu-chi.test.tsx`
- Ngoài-7 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Trường hợp căn chưa gắn phường chưa có bài kiểm thử riêng, nên nếu hiện sai câu «Chưa gắn phường» hay vẫn hiện nút mở rộng thì chưa ai biết. Đo thực tế cho thấy hiện chưa có căn nào như vậy. — `app/tests/can-cung-tieu-chi.test.tsx`
- Ngoài-8 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Phép đo trên dữ liệu thật mới đối chiếu số của hai trong bốn tab, nên số ở hai tab còn lại chưa được kiểm độc lập. Người vận hành có thể thấy số lệch mà chưa ai phát hiện. — `_acceptance/can-cung-tieu-chi-toan-tap/probes/do-may-thu.mts`
- Ngoài-9 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Bài kiểm thử cho nút quay về «Căn giá tốt» có thể chấp nhận một đường dẫn sai miễn khác đường dẫn cũ. Nếu lỗi quay về sai trang xảy ra, người vận hành sẽ bị đưa nhầm trang rồi phải tự điều hướng lại. — `app/tests/can-cung-tieu-chi.test.tsx`
- Ngoài-10 (máy định tuyến 2026-11-19, đề xuất S4 known-limits): Ảnh chụp màn hình làm bằng chứng lấy từ một bản chạy ở thư mục khác tại một mốc cố định, nên thay đổi về sau không được phủ. Hiện mã giữa mốc đó và bản đang kiểm chưa khác nhau. — `_acceptance/can-cung-tieu-chi-toan-tap/evals.yaml`
