---
schema_version: 1
feature: Luật ghép căn và bảng so thẻ duyệt so ô đường theo tên đường — bỏ ngõ/ngách/hẻm/số nhà và đuôi địa chỉ, không còn loại oan «đường khác»
slug: chuan-hoa-o-duong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-31T09:25:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-chuan-hoa-o-duong-design.md
---

# Acceptance Contract: chuan-hoa-o-duong

## Context

Hàng `chuan-hoa-o-duong` (dãy U2, sau HD2). Nguồn: Ngoài-1 của Cổng Bằng chứng HD2 vòng 2, Mạnh chọn «Tách việc
riêng» ngày 31/10. Hiện `khoaDuong` giữ cả ngõ và số nhà trong khoá, nên «Ngõ 254 Minh Khai» ↔ «Minh Khai» bị luật
loại là «khác căn», và bảng so trên thẻ cũng hiện «Lệch». Trên DB máy thu, 496 trong 8.219 giá trị `street_raw` mang
kiểu ghi này. Sửa ở `khoaDuong` của `app/src/lib/ops/review-can-cu.ts` rồi chép nguyên văn sang
`agent/src/agents/judge-entity.ts`.

## Criteria

- AC-1: Given ma trận viết trước 10 cặp «có tiền tố vị trí ↔ chỉ tên đường» («Ngõ 254 Minh Khai» ↔ «Minh Khai», «Hẻm 80/66 Dương Quảng Hàm» ↔ «Dương Quảng Hàm», «Ngõ 210A Võ Chí Công» ↔ «Võ Chí Công», «Số 10 Ngõ 9 La Dương» ↔ «La Dương», «ngõ 63 ngách 1 Ngô Thì Sỹ» ↔ «Ngô Thì Sỹ», «Ngõ 199 Phố Lò Đúc» ↔ «Lò Đúc», «Kiệt 12 Hùng Vương» ↔ «Hùng Vương», «ngo 5 Kim Ma» ↔ «Kim Mã», «Ngõ 5, Kim Mã» ↔ «Kim Mã», «Số 10, Ngõ 9, La Dương» ↔ «La Dương»), các trường khác trong ngưỡng «cùng căn», When chạy luật cả hai chiều, Then không cặp nào có lý do «đường khác» và mọi cặp ra «cùng căn».
- AC-2: Given số nhà trần và đuôi địa chỉ («175 Lạc Long Quân» ↔ «Lạc Long Quân», «2295 Huỳnh Tấn Phát» ↔ «Đường Huỳnh Tấn Phát», «235 Nguyễn Trãi, Khương Đình, Hà Nội, Vietnam» ↔ «Nguyễn Trãi», «Số 277 Đường Bến Bình Đông, Phường 14, Quận 8» ↔ «Bến Bình Đông»), When chạy luật cả hai chiều, Then không cặp nào có lý do «đường khác».
- AC-3: Given tên đường bắt đầu bằng số («3 Tháng 2» ↔ «Đường 3 Tháng 2», «Đường số 7» ↔ «Đường số 7») và hai đường đánh số khác nhau («Đường số 7» ↔ «Đường số 9», «30 Tháng 4» ↔ «2 Tháng 4»), When chạy luật cả hai chiều, Then hai cặp cùng tên không có lý do «đường khác», còn hai cặp khác số ra «khác căn» — số đứng trước «Tháng <số>» là một phần tên đường, không phải số nhà.
- AC-4: Given ô đường không mang tên đường («4», «Số 8», «Ngõ», «Ngõ 12») ở một bên và «Minh Khai» ở bên kia, When chạy luật cả hai chiều, Then không có lý do «đường khác» và hàng Đường của bảng so thẻ là «Thiếu».
- AC-5: Given hai đường khác nhau dù có tiền tố vị trí («Ngõ 254 Minh Khai» ↔ «Bạch Mai», «Ngõ 12 Hồng Hà» ↔ «Hồng Bàng», «175 Lạc Long Quân» ↔ «Âu Cơ»), When chạy luật cả hai chiều, Then mỗi cặp ra «khác căn» với đúng một lý do `khac_duong`.
- AC-6: Given chữ Ð (Eth, U+00D0) thay cho Đ («Hẻm 135 Trần Hưng Ðạo» ↔ «Trần Hưng Đạo»), When chạy luật cả hai chiều, Then không có lý do «đường khác».
- AC-7: Given mọi cặp của AC-1 tới AC-6 cùng ba cặp khoá đường của HD2 («Duong Lam» ↔ «Dương Lâm», «Đường Đinh Bộ Lĩnh» ↔ «đinh bộ lĩnh», «Duong Lang» ↔ «Đường Láng» — đều Khớp), When so bằng hàm so của bảng so thẻ duyệt (rút nguyên văn `boDau`, `khoaDuong`, `soDuong` từ `app/src/lib/ops/review-can-cu.ts`) và bằng `soDuong` của luật, Then hai bên ra cùng nhãn Khớp / Lệch / Thiếu ở mọi ô, cả hai chiều.
- AC-8: Given mọi giá trị `street_raw` khác nhau trên DB máy thu bắt đầu bằng cụm vị trí ngõ/ngách/hẻm/kiệt/số + số mà phần còn lại có chữ, When so giá trị ấy với phần tên đường còn lại (bộ tách độc lập viết trong test), Then `soDuong` ra «Khớp» ở mọi giá trị (số giá trị ≥ 100); và mọi thẻ ghép căn người đã nhận «Cùng căn» (`review_queue` `entity_match` status `approved`, cùng nghĩa với LT-AC-6 của HD2) có ít nhất một ô đường mang cụm vị trí, số nhà hay dấu phẩy thì không có lý do `khac_duong` — số thẻ ấy in ra, có thể bằng 0.
- AC-9: Given bộ test đã ký đọc khoá đường của thẻ duyệt và luật (`agent/tests/judge-luat.test.ts`, `app/tests/the-duyet-du-can-cu.test.tsx`, `app/tests/the-duyet-phuong-lech-gia.test.tsx`, `app/tests/the-so-gia-tri-song.test.tsx`), When chạy sau thay đổi, Then mọi ca vẫn xanh, không sửa tệp test nào của các hồ sơ ấy.

## Coverage

Quét tay theo ba trục: chiều ô đường, quan hệ hai bên, nơi đọc. Dòng sổ `descope` của tên dự án nằm ở Out of scope.

| Trục | Giá trị | AC |
|---|---|---|
| Dạng ô đường | tiền tố vị trí · số nhà trần · đuôi địa chỉ · tên bắt đầu bằng số · chỉ số / chỉ tiền tố · chữ Eth | AC-1, AC-2, AC-3, AC-4, AC-6 |
| Quan hệ hai bên | cùng đường · khác đường · thiếu tên | AC-1, AC-2, AC-3, AC-4, AC-5 |
| Nơi đọc | luật `apNguong` · bảng so thẻ duyệt · dữ liệu thật máy thu · ca cũ đã ký | AC-1 – AC-6, AC-7, AC-8, AC-9 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Mọi ô đường thật có cụm vị trí đầu chuỗi so «Khớp» với chính tên đường của nó | AC-8, trên DB máy thu (SELECT DISTINCT `street_raw`) |
| Không thẻ «Cùng căn» người đã quyết nào mang lý do «đường khác» | AC-8, trên các thẻ `entity_match` đã duyệt |

## Notes

- Hồ sơ đã ký có eval khai `paths` gồm `app/src/lib/ops/review-can-cu.ts` (bằng chứng sẽ hoá cũ khi vòng này đổi tệp, ghim lại bằng làn máy sau khi chấm): judge-luat-loai-tru-dac-trung, judge-giu-quyet-dinh-nguoi, judge-evidence-du-truong, khoa-phuong-chung-phuong-so, phuong-so, the-duyet-phuong-lech-gia, the-so-doc-gia-tri-song, the-duyet-du-can-cu.

## Out of scope

- Nhận diện tên dự án hay mã nội khu trong ô đường («Vinhomes Ocean Park», «N1»). Hai tin, một tin ghi tên dự án và một tin ghi tên phố, vẫn có thể bị loại «đường khác». Việc này cần danh mục dự án chuẩn.
- Đổi `PHIEN_BAN_NGUONG` hay bất kỳ ngưỡng nào trong `NGUONG`.
- Số nhà trần trước một tên không phải «Tháng <số>» vẫn giữ hai cách đọc: «12 Hồng Hà» ↔ «15 Hồng Hà» Khớp ở hàng Đường (cùng đường, khác số nhà — số nhà chưa là đặc trưng loại, chờ hàng HD5).
- Chạy lại judge-run trên hàng duyệt thật để đổi kết luận của thẻ đang chờ. Đây là việc vận hành sau khi gộp.
