---
schema_version: 1
feature: Bảy phân khu do thẻ luật S16 đúc trùng nơi với phân khu đã có được nối về nút cũ, và bước khớp không đúc nút trùng nữa
slug: noi-phan-khu-trung-s16
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, web]
status: approved
design_doc: docs/superpowers/specs/2026-11-19-noi-phan-khu-trung-s16-design.md
approved_by: Mạnh
approved_at: 2026-11-19T00:28:56Z
---

# Acceptance Contract: noi-phan-khu-trung-s16

## Context

Luật phân khu S16 số 2 đúc bảy nút trùng nơi với phân khu đã có, kéo 50 toà khỏi nút cũ. Hàng này sửa bước khớp để không đúc nút trùng,
thêm thẻ luật bổ sung nối bảy cặp về nút cũ, và cho các bên đọc bỏ qua nút đã nghỉ. Việc áp lên DB máy thu đi theo chữ ký Cổng Bằng chứng
kèm băm của thẻ luật bổ sung.

## Criteria

- AC-1: Given khoá khu S16 đã nằm trên một nút chưa nghỉ ở bất kỳ tầng nào của cây dự án, kể cả nút loại `building`, When dựng thẻ luật phân khu, Then khu đó ra «đã gán» và không có nút mới; nút đã nghỉ mang khoá thì không được tính là đã gán.
- AC-2: Given khu S16 chưa gán, When dựng thẻ luật, Then khu nhận một nút khi ít nhất một nửa số toà của khu có S09 và mọi toà có S09 cùng về nút đó (cụm thắng phân khu cha); toà rẽ từ hai nút trở lên thì khu ra «mơ hồ» và không đúc; dưới một nửa số toà có S09 hoặc không có S09 thì giữ luật so tên hiện tại.
- AC-3: Given các nút do luật S16 đúc, When dựng thẻ nối, Then thẻ liệt từng cặp nút mới → nút cũ kèm số toà có bằng chứng trên tổng toà, liệt các ca không nối kèm lý do, in băm và không ghi gì vào DB.
- AC-4: Given thẻ nối và băm, When áp, Then băm lệch thì không ghi gì; băm đúng thì khoá khu và bí danh chuyển về nút cũ, id nút cũ giữ nguyên, nút mới mang `meta.nghi` và thành con của nút giữ lại, ghi đúng một dòng luật, toà về nút cũ qua view, áp lần hai không đổi gì.
- AC-5: Given một lượt nối đã áp, When đảo theo mã luật, Then nút cha, meta, bí danh của mọi nút trong cặp về đúng trước khi áp, view toà trùng trước khi áp, dòng luật ghi người và giờ đảo.
- AC-6: Given có nút đã nghỉ, When đọc danh bạ Ops (danh sách, chi tiết dự án) hoặc danh sách phân khu của thẻ địa chỉ nhóm, Then nút nghỉ không hiện và không được đếm, nút thường vẫn hiện; cổng Invest và API công khai chỉ đọc nút dự án.
- AC-7: Given đã nối, với nút giữ lại là phân khu con trực tiếp, cụm cháu của dự án và nút loại `building`, When lượt dựng đêm chạy hai lần, Then không có khoá mới, không có phân khu mới, số nút không đổi và toà vẫn ở nút cũ.
- AC-8: Given đã nối, When chạy bộ soát S16 của đường cloud trên `asset_nodes`, Then bộ soát sạch và meta chỉ mang băm khoá khu; cấy một mã khu thô thì bộ soát dừng.
- AC-9: Given bản chép DB máy thu, When chạy trọn chuỗi thẻ nối, áp, kiểm, dựng lại, đảo, Then có đúng 7 cặp với số toà có bằng chứng trên tổng toà là 11/11, 15/15, 4/4, 3/3, 5/5, 6/7, 5/5, 50 toà đổi nút, 0 toà khác đổi, các nút giữ lại đạt 41=11, 42=16, 40=4, 23=7, 43=5, 33=3, 27=5, thẻ luật dựng lại 61 khu đã gán, 0 mới, dựng lại đủ năm dự án có S16 không thêm nút nào, và đảo về đúng dấu vân tay trước áp.
- AC-10: Given một lượt nối đã áp, When chạy lệnh kiểm sau, Then lệnh thoát 0 khi mọi nút giữ lại có toà; thoát 1 và nêu id nút khi một nút giữ lại rỗng, khi còn toà ở nút nghỉ, khi toà S16 còn treo dưới dự án, hoặc khi một nút chưa nghỉ khác nút giữ lại mang khoá khu của một cặp đã nối.

## Coverage

Bảng phủ ca đếm trên DB máy thu nằm trong design doc. Trục và ca:

- Vị trí khoá khu: con trực tiếp, nút cháu, nút loại building, nút nghỉ → AC-1
- Bằng chứng S09: về một nút, cụm và phân khu cha, rẽ hai nút, dưới một nửa số toà, không có → AC-2
- Thẻ nối: có cặp, ca không nối, băm → AC-3
- Áp: băm lệch, băm đúng, áp lần hai → AC-4; đảo → AC-5
- Bên đọc: Ops danh sách và chi tiết, thẻ địa chỉ, Invest, API công khai → AC-6; dựng đêm theo ba loại nút giữ lại → AC-7; cloud → AC-8; PL20 → điều kiện ở Notes
- Dữ liệu thật: bảy cặp trên bản chép → AC-9; chiều nút cũ rỗng → AC-10

## Đường đo

- Toà về nút cũ và nút cũ không rỗng: lệnh kiểm sau của AC-10, số thật báo cạnh số chạy thử của AC-9.
- Lượt dựng đêm không đúc lại nút trùng: chạy lại lệnh kiểm của AC-10 sau lượt đêm thật đầu tiên kể từ lúc áp, báo số cạnh số chạy thử.

## Out of scope

- 387 The Beverly Solari phủ hai phân khu 46 và 47: ngoài phạm vi, vì một khu S16 ứng với hai phân khu S09, cần người chọn cách tách.
- 398 Sapphire 2 (0 toà): ngoài phạm vi, vì không có toà làm bằng chứng.
- 389 Rainbow với 48 The Rainbow: ngoài phạm vi, vì chỉ gần tên, không có bằng chứng toà.
- Trùng giữa các nút mới 409/412, 419/421, 406/411: ngoài phạm vi, vì không có nút cũ làm đích và mỗi nút có tối đa một toà.
- Hai toà S1, S2 của The Senique đang treo dưới Ocean Park 1 và phân khu The Senique: ngoài phạm vi, là việc dựng phân khu riêng.
- Công cụ gộp nút tổng quát trên Ops (DA19): ngoài phạm vi, hàng này chỉ nối bảy cặp qua thẻ luật.

## Notes

- Áp lên DB máy thu cần chữ ký Cổng Bằng chứng kèm băm thẻ nối; hồ sơ áp phải đủ lệnh áp, số chạy thử, sao lưu trước, cách lùi, lệnh kiểm sau.
- Điều kiện chặn với PL20: lát nhãn chỉ rút sau khi việc nối đã áp VÀ bản PL20 có lọc nút nghỉ đã vào `main`; PL20 chưa ở `main` nên hàng này không đo được truy vấn của nó, ca lọc nằm trong test của hàng PL20.
