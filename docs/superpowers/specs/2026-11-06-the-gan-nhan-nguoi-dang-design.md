# Thẻ gắn nhãn hiện người đăng — thiết kế

Giao: Mạnh hỏi khi đang gắn «Ko lấy được Người đăng bài hả?», rồi «Xem coi có lấy được id ko?»; giám sát giao, đi trước việc chặn dòng trùng cụm, 06/11.

## Vì sao

Thẻ `/ops/labels` hiện nhóm và giờ đăng nhưng không hiện người đăng, trong khi ô `seller_name` của biểu mẫu theo nhóm gợi ý «Như người đăng». Người gắn phải đoán. Giám sát đo: 367/367 dòng lát `s03-theo-nhom` có `stg_zalo_posts.sender_name`. Đây là chữ gốc ở stg, không phải giá trị máy đọc ra, nên không phá gắn mù. 367/367 dòng có `sender_id` (số 17–19 chữ số); 2 tên mang nhiều ID, 1 ID mang nhiều tên, nên ID mới là định danh, tên chỉ để đọc. ID người đăng là tầng C (AGENTS.md luật 6, sửa đổi 23/10), chỉ hiện trong `/ops/**`.

## Cách làm

1. `tinKe` (`app/src/lib/labels-queries.ts`) lấy thêm `sender_name`, `sender_id` của bài; `docThe` (`app/src/lib/labels-cum.ts`) chọn người đăng: dòng ghép có tin chữ thì của tin chữ (`ghep.chu_ref`), còn lại của chính bài. Giờ đăng trên thẻ đi theo cùng bài đó (thẻ ghép: giờ của tin chữ), vì Mạnh tìm người trong nhóm S03 bằng tên cùng giờ đăng tới phút (app của kênh S03 không hiện ID); `fmtVnDateTime` đã in tới phút.
2. Tên qua `maskSourceNames` với danh sách của `getSourceNameEntries` (`app/src/lib/source-roles.ts`), như các chỗ che chữ chạy khác: tên thật của nguồn thành mã S0x; danh sách rỗng hay không đọc được thì bộ che trả null và thẻ không hiện người đăng (đóng chặt). Tên rỗng cũng không hiện. ID không qua bộ che (chỉ là số).
3. `TinGan` thêm `nguoiDang: string | null` và `nguoiDangId: string | null`. Hai màn lượt một (`labels-view.tsx`, `label-form-nhom.tsx`) chèn « · Người đăng: <tên> · ID <id>» vào dòng đầu thẻ, giữa nhóm và giờ đăng; thiếu tên thì « · Người đăng: ID <id>», thiếu cả hai thì không có đoạn này. ID nằm trong `span` có `select-all tabular-nums` để chọn trọn bằng một chạm. Không component mới.
4. Không SĐT, không `conversation_id` lên trình duyệt.

Không migration, không đổi route (`app/src/app/api/v1/ops/labels/route.ts` chỉ chuyển `tin`), không khởi động lại dev :3456.

## Thêm: lỗi theo ô sau lần lưu

Mạnh gặp khi gắn: ô Diện tích đã tick «Không suy ra được» mà vẫn hiện «Diện tích phải là số» từ lần lưu trước, tưởng màn từ chối. `label-form-nhom.tsx` chỉ đặt `loi` khi lưu, không xoá khi sửa ô. Sửa: `dat(f, …)` bỏ lỗi của đúng ô; hai đầu giá kiểm cùng nhau nên sửa một đầu hay đổi đơn vị giá bỏ lỗi cả hai. Luật kiểm của `labels-normalize.ts` không đổi. Giám sát giao thêm vào cùng lượt, 06/11.

## Không làm

- Lượt hai (`luot-hai.tsx`): dòng đầu bảng so giữ nguyên; người gắn đã thấy người đăng ở lượt một.
- Điền sẵn ô `seller_name` từ người đăng: đổi cách gắn, cần Mạnh quyết riêng.
- Hiện SĐT người đăng trên thẻ.
