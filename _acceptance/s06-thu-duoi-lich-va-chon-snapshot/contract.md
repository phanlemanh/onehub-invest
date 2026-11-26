---
schema_version: 1
feature: Đưa lớp lịch thu đuôi S06 của làn thu vào main (wrapper một vòng, chọn-nạp snapshot, khuôn plist) — chưa cài lịch
slug: s06-thu-duoi-lich-va-chon-snapshot
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-26-s06-thu-duoi-lich-va-chon-snapshot-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s06-thu-duoi-lich-va-chon-snapshot

## Context

ZC17 đưa bộ thu đuôi S06 vào main. Bộ thu chưa có ai gọi theo nhịp, và snapshot nó ghi chưa có ai nạp. Hồ sơ này đưa nhánh
`zcode/s06-thu-duoi-wrapper` @ `7173fc21a` của làn thu vào main. Nhánh có một wrapper chạy một vòng (`scripts/thu-duoi-s06.sh`),
bộ cắt mốc, khuôn plist 300 giây, thêm tên `thu-duoi-s06` vào `install-cron.sh --chi`, và hai tệp test. Vòng này KHÔNG cài
lịch: cài plist cần lời riêng của Mạnh.

## Criteria

- AC-1: Given khoá một lượt `<goc>.lock`, When pid ghi trong khoá còn sống, Then wrapper thoát 0, im lặng, không gọi bộ thu,
  không nạp. When pid đã chết, Then wrapper nhận lại khoá và chạy đủ vòng. Khoá được gỡ khi vòng xong. Bỏ kiểm pid sống trên
  bản chép thì ca khoá bận đỏ.
- AC-2: Given `scripts/chotot-daily.sh` đang chạy, When tới một vòng, Then wrapper thoát 0 kèm một dòng «nhường lượt», số lời
  gọi bộ thu và bộ nạp bằng 0. Bỏ bước nhường trên bản chép thì ca đỏ.
- AC-3: Given cổng vòng đời S06 trả 3 (từ chối), When tới một vòng, Then thoát 0 kèm lý do, không thu, không nạp. Cổng lỗi
  (mã khác 0 và 3) hoặc đọc vùng từ DB lỗi, Then thoát 1, 0 lời gọi bộ thu (fail-closed). Không vùng nào chạy được, Then thoát 0.
- AC-4: Given `THU_DUOI_S06_GOC` trỏ vào `collector/` hay một thư mục con của nó, When chạy, Then thoát 1 trước mọi thao tác,
  không tạo thư mục nào. Chạy với gốc mặc định thì mọi đường bộ thu nhận qua `--goc` nằm dưới `state/thu-duoi-s06`, không
  đường nào dưới `collector/snapshots`.
- AC-5 (cross-layer): Given DB của riêng lượt (`oneinvest_suite_*`) dựng từ migration, và bộ nạp THẬT `pipeline/import-chotot.mjs`,
  và snapshot là bản thật do bộ thu đuôi ghi (phép đo 24 giờ), When không có snapshot nào, Then thoát 0 và nạp 0. When hai vùng
  chạy được mà chỉ một vùng có snapshot đuôi, Then vùng đó nạp TỐI ĐA 1 snapshot, là snapshot mới nhất chưa nạp, số dòng stg tăng
  đúng số tin của snapshot ấy, vùng kia nạp 0. Vòng sau nạp snapshot tồn đọng còn lại. Snapshot đã nạp và còn trong stg thì không
  nạp lại. When snapshot đuôi đã nạp rồi bị một lượt quét đủ mới hơn thu lại cùng tin (đè
  `snapshot_id` trong stg), Then vòng sau KHÔNG nạp lại snapshot đó (0 lời nạp, nhật ký không có dòng «nạp snapshot đuôi» cho
  nó), và nội dung dòng stg không lùi. Ca này đo trên đúng cặp wrapper + bộ nạp, không shim bước tra stg.
- AC-6: Given bộ thu thoát 3, 4 hoặc 5 ở một vùng, When chạy vòng, Then wrapper dừng vòng và thoát ĐÚNG mã đó, không nạp vùng
  ấy. Bộ nạp lỗi ở một vùng, Then các vùng sau vẫn được thử và wrapper thoát 1 cuối vòng.
- AC-7: Given `moc.json` có nhiều id hơn trần, When cắt mốc, Then giữ đúng N id CUỐI, ghi qua tệp tạm rồi đổi tên, không sót
  tệp tạm. Dưới trần thì không ghi lại tệp. Thiếu tệp, JSON hỏng hay trần vô nghĩa thì không ném lỗi, vòng thu vẫn chạy. Trần
  đọc từ `THU_DUOI_S06_MOC_TOIDA`.
- AC-8: Given `install-cron.sh` với launchctl giả, When `--chi thu-duoi-s06`, Then chỉ plist `com.oneinvest.thu-duoi-s06` được
  ghi, `__ROOT__` được thay bằng gốc kho, các job khác không bị chạm. Vắng cờ thì đủ ba job cũ như trước. Tên lạ hay `--chi` trơn
  thì thoát 2, không ghi plist nào. Khuôn plist có `Label` đúng và `StartInterval` 300.
- AC-9: Given máy thu sau lượt chấm, When đọc `launchctl list` và `~/Library/LaunchAgents`, Then không có
  `com.oneinvest.thu-duoi-s06`. Given nhánh so với `origin/main`, Then ngoài vật hồ sơ (`_acceptance/**`, `docs/**`, tệp máy sinh)
  chỉ có đúng sáu tệp của làn thu, và hai tệp test chạy với HOME tạm rỗng, không `DATABASE_URL`, không lời gọi mạng ra ngoài.

## Coverage

Bảng phủ ca đầy đủ, số đếm từ DB máy thu, nằm ở design doc mục «Bảng phủ ca». Bỏ quét `morphological-scan`, xem dòng `descope`
trong sổ: không gian ca là các nhánh của một wrapper đã viết xong, nên liệt theo nhánh mã và dữ liệu thật thì sát hơn quét ý tưởng.

- Trục khoá: rảnh · bận · sót → AC-1
- Trục nhường: lượt quét đủ chạy · không → AC-2
- Trục cổng và DB: cổng từ chối · cổng lỗi · đọc vùng lỗi · không vùng → AC-3
- Trục gốc snapshot: mặc định · trỏ vào `collector/` → AC-4
- Trục chọn-nạp: không snapshot · snapshot mới · tồn đọng · đã nạp còn trong stg · đã nạp bị lượt quét đủ đè · hai vùng → AC-5
- Trục kết cục bộ thu và bộ nạp: 0 · 3 · 4 · 5 · nạp lỗi → AC-6
- Trục mốc: trên trần · dưới trần · hỏng → AC-7
- Trục cài lịch: `--chi thu-duoi-s06` · vắng cờ · tên lạ · trơn → AC-8; không cài trong vòng → AC-9
- Trục phạm vi và cách ly: tệp đổi · mạng · HOME → AC-9
- [GIẢ ĐỊNH] Năm vùng ngoài hcmc chưa có phép đo sống của bộ thu đuôi (phép đo 24h của làn thu chỉ ở hcmc). Ca hai vùng ở AC-5
  dùng snapshot dựng trên DB của riêng lượt.

## Đường đo

Không có `opportunity.md`: hàng được GS mở trong đợt. Thước «đăng → Invest» của Mạnh (24/11) chỉ đo được khi lịch đã cài và
PL38 nối transform, resolve, sync-cloud theo nhịp. Hồ sơ này chỉ bảo đảm chặng «snapshot đuôi → stg» đúng (AC-5).

## Out of scope

- Cài plist hay nạp launchd, đổi `StartInterval`: cần lời riêng của Mạnh, xin ở thẻ Cổng Bằng chứng, làm sau khi gộp.
- Chạy sống wrapper vào `state/` hay `collector/snapshots` trên máy thu.
- Transform gia tăng, resolve, sync-cloud theo nhịp: PL38.
- Mọi sửa logic thu: làn ZCode, trả về qua LL (`tin MỞ LẠI`).

## Notes

- Ở S1 đã thấy AC-5 nhiều khả năng đỏ trên `7173fc21a`. Bước 7 của wrapper coi «chưa nạp» là «stg không còn dòng nào mang
  `snapshot_id` này», trong khi bộ nạp ghi đè `snapshot_id` theo bản mới hơn. Trên máy thu, 100/375 snapshot S06 đã nạp
  không còn dòng nào trong stg (94 thuộc nhóm «vn», 6 snapshot vùng). GS phán 26/11: trả ZCode qua LL (GIAO claudedp-2611-21). Hồ sơ chấm trên sha mới ZCode giao, U2 tích hợp lên nhánh này, và chỉ trình Cổng Phạm vi sau khi E5 chạy trên sha đó.
- Test của nhánh dùng shim `node`, nên bước tra stg và bộ nạp không chạy thật. AC-5 là ca duy nhất nối wrapper với bộ nạp thật.
