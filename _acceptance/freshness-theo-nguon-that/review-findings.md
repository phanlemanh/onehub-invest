# Review findings: freshness-theo-nguon-that (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--schema thiếu giá trị lọt qua validation, lặng lẽ chạy trên schema public**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm cờ chọn kho thử mà quên giá trị, lệnh kiểm độ tươi lặng lẽ đo dữ liệu thật thay vì báo lỗi. Chỉ ảnh hưởng người chạy tay trong lúc thử nghiệm.
  Căn cứ: Hậu quả nhẹ: chỉ xảy ra khi gõ sai lệnh thử, không mất hay lộ dữ liệu, chạy lại lệnh đúng là xong.
  file: `scripts/check-freshness.mjs`
  severity: low
  Đề xuất: known-limits

- **SKILL.md mô tả cờ --json nhưng allowed-tools chỉ cho đúng lệnh không cờ**
  Người dùng thấy gì: Khi chạy kiểm tra vận hành theo hướng dẫn, lệnh có cờ in dạng máy đọc sẽ bật hỏi quyền, làm người dùng phải bấm đồng ý thêm một lần.
  Căn cứ: Hậu quả nhẹ: chỉ thêm một lần hỏi quyền, không mất dữ liệu, bấm đồng ý là chạy tiếp.
  file: `.claude/skills/ops-check/SKILL.md`
  severity: low
  Đề xuất: known-limits

- **S06 (và S03/S05) đo stg.captured_at — giờ NẠP, bị importer ghi đè now() mỗi lần upsert, nên nguồn chết vẫn báo tươi**
  Người dùng thấy gì: Một nguồn đã ngừng thu thập vài ngày nhưng vẫn được nạp lại bản cũ sẽ bị báo là còn tươi, nên phép kiểm độ tươi có thể bỏ sót đúng loại lỗi im lặng mà nó sinh ra để bắt.
  Căn cứ: Hậu quả nặng vì cảnh báo quá hạn không nổ khi nguồn chết, người vận hành tưởng dữ liệu mới trong khi đã cũ; không tự lộ ra được, nhưng sửa sau không đắt và nên làm thành việc riêng.
  file: `scripts/lib/freshness.mjs`
  severity: high
  Đề xuất: new-contract

- **`--schema` thiếu giá trị bị bỏ qua im lặng, CLI chạy trên schema public thật**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm cờ chọn kho thử mà quên giá trị, lệnh kiểm độ tươi lặng lẽ đo dữ liệu thật và còn có thể bắn cảnh báo ra ngoài nếu đã cấu hình kênh báo.
  Căn cứ: Hậu quả nhẹ: chỉ xảy ra khi gõ sai lệnh thử, không mất dữ liệu, chạy lại lệnh đúng là xong.
  file: `scripts/check-freshness.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm-tính-một-mình: «S03 không lẫn hàng S05» không có đối chứng dương, sửa hỏng thì vẫn xanh**
  Người dùng thấy gì: Bộ kiểm hiện chưa bắt được trường hợp nguồn Zalo thứ hai đang chạy tốt làm nguồn Zalo thứ nhất trông tươi giả. Mã hiện tại vẫn đúng, nhưng sửa sai sau này có thể không bị phát hiện.
  Căn cứ: Hậu quả gián tiếp: người dùng không thấy gì hôm nay, chỉ rủi ro về sau nếu có người sửa sai mà test vẫn xanh; bổ sung ca kiểm sau này rẻ.
  file: `scripts/check-freshness.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên phủ ma trận «mỗi tiêu chí có cặp tươi/quá hạn» nhưng chỉ có điểm-case: thiếu ô S03 quá hạn, AC-5/AC-6 không có chiều stale**
  Người dùng thấy gì: Thẻ nghiệm thu nói rằng mỗi tiêu chí đều có cả ca tươi lẫn ca quá hạn, nhưng thực tế một số ô như nguồn Zalo thứ nhất quá hạn chưa được thử. Người ký có thể tin độ phủ rộng hơn thực tế.
  Căn cứ: Hậu quả nhẹ với người dùng cuối, chủ yếu làm lời mô tả độ phủ hơi quá tay; có thể ghi rõ giới hạn hoặc bổ sung ca sau mà không ảnh hưởng dữ liệu.
  file: `_acceptance/freshness-theo-nguon-that/card-plain.json`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (.claude/skills/ops-check/SKILL.md, _acceptance/freshness-theo-nguon-that/card-plain.json) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
