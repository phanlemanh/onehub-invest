# Bảng thử phá và phản biện trước vòng chấm 3 (19/11/2026)

Giám sát đặt hai điều kiện trước vòng 3: mỗi chỗ vừa vá và mỗi chỗ lõi phải có đột biến làm ca đỏ, và một lượt phản biện độc lập tìm tên khai cờ lọt.

## Cách chạy

`thu-pha.mjs` (kèm cạnh tệp này) chạy trên một bản sao tách rời của nhánh: mỗi đột biến sửa đúng một chỗ, chạy bộ ca liên quan, ghi mã thoát và ca đỏ, rồi khôi phục tệp. Bốn bộ ca:
`node --test pipeline/scripts/ops-nhan-ma-nguon.test.mjs scripts/ops-nhan-ma-nguon.test.mjs` (core) ·
`node --test pipeline/scripts/soat-tang-a.test.mjs` (soat) ·
`node --test --test-concurrency=1 pipeline/scripts/push-ops-facts-import.test.mjs` (push) ·
`bash db/db-thu.sh oneinvest_suite_u1_thu_pha --chay node --test --test-concurrency=1 pipeline/scripts/source-name-entries.itest.mjs` (itest).
Lệnh: `node thu-pha.mjs <bản sao nhánh> <tệp bảng>`.

## Phản biện độc lập

Một tác tử mới, không đọc lịch sử sửa, chỉ nhận hợp đồng và mã, tìm được sáu cách lọt. Bốn cách trong lời hứa AC-2 đã vá ở commit 0504fcaa7: chữ gõ tổ hợp (NFD); cụm nối bằng gạch ngang dài, chấm giữa, ký tự vô hình và mã URL `%XX`; bộ soát bảng người bán soát trên chuỗi JSON nên bỏ lọt cụm có xuống dòng; tên miền khai cờ viết bỏ nhãn đầu (đã kiểm trên tên miền S16 thật: nhãn giữa khác tên). Hai cách còn lại để lại cho Cổng Bằng chứng: hai tên khai cờ chồng nhau (trên máy thu có 1 cặp, cùng nguồn S16, che xong không còn phần bí mật), và chữ trong một từ bị mã hoá URL.

## Bảng trên mã đã vá (commit 0504fcaa7)

| Đột biến | Tệp | Bộ ca | Mã thoát | Ca đỏ | Kết quả |
|---|---|---|---|---|---|
| — | không đột biến (nền) | — | core=0 soat=0 push=0 itest=0 | 0 | nền xanh |
| lõi pipeline-1 khớp cụm không thoát ký tự đặc biệt | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-2 tắt hẳn khớp cụm | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-3 dấu phân tách chỉ còn sáu loại cũ | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-4 bỏ mã URL khỏi dấu phân tách | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-5 chỉ một dấu phân tách | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-6 không chuẩn hoá NFD | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-7 bỏ dạng tên miền bỏ nhãn đầu | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-8 bỏ qua cờ, vẫn lấy từ đầu | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-9 không gập chữ trước khi khớp | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 6: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · AC-2 che-ten: mọi ca không mang cờ ra đúng chu | chết |
| lõi pipeline-10 vị trí che lệch trên chữ tổ hợp | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-1 khớp cụm không thoát ký tự đặc biệt | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-2 tắt hẳn khớp cụm | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-3 dấu phân tách chỉ còn sáu loại cũ | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-4 bỏ mã URL khỏi dấu phân tách | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-5 chỉ một dấu phân tách | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-6 không chuẩn hoá NFD | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-7 bỏ dạng tên miền bỏ nhãn đầu | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-8 bỏ qua cờ, vẫn lấy từ đầu | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-9 không gập chữ trước khi khớp | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-10 vị trí che lệch trên chữ tổ hợp | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| SQL-1 bỏ nhánh so trên bản bỏ dấu | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SQL-2 lớp ký tự SQL chỉ còn dấu cũ | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SQL-3 bỏ mã URL khỏi lớp ký tự SQL | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SOAT-4 bộ soát bảng soát chuỗi JSON thay giá trị | `pipeline/sync-cloud.mjs` | soat | soat=1 | 2: cụm khai cờ trong cột ngoài nhóm người bán bị chặn (dài 18) · che-ten AC-2: bộ soát bảng người bán soát từng giá trị đã giải JSON | chết |
| SQL-4 bỏ qua cờ khi dựng biến thể SQL | `pipeline/sync-cloud.mjs` | itest | itest=1 | 2: AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi khai cờ, bị chặn/che khi không; cụm tên và tên miền luôn bị · AC-2 che phía SQL: cụm hai từ ở mọi dấu p | chết |
| SOAT-1 bộ soát sync-cloud luôn cho qua | `pipeline/sync-cloud.mjs` | soat, itest | soat=1 itest=1 | 4: NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca · NT2-AC-6 một bộ soát · AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi | chết |
| SOAT-2 mất cờ khi đổi token sang mục | `pipeline/lib/tier-a-guard.mjs` | soat, itest | soat=1 itest=1 | 5: đối chứng: tên mang thương hiệu đi qua · che-ten AC-2: bộ soát bảng người bán soát từng giá trị đã giải JSON · AC-4 sync-cloud: soát + che phía SQL — tên dự án  | chết |
| SOAT-3 bộ soát bỏ qua giá trị chuỗi | `pipeline/lib/tier-a-guard.mjs` | soat | soat=1 | 15: NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca · NT2-AC-6 một bộ soát · cụm khai cờ trong cột ngoài nhóm người bán bị chặn (dài  | chết |
| PUSH-1 gọi main() không chốt | `pipeline/push-ops-facts.mjs` | push | push=1 | 2: AC-10 chỉ import tệp: 0 lời gọi tới máy chủ thu, thoát 0 · AC-10 chiều đỏ: bản sao gọi main() không chốt → đỏ ghim «AC-10 import đã gửi bản tin» | chết |
| PUSH-2 so đường không qua realpath | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy qua symlink như launchd (~/dev/one-invest) → vẫn là lệnh chính, đúng 1 lời gọi | chết |
| PUSH-3 bỏ nhánh chạy khô | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy khô --kho → 0 lời gọi | chết |
| PUSH-4 chạy khô luôn thoát 1 | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy khô --kho → 0 lời gọi | chết |

Đột biến sống: 0/32. Cây sau lượt: sạch.

## Bảng trên mã trước lượt phản biện (commit 782eecc2e)

| Đột biến | Tệp | Bộ ca | Mã thoát | Ca đỏ | Kết quả |
|---|---|---|---|---|---|
| — | không đột biến (nền) | — | core=0 soat=0 push=0 itest=0 | 0 | nền xanh |
| lõi pipeline-1 khớp cụm không thoát ký tự đặc biệt | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-2 tắt hẳn khớp cụm | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-3 bỏ dấu nối khỏi dấu phân tách | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-4 bỏ gạch dưới | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-5 bỏ dấu chấm | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-6 bỏ dấu gạch chéo | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-7 bỏ khoảng trắng | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-8 chỉ một dấu phân tách | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-9 bỏ qua cờ, vẫn lấy từ đầu | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi pipeline-10 không gập chữ trước khi khớp | `pipeline/lib/mask-source-names.mjs` | core | core=1 | 6: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · AC-2 che-ten: mọi ca không mang cờ ra đúng chu | chết |
| lõi app-1 khớp cụm không thoát ký tự đặc biệt | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-2 tắt hẳn khớp cụm | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-3 bỏ dấu nối khỏi dấu phân tách | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-4 bỏ gạch dưới | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-5 bỏ dấu chấm | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-6 bỏ dấu gạch chéo | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-7 bỏ khoảng trắng | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-8 chỉ một dấu phân tách | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-9 bỏ qua cờ, vẫn lấy từ đầu | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| lõi app-10 không gập chữ trước khi khớp | `app/src/lib/mask-source-names.ts` | core | core=1 | 2: ON7-AC-7 bộ che: bảng ca dùng chung — bản pipeline và bản app đúng kết quả viết trước từng ca và giống hệt nhau · ON7-AC-7 bộ che | chết |
| SQL-1 bỏ nhánh so trên bản bỏ dấu | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SQL-2 bỏ dấu nối khỏi lớp ký tự SQL | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SQL-3 bỏ khoảng trắng khỏi lớp ký tự SQL | `pipeline/sync-cloud.mjs` | itest | itest=1 | 1: AC-2 che phía SQL: cụm hai từ ở mọi dấu phân tách về NULL, thương hiệu nối dấu giữ nguyên | chết |
| SQL-4 bỏ qua cờ khi dựng biến thể SQL | `pipeline/sync-cloud.mjs` | itest | itest=1 | 2: AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi khai cờ, bị chặn/che khi không; cụm tên và tên miền luôn bị · AC-2 che phía SQL: cụm hai từ ở mọi dấu p | chết |
| SOAT-1 bộ soát sync-cloud luôn cho qua | `pipeline/sync-cloud.mjs` | soat, itest | soat=1 itest=1 | 4: NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca · NT2-AC-6 một bộ soát · AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi | chết |
| SOAT-2 mất cờ khi đổi token sang mục | `pipeline/lib/tier-a-guard.mjs` | soat, itest | soat=0 itest=1 | 3: AC-4 sync-cloud: soát + che phía SQL — tên dự án qua khi khai cờ, bị chặn/che khi không; cụm tên và tên miền luôn bị · AC-2 che phía SQL: cụm hai từ ở mọi dấu p | chết |
| SOAT-3 bộ soát bỏ qua giá trị chuỗi | `pipeline/lib/tier-a-guard.mjs` | soat | soat=1 | 12: NT2-AC-6 bảng ca ON7 qua scanSourceNames và guardValues → cùng kết quả từng ca · NT2-AC-6 một bộ soát · tên dự án mang thương hiệu: 0 chỗ trúng khi khai cờ, ≥ 1 | chết |
| PUSH-1 gọi main() không chốt | `pipeline/push-ops-facts.mjs` | push | push=1 | 2: AC-10 chỉ import tệp: 0 lời gọi tới máy chủ thu, thoát 0 · AC-10 chiều đỏ: bản sao gọi main() không chốt → đỏ ghim «AC-10 import đã gửi bản tin» | chết |
| PUSH-2 so đường không qua realpath | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy qua symlink như launchd (~/dev/one-invest) → vẫn là lệnh chính, đúng 1 lời gọi | chết |
| PUSH-3 bỏ nhánh chạy khô | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy khô --kho → 0 lời gọi | chết |
| PUSH-4 chạy khô luôn thoát 1 | `pipeline/push-ops-facts.mjs` | push | push=1 | 1: AC-10 chạy khô --kho → 0 lời gọi | chết |

Đột biến sống: 0/31. Cây sau lượt: sạch.
