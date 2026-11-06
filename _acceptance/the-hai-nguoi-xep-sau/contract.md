---
schema_version: 1
feature: Thẻ gắn hai người chưa ai gắn xếp cuối nhóm, không chặn người gắn duy nhất
slug: the-hai-nguoi-xep-sau
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-06T04:27:33Z
approved_by:
approved_at:
---

# Acceptance Contract: the-hai-nguoi-xep-sau

## Context

Mạnh chốt 06/11: đợt này bỏ qua các thẻ gắn hai người (`double_label`, 72 thẻ ở lát `s03-theo-nhom`) vì chỉ có một người gắn. `tinKe` (`app/src/lib/labels-queries.ts`) trả thẻ chưa gắn có `item_id` nhỏ nhất của nhóm, nên thẻ hai người đứng đầu chặn cả nhóm: phiên trợ lý gắn nhãn đo 6/25 nhóm đã kẹt (ví dụ N028 #10051), và trước khi mọi nhóm chạm thẻ hai người chỉ còn khoảng 52 nhãn, dưới đích 125. Sửa: lượt một xếp thẻ hai người chưa ai gắn sau cùng trong nhóm; không xoá thẻ, không đổi mẫu, không thêm cờ người dùng phải nhớ.

Source input: giám sát đợt dot0-cam-mau giao theo lời Mạnh, 06/11.

## Criteria

- AC-1: Given nhóm có thẻ hai người chưa ai gắn đứng trước và xen giữa các thẻ đơn, When một người lấy tin kế lần lượt và lưu (có chọn nhóm hay không), Then người đó nhận hết thẻ đơn theo thứ tự `item_id` rồi mới tới các thẻ hai người theo thứ tự `item_id`, hết thì null; người thứ hai nhận thẻ hai người đã có một người gắn trước thẻ đơn còn trống; tiến độ (`tienDo`, `nhomCuaLat`) đếm như cũ; không thẻ nào bị xoá hay đổi cờ.
- AC-2: Given các phép đo cũ của màn gắn nhãn, When chạy lại, Then phân tin hai người (MGN-AC-5), lát theo nhóm (GCN) và phép đo gắn mù PL7 (rút chính câu `tinKe`) vẫn xanh.
- AC-4: Given lát thật `s03-theo-nhom` ở DB máy thu, When đọc chỉ đọc với từng người đã gắn và một người mới, từng nhóm, Then thẻ đầu tiên `tinKe` thật trả cho mỗi cặp người–nhóm không phải thẻ hai người chưa ai gắn khi nhóm còn thẻ đơn người đó gắn được (0 nhóm kẹt); đối chứng: cùng điều kiện tính trên thứ tự cũ chép trong đầu dò kẹt ít nhất một nhóm. Số thẻ đơn người mới với tới chỉ in để đọc, không phải phép đo (tính trên thứ tự chép tay, không qua `tinKe`).
- AC-3: Given mã và hồ sơ, When quét diff so với điểm rẽ nhánh, Then chỉ các tệp được phép đổi: `app/src/lib/labels-queries.ts` (chỉ câu ORDER BY của `tinKe` và chú thích), `app/tests/labels-nhom.test.tsx`, `_acceptance/config.yaml`, `_acceptance/the-hai-nguoi-xep-sau/**`, `docs/**`, `PRODUCT-MAP.md`, `LO-TRINH.html`.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: một trục ngắn liệt kê đủ từ câu xếp.

- Thẻ trong nhóm: thẻ hai người đã một người gắn · thẻ đơn · thẻ hai người chưa ai gắn, một hay nhiều (AC-1).
- Người gắn: người đầu · người thứ hai (AC-1).
- Chọn nhóm: có · không (AC-1).
- Dữ liệu: lát thử · lát thật (AC-1, AC-4).

## Out of scope

- Ẩn hẳn thẻ hai người hay đổi mẫu, cờ `double_label`.
- Lượt hai `luot-hai.tsx` và trang tiến độ.
- Cờ hay nút cho người dùng chọn có gắn thẻ hai người.

## Notes

- Nhánh cắt từ đầu nhánh #328 (cùng tệp `labels-queries.ts`); gộp sau #328.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-1: phép đo trên lát thật vẫn báo xanh khi tin kế trả rỗng cho một nhóm, nên một nhóm hết tin sớm sẽ không bị phép đo bắt.
  - Ngoài-2: AC-4 chỉ chứng không nhóm nào kẹt ở thẻ hai người, chưa chứng mọi nhóm còn thẻ đơn đều nhận được tin.
  - Ngoài-3: với tin ghép, giờ đăng ở màn gắn lượt một có thể khác giờ ở màn lượt hai.
  - Ngoài-4: trên DB thử, tên người đăng có thể bị che sai hoặc để trống vì bước che tên nguồn đọc DB chính thay vì DB thử.
  - Ngoài-5: chiều đỏ của test chỉ kiểm kết quả khác kết quả đúng, chưa ghim giá trị sai mong đợi.
