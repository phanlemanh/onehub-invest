# Thẻ ghép căn có tin rời kho tự rút — thiết kế (HD3)

Hàng HD3 `the-ghep-can-tin-roi-kho` (đợt `hang-duyet-3010`, dãy P3, T2). Nguồn: `docs/research/audit-hang-duyet-3010.md`
§2.2 H1 và bảng đề xuất (dòng `the-ghep-can-tin-roi-kho`).

## 1. Vấn đề

PL14 đổi cách băm khoá tin S05. Mười hai thẻ `entity_match` sinh ngày 22/10 vì thế trỏ tới khoá không còn trong
`sale_offers`. Ba bên đọc của thẻ đều theo khoá này, nên thẻ không có ảnh, không có toàn văn, và quyết định của người
duyệt không chạm ứng viên nào (H2). Với `judge-run`, `queryPair` trả `null` → `dem.loi++`: thẻ treo ở hàng chờ, không ai
được báo. Lần đổi khoá kế tiếp, hay khi tin nghỉ, cơ chế này lặp lại.

## 2. Cách làm

Trong `chamMotLuot` (`agent/scripts/judge-run.ts`), với mỗi cặp trong tập chấm (cặp `needs_llm` ∪ thẻ đang chờ):

1. Bước đầu, đổi một chỗ: cặp có thẻ **người** đã quyết → bỏ qua (`boQua`). Thẻ máy đã rút vì tin rời kho
   (`status = 'deferred'` ∧ `decided_by = 'machine:judge-run'`) không tính là người quyết.
2. **Mới — kiểm tin sống:** `SELECT offer_id FROM sale_offers WHERE offer_id = ANY([a, b])`. Thiếu một bên (hoặc cả hai)
   → cặp **rời kho**:
   - rút mọi thẻ đang chờ của cặp bằng một câu `SQL_RUT_ROI_KHO`: `status = 'deferred'`, `decided_by =
     'machine:judge-run'`, `decided_at = now()`, `decision_note = 'tin rời kho: <offer_id>[, <offer_id>] không còn trong kho'`;
     cùng câu ghi một dòng `ops_audit` cho mỗi thẻ rút (`actor 'machine:judge-run'`, `action 'review-queue:rut-roi-kho'`,
     `detail {review_id, item_id, ly_do: 'tin rời kho', roi_kho: [offer_id…]}`);
   - câu khoá mọi thẻ của cặp (`FOR UPDATE`) như `SQL_CAP_NHAT`: người quyết một thẻ giữa lúc đọc và lúc ghi thì không thẻ
     nào bị rút;
   - không gọi `queryPair`, không sinh thẻ mới, không tính vào `loi`. Đếm `roiKho` (số cặp) và `rut` (số thẻ rút).
3. Hai bên sống → nếu cặp có thẻ máy đã rút: **trả lại** (`SQL_TRA_LAI`): `status = 'pending'`, xoá `decided_by`,
   `decided_at`, `decision_note`, ghi một dòng `ops_audit` mỗi thẻ (`action 'review-queue:tra-lai-tin-ve-kho'`), cùng luật
   khoá cặp; đếm `traLai`. Rồi chấm như trước vòng (thẻ vừa trả lại được cập nhật kết quả chấm).

`main` in thêm một dòng `cặp có tin rời kho <roiKho> · thẻ rút <rut> · thẻ trả lại <traLai>`.

Chạy lại: cặp vẫn rời kho → không còn thẻ chờ để rút (không rút trùng, không thêm dòng audit); thẻ máy đã rút giữ nguyên. Cặp `needs_llm`
rời kho không có thẻ → đi bước 2, `rut = 0`, không sinh thẻ.

Thẻ rút không hiện cho người duyệt: bộ lọc mặc định của `/ops/review` là «Chờ duyệt» (`DEFAULT_STATUS_FILTER =
"pending"`, `app/src/lib/ops/review-queue.ts`). Thẻ vẫn còn ở bộ lọc «Đã quyết» với `decision_note` làm lý do.

## 3. Lựa chọn và căn cứ

- **Trả lại khi tin quay lại**: 044 ghi rõ đề xuất của tin rời lượt nạp được «gỡ khi tin quay lại». Rút vĩnh viễn làm một
  đêm nạp thiếu lô xoá cặp thật khỏi hàng duyệt mà không ai biết.
- **`deferred`, không phải `rejected`**: `rejected` nói «khác căn» — sai nghĩa, và route quyết định đọc nó như quyết định
  người. Tiền lệ máy rút thẻ khi tin không còn trong lượt nạp là `deferred` + `decided_by = p_actor` + `decision_note`
  (`db/migrations/044_nap_lai_khong_xoa.sql`).
- **Không đổi `property_candidates`**: judge-run không ghi `property_candidates`/`sale_offers` (luật 7, đầu tệp
  `judge-run.ts`).
- **Không chuyển thẻ sang khoá mới**: việc tin được thay khoá (`superseded_by`) do `nap_lai_khong_xoa` (044) làm lúc nạp;
  judge-run chỉ rút.
- **Rời kho = khoá không có trong `sale_offers`** (view tin sống của 044): đúng câu giao của hàng; không tách «đã nghỉ» và
  «mất khoá».

## 4. Ngoài phạm vi

Cặp lẫn — người quyết thẻ một chiều, thẻ chiều ngược còn chờ, một bên rời kho — giữ nguyên theo luật đã ký «người đã quyết
cặp này — không sửa» (`judge-giu-quyet-dinh-nguoi`); kho local đo 31/10: 0 cặp có thẻ hai chiều. Ngưỡng «sau một lượt đêm»
của hàng chờ Mạnh ở Cổng Phạm vi (Hỏi-1): judge-run chưa có lịch đêm (TV13b).

Lịch chạy đêm của judge-run (TV13b) · Alert «Tin A không còn trong kho» trên thẻ (hàng U1 `the-so-doc-gia-tri-song`) ·
`CAU_DEM_THIEU_THE` vẫn đếm cặp `needs_llm` rời kho chưa từng có thẻ · đo DQ hàng đêm (hàng P4 `do-the-duyet-du-du-lieu`).

## 5. Đo

- `agent/tests/judge-run.test.ts` (DB thử rỗng, thêm `ops_audit` từ 018): ma trận rời kho (A · B · cả hai) × chiều thẻ,
  thẻ người đã quyết, cặp hai bên sống, chạy lại, người quyết giữa chừng, dòng in của `main`.
- `agent/tests/judge-roi-kho.itest.ts` (lô thật, ngoài CI): chép chỉ-SELECT từ `oneinvest` 12 thẻ `entity_match` sinh
  22/10, đặt lại `pending` trong DB thử, cùng tin sống của các khoá trên thẻ; chạy hai lượt.
