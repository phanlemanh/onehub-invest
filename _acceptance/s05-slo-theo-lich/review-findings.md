# Review findings: s05-slo-theo-lich (round 1)

## Trong hợp đồng

- **Hai tài liệu vận hành vẫn ghi S05 ≤ 12 giờ, và bộ quét S5-AC-6 không bắt được dạng viết này**
  AC: AC-6
  file: `scripts/check-freshness.mjs:12`
  severity: low
  source: bugs
  detail: Diff đổi SLO_HOURS.S05 từ 12 lên 96 ở scripts/lib/freshness.mjs và app/src/lib/freshness.ts, nhưng còn hai chỗ chưa đổi theo. (1) Khối chú thích đầu scripts/check-freshness.mjs dòng 12 vẫn ghi `S05 ≤ 12 giờ`. (2) .claude/skills/ops-check/SKILL.md dòng 12 vẫn ghi `S05 ≤ 12 giờ`. Skill /ops-check là tài liệu agent đọc để diễn giải đầu ra của check-freshness, nên một S05 tuổi 13–96 giờ đang 'fresh' theo CLI sẽ bị coi là lệch so với tài liệu. Bộ quét AC-6 trong scripts/s05-slo.test.mjs dùng mẫu /S05["']?\s*:\s*\d+/ nên chỉ bắt dạng `S05: n` và bỏ qua dạng `S05 ≤ 12 giờ`. Bộ quét cũng không đi vào .claude/ hay tệp .md. Vì thế ca S5-AC-6 vẫn xanh dù khẳng định 'không nơi thứ ba ghi SLO S05' của AC-6 sai trên thực tế. Cách sửa: đổi cả hai dòng thành `S05 ≤ 96 giờ` (4 ngày, lịch 2 lượt/tuần). Có thể nới mẫu quét thêm `S05\s*≤\s*\d+` và quét thêm tệp .md dưới scripts/ và .claude/skills/.
  rationale: AC-6 đòi không còn nơi nào trong cây scripts ghi SLO S05 là 12, nhưng chú thích đầu scripts/check-freshness.mjs vẫn ghi S05 ≤ 12 giờ.

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho quan hệ): SL-AC-6 tìm «4 ngày» trong HTML nhưng chuỗi này đã có sẵn từ tuổi S02, không chứng minh SLO S05 = 96**
  AC: AC-3
  file: `app/tests/slo-mot-nguon.test.tsx:260`
  severity: medium
  source: measurement
  detail: Diff đổi `"12 giờ"` thành `"4 ngày"` trong `for (const want of ["4 ngày", "3 ngày", "35 ngày", "8 ngày"]) assert.ok(h.includes(want))`. Trước đây «12 giờ» chỉ có thể đến từ SLO của S05. Giờ thì base() có `airdna: [{ ..., at: ago(100.5) }]`, tức S02 ở hàng EXPECTED_BASE có tuổi 100 giờ. Cột «Tuổi» ở objectives-grid.tsx:98 và feeds-grid.tsx:78 hiện `fmtAge(100)` = «4 ngày» trên cả /ops lẫn /ops/collections. Vì vậy `h.includes("4 ngày")` vẫn xanh dù hàng S05 hiện SLO là «12 giờ» hay bất kỳ giá trị nào khác. Lời hứa ở AC-3 (contract: «SLO hiện là «4 ngày»») là một quan hệ: ô SLO của hàng S05 phải là «4 ngày». Assert hiện tại chỉ kiểm chuỗi có mặt đâu đó trong trang, không gắn với hàng S05 hay cột SLO.
  rationale: AC-3 yêu cầu ô SLO của hàng S05 hiện «4 ngày», nhưng assert chỉ tìm chuỗi này ở đâu đó trong trang và đã xanh nhờ tuổi S02, nên không chứng minh được điều AC-3 hứa.

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ bắt một dạng cú pháp): S5-AC-6 bỏ sót «S05 ≤ 12 giờ» ngay trong scripts/check-freshness.mjs**
  AC: AC-6
  file: `scripts/s05-slo.test.mjs:110`
  severity: medium
  source: measurement
  detail: S5-AC-6 tuyên bố «chỉ hai bản chép ghi SLO S05 (= 96)». Contract AC-6 nói «không nơi nào ghi `S05: 12`» trên toàn cây app/scripts/pipeline/data-api/agent. Nhưng bộ quét chỉ dùng một mẫu `const MAU = /S05["']?\s*:\s*\d+/g`, tức chỉ bắt dạng khoá-đối-tượng `S05: N`. Đối chứng dòng 145 (`"const X = { S05: 12 };"`) cũng chỉ thử lại đúng dạng đó, nên không chứng minh được độ phủ cho các cách viết khác như `S05 ≤ N giờ`, tuple `["S05", N]` hay SQL `WHEN 'S05' THEN N`. Trong cây đang kiểm đã có một phản ví dụ cụ thể: scripts/check-freshness.mjs:12 (tệp không phải test, nằm trong gốc quét `scripts`) vẫn ghi ` *   S05 ≤ 12 giờ   airbnb_snapshots.collected_at ...`. Đây là nơi thứ ba ghi SLO S05, với giá trị cũ 12, mà ca vẫn xanh. Đó là một danh sách các dạng ghi viết sẵn chỉ có một phần tử, không phải ma trận phủ cả lớp.
  rationale: AC-6 tuyên bố quét cả cây và không còn nơi ghi SLO S05 cũ, nhưng bộ quét chỉ bắt dạng S05: N và bỏ sót phản ví dụ thật trong scripts/check-freshness.mjs.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E5 hứa «không ca nào bị bỏ qua vì thiếu DB» nhưng executor vẫn exit 0 khi DB không tới**
  Người dùng thấy gì: Nếu máy chấm không có cơ sở dữ liệu local, phép đo độ tươi vẫn báo xanh dù các ca quanh mốc 96/97 giờ không chạy. Người ký có thể tin nhầm là đã kiểm đủ.
  Căn cứ: Chỉ xảy ra khi máy chấm thiếu DB, không ảnh hưởng người dùng cuối, và chạy lại trên máy có DB là thấy ngay; ghi lại điều kiện chấm là đủ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Chú thích lịch trong test ghi sai thứ: 4/11/2026 là thứ Tư, không phải thứ Ba**
  Người dùng thấy gì: Một dòng ghi chú trong phép đo ghi sai thứ trong tuần của ngày mốc; kết quả đo và những gì người dùng thấy trên màn hình không đổi.
  Căn cứ: Không ảnh hưởng kết quả đo hay người dùng; chỉ có thể gây nhầm nhẹ cho người đọc sau này và sửa lúc nào cũng được, nên chấp nhận và ghi vết.
  file: `scripts/s05-slo.test.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, scripts/check-freshness.mjs, app/tests/slo-mot-nguon.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
