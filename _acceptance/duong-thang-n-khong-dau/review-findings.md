# Review findings — duong-thang-n-khong-dau (round 3)

## Trong hợp đồng

- **Chiều đỏ KD-AC-7 chỉ chạy nhánh catch (tệp không có ở merge-base), không chạy phép so nội dung**
  file: `agent/tests/judge-entity-khong-dau.test.ts:225`
  severity: medium
  AC: AC-7
  source: conventions
  detail: Ở chiều đỏ, `tepDoi` được gọi với `agent/tests/judge-entity-khong-dau.test.ts`. Tệp này chưa có ở merge-base, nên `git show <base>:<tệp>` ném lỗi và `catch { return true; }` trả về true. Chiều đỏ chỉ chứng minh trường hợp «tệp vắng ở mốc so», chưa lần nào chạy tới phép so `git show(...) !== readFileSync(...)`. Nếu phép so nội dung hỏng (luôn trả false, hoặc so nhầm tệp), cả ca xanh lẫn chiều đỏ vẫn qua, và một sửa đổi thật trên 4 tệp đã ký sẽ lọt. Comment ở dòng 223 viết «tệp có thật trong cây nhưng khác nội dung ở mốc so», trong khi thực tế là tệp vắng ở mốc so. Muốn chiều đỏ có giá trị cho vế «không đổi» của AC-7, cần so một tệp CÓ ở merge-base nhưng khác nội dung. Thêm nữa, `catch` nuốt mọi lỗi: ngoài trường hợp tệp vắng, lỗi git khác cũng bị tính là «đã đổi».

- **Chiều đỏ của KD-AC-7 chỉ đi qua nhánh catch, không thử phép so nội dung**
  file: `agent/tests/judge-entity-khong-dau.test.ts:225`
  severity: medium
  AC: AC-7
  source: bugs
  detail: Ca đỏ gọi tepDoi(base, ["agent/tests/judge-entity-khong-dau.test.ts"]). Tệp chưa có ở merge-base nên `git show <base>:<tệp>` ném lỗi, và `catch { return true; }` đánh dấu tệp là 'đổi'. Đã chạy và thấy dòng 'fatal: path ... exists on disk, but not in 5cbf3e23' in ra stderr, còn ca thì xanh. Phép so `git show(...) !== readFileSync(...).trim()` không lần nào được thử với một tệp có ở mốc nhưng bị sửa nội dung. Nếu phép so hỏng theo hướng luôn trả 'bằng nhau', chiều xanh vẫn xanh và chiều đỏ cũng vẫn xanh nhờ catch. Cách sửa: chiều đỏ dùng một tệp có ở merge-base nhưng nội dung khác cây đang làm (so với mốc cũ hơn, hoặc chép tạm một tệp đã ký sửa một dòng rồi so). Nên tách lỗi git (không tìm thấy tệp ở mốc) khỏi kết luận 'bị sửa'.

- **Hình dạng 4 (âm tính một mình, đối chứng không chạm đúng phép so): chiều đỏ của KD-AC-7 chỉ đi qua nhánh catch, không bao giờ chạy phép so nội dung**
  file: `agent/tests/judge-entity-khong-dau.test.ts:225`
  severity: medium
  AC: AC-7
  source: measurement
  detail: Assert xanh ở dòng 224 là khẳng định âm: `assert.deepEqual(tepDoi(base, TEP_DA_KY), [])`. Đối chứng đỏ ở dòng 225-229 gọi `tepDoi` với tệp KHÔNG có ở merge-base 5cbf3e23 (`git cat-file -e` ra lỗi 128). `git show` ném lỗi, `catch { return true; }` (dòng 210-212) bắt lấy, phép so ở dòng 209 không hề chạy. Chú thích dòng 225 viết 'tệp có thật trong cây nhưng khác nội dung ở mốc so', nhưng thực tế là ca 'không có ở mốc'. Nếu phép so nội dung hỏng, dòng 224 vẫn xanh và chiều đỏ cũng vẫn xanh. Thiếu một ca đỏ đi qua đúng nhánh so (tệp có ở merge-base, nội dung khác ở cây làm việc). Ngoài ra thông điệp ghim ở dòng 228 chính là thông điệp test tự truyền vào `assert.deepEqual` ở dòng 227, nên regex chỉ xác nhận deepEqual đã ném lỗi, không ghim được lý do bị đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **trim() hai phía làm sót các thay đổi chỉ ở khoảng trắng đầu/cuối tệp đã ký**
  Người dùng thấy gì: Nếu ai đó chỉ thêm hoặc bớt dòng trống ở đầu hoặc cuối một tệp kiểm thử đã ký, bước kiểm tra sẽ không phát hiện. Nội dung kiểm thử thật vẫn không đổi nên người dùng không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ vì chỉ lọt thay đổi khoảng trắng không làm đổi hành vi, không mất hay lộ dữ liệu, và có thể sửa sau với chi phí thấp.
  file: `agent/tests/judge-entity-khong-dau.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — lời hứa là quan hệ («tệp không đổi so với merge-base») nhưng phép đo chỉ chạy test xanh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Lúc này các ca kiểm cũ vẫn nguyên và đều xanh, nên người dùng không bị ảnh hưởng. Về sau nếu ai đó lặng lẽ nới các ca kiểm cũ, bước chấm vẫn báo đạt và lỗi so đường có thể lọt qua.
  Căn cứ: Hiện chưa có hậu quả nào với người dùng vì các ca kiểm cũ chưa bị đụng, rủi ro chỉ phát sinh nếu về sau có người sửa lén; ghi lại hạn chế này rẻ hơn nhiều so với dựng thêm bước kiểm.
  file: `_acceptance/duong-thang-n-khong-dau/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
