# Review findings: thang-bac-moi-b0-b5 (round 2)

## Trong hợp đồng

- **demNs1 cộng cả dòng ảnh chụp thang cũ (thang-2310) vào NS1/NS1b, trái AC-6 «NS1, NS1b đếm theo thang mới»**
  AC: AC-6
  file: `scripts/lib/bao-cao-ngay.mjs:61`
  severity: medium
  source: bugs
  detail: demNs1(sau) lọc theo data_level >= B3/B5 trên MỌI dòng của ảnh chụp mới nhất, không xét cột `scale`. Thế mà gom() đã đọc `to_jsonb(s) ->> 'scale'` (null = thang-2310) và oBacGiam có dùng nó. Sau khi gộp mà chưa áp 087 lên máy thu, bac-du-lieu.mjs đi nhánh `chua-ap-087` và không chụp ảnh mới, nên ảnh mới nhất vẫn là ảnh thang cũ, nơi B3 = «Đã đo», B4 = «Xác minh», B5 = «Sống» của cụm properties. NS1 («căn hộ B5, loại khác B3») và NS1b («B3 trở lên») vì vậy đếm căn-cụm thang cũ như thể đã đạt «Gắn căn» của thang 08/11, trong khi theo thang mới con số này phải là 0 tới khi có bảng nối. Ngày đầu sau khi áp 087, chamBang lại so NS1 hôm nay (thang mới) với NS1 hôm qua (thang cũ) mà không có chốt đổi thang như NS3 (`!oGiam.doiThang`). Commit 299a1e78 từng thêm bộ lọc `(r.scale ?? 'thang-2310') === 'thang-0811'` vào demNs1 nhưng đã bị revert (fd0e37ce), nên HEAD vẫn còn lỗi này. Test hiện tại (scripts/bao-cao-ngay.test.mjs) không đưa dòng thang cũ có B3+ vào demNs1 nên không bắt được.

- **Hình dạng 4 (âm-tính-một-mình): chiều đỏ của TB-AC-9 là phép lặp, không chạy bộ chọn CHECK cũ**
  AC: AC-9
  file: `pipeline/scripts/thang-bac.itest.mjs:158`
  severity: high
  source: measurement
  detail: Dòng 148 `assert.doesNotMatch(lech.msg, /moi/)` là assert âm-tính, cần một đối chứng dương cho thấy bộ chọn cũ thật sự ra «thừa [moi]». evals E9 ghi rõ: «bộ chọn CHECK bản cũ (lấy defs[0], giữ trong test làm đối chứng) trên cùng DB ra msg chứa «thừa [moi]»». Đối chứng mà test viết ở dòng 158 là `assert.match([cheo, ...cua][0].def, /huong/)`, trong khi `cheo` vừa được chọn ở dòng trên bằng `cua.find((r) => /huong/.test(r.def))`. Phần tử đầu của mảng do chính test xếp nên luôn khớp /huong/, assert này không thể đỏ. Nó không gọi checkDb với bộ chọn defs[0] và không ghim thông điệp «thừa [moi]». Vì vậy chưa có gì cho thấy, trên DB này, ca âm-tính ở dòng 148 phân biệt được luật mới với luật cũ. Nếu pg_constraint trả CHECK danh sách trước thì luật cũ cũng qua cả ba assert chính.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dòng skip «chua-ap-087» của data-level:distribution hiện mã thô «(chưa diễn giải)» trên /ops/quality**
  Người dùng thấy gì: Khi máy thu chưa áp migration 087, trang chất lượng của Ops hiện một dòng chữ thô «(chưa diễn giải)» kèm mã kỹ thuật thay vì câu tiếng Việt. Chỉ người vận hành thấy, không sai số liệu.
  Căn cứ: Hậu quả nhẹ: chỉ là dòng chữ xấu ở trang nội bộ, biến mất khi áp 087, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `pipeline/bac-du-lieu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Nhãn bậc viết tay trong chữ UI thay vì đọc từ sổ từ vựng**
  Người dùng thấy gì: Câu nêu thang bậc 08/11 trên trang chất lượng gõ cứng tên bậc; nếu sau này đổi nhãn bậc thì câu này có thể lệch với từ vựng chuẩn mà không ai báo.
  Căn cứ: Hôm nay chữ vẫn đúng, chỉ rủi ro lệch khi đổi nhãn về sau; người dùng không mất gì và sửa lúc đó vẫn rẻ.
  file: `app/src/components/ops/quality/do-hang-ngay.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): TB-AC-2 tự cấp cờ `located` cho levelOf, không lấy từ truy vấn bản ghi của app**
  Người dùng thấy gì: Phép so bậc giữa cơ sở dữ liệu và trang Ops chưa đi qua đường đọc thật của trang, nên khi sau này có bảng nối tin với căn, hai bên có thể lệch bậc mà kiểm tra vẫn xanh.
  Căn cứ: Hiện chưa có bảng nối nên mọi tin cùng ra một bậc, chưa sai gì; rủi ro chỉ xuất hiện ở hàng gắn căn sau và khi đó thêm kiểm tra là rẻ.
  file: `app/tests/data-level-sql.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): TB-AC-6 tự gõ khoá `scale` vào dòng ảnh chụp, không đi qua `lay()` của gom()**
  Người dùng thấy gì: Báo cáo ngày được kiểm với dữ liệu dựng tay chứ không qua đường đọc thật; nếu đường đọc thang đọc sai thì báo cáo có thể báo nhầm ô «rời ô» ngày đổi thang mà kiểm tra vẫn xanh.
  Căn cứ: Chỉ là khe hở trong kiểm tra, không phải lỗi đang xảy ra; hậu quả tối đa là một báo cáo ngày báo nhầm một lần, tự rõ khi nhìn và sửa sau rẻ.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình): ca «087 nguyên» của TB-AC-4 chỉ assert rỗng, không có đối chứng dương trong cùng giao dịch**
  Người dùng thấy gì: Một ca kiểm tra có thể xanh dù không đo được gì nếu bước ghi số liệu không tạo dòng nào cho thị trường thử; không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ làm kiểm tra lỏng hơn mong muốn, các ca khác trong cùng thước đã có đối chứng dương, nên chi phí sửa vượt hậu quả.
  file: `pipeline/scripts/thang-bac.itest.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

