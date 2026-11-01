---
schema_version: 1
feature: Ô đường viết không dấu so như dạng có dấu — «30 thang 4» ↔ «2 thang 4» là hai đường khác, «3 thang 2» không bị coi số 3 là số nhà, ô chỉ «Ngo»/«Hem» là thiếu tên đường
slug: duong-thang-n-khong-dau
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-01T00:55:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-duong-thang-n-khong-dau-design.md
---

# Acceptance Contract: duong-thang-n-khong-dau

## Context

Hàng `duong-thang-n-khong-dau` (dãy U2), sinh từ Ngoài-4 của Cổng Bằng chứng `chuan-hoa-o-duong`. Mạnh duyệt Cổng Đáng
«Làm, gộp cả ba» ngày 01/11, tức gộp luôn ba giới hạn cùng lớp không dấu: Ngoài-2, Ngoài-3, Ngoài-5. Lỗi gốc: trong
`khoaDuong` (`app/src/lib/ops/review-can-cu.ts`, chép nguyên văn ở `agent/src/agents/judge-entity.ts`), ngoại lệ
«tháng <số>» và phép thử «ô chỉ có từ vị trí» chỉ nhận chữ có dấu. Hậu quả là ô gõ không dấu ra khoá khác hẳn dạng có dấu.

## Criteria

- AC-1: Given hai đường đánh số viết không dấu («30 thang 4» ↔ «2 thang 4», «19 thang 5» ↔ «26 thang 3»), các trường khác trong ngưỡng «cùng căn», When chạy luật cả hai chiều, Then mỗi cặp ra «khác căn» với đúng một lý do `khac_duong`.
- AC-2: Given cùng một đường đánh số viết có dấu và không dấu («30 thang 4» ↔ «30 Tháng 4», «3 thang 2» ↔ «Đường 3 Tháng 2», «Cach Mang Thang 8» ↔ «Cách Mạng Tháng 8»), When chạy luật cả hai chiều, Then không cặp nào có lý do «đường khác».
- AC-3: Given «3 thang 2» ↔ «Tháng 2» và «3 thang 2» ↔ «thang 2», When so đường, Then hàng Đường ra «Lệch»: số đứng trước «thang <số>» là một phần tên đường, không phải số nhà.
- AC-4: Given ô chỉ có từ vị trí viết không dấu («Ngo», «Hem», «So», «Kiet», «Ngach»), ở một bên và «Minh Khai» ở bên kia, When chạy luật cả hai chiều, Then hàng Đường của luật là «Thiếu» và không có lý do «đường khác», y như dạng có dấu («Ngõ», «Hẻm»).
- AC-5: Given mọi cặp của AC-1 tới AC-4, When so bằng `soDuong` của bảng so thẻ duyệt (rút nguyên văn `boDau`, `khoaDuong`, `soDuong` từ `app/src/lib/ops/review-can-cu.ts`) và bằng `soDuong` của luật, Then hai bên ra cùng nhãn ở mọi ô, cả hai chiều.
- AC-6: Given mọi giá trị `street_raw` khác nhau trên DB máy thu, bỏ ngoài các giá trị mà phần còn lại — sau khi bỏ cụm vị trí (ngõ/ngách/hẻm/kiệt/số + số) và số nhà ở đầu, rồi bỏ dấu — mở đầu bằng «duong » hay «pho » (tiền tố không dấu cố ý giữ hai cách đọc, theo HD2), cùng tập nhỏ viết trước («Ngõ», «Ngỏ», «30 Tháng 4», «123 Đường Láng», «Số 5 Dương Khuê»), When so tập khoá của giá trị gốc với tập khoá của chính nó sau khi bỏ dấu, Then hai tập khoá bằng nhau ở mọi giá trị; số giá trị đem so (≥ 100), số giá trị bị loại và số lệch được in ra.
- AC-7: Given bộ test đã ký đọc khoá đường (`agent/tests/judge-entity-duong.test.ts`, `agent/tests/judge-luat.test.ts`, `app/tests/the-duyet-phuong-lech-gia.test.tsx`, `app/tests/the-duyet-du-can-cu.test.tsx`), When chạy sau thay đổi, Then mọi ca vẫn xanh và không tệp test nào của các hồ sơ ấy bị sửa so với merge-base của nhánh (diffBase của lượt chấm).

## Coverage

Quét tay theo ba trục.

| Trục | Giá trị | AC |
|---|---|---|
| Nhánh có-dấu-only trong `khoaDuong` | ngoại lệ «tháng <số>» · từ vị trí trần | AC-1, AC-2, AC-3, AC-4 |
| Quan hệ hai bên | khác đường · cùng đường khác dấu · thiếu tên | AC-1, AC-2, AC-3, AC-4 |
| Nơi đọc | luật · bảng so thẻ · dữ liệu thật · ca cũ đã ký | AC-1 – AC-4, AC-5, AC-6, AC-7 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Mọi cặp có dấu ↔ không dấu của cùng một ô đường cho cùng nhãn, trừ ô có tiền tố không dấu duong/pho (HD2 cố ý giữ hai cách đọc) | AC-6 trên DB máy thu (SELECT DISTINCT `street_raw`, in số giá trị bị loại), AC-2 trên ma trận viết trước |

## Notes

- Hồ sơ đã ký có eval khai `paths` gồm `app/src/lib/ops/review-can-cu.ts` hay `agent/src/agents/judge-entity.ts` có thể bị lưới trước-gộp báo hoá cũ; nếu bị báo thì ghim lại bằng làn máy.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-01:
  - Ngoài-1: Thêm hay bớt dòng trống chỉ ở đầu hoặc cuối một tệp test đã ký thì phép so KD-AC-7 không phát hiện.
  - Ngoài-2: Lời hứa «tệp test đã ký không đổi» mới được đo một phần; nếu về sau có người lặng lẽ nới ca kiểm cũ, lượt chấm có thể vẫn báo đạt.

## Out of scope

- Ngoài-1 của `chuan-hoa-o-duong` («Đường 2» ↔ «Đường 3» ra Thiếu): lớp khác, đã ghi Known limits.
- Nhận diện tên dự án hay mã nội khu trong ô đường.
- Chạy lại judge-run trên hàng duyệt thật.
