---
schema_version: 1
feature: ZC5 — job Airbnb nightly theo worklist AirDNA thay job tuần; cửa sổ giờ CCP thôi làm mặc định
slug: airbnb-worklist
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, config, docs]
status: verified
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: airbnb-worklist

## Context

Trước đây Airbnb chỉ được thu bằng một job Chủ nhật (discovery rồi PDP), nên độ phủ thấp. ZC5 thay bằng job nightly đi theo worklist rút từ universe AirDNA. Worklist là các listing AirDNA có id Airbnb mà ta chưa có, xếp 3 market lớn trước, mỗi đêm tối đa 24 batch × 25 = 600 PDP.

Các thay đổi đi kèm:
- Rotation AirDNA lên 12 market/đêm.
- Collector `airbnb-listing` có chế độ worklist và đánh dấu listing đã rút (gone).
- Gate dừng cả đêm khi tỉ lệ gone vượt 40%.
- Finalize chạy cho từng thị trường.
- Gỡ job tuần `com.oneinvest.collector`.

Mạnh chốt 23/10: `CONDUCT_WINDOW` mặc định `off`; jitter và cap 600/ngày giữ nguyên. Phần làn Claude của hàng là cập nhật ADR-0007 mục CCP.

Hàng ZC5 của lộ trình (`docs/plan/lo-trinh.json`, hạng T2, đứng trên AU9).

Source input: prompt (brief phiên điều phối liên làn local_5d0e32a0…, 23/10/2026). Nhánh `zcode/airbnb-worklist` @ e5e92c4, plan 2026-10-21-coverage-worklist.

## Criteria

- AC-1: Given repo và LaunchAgents đang có job tuần cũ `com.oneinvest.collector`, When chạy `install-airbnb-cron.sh` rồi `install-cron.sh`, Then:
  - job cũ bị bootout và xoá khỏi LaunchAgents;
  - `airbnb-nightly` và `smoke` được cài và bootstrap, với `__ROOT__` đã thay;
  - `install-cron.sh` chỉ cài `smoke` và `backup`, không hồi sinh job cũ;
  - template `com.oneinvest.collector.plist` không còn trong repo, và plist nightly qua `plutil -lint`.
- AC-2: Given job nightly chạy, When các bước diễn ra, Then thứ tự là xuất worklist → gate sức khoẻ → các batch thu → finalize.
  - Gate báo dừng: cả đêm không thu, không finalize, exit khác 0.
  - Một batch lỗi: dừng ngay, không finalize, exit 1.
  - Hết việc, hoặc scheduler bỏ qua: dừng sớm rồi finalize phần đã có.
  - Luôn còn việc: dừng đúng ở 24 batch (= cap 600).
  - Jitter ≤ 20′ trước khi chạm nguồn.
- AC-3: Given rotation AirDNA hằng đêm, When chạy với mặc định, Then lấy 12 market/đêm (không còn 6), và job AirDNA hằng đêm xuất lại worklist sau khi transform.
- AC-4: Given universe AirDNA trong DB local, When chạy `export-airdna-worklist.mjs`, Then tệp worklist có `{generatedAt, total, ids}`, mọi id dạng `abnb_<số>`, không trùng, xếp market 47 → 48 → 89491 → khác, cùng market thì doanh thu cao trước; id vrbo hay trùng bị loại.
- AC-5: Given collector `airbnb-listing` ở chế độ worklist, When đọc worklist và gặp trang Airbnb, Then:
  - id được bỏ prefix `abnb_` để dựng URL `/rooms/<id>`;
  - worklist hỏng hoặc không phải mảng cho ra rỗng;
  - trang báo không tồn tại hoặc redirect khỏi `/rooms/<id>` bị đánh dấu gone;
  - trang có dữ liệu nguồn mà title chứa từ khoá lỗi KHÔNG bị đánh gone.
- AC-6: Given checkpoint có done/gone, When tính sức khoẻ worklist, Then tỉ lệ gone/done (làm tròn %) trên 40% thì dừng; đúng 40% và 40,4% thì chưa dừng; chưa thu gì thì không chia 0.
- AC-7: Given snapshot `airbnb-listing` của hanoi, hcmc, danang, vn, When chạy `finalize-airbnb.sh`, Then:
  - snapshot chưa nạp được nạp, snapshot đã nạp bị bỏ qua;
  - gán phường chạy một lượt;
  - transform chạy TỪNG thị trường;
  - metrics chạy 300 → 400 → 410 → 450.
- AC-8: Given scheduler collector, When không đặt `CONDUCT_WINDOW`, Then:
  - thu chạy ở mọi giờ;
  - jitter mặc định vẫn ngủ ≥ 2s mỗi request;
  - cap ngày 600 vẫn chặn;
  - đặt `CONDUCT_WINDOW` một khung không chứa giờ hiện tại thì vẫn bỏ qua;
  - ADR-0007 mục CCP ghi quyết định này (Mạnh chốt 23/10).

## Coverage

- Bỏ coverage-scan: 8 AC theo hàng ZC5 (`tieu_chi: 8`) và brief. Các trục:
  - cài đặt: job cũ / job mới / installer kia;
  - luồng đêm: gate ok / gate dừng / batch lỗi / hết việc / skip / luôn còn việc;
  - gate: dưới / đúng / trên 40%;
  - thị trường: 4;
  - CCP: window off / window đặt / cap / jitter.

## Out of scope

- Một đêm chạy thật (cột `bat_khi`: worklist chạy đủ id, không lượt gọi nào ngoài cửa sổ) — chỉ đo được sau triển khai (`install-airbnb-cron.sh` do ZCode chạy qua kênh tin).
- Gọi Airbnb hoặc AirDNA thật, mở trình duyệt headful, dùng `.airdna-profile`.
- Phường Đà Nẵng (hàng AU9): ZC5 đứng trên AU9.
- Hạ rotation AirDNA về 7 market/đêm sau 43/43 (Task 7 steady state).
- `launchctl` thật trên máy.

## Notes

- **Ràng buộc AU9:** worklist hiện có id của Đà Nẵng (market 89491). Listing chỉ gán được phường Đà Nẵng sau khi AU9 xong. Trước đó, listing ĐN không có phường đúng, và metrics/breakdown ĐN chưa tin được. Cần AU9 merge trước khi nightly lấy id ĐN, hoặc chấp nhận có tên.
  - Đính chính sau verify vòng 1: theo thứ tự worklist hiện tại (HCMC → HN → ĐN, 600 id/đêm), id ĐN đầu tiên rơi vào khoảng đêm thứ 48, không phải ngay đêm đầu. Trong khi chưa có AU9, `reassign-areas` chỉ khai HN và HCMC: listing ĐN bị bỏ khỏi bảng canonical, raw vẫn giữ, và transform hằng đêm sẽ nhặt lại sau AU9.
- Eval chạy installer, `airbnb-nightly.sh`, `finalize-airbnb.sh` thật trên bản chép trong thư mục tạm, với HOME giả và stub `launchctl`/`docker`/`sleep`/`npm`/`security`/`osascript` (kiểm stub thắng PATH). Các bước con của nightly và finalize là bản giả. `export-db` chỉ đọc DB local.
- Hợp đồng dựng SAU khi code xong (ZCode, 9 commit) nên `gate1_skipped: true`. ADR-0007 sửa trên nhánh nghiệm thu (làn Claude).
