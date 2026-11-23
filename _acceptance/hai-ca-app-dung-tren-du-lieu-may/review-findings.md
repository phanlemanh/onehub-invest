# Review findings — hai-ca-app-dung-tren-du-lieu-may (round 2)

## Trong hợp đồng

- **SD-AC-6: phép soát «số suy = số tin trong danh bạ» luôn đúng, không bắt được lỗi nào trên dữ liệu thật**
  file: `app/tests/sellers-chip.test.tsx:253`
  severity: medium
  AC: AC-2
  source: bugs
  detail: dealsSql lấy broker_n_ads bằng `LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash` (app/src/lib/deals.ts:174). docAc6 tính danhBa bằng đúng phép nối đó trên cùng view `sellers` (`LEFT JOIN sellers sel ON sel.phone_hash = o.seller_phone_hash`), trong cùng giao dịch. Vậy với mọi dòng, `Number(broker_n_ads) === danhBa` luôn đúng: phép `lech` trong soatAc6 không bao giờ đỏ, dù view sellers có đếm cả tin số suy và «bịa» số tin. Chiều đỏ 2 chỉ đỏ vì ca tự gán `broker_n_ads = 3` cho bản JS của dòng sau khi đã đọc, chứ không đổi gì ở code hay dữ liệu. Thêm nữa, suyCoSo > 0 và suyNull > 0 luôn đạt nhờ hai dòng tự cấy (một dòng mượn hash của tin thật, một dòng có hash mới, cấy sau khi đã dựng danh bạ). Nên E2 xanh không chứng minh luật hiển thị số suy mà AC-2 nêu. Muốn đo thật thì danhBa phải tính từ nguồn độc lập với view, ví dụ đếm theo bí danh sdt của danh bạ, hoặc đếm tin không suy theo hash.
  rationale: AC-2 đòi ca soát số tin của tin số suy bằng số tin trong danh bạ; phép so dùng cùng một phép nối nên không soát được điều AC-2 nêu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1 expected tả dòng in và điều kiện assert không còn khớp code sau 1cde44464**
  Người dùng thấy gì: Người chấm ở bước nghiệm thu có thể đọc kết quả mong đợi ghi sai chữ so với những gì test in ra. Màn hình người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là lời ghi chú lệch trong hồ sơ nghiệm thu, không ảnh hưởng người dùng và sửa lại lúc nào cũng rẻ.
  file: `_acceptance/hai-ca-app-dung-tren-du-lieu-may/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **s4-args.json là bản chụp cũ: chỉ có E1–E4 và lệnh ht3_pham_vi đời trước**
  Người dùng thấy gì: Một lượt chấm sau có thể bỏ sót ba tiêu chí mới hoặc chạy lệnh kiểm phạm vi cũ. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ làm lượt chấm nội bộ thiếu phủ chứ không mất dữ liệu; chỉ cần sinh lại tệp trước vòng chấm kế.
  file: `_acceptance/hai-ca-app-dung-tren-du-lieu-may/s4-args.json`
  severity: low
  Đề xuất: known-limits

- **ht3_pham_vi báo SCOPE OK khi git merge-base lỗi**
  Người dùng thấy gì: Trong môi trường thiếu nhánh gốc, bước kiểm phạm vi thay đổi có thể báo đạt mà không kiểm gì. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm một rào nội bộ yếu đi ở tình huống hiếm, không đụng dữ liệu hay màn hình; sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **E1 expected ghi dòng in và thông điệp đỏ khác với những gì test thật sự in**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả sai chữ test in ra, có thể làm người chấm hiểu nhầm. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Lệch chỉ ở chữ ghi chú, không gây mất hay lộ dữ liệu, sửa lại bất cứ lúc nào.
  file: `_acceptance/hai-ca-app-dung-tren-du-lieu-may/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Đối soát «ngoài tập bị đè» dùng g.get mà không kiểm g.has, nên có thể che tin lệch**
  Người dùng thấy gì: Một số tin lệch vì lý do khác có thể không bị phép đối soát phát hiện. Người dùng cuối không thấy ngay.
  Căn cứ: Chỉ làm bộ kiểm yếu đi ở một nhóm tin hiếm, không ghi sai dữ liệu thật; sửa sau rẻ.
  file: `pipeline/scripts/nap-dvhc-cu.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): hai nhóm «số suy» của SD-AC-6 chỉ có từ dòng tự cấy viết tay, nên chốt «probe không đo được» không bao giờ bật**
  Người dùng thấy gì: Nếu máy thật không có tin số suy, bài kiểm vẫn báo đạt nhờ dòng tự cấy. Màn hình người dùng không đổi.
  Căn cứ: Hợp đồng đã chủ ý dùng dòng tự cấy; hậu quả chỉ là bài kiểm kém nhạy, không ảnh hưởng dữ liệu.
  file: `app/tests/sellers-chip.test.tsx`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/hai-ca-app-dung-tren-du-lieu-may/evals.yaml, _acceptance/hai-ca-app-dung-tren-du-lieu-may/s4-args.json, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
