/**
 * Lệnh đếm của bộ thu S17 — đọc THẲNG TỪ MANIFEST của các snapshot thô, không cần DB (mốc ngày 1,
 * claudedp-2411-20: «mỗi kind một lệnh đếm qua manifest»).
 *
 *   node collector/dist/collectors/s17-thua-dinh-gia/count.js --snapshots-root <thư mục snapshot> [--kind <kind>] [--json]
 *
 * Chỉ tính snapshot mang dấu hiệu khuôn 2 (S17_NOTES); bản ghi khuôn 1 lúc dựng bộ thu được đếm riêng và
 * bỏ qua. Mỗi tệp được kiểm sha256 trước khi giải nén (DATA-CONTRACT, quy tắc tiêu thụ mục 2).
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { parseArgs } from "node:util";
import { gunzipSync } from "node:zlib";
import type { SnapshotManifest } from "../../core/types.js";
import { projectIdOf } from "./kinds.js";
import { S17_CITY, S17_NOTES, S17_SOURCE } from "./store.js";

export type SourceSnapshot = {
  snapshotId: string;
  manifest: SnapshotManifest;
  items: Array<{ kind: string; sourceId: string; payload: unknown; meta?: Record<string, unknown> }>;
  currentScheme: boolean;
};

export type Counts = {
  snapshots: number;
  skippedOldScheme: number;
  stopped: number;
  byKind: Record<string, number>;
  apartmentTable: { yes: number; no: number; unknown: number } | null;
  projectIdsUnique: number | null;
  tongDuAn: number | null;
  tile: { provinces: number; scanned: number; withData: number; empty: number; absent: number; error: number } | null;
  /** Mốc ngày 2 — toà đã liệt kê: số toà, số toà khớp tổng dòng, tổng mã duy nhất, tổng dòng. */
  apartmentBuilding: { total: number; khop: number; codes: number; rows: number } | null;
  /** Mốc ngày 2 — căn đã lấy. Chỉ bản khớp mã mới được ghi vào kho; số không gọi trúng nằm ở trạng thái bộ thu, không đếm được từ kho. */
  apartmentDetail: { ok: number } | null;
  /** Mốc ngày 2 — thửa theo phương pháp và số đo mỗi km² (lấy từ bản gộp khu). */
  parcel: { grid: number; suggest: number; areas: number; areaKm2: number; calls: number; perKm2: number; callsPerKm2: number } | null;
  firstAt: string;
  lastAt: string;
};

type Item = SourceSnapshot["items"][number];

/** Đọc mọi snapshot S17 dưới `<root>/vn/` (thư mục hoàn chỉnh, không kể `.partial`), kiểm sha256 từng tệp. */
export async function readSourceSnapshots(root: string): Promise<SourceSnapshot[]> {
  const dir = join(root, S17_CITY);
  const names = (await readdir(dir)).filter((n) => n.startsWith(`${S17_CITY}__${S17_SOURCE}__`)).sort();
  const out: SourceSnapshot[] = [];
  for (const name of names) {
    const manifest = JSON.parse(await readFile(join(dir, name, "manifest.json"), "utf8")) as SnapshotManifest;
    const items: Item[] = [];
    for (const f of manifest.files) {
      const gz = await readFile(join(dir, name, f.name));
      if (createHash("sha256").update(gz).digest("hex") !== f.sha256) throw new Error(`sha256 không khớp: ${name}/${f.name}`);
      items.push(...(JSON.parse(gunzipSync(gz).toString("utf8")) as Item[]));
    }
    out.push({ snapshotId: name, manifest, items, currentScheme: (manifest.coverage.notes ?? []).includes(S17_NOTES) });
  }
  return out;
}

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export function countSnapshots(snaps: SourceSnapshot[]): Counts {
  const current = snaps.filter((s) => s.currentScheme);
  const byKind: Record<string, number> = {};
  const stopped = current.filter((s) => s.manifest.error).length;
  let apartment: Counts["apartmentTable"] = null;
  let tile: Counts["tile"] = null;
  let tongDuAn: number | null = null;
  let toa: Counts["apartmentBuilding"] = null;
  let can: Counts["apartmentDetail"] = null;
  let thua: Counts["parcel"] = null;
  const ids = new Set<string>();
  let sawList = false;
  for (const s of current) {
    for (const [kind, n] of Object.entries(s.manifest.coverage.methods)) byKind[kind] = (byKind[kind] ?? 0) + n;
    for (const it of s.items) {
      if (it.kind === "du_an_detail") {
        apartment ??= { yes: 0, no: 0, unknown: 0 };
        const flag = it.meta?.coBangCan;
        if (flag === true) apartment.yes++;
        else if (flag === false) apartment.no++;
        else apartment.unknown++;
      } else if (it.kind === "du_an_list") {
        sawList = true;
        tongDuAn = Math.max(tongDuAn ?? 0, num(it.meta?.tongDuAn));
        const content = (it.payload as { json?: { data?: { projects?: { content?: unknown[] } } } })?.json?.data?.projects?.content ?? [];
        for (const e of content) {
          const id = projectIdOf(e);
          if (id !== null) ids.add(id);
        }
      } else if (it.kind === "can_ho_toa") {
        toa ??= { total: 0, khop: 0, codes: 0, rows: 0 };
        toa.total++;
        if (it.meta?.khop === true) toa.khop++;
        toa.codes += Array.isArray((it.payload as { maCan?: unknown[] })?.maCan) ? (it.payload as { maCan: unknown[] }).maCan.length : 0;
        toa.rows += num(it.meta?.tongCan);
      } else if (it.kind === "can_ho_detail") {
        can ??= { ok: 0 };
        if (it.meta?.khopMaCan === true) can.ok++;
      } else if (it.kind === "thua") {
        thua ??= { grid: 0, suggest: 0, areas: 0, areaKm2: 0, calls: 0, perKm2: 0, callsPerKm2: 0 };
        if (it.meta?.phuongPhap === "suggest") thua.suggest++;
        else thua.grid++;
      } else if (it.kind === "thua_khu_vuc") {
        thua ??= { grid: 0, suggest: 0, areas: 0, areaKm2: 0, calls: 0, perKm2: 0, callsPerKm2: 0 };
        thua.areas++;
        thua.areaKm2 += num((it.meta?.request as { dienTichKm2?: number } | undefined)?.dienTichKm2);
        thua.calls += num(it.meta?.tongLoi);
        thua.perKm2 += num(it.meta?.thuaMoiKm2);
        thua.callsPerKm2 += num(it.meta?.loiMoiKm2);
      } else if (it.kind === "tile_coverage") {
        tile ??= { provinces: 0, scanned: 0, withData: 0, empty: 0, absent: 0, error: 0 };
        tile.provinces++;
        tile.scanned += num(it.meta?.soDiemQuet);
        tile.withData += num(it.meta?.trong);
        tile.empty += num(it.meta?.rong);
        tile.absent += num(it.meta?.vang);
        tile.error += num(it.meta?.loi);
      }
    }
  }
  const times = current.map((s) => s.manifest.startedAt).sort();
  return {
    snapshots: current.length,
    skippedOldScheme: snaps.length - current.length,
    stopped,
    byKind,
    apartmentTable: apartment,
    projectIdsUnique: sawList ? ids.size : null,
    tongDuAn,
    tile,
    apartmentBuilding: toa,
    apartmentDetail: can,
    parcel: thua,
    firstAt: times[0] ?? "",
    lastAt: times.at(-1) ?? "",
  };
}

function render(c: Counts, kind: string | undefined): string {
  const lines: string[] = [];
  if (kind) {
    lines.push(`${kind}: ${c.byKind[kind] ?? 0}`);
    if (kind === "du_an_detail" && c.apartmentTable) lines.push(`  có bảng căn: ${c.apartmentTable.yes} · không: ${c.apartmentTable.no} · không rõ cờ: ${c.apartmentTable.unknown}`);
    if (kind === "du_an_list" && c.projectIdsUnique !== null) lines.push(`  id dự án duy nhất: ${c.projectIdsUnique} · tổng nguồn công bố: ${c.tongDuAn}`);
    if (kind === "du_an_thap_tang") lines.push(`  dự án thấp tầng: ${c.byKind[kind] ?? 0}`);
    if (kind === "can_ho_toa" && c.apartmentBuilding) lines.push(`  toà: ${c.apartmentBuilding.total} · khớp tổng dòng: ${c.apartmentBuilding.khop} · mã duy nhất: ${c.apartmentBuilding.codes} · dòng: ${c.apartmentBuilding.rows}`);
    if (kind === "can_ho_detail" && c.apartmentDetail) lines.push(`  khớp mã căn: ${c.apartmentDetail.ok} (chỉ bản khớp mới được ghi; số không gọi trúng nằm ở trạng thái bộ thu)`);
    if (kind === "thua" && c.parcel) lines.push(`  lưới: ${c.parcel.grid} · gợi ý: ${c.parcel.suggest} · khu: ${c.parcel.areas} (${c.parcel.areaKm2} km²) · lời: ${c.parcel.calls} · thửa/km²: ${c.parcel.perKm2} · lời/km²: ${c.parcel.callsPerKm2}`);
    if (kind === "tile_coverage" && c.tile) {
      lines.push(`  tỉnh: ${c.tile.provinces} · điểm quét: ${c.tile.scanned} · có dữ liệu: ${c.tile.withData} · rỗng: ${c.tile.empty} · vắng: ${c.tile.absent} · lỗi: ${c.tile.error}`);
    }
    return lines.join("\n");
  }
  for (const [k, n] of Object.entries(c.byKind).sort()) lines.push(`${k.padEnd(16)} ${n}`);
  lines.push(`(snapshot khuôn 2: ${c.snapshots} · dừng có lỗi: ${c.stopped} · bản khuôn 1 bị bỏ qua: ${c.skippedOldScheme})`);
  return lines.join("\n");
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    options: { "snapshots-root": { type: "string" }, kind: { type: "string" }, json: { type: "boolean" } },
  });
  if (!values["snapshots-root"]) {
    console.error("thiếu --snapshots-root");
    return 2;
  }
  const c = countSnapshots(await readSourceSnapshots(values["snapshots-root"]));
  if (values.json) console.log(JSON.stringify(c));
  else console.log(render(c, values.kind));
  return 0;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (c) => process.exit(c),
    (e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    },
  );
}
