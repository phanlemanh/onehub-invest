---
schema_version: 1
feature: Lấy mẫu nhãn khử trùng theo tin của pipeline và chữ đã gạt URL, gạt bài thử và sự kiện, label-ghep dựng lại dấu trùng mà không xoá dấu ẩn tay
slug: lay-mau-khu-trung-theo-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-07
design_doc: docs/superpowers/specs/2026-11-07-lay-mau-khu-trung-theo-tin-design.md
---

# Acceptance Contract: lay-mau-khu-trung-theo-tin

## Context

Lát `s03-theo-nhom` có ba lỗi lấy mẫu:
- 33 thẻ trùng. Băm chữ còn link ảnh nên hai bài cùng chữ khác link vẫn bị coi là khác; tin đăng lại cũng không bị gom.
- Bài thử #10297 lọt vào mẫu.
- Sự kiện thu hồi #10172 lọt vào mẫu.

Mạnh cho ẩn tay 33 thẻ và hỏi «làm cơ chế cho pipeline chưa?». Hiện `label-ghep --lam-lai` xoá dấu ẩn tay.

Luật khử trùng theo câu giao: bài đã thành tin khử theo tin của pipeline, bài chưa thành tin so chữ đã gạt URL. Giữ mọi dấu ẩn tay
thì luật này cho 48 thẻ ẩn trên lát (44 cũ + 4 nhóm mới, Hỏi-1).

Source input: hàng GN2 của `docs/plan/lo-trinh.json` (#335), giám sát đợt dot0-cam-mau giao ngày 06/11.

## Criteria

- AC-1: Given các cặp bài viết trước, When tính khoá trùng bằng `khoaTrung`, Then mỗi bài có đúng một khoá: bài đã thành tin dùng `o:<offer_id>`, bài chưa thành tin dùng `c:<chữ đã gạt URL>`, chữ rỗng thì không có khoá. Ma trận ca:
  - cùng chữ khác link ảnh, chưa thành tin → cùng khoá;
  - cùng tin khác chữ → cùng khoá;
  - cùng chữ nhưng hai tin khác nhau → hai khoá;
  - một bài đã thành tin, một bài chưa, cùng chữ → hai khoá;
  - khác tin khác chữ → hai khoá;
  - chữ chỉ có URL → không khoá.
- AC-2: Given bài S03 và sổ tin trên DB thử, When chạy `label-sample` thật (cả lát thường lẫn lát theo nhóm), Then:
  - không hai thẻ của lát chung một nhóm trùng;
  - đầu ra in số bài bỏ vì trùng;
  - cùng đầu vào và seed thì cùng kết quả.
- AC-3: Given bài có chữ là sự kiện JSON (thu hồi `clientDelMsgId`, nhãn dán, thẻ link), When lấy mẫu, Then:
  - các bài đó không vào lát và được đếm ở `bo_su_kien`;
  - bài có chữ mở đầu bằng «[» mà không phải JSON vẫn được lấy.
- AC-4: Given bài thử của Mạnh, When lấy mẫu (và transform S03, theo lối Mạnh chọn ở Hỏi-2) đọc qua `lib/test-posts.mjs`, Then:
  - bài có link `trycloudflare.com` hoặc chữ «[Tên sàn]» bị gạt với dấu `noi-dung`;
  - nhóm tên toàn chữ số chỉ bị gạt khi Mạnh chọn như vậy ở Hỏi-2;
  - bài thật không bị gạt (link ảnh, chữ «tên sàn» không ngoặc, nhóm có chữ số lẫn chữ);
  - `ops_audit` ghi dấu đúng tên `noi-dung`;
  - trên bản chép, số tin canonical sẽ nghỉ vì dấu mới được in ra.
- AC-5: Given một lát có dấu ẩn tay, When `label-ghep` chạy (thường và `--lam-lai`), Then:
  - mọi nhóm trùng còn đúng một thẻ hiện;
  - thẻ giữ chọn theo ba bậc: nhiều dòng nhãn nhất; hoà thì thẻ đang được dấu ẩn tay trỏ tới; hoà nữa thì `item_id` nhỏ nhất;
  - thẻ ẩn mới mang `trung_voi` và `khu_trung`;
  - mọi dòng có `an_tay` giữ nguyên `trung_voi` và `an_tay`;
  - không thẻ có nhãn nào mất nhãn;
  - đầu ra in số ẩn mới và số dấu tay giữ.
- AC-6: Given DB thử chép lát `s03-theo-nhom` từ DB máy thu (chỉ đọc nguồn), When chạy `label-ghep --lam-lai`, Then:
  - 44 thẻ đang ẩn vẫn ẩn, với cùng thẻ giữ;
  - số thẻ ẩn sau lượt đúng bằng số Mạnh chọn ở Hỏi-1, mỗi thẻ ẩn thêm in kèm khoá nối;
  - chạy lần hai không đổi dòng nào.
- AC-7: Given lát có thẻ ẩn theo luật mới, When mở màn gắn nhãn, tiến độ, lượt hai và chạy `eval-classify`, Then thẻ ẩn không hiện, không được đếm, không được chấm, như thẻ ẩn hiện nay. Các test cũ của màn gắn nhãn và `eval-classify` vẫn xanh.
- AC-8: Given mã và hồ sơ, When quét diff so với điểm rẽ nhánh, Then:
  - chỉ các tệp sau được đổi: `pipeline/lib/eval-labels.mjs`, `pipeline/label-sample.mjs`, `pipeline/label-ghep.mjs`, `pipeline/lib/ghep-mau.mjs`, `pipeline/lib/test-posts.mjs`, `pipeline/lib/*.test.mjs`, `pipeline/scripts/*.test.mjs`, `pipeline/CLAUDE.md`, `_acceptance/config.yaml`, `_acceptance/lay-mau-khu-trung-theo-tin/**`, `docs/**`, `PRODUCT-MAP.md`, `LO-TRINH.html`;
  - không `collector/`, không `app/`, không `db/migrations/`;
  - `paths` của mọi eval đo vật vòng này đổi nằm trong danh sách; E8, E9 là test cũ chỉ chạy lại.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: các trục liệt kê đủ từ luật.

- Khoá: tin · chữ đã gạt URL · cùng chữ khác tin · rỗng (AC-1).
- Nơi dùng khoá: lát thường · lát theo nhóm · label-ghep thường · label-ghep `--lam-lai` (AC-2, AC-5, AC-6).
- Bài bị gạt: sự kiện JSON · ba dấu bài thử · bài thật trông giống («[» không JSON, nhóm có số) (AC-3, AC-4).
- Thẻ: có nhãn · không nhãn · ẩn tay · ẩn cụm (AC-5, AC-6, AC-7).

## Out of scope

- Chạy `label-ghep --lam-lai --db-that` lên DB máy thu (Hỏi-3) và lấy lại mẫu lát.
- Gỡ ẩn thẻ hay đổi thẻ giữ của dấu ẩn tay.
- Dấu bài thử khác ngoài ba dấu đã đo.

## Notes

- Test trên DB thử `oneinvest_gn2` (db/db-thu.sh). Bản chép lát lấy từ DB máy thu bằng đọc chỉ đọc. Không ghi DB máy thu.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-07:
  - Ngoài-1: một dòng ghi chú trong cấu hình nghiệm thu còn ghi tên DB thử cũ, người chấm có thể hiểu nhầm hai bài kiểm dùng chung một DB.
  - Ngoài-2: lệnh gom trùng chạy nhầm nơi không có sổ tin thì âm thầm chỉ gom theo chữ, không báo gì.
  - Ngoài-3: lệnh dựng lại dấu trùng chạy mà không thấy sổ tin vẫn báo thành công, một số thẻ từng bị ẩn có thể hiện lại.
  - Ngoài-6: khi chấm, ca kiểm của gn2_ghep có thể chạy trên DB chung của máy thay vì bản thử, dù mọi thay đổi được hoàn lại.
  - Ngoài-9: phép thử đối chứng chưa chứng minh chắc công cụ kiểm báo đỏ khi mẫu nhãn bị trùng hoặc lẫn bài thử.
  - Ngoài-10: chưa có phép thử chạy thật cho thấy bài thử có link thử nghiệm không thành tin; việc bài thử bị loại ở bước xử lý mới chỉ được suy ra.
