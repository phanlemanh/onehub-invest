# Review findings: so-nguon-kho-khai-bao (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Migration 122 nói «áp lại không ghi đè giá trị người vận hành đổi», nhưng bước dừng S11 và các ô NULL có nghĩa vẫn bị ghi đè**
  Người dùng thấy gì: Nếu người vận hành tự bật lại một nguồn đã tạm dừng hoặc cố ý bỏ trống nhịp rồi áp lại bản cập nhật sổ nguồn, các lựa chọn đó bị đặt lại về giá trị ban đầu. Hiện chỉ có lượt áp hai lần liền nhau theo hồ sơ nên chưa ai gặp.
  Căn cứ: Chưa gây hại vì chỉ áp lại ngay sau lần đầu, nên chỉ cần ghi rõ giới hạn; sửa sau rẻ và người vận hành đặt lại được bằng tay.
  file: `db/migrations/122_source_registry_family_cadence.sql`
  severity: low
  Đề xuất: known-limits

- **Ghi chú ở overview-tiles vẫn trỏ tới SLO_HOURS, hằng số này đã bị gỡ**
  Người dùng thấy gì: Một dòng ghi chú trong mã còn nhắc tới nơi lấy nhịp đã cũ, người đọc mã có thể hiểu nhầm. Người dùng không thấy gì thay đổi trên màn.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ gây hiểu nhầm nhẹ cho người đọc mã; sửa sau rất rẻ khi chạm tệp này.
  file: `app/src/components/ops/overview/overview-tiles.tsx`
  severity: low
  Đề xuất: wont-fix

- **122 cho real_name được NULL, nhưng kiểu RegistryRow ở trang /ops/sources vẫn khai real_name: string**
  Người dùng thấy gì: Trong khoảng sau khi áp bản cập nhật mà chưa điền tên thật cho hai nguồn mới, trang danh sách nguồn có thể hiện ô tên trống không có nhãn giải thích.
  Căn cứ: Chỉ là ô trống trong thời gian ngắn và tự hết khi điền tên; không mất hay lộ dữ liệu, sửa sau rẻ.
  file: `app/src/components/ops/sources/registry-table.tsx`
  severity: low
  Đề xuất: known-limits

- **122 bỏ NOT NULL của real_name và chèn S09/S17 với real_name NULL; scripts/can-gia-tot-ba-vai.mjs gọi .toLowerCase() trên NULL nên văng TypeError**
  Người dùng thấy gì: Công cụ đo căn giá tốt sẽ dừng báo lỗi trên mọi cơ sở dữ liệu còn dòng nguồn chưa có tên, nên lần chạy lại có thể đỏ vì lỗi máy chứ không phải vì dữ liệu sai.
  Căn cứ: Không mất hay lộ dữ liệu và tự hết khi điền đủ tên trên máy thu, nhưng làm bộ đo của hồ sơ khác đỏ giả trên bản chép thử nên cần một việc riêng sửa.
  file: `scripts/can-gia-tot-ba-vai.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lời hứa «chạy lại không ghi đè ô người vận hành đổi» sai khi người vận hành cố ý để trống (NULL hoặc '{}')**
  Người dùng thấy gì: Nếu người vận hành cố ý tắt đo một nguồn bằng cách để trống rồi áp lại bản cập nhật, nguồn đó sẽ được đo lại như cũ.
  Căn cứ: Chỉ xảy ra khi áp lại sau khi đã chỉnh tay, hiện chưa có lượt nào như vậy; ghi giới hạn là đủ và người vận hành tắt lại được.
  file: `db/migrations/122_source_registry_family_cadence.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: ô S01/hcmc, S01/vn, S11 «không còn» trong getCoverageOverview mà không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm tự động cho các ô phủ thị trường có thể vẫn xanh dù bộ đọc trả về rỗng, nên chưa chứng minh chắc việc ẩn S01 hcmc và S11 trên màn.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ giảm độ chắc của bằng chứng; thêm một kiểm dương sau này rất rẻ.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: nhãn S11 chỉ bị cấm «Chưa có dữ liệu», không ghim nhãn đúng**
  Người dùng thấy gì: Bài kiểm chỉ bảo đảm S11 không hiện «Chưa có dữ liệu», chưa chứng minh nó hiện đúng nhãn «Ngừng» trên màn.
  Căn cứ: Hành vi sản phẩm chưa sai, chỉ bằng chứng lỏng; sửa sau rẻ bằng một kiểm dương.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — chỉ kiểm chuỗi có mặt trong khi lời hứa là quan hệ giữa hàng và trạng thái trên bảng dựng trọn**
  Người dùng thấy gì: Bài kiểm bảng Sức khoẻ nguồn chỉ thấy mã S09, S16 có mặt đâu đó trong trang, chưa chắc hàng S16 không mang nhãn «Chưa khai SLO».
  Căn cứ: Không mất dữ liệu và chưa có sai thật trên màn, chỉ bằng chứng chưa chặt; thắt lại sau rẻ.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận viết trước «từng mã» nhưng soVoiMong không đòi đủ phần tử; assert có điều kiện thành phép không**
  Người dùng thấy gì: Bài kiểm có thể xanh dù bản chép dữ liệu thiếu một vài nguồn, khi đó nhịp và thị trường đo của nguồn thiếu không được kiểm.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bằng chứng kém chặt; thêm kiểm đủ tập mã sau rất rẻ.
  file: `scripts/so-nguon-kho.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — tự kiểm của bộ soát tầng A cấy chính biến thể đã gập, không đi vòng từ tên gốc qua bộ gập rồi tới bộ quét**
  Người dùng thấy gì: Phép tự kiểm của bộ soát tên nguồn thật luôn xanh theo cách dựng, nên chưa chứng minh được nó bắt các cách viết tên khác nhau như hoa thường, khoảng trắng, tên miền đầy đủ.
  Căn cứ: Chưa có tên nào lọt ra ngoài, chỉ là độ tin cậy của bộ soát chưa được thử chặt; nhưng đây là rào bảo vệ thông tin nhạy cảm nên nên thắt sớm.
  file: `_acceptance/so-nguon-kho-khai-bao/probes/tang-a.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ghi sau chữ ký (giám sát dò 22/11 07:13Z): ap122NeuThieu nằm ngoài try/finally nên ca «gom() trên DB local» treo khi chạy trên DB thiếu cột 122 mà không phải bản chép thử**
  Người dùng thấy gì: Chạy `node --test scripts/*.test.mjs` thẳng trên DB máy thu (chưa áp 122) thì lượt test treo vô hạn ở `scripts/bao-cao-ngay.test.mjs`, không báo đỏ: hàm ném lỗi đúng thiết kế nhưng `client.end()` không chạy nên kết nối giữ mãi. Hàm không ghi gì lên DB máy thu. Lượt chấm và CI chạy trên bản chép thử nên không gặp.
  Căn cứ: Hết khi máy thu áp 122 (lời gọi thành phép không); sửa bây giờ phải ghim lại 68 phút trong khi giám sát đang giữ main. Giám sát đưa vào hàng hạ tầng sau chuyển máy, cùng việc gỡ các lời gọi `ap122NeuThieu`.
  Trạng thái: đã sửa trong NK1 ở commit `4805a1461`, theo lời giám sát lúc 07:52Z 22/11, sau khi CI job `scripts` của PR #522 đỏ (xem `ci-scripts.md`). Lời gọi nay nằm trong try; cùng lỗi ở `app/tests/ops-nhan-theo-context.test.tsx` cũng đã sửa.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: low
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
