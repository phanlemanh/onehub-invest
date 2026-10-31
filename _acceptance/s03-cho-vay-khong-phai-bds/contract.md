---
schema_version: 1
feature: Bài S03 có «<số> năm/nữ» (cho vay, tuyển dụng) không bị coi là dấu hiệu phòng ngủ «<số>n» nên không thành tin rao; viết tắt phòng ngủ thật («2n1wc», «1n1k») vẫn nhận như cũ
slug: s03-cho-vay-khong-phai-bds
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-31T14:45:00Z
design_doc: docs/superpowers/specs/2026-10-31-s03-cho-vay-khong-phai-bds-design.md
---

# Acceptance Contract: s03-cho-vay-khong-phai-bds

## Context

Lượt chấm 2 của RM1 (s03-nhan-loai-tin-rong) thấy bài «Cho vay 500tr thời hạn 1 năm» thành tin thuê: dấu hiệu BĐS viết tắt
«<số>n» khớp «1 năm» vì ranh giới từ của JS không hiểu chữ có dấu. Mạnh ký RM1 kèm lỗi (AC-5 của RM1); giám sát mở hàng
này, ưu tiên 1 của dãy U1 (31/10).

## Criteria

- AC-1: Given bài S03 không ghi chữ loại, có giá, mà chỗ duy nhất giống dấu hiệu BĐS là «<số> + chữ có dấu bắt đầu bằng n» («1 năm», «3 nữ», «5 nét»), When transform suy loại, Then bài không thành tin rao (`kind` rỗng, nguồn `bo`) — gồm ô «Cho vay 500tr thời hạn 1 năm».
- AC-2: Given bài có viết tắt phòng ngủ thật («2n1wc», «1n1k», «3n2vs», «2n+1», «Căn 2n 14tr» — chữ «n» theo sau là chữ số, dấu «+», khoảng trắng, dấu câu hoặc hết bài), When kiểm dấu hiệu BĐS và suy loại, Then vẫn là dấu hiệu BĐS và loại suy ra không đổi so với trước khi sửa.
- AC-3: Given bộ test RM1 và bộ test pipeline, When chạy sau khi sửa, Then xanh nguyên — không ô RM1 nào đổi kết quả.

## Coverage

- Trục A — Chữ đứng ngay sau «<số>n»: chữ có dấu (năm, nữ, nét) | chữ ASCII («1nk» không phải viết tắt — không đổi so với trước) | chữ số («2n1») | «+» | khoảng trắng / dấu câu / hết bài [thước CE: luồng khớp của nhánh `\d+\s*n\s*\+?\s*\d?` trong `DAU_HIEU_BDS`, `pipeline/transform-zalo.mjs`] → AC-1, AC-2.
- Quét đầy đủ không gian AC bỏ — một trục (xem sổ, dòng `bỏ coverage-scan`).

## Out of scope

- Mẫu Yêu cầu quá rộng «khách thiện chí xem nhà» (Ngoài-4 của RM1, đã ghi Known limits) — việc riêng.
- Đổi thứ tự quyết của suy loại RM1, sửa `parsePost`, hay thay luật bằng model (KC1).

## Notes

- Sửa cùng cách `CO_TY` đã dùng cho «tỷ»: lookahead âm trên lớp chữ có dấu thay `\b`.
