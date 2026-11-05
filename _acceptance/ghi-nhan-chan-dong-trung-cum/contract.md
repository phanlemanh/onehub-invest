---
schema_version: 1
feature: Chặn ghi nhãn vào dòng trùng cụm ở route gắn nhãn, giữ tương thích màn /ops/labels
slug: ghi-nhan-chan-dong-trung-cum
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-05T22:45:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-06-ghi-nhan-chan-dong-trung-cum-design.md
---

# Acceptance Contract: ghi-nhan-chan-dong-trung-cum

## Context

Dòng trùng cụm (`ghep.trung_voi` có giá trị) đã bị bỏ khỏi hàng gắn, nhưng `ghiNhan` vẫn ghi nhãn khi ai đó gửi thẳng `item_id` của nó (tab cũ, yêu cầu tự dựng). Nhãn đó thừa: tiến độ và bảng số không đếm, `eval-classify` loại khỏi chấm. Vòng này chặn ở câu khoá dòng sẵn có, trả 409 qua đường màn đã xử. Lát `s03-theo-nhom`: 11 dòng trùng cụm, 0 có nhãn.

Source input: Mạnh chọn mở hợp đồng mới ở Cổng Bằng chứng `ghep-anh-tren-the-gan-nhan`, Ngoài-6 và Ngoài-13; giám sát giao việc 2 dãy P4, 06/11.

## Criteria

- AC-1: Given dòng trùng cụm người gọi chưa gắn, When POST `/api/v1/ops/labels` với `item_id` của nó, Then 409 với câu `TRUNG_CUM`, `eval_labels` và `eval_label_reasons` không thêm dòng nào. (cross-layer)
- AC-2: Given dòng không trùng cụm (`ghep` NULL, dòng đại diện của cụm, bài ảnh không có tin chữ), When ghi, Then kết quả như trước vòng: 200 và đủ dòng; tin đủ người hay tin của chính mình vẫn 409 với câu cũ. (cross-layer)
- AC-3: Given người gọi đã gắn dòng trước khi nó thành trùng cụm, When gửi lại, Then 409 `DA_GAN_CUA_TOI` (màn coi là đã lưu), không phải `TRUNG_CUM`; nhãn đã có giữ nguyên. (cross-layer)
- AC-4: Given lệnh ghép đang giữ khoá dòng để ghi `trung_voi`, When một lượt ghi tới cùng lúc, Then lượt ghi chờ khoá và trả 409 `TRUNG_CUM` sau khi lệnh ghép commit; không có lượt nào ghi được sau khi `trung_voi` đã commit. (cross-layer)
- AC-5: Given route trả 409 `TRUNG_CUM`, When `guiNhan` của màn đọc phản hồi, Then kết cục là «đã có người» mang đúng câu đó (màn báo rồi chuyển tin kế), không phải «đã lưu» hay lỗi máy chủ.
- AC-6: Given mã và hồ sơ, When quét diff so với nhánh chính, Then chỉ các tệp trong danh sách được phép đổi (route, màn, `db/migrations/`, `collector/`, hook đều không); `CONTEXT.md` có thuật ngữ «Dòng trùng cụm»; không có tên nguồn thật trong dòng thêm; test chỉ chạy trên lược đồ tạm, bảng nhãn ở `public` không có lượt ghi nào.

## Coverage

Hai trục, liệt kê đủ từ `app/src/lib/labels-queries.ts` và `pipeline/lib/ghep-mau.mjs`:

- Loại dòng: `ghep` NULL · đại diện cụm · bài ảnh không tin chữ · trùng cụm.
- Trạng thái gắn của người gọi: chưa ai gắn · người khác đã gắn đủ · chính mình đã gắn · lệnh ghép đang giữ khoá.

Core: trùng cụm × chưa gắn (AC-1), ba loại còn lại × mọi trạng thái (AC-2), trùng cụm × chính mình đã gắn (AC-3), trùng cụm × đang khoá (AC-4), đường màn (AC-5). Trùng cụm × người khác đủ: trả `TRUNG_CUM` theo thứ tự xét, đo trong ma trận AC-1. Later: câu báo riêng trên màn cho ca trùng cụm. Never: xoá nhãn cũ trên dòng trùng cụm.

## Out of scope

- Đường lấy thêm của `label-sample`: việc 3 của dãy P4.
- Xoá hay chuyển nhãn đã có trên dòng trùng cụm (hôm nay 0 dòng).
- Lượt hai `/api/v1/ops/labels/<itemId>/review`, đổi route, đổi màn, thêm migration.

## Notes

- Lược đồ tạm `gtc_<pid>` trên DB local, như `labels.test.tsx`; cột `ghep` sinh bằng `ghepLat` thật của `pipeline/label-ghep.mjs`; không ghi `public`.
