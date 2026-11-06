---
schema_version: 1
feature: Lấy mẫu nhãn khử trùng theo tin của pipeline và chữ đã gạt URL, gạt bài thử và sự kiện, label-ghep dựng lại dấu trùng mà không xoá dấu ẩn tay
slug: lay-mau-khu-trung-theo-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-07-lay-mau-khu-trung-theo-tin-design.md
---

# Acceptance Contract: lay-mau-khu-trung-theo-tin

## Context

Lát `s03-theo-nhom` có ba lỗi lấy mẫu:
- 33 thẻ trùng. Băm chữ còn link ảnh nên hai bài cùng chữ khác link vẫn bị coi là khác; tin đăng lại cũng không bị gom.
- Bài thử #10297 lọt vào mẫu.
- Sự kiện thu hồi #10172 lọt vào mẫu.

Mạnh cho ẩn tay 33 thẻ và hỏi «làm cơ chế cho pipeline chưa?». Hiện `label-ghep --lam-lai` xoá dấu ẩn tay.

Đo lại 33 thẻ ẩn tay:
- Luật «cùng tin của pipeline HOẶC cùng chữ đã gạt URL» giải thích đủ 33 thẻ.
- Luật «tin trước, chữ sau» chỉ bắt được 27 thẻ.

Source input: hàng GN2 của `docs/plan/lo-trinh.json` (#335), giám sát đợt dot0-cam-mau giao ngày 06/11.

## Criteria

- AC-1: Given các cặp bài viết trước, When gom bằng `nhomTrung`, Then hai bài cùng nhóm khi và chỉ khi nối được bằng một trong hai khoá, kể cả bắc cầu qua bài thứ ba. Ma trận ca:
  - cùng chữ khác link ảnh → cùng nhóm;
  - cùng tin khác chữ → cùng nhóm;
  - cùng chữ nhưng hai tin khác nhau → cùng nhóm;
  - A cùng tin với B, B cùng chữ với C → một nhóm;
  - khác tin khác chữ → hai nhóm;
  - chữ rỗng sau khi gạt URL không nối ai.
- AC-2: Given bài S03 và sổ tin trên DB thử, When chạy `label-sample` thật (cả lát thường lẫn lát theo nhóm), Then:
  - không hai thẻ của lát chung một nhóm trùng;
  - đầu ra in số bài bỏ vì trùng;
  - cùng đầu vào và seed thì cùng kết quả.
- AC-3: Given bài có chữ là sự kiện JSON (thu hồi `clientDelMsgId`, nhãn dán, thẻ link), When lấy mẫu, Then:
  - các bài đó không vào lát và được đếm ở `bo_su_kien`;
  - bài có chữ mở đầu bằng «[» mà không phải JSON vẫn được lấy.
- AC-4: Given bài thử của Mạnh, When transform S03 và lấy mẫu cùng đọc qua `lib/test-posts.mjs`, Then:
  - các ca sau bị gạt:
    - link `trycloudflare.com` → dấu `noi-dung`;
    - chữ «[Tên sàn]» → dấu `noi-dung`;
    - nhóm tên toàn chữ số → dấu `group`;
  - nhóm tên có chữ số lẫn chữ cái («Ocean Park 2») không bị gạt;
  - bài thật không bị gạt;
  - dấu ghi vào `ops_audit` đúng tên.
- AC-5: Given một lát có dấu ẩn tay, When `label-ghep` chạy (thường và `--lam-lai`), Then:
  - mọi nhóm trùng còn đúng một thẻ hiện;
  - thẻ giữ là thẻ có nhiều dòng nhãn nhất, hoà thì `item_id` nhỏ nhất;
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

- Khoá nối: tin · chữ đã gạt URL · bắc cầu · rỗng (AC-1).
- Nơi dùng khoá: lát thường · lát theo nhóm · label-ghep thường · label-ghep `--lam-lai` (AC-2, AC-5, AC-6).
- Bài bị gạt: sự kiện JSON · ba dấu bài thử · bài thật trông giống («[» không JSON, nhóm có số) (AC-3, AC-4).
- Thẻ: có nhãn · không nhãn · ẩn tay · ẩn cụm (AC-5, AC-6, AC-7).

## Out of scope

- Chạy `label-ghep --lam-lai --db-that` lên DB máy thu (Hỏi-2) và lấy lại mẫu lát.
- Gỡ ẩn thẻ hay đổi thẻ giữ của dấu ẩn tay.
- Dấu bài thử khác ngoài ba dấu đã đo.

## Notes

- Test trên DB thử `oneinvest_gn2` (db/db-thu.sh). Bản chép lát lấy từ DB máy thu bằng đọc chỉ đọc. Không ghi DB máy thu.
