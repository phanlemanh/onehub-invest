---
schema_version: 1
feature: Trang /ops gọi đúng tên thị trường vùng mới của S06 (Đà Nẵng, Hải Phòng, Khánh Hoà) khi bảng khu vực còn giữ mã dài — bản tạm ở app tới khi đổi mã khu vực
slug: khu-vuc-vung-moi-s06
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
veto_state: mo
veto_opened_at: 2026-10-31T08:25:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-khu-vuc-vung-moi-s06-design.md
---

# Acceptance Contract: khu-vuc-vung-moi-s06

## Context

`ON12-AC-7` đỏ trên main vì nhóm thu S06 dùng khoá ngắn (`da-nang`, cityCode `vn-da-nang`) trong khi `areas` còn 32 thị
trường mã dài `vn-thanh-pho-*`/`vn-tinh-*`. Giám sát quyết 31/10: sửa tạm ở `marketNameOf`; đổi mã dữ liệu là hàng
`ma-thi-truong-ngan`.

Đo 31/10 trên :5433: ảnh chụp S06 có khoá `da-nang` (1), `hanoi` (13), `hcmc` (13); `hai-phong`, `khanh-hoa`,
`binh-duong` chưa có ảnh chụp. Mỗi khoá thuộc một nhóm: ra tên (`da-nang`, `hai-phong`, `khanh-hoa`, `hanoi`, `hcmc`) hoặc mã
lạ có chủ đích (`binh-duong` — đã nhập vào TP.HCM, `areas` không có mã; ánh xạ thuộc hàng `ma-thi-truong-ngan`).

## Criteria

- AC-1: Given bảng tên khu vực có `vn-thanh-pho-da-nang`, `vn-thanh-pho-hai-phong`, `vn-tinh-khanh-hoa` (và `vn-khanh-hoa` mã
  ngắn), When tra tên bằng khoá nhóm thu (`da-nang`), cityCode (`vn-da-nang`) hay mã dài đầy đủ (`vn-thanh-pho-da-nang`,
  `vn-tinh-khanh-hoa`), Then ra đúng tên thị trường; mã ngắn có sẵn thắng mã dài cùng gốc; mã lạ (`binh-duong`, `danang`) vẫn
  báo «(chưa có tên Việt)», không khớp mờ.
- AC-2: Given DB máy thu :5433 có ảnh chụp S06 ở ít nhất một khoá vùng mới, When dựng trang /ops tổng quan, Then không còn chữ thô «(chưa có tên Việt)» — ca ON12-AC-7 xanh.
- AC-3: Given toàn bộ thay đổi, When chạy bộ test app, typecheck và lint, Then xanh.

## Coverage

Bỏ quét không gian — một trục (dạng mã vào: khoá nhóm thu, cityCode, mã dài, mã ngắn có sẵn, mã lạ) quét đủ ở ma trận viết trước
của AC-1; xem dòng descope trong sổ.

## Out of scope

- Đổi mã thị trường trong `areas` về dạng ngắn (hàng `ma-thi-truong-ngan`, T3, migration 064).
- Nạp phường vùng mới cho `reassign-areas` (hàng sau).

## Notes
