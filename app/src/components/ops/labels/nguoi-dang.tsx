/**
 * Đoạn « · Người đăng: <tên> · ID <id>» trên dòng đầu thẻ gắn nhãn (hàng the-gan-nhan-nguoi-dang). Tên trùng giữa nhiều
 * người nên ID mới là định danh; ID chọn trọn bằng một chạm để chép. Thiếu tên thì chỉ ID, thiếu cả hai thì không có gì.
 */
export function NguoiDang({ ten, id }: { ten?: string | null; id?: string | null }) {
  if (!ten && !id) return null
  return (
    <>
      {` · Người đăng: ${ten ? ten : ""}`}
      {id ? (
        <>
          {ten ? " · " : ""}ID <span className="select-all tabular-nums" data-labels-nguoi-dang-id="">{id}</span>
        </>
      ) : null}
    </>
  )
}
