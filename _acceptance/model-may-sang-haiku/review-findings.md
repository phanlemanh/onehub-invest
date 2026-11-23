## Trong hợp đồng

- **E5 vẫn ghi judge-run thoát 4, có dòng tổng kết và dòng ai_calls, nhưng ca mới không đo ba thứ này (recordCall bị thay bằng hàm rỗng)**
  file: `_acceptance/model-may-sang-haiku/evals.yaml:42`
  severity: medium
  AC: AC-5
  source: conventions
  detail: Câu đầu của `expected` ở E5 vẫn ghi «enrich-run và judge-run với --tran-usd đủ cho đúng k lời gọi: chạy đúng k lời gọi, thoát 4, dòng tổng kết nêu đã chi và trần; ai_calls có k dòng mang <đường>:<mã gọi>…». AC-5 trong contract.md cũng đòi «mỗi lời gọi đã chạy có một dòng ai_calls». Vòng này thêm câu nói rõ judge-run được đo qua chamMotLuot, nhưng không sửa câu đầu, nên E5 tự mâu thuẫn và nói quá những gì lệnh của nó đo.

  Với judge-run, ba điều trong câu đầu không có ca nào kiểm:
  (1) Mã thoát 4 và dòng «✗ hết trần» không thể xảy ra: `main()` của agent/scripts/judge-run.ts dừng ngay sau `if (JUDGE_RUN_DONG_BANG) return;`, nên CLI luôn thoát 0.
  (2) Không ca nào chạy CLI judge-run với `--tran-usd` (đường `tranTuArgv`).
  (3) Dòng ai_calls `anthropic:claude-haiku-5-5` của judge-entity không được kiểm: `chamVoiTran` trong agent/tests/tran-tien-agent.itest.ts (khoảng dòng 212) truyền `recordCall: async () => {}`, nên đường ghi sổ thật (`recordCallDb`, ghi model `<đường>:<mã gọi>` và token) bị bỏ qua hoàn toàn. Ca chỉ khẳng định model trong `gw.yeuCau` và `dem.hetTran`. Nếu đường ghi sổ của judge-entity hỏng (sai nhãn model, thiếu token), ca vẫn xanh trong khi E5 tuyên bố đã phủ.

  Cách sửa gợi ý:
  - Viết lại câu đầu của E5 để phần thoát 4, dòng tổng kết và ai_calls chỉ áp cho enrich-run. Với judge-run, ghi rõ CLI đóng băng (V7) nên chỉ đo chamMotLuot.
  - Hoặc bỏ `recordCall` rỗng để chamMotLuot dùng `recordCallDb` trên DB thử, rồi đếm 2 dòng ai_calls có model `anthropic:claude-haiku-5-5` và token vào, ra, giống ca enrich-run.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **agent/CLAUDE.md ghi sai đường gọi mặc định và nói có cờ không giữ dữ liệu, trong khi đường mặc định không có cờ đó (r2)**
  Người dùng thấy gì: Tài liệu hướng dẫn nói tin gửi đi luôn có cờ không giữ dữ liệu, nhưng đường gọi mặc định không có cờ này. Người đọc có thể tin dữ liệu được bảo vệ hơn thực tế.
  Căn cứ: Hành vi thật đã được Mạnh chấp nhận, chỉ có chữ mô tả sai nên không mất hay lộ dữ liệu thêm; sửa chữ rất rẻ nhưng nên làm sớm vì chạm quy tắc về dữ liệu.
  file: `agent/CLAUDE.md`
  severity: medium
  Đề xuất: known-limits

- **Đường anthropic chạy tool bằng input model trả về mà không kiểm theo inputSchema (r2)**
  Người dùng thấy gì: Nếu sau này có agent dùng công cụ, tham số do model trả về sẽ không được kiểm trước khi chạy. Hiện chưa agent thật nào bị ảnh hưởng.
  Căn cứ: Hiện chưa có agent thật dùng công cụ nên chưa gây hại cho người dùng; chỉ cần ghi lại để xử lý khi có agent có công cụ.
  file: `agent/src/runtime/loop.ts`
  severity: low
  Đề xuất: known-limits

- **do-truoc-sau.mjs: so isMain không qua realpath, lệch đường dẫn thì thoát 0 mà không kiểm gì (E8 qua giả) (r2)**
  Người dùng thấy gì: Khi chạy bộ kiểm trước/sau qua một đường dẫn có liên kết tắt, nó có thể báo xanh mà thực ra không kiểm gì. Người ký nghiệm thu có thể tin nhầm là đạt.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của phép đo chứ không ảnh hưởng người dùng cuối; chạy lại bằng đường dẫn thật là tránh được và sửa rất rẻ.
  file: `_acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phần ước chi lời gọi kế bỏ qua system prompt, nên không phải cận trên như comment và AC-5 khẳng định (r2)**
  Người dùng thấy gì: Ước tính tiền trước mỗi lời gọi bỏ sót phần hướng dẫn hệ thống, nên trần tiền có thể bị vượt một lượng rất nhỏ.
  Căn cứ: Số tiền lệch cực nhỏ vì đã ước dư phần đầu ra, không mất dữ liệu; có thể ghi nhận và sửa sau với chi phí thấp.
  file: `agent/src/runtime/model-agent.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — AC-4 hứa cắt chữ bài đúng 500 ký tự, phép đo chỉ kiểm có mặt và vắng mặt của chuỗi, để lọt tới khoảng 594 ký tự (r2)**
  Người dùng thấy gì: Bộ kiểm không phân biệt được cắt đúng 500 ký tự với cắt dài hơn một chút, nên nếu mã lệch ngưỡng thì có thể gửi thêm vài chục ký tự chữ bài mà không bị phát hiện.
  Căn cứ: Chữ bài vốn được phép gửi cho model nên phần dư không lộ thêm loại dữ liệu cấm; sửa phép đo rẻ nhưng hậu quả nhẹ.
  file: `agent/tests/du-lieu-gui-agent.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — AC-10 dùng đầu ra «dạng Haiku» viết tay, không rút từ đầu ra Haiku thật đã thu trong so-truoc-sau.json (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một số ít tin rao nhiều căn khiến model trả danh sách, và hệ thống sẽ coi là không đọc được nên không ghi đề xuất cho các tin đó.
  Căn cứ: Tin không đọc được chỉ bị bỏ qua và được đếm, không ghi sai dữ liệu; chỉ khoảng 4 trên 100 tin mẫu, sẽ thử lại hoặc cải thiện sau.
  file: `agent/tests/tran-tien-agent.itest.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
