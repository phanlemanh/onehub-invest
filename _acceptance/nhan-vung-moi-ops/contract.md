---
schema_version: 1
feature: Trang tổng quan /ops hiện tên Việt cho vùng thu S06 là tỉnh cũ đã sáp nhập (binh-duong) thay vì in mã thô
slug: nhan-vung-moi-ops
owner: phanlemanh@gmail.com
risk_tier: T1      # chỉ đổi hàm thuần đặt tên thị trường và thêm một tệp test; không đổi dữ liệu, quyền hay luồng
surfaces: [ui]
status: draft      # T1: không qua Cổng Phạm vi / Cổng Bằng chứng; người gộp PR là người chốt
---

# Acceptance Contract: nhan-vung-moi-ops

## Context

Hồ sơ có mặt vì PR chạm `app/` (ngoài `t1_skip_globs`). Từ tối 12/11 DB máy thu có vùng thu S06 mới `binh-duong`,
`hai-phong`, `khanh-hoa`. Ca ON12-AC-7 (`app/tests/ops-nhan-theo-context.test.tsx`) đỏ: trang `/ops` in
«binh-duong (chưa có tên Việt)». `hai-phong` và `khanh-hoa` đã ra tên qua `areas`; `binh-duong` thì không, vì Bình Dương
đã sáp nhập vào TP. Hồ Chí Minh và `areas` chỉ có 34 thị trường mới. Bộ `cd app && npm test` đỏ sẵn, chặn mọi lượt chấm.

Sửa: `marketNameOf` (`app/src/lib/market-names.ts`) tra thêm bảng `TINH_CU` — đúng bốn tỉnh cũ của `SAP_NHAP`
(`pipeline/lib/thi-truong.mjs`) — ra «Bình Dương (nay thuộc Hồ Chí Minh)». Mã lạ vẫn ra «(chưa có tên Việt)», nên
ON12-AC-7 vẫn đỏ khi có vùng lạ.

## Criteria

- AC-1: Given DB máy thu có vùng thu `binh-duong`, `hai-phong`, `khanh-hoa`, When chạy ON12-AC-7, Then xanh; trên main `5a3c3dc6` ca này đỏ với «binh-duong (chưa có tên Việt)».
- AC-2: Given ma trận sáu ô viết trước, When `marketNameOf` đặt tên, Then `binh-duong` ra «Bình Dương (nay thuộc Hồ Chí Minh)», `hai-phong`/`khanh-hoa` ra tên `areas`, mã lạ vẫn ra «(chưa có tên Việt)» với `known: false` (`app/tests/ten-tinh-cu.test.tsx`).
- AC-3: Given `SAP_NHAP` của pipeline, When so với `TINH_CU`, Then cùng khoá và cùng thị trường mới; bỏ dòng `binh-duong` khỏi bảng thì mã lại thành chữ thô (đối chứng đỏ).

## Out of scope

- OOS-1: Đổi mã vùng thu S06 sang mã thị trường mới: mã vùng là việc của làn thu.
- OOS-2: Chạy bộ test app đầy đủ trên máy: khoá chấm đang có người giữ chờ bản sửa; CI chạy bộ đầy đủ.

## Notes

- `binh-duong` là VÙNG THU của nguồn S06 (nguồn vẫn chia theo tỉnh cũ), không phải đơn vị hành chính hiện hành; nhãn
  «(nay thuộc Hồ Chí Minh)» nói rõ điều đó. Không đổi mã vùng S06 (làn thu), không thêm dòng `areas`, không sửa DB.
- Nơi khác cũng in tên qua `marketNameOf`, nên cùng nhận bản sửa (không mở rộng sửa thêm):
  `app/src/components/ops/overview/status.ts`, `app/src/components/ops/overview/objectives-grid.tsx` (trang `/ops`),
  `app/src/components/ops/quality-tables.tsx` (`/ops/quality`), `app/src/lib/dq-labels.ts` (nhãn dòng kiểm chất lượng).
  Invest không gọi hàm này.
- CI lượt đầu (9be26163) đỏ hai ca do chính bản sửa: KV-AC-1 (`app/tests/ma-thi-truong-dai.test.tsx`, hồ sơ
  test-app-tren-db-chung) lấy `binh-duong` làm mã lạ «có chủ đích» — dòng ấy đổi sang tên mới và thêm mã lạ `vung-la`;
  ON12-AC-2 bắt chuỗi `vn-hcmc` như chữ tiếng Anh — bảng viết lại để mã chỉ nằm ở khoá object (bộ rút chuỗi bỏ qua khoá).
