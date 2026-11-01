# Review findings: duong-thang-n-khong-dau (round 2)

## Trong hợp đồng

- **Hình dạng 3: lời hứa là quan hệ (tệp test ở HEAD bằng tệp ở merge-base), nhưng phép đo chỉ chạy test xanh**
  file: `_acceptance/duong-thang-n-khong-dau/evals.yaml:54`
  severity: medium
  AC: AC-7
  source: measurement
  detail: E7–E10 (AC-7) ghi trong expected rằng mọi ca xanh VÀ «tệp không đổi so với merge-base của nhánh (diffBase)». contract.md dòng 33 hứa đúng quan hệ này: không tệp test nào của các hồ sơ đã ký bị sửa so với merge-base. Nhưng cmd của bốn eval chỉ chạy bộ test (config:executors.test.judge_entity_duong / judge_luat / the_duyet_phuong / the_duyet), tức chỉ đo được exit 0. Không lệnh nào so nội dung tệp test ở HEAD với `git show <diffBase>:<tệp>`. Trong `paths` của E7–E10 cũng không có các tệp test ấy (E7 chỉ liệt kê judge-entity.ts và review-can-cu.ts), nên việc gác theo đường dẫn cũng không bắt được. Tôi grep trong scripts/ và lib/ cũng không thấy chỗ nào cài diffBase. Hệ quả: nếu ai đó nới một ca CD-AC-n cho nó xanh, E7 vẫn PASS, dù nửa «tệp không đổi» của lời hứa mới là phần chặn được hồi quy kiểu đó. Phép đo hiện tại chỉ xác nhận «test có chạy xanh», còn quan hệ bằng nhau giữa hai phiên bản tệp thì không ai kiểm.
  rationale: AC-7 nêu rõ không tệp test nào bị sửa so với merge-base; phép đo chỉ kiểm test xanh nên không chứng minh nửa lời hứa này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 — lời hứa là quan hệ («tệp không đổi so với merge-base») nhưng phép đo chỉ chạy test xanh (r1)**
  Người dùng thấy gì: Lúc này các ca kiểm cũ vẫn nguyên và đều xanh, nên người dùng không bị ảnh hưởng. Về sau nếu ai đó lặng lẽ nới các ca kiểm cũ, bước chấm vẫn báo đạt và lỗi so đường có thể lọt qua.
  Căn cứ: Hiện chưa có hậu quả nào với người dùng vì các ca kiểm cũ chưa bị đụng, rủi ro chỉ phát sinh nếu về sau có người sửa lén; ghi lại hạn chế này rẻ hơn nhiều so với dựng thêm bước kiểm.
  file: `_acceptance/duong-thang-n-khong-dau/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

