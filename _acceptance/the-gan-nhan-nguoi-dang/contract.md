---
schema_version: 1
feature: Thẻ gắn nhãn hiện người đăng bài (tên và ID) cạnh nhóm và giờ đăng
slug: the-gan-nhan-nguoi-dang
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-05T23:16:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-06-the-gan-nhan-nguoi-dang-design.md
---

# Acceptance Contract: the-gan-nhan-nguoi-dang

## Context

Mạnh đang gắn nhãn và hỏi «Ko lấy được Người đăng bài hả?». Thẻ hiện nhóm và giờ đăng mà không hiện người đăng, ô `seller_name` lại gợi ý «Như người đăng». 367/367 dòng lát `s03-theo-nhom` có `sender_name` ở stg. Mạnh hỏi tiếp «Xem coi có lấy được id ko?»: 367/367 dòng có `sender_id`, 2 tên mang nhiều ID, 1 ID mang nhiều tên, nên ID mới là định danh; Mạnh tìm người trong nhóm S03 bằng tên cùng giờ đăng vì app của kênh S03 không hiện ID. Vòng này hiện tên và ID trên dòng đầu thẻ, che tên nguồn thật bằng mã.

Source input: câu hỏi của Mạnh khi gắn nhãn, giám sát giao trước việc chặn dòng trùng cụm, 06/11.

## Criteria

- AC-1: Given bài không ghép có `sender_name`, When mở thẻ ở màn chín trường và màn theo nhóm, Then dòng đầu thẻ có «Người đăng: <tên> · ID <sender_id>» giữa nhóm và giờ đăng, ID chọn được trọn bằng một chạm; route GET trả `tin.nguoiDang` và `tin.nguoiDangId`. (cross-layer)
- AC-2: Given dòng ghép có tin chữ, When mở thẻ, Then tên, ID và giờ đăng (tới phút) cùng là của tin chữ, không phải của bài ảnh, để Mạnh tìm đúng một bài trong nhóm bằng tên cùng giờ; dòng ghép không có tin chữ thì là của chính bài. (cross-layer)
- AC-3: Given `sender_name` chứa tên nguồn thật, When mở thẻ, Then tên nguồn hiện thành mã S0x; danh sách tên nguồn rỗng hay không đọc được (bảng vắng) thì không hiện tên và route vẫn trả 200; tên rỗng hay NULL thì chỉ còn «Người đăng: ID <sender_id>»; không có cả tên lẫn ID thì không có đoạn «Người đăng». (cross-layer)
- AC-4: Given thẻ có người đăng, When đọc HTML và JSON route, Then không có `conversation_id` (stg không có cột SĐT người đăng; vòng này không thêm SĐT nào ngoài chữ bài đã hiện từ trước); ID người đăng chỉ nằm trong màn `/ops/labels` và route `/api/v1/ops/labels`; phép đo gắn mù của PL7 vẫn xanh.
- AC-6: Given biểu mẫu theo nhóm đang hiện lỗi từ lần lưu trước, When người sửa một ô (gõ, chọn, tick «Không suy ra được»), Then lỗi của đúng ô đó mất; sửa một đầu giá hay đổi đơn vị giá thì mất lỗi của cả hai đầu giá; ô chưa sửa giữ lỗi; luật kiểm của `labels-normalize.ts` không đổi.
- AC-5: Given mã và hồ sơ, When quét diff so với nhánh chính, Then chỉ các tệp trong danh sách được phép đổi: `app/src/lib/labels-queries.ts`, `app/src/lib/labels-cum.ts`, `app/src/components/ops/labels/labels-view.tsx`, `app/src/components/ops/labels/label-form-nhom.tsx`, `app/src/components/ops/labels/nguoi-dang.tsx`, `app/tests/labels-nguoi-dang.test.tsx`, `app/tests/labels-nhom.test.tsx`, `app/tests/ops-nhan/visible-strings.ts` (kê tệp mới vào danh sách quét nhãn Ops), `CONTEXT.md` (thuật ngữ «ID người đăng»), `_acceptance/config.yaml`, `_acceptance/the-gan-nhan-nguoi-dang/**`, `docs/**`, `PRODUCT-MAP.md`, `LO-TRINH.html` (route, `db/migrations/`, `collector/`, hook đều không); test chỉ chạy trên lược đồ tạm.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: hai trục liệt kê đủ từ mã.

- Loại dòng: không ghép · ghép có tin chữ · ghép không tin chữ (AC-1, AC-2).
- Tên và ID: tên thường · tên chứa tên nguồn · tên rỗng · tên NULL · danh sách nguồn rỗng · danh sách nguồn không đọc được · không tên không ID (AC-3).
- Màn: chín trường · theo nhóm (AC-1).
- Lỗi theo ô sau lần lưu: ô thường · hai đầu giá · đơn vị giá · ô chưa sửa (AC-6).

## Out of scope

- Lượt hai `luot-hai.tsx`: dòng đầu bảng so giữ nguyên.
- Điền sẵn ô `seller_name` từ người đăng.
- SĐT người đăng trên thẻ.

## Notes

- Lược đồ tạm `tnd_<pid>` có `source_registry` giả; không ghi `public`.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-2: với tin ghép, giờ đăng ở thẻ lượt một có thể khác giờ ở lượt hai, và thẻ có thể không hiện giờ khi không tìm thấy tin chữ.
  - Ngoài-3: phép kiểm chữ in trên thẻ chưa phân biệt được giờ của tin chữ với giờ của bài ảnh, vì dữ liệu thử để hai giờ cùng một phút.
  - Ngoài-4: đối chứng đỏ của phép kiểm «không lộ mã nhóm» chưa chạy qua chính phép quét, nên chưa chứng được phép kiểm sẽ báo khi mã nhóm lọt ra.
  - Ngoài-5: đầu dò «test chỉ chạy trên lược đồ tạm» đọc thứ tự dòng chữ, nên có thể báo qua nhầm nếu sau này có một import tĩnh nối DB.
