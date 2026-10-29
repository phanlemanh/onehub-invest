// render.tsx — dựng markup tĩnh của hai component trang Thu thập bằng props cố định (hồ sơ wanted-thanh-inquiry AC-7).
// Dùng chung cho test tu-ngu-collections.test.tsx (component hiện tại) và răng fixture-goc.mjs (component ở sha main lúc
// chụp, lấy bằng git show). Chạy trực tiếp: `node --import tsx render.tsx <đường sync-activity> <đường collections-tiles>`
// → in JSON {sync, tiles}. Không DB, không git.
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { pathToFileURL } from "node:url"

export const ROLES = { S01: "Tự thu", S03: "Cộng đồng" }
export const DAYS = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"]
  .map((day, i) => ({ day, airbnbListingsSeen: 3, airbnbSnapshots: 1, zaloPosts: 4 + i, zaloOffers: 1 + (i % 2) }))
  .reverse()
export const FUNNEL = {
  lastEventAt: "2026-10-25T03:00:00Z",
  today: { messages: 7, passed: 5, skipped: 2, accepted: 3, media: 1 },
  last7: { messages: 40, passed: 30, skipped: 10, accepted: 20, media: 5 },
}

/** Markup của SyncActivity và CollectionsTiles nạp từ hai đường tệp cho trước. */
export async function renderHai(syncPath: string, tilesPath: string, roles: Record<string, string> = ROLES) {
  const { SyncActivity } = await import(pathToFileURL(syncPath).href)
  const { CollectionsTiles } = await import(pathToFileURL(tilesPath).href)
  return {
    sync: renderToStaticMarkup(<SyncActivity days={DAYS} roles={roles} />),
    tiles: renderToStaticMarkup(
      <CollectionsTiles feeds={[]} funnel={FUNNEL} layers={[]} agentTurnsToday={0} roles={roles} />,
    ),
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [sync, tiles] = process.argv.slice(2)
  renderHai(sync, tiles).then((m) => process.stdout.write(JSON.stringify(m)))
}
