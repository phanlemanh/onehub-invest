## Trong hợp đồng

- **Hình dạng 4 (âm-tính-một-mình): E6 'DINH DANH 0' cho tên người gửi/tên nhóm/tên nguồn không có đối chứng dương rằng danh sách tên đọc từ DB khác rỗng; đối chứng đỏ tự chèn tên vào danh sách**
  AC: AC-6
  file: `_acceptance/tap-nhan-mau-ocp1/probes/db.mjs:157`
  severity: medium
  source: measurement
  detail: Dòng 143-146 dựng `nguoi`, `nhom`, `nguon` từ stg/source_registry, rồi dòng 154 chỉ kiểm `loi.length === 0`. Không có assert nào rằng `nguoi.length`, `nhom.length`, `nguon.length` > 0; số đếm chỉ được in ra. Nếu sender_name hay group_name của lát đều null, hoặc real_name rỗng, thì `ten()` lọc ra danh sách rỗng và kết quả xanh 'DINH DANH 0' đúng một cách vô nghĩa. Đối chứng đỏ ở dòng 157-158 cũng không bắt được trường hợp này: `mot = nguoi.map(chuan).find(...) ?? "nguyen van thu"` rơi về một tên bịa, rồi truyền `nguoi: [...nguoi, mot]`. Tức là đối chứng tự nhét chính cái tên nó sẽ quét vào danh sách so, nên chỉ chứng được hàm `ranhGioi`, không chứng được danh sách thật đã nạp đủ. Hợp đồng E6 yêu cầu chèn 'một tên người gửi thật'. Tên nhóm (TEN NHOM LOT) và tên nguồn (TEN NGUON LOT) thì hoàn toàn không có đối chứng nào, cả đỏ lẫn danh sách khác rỗng.
  lý do vào hợp đồng: AC-6 đòi quét tên người gửi và tên nhóm đọc từ DB local và tên nguồn thật; phép kiểm có thể xanh khi danh sách tên rỗng, nên chưa chứng được AC-6.

- **Hình dạng 4 (âm-tính-một-mình): E8b 'CANONICAL 0' không có đối chứng dương; đối chứng chỉ thay bảng stg, nhánh canonical không bao giờ được thấy bắt một dòng mẫu**
  AC: AC-8
  file: `_acceptance/tap-nhan-mau-ocp1/probes/db.mjs:164`
  severity: low
  source: measurement
  detail: `demMau` (dòng 109-115) chạy hai câu đếm. Câu thứ nhất đếm trên `sale_offer_records` với `originating_system_key LIKE 'mau-%' OR EXISTS(unnest(post_ids) ... LIKE 'mau-%')`, câu thứ hai đếm trên bảng `stg`. Đối chứng ở dòng 164 chỉ thay tham số `stg` bằng bảng VALUES và chỉ kiểm `dc.stg === 1`. Câu canonical vẫn chạy trên bảng thật và `dc.canonical` bị bỏ qua. Vì vậy vị từ canonical (cách ép `p::text`, tên cột `post_ids`/`originating_system_key`) chưa từng được chứng là bắt được một dòng 'mau-…'. Kết quả 'CANONICAL 0' ở dòng 163 là phép đo âm tính đứng một mình.
  lý do vào hợp đồng: AC-8 đòi 0 dòng mẫu trong bảng canonical; câu đếm canonical chưa từng được chứng là bắt được một dòng «mau-», nên kết quả 0 là phép đo âm tính đứng một mình.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Định dạng JSONL tập mẫu (giao diện cho PL9) dùng khoá tiếng Việt, trái quy ước đặt tên «Code, API, tên bảng/cột, types: tiếng Anh»**
  Người dùng thấy gì: Tệp tập mẫu dùng vài tên trường viết tiếng Việt không dấu thay vì tiếng Anh. Người dùng cuối và người vận hành không thấy gì khác, chỉ lệch quy ước đặt tên nội bộ.
  Căn cứ: Không ảnh hưởng ai đang dùng, không mất hay lộ dữ liệu. Đổi tên thì phải sinh lại tệp kiểm và băm đã duyệt, tốn công hơn lợi ích.
  file: `pipeline/lib/tap-mau.mjs`
  severity: low
  Đề xuất: wont-fix

- **Mô tả E8b trong evals.yaml vẫn ghi đối chứng đỏ là «chèn dòng stg_zalo_posts trong giao dịch ROLLBACK», nhưng probe làm khác**
  Người dùng thấy gì: Lời mô tả của phép kiểm «không có dòng mẫu trong DB» ghi một cách đối chứng, nhưng phép kiểm thật làm cách khác. Người đọc hồ sơ có thể hiểu sai phép kiểm đã làm gì, còn kết quả kiểm không đổi.
  Căn cứ: Chỉ là chỗ ghi chép chưa khớp, không ảnh hưởng dữ liệu hay người dùng, và lý do đã có trong sổ quyết định. Ghi lại là đủ, sửa chữ lúc nào cũng rẻ.
  file: `_acceptance/tap-nhan-mau-ocp1/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
