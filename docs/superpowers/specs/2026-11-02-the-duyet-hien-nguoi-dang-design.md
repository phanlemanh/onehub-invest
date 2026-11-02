# Thẻ ghép căn hiện người đăng của mỗi tin — thiết kế (HD7, `the-duyet-hien-nguoi-dang`)

Hồ sơ: `_acceptance/the-duyet-hien-nguoi-dang/` · hàng HD7 của `docs/plan/lo-trinh.json` · căn cứ: audit hàng duyệt 30/10
(`docs/research/audit-hang-duyet-3010.md` §3b, H14, H17, §5.1, §7.1 câu 5). Đứng trên HD6 và HD4, cả hai đã ở `main`.

## Vấn đề

Bảng so của thẻ ghép căn không có người đăng. Thẻ duy nhất được duyệt «Cùng căn» có lý do «cùng người đăng», người duyệt phải
tự đọc ra từ văn bản (H14). Người duyệt cũng không biết Tin B đến từ một tài khoản rao hàng nghìn tin: đo 02/11 trên máy thu,
4/7 thẻ chờ có Tin B của một tài khoản 2.872 tin đang rao, mà một Tin A ghép với nhiều tin của cùng một sàn thì nhiều nhất một
cặp đúng (H17). Danh bạ Người (055, HD13, HD17) đã có đủ dữ liệu.

## Cách làm

**Đọc lúc mở thẻ, không ghi gì.** Người đăng đọc từ danh bạ trong `loadReviewContext`, cùng chỗ với giá trị sống của HD6, qua
một truy vấn thứ hai chỉ chạy cho tin của thẻ `entity_match`. Không đổi `evidence`, không đổi `judge-entity`, không đổi route
decide: người đăng chỉ để hiện, không để tự quyết (audit §5.1, luật 7).

**Mỗi tin một `BenNguoi`:** mã nguồn, tên và SĐT trên tin, danh sách `NguoiDang` (`party_roles` vai `nguoi_dang` còn sống). Mỗi
người: `party_key`, tên (bí danh `ten` mới nhất), các SĐT (bí danh `sdt` còn sống), số tin đang rao, căn cứ của vai.

**Số tin đang rao** = số tin khác nhau của người đó trong `party_roles` còn sống mà tin còn `retired_at IS NULL` trong
`sale_offers`. `/ops/people` đếm vai sống kể cả tin đã rời kho, nên hai trang có thể lệch: trang này nói «đang rao» nên phải đếm
tin sống. Trang kia không đổi ở vòng này.

**Một tin nhiều người gửi** (72 tin S03 đo 02/11, nhiều nhất 11 người; Hỏi-1): ô hiện người neo rồi «+n người khác». Người neo là người có
bí danh `tai_khoan_nguon` bằng `seller_ref` của tin (HD4: người gửi bài neo; S06 bỏ tiền tố `ct:`); chưa khớp thì `party_key` nhỏ
nhất. Đo 02/11, tin S03 trên máy thu còn `seller_ref` hằng vì transform chưa chạy lại sau #265, nên hôm nay S03 đi nhánh dự phòng.
So theo cả tập người của tin, không chỉ người neo.

**Luật so của hàng, theo thứ tự, tất định** (audit §7.5, §3b.3):

| Điều kiện | Nhãn | Dòng phụ |
|---|---|---|
| Một bên rời kho, hoặc một bên không có định danh nào | Thiếu | — |
| Hai tin chung một `party_key` | Khớp | «Cùng người trong danh bạ: <tên người chung>» |
| Không chung người, chung một SĐT E.164 (của tin hoặc bí danh của người) | Không so được | «Cùng SĐT <số>» |
| Cùng nguồn, cả hai có người trong danh bạ, không chung gì | Lệch | — |
| Cùng nguồn, một bên chỉ có SĐT, không chung gì | Thiếu | — |
| Khác nguồn, không chung gì | Không so được | cờ tên gọi nếu có |

Audit §7.5 sửa câu giao của chính hàng này: «so "Người đăng" theo `party_key`, cả khi khác nguồn, sau khi có `nguoi-noi-theo-sdt`. Trước đó thì ghi "Không so được"». HD13 mới gộp trong một nguồn, nên hôm nay hai nguồn chưa chung người được. Khớp chỉ khi danh bạ đã nói cùng người; SĐT trùng mà danh bạ chưa nối là sự kiện hiện ra cho người duyệt, không phải nhãn. Đo 02/11 không SĐT nào mang hai người trong một nguồn (SĐT là bí danh duy nhất mỗi nguồn; tin nhiều–nhiều mang vai của cả người theo tài khoản lẫn người theo SĐT, nên hai tin cùng số chung người theo SĐT và ra Khớp), nên dòng «chung SĐT khác người» chỉ còn ở khác nguồn. Khi Khớp qua người không phải người neo, dòng phụ nêu tên người chung: ô chỉ hiện người neo, không nêu thì nhãn không kiểm được bằng mắt.

**Cờ tên gọi** (ô So của hàng, chỉ khi «Không so được»): chữ cuối của tên người neo Tin B, dài từ 2 ký tự, xuất hiện nguyên từ, đúng dấu, chữ đầu viết hoa trong toàn văn Tin A. Hiện «Tên gọi «X» có trong văn bản Tin A». Đây là cờ, không vào nhãn So. So đúng dấu và đòi hoa để «mình» không thành «Minh», «an ninh» không thành «An»; «hướng Nam» và «Hồ Chí Minh» vẫn bật, ghi ở Notes của hợp đồng.

**Badge «Đăng n tin»** khi người nhiều tin nhất của một tin có từ 10 tin đang rao (ngưỡng audit §5.1; p99 tài khoản S06 là 17). Hỏi-1, Hỏi-2: nháp lấy người nhiều tin nhất, không chỉ người neo (đo 02/11: 4/72 tin nhiều người có người từ 10 tin mà người neo dưới 10), và áp cả hai bên. Người neo dưới ngưỡng vẫn hiện chữ phụ «n tin đang rao» của chính họ, cạnh Badge nếu có. Không dùng `NGUONG_MOI_GIOI` (5) và nhãn «Có
thể là môi giới» của `/ops/people`: câu giao và audit nói số tin, không suy vai.

**Vị trí:** nháp để hàng đứng đầu bảng so, trước Giá (Hỏi-3): câu giao đòi «nhận ra ngay», và hàng cao hơn hàng khác nên để cuối dễ bị cuộn mất. Mười hàng cũ không đổi (`TRUONG_GHEP_CAN` giữ nguyên vì
`judge-entity` có bản chép và test HD6 ghim mười hàng); hàng mới là prop riêng của `ReviewCompare`.

**Thẻ đứng riêng** (không ngữ cảnh, hay ngữ cảnh không có khoá `nguoiDang`): không hiện hàng. Không biết thì không hiện một ô trống mang
nghĩa «không có người đăng»; các test PL3/HD6 dựng thẻ đứng riêng giữ nguyên. Cloud và viewer dừng trước `loadReviewContext` từ PL3.

Tên «unknown» (S05 ghi khi nguồn không có tên) không phải một tên: bỏ qua, ô hiện «—». Tên và SĐT hiện nguyên, không che: tầng C (AGENTS.md luật 6), Mạnh nhắc lại 02/11.

## Đặc tả UX

<!-- ux-spec:start -->
- **Màn:** sheet chi tiết thẻ ghép căn ở `/ops/review` (vai `ops`/`admin`, máy thu). Không màn mới.
- **Khuôn IA đã chọn + căn cứ:** giữ khuôn bảng so của PL3 (Trường · Tin A · Tin B · So), thêm một hàng. Một khuôn khả dĩ, không tra mẫu.
- **Trạng thái của hàng Người đăng:**
  | Trạng thái | Ô Tin A/B | Ô So |
  |---|---|---|
  | Người trong danh bạ, dưới 10 tin | tên · SĐT · «n tin đang rao» · căn cứ vai | Badge theo luật so |
  | Người từ 10 tin | tên · SĐT · Badge «Đăng n tin» · căn cứ vai | Badge theo luật so |
  | Nguồn giấu SĐT | tên · «Chưa có SĐT» · số tin · căn cứ vai | Badge theo luật so |
  | Tin nhiều người gửi | người neo + «+n người khác»; Badge của người khác đứng dưới dòng ấy, không dưới tên người neo | so theo cả tập |
  | Tin chưa có trong danh bạ | tên trên tin (nếu có) · SĐT (nếu có) · «Chưa có trong danh bạ» | Thiếu nếu không có định danh để so |
  | Bên rời kho | «—» | Thiếu; Alert của HD6 đã báo |
  | Thẻ đứng riêng | không có hàng | không có hàng |
- **Tải, trống, lỗi:** hàng nằm trong dữ liệu server của trang; không vùng tải riêng. Truy vấn người lỗi thì cả trang rơi vào lỗi đang có của
  `review-content`, như truy vấn ngữ cảnh của PL3.
- **Thành phần:** `Table` đang dùng, `Badge` (`@/components/reui/badge`) mặc định cỡ, `warning-light` cho «Đăng n tin», `outline` cho
  «Không so được». Chữ phụ `text-xs text-muted-foreground`. Không thành phần mới, không chuyển động mới.
- **Chữ:** «Người đăng», «Chưa có SĐT», «n tin đang rao», «Đăng n tin», «+n người khác», «Chưa có trong danh bạ», «Không so được», «Cùng người
  trong danh bạ: <tên>», «Cùng SĐT <số>», «Tên gọi «X» có trong văn bản Tin A». Số ngăn nghìn kiểu `vi-VN`; SĐT và tên `translate="no"`.
<!-- ux-spec:end -->

## Phép đo

Test `app/tests/the-duyet-hien-nguoi-dang.test.tsx` theo khuôn `the-so-gia-tri-song.test.tsx`: lược đồ tạm `nd_<pid>`, `loadReviewContext` thật,
`ReviewCard` thật trong jsdom, chiều đỏ bằng bản chép tạm đổi đúng một chỗ, probe DB máy thu chỉ SELECT và bỏ qua có lý do dưới CI. Một ui-check
trên thẻ thật ở cổng dãy U2 (:3461).
