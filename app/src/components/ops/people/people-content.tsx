import type { User } from "@/lib/auth"
import { localOnlyTable } from "@/lib/ops-queries"
import { xemNoiDungTin } from "@/lib/ops-access"
import { danhBaTongQuan, danhSachNguoi, type LocNguoi } from "@/lib/ops/people"
import { getSourceNameEntries } from "@/lib/source-roles"

import { hangNguoi } from "./people-rows"
import { PeopleView } from "./people-view"

/**
 * Nội dung /ops/people. Trên cloud (VERCEL=1) hoặc DB không có bảng parties: KHÔNG truy vấn danh bạ (Hỏi-3 của DB2b —
 * bốn bảng chỉ ở máy thu). Bí danh che theo vai và bộ che tên nguồn ngay ở máy chủ. Lỗi truy vấn ném lên RegionError.
 * Vai không xem được bí danh: bỏ chữ tìm ?q= trước khi truy vấn — lọc trên giá trị thô là đường dò bí danh đã che
 * (che-tim-bi-danh-viewer, Hỏi-1); lọc nguồn và phân trang giữ nguyên.
 */
export async function PeopleContent({ user, loc }: { user: User; loc: LocNguoi }) {
  if (process.env.VERCEL === "1" || (await localOnlyTable("parties"))) return <PeopleView mode="cloud" />
  const xem = xemNoiDungTin(user)
  const boTim = !xem && loc.q.trim() !== ""
  const locDung = xem ? loc : { ...loc, q: "" }
  const [tong, ds, entries] = await Promise.all([
    danhBaTongQuan(),
    danhSachNguoi(locDung),
    xem ? getSourceNameEntries() : Promise.resolve([]),
  ])
  return (
    <PeopleView
      mode="local"
      tong={tong}
      loc={{ ...locDung, page: ds.page }}
      coTim={xem}
      boTim={boTim}
      rows={ds.rows.map((r) => hangNguoi(r, entries, xem))}
      total={ds.total}
      page={ds.page}
      pages={ds.pages}
    />
  )
}
