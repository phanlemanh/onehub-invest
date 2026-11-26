# KEV2 — gỡ lớp Kev ở trang Thu thập (Ops) và audit-all

Hàng KEV2 (`bo-lop-kev-o-ops-va-audit`, đợt sau-audit-2411). Câu giao: người vận hành mở trang Thu thập và chạy
audit-all thì không còn lớp hay dòng đỏ nào của Kev. Kev đã gỡ khỏi lộ trình 15/11 và rời máy 24/11; mọi nơi còn dò
cổng :8009 nay luôn đỏ giả.

## Hiện trạng (đo trên origin/main 04b9ddc3b)

| Chỗ | Kev hiện ra thế nào |
|---|---|
| Khối «Khoá an toàn» (máy thu: `getLockdownStatus` trong `app/src/lib/ops-queries.ts`; bên ghi bản tin: `readLockdown` trong `scripts/lib/ops-local.mjs`) | lớp «Hạ tầng · Cổng Kev :8009», dò `127.0.0.1:8009/v1/models` → luôn «Không phản hồi» |
| Lưới «Máy móc» (máy thu: `readSchedulerStatus` trong `app/src/lib/collections-queries.ts`; bản tin: `pipeline/push-ops-facts.mjs`) | hàng `kev` «Cổng Kev :8009» luôn chết |
| Máy chủ (`withLockdownGates` trong `app/src/lib/ops-cloud.ts`) | hàng `kev` lấy trạng thái từ lớp Kev của khối khoá an toàn |
| Khung «Đường ống Zalo» (`pipe-panels.tsx`) | «Cổng Kev: sự kiện cuối …», đếm «tin thấy → qua cổng → nhận vào bảng thô» |
| Bảng nhóm S03 (`collections-tables.tsx`) | chú thích «Qua cổng = cổng Kev ≥ 0,9» |
| `scripts/audit-all.sh` mục F | `Service :8009 chết` → FAIL |

Hook Zalo trên main (`collector/openclaw/handler.js`, làn thu) vẫn gọi Kev và ghi một dòng `kev null (timeout/gate)`
cho MỖI tin khi Kev vắng; bộ đếm phễu hiện coi mọi dòng không phải heartbeat/alert là một «tin thấy», nên số tin thấy
đang đếm đôi. Gỡ Kev khỏi hook là KEV1 của làn thu — ngoài vòng này.

## Thiết kế

1. **Khối khoá an toàn còn bảy dòng.** Bỏ dòng «Cổng Kev :8009» khỏi `LOCKDOWN_LAYERS` và khỏi bản `.mjs` bên ghi;
   bỏ lời dò :8009 và trường `kevUp`. Năm lớp an toàn L1…L4b và hai dòng hạ tầng OpenClaw, cổng nhận tin giữ nguyên
   thứ tự và cách tính. Luật an toàn Zalo không đổi: dòng Kev là hạ tầng, không phải một trong các lớp khoá.
2. **Lưới Máy móc không còn hàng Kev** ở máy thu và trong bản tin đẩy lên.
3. **Máy chủ lọc bản tin cũ.** Bản tin máy thu đẩy trước khi chạy mã mới (tới 15′, hay lâu hơn khi máy thu chưa kéo
   main) còn hàng `kev` và lớp Kev: máy chủ bỏ hai thứ đó khi đọc, để trang trên cloud sạch ngay khi bản app mới lên,
   không phụ thuộc giờ máy thu cập nhật.
4. **Phễu hook gọi đúng tên.** Khung đường ống đổi «Cổng Kev» thành «Hook Zalo»; «qua cổng» thành «đẩy được vào cổng
   nhận tin» (dòng `post 202` của hook — đúng nghĩa đang đếm); chú thích bảng nhóm theo đó. Dòng `kev null …` không
   tính là một tin thấy (hết đếm đôi, kể cả khi KEV1 chưa vào).
5. **audit-all** chỉ dò :9210.
6. **Bộ đếm phễu của bản tin** (`parseLog` trong `pipeline/push-ops-facts.mjs`) đếm riêng bằng mã của nó: cùng luật bỏ
   dòng `kev null`, và test so số với bộ đếm của app trên cùng nhật ký.
7. **Sổ vận hành** `docs/ops/runtime-map.md`: khối Khoá an toàn bảy dòng (không còn «8/8»), hàng Máy móc không còn Kev gate.

Căn cứ an toàn: `docs/ops/runtime-map.md` xếp «Kev :8009, collector :9210» vào «Hạ tầng phụ thuộc hook», không vào các lớp
khoá L1…L4b — bớt dòng Kev không hạ lớp an toàn nào.

Không đổi: lược đồ DB, khoá `funnel` của bản tin (giữ tên trường để máy chủ cũ/mới cùng đọc), hook Zalo, watchdog,
`record-sheet.tsx` (nhãn «Ý định tin (Kev)» ở trang Dòng dữ liệu — hàng khác, ghi Out of scope).

## Đặc tả UX

Thay đổi chỉ bớt một dòng/hàng và đổi chữ trên hai khung có sẵn của `/ops/collections`; không màn mới, không luồng
mới, không trạng thái mới. Bảng trạng thái giữ nguyên của khung cũ (tải · trống · lỗi đã có). Bỏ design-pass có tên ở
sổ quyết định.

## Rủi ro

- Test hiện có ghim tám dòng/hàng Kev (`lockdown-cloud-theo-facts.test.tsx`, `ops-mobile-cot-trang-thai.test.tsx`,
  `pipeline/scripts/ops-nhan-ma-nguon.test.mjs`, các fixture `kevUp`) — sửa cùng vòng, ma trận còn bảy dòng.
- `pipeline/push-ops-facts.mjs` nằm trong `t3_paths` → hồ sơ hạng T3 (hàng lộ trình ghi T2): có Cổng 1.5 duyệt kế hoạch.
