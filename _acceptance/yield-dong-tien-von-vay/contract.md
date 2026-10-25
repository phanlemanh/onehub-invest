---
schema_version: 1
feature: Nhà đầu tư dùng /yield thấy bảng chi phí vận hành và phần «Dòng tiền vốn vay» dựng bằng data-grid-advanced-7, còn link /vn/<market>/dau-tu cũ chuyển 301 về /yield?area=…#financing
slug: yield-dong-tien-von-vay
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, config]
status: verified
approved_by: Mạnh
approved_at: 2026-10-25
design_doc: docs/superpowers/specs/2026-10-25-yield-dong-tien-von-vay-design.md
---

# Acceptance Contract: yield-dong-tien-von-vay

## Context

Hàng UI3 (phủ GD5) của lộ trình giao diện 23/10, đợt I4 của `routes.md`: bộ mô phỏng đầu tư `/dau-tu` gộp vào Ước tính
lợi suất thành mục «Dòng tiền vốn vay» (chuyển thể `@reui/data-grid-advanced-7`, chỉ đọc) có bảng chi phí vận hành, link cũ
chuyển 301 về `/yield?area=<thị trường>#financing`; form-11 có nhóm «Vốn vay»; gỡ 16 vi phạm lint của nhóm.

Source input: `docs/plan/lo-trinh.json` hàng UI3 (11 tiêu chí — gỡ simulator và redirect phải đi cùng phần thay thế); ô
Cổng Đáng `_acceptance/yield-dong-tien-von-vay/opportunity.md` (Mạnh quyết build 23/10). Nhánh chồng lên UI2 (PR #78).

## Criteria

- AC-1: Given app chạy từ cây này, When gọi `GET /vn/hanoi/dau-tu` và `GET /vn/hcmc/dau-tu` không theo redirect, Then cả hai
  trả **301** với `Location` lần lượt `/yield?area=vn-hanoi#financing` và `/yield?area=vn-hcmc#financing`; `GET /vn/hanoi`
  không bị chuyển hướng; cây route không còn đoạn `dau-tu`, `VIET_EXCEPTIONS` không còn dòng `dau-tu`, test slug URL xanh.
- AC-2: Given mã nguồn `app/src` và `scripts/`, When tìm `/dau-tu`, Then không còn link nội bộ nào (chỉ còn `source` của
  redirect trong `next.config.ts` và các phép đo redirect); nút «Đầu tư» của Insight trỏ `/yield?area=<mã khu vực>#financing`.
- AC-3: Given `/yield?area=<mã thị trường>`, When trang dựng, Then thị trường ấy được chọn (breadcrumb mang tên thị trường,
  form chọn phường mặc định của nó) và trang có mục `id="financing"`; `area=<mã phường>` giữ hành vi cũ.
- AC-4: Given một ước tính có số, When nhìn mục «Dòng tiền vốn vay», Then lưới có các mục Doanh thu ngắn hạn · Chi phí vận
  hành (Phí quản lý, Phí nền tảng, Thuế, Chi phí cố định) · Thu nhập ròng · Trả nợ vay (Lãi, Gốc) · Dòng tiền sau nợ (và «So
  với cho thuê dài hạn» khi phường có giá thuê dài hạn), cột Hằng tháng + Năm 1…5, dòng tổng ghim «Lợi nhuận / tiền mặt bỏ
  ra»; doanh thu, từng chi phí và thu nhập ròng BẰNG đúng số của ước tính lợi suất cùng trang.
- AC-5: Given tham số vay, When tính, Then khoản vay = giá mua × (1 − vốn tự có); trả nợ hằng tháng theo công thức trả góp
  đều; lãi + gốc mỗi năm bằng 12 kỳ trả (trừ năm cuối kỳ hạn); tổng gốc trả hết kỳ hạn bằng khoản vay; vốn tự có 100% → khoản
  vay 0 và trả nợ 0; lãi 0% → trả nợ = khoản vay ÷ số tháng; tiền mặt bỏ ra = vốn tự có × giá + nội thất ban đầu.
- AC-6: Given form-11, When mở `/yield`, Then có nhóm «Vốn vay» với Vốn tự có 30%, Lãi suất 9%/năm, Kỳ hạn 20 năm; sửa rồi
  bấm «Ước tính» đẩy `eq`, `rate`, `term` lên URL và server dùng chúng (kẹp vốn tự có 10–100%, lãi 0–30%, kỳ hạn 5–35 năm);
  «Về mặc định» đặt lại cả chi phí lẫn vốn vay.
- AC-7 (cross-layer): Given người dùng bấm «Ước tính», When form gửi, Then sự kiện `dau_tu_input` vẫn phát (mang khu vực, giá mua, vốn tự
  có, lãi, kỳ hạn) và `/api/v1/user-events` nhận sự kiện ấy (người có phiên → ghi một dòng `user_events` mang payload mới; khách → 204, không ghi); loại sự kiện vẫn có trong kiểu của bộ nhớ agent.
- AC-8: Given lưới vốn vay, When bấm một hàng mục, Then mục mở/gập (mặc định mở Chi phí vận hành và Trả nợ vay); ở 375 px chỉ
  ghim nút mở + tên khoản mục, trang không cuộn ngang (lưới cuộn ngang trong khung).
- AC-9: Given `npm run lint` + `tsc --noEmit` ở `app/`, When chạy, Then sạch; `eslint-suppressions.json` không còn khoá của
  `investment-simulator.tsx` hay `yield-form.tsx` (giảm đúng 16); trang `/dau-tu`, `investment-simulator.tsx`, `lib/invest.ts`
  không còn.
- AC-10: Given kiểm cổng tĩnh, When chạy `check-portal-compliance.mjs`, Then mục 7 kiểm `/yield` + các tệp mục vốn vay không
  có chữ AirDNA/tên nguồn thật và `lib/financing.ts` không truy vấn DB; toàn bộ kiểm cổng ĐẠT.
- AC-11: Given tài liệu, When đọc, Then `routes.md` khớp cây route (không còn dòng `/dau-tu`; dòng `/yield` ghi
  `data-grid-advanced-7` ở `yield/financing/`) và nói nhất quán với `catalog.md`, `CONTEXT.md`, `app/CLAUDE.md` rằng Mô phỏng
  đầu tư đã gộp thành mục «Dòng tiền vốn vay» của `/yield` (`/dau-tu` → 301).

## Coverage

Quét hình thái (preset entity-feature, chân sản phẩm: routes.md/CONTEXT.md/catalog.md [SUY-TỪ-REPO], chân ngành:
`@reui/data-grid-advanced-7` (pro forma cho thuê) + công thức trả góp đều [NGÀNH: ReUI, toán tài chính chuẩn]):

- Trục **bề mặt**: `/yield` form · lưới vốn vay · link cũ `/dau-tu` · nút Insight [thước CE: câu giao + ghi chú hàng] →
  AC-1..4, AC-6.
- Trục **mô hình**: khoản vay · trả nợ · lãi/gốc theo năm · biên (vốn 100%, lãi 0) · nối với ước tính [thước CE: công thức
  annuity, quan hệ tổng gốc = khoản vay] → AC-4, AC-5.
- Trục **trạng thái**: mặc định · không vay · không giá thuê dài hạn · chưa đủ listing · điện thoại [thước CE: bảng ST
  trong design doc] → AC-3, AC-4, AC-8; trạng thái tải của `/yield`: Hỏi-2.
- Trục **dữ liệu người dùng**: sự kiện `dau_tu_input` (tầng A, local) [thước CE: danh sách loại của API + agent] → AC-7.
- Trục **lớp đo**: HTTP · hàm thuần · DOM jsdom · mắt (ảnh) · kiểm cổng tĩnh → mỗi AC ít nhất một lớp máy; AC-4/8 có lớp mắt.
- Cross-cutting: luật 5 (không số AirDNA trên Invest) → AC-10.

## Out of scope

- Trạng thái tải (skeleton/Suspense) của `/yield` — xem Hỏi-2.
- Nhãn «DỮ LIỆU MÔ PHỎNG» của `/yield` (giá bán/thuê nay đã tính từ tin rao thật) — việc riêng, chữ giữ nguyên.
- Sửa số trực tiếp trên lưới, thêm/xoá dòng chi phí tuỳ ý (tính năng của block gốc) — lưới chỉ đọc.
- Tăng giá, lạm phát, phí giao dịch, trả nợ trước hạn trong mô hình vốn vay.
- Biểu đồ 12 tháng (chart-36) và CompsTable — giữ nguyên.

## Notes

- Mẫu redirect: dòng `/so-sanh`, `/phuong-phap` của UI4/UI2 (`statusCode: 301`); nguồn có tham số `/:country/:market/dau-tu`.
- Nhánh chồng trên nhánh UI2; khi UI2 vào main thì gộp main trước khi mở PR.
- Bản gốc `@reui/data-grid-advanced-7` không qua `tsc` với data-grid đang cài (lệch kiểu `cellSelection`) — chỉ giữ bản chuyển
  thể ở `components/yield/financing/`.
