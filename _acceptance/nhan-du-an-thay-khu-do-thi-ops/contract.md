---
schema_version: 1
feature: Chữ «Dự án» thay «Khu đô thị» trên màn Ops (Sổ đơn vị thu, Đo hằng ngày, nhãn trường), và bỏ «danh mục dự án» khỏi danh sách tránh của CONTEXT
slug: nhan-du-an-thay-khu-do-thi-ops
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
design_doc: docs/superpowers/specs/2026-11-17-nhan-du-an-thay-khu-do-thi-ops-design.md
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-11-17T08:20:00Z
---

# Acceptance Contract: nhan-du-an-thay-khu-do-thi-ops

## Context

Mục 39 Hỏi-1 (08/11): chữ hiển thị «Dự án» thay «Khu đô thị», CHỈ chữ. `CONTEXT.md` đã đổi, app chưa. DA4 (#425) để lại
ba vết Mạnh định tuyến «mở hợp đồng mới»: chữ cũ trên màn Ops (Ngoài-2), «danh mục dự án» còn trong `_Avoid_` dù đã là
thuật ngữ chuẩn (Ngoài-5), probe DN1 đòi chữ «chỉ local» mà mappings đã bỏ theo mục 38 (Ngoài-6) — vết này đã cắt sang hàng riêng, xem Out of scope.

## Acceptance Criteria

- AC-1: Given cây sau vòng, When quét mọi tệp `.ts`/`.tsx` trong `app/src`, Then không dòng nào chứa «khu đô thị» (không
  phân biệt hoa thường) trừ dòng nói về quy mô (chứa «quy mô»); và khi một bản chép của `app/src` có thêm một dòng
  `"Khu đô thị"`, Then lưới đỏ với thông điệp gọi đúng tệp và dòng; và chạy trên bản `main` 5508f620 của tám tệp, lưới
  đếm đúng 18 dòng (đối chứng dương — lưới không xanh rỗng).
- AC-2: Given màn Sổ đơn vị thu, màn Đo hằng ngày và màn gắn nhãn render trong jsdom, When đọc chữ trên DOM, Then cột,
  tiêu đề hộp, nhãn ô, gợi ý, thông báo, nhãn nút và lát đều ghi «Dự án» / «dự án», không còn «Khu đô thị»; và một ma
  trận viết trước (tệp × chuỗi mới) đòi từng chuỗi hiển thị mới có mặt đúng ở tệp của nó, cùng các khoá `id: "projects"`,
  `value: "du_an"`, `value: "ma-trung-du-an"` và khoá `project` của `FIELD_LABEL` vẫn nguyên.
- AC-3: Given `CONTEXT.md` sau vòng, When đọc mọi dòng `_Avoid_:`, Then không dòng nào chứa «danh mục dự án»; và khi bản
  chép chèn lại cụm ấy vào một `_Avoid_`, Then lưới đỏ với thông điệp «NDT-AC-3 danh mục dự án nằm trong _Avoid_».

## Coverage

Quét bằng ma trận nhỏ (preset test-matrix), thước CE: bảng phủ đếm bằng `grep -rni "khu đô thị"` trên `main` 5508f620 và
ba mục Ngoài-2/5/6 của `tu-vung-du-an-muc-39/review-findings.md`.

| Chỗ | Dòng · tệp | Ai đọc phía sau | Xử lý |
|---|---|---|---|
| `app/src` (`.ts`/`.tsx`) | 18 · 8 | người vận hành trên màn Ops (chữ hiển thị) + người đọc mã (chú thích) | trong phạm vi — AC-1, AC-2 |
| `db/migrations` | 6 · 3 | người đọc mã; riêng câu `RAISE EXCEPTION … không phải khu đô thị` của 048 có thể hiện ở thông báo lỗi khi admin chọn sai loại nút | ngoài phạm vi, vì migration đã commit không sửa được — đổi câu lỗi cần một migration mới (hạng T3) |
| `pipeline` (mã chạy, không test) | 3 · 3 | người đọc mã (chỉ chú thích) | ngoài phạm vi, vì không lên màn |
| `pipeline` test/fixture, `agent/` | — | phép đo và lời nhắc model, «khu đô thị» theo nghĩa chữ nguồn | ngoài phạm vi, vì không phải chữ hiển thị |
| `data-api/src`, `pipeline/sql` | 0 | — | không có |

- Trục A — chỗ đổi: chữ trên màn | chú thích mã | danh sách tránh
- Trục B — lớp đo: quét chữ trong mã | render DOM | đọc CONTEXT
- Trục C — kết cục: xanh | đỏ gọi tên tệp/dòng

Core: màn × render (AC-2); mã × quét (AC-1, phủ cả chú thích); tránh × đọc CONTEXT (AC-3). Never:
agent/ và pipeline/ × quét (không phải chữ hiển thị — lời nhắc model và fixture dùng «khu đô thị» theo nghĩa nguồn).

## Out of scope

- Câu lỗi `RAISE EXCEPTION … không phải khu đô thị` của `db/migrations/048_so_nhom_mot_noi.sql` — migration đã commit;
  đổi cần migration mới (T3).
- Hai lỗi còn lại của `glossary_terms` («nhãn bạc», «tự thu» trong `_Avoid_`) — của hồ sơ khác; bộ ấy vẫn thoát 1 sau vòng.
- «khu đô thị» trong `agent/` và `pipeline/` — không phải chữ trên màn.
- Mã `project`, bảng, cột, URL — giữ nguyên theo mục 39 Hỏi-1; đọc ở diff của PR, không có eval riêng.
- **Đã cắt AC-4 (probe DN1, Ngoài-6 của DA4) khỏi hàng, chuyển sang hàng riêng** «sửa probe DN1 + ghim lại noi-du-an-s08-khu-do-thi»
  (giám sát phán 17/11, N1-98): sửa `probes/nap.mjs` kéo hồ sơ đã ký ấy vào lưới trước-merge, mà nó không ghim lại được vì
  probe còn 5 FAIL có sẵn trên `main` (DB thử 074/q7, `git grep` bắt `app/src/lib/ops/registry/doc.ts`).
- Gate thiết kế cho `so-don-vi.tsx`, `so-don-vi-dialog.tsx`, `lam-giau-bang.tsx` — vòng chỉ đổi chuỗi, không đổi lớp,
  màu hay khoảng; gate có sẵn `tb_gate` phủ `do-hang-ngay.tsx`.

## Notes

Mọi lần sửa `CONTEXT.md` giữ hẹp đúng một dòng `_Avoid_` — nhánh TG1 của dãy U1 cũng sửa tệp này.
