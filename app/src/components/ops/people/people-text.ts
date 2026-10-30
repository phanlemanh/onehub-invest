/** Chữ và kiểu dùng chung của /ops/people — tệp không import truy vấn (pg), an toàn cho thành phần client. */

/** Một hàng của bảng /ops/people sau khi áp quyền xem: `an` = vai không được xem bí danh. */
export type HangNguoi = {
  partyKey: string
  source: string
  soTin: number
  soBiDanh: number
  moiGioi: boolean
  an: boolean
  ten: string | null
  taiKhoan: string | null
  sdtBam: string | null
}

export const AN_VOI_VIEWER = "Ẩn với vai Người xem"
export const LENH_DUNG = "node pipeline/dung-nguoi.mjs"
export const BO_TIM = "Tìm theo tên hay tài khoản chỉ dành cho vai Vận hành — danh sách dưới đây không lọc theo chữ tìm."
