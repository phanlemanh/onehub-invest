import type { User } from "@/lib/auth"
import { LAT_CUON_CHIEU } from "@/lib/labels-cuon-chieu"
import { bangTruongHop, doiChieu } from "@/lib/labels-luot-hai"
import { dongThuan, nhomCuaLat, tienDo, tinKe } from "@/lib/labels-queries"
import { BAC_VAI, QUYEN_OPS, vaiHieuLuc, xemNoiDungTin } from "@/lib/ops-access"

import { LabelsView } from "./labels-view"

/**
 * Nội dung /ops/labels. Trên cloud (VERCEL=1) KHÔNG gọi truy vấn nhãn — bảng chỉ ở máy thu. Vai dưới `label.write` (viewer)
 * chỉ thấy số và bảng đồng thuận, không lấy tin kế (không đọc chữ tin). Lỗi truy vấn ném lên RegionError (Thử lại).
 * Lát có nhóm đi biểu mẫu 17 trường; lát đời trước (`nhomCuaLat` rỗng) giữ chín trường của PL7. `xem` mở lượt hai của một bài,
 * `doiChieu` trả null khi người gọi chưa lưu bài đó, nên tham số này không mở được giá trị máy ở lượt một.
 */
export async function LabelsContent({ user, lat, nhom, xem }: { user: User; lat: string; nhom?: string; xem?: number }) {
  if (process.env.VERCEL === "1") return <LabelsView mode="cloud" lat={lat} />
  // Chữ gốc của tin là nội dung tin: chỉ vai đọc được nội dung (xemNoiDungTin) VÀ có quyền ghi nhãn mới nhận tin kế.
  const coGhi = xemNoiDungTin(user) && BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI[QUYEN_OPS["label.write"].vai]
  // Lát mẫu soát (DO1) chia theo ngày, không theo nhóm: không có bộ chọn nhóm.
  const dsNhom = lat === LAT_CUON_CHIEU ? [] : await nhomCuaLat(user.id, lat)
  // Nhóm mặc định: nhóm đầu còn bài cho người này; ai gắn hết thì nhóm đầu.
  const chon = dsNhom.length
    ? (dsNhom.find((n) => n.unitCode === nhom) ?? dsNhom.find((n) => n.conChoToi > 0) ?? dsNhom[0]).unitCode
    : null
  const [tien, dong, tin, bang, luotHai] = await Promise.all([
    tienDo(user.id, lat, undefined, chon),
    dongThuan(lat),
    coGhi ? tinKe(user.id, lat, undefined, chon) : Promise.resolve(null),
    chon ? bangTruongHop(lat) : Promise.resolve([]),
    coGhi && xem ? doiChieu(user.id, xem) : Promise.resolve(null),
  ])
  return (
    <LabelsView mode="local" lat={lat} coGhi={coGhi} tienDo={tien} dongThuan={dong} tin={tin} nhom={dsNhom} chon={chon} bang={bang} luotHai={luotHai} />
  )
}
