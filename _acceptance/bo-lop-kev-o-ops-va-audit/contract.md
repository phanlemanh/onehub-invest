---
schema_version: 1
feature: Trang Thu thập (Ops, máy thu và cloud) và audit-all thôi hiện lớp, hàng, dòng đỏ của Kev; phễu hook gọi đúng tên và thôi đếm đôi
slug: bo-lop-kev-o-ops-va-audit
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, cli]
status: verified
approved_by: Mạnh
approved_at: 2026-11-26T03:40:00Z
design_doc: docs/superpowers/specs/2026-11-26-bo-lop-kev-o-ops-va-audit-design.md
---

# Acceptance Contract: bo-lop-kev-o-ops-va-audit

## Context

Hàng KEV2 (đợt sau-audit-2411). Kev gỡ khỏi lộ trình 15/11, rời máy 24/11; mọi lời dò :8009 nay luôn đỏ giả: lớp
«Cổng Kev :8009» trong khối Khoá an toàn, hàng `kev` trong lưới Máy móc (máy thu và bản tin đẩy lên cloud), chữ «Cổng
Kev» ở khung đường ống Zalo và chú thích bảng nhóm, và `Service :8009 chết` trong audit-all. Hạng T3 vì chạm
`pipeline/push-ops-facts.mjs` (`t3_paths`); hàng lộ trình ghi T2.

## Acceptance Criteria

- **AC-1** Given máy thu, When `/ops/collections` dựng khối Khoá an toàn, Then khối có đúng bảy dòng theo thứ tự L1, L2, L3,
  L4, L4b, «OpenClaw đang chạy», «Cổng nhận tin :9210» — không dòng nào chứa «Kev» hay «8009» — và lượt dựng không mở kết
  nối nào tới cổng 8009. Bản ghi bản tin (`readLockdown` của `scripts/lib/ops-local.mjs`) trả cùng bảy dòng, cùng thứ tự.
- **AC-2** Given máy thu, When lưới Máy móc dựng, Then không hàng nào có id `kev` hay nhãn chứa «Kev»/«8009»; các hàng còn
  lại (S02 vòng, S01 tuần, S01 thử nhanh, cổng nhận tin) giữ nguyên.
- **AC-3** Given `pipeline/push-ops-facts.mjs` dựng bản tin, Then `jobs` không có id `kev`, `lockdown.layers` không có dòng
  Kev, và toàn văn JSON bản tin không chứa chuỗi «Kev» hay «8009»; các khoá khác của bản tin giữ nguyên tên.
- **AC-4** Given máy chủ (cloud) đọc một bản tin CŨ còn hàng `kev` và lớp «Cổng Kev :8009», When `/ops/collections` dựng,
  Then trang không hiện hàng hay lớp Kev; hàng «Cổng nhận tin :9210» vẫn mang đúng trạng thái lớp cổng nhận tin của khối
  khoá an toàn (Sống / Không phản hồi / Chưa kiểm được). Đối chứng: bản tin không có Kev cho cùng trang.
- **AC-5** Given khung đường ống Zalo, Then chữ khung không còn «Kev»: dòng phễu nói «Hook S03: sự kiện cuối … 7 ngày qua: N
  tin thấy → M đẩy vào cổng nhận tin → K nhận vào bảng thô»; chú thích bảng nhóm S03 không còn «cổng Kev ≥ 0,9».
- **AC-6** Given nhật ký hook có các dòng `kev null (timeout/gate) …` xen giữa dòng `post 202 …`, When đếm phễu — cả ở máy thu
  (`readGateFunnel`) lẫn ở bản tin đẩy lên (`parseLog` của `pipeline/push-ops-facts.mjs`) — Then dòng `kev null` không tính là
  một tin thấy: nhật ký mẫu dựng từ khuôn dòng log của chính `collector/openclaw/handler.js` (ma trận loại dòng viết trước) cho
  đúng n tin thấy, không phải 2n, và hai bộ đếm ra cùng số. Đối chứng: bản sao bộ đếm bỏ luật lọc → ghim «tin thấy đếm đôi».
- **AC-7** Given `scripts/audit-all.sh` mục F (hạ tầng), Then không còn kiểm `:8009`; `:9210` vẫn kiểm (sống → PASS, chết →
  FAIL). Đối chứng: bản sao còn `:8009` trong vòng dò → ghim tên cổng.
- **AC-8** Given các tệp mã trong vùng hàng (bảy tệp mã + hai thành phần Thu thập), Then không tệp nào còn chuỗi
  `127.0.0.1:8009`, «Cổng Kev», «Kev gate» hay trường `kevUp`. Đối chứng: chèn lại một chuỗi vào bản sao → ghim tên tệp.

## Out of scope

- Cách đếm «tin thấy» cho các loại dòng khác của hook (spool, skip, media-only): giữ như nay, chỉ bỏ dòng `kev null`.

- Gỡ Kev khỏi hook Zalo (`collector/openclaw/handler.js` vẫn gọi :8009 và ghi `kev null`): KEV1 của làn thu.
- Nhãn «Ý định tin (Kev)» ở trang Dòng dữ liệu (`record-sheet.tsx`): ngoài trang Thu thập, để hàng dọn chữ sau.
- `scripts/zalo-watchdog.sh`, plist launchd, cấu hình OpenClaw: làn ZCode, cần lời riêng.
- Đổi tên khoá `funnel` / `jobs` của bản tin: giữ tên để máy chủ cũ và mới cùng đọc.
- Thử/đo Kev trong `scripts/kev-nhan/`, `pipeline/scripts/bench-gate.mjs`: công cụ lịch sử, không hiện ở Ops.

## Coverage

- Trục nơi hiện: máy thu · bản tin đẩy lên · máy chủ đọc bản tin cũ · audit-all [thước CE: bảng hiện trạng trong design
  doc, đo trên main 04b9ddc3b] — AC-1, AC-2, AC-3, AC-4, AC-7.
- Trục khối trang: khoá an toàn · lưới máy móc · khung đường ống · bảng nhóm — AC-1, AC-2, AC-5.
- Trục nhật ký hook: chỉ dòng post · post xen `kev null` · tệp vắng · bộ đếm máy thu và bộ đếm bản tin — AC-6.
- Trục chặn quay lại: chuỗi Kev trong mã vùng — AC-8.

## Notes

- Số trên màn: khối Khoá an toàn 8 → 7 dòng (một dòng đỏ giả bớt); lưới Máy móc bớt một hàng chết; audit-all bớt một FAIL.
