import type { User } from "@/lib/auth"
import { BAC_VAI, QUYEN_OPS, vaiHieuLuc } from "@/lib/ops-access"
import { docDanhMucThe, docTheDiaChi } from "@/lib/the-dia-chi-nhom"

import { GroupCardsView } from "./group-cards-view"

/**
 * Nội dung /ops/group-cards. Thẻ chỉ ở máy thu: trên cloud (VERCEL=1) hay DB chưa áp 108 (hàm đọc trả null) thì dừng ở
 * cảnh báo, không truy vấn danh mục. Khoá nhóm không bao giờ tới đây — hàm đọc chỉ trả mã thẻ. Lỗi truy vấn ném lên
 * RegionError (Alert + Thử lại).
 */
export async function GroupCardsContent({ user }: { user: User }) {
  if (process.env.VERCEL === "1") return <GroupCardsView mode="cloud" />
  const the = await docTheDiaChi()
  if (the === null) return <GroupCardsView mode="cloud" />
  const coQuyet = BAC_VAI[vaiHieuLuc(user)] >= BAC_VAI[QUYEN_OPS["unit.card_decide"].vai]
  const danhMuc = the.length > 0 ? await docDanhMucThe() : { projects: [], wards: [], subzones: [] }
  return <GroupCardsView mode="local" the={the} danhMuc={danhMuc} coQuyet={coQuyet} />
}
