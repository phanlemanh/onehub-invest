# Review findings: od2-phim-va-loi-ghi (round 1)

## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình): ô phím '4' của OPL-AC-3 không đỏ được khi bỏ chặn lặp cho phím 4**
  AC: AC-3
  file: `app/tests/ops-duyet-phim-va-loi-ghi.test.tsx:326`
  severity: medium
  source: measurement
  detail: Ở các phím 1–3 (dòng 316) lần lặp có kiểm `if (await phim(k, true)) assert.fail(...)`, tức bắt cả trường hợp hook đã gọi preventDefault. Ô '4' (dòng 325–327) bỏ qua giá trị trả về: `for (...) await phim("4", true)`, rồi chỉ kiểm điều kiện âm `!tin.some(... 'Đã ghi') && theMo() === 71`. Fixture ghép căn không có nút 4, nên ô này không có đối chứng dương nào cho thấy phím 4 thật sự chạy tới `dapAn`. Hệ quả: nếu đột biến chuyển `if (e.repeat) return` thành chỉ chặn '1'–'3', hook vẫn gọi `lam()` và `preventDefault` cho lần lặp phím 4, nhưng ô này vẫn xanh. Trong khi đó evals.yaml E3 viết rằng chiều đỏ «chặn lặp chỉ phím '1'» sẽ đỏ «ở phím 2–4», và ca đột biến (dòng 346) cũng chỉ ghim `phím 2`. Như vậy phần «cùng vậy với 4» của AC-3 được đếm vào n=8 nhưng không có ô nào đo được nó.
  rationale: AC-3 nêu đích danh «cùng vậy với 1, 2, 3, 4» nhưng ca máy không có ô nào đo được riêng phím 4.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ReviewQueue gọi useRouter() vô điều kiện: render không có AppRouterContext nay ném lỗi, làm đỏ test VT-AC-3 đang có**
  Người dùng thấy gì: Trên bản chạy thật người dùng không thấy gì khác, vì trang luôn có sẵn bộ điều hướng. Nhưng một bộ thử cũ về quyền xem thẻ duyệt theo vai nay báo đỏ, nên có thể chặn việc gộp hoặc che mất lỗi thật về sau.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, chỉ làm bộ thử cũ đỏ; sửa rẻ nhưng ở ngoài các tiêu chí đã ký nên nên làm thành việc riêng.
  file: `app/src/components/ops/review/review-queue.tsx`
  severity: high
  Đề xuất: new-contract

- **E2 trong evals.yaml ghi tin '#62 …' / '#63 …' nhưng ca máy chỉ dùng thẻ #61 cho cả ba tình trạng**
  Người dùng thấy gì: Người ký đọc mô tả kiểm tra thấy số thẻ khác với số thẻ ca máy thật sự dùng. Người dùng cuối không bị ảnh hưởng, chỉ gây hơi khó hiểu khi soát.
  Căn cứ: Lệch chỉ nằm ở chữ mô tả, không đổi kết quả kiểm và không ảnh hưởng người dùng; ghi lại là đủ, sửa chữ sau cũng rẻ.
  file: `_acceptance/od2-phim-va-loi-ghi/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
