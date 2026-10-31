# Thiết kế: bộ nhận loại tin S03 theo bối cảnh nhóm (s03-nhan-loai-tin-rong, RM1)

Hồ sơ: `_acceptance/s03-nhan-loai-tin-rong/` · hạng T2 · dãy U1 · nguồn: giám sát 31/10 (Mạnh «Giao U1 sửa»; «toàn bộ group
đã tham gia đều là mua bán»; «nên tin họ mặc định là mua bán và cho thuê thiếu bối cảnh group») · mục tiêu ra mắt 05/11:
S03 200 tin mới/ngày (`docs/ROADMAP.md`).

## Vấn đề (đo DB máy thu 31/10, chỉ đọc)

`parsePost` chỉ gán `kind` khi bài có chữ «cho thuê…» hay «bán…»; bài thiếu chữ bị `nFail` bỏ ở `runTransformZalo`.
38.104 bài S03: 10.812 có loại (5.940 bán · 4.872 thuê), 27.292 bỏ. Trong số bỏ: 1.801 có giá tỷ + dấu hiệu BĐS,
5.771 có giá triệu + dấu hiệu BĐS, ~2.300 Yêu cầu (khách tìm/xem — bên mua), còn lại không phải tin rao. 30.001 bài thuộc
một nhóm chưa có tên trong sổ nhóm — suy mục đích nhóm từ tên chỉ phủ phần nhỏ.

## Cách làm

Giữ nguyên `parsePost` (chữ bài, cùng các test hiện có). Thêm bước **suy loại** ở transform, chỉ chạy khi `pr.kind` rỗng —
bài đã có loại không bao giờ đổi:

1. **Yêu cầu → không thành tin rao** (`listing_intent = inquiry`, CONTEXT.md; bài giữ ở raw + stg làm tín hiệu cầu, không xoá; `kind` rỗng): «cần mua/thuê/tìm», «tìm mua/thuê/căn/nhà», «khách … tìm/xem/cần» trong cùng câu
   ngắn, «anh chị/ai có căn (gửi)». Xét TRƯỚC mọi tín hiệu.
2. **Cửa vào**: bài phải có giá (`priceVnd` hay `pricePerm2Vnd`) VÀ dấu hiệu BĐS (PN/WC, «N+1», diện tích m², căn hộ,
   studio, chung cư, shophouse, nhà phố…). Thiếu một → giữ rỗng (không thêm rác).
3. **Đơn vị giá thuê** (nguồn `don-vi-gia`), xét TRƯỚC tín hiệu bán: giá đơn vị triệu dưới 1 tỷ, không kèm «/m²», bài không
   có chữ «tỷ» — hay «/tháng», «pass» → `rent_lt`. «chuyển nhượng HĐ thuê 2PN 14tr», «2PN giá tốt 12tr» là thuê.
4. **Tín hiệu bán** (nguồn `tin-hieu-chu`): giá đơn vị tỷ, «thu về», «cắt lỗ», «hạ giá», «giá tốt», «chuyển nhượng»,
   «bao thuế phí/BTP», «sổ hồng/đỏ» → `sale`. KHÔNG dùng «CN» trần (đọc thành «chủ nhật»).
5. **Bối cảnh nhóm** (nguồn `boi-canh-nhom`) chỉ khi bước 3–4 không quyết: mục đích nhóm suy từ tên (có «chuyển
   nhượng|bán|giỏ hàng|quỹ» mà không «cho thuê» → bán; ngược lại → thuê) rồi từ tỉ lệ loại chữ bài của nhóm trên mọi bài
   của lượt — lượt đêm nạp lại toàn bộ `stg_zalo_posts`, nên tỉ lệ là trên lịch sử nhóm (≥ 20 bài, ≥ 85% một loại);
   không rõ → «cả hai» → giữ rỗng. Đo 31/10 theo thứ tự này: bước 5 quyết 7 bài, giữ rỗng 12 bài (trên 38.104).
6. **Nguồn suy loại** đi cùng bài tới khi gộp tin; `runTransformZalo` trả và in một dòng đếm theo nguồn (`chu-bai`,
   `tin-hieu-chu`, `don-vi-gia`, `boi-canh-nhom`, `yeu-cau`, `bo`) — Hỏi-1 về chỗ lưu cho thẻ duyệt.
7. **Đường rút**: tin chỉ gồm bài suy loại mà lượt sau không còn (tắt suy loại) bị `reconcile_stale_offers` rút
   (`retired_at`), không xoá — tắt luật là gỡ được (AC-9).
8. **Gộp đăng lại**: `repostKey` không đổi (kind|phường|giá|DT|PN khi đủ phường + DT). Đo trên DB thật: số nhóm gộp có
   ≥ 2 bài khác số phòng ngủ hay khác diện tích = 0.
9. **Đường đo nhãn**: `label-sample.mjs` lấy lát `s03-loai-tin` phân tầng ba phần bằng nhau (bài chữ bài, bài mới nhận, bài vẫn bỏ — tầng tính lại bằng chính parsePost + suy loại) để người
   gắn nhãn ở `/ops/labels` (trường «Loại tin», «Ý định tin») — Hỏi-2.

## Phương án đã loại

- **Mô hình phân loại / LLM** (trang tri thức «đọc tin S03» khuyên về lâu dài): chưa có tập nhãn để hiệu chuẩn, và luật 7
  cấm LLM ghi dữ liệu không qua người — luật xác định là lối sống hôm nay; tập nhãn của bước 8 là tiền đề cho mô hình sau.
- **Cột mục đích nhóm ở sổ nhóm, sửa ở /ops** — cần migration + màn; giám sát thu vùng về transform → RM2 (chờ điều kiện).

## Ngoài phạm vi

- Lưu nguồn suy loại xuống DB để thẻ duyệt hiện (theo Hỏi-1).
- Sửa `parsePost` (ý định tin — việc của PL5).
- Thêm nhóm S03 (làn ZCode).
