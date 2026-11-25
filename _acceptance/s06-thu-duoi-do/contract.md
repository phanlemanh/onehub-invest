---
schema_version: 1
feature: Đưa bộ thu đuôi S06 của làn thu vào main (chỉ mã thu và test, chưa lịch, chưa nạp)
slug: s06-thu-duoi-do
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T03:53:20Z
design_doc: docs/superpowers/specs/2026-11-25-s06-thu-duoi-do-design.md
approved_by:
approved_at:
---

# Acceptance Contract: s06-thu-duoi-do

## Context

Mạnh chốt thước «đăng → Invest» cho S06 ngày 24/11: p50 ≤ 30 phút, p90 ≤ 2 giờ. Lượt quét đủ S06 chạy hai lần mỗi ngày nên
không đạt được thước này. Làn thu viết bộ thu «đuôi»: mỗi nhịp lấy trang 1–3 của một vùng × một mục và dừng ở trang đầu tiên
không còn tin mới. Phép đo 24 giờ của làn thu bắt được 1.072/1.072 tin mới, độ trễ p50 12,2′ và p90 28,6′, không lần nào bị
chặn. Hồ sơ này đưa nhánh `zcode/zt-thu-duoi-s06-do` @ `d93783b0a` vào main. Nhánh gồm 3 tệp: bộ thu, bộ test và một dòng
`pipeline/test-nua.json`.

## Criteria

- AC-1: Given một nhịp thu đuôi với nguồn giả, When trang 1 toàn tin đã có (theo mốc hoặc theo `stg_chotot_ads`), Then dừng
  sau đúng 1 trang và ra 0 tin mới. When trang 1 còn tin mới, Then lấy tiếp trang 2. Ba trang đều còn tin mới thì dừng ở trần
  3 trang. Trang rỗng thì dừng vì hết trang. Theo luật rẻ `gap-da-co`, bộ thu dừng ngay sau trang đầu có tin đã có nhưng
  vẫn giữ đủ tin mới của trang đó. Chạy lại bằng mốc mới trên cùng danh sách thì ra 0 tin mới. Phá điều kiện dừng gặp tin đã
  có trên bản chép thì ca tương ứng đỏ, đo trong lượt chấm.
- AC-2: Given nguồn giả trả 403, 429, hoặc trang HTML kèm mã 200, When bộ thu lấy trang, Then dừng sau đúng 1 lời, không thử
  lại. Cả phép đo dừng, thoát mã 3, và giữ snapshot phần đã lấy. Lỗi mạng và 5xx thì thử lại tối đa 3 lần. Vượt trần lời gọi
  thì không gọi thêm và thoát mã 5. Phá nhận diện 403/429 trên bản chép thì ca tương ứng đỏ.
- AC-3: Given cổng vòng đời của S06 đóng, hoặc DB không mở được, When tới một nhịp, Then số lời gọi nguồn của nhịp đó bằng
  0 (fail-closed). Cổng đóng thì thoát mã 4. DB lỗi thì bỏ lượt đó, lượt sau vẫn chạy. Bỏ kiểm cổng trên bản chép thì ca cổng
  đóng đỏ.
- AC-4: Given DB của riêng lượt (`oneinvest_suite_*`), When chạy đủ tệp test, Then cả 56 ca đều qua, 0 ca bỏ qua. Phiên DB
  của bộ thu từ chối mọi câu ghi, kể cả ghi vào `stg_chotot_ads`. Tệp test từ chối chạy ca DB trên DB không mang tên
  `oneinvest_suite_*`.
- AC-5: Given tệp test chạy với HOME là thư mục tạm rỗng và không có `DATABASE_URL`, When chạy dưới bộ chặn mạng, Then test
  exit 0, có 0 lời gọi mạng ra ngoài máy (`fetch` hoặc socket TCP), và HOME tạm vẫn rỗng. Đối chứng: một tệp test gọi `fetch`
  thật dưới cùng bộ chặn thì bị bắt 1 lời.
- AC-6: Given phép đo 24 giờ thật của làn thu (288 lượt, 231 snapshot), When đọc lại từng snapshot bằng `readSnapshot` của
  `import-chotot.mjs`, Then cả 231 snapshot đọc được, sha256 khớp manifest. Số tin của mỗi snapshot bằng số mục mới của lượt
  đó, mã tin khớp từng cái. Không lượt nào có tin mới mà thiếu snapshot. Bảng phủ ca theo trục in ra từ chính dữ liệu ấy.
- AC-7: Given tệp test mới, When chạy bộ canh chia nửa, Then tệp nằm đúng một nửa của `pipeline/test-nua.json`, và hợp hai
  nửa bằng đúng tập `npm test`.
- AC-8: Given nhánh so với `origin/main`, When liệt tệp đổi, Then ngoài vật hồ sơ (`_acceptance/**`, `docs/**`, tệp máy sinh)
  chỉ có ba tệp của làn thu, và `pipeline/test-nua.json` chỉ thêm đúng một dòng là tệp test mới.
- AC-9: Given tệp `nhat-ky.jsonl` của phép đo thật, ghim bằng băm, When tính lại độ trễ đăng → thu độc lập với `tinhBaoCao`, Then số tin,
  p50, p90 khớp `tinhBaoCao` và khớp báo cáo chính thức. p50 ≤ 30′, p90 ≤ 2 giờ. Đối chứng: cộng 3 giờ vào giờ lấy thì vượt
  thước. Số lần bị chặn đếm thẳng từ `nhat-ky.jsonl` phải bằng 0. Tỉ lệ bắt được 1.072/1.072 CHÉP từ báo cáo chính thức của làn thu,
  không tính lại độc lập (xem Notes).

## Coverage

Bảng phủ ca đầy đủ nằm trong design doc, mục «Bảng phủ ca». Số trong bảng đếm từ phép đo thật, probe E6 in lại mỗi lượt chấm.
Bỏ quét `morphological-scan`, xem dòng `descope` trong sổ: không gian ca là những nhánh của mã đã viết xong, nên liệt theo trục
dữ liệu thật thì sát hơn quét ý tưởng.

- Trục luật dừng: trang-toan-da-co · toi-da-trang · het-trang · gap-da-co → AC-1, AC-6
- Trục phản hồi nguồn: 200 · 403/429/HTML · lỗi mạng/5xx · trần lời gọi → AC-2
- Trục cổng và DB: cổng đóng · DB lỗi · DB chỉ đọc → AC-3, AC-4
- Trục cách ly của test: mạng · HOME · tên DB → AC-4, AC-5
- Trục snapshot: khuôn DATA-CONTRACT · không ghi đè · bộ nạp đọc được trên dữ liệu thật → AC-4 (ca nguồn giả), AC-6
- Trục bộ test và phạm vi: chia nửa · tệp đổi → AC-7, AC-8
- Trục số đo: độ trễ · bắt được · bị chặn → AC-9
- [GIẢ ĐỊNH] Nhánh bị chặn, lỗi mạng, DB lỗi chưa từng chạy với nguồn thật (0 lần trong 24 giờ). Các nhánh này chỉ được phủ
  bằng ca nguồn giả.

## Đường đo

Không có `opportunity.md`: hàng được GS mở trong đợt. Thước của Mạnh (24/11: p50 ≤ 30′, p90 ≤ 2 giờ) được đo trên phép đo thật
ở AC-9. Thước trên Invest (đăng → Invest) chỉ đo được sau hai hàng sau là lịch chạy và bước nạp, nên không thuộc hồ sơ này.

## Out of scope

- Chạy theo lịch 3–5 phút, plist launchd, bộ hẹn giờ: hàng sau. Plist mới cần lời riêng của Mạnh.
- Bước chọn snapshot để nạp, tránh nạp trùng với lượt quét đủ: hàng phía transform. Trước hàng đó, bộ thu chỉ chạy tay với
  `--goc` ngoài `collector/snapshots/`, vì `scripts/chotot-daily.sh` nạp snapshot có tên mới nhất của mỗi thành phố.
- Nạp 231 snapshot của phép đo vào `stg_chotot_ads`.
- Mở rộng sang vùng và mục khác ngoài cặp đã đo.
- Mọi sửa logic thu: làn ZCode, trả về qua `tin MỞ LẠI`.

## Notes

- Trên CI, 5 ca DB của tệp test tự bỏ qua vì không có `DATABASE_URL`, giống mọi tệp test pipeline cần DB. AC-4 chỉ đo ở lượt
  chấm trên máy.
- AC-6 và AC-9 đọc thư mục phép đo của làn thu bằng đường `$S06_DUOI_DO`; vắng thì dùng mặc định là worktree của ZT. Phép đo
  được ghim bằng băm sha256 của `nhat-ky.jsonl`, `bao-cao-chinh-thuc.json` và danh sách 231 manifest, ghi trong
  `probes/phu-ca.mjs`. Thư mục mất thì hai eval thoát 2 («KHONG CO PHEP DO»). Dữ liệu đổi thì hai eval thoát 3 («PHEP DO DA
  DOI»). Không trường hợp nào ra xanh giả.
- Ba con số của phép đo là ba tập khác nhau. 1.215 là mọi mục máy chưa có lúc thu, đã ghi vào snapshot. 1.180 là phần trong số
  đó có giờ đăng gốc nằm trong cửa sổ đo, dùng để tính độ trễ. 35 mục còn lại đăng trước cửa sổ: 18 tin cũ được đẩy lại và 17
  tin tồn đọng lúc bắt đầu đo. 1.072 là số tin mới của lượt quét đủ cùng ngày (1.386 mã, trừ 314 mã máy đã biết), và đuôi thấy
  đủ cả 1.072.
- Giới hạn: tỉ lệ bắt được không được tính lại độc lập trong hồ sơ này. Muốn tính lại cần tập mã của lượt quét đủ đóng băng tại
  thời điểm đo, mà tập này đọc từ `stg_chotot_ads` thì đổi theo các lượt quét sau. LL đã soát số này ở vòng `claudedp-2411-6`.
