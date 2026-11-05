---
schema_version: 1
feature: eval-classify chấm bộ đọc trên chữ tin ghép mà người gắn đã đọc, bài ảnh không có tin chữ không chấm
slug: eval-classify-theo-chu-ref
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-05-eval-classify-theo-chu-ref-design.md
approved_by: Mạnh
approved_at: 2026-11-05
---

# Acceptance Contract: eval-classify-theo-chu-ref

## Context

Người gắn đọc chữ của tin chữ ghép, còn `eval-classify` chấm bộ đọc trên chữ của chính dòng mẫu, với bài chỉ có ảnh là URL ảnh. Điểm tụt giả và được ghi lại không cảnh báo. Lát `s03-theo-nhom`, tách `test`: 72/176 dòng có tin chữ ghép, 22 bài ảnh không có tin chữ, 4 dòng trùng cụm; hôm nay 0 nhãn nên phải sửa trước lần chấm đầu. Vòng này chỉ sửa chỗ đọc chữ: nhãn người gắn lấy từ ảnh hay ngữ cảnh nhóm vẫn so với bộ đọc chạy trên chữ, nên điểm ở các trường đó vẫn có thể thấp giả.

Source input: Mạnh chọn mở hợp đồng mới ở Cổng Bằng chứng `ghep-anh-tren-the-gan-nhan`, Ngoài-1 và Ngoài-8, giám sát giao 05/11.

## Criteria

- AC-1: Given dòng có `ghep.chu_ref`, When `docNhanNguoi` đọc, Then chữ chấm là chữ của tin chữ ghép, không phải URL ảnh; bộ đọc chấm đúng các trường có trong tin chữ, và bản chép đọc theo `ref_id` thì số đúng tụt. (cross-layer)
- AC-2: Given bài ảnh không có tin chữ (`ghep` có, `chu_ref` null) đã có nhãn, When đọc, Then bài không vào tập chấm, tính vào `khong_chu`, không tính vào `mat_chu`. (cross-layer)
- AC-3: Given dòng trùng cụm (`ghep.trung_voi` có giá trị) đã có nhãn, When đọc, Then dòng không vào tập chấm, tính vào `trung_co_nhan`, cụm được chấm tối đa một lần theo dòng đại diện; đại diện chưa có nhãn thì cụm không góp dòng nào. (cross-layer)
- AC-4: Given `ghep` NULL, When đọc, Then tập chấm, `bat_dong`, `mat_chu` giống hàm ở commit mốc từng trường; hai số mới bằng 0. (cross-layer)
- AC-5: Given lát thử do lệnh ghép thật sinh, When chạy `pipeline/eval-classify.mjs`, Then `--dry` in `không tin chữ` và `dòng trùng có nhãn` đúng số, không ghi; chạy thật ghi `dq_check_results` đúng khuôn `KHOA_DETAIL` như trước, số `n` chỉ gồm dòng được chấm. (cross-layer)
- AC-6: Given mã và hồ sơ, When quét, Then không có tên nguồn thật, không có chữ bài thật trong dòng thêm; DB `oneinvest` không có dấu vết của phép đo; `collector/`, hook và `db/migrations/` không đổi; phép đọc vẫn trong giao dịch chỉ đọc.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: bài toán một chiều, các loại dòng do `ghep` định nghĩa.

- Loại dòng: có `chu_ref` (AC-1) · không tin chữ (AC-2) · trùng cụm (AC-3) · `ghep` NULL (AC-4).
- Đường đi: hàm thuần `gopNhan`, `docNhanNguoi` trên DB thử, CLI thật (AC-1 đến AC-5).

Later: nhãn có căn cứ Ảnh, Nhóm, Nghề so với bộ đọc chữ · hiện `khong_chu` ở `/ops/quality`. Never: chấm bộ đọc trên URL ảnh.

## Out of scope

- Chặn ghi nhãn vào dòng trùng cụm: việc 2 của dãy P4.
- Đường lấy thêm của `label-sample`: việc 3 của dãy P4.
- Đổi khuôn `detail`, `/ops/quality`, thêm migration.
- Tách điểm theo căn cứ của nhãn: như trước vòng này, nhãn căn cứ Ảnh, Nhóm, Nghề vẫn so với bộ đọc chữ.

## Notes

- DB thử `oneinvest_eval_ghep`, không ghi DB thật.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-1: chấm khi chưa chạy bước ghép thì bài chỉ có ảnh (`ghep` NULL) vẫn bị chấm trên đường dẫn ảnh, cho điểm thấp giả mà không cảnh báo.
  - Ngoài-4: phép đo trên DB thử chỉ thử chiều đỏ của AC-3 với bài ảnh, không thử với dòng trùng cụm; ca thử thuần vẫn phủ ý này.
  - Ngoài-6: phép quét tên nguồn thật bỏ qua một số từ ngắn và tệp chưa theo dõi, nên có thể sót một dạng tên.
  - Ngoài-7: phép quét chữ bài thật chỉ so với một mẫu nhỏ, nên đoạn chữ ngoài mẫu có thể không bị phát hiện.
  - Ngoài-9: `card-plain.json` xếp AC-2, AC-3, AC-5, AC-6 vào nhóm sẽ làm sai chỗ, nên thẻ in câu Given/When/Then thô thay câu dịch.
  - Ngoài-11: giống Ngoài-1 (lượt 1): bài chỉ có ảnh mà `ghep` NULL vẫn bị chấm trên URL và ghi vào `dq_check_results`.
  - Ngoài-12: thẻ Cổng Phạm vi đã duyệt xếp bốn tiêu chí vào mục «sẽ không làm» và hiện chữ kỹ thuật thô.
  - Ngoài-13: một ca thử dùng dòng vừa trùng vừa không chữ mà bước ghép thật không sinh ra, nên chỉ có giá trị phòng thủ.
  - Ngoài-14: giống Ngoài-4 (lượt 1): chiều đỏ của AC-3 trên DB thử không đo dòng trùng cụm.
  - Ngoài-15: giống Ngoài-7 (lượt 1): quét chữ bài thật chỉ phủ khoảng 7% mẫu.
  - Ngoài-16: giống Ngoài-6 (lượt 1): quét tên nguồn chỉ dùng 6/19 token của danh sách nguồn.
