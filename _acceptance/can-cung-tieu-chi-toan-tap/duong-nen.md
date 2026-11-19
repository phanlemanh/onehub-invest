---
slug: can-cung-tieu-chi-toan-tap
at: 2026-11-19T11:19:03.871Z
sha: 9c3686b903deebd9b5091b3be2588d8e0e891a66
nen: do
cong_cu: xanh
suite: do
luoi: xanh
engine: xanh
---

## Dòng đỏ

- nen suite: DO SAN executors.suite.app_ui ma 1
- nen suite: DO SAN executors.suite.pipeline_a ma 1

## Dòng vàng

- nen luoi: 1 vi pham cua chinh vong (khong tinh)
- VIOLATION [can-cung-tieu-chi-toan-tap]: status=implemented but no evidence-report.md

## Chạy lại sau khi sửa (19/11, theo lời giám sát)

Chỉ chạy lại hai suite đỏ, không chạy lại trọn đường nền.

- pipeline_a @048fb19fe (sau khi thêm symlink agent/, data-api/node_modules): 371/371 đạt, 11:38–12:10Z.
- app_ui @c59a60e7f: 1247 đạt, 0 đỏ (1256 ca), xong 12:20Z. Ba nguyên nhân đỏ trước đó đều của vòng: trang nhập `./actions`
  tương đối (a42a28e25), dòng import trang một căn mà ca OD1-AC-9 thay nguyên văn, chữ «tab» và `actions.ts` chưa kê vào SCAN_FILES
  (c59a60e7f, tệp ngoài vùng có duyệt N1-116).
