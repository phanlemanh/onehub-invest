import type { User } from "@/lib/auth"
import { dongThuan, tienDo, tinKe } from "@/lib/labels-queries"
import { BAC_VAI, QUYEN_OPS, vaiHieuLuc, xemNoiDungTin } from "@/lib/ops-access"

import { LabelsView } from "./labels-view"

/**
 * Nội dung /ops/labels. Trên cloud (VERCEL=1) KHÔNG gọi truy vấn nhãn — bảng chỉ ở máy thu. Vai dưới `label.write` (viewer)
 * chỉ thấy số và bảng đồng thuận, không lấy tin kế (không đọc chữ tin). Lỗi truy vấn ném lên RegionError (Thử lại).
 */
export async function LabelsContent({ user, lat }: { user: User; lat: string }) {
  if (process.env.VERCEL === "1") return <LabelsView mode="cloud" lat={lat} />
  // Chữ gốc của tin là nội dung tin: chỉ vai đọc được nội dung (xemNoiDungTin) VÀ có quyền ghi nhãn mới nhận tin kế.
  const coGhi = xemNoiDungTin(user) && BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI[QUYEN_OPS["label.write"].vai]
  const [tien, dong, tin] = await Promise.all([
    tienDo(user.id, lat),
    dongThuan(lat),
    coGhi ? tinKe(user.id, lat) : Promise.resolve(null),
  ])
  return <LabelsView mode="local" lat={lat} coGhi={coGhi} tienDo={tien} dongThuan={dong} tin={tin} />
}
