# Review findings: s17-bo-thu-mo-rong (round 1)

## Trong hợp đồng

- **Chặn địa chỉ nội bộ qua DNS còn hở kiểu DNS-rebinding, mà AC-5 vẫn khẳng định «không gửi lời nào tới đó»**
  AC: AC-5
  file: `collector/src/collectors/s17-thua-dinh-gia/anh.ts:396`
  severity: low
  source: conventions
  detail: Với máy chủ ngoài (URL lấy từ nội dung dự án, tức đầu vào không tin cậy ở ranh giới hệ thống), taiAnh giải tên bằng dns.lookup và kiểm diaChiNoiBo. Sau đó nó gọi fetch(hienTai) với tên gốc, nên fetch tự giải tên lần hai. Chính chú thích ở dòng 382–384 đã nhận khoảng hở này: «tên đổi bản ghi giữa lúc giải và lúc kết nối… để đóng hẳn cần ghim địa chỉ ở tầng kết nối». Nghĩa là một máy chủ ngoài có TTL bằng 0 vẫn có thể làm bộ thu gửi lời tới dải riêng hoặc 169.254.169.254. AC-5 trong contract.md ghi «URL ảnh trỏ địa chỉ nội bộ (trực tiếp, qua DNS…) … không gửi lời nào tới đó», như vậy là khẳng định mạnh hơn mức code bảo đảm. Hồ sơ nên ghi rõ giới hạn này, hoặc ghim IP đã kiểm ở tầng kết nối (dispatcher hay lookup tuỳ biến của undici).
  rationale: AC-5 nêu rõ địa chỉ nội bộ qua DNS thì không gửi lời nào tới; khoảng hở rebinding làm khẳng định này không đứng vững.

- **lietKeToa: một trang lỗi tạm ở lượt quét thứ hai trở đi vẫn để lại các trang của lượt trước trong bộ đệm, và chúng bị ghi ra đĩa**
  AC: AC-6
  file: `collector/src/collectors/s17-thua-dinh-gia/pha-can-ho.ts:131`
  severity: medium
  source: bugs
  detail: Hợp đồng của hàm ghi rõ: «Một trang lỗi tạm → trả `loi`, không ghi trang nào của toà (ghi thiếu trang là ghi dữ liệu sai)». Tuy vậy, các item `can_ho_list` của lượt 1 đã được `o.writer.add` ngay trong vòng lặp. Đến lượt `lots >= 2`, nếu trang 0 (khối `catch` quanh getJson) hoặc một trang trong getJsonMany lỗi tạm, hàm trả `{ codes: [], loi }` mà không bỏ các item đã đẩy vào bộ đệm của BatchWriter. Trong `apartmentsAll`, nhánh `r.loi` chỉ `continue`. Lần `chot(o)` kế tiếp (toà khác, lô chi tiết căn) hoặc tự chốt khi đủ `maxItems` sẽ đưa các trang dở ấy vào snapshot, trong khi tiến độ không ghi toà này và cũng không có `can_ho_toa`. Kết quả: kho có các trang liệt kê mồ côi của một toà bị coi là chưa liệt kê, đúng loại «ghi thiếu trang» mà hợp đồng cấm. Lượt sau lại ghi chồng thêm một bộ trang nữa. Cách sửa: gom các item trang vào mảng cục bộ, chỉ `writer.add` sau khi mọi lượt quét của toà đã xong và không có lỗi.
  rationale: AC-6 đòi ghi bền đúng và không để trạng thái nói đã làm việc chưa xuống đĩa; trang liệt kê dở bị ghi mồ côi trái trục ghi bền.

- **RunStopped do vận chuyển ném ra (page-origin) không được chốt vào client.stopped, nên các đợt sau vẫn tiếp tục gửi**
  AC: AC-2
  file: `collector/src/collectors/s17-thua-dinh-gia/client.ts:364`
  severity: low
  source: bugs
  detail: Trong `getJsonMany`, nhánh `goc instanceof RunStopped` chỉ gán lỗi cho từng lời, còn `sendWithRetry` thì `throw e`. Cả hai chỗ đều không gọi `this.stop(...)`, nên `this.stopped` vẫn là null. Hệ quả là các đợt còn lại trong cùng lời gọi getJsonMany vẫn đi qua `assertRunning` và `waitBefore`, tức là ngủ paceMs cho từng lời, rồi gửi tiếp qua `transportMany`. Mỗi đợt như vậy lại nhận -2 từ IN_PAGE_START. Ví dụ `lietKeToa` có tới 2000 trang: lượt mất nhiều phút mới dừng, `calls` bị đếm vống, và mỗi đợt vẫn chạy thêm một lần evaluate trong trang lạ. Điều này trái với bất biến ghi ở đầu tệp: «Đã dừng thì mọi lời sau bị từ chối ngay». Cách sửa: khi gặp RunStopped từ vận chuyển thì gán `this.stopped ??= e`.
  rationale: AC-2 đòi dừng cả lượt, đợt sau không gửi; lỗi này làm các đợt sau vẫn gửi.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca «bị chặn hai lần» tự ghi blockedRuns: 2 thay vì để writer cộng dồn từ hai lượt bị chặn thật**
  AC: AC-2
  file: `collector/src/test/s17-thua-dinh-gia-exec.test.ts:296`
  severity: medium
  source: measurement
  detail: Ca «tăng tốc: bị chặn hai lần thì dừng hẳn…» (E2, AC-2) viết tay `writeFile(statePath, JSON.stringify({ ...emptyState(), blockedRuns: 2 }))` đúng khuôn mà runner.ts:222 đọc (`state.blockedRuns >= 2`). Không ca nào đi đường writer từ 1 lên 2. Ca lượt một (dòng 280) chỉ đo 0→1; grep cả 13 tệp test chỉ ra các giá trị blockedRuns 0 và 1 do writer sinh. Ví dụ đột biến runner.ts:341 `state.blockedRuns = (state.blockedRuns ?? 0) + 1` thành `state.blockedRuns = 1`: ca lượt một vẫn ra 1, ca hai lần vẫn đọc số 2 viết tay, nên cả bộ vẫn xanh. Lúc chạy thật, bộ thu sẽ không bao giờ tới «blocked-twice» mà cứ chạy tiếp ở nhịp cũ. Đột biến bo-dung-han-khi-chan-hai-lan của dot-bien.sh chỉ nâng ngưỡng 2 lên 99, không phủ đường cộng dồn này. Muốn kín thì cần một ca round-trip: lượt 1 bị 403 → lượt 2 một luồng nhịp cũ bị 403 lần nữa → state ghi 2 → lượt 3 dừng «blocked-twice».
  rationale: AC-2 đòi bị chặn hai lần thì dừng hẳn; ca test không đo đường cộng dồn thật nên lời hứa này chưa được chứng minh.

- **Hình dạng 3 (assert «có mặt» thay cho quan hệ): pha ảnh chỉ kiểm sha256 trong meta.mediaFiles và manifest đúng khuôn 64 ký tự hex, không so với băm của byte ảnh đã ghi**
  AC: AC-6
  file: `collector/src/test/s17-thua-dinh-gia-mo-rong.test.ts:289`
  severity: low
  source: measurement
  detail: Ca «pha ảnh: tải ảnh gốc vào snapshot dưới media/…» dùng `soTep.every(f => f.bytes > 0 && /^[0-9a-f]{64}$/.test(f.sha256))`, tức chỉ kiểm có một chuỗi hex 64 ký tự và số byte dương. Lời hứa ở AC-6 là quan hệ «manifest mang sha256 từng tệp», nghĩa là băm phải khớp nội dung tệp trên đĩa. Helper docSnapshot (dòng 240–245) chỉ đọc tệp items-, không băm lại tệp media/. Trường meta.mediaFiles[].sha256 do pha-anh.ts:429 tự tính (`sha256Cua(x.bytes)`) thì không ca nào so với byte của tệp media tương ứng: ca này chỉ assert file và url của mediaFiles. Phía manifest có ca addWithFiles (dòng 34–51) so với sha độc lập qua SnapshotWriter nên đã phủ. Trường băm trong item mà bên đọc dùng để đối chiếu thì chưa có phép đo quan hệ nào.
  rationale: AC-6 hứa manifest mang sha256 từng tệp; test chỉ kiểm khuôn chuỗi chứ không kiểm khớp nội dung tệp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ thu ghi snapshot schemaVersion 17/18 (kind mới anh_du_an, tệp media/*) trong khi DATA-CONTRACT trên main không khai hai số này**
  Người dùng thấy gì: Bộ thu mới có thể ghi dữ liệu theo số phiên bản mà tài liệu hợp đồng dữ liệu chưa khai, nên nếu gộp sai thứ tự thì phía nạp dữ liệu có thể không hiểu các bản ghi mới.
  Căn cứ: Chỉ là lệch thứ tự gộp, không mất hay lộ dữ liệu, và đã có nhánh hợp đồng riêng được giao để gộp trước hoặc cùng lúc.
  file: `collector/src/collectors/s17-thua-dinh-gia/store.ts`
  severity: medium
  Đề xuất: known-limits

- **Pha ảnh: bộ đếm byte «đang tải» dùng chung biến daNhan cho mọi luồng, nên số báo sai khi chạy song song**
  Người dùng thấy gì: Dòng nhật ký báo số byte ảnh đang tải có thể sai khi tải nhiều ảnh cùng lúc, nên người vận hành khó phân biệt đang tải với bị treo. Dữ liệu thu được không bị ảnh hưởng.
  Căn cứ: Chỉ sai con số trong nhật ký, không mất hay lộ dữ liệu, người vận hành vẫn tự kiểm tra bằng cách khác được và sửa sau cũng không đắt.
  file: `collector/src/collectors/s17-thua-dinh-gia/pha-anh.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
