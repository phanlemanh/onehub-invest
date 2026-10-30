import { notFound } from "next/navigation"

import type { User } from "@/lib/auth"
import { localOnlyTable } from "@/lib/ops-queries"
import { xemNoiDungTin } from "@/lib/ops-access"
import { hienBiDanh, laMoiGioi, motNguoi } from "@/lib/ops/people"
import { getSourceNameEntries } from "@/lib/source-roles"

import { PersonView } from "./person-view"

/** Nội dung /ops/people/[partyKey]. Cloud → cảnh báo, không truy vấn; khoá sai khuôn hay không có → 404. */
export async function PersonContent({ user, partyKey }: { user: User; partyKey: string }) {
  if (process.env.VERCEL === "1" || (await localOnlyTable("parties"))) return <PersonView mode="cloud" partyKey={partyKey} />
  const xem = xemNoiDungTin(user)
  const [nguoi, entries] = await Promise.all([motNguoi(partyKey), xem ? getSourceNameEntries() : Promise.resolve([])])
  if (!nguoi) notFound()
  return (
    <PersonView
      mode="local"
      partyKey={nguoi.partyKey}
      source={nguoi.source}
      status={nguoi.status}
      statusLabel={nguoi.statusLabel}
      moiGioi={laMoiGioi(nguoi.tongTin)}
      aliases={nguoi.aliases.map((a) => ({ ...a, value: hienBiDanh(a.kind, a.value, entries, xem) }))}
      tin={nguoi.tin.map((t) => ({ subjectKey: t.subjectKey, methodLabel: t.methodLabel, tierLabel: t.tierLabel, observedAt: t.observedAt }))}
      tongTin={nguoi.tongTin}
      soVaiRut={nguoi.soVaiRut}
    />
  )
}
