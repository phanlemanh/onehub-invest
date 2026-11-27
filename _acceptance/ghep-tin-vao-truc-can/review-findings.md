# Review findings: ghep-tin-vao-truc-can (round 2)

## Trong hợp đồng

- **Bước gắn trục, căn bỏ qua việc rút dòng khi tập dòng muốn ghi rỗng, nên dòng cũ vẫn sống mãi**
  file: `pipeline/lib/ghep-tin-truc-can-ghi.mjs:369`
  severity: low
  AC: AC-6
  source: bugs
  detail: buocGhepCan dừng ở `if (!dong.length) return log(...)` trước khi gọi ghiGan. Vì vậy mọi trường hợp cho ra 0 dòng đều giữ nguyên các dòng ghep-can-* đang sống. Trường hợp thứ nhất: tắt hết nguồn trong NGUON_BAT, trong khi chú thích ở ghep-tin-truc-can.mjs hứa «lượt kế rút hết dòng của nguồn đó». Trường hợp thứ hai: danh bạ trục, căn đổi đến mức không bài nào còn gắn được. Khi đó offer_unit vẫn đọc các phát biểu đã lỗi thời. Dấu vết duy nhất là một dòng JOB WARN mỗi lượt nạp. Ở lượt có dòng (dù chỉ một), ghiGan rút đúng. Chỉ ca rỗng hoàn toàn mới nuốt việc rút. Đây là hành vi có chủ đích theo chú thích ở dòng 368, nhưng mâu thuẫn với lời hứa của công tắc nguồn và không có đường rút nào khác ngoài lui-131.sql.
  rationale: AC-6 đòi dòng cũ bị rút khi toà bị rút, mã đổi, trục ngừng hoạt động, và tắt nguồn thì rút đúng dòng của nguồn đó; ca rỗng hoàn toàn không rút nên trái câu đó.

- **Hình dạng 5 (tuyên ô ma trận nhưng điểm-case không chạm ô): ca «tang-09-khop-9» không so 09 với 9**
  file: `pipeline/scripts/ghep-tin-truc-can.test.mjs:75`
  severity: medium
  AC: AC-3
  source: measurement
  detail: E3 hứa một ô «tầng 09 với 9 khớp (không tang-lech)», tức hai cách viết tầng khác nhau vẫn phải khớp. Nhưng ca này dùng mã `LD3.0702` (tầng từ mã là «07») và `tangChu: ["07"]`, nên hai phía là cùng một chuỗi thô «07». Phép so `tangC[0] !== tangMa` ở dòng 102 của lib xanh dù bước bỏ số 0 đầu có chạy hay không. Sửa `chuanTang` thành giữ số 0 đầu thì cả hai phía vẫn ra «07» và ca vẫn xanh. Ô này chỉ được đo gián tiếp qua `chuanTang("09")==="9"` ở dòng 81, không đo trong xetBai với hai cách viết khác nhau.
  rationale: AC-3 liệt kê ô «tầng 09 của mã với 9 của chữ bài» và đòi một assert mỗi ô; ca hiện không đo ô đó.

- **Hình dạng 5 (ô hợp đồng không có assert nào): «floor_raw của bộ đọc chữ không bị rút hay đè» không được đo**
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Expected của E3 có ô «phát biểu floor_raw của bộ đọc chữ không bị rút hay đè». Cả hai tệp itest và tệp test đơn vị đều không có ca nào đọc lại dòng floor_raw của parser sau ghiGan. Chỗ duy nhất có floor_raw là ghep-tin-truc-can-131.itest.mjs:60, và ở đó chỉ ghi một dòng rule ghep-can-tang-tu-ma. Ca «luot-dau-chen-va-moi-bai-mot-dong-moi-truong» chỉ đếm dòng có rule_id thuộc TAT_CA_NGUON, nên dòng floor_raw của parser bị rút hay bị đè cũng không làm ca nào đỏ.
  rationale: AC-3 nêu rõ phát biểu floor_raw của bộ đọc chữ không bị rút hay đè, mà không ca nào đo.

- **Hình dạng 5 (ô ma trận tự thoái hoá thành ô khác): «truc-va-can-cung-truc-ra-can» có kỳ vọng điều kiện**
  file: `pipeline/tests/ghep-tin-truc-can-131.itest.mjs:96`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Assert là `duyNhat ? ["can", can.unit_key] : ["truc", null]`. Biến `can` được chọn bằng `ORDER BY floor, unit_key LIMIT 1` ở dòng 37, câu chọn không bắt tầng đó chỉ có một căn. Nếu dữ liệu của bản chép có hai căn cùng trục, cùng tầng, ca này lặng lẽ đo «ra trục» thay cho ô E5 «trục + căn cùng trục ra căn». Ô mức căn khi đó không được đo mà ca vẫn xanh, và không có assert nào ghim `duyNhat === true`.
  rationale: AC-5 có ô «trục và căn cùng trục ra căn»; ca có thể lặng lẽ đo ô «ra trục» thay vì ô đó.

- **Hình dạng 3 (quan hệ lọc bằng chính đầu ra đang kiểm): ô đầu–cuối chỉ xét tin mà view đã đánh status='gan'**
  file: `pipeline/tests/ghep-tin-truc-can-131.itest.mjs:147`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Câu chọn tập tin để so có `WHERE ... AND u.status = 'gan'` trên chính view offer_unit đang kiểm. Một tin có một trục nhất quán mà view đánh nhầm 'xung_dot' bị loại khỏi `tin` trước khi so, nên `sai` vẫn rỗng. Lời hứa của E5 là «mọi dòng ghep-can-* sống của tin không xung đột hiện ở đúng một dòng offer_unit mức sâu»: «không xung đột» phải suy từ phát biểu (một trục), không được lấy từ đầu ra của view. Ngoài ra, ba bài rút từ bản chép mà hợp đồng nêu (cùng trục; trục + tầng; hai trục → xung_dot) không có ca riêng. Ca hai trục ra xung_dot không có trong ô đầu–cuối.
  rationale: AC-5 đòi mọi dòng ghep-can-* sống của tin không xung đột hiện đúng một dòng mức sâu, nhưng phép đo lọc bằng chính đầu ra của view nên bỏ sót ca view đánh nhầm xung đột.

- **Hình dạng 5 (tuyên trên lượt nạp thật, chỉ có điểm-case tổng hợp): E6 «lượt nạp thật: 0 dòng ghep-can-* bị rút thay-boi-luot»**
  file: `_acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh:4`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E6 hứa: một lượt nạp thật trên bản chép thì 0 dòng ghep-can-* bị rút với lý do thay-boi-luot, và chiều đỏ là «ca lượt nạp đỏ, ghim số dòng bị rút». Mẫu tên ca của chay-lai.sh không gồm `luot-nap-that`. Hai ca luot-nap-that-* trong ghep-tin-truc-can-ghi.itest.mjs không đếm retract_reason = 'thay-boi-luot'. Chiều đỏ chỉ đến từ ca tổng hợp «cau-rut-thay-boi-luot-chua-dong-ghep-can» (dòng 85–106): ca này chèn tay một dòng trên một bài, thông điệp ghim một id chứ không ghim số dòng bị rút. Lời hứa trên toàn lượt nạp thật vì thế không có phép đo.
  rationale: AC-6 nêu rõ một lượt nạp thật trên bản chép phải có 0 dòng ghep-can-* bị rút lý do thay-boi-luot, nhưng chưa có phép đo trên lượt nạp thật.

- **Hình dạng 4 (thông điệp không ghim đúng thứ hứa): phép so offer_building trước/sau không gọi tên offer_id**
  file: `pipeline/tests/ghep-tin-truc-can-131.itest.mjs:169`
  severity: low
  AC: AC-7
  source: measurement
  detail: E7 hứa: bản đột biến đổi một dòng đầu ra thì phép so đỏ và «gọi tên offer_id». Assert là `deepEqual({h,n})` của md5 trên toàn bảng, thông điệp `offer_building sau 131 khác 117: ${cu.n} → ${moi.n} dòng`. Đột biến «vung-sai» giữ nguyên số dòng, nên thông điệp in «N → N dòng» và không nêu tin nào lệch. Probe offer-building-nhanh.sh chỉ grep chuỗi tiền tố đó.
  rationale: AC-7 chiều đỏ đòi phép so đỏ và gọi tên offer_id khi một dòng đầu ra bị đổi; thông điệp hiện chỉ in số dòng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 1 (đo văn bản mã thay vì hành vi): ca đọc nguồn transform-zalo.mjs**
  Người dùng thấy gì: Có một phép kiểm thừa có thể báo đỏ nhầm khi đội đổi tên hay cách viết mã dù chức năng không đổi. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ gây phiền cho người phát triển khi kiểm tra báo đỏ giả, không làm mất hay lộ dữ liệu, và chức năng thật đã có phép kiểm riêng.
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 6 (đường dẫn cứng về checkout chính): THE_CAI mặc định trỏ ~/dev/onehub-invest**
  Người dùng thấy gì: Khi chạy phép chấm độ đúng của việc gắn trục ở một máy hay một bản làm việc khác, nó có thể đọc tệp nhãn ở chỗ cố định của máy chính thay vì bản đang kiểm. Kết quả chấm có thể dựa trên tệp không đúng bản.
  Căn cứ: Không ảnh hưởng người dùng cuối, người chạy tự đặt lại đường dẫn được, và tệp nhãn sai bản vẫn bị lộ vì chấm kèm đối chiếu băm.
  file: `_acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghep-tin-vao-truc-can/probes/chay-lai.sh, _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
