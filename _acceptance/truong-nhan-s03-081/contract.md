---
schema_version: 1
feature: Màn gắn nhãn theo nhóm thêm bảy trường (nội thất, hướng, view, ngày vào ở, phí đã gồm, cơ sở giá, mã căn) và căn cứ «Danh mục CĐT», migration 081
slug: truong-nhan-s03-081
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, api, db]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-07
design_doc: docs/superpowers/specs/2026-11-06-truong-nhan-s03-081-design.md
---

# Acceptance Contract: truong-nhan-s03-081

## Context

Mạnh gắn nhãn lát `s03-theo-nhom` và gặp thông tin bài có mà màn không có ô. Em đếm lại trên 322 thẻ đang hiện bằng mẫu chữ, nên đây là sàn dưới:

| Thông tin | Tỉ lệ bài có |
|---|---|
| Nội thất | 29% |
| Hướng | 29% |
| View | 28% |
| Mã căn | 28% |
| Ngày vào ở | 20% |
| Cơ sở giá | 20% |
| Phí | khoảng 3% (trợ lý ước 24%) |

Mạnh quyết thêm căn cứ thứ năm «Danh mục CĐT» («Thêm vào 081»). Vòng này làm đúng câu giao của hàng GN1:
- Thêm bảy trường. Sáu trường tra được trong RESO DD 2.1: `Furnished`, `DirectionFaces`, `View`, `AvailabilityDate`, `RentIncludes`, `UnitNumber`. `PriceBasis` là extension.
- Thêm căn cứ `danh_muc_cdt`, chỉ nhận giá trị có trong S08.
- Migration 081 nới hai CHECK của `eval_labels` và dựng lại view đồng thuận.
- `eval-classify` đọc được các ô mới và loại ô căn cứ danh mục khỏi phép chấm máy đọc tin.

Nguồn yêu cầu:
- Hàng GN1 của `docs/plan/lo-trinh.json` (#335).
- Giám sát đợt dot0-cam-mau giao theo lời Mạnh qua phiên trợ lý, 06/11.
- Ghi chú `P4-pham-vi-081-truong-nhan.md`.

## Criteria

- AC-1: Given DB thử dựng từ `db/migrations` tới 079 và có nhãn 17 trường cũ, When áp `081_labels_truong_moi.sql` hai lần, Then:
  - không lỗi;
  - `eval_labels` nhận mọi tên trường và mọi căn cứ trong hằng của app (`LABEL_FIELDS_NHOM`, `BASIS`), gồm bảy trường mới và `danh_muc_cdt`;
  - vẫn từ chối tên trường và căn cứ ngoài danh sách;
  - view đồng thuận có dòng cho bảy trường mới, số cặp và số khớp của 17 trường cũ không đổi;
  - dòng nhãn có sẵn không bị sửa hay xoá.
- AC-2: Given biểu mẫu theo nhóm của một thẻ, When mở thẻ, Then:
  - có khối «Mô tả căn» với bốn hàng Nội thất, Hướng, View, Ngày vào ở;
  - hàng «Mã căn» nằm trong khối Vị trí, trước «Toà»;
  - hàng «Cơ sở giá» và «Phí đã gồm» nằm trong khối Giá, dưới hai đầu giá;
  - mỗi hàng có căn cứ và «Không suy ra được»;
  - mọi nhóm nút căn cứ có thêm «CĐT», nhãn đầy đủ «Danh mục CĐT»;
  - lựa chọn của năm trục chọn lấy từ sổ từ vựng; View và Phí đã gồm chọn được nhiều giá trị.
- AC-3: Given một lượt ghi có bảy ô mới, When chuẩn hoá trước khi lưu, Then mỗi ô đúng bảng viết trước:
  - giá trị ngoài sổ từ vựng bị từ chối dưới đúng ô;
  - View và Phí đã gồm lưu tập mã đã sắp xếp, bỏ trùng, nối bằng dấu phẩy;
  - ngày vào ở nhận `ngay`, «ngay», `YYYY-MM` và `YYYY-MM-DD` có thật; từ chối khuôn khác;
  - mã căn giữ nguyên chữ hoa thường và dấu che «xx», chỉ gộp khoảng trắng và đổi NFC; căn cứ «Chữ bài» thì mã phải có trong chữ bài;
  - thiếu ô mới thì báo «Chưa điền» như mọi ô.
- AC-4: (cross-layer) Given danh mục S08 ở máy thu, When lưu qua route thật một ô căn cứ «Danh mục CĐT», Then:
  - ô chỉ được nhận khi mã căn của thẻ có trong danh mục (`product_code`, so không phân biệt hoa thường) và giá trị của ô bằng giá trị của một dòng danh mục cùng mã, ở trường tương ứng: mã căn, phân khu, hướng, diện tích, phòng ngủ, WC;
  - trường danh mục không có, mã căn không có trong danh mục hay bị che, giá trị lệch, hay bảng danh mục không đọc được: lỗi dưới đúng ô, không ghi dòng nào;
  - nhận thì `eval_labels` có dòng `basis = 'danh_muc_cdt'` cho ô đó, các ô khác giữ căn cứ của mình.
- AC-5: Given thẻ đã gắn trước vòng (chỉ 17 trường), When mở tiến độ, lượt hai và bảng đồng thuận, Then:
  - thẻ vẫn tính là đã gắn;
  - lượt hai mở được và hiện «—» ở bảy ô mới;
  - đồng thuận của 17 trường cũ không đổi;
  - không lệnh nào của vòng ghi lại hay đòi gắn bù dòng cũ.
- AC-6: (cross-layer) Given nhãn trong DB có bảy trường mới, gồm ô căn cứ `danh_muc_cdt`, When `eval-classify` đọc nhãn bằng truy vấn thật rồi chấm, Then:
  - mỗi trường mới có một ô kết quả theo nhóm F3: mã căn nhóm A (0,95); cơ sở giá nhóm B (0,90); nội thất, hướng, view, ngày vào ở, phí đã gồm nhóm C (0,80);
  - trường chưa có cách đọc thì ô ghi `skip`, lý do `chua-co-cach-doc`;
  - ô nhãn căn cứ `danh_muc_cdt` không vào phép chấm; số ô bị loại in ở khoá `danh_muc_cdt`;
  - chín trường cũ chấm như trước.
- AC-7: Given ma trận đường rời máy viết trước (mỗi đường kèm bảng nó chở, rút từ `docs/ops/runtime-map.md` và mã), When rút bảng đích thật của từng đường, Then:
  - không đường nào chở `eval_labels`, view đồng thuận hay giá trị `danh_muc_cdt`;
  - đối chứng: bản chép đường sync có thêm `eval_labels` thì bị bắt.
- AC-8: Given sổ từ vựng, When chạy bộ sinh và hai lệnh kiểm, Then:
  - `furnished`, `view`, `rent_includes` khai `dd_field` và `dd_lookup` đúng lookup RESO DD 2.1;
  - `price_basis` khai extension đủ sáu điều kiện ADR-0011, alias `ListingAgreement.Net`;
  - `direction_faces` khai theo nghĩa Mạnh chọn ở Hỏi-2 (Cổng Phạm vi): hướng cửa thì `dd_field DirectionFaces`; hướng ban công thì extension đủ sáu điều kiện, alias gần nhất `DirectionFaces`;
  - `vocab.mjs --check` và `--lint` xanh;
  - CONTEXT.md có thuật ngữ cho bảy trường và «Danh mục CĐT».
- AC-9: Given thẻ đã gắn đủ trường mới, When mở lượt hai và bảng đồng thuận của lát, Then:
  - bảy trường mới hiện với nhãn tiếng Việt từ `FIELD_LABEL`;
  - căn cứ «Danh mục CĐT» hiện đúng nhãn;
  - giá trị chọn hiện nhãn tiếng Việt của sổ, không hiện mã.
- AC-10: Given mã và hồ sơ, When quét diff so với điểm rẽ nhánh, Then:
  - chỉ các tệp sau được đổi:
    - `db/migrations/081_*`;
    - `app/src/lib/labels-normalize.ts`, `app/src/lib/labels-queries.ts`, `app/src/lib/labels-luot-hai.ts`, `app/src/lib/labels-s08.ts`, `app/src/lib/vocab.generated.ts`;
    - `app/src/components/ops/labels/**`, `app/src/app/api/v1/ops/labels/**`, `app/tests/**`;
    - `pipeline/mappings.yaml`, `pipeline/vocab*.mjs` và tệp sinh của nó, `pipeline/lib/eval-classify.mjs`, `pipeline/eval-classify.mjs`, `pipeline/lib/eval-classify.test.mjs`, `pipeline/scripts/*.test.mjs`;
    - tệp sinh từ vựng trong `agent/`;
    - `CONTEXT.md`, `docs/**`, `_acceptance/config.yaml`, `_acceptance/truong-nhan-s03-081/**`, `PRODUCT-MAP.md`, `LO-TRINH.html`;
  - không đụng `collector/`, hook hay `pipeline/sync-cloud.mjs`;
  - `paths` của mọi eval nằm trong danh sách trên.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: các trục dưới đây liệt kê đủ từ mã.

- Trường mới (AC-2, AC-3, AC-8):
  - nội thất;
  - hướng;
  - view (nhiều giá trị);
  - ngày vào ở;
  - phí đã gồm (nhiều giá trị);
  - cơ sở giá;
  - mã căn.
- Căn cứ: Chữ · Ảnh · Nhóm · Nghề · CĐT (AC-2, AC-4, AC-6). Riêng CĐT, AC-4 phủ năm trục:
  - trường danh mục có · không có;
  - mã căn có trong danh mục · không có · bị che;
  - giá trị khớp · lệch;
  - bảng đọc được · không đọc được.
- Nơi đọc nhãn: biểu mẫu · route ghi · tiến độ · lượt hai · đồng thuận · eval-classify · đường rời máy (AC-1, AC-4..AC-7, AC-9).
- Dòng nhãn: gắn sau vòng · gắn trước vòng (AC-1, AC-5).

## Out of scope

- Các ô sau chờ Hỏi-1, mặc định ghi vào Lý do:
  - phí quản lý theo số tiền (`AssociationFee`);
  - pháp lý;
  - vay;
  - cọc;
  - ban công, căn góc;
  - giá theo phương thức thanh toán.
- Áp 081 lên DB máy thu (Hỏi-3) và gắn bù thẻ đã gắn. Phiên trợ lý gắn bù 7 thẻ.
- Bộ đọc máy ra bảy trường mới; phép đo enrich qua mã căn (GC2, GC3).
- Khử trùng lúc lấy mẫu: hàng GN2 `lay-mau-khu-trung-theo-tin`, hồ sơ riêng.
- Biểu mẫu chín trường `label-form.tsx`.

## Notes

- Test chạy trên lược đồ tạm dựng bằng chính `db/migrations`, hoặc trên DB thử `oneinvest_tn081`. Danh mục S08 trong test là dòng giả, không có mã căn thật. Không ghi DB máy thu.
- Số đếm ý: `probes/dem-y.sql`, chỉ đọc, chỉ in số.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-07:
  - Ngoài-1: phép kiểm «chín trường cũ vẫn chấm như trước» lấy mốc so bằng merge-base, nên chạy lại sau khi gộp vào nhánh chính sẽ báo đỏ giả.
  - Ngoài-4: công cụ kiểm phạm vi có thể báo ổn khi không đọc được lịch sử thay đổi, nên có thể bỏ sót tệp đổi ngoài phạm vi.
  - Ngoài-5: một số tình huống nhập của bảy trường mới chưa có bài kiểm riêng, lỗi ở đó sau này kiểm tự động không bắt được.
  - Ngoài-7: nút lựa chọn trên màn gắn nhãn chỉ được kiểm bằng số lượng, sai tên mà đủ số thì không bị bắt.
  - Ngoài-8: ô «Phí đã gồm» chưa được kiểm chọn nhiều giá trị, đổi thành chọn một thì không bị bắt.
  - Ngoài-9: phép kiểm từ chối trường lạ và căn cứ lạ chưa ghim đúng loại lỗi CHECK, có thể báo đạt vì một lỗi khác.
