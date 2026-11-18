// s16-bon-phan.mjs — phép cộng của ô «căn S08 có mã trong S16» (DA33 E10). Từ DA37 AC-5 căn S08 lệch toà gộp vào căn S16 thay vì
// ra thẻ, nên tổng gồm thêm phần «gộp». Cộng thiếu hay cộng thừa đều là lệch.
export const duPhan = ({ tong, biDanh, gop, lech, moHo, toaThe }) => biDanh + gop + lech + moHo + toaThe === tong;
