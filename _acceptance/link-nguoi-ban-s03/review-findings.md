# Review findings: link-nguoi-ban-s03 (round 6)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Không job đêm nào nạp snapshot __s03-ho-so__; cơ chế «không đánh dấu khi thiếu 080» không khớp con trỏ state của chuỗi nạp**
  Người dùng thấy gì: Kết quả tra hồ sơ người bán được thu về nhưng không có lịch chạy đêm nào đưa vào danh bạ, nên link hồ sơ có thể không bao giờ xuất hiện cho người bán.
  Căn cứ: Chỉ ảnh hưởng khi lượt tra thật đã chạy; dữ liệu thu về vẫn còn nguyên nên nạp bù được sau, và việc thêm lịch nạp là một hạng mục riêng nằm ở làn thu thập.
  file: `scripts/{S03}-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Endpoint /s03-ho-so chỉ kiểm lay_luc bằng Date.parse, nhận cả chuỗi không phải ISO và mốc tương lai**
  Người dùng thấy gì: Nếu bộ tra gửi một mốc thời gian sai khuôn, lần nạp hồ sơ có thể hỏng và các hồ sơ phía sau bị chặn lại.
  Căn cứ: Chỉ bộ tra của chính hệ thống gửi dữ liệu này nên khó xảy ra, nhưng một dòng hỏng sẽ chặn cả lượt nạp và không tự gỡ được; sửa rẻ nên nên ghi lại để làm sớm.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: known-limits

- **Chú thích coBangHoSo nói ném lỗi nhưng code nuốt lỗi; tên bảng stg hồ sơ khai ở hai chỗ, mỗi chỗ dò 080 một kiểu**
  Người dùng thấy gì: Người đọc mã có thể hiểu sai cách hệ thống xử lý lỗi khi kiểm tra bảng hồ sơ, và hai nơi có thể lệch nhau về việc đã áp migration hay chưa.
  Căn cứ: Không làm mất hay lộ dữ liệu cho người dùng, chỉ gây nhầm cho người bảo trì; dọn lúc nào cũng được với chi phí thấp.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: known-limits

- **JSDoc của handle() bị treo phía trên handleHoSo**
  Người dùng thấy gì: Chú thích của một hàm nằm nhầm chỗ, người đọc mã có thể hiểu nhầm; người dùng không thấy gì.
  Căn cứ: Không có hậu quả nào với người dùng hay dữ liệu, sửa hay không đều không đổi hành vi.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: wont-fix

- **Không job đêm nào nạp snapshot s03-ho-so: stg_s03_ho_so luôn rỗng, ghiLienLacHoSo không bao giờ ghi gì**
  Người dùng thấy gì: Bước ghi link hồ sơ cho người bán chạy mỗi đêm nhưng luôn báo không có gì để ghi, nên tính năng không đem lại link nào trên thực tế dù trông như đang hoạt động.
  Căn cứ: Tính năng mất tác dụng âm thầm nhưng không mất dữ liệu thu về; thêm lịch nạp là việc riêng, cần làm trước khi chạy lượt thử thật.
  file: `pipeline/import-{S01}.mjs`
  severity: high
  Đề xuất: new-contract

- **«Không đánh dấu snapshot hồ sơ đã nạp» khi thiếu 080 là cơ chế vô hiệu: dấu thật là con trỏ state, lối ra 0 làm state nhảy qua snapshot**
  Người dùng thấy gì: Nếu sau này nối việc nạp hồ sơ vào job đêm khi DB chưa có migration, các hồ sơ thu trong thời gian đó có thể bị bỏ qua vĩnh viễn.
  Căn cứ: Hiện chưa xảy ra vì chưa có job nối, nhưng khi nối mà sai thứ tự thì mất dữ liệu khó nạp lại; nên xử cùng hạng mục thêm lịch nạp.
  file: `pipeline/import-{S01}.mjs`
  severity: medium
  Đề xuất: new-contract

- **coBangHoSo nuốt lỗi dò bảng thành false, trái với chính comment «không được nuốt — ném để dừng lượt»**
  Người dùng thấy gì: Khi kết nối cơ sở dữ liệu trục trặc thoáng qua đúng lúc nạp dữ liệu hồ sơ người bán, hệ thống có thể báo nhầm là chưa áp bản cập nhật và bỏ qua lượt nạp đó mà không báo lỗi. Hồ sơ của lượt đó có thể không được nạp.
  Căn cứ: Hiếm khi xảy ra (cần lỗi kết nối thoáng qua đúng lúc dò), mức độ thấp, và dữ liệu thô vẫn còn nên có thể nạp lại sau khi phát hiện; sửa sau không đắt.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: known-limits

- **Bộ tra: JSON.parse không bọc trên spool, tệp sự kiện, dấu lượt — một dòng dở làm mọi tick ném lỗi, bộ tra chết lặng**
  Người dùng thấy gì: Nếu một dòng ghi dở làm hỏng tệp theo dõi, bộ tra có thể ngừng tra hồ sơ mà không báo vì sao.
  Căn cứ: Bộ tra đứng im là hướng an toàn với kênh, không lộ hay mất dữ liệu, và người vận hành gỡ được bằng cách xoá dòng hỏng; hiếm xảy ra.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **phatLaiSpool gửi toàn bộ spool trong một POST: lô >1000 dòng (413) hay một dòng bị 422 làm spool kẹt mãi**
  Người dùng thấy gì: Nếu máy thu không nhận dữ liệu suốt nhiều ngày, hàng đợi hồ sơ có thể phình quá mức và không gửi bù được nữa.
  Căn cứ: Dữ liệu không mất mà chỉ kẹt, cần nhiều ngày gián đoạn mới xảy ra, gỡ được bằng cách chia nhỏ tay.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca E9 «lệnh đo trước-sau» chỉ kiểm có tệp tên truoc-sau, không chạy lệnh**
  Người dùng thấy gì: Phép kiểm cho lệnh đo trước và sau khi khởi động lại có thể báo xanh dù lệnh đo không hoạt động.
  Căn cứ: Người dùng không bị ảnh hưởng trực tiếp, nhưng khi triển khai thật có thể thiếu số đo; người ký nên biết phép kiểm này yếu.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn cứng tới máy tác giả): ca E9 đọc gateway.log thật ở ~/Library/Logs của máy**
  Người dùng thấy gì: Phép kiểm này chỉ chạy đúng trên máy đã có sẵn nhật ký thật, trên máy khác có thể đỏ dù mã đúng.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm kết quả kiểm khó tái lập; sửa rẻ nhưng không gấp.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo đầu vào thay vì đầu ra): «tự nối lại + handler vẫn nhận tin» assert trên chính chuỗi log mà test tự viết**
  Người dùng thấy gì: Phép kiểm việc hệ thống vẫn nhận tin sau khi bộ tra lỗi thực ra không kiểm gì thật, nên chưa có bằng chứng cho điều đó.
  Căn cứ: Rủi ro là tin nhóm có thể bị ảnh hưởng mà không ai biết, nhưng đây là thiếu bằng chứng chứ chưa phải lỗi; nên bổ sung bài kiểm thật sau.
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 + 3: E4-phu đọc monitor.ts từ cây làm việc ~/dev/openclaw và dò chữ khoiDongTuEnv trong .patch**
  Người dùng thấy gì: Phép kiểm trước khi khởi động lại có thể đọc nhầm bản mã đang làm việc thay vì bản sẽ cài, nên báo xanh giả.
  Căn cứ: Có thể để lọt bản cài sai lên hệ thống thu tin thật, nhưng còn các bước canh sau khi cài; nên ghi lại để người ký cân nhắc.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên phủ lớp nhưng thiếu phần tử): ca «còn tệp yêu cầu / lượt lớn / chặn» không dựng tệp chan.txt**
  Người dùng thấy gì: Phép kiểm trước khi khởi động lại chưa thử trường hợp còn tệp chặn, nên chưa chắc nó chặn đúng.
  Căn cứ: Thiếu một ca kiểm nhỏ, dễ bổ sung, hậu quả chỉ là có thể khởi động lại khi đang có tệp chặn.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (dò nguồn thay vì chạy) và bỏ qua mà vẫn xanh: kiểm móc watchdog bằng includes trên tệp script**
  Người dùng thấy gì: Phép kiểm xác nhận bộ canh ghi sự kiện chỉ dò chữ trong tệp nên có thể xanh dù bộ canh không thực sự ghi.
  Căn cứ: Nếu hỏng, tính năng tự dừng khi kênh phản ứng có thể không kích hoạt, nhưng đây là thiếu bằng chứng; sửa bằng ca chạy thật khi có thời gian.
  file: `collector/openclaw/tests/link-nguoi-ban/bo-canh-su-kien.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E5 chọn test bằng chuỗi '/s03-ho-so' khớp một comment, còn route HTTP không được gọi**
  Người dùng thấy gì: Phép kiểm cổng nhận hồ sơ của máy thu không đi qua đường gửi thật nên có thể xanh dù đường gửi hỏng.
  Căn cứ: Nếu đường gửi hỏng, hồ sơ rơi vào hàng đợi chứ không mất; rủi ro vừa và sửa bài kiểm khá rẻ.
  file: `scripts/link-nguoi-ban-s03/api.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ đo điểm): E5 hứa 0 canary ở năm nơi, test chỉ quét items và manifest**
  Người dùng thấy gì: Phép kiểm rằng dữ liệu cá nhân thừa không rò ra chỉ quét hai trong năm nơi nên chưa chứng minh được là không rò ở ba nơi còn lại.
  Căn cứ: Thông tin cá nhân của người bán có thể rò nếu sai, nhưng hiện chưa có dấu hiệu rò; nên bổ sung phép quét đủ nơi.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): «số dòng spool bằng số mã» chỉ được đo bằng length > 0 và toContain**
  Người dùng thấy gì: Phép kiểm rằng kết quả không mất khi máy thu không nhận chỉ kiểm có dữ liệu chứ không kiểm đủ số lượng.
  Căn cứ: Nếu thiếu dòng thì mất vài kết quả tra, nhưng tra lại được sau 30 ngày; ảnh hưởng thấp.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): E8 dựng snapshot hồ sơ chưa nạp bằng tay thay vì dùng SnapshotWriter**
  Người dùng thấy gì: Phép kiểm rằng người đã tra gần đây không bị tra lại dựa trên dữ liệu mẫu tự viết, nên nếu cách ghi thay đổi thì có thể tra lặp mà không bị phát hiện.
  Căn cứ: Hậu quả chỉ là tra lặp một số mã, không mất dữ liệu; chỉ đáng lo khi định dạng ghi đổi sau này.
  file: `scripts/link-nguoi-ban-s03/chon.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo khuôn bên đọc): itest bộ nạp tự CREATE TABLE stg_s03_ho_so thay vì áp migration 080**
  Người dùng thấy gì: Phép kiểm nạp hồ sơ chạy trên bảng tự dựng, nên nếu bảng thật khác thì có thể lỗi lúc áp thật mà bài kiểm không báo.
  Căn cứ: Lỗi sẽ lộ ngay lúc áp thật trên bản sao lưu và sửa được trước khi ảnh hưởng người dùng; ảnh hưởng thấp.
  file: `pipeline/tests/ho-so-nap.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (bất đẳng thức thay cho quan hệ): schemaVersion hồ sơ assert ≥ 7, lời hứa là «số sau ma-album-s03»**
  Người dùng thấy gì: Phép kiểm số phiên bản dữ liệu chấp nhận cả số lớn hơn mong đợi, nhưng số hiện tại đang đúng.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ lỏng về mặt kiểm; chi phí sửa không đáng so với rủi ro.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
