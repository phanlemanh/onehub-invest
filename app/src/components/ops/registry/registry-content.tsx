import { localOnlyTable } from "@/lib/ops-queries"
import { cheChuaNoi, dungCay } from "@/lib/ops/registry/cay"
import { docDanhBa } from "@/lib/ops/registry/doc"
import { getSourceNameEntries } from "@/lib/source-roles"

import { RegistryView } from "./registry-view"

/**
 * Nội dung /ops/registry. Trên cloud (VERCEL=1) hoặc DB không có bảng `buildings`: KHÔNG truy vấn danh bạ — bảng vật thể
 * chỉ ở máy thu (ADR-0016). Tên và bí danh qua bộ che tên nguồn ngay ở máy chủ. Lỗi truy vấn ném lên RegionError.
 */
export async function RegistryContent() {
  if (process.env.VERCEL === "1" || (await localOnlyTable("buildings"))) return <RegistryView mode="cloud" />
  const [danhBa, entries] = await Promise.all([docDanhBa(), getSourceNameEntries()])
  return (
    <RegistryView
      mode="local"
      tong={danhBa.tong}
      rows={dungCay(danhBa.nut, danhBa.tinh, entries)}
      chuaNoi={cheChuaNoi(danhBa.chuaNoi, entries)}
    />
  )
}
