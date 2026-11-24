# Review findings: luot-hang-dem-khong-tu-ap-truoc-doc-lap (round 1)

## Trong hợp đồng

- **Số chuyenThe chỉ in ở nhánh DRY, nơi nó luôn bằng 0; lượt ghi thật không in số này**
  AC: AC-6
  file: `agent/scripts/enrich-run.ts:95`
  severity: medium
  source: conventions
  detail: runEnrich chỉ cộng chuyenThe trong pha ghi (`if (opts.dry) continue;` đứng trước), và run.ts tự ghi chú «chế độ dry: 0». Thế mà enrich-run.ts chỉ in `(trong đó có căn cứ chờ phiếu độc lập: ${chuyenThe})` trong nhánh `if (DRY)`, nên ở chế độ chạy thử số này luôn ra 0. Lượt ghi thật đi qua `dongTongKet(dem)` (tong-ket.ts), hàm này không có chuyenThe, nên log hằng đêm không bao giờ hiện số đề xuất bị chuyển sang thẻ. E6 (evals.yaml) đòi số này «bằng số tổng kết lượt in», nhưng test chỉ so `r.chuyenThe` trả về từ hàm, không so dòng log mà lượt đêm in ra. Cách sửa: ở chế độ dry tính số từ routed (đếm r.trungLuat), còn ở chế độ ghi thì đưa chuyenThe vào DemLuot/dongTongKet.

- **The «có căn cứ chờ phiếu độc lập» count never prints in write mode and always prints 0 in dry mode (AC-6 not met)**
  AC: AC-6
  file: `agent/scripts/enrich-run.ts:95`
  severity: medium
  source: bugs
  detail: runEnrich only increments `chuyenThe` inside `ghi()` (agent/src/enrich/run.ts:353,377). That pass is skipped in dry mode (`if (opts.dry) continue;` at run.ts:315), so in dry mode `chuyenThe` is always 0. enrich-run.ts only prints `chuyenThe` in the DRY branch: `chờ duyệt: ${summary.review} (trong đó có căn cứ chờ phiếu độc lập: ${chuyenThe})`. So dry runs always show 0, even when `routed` holds many proposals converted to review. In write mode, which is the real nightly run, the script only prints `dongTongKet(dem)` (agent/src/enrich/tong-ket.ts:44-56), and that output has no `chuyenThe` field. The value is returned but thrown away. AC-6 requires the run summary to print the number of «có căn cứ chờ phiếu độc lập» proposals moved to the card, and this output never shows it. Test E6 (agent/tests/enrich-luot-dem-khong-tu-ap.test.ts:119) only compares the return value `r.chuyenThe`, not the printed summary, so the gap passes unnoticed. Fix: add `chuyenThe` to the write-mode summary (via `dem` or a separate line after `dongTongKet`). For dry mode, count from `routed`, e.g. the number of rows with `trungLuat`.

- **Hình dạng 1 (đo giá trị trong thay vì đầu ra in): E6 so trung_luat với r.chuyenThe trả về, không với tổng kết lượt in ra**
  AC: AC-6
  file: `agent/tests/enrich-luot-dem-khong-tu-ap.test.ts:436`
  severity: high
  source: measurement
  detail: evals.yaml E6 hứa «số đề xuất evidence ? 'trung_luat' > 0 và bằng số tổng kết lượt in». Assert `assert.equal(d.chuyen, r.chuyenThe, ...)` đọc trường trả về của runEnrich, không đọc dòng enrich-run.ts in ra. Trong agent/scripts/enrich-run.ts, chuyenThe chỉ được in ở nhánh DRY. Ở nhánh đó run.ts ghi rõ «chế độ dry: 0» vì `if (opts.dry) continue` chạy trước khi đếm, nên dòng in luôn ra 0. Nhánh ghi thật (lượt hằng đêm) chỉ in dongTongKet(dem) (agent/src/enrich/tong-ket.ts:44-56), mà hàm này không có chuyenThe. Vì vậy tổng kết in ra không bao giờ hiện đúng số đề xuất trùng luật, còn test vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kỳ vọng E1 trong evals.yaml không khớp với test thực sự kiểm**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả một ca thử hơi khác với ca thật đã chạy, nên người đọc hồ sơ có thể hiểu sai điều đã được kiểm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ trong hồ sơ, không mất dữ liệu hay đổi hành vi cho người dùng, sửa lại bất cứ lúc nào rất rẻ.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): E2 tiêm thẳng mảng buildings, không cài asset_nodes rồi để runEnrich tự đọc**
  Người dùng thấy gì: Phép thử việc nhận ra tên toà dùng danh sách toà viết sẵn thay vì đọc từ danh bạ thật, nên chưa chứng minh được đoạn đọc danh bạ. Người dùng chưa thấy lỗi nào.
  Căn cứ: Không có hậu quả đã thấy cho người dùng, chỉ là bằng chứng chưa trọn; có thể bổ sung ca thử sau với chi phí nhỏ.
  file: `agent/tests/enrich-luot-dem-khong-tu-ap.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (lời hứa là quan hệ nhưng không assert): E6 hứa «thẻ chờ tăng đúng số tin có đề xuất trùng luật» mà không đếm thẻ**
  Người dùng thấy gì: Phép thử chưa đếm số thẻ chờ duyệt tăng thêm sau mỗi lượt đêm, nên nếu thẻ bị thiếu thì chưa bắt được ở bước thử này.
  Căn cứ: Việc không tự áp đã được kiểm, chỉ phần đếm thẻ còn thiếu; nếu sai thì đội duyệt thấy ngay trên màn chờ duyệt và bổ sung phép thử rẻ.
  file: `agent/tests/enrich-luot-dem-khong-tu-ap.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): AC-5 xác nhận lượt hằng đêm bằng grep chuỗi trong enrich-run.ts**
  Người dùng thấy gì: Việc xác nhận lượt đêm đã bật chế độ chặn chỉ dựa vào đọc chữ trong tệp chạy, chưa chạy thật đường vào của lượt đêm.
  Căn cứ: Khai báo hiện đúng nên người dùng không bị ảnh hưởng; đo thật sẽ có sau lượt đêm đầu tiên bằng câu đo trong hợp đồng.
  file: `_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/evals.yaml, _acceptance/luot-hang-dem-khong-tu-ap-truoc-doc-lap/probes/chay.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
