# Review findings: the-dia-chi-nhom-s03 (round 7)

## Trong hợp đồng

- **E9 (tg1_lui) hỏng sau migration 109: itest chỉ áp 108 rồi chạy kiem-sau.sql đã đọc cột retired_at và tên cột so_the không còn**
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs:58`
  severity: high
  AC: AC-9
  source: bugs
  detail: Commit 246b4e76 sửa `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql` cho 109 (đọc retired_at, đổi cột so_the thành so_the_song/so_the_nghi) nhưng không sửa bộ kiểm E9. Trong TG1-AC-9b, MIG chỉ gồm db/migrations/108_the_dia_chi_nhom.sql (dòng 16), nên bảng không có cột retired_at; vòng lặp chạy từng câu của kiem-sau.sql ném lỗi «column retired_at does not exist» ngay ở câu SELECT ... WHERE retired_at IS NULL. Kể cả khi vượt qua, dòng 58 vẫn dò field tên 'so_the' — tên này đã biến mất, nên soThe giữ null và assert.equal(soThe, 1) đỏ. Lượt E9 xanh gần nhất trong run-log.jsonl là sha 9d8b50a7, tức trước 109: hồ sơ Cổng Bằng chứng đang mang bằng chứng của bản mã cũ. Sửa: nối thêm 109 vào MIG và dò cột so_the_song.
  rationale: Phép đo AC-9 (tệp lùi chạy thật, áp lại được, lệnh kiểm sau chạy) đỏ trên mã hiện tại nên hồ sơ không còn bằng chứng cho AC-9.

- **Dòng căn cứ trên hộp duyệt gán căn cứ của máy cho giá trị người vận hành vừa sửa**
  file: `app/src/components/ops/group-cards/group-cards-text.ts:24`
  severity: medium
  AC: AC-10
  source: bugs
  detail: dongCanCu/dongCanCuMucDich chỉ trả «Người vận hành điền» khi evidence.&lt;ô&gt;.nguon là null. Nhưng route sửa thẻ (app/src/lib/the-dia-chi-nhom.ts dòng 152) UPDATE project_node_ids, area_id, province_area_id, subzone_node_id, purpose mà KHÔNG động vào cột evidence. Vì vậy khi người vận hành đổi một ô mà máy đã điền (vd phường máy suy «theo tin của nhóm, 12 tin» bị sửa sang phường khác), mở lại thẻ vẫn hiện đúng dòng căn cứ của máy cho giá trị của người — sai đúng điều AC-10 muốn chặn, và ca kiểm hiện chỉ phủ trường hợp máy để trống (nguon null), không phủ trường hợp ghi đè.
  rationale: AC-10 đòi người duyệt đọc đúng mỗi ô lấy từ đâu; ô người sửa lại hiện căn cứ của máy là sai đúng điều đó.

- **Đo CHỈ DẪN thay vì ĐẦU RA — ca E9b dò khoá `so_the` mà kiem-sau.sql không bao giờ phát ra**
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs:58`
  severity: high
  AC: AC-9
  source: measurement
  detail: Dòng 58: `if (r.fields.some((f) => f.name === "so_the") && r.fields.some((f) => f.name === "nhom_co_bai")) soThe = Number(r.rows[0].so_the)`. Artefact đang đo (`_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql` dòng 10–12, sau khi 109 đổi cột) chỉ trả các cột `so_the_song`, `so_the_nghi`, `nhom_co_bai` — không có cột nào tên đúng `so_the`. Nhánh gán không bao giờ chạy, `soThe` giữ null, và assert kế tiếp `assert.equal(soThe, 1, "kiem-sau.sql không in đúng số thẻ")` không đọc con số mà kiem-sau.sql in ra: nó chỉ phản ánh việc tên cột khớp hay không. Lời hứa của E9 («chạy kiem-sau.sql trên DB đã áp không lỗi và in số thẻ») không được phép đo nào kiểm; phép đo chỉ bắt được sự tồn tại của một tên khoá trong chỉ dẫn, không bắt được đầu ra. Đây cũng là lỗi chéo giữa tệp lùi/kiểm (vùng vật) và ca đo.
  rationale: Cùng gốc với phép đo AC-9: ca đo lệnh kiểm sau và tệp lùi không đọc đầu ra thật nên không chứng minh được AC-9.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Route ghi thẻ thiếu cổng «chỉ máy thu» (VERCEL=1 → 503) như route local-only chị em**
  Người dùng thấy gì: Nếu ai đó gọi chức năng ghi thẻ từ bản chạy trên cloud, họ nhận thông báo lỗi chung chung thay vì lời giải thích rõ là chức năng này chỉ có ở máy thu. Không mất dữ liệu.
  Căn cứ: Nhẹ: chỉ khác ở câu báo lỗi, không ghi hỏng gì, và trang trên cloud đã tự ẩn khu thẻ nên người dùng gần như không chạm tới.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Tệp máy sinh app/next-env.d.ts bị commit kèm thay đổi đường tham chiếu kiểu**
  Người dùng thấy gì: Một tệp tự sinh của công cụ dựng bị đổi lẫn vào lượt nộp, có thể làm hiện thay đổi thừa ở các phiên làm việc khác.
  Căn cứ: Nhẹ: không ảnh hưởng người dùng cuối, tự phục hồi khi chạy lại và sửa tốn gần như không đáng kể nhưng không cần việc riêng.
  file: `app/next-env.d.ts`
  severity: medium
  Đề xuất: wont-fix

- **Cấu hình dev của dãy TG1 dùng cờ --webpack, lệch bundler mặc định của kho**
  Người dùng thấy gì: Ảnh chụp màn làm bằng chứng được chụp trên cách chạy dev khác với các dãy khác, nên có thể che một khác biệt chỉ lộ trên cách chạy mặc định.
  Căn cứ: Nhẹ: không đổi gì người dùng thấy trên bản thật, chỉ làm bằng chứng hình ảnh kém đại diện; ghi lại để người ký biết.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: known-limits

- **kiem-sau.sql chép tay định nghĩa «bài thử», thành bản thứ năm ngoài thước GN5 và đã lệch bản chuẩn**
  Người dùng thấy gì: Lệnh kiểm sau khi áp có thể đếm nhóm có bài lệch vài bài so với cách đếm chuẩn nếu sau này có bài từ kênh khác lọt vào. Hôm nay số vẫn khớp.
  Căn cứ: Nhẹ: hiện chưa lệch số nào, chỉ là nguy cơ sau này, và người vận hành thấy ngay nếu con số kiểm không khớp.
  file: `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql`
  severity: medium
  Đề xuất: known-limits

- **Lệnh dựng nháp đọc sale_offer_records (gồm tin đã nghỉ) thay vì view sale_offers**
  Người dùng thấy gì: Khi máy đoán phường của nhóm, cả tin đã ngừng rao cũng được tính, nên con số căn cứ hiện trên thẻ có thể cao hơn số tin còn sống.
  Căn cứ: Nhẹ: người duyệt vẫn xem và sửa từng thẻ, khoảng 6% tin là tin nghỉ, và có thể là chủ ý vì địa chỉ nhóm mang tính lịch sử.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Lệnh dựng nháp đọc sale_offer_records thay vì view sale_offers, nên đếm cả tin đã nghỉ khi suy ô phường**
  Người dùng thấy gì: Phường máy đề xuất cho một nhóm có thể bị tin đã ngừng rao kéo lệch, nên người duyệt đôi khi phải sửa phường.
  Căn cứ: Nhẹ đến vừa: chỉ là nháp, người duyệt thấy và sửa được từng thẻ, không có dữ liệu nào bị ghi tự động lên tin.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: medium
  Đề xuất: known-limits

- **Quyết thẻ trên một thẻ đang nghỉ vi phạm group_address_cards_nghi_chk và trả 400 với thông điệp Postgres thô**
  Người dùng thấy gì: Hiếm khi, nếu người vận hành duyệt một thẻ vừa bị cho nghỉ, họ thấy thông báo lỗi kỹ thuật khó hiểu thay vì lời giải thích.
  Căn cứ: Nhẹ: rất hiếm, không ghi sai dữ liệu nào, người dùng tải lại trang là thấy thẻ đã nghỉ.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc — ca AC-10 dựng `TheDiaChi` bằng tay, không round-trip từ bên ghi evidence**
  Người dùng thấy gì: Nếu sau này đổi cách máy ghi căn cứ, hộp duyệt có thể hiện sai số bài mà bộ kiểm vẫn báo xanh.
  Căn cứ: Nhẹ: chỉ là khoảng hở của bộ kiểm cho thay đổi tương lai, hôm nay hộp duyệt hiện đúng.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA — AC-9a chỉ grep chữ trong README.md và sao-luu.sh, không chạy, không đọc số chạy thử**
  Người dùng thấy gì: Bộ kiểm chỉ xác nhận hồ sơ áp có đủ tệp và đúng chữ, chưa chứng minh bản sao lưu thật chạy ra tệp không rỗng.
  Căn cứ: Nhẹ: người ký còn thấy số chạy thử và hồ sơ áp, bản sao lưu sẽ được thử trước khi áp thật.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình — kiểm «thẻ không vào sync-cloud» là một regex phủ định trần, không đối chứng dương**
  Người dùng thấy gì: Nếu cấu trúc đồng bộ lên cloud đổi, bộ kiểm có thể vẫn xanh dù thẻ vô tình bị đưa lên cloud.
  Căn cứ: Nhẹ: hôm nay thẻ không lên cloud, đây chỉ là rào chưa chắc cho thay đổi sau này.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/13 lỗi rơi vào file không bộ đo nào phủ (app/next-env.d.ts, .claude/launch.json, _acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql, app/src/components/ops/group-cards/group-cards-text.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
