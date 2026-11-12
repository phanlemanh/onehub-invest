---
schema_version: 1
feature: Người vận hành bấm tạm dừng hoặc bật lại một nguồn trên /ops ở cloud, ghi lý do, và thấy lệnh đi tới «đã áp lúc HH:MM» kèm trạng thái trước và sau
slug: tam-dung-nguon-tu-cloud
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: không tệp nào khớp t3_paths (app/src/app/api/v1/ops/change-requests, app/src/lib, app/src/components/ops/collections, app/tests)
surfaces: [ui, api]
status: verified
approved_by: Mạnh
approved_at: 2026-11-12
design_doc: docs/superpowers/specs/2026-11-12-tam-dung-nguon-tu-cloud-design.md
---

# Acceptance Contract: tam-dung-nguon-tu-cloud

## Context

Hàng TV4b (T2) của mốc TVM1, đứng trên TV4 `so-lenh-bo-ap` (đường lệnh kéo, đã gộp) và TV2b `cong-tac-that` (script
thu tuân `isRunnable`, đã gộp). TV4 có route tạo, duyệt, kéo lệnh và bộ áp ở máy thu nhưng chưa có màn bấm. Hàng này
thêm nút Tạm dừng/Bật lại trên lưới «Sức khoẻ nguồn» của `/ops/collections`, hộp thoại xem trước/sau kèm lý do bắt
buộc, vùng «Lệnh gần đây» theo lệnh tới «đã áp», và cho người gửi tự duyệt lệnh của mình sau khi xem trước/sau (ADR-0015
§6) trừ lệnh nhắm S03.

Căn cứ: `docs/plan/lo-trinh.json` hàng TV4b (`bat_khi`), ADR-0015 §5–§6, `docs/research/ops-tu-van-hanh-nguon-saas.md`
§4.8 #1 và #4, `_acceptance/so-lenh-bo-ap/contract.md` (Out of scope ghi màn bấm là TV4b).

## Acceptance Criteria

- **AC-1** Given phiên vai `ops`, When POST `/api/v1/ops/change-requests` `{type:"source.pause", target:"S05",
  payload:{reason:"hết credit"}, tu_duyet:true}`, Then 201, lệnh ở `approved`, `approved_by` = `requested_by` = actor
  của phiên, `decided_at` có giá trị, `ops_audit` thêm đúng hai dòng (`change_request.create`, `change_request.decide`)
  cùng giao dịch. Cùng lời gọi KHÔNG có `tu_duyet` → `submitted`, một dòng audit (hành vi TV4 giữ nguyên). Vai `viewer`
  → 403; vai `ops` gửi `source.resume` kèm `tu_duyet` → 403, không thêm dòng; vai `admin` gửi `source.resume` S05 kèm
  `tu_duyet` → `approved`.
- **AC-2** Given vai `admin` A, When A gửi `source.pause` nhắm `S03` kèm `tu_duyet:true`, Then lệnh ở `submitted`
  (không tự duyệt), một dòng audit; A gọi `…/decide` approve → 409 `can-nguoi-thu-hai`; admin B khác A approve → 200,
  `approved`. Ở vùng «Lệnh gần đây», dòng S03 `submitted` có nút Duyệt/Từ chối chỉ cho admin khác người gửi; người gửi
  và vai ops không thấy nút.
- **AC-3** (cross-layer) Given hộp thoại xác nhận, When ô Lý do là `""`, `"   "` hay dài 501 ký tự, Then nút «Gửi lệnh»
  bị tắt; khi lý do hợp lệ thì bật. Và route nhận `payload.reason: "   "` → 400 `ly_do: "thieu-reason"`, số dòng
  `change_requests` và `ops_audit` không đổi.
- **AC-4** Given một lệnh ở mỗi trạng thái `submitted` (S03 và không S03), `approved`, `queued`, `applied`, `failed`,
  `reverted`, `rejected`, When hàm thuần `trangThaiLenh` dựng nhãn, Then đúng một nhãn cho mỗi ô của ma trận viết trước
  (8 ô): «Chờ người thứ hai duyệt» · «Chờ duyệt» · «Chờ máy thu nhận» · «Máy thu đã nhận lúc HH:MM» · «Đã áp lúc HH:MM»
  kèm «Đang chạy → Tạm dừng» đọc từ `before.status`/`after.status` · «Không áp được: <result.ly_do>» · «Đã hoàn lại» ·
  «Bị từ chối»; giờ theo giờ Việt Nam.
- **AC-5** Given lệnh `approved`, When `lastPullAt` là `null`, cũ hơn 5′, hay trong 5′, Then lần lượt hiện «Máy thu chưa
  kéo lệnh lần nào», «Máy thu chưa nhận lệnh từ HH:MM», và không cờ; lệnh ở trạng thái khác không bao giờ mang cờ.
- **AC-6** Given ma trận vai (`viewer`, `ops`, `admin`) × trạng thái nguồn (`active`, `paused`, `draft`, `retired`,
  `completed`) × có/không lệnh chưa xong (30 ô, viết trước), When `nutNguon` quyết, Then chỉ `active` + vai ≥ ops + không
  lệnh chờ → Tạm dừng; chỉ `paused` + vai ≥ admin + không lệnh chờ → Bật lại; mọi ô khác không nút (ô có lệnh chờ hiện
  «Đang có lệnh chờ»). Và trạng thái nguồn đưa vào `nutNguon` là trạng thái hiệu lực: lệnh `applied` mới nhất của nguồn
  có `finished_at` sau mốc bản tin thì lấy `after.status` của lệnh đó, ngược lại lấy trạng thái bản tin — nên ngay sau
  khi «Đã áp», hàng S05 đổi sang Bật lại (admin) dù bản tin 15′ chưa tới.
- **AC-7** (cross-layer) Given DB thử có lược đồ cloud (091) và lược đồ máy thu với `source_registry` S05 `active`, token
  máy `ops:pull`, When chuỗi chạy thật: route tạo (vai ops, `tu_duyet`) → route kéo → `apLenh` → `ingest`
  `change_request_results` → GET danh sách, Then lệnh hiện `applied` với `before.status = "active"`, `after.status =
  "paused"`, `trangThaiLenh` cho «Đã áp lúc HH:MM»; `isRunnable` của S05 đọc bằng `docTrangThai` trả không chạy (lượt
  thu kế tiếp không chạy). Chuỗi lặp với `source.resume` (vai admin) → `isRunnable` trả chạy.
- **AC-8** (ui-observed) Given dev server trỏ DB thử chép từ DB local, đăng nhập tài khoản thử vai ops, When mở
  `/ops/collections`, bấm «Tạm dừng» ở hàng S05, để trống lý do, rồi gõ lý do và «Gửi lệnh», Then hộp thoại hiện «Đang
  chạy → Tạm dừng», nút tắt khi trống; sau gửi có toast và vùng «Lệnh gần đây» có dòng S05 «Chờ máy thu nhận»; hàng S05
  thôi có nút và hiện «Đang có lệnh chờ». Đăng nhập vai viewer: không có cột Thao tác.

## Coverage

Quét theo preset test-matrix (skill morphological-scan), bốn trục — chi tiết ở design doc mục «Không gian đã quét»:
- Trục A — vai × trạng thái nguồn × lệnh chờ: 30 ô (AC-6). [CE: bảng vai §3.5 + máy vòng đời TV2a — đủ]
- Trục B — chặng lệnh hiện ra: 8 trạng thái + 3 ca máy thu (AC-4, AC-5). [CE: máy trạng thái ADR-0015 §5 — đủ]
- Trục C — đầu vào hộp thoại: trống · khoảng trắng · quá 500 · hợp lệ (AC-3, AC-8). [CE: luật khuôn `kiemLenh` của TV4]
- Trục D — tầng: route (AC-1, AC-2, AC-3) · hàm thuần (AC-4–AC-6) · đầu-cuối tới script thu (AC-7) · màn (AC-8).
  [CE: ngành — GitHub Actions «Disable workflow», Stripe Idempotency-Key; đủ-để-bắt-đầu]

## Đường đo

Ngưỡng của `opportunity.md` («Tạm dừng S05 từ cloud: lượt thu kế tiếp không chạy; bật lại: lượt kế tiếp chạy; thiếu
lý do: không gửi được»):
- «lượt thu kế tiếp không chạy / chạy» — số từ `isRunnable` của S05 sau chuỗi đầu-cuối · AC-7.
- «thiếu lý do: không gửi được» — nút tắt ở màn + route 400 · AC-3, AC-8.

## Out of scope

- Nút «đóng băng thay đổi» của owner (ADR-0015 §7) — Hỏi-3, khuyến nghị tách hàng riêng.
- Lệnh đảo một chạm từ dòng lệnh đã áp; sửa lệnh cũ.
- Đổi cột «Trạng thái» (badge) của lưới ngay sau áp: badge vẫn đọc bản tin 15′; chỉ nút Thao tác theo trạng thái hiệu
  lực (AC-6).
- Lệnh `unit.*` cho nhóm S05/vùng S06 (TV5), S03 qua cấu hình gateway (TV6).
- Nạp plist `ops-apply` và đo nhịp ≤ 5′ trên máy thật (triển khai sau gộp hàng sửa sau TV4).

## Notes
