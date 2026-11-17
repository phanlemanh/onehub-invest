# nhan-du-an-thay-khu-do-thi-ops — chữ «Dự án» thay «Khu đô thị» ở Ops, và hai vết còn lại của DA4

Ngày: 2026-11-17 · Dãy N1 · Hạng T2 · Nguồn: Ngoài-2, Ngoài-5, Ngoài-6 của `tu-vung-du-an-muc-39` (DA4, #425), Mạnh
định tuyến «mở hợp đồng mới» ở Cổng Bằng chứng 11/11; quyết định gốc ROADMAP §3 mục 39 Hỏi-1 (08/11): chữ hiển thị
«Dự án» thay «Khu đô thị», CHỈ chữ — mã `project`, bảng, cột, URL giữ nguyên.

## 1. Ba vết

1. **Chữ trên màn Ops (Ngoài-2).** `CONTEXT.md` đã đổi thuật ngữ sang «Dự án», nhưng app còn chữ cũ ở: cột và hộp «Khai
   thị trường, khu đô thị» của Sổ đơn vị thu (`components/ops/sources/so-don-vi*.tsx`, `lib/so-don-vi.ts`), lát «Khu
   đô thị» của màn Đo hằng ngày (`components/ops/quality/do-hang-ngay.tsx`, `lam-giau-bang.tsx`, `lib/do-hang-ngay.ts`),
   nhãn trường `project` và nhãn «Mã trùng giữa khu đô thị» (`lib/labels-normalize.ts`, `lib/dq-labels.ts`).
2. **Thuật ngữ chuẩn nằm trong danh sách tránh (Ngoài-5).** `_Avoid_` của «Danh mục CĐT» còn «danh mục dự án», trong
   khi «Danh mục dự án» nay là thuật ngữ chuẩn. Bộ `glossary_terms` đỏ đúng dòng này (cùng hai dòng khác không thuộc hàng).
3. **Probe đỏ sau khi mappings đổi chính sách (Ngoài-6).** Probe `noi-du-an-s08-khu-do-thi/probes/nap.mjs` đòi khối S08
   của `pipeline/mappings.yaml` có chữ «chỉ local»; DA4 bỏ chữ ấy theo mục 38 (thông tin dự án công khai, tên nguồn thật
   là tầng A) nên probe đỏ trên mappings đúng.

## 2. Thiết kế

- Đổi CHỈ chữ hiển thị và chú thích: «Khu đô thị» → «Dự án», «khu đô thị» → «dự án». Không đổi khoá, id cột, giá trị
  (`du_an`, `projects`, `project`, `ma-trung-du-an`), tên hàm, URL. `TRUONG_DO_DUNG` thôi ghi đè `project` vì
  `FIELD_LABEL.project` nay đã là «Dự án».
- `CONTEXT.md`: bỏ đúng «danh mục dự án» khỏi `_Avoid_` của «Danh mục CĐT»; không đụng mục nào khác (nhánh TG1 của U1
  cũng sửa tệp này).
- Probe: thay khẳng định «chỉ local» bằng khẳng định chính sách hiện hành của khối S08 — có «công khai» VÀ có «tầng A» —
  kèm một đối chứng: bản mappings mất chữ «công khai» thì bị bắt.
- Bốn test app đang ghim chữ cũ đổi kỳ vọng cùng nhát.

## 3. Phép đo

- **Lưới chữ hiển thị** (`scripts/nhan-du-an-thay-khu-do-thi.test.mjs`, khoá `ndt_unit`): quét mọi tệp `.ts`/`.tsx`
  trong `app/src`, mỗi dòng chứa «khu đô thị» (không phân biệt hoa thường) mà không chứa «quy mô» là đỏ, thông điệp ghim
  `NDT-AC-1 <tệp>:<dòng> còn chữ Khu đô thị`. Cùng luật «khu đô thị chỉ ở nghĩa quy mô» mà TV39-AC-6 áp cho CONTEXT, ADR
  và mappings. Chiều đỏ cùng fixture: cây chép `app/src` chèn một dòng `"Khu đô thị"` vào một tệp → đỏ đúng tệp, đúng dòng.
- **Danh sách tránh** (cùng tệp test): mọi dòng `_Avoid_:` của `CONTEXT.md` không chứa «danh mục dự án»; chiều đỏ: bản
  chép chèn lại → đỏ ghim `NDT-AC-3 danh mục dự án nằm trong _Avoid_`.
- **Màn render đúng chữ**: bốn test render jsdom của app (khoá `app_ui`) đọc chữ trên DOM.
- **Probe**: `dn1_nap` chạy lại trọn probe trên DB thử của nó.
- **Sàn thiết kế**: `tb_gate` (gate thiết kế có sẵn, phủ `do-hang-ngay.tsx`).

## 4. Ngoài phạm vi

- Hai lỗi còn lại của `glossary_terms` («nhãn bạc», «tự thu» trong `_Avoid_`) — của hồ sơ khác, không thuộc ba mục DA4.
- «khu đô thị» trong `agent/` và `pipeline/` (lời nhắc model, fixture) — không phải chữ hiển thị trên màn.
- Mã, bảng, cột, URL — mục 39 Hỏi-1 giữ nguyên; điều này đọc ở diff của PR, không có eval riêng.
