# Review findings — judge-giu-quyet-dinh-nguoi (round 1)

## Trong hợp đồng

- **Chặn cả cặp bằng NOT EXISTS không kín trước giao dịch quyết của người đang chạy dở (READ COMMITTED), trong khi comment khẳng định là đủ**
  file: `agent/scripts/judge-run.ts:110`
  severity: low
  source: conventions
  AC: AC-2
  detail: SQL_CAP_NHAT dựa vào `NOT EXISTS (SELECT 1 FROM review_queue x WHERE x.id = ANY($4) AND x.status <> 'pending')` để không sửa thẻ anh em khi người đã quyết một chiều (AC-2). Route quyết `app/src/app/api/v1/ops/review/[id]/decide/route.ts` chỉ `SELECT … FOR UPDATE` rồi UPDATE đúng một thẻ X trong một giao dịch. Nếu câu UPDATE của judge chạy đúng lúc giao dịch đó chưa commit, subquery NOT EXISTS đọc theo snapshot của câu lệnh nên vẫn thấy X là 'pending'. Khi đó thẻ anh em Y không bị khoá sẽ được ghi ai_suggestion và evidence.cham. Riêng X bị chặn: EvalPlanQual kiểm lại `status = 'pending'` sau khi khoá nhả. Kết quả là rowCount = 1 nên lượt này đếm capNhat, trong khi AC-2 hứa không sửa thẻ nào của cặp. Comment ở dòng ~107 ("Postgres kiểm WHERE theo từng dòng lúc ghi nên không cần khoá dòng") chỉ đúng cho điều kiện trên chính dòng đó, không đúng cho điều kiện chéo dòng. Khe thời gian hẹp, cỡ mili giây, và test AC-2 không phủ được vì người quyết đã commit trước khi judge ghi. Cách vá: khoá nhẹ cả hai thẻ ngay trong câu ghi, chỉ vài ms chứ không giữ suốt lúc gọi model. Ví dụ dùng CTE `SELECT … WHERE id = ANY($4) FOR UPDATE` rồi kiểm status trên các dòng đã khoá. Nếu chấp nhận rủi ro thì ít nhất sửa comment cho khỏi khẳng định quá mức.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 3 — AC-3 assert giá trị ai_suggestion đã có sẵn, không đo quan hệ trước/sau lượt 2 (đối chứng đỏ dựng trên hằng số)**
  Người dùng thấy gì: Bài kiểm tra cho việc thẻ chờ vẫn được chấm lại có một kẽ hở: nếu máy chấm lỡ bỏ qua vài thẻ đã mang sẵn kết luận đúng, bài kiểm tra vẫn báo xanh. Người dùng không thấy lỗi nào trên sản phẩm, chỉ là lưới an toàn khi sửa code sau này kém chặt hơn một chút.
  Căn cứ: Không có dữ liệu nào bị sai hay mất, chỉ là bài kiểm tra bắt lỗi kém nhạy ở một tình huống hẹp, và bộ đếm của lượt chạy vẫn bắt được phần lớn sự cố thật.
  file: `agent/tests/judge-run.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
