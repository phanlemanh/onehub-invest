# PL30 `chon-model-theo-o` — đọc gộp tin S03 với bảng chọn model theo ô

Ngày: 2026-11-07 · Hạng T2 · Hồ sơ `_acceptance/chon-model-theo-o/` · Cổng Đáng: Mạnh ký «build · archive · ngưỡng theo đề xuất».

## Bối cảnh

- Lượt đo 06–07/11 (script `agent/scripts/doc-gop-3-model-s03.ts`, prompt `dg3-s03-v3`, 0,75 USD) cho thấy một lời gọi đọc
  gộp chữ bài + mọi ảnh + thẻ nhóm ra đủ 17 ô của biểu mẫu nhãn tốt hơn hẳn hai đường hiện hành:
  - Haiku 5.5 đúng 96% gộp 17 ô trên 23 thẻ test;
  - Bộ đọc 35–91% theo ô, Haiku chỉ đọc chữ `dtb-s03-v1` 43–96%.
- Mạnh chốt 07/11: «xây dựng tính năng để có thể dễ dàng thay đổi các model và hiện tại sử dụng haiku».
- Câu chặn của hàng (`bat_khi`): đổi model của một ô chỉ bằng bảng chọn, không sửa code bộ đọc.

## Thiết kế

### 1. Bảng chọn — `agent/config/doc-gop-s03.json`

```json
{
  "phien_ban": 1,
  "mac_dinh": "haiku",
  "model": {
    "haiku":    { "gateway": "anthropic/claude-haiku-5.5",        "gia_vao": 0.10, "gia_ra": 0.50 },
    "glm":      { "gateway": "zai/glm-5.3-flash",                 "gia_vao": 0.15, "gia_ra": 0.50 },
    "deepseek": { "gateway": "deepseek/deepseek-v4.1-flash-1017", "gia_vao": 0.30, "gia_ra": 1.20 }
  },
  "o": { "bathrooms": "nguoi" }
}
```

- `o`: ô → khoá model, hoặc `"nguoi"` (người duyệt). Ô không khai dùng `mac_dinh`.
- Đơn giá chỉ dùng để ước trước khi gọi. Số thật lấy `gateway.cost` của Gateway trả về.
- Tệp được kiểm khi nạp, sai thì lệnh dừng trước lời gọi đầu và gọi tên chỗ sai:
  - ô lạ ngoài 17 ô;
  - khoá model không khai, hoặc model thiếu mã Gateway hay đơn giá;
  - mã Gateway ngoài ba mã Mạnh duyệt. Danh sách ba mã nằm trong mã nguồn, theo ADR-0007 sửa đổi 06/11: «Model khác
    cần lời mới của Mạnh».
- Cờ gửi nằm trong mã, theo mã Gateway, bảng không tắt được:
  - mọi lời gọi có `zeroDataRetention` và `disallowPromptTraining`;
  - DeepSeek chỉ qua nhà cung cấp `baseten`, như KC3.
- Theo Hỏi-3 (khuyến nghị): thêm `agent/config/doc-gop-s03.json` vào `risk_tiers.t1_skip_globs`. Khi đó đổi model là một
  PR nhỏ chỉ đổi tệp này, không cần hồ sơ nghiệm thu mới; CI và branch protection vẫn chạy.
- Băm SHA-256 của tệp (`cau_hinh_sha`) ghi vào từng dòng nhãn để biết nhãn sinh từ bảng nào.

### 2. Bộ đọc — `agent/src/enrich/doc-gop-s03/`

| Tệp | Việc |
|---|---|
| `cau-hinh.ts` | Nạp và kiểm bảng chọn. `keHoach(cauHinh)` trả các nhóm `{model, o[]}`: mỗi model khác nhau một lời gọi, ô `nguoi` không thuộc nhóm nào. |
| `prompt.ts` | Prompt `dg3-s03-v3` chép nguyên từ script đo (17 ô, quy ước, từ điển). `PROMPT_SHA`. `tinNhan(the)` dựng tin nhắn: tên nhóm, thẻ nhóm, chữ bài nguyên văn, ảnh tệp. |
| `the.ts` | Đọc thẻ từ DB (chỉ đọc): chữ của tin chữ đã ghép (`chu_ref`), ảnh tệp snapshot theo thứ tự màn gắn nhãn, thẻ nhóm `collection_units.note`. Ảnh chỉ có URL không tải, đếm vào `anh_thieu`. Không đọc `sender_*`. |
| `doc.ts` | `hoiGop(model, the)`: một lời gọi qua Gateway, cờ gửi theo mã Gateway (ZDR, không huấn luyện, DeepSeek chỉ qua Baseten). Không ném lỗi; lỗi thành `error_kind`. `gop(ketQua, keHoach)` lấy mỗi ô từ model được giao. `kiemTrich`: ô căn cứ `chu_bai` mà câu trích không có trong chữ bài thì `trich_ok=false`. |
| `cham.ts` | Hàm thuần chuẩn hoá và so với nhãn vàng (chuyển từ script đo). Bảng ô × model: đúng, phủ, đọc thừa, JSON hỏng, USD, giây. |

### 3. Lệnh — `agent/scripts/doc-gop-s03.ts`

- `chay --lat <lat> | --post <id,…> [--tran-usd 1]`:
  - đọc tập bài (lát nhãn hay danh sách bài), ước USD trước;
  - ước vượt trần thì dừng, 0 lời gọi;
  - gọi theo kế hoạch, ghi `silver_labels` + `ai_calls`;
  - chạm trần giữa lượt thì dừng và báo.
  - Không có đường chạy toàn S03 (Hỏi-1).
- `cham --split test|dev [--tran-usd 0.2] [--ra <tệp>]`:
  - chấm trên lát `s03-theo-nhom` bằng đúng bộ đọc;
  - không ghi DB, ghi bảng ra tệp;
  - `--tom-tat <tệp>` ghi bản tóm tắt chỉ có số (không chữ bài) làm bằng chứng AC-10: `prompt_sha`, `cau_hinh_sha`,
    `ma_sha` (băm mã bộ đọc, bộ chấm, lệnh), `dung`, `mau_so`, `dung_gop`, `usd_the`, `anh_thieu` theo thẻ, `dung_gop_bo_9991`.
  - `dung_gop` = ô đúng / ô giao model (16 ô với bảng mặc định, bỏ ô người duyệt). Mốc lượt 07/11 theo công thức này là 96,7%.
  - Đạt từ 92%. Từ 90% đến dưới 92% là vùng xám, Mạnh phán ở Cổng Bằng chứng. Dưới 90% là chết.

### 4. Dòng nhãn bạc

Mỗi lời gọi ghi một dòng `silver_labels`:
- `model = gateway:<mã>`, `prompt_version = dg3-s03-v3`;
- `listing_intent` / `kind` lấy từ ô được giao (ô giao người hay model khác thì `unknown` / null);
- `probabilities`:

  ```
  { nguon: "doc-gop", cau_hinh_sha, o_duoc_giao: [...], o: {17 ô {v, cc, trich, trich_ok}},
    so_anh, anh_thieu, finish, token_vao, token_ra }
  ```
- `json_ok`, `error_kind`, `cost_usd` (Gateway), `latency_ms`, `run_id`.

Ràng buộc `silver_labels_mot_nhan` (bài, chữ, model, prompt) giữ một dòng một model một bài. Ghi theo cùng luật với
`dtb-s03-v1`: dòng JSON hỏng được đọc lại, dòng tốt giữ nguyên, chi phí cộng dồn. Mỗi lời gọi ghi thêm một dòng `ai_calls`
(`viec = doc-gop-s03`).

Không ghi bảng nào khác (luật 7).

## Đã cân

- **Bảng trong DB:** phải thêm migration (đường T3). Đổi qua màn Ops để hàng sau nếu cần.
- **Prompt riêng cho từng ô:** mất số đo 07/11 và gọi tới 17 lần một bài.
- **Tải ảnh URL trong bộ đọc:** tải ảnh là việc thu thập (làn ZCode). Lượt đo 07/11 có tải 9 ảnh URL, nên thẻ 9991
  (mọi ô đọc từ ảnh) có thể tụt điểm trên đường mới. Giới hạn này sẽ ghi ở báo cáo.
- **Sinh đề xuất theo ô hay thẻ duyệt:** Hỏi-2. Khuyến nghị để hàng GC2/GC3.

## Ba câu hỏi cho Mạnh (Cổng Phạm vi)

- **Hỏi-1:** chạy toàn S03 hằng ngày (khoảng 13–17 USD/ngày). Khuyến nghị: chưa bật trong hàng này; đo trên mẫu 200 bài
  mới trước.
- **Hỏi-2:** chỉ ghi nhãn bạc, chưa sinh đề xuất theo ô hay thẻ duyệt. Khuyến nghị: đồng ý.
- **Hỏi-3:** bảng chọn đặt ở đâu.
  - Khuyến nghị: tệp JSON trong kho, đưa vào `t1_skip_globs`. Đổi model là một PR nhỏ, có lịch sử git, CI chạy.
  - Lối khác: bảng trong DB cộng lệnh hay màn Ops để đổi, không qua PR. Cần migration (T3), hàng lớn hơn.

## Chi phí của vòng

AC-10 cần một lượt chấm Haiku thật trên 23 thẻ test, khoảng 0,04 USD, mỗi lần chấm lại tốn thêm chừng đó. Tính vào trần
20 USD đã duyệt cho việc đo (đã chi 0,75). Sổ: `research-local/do-3-model-s03/chi-phi.jsonl`.
