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
  /** Tệp nhị phân dưới `media/` của snapshot — lấy từ manifest, không bao giờ đọc nội dung (thiếu = không có ảnh). */
  media?: { files: number; bytes: number };
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
  /** Mốc mở rộng — ảnh dự án: số tệp và số byte từ manifest, số item và số dự án có ảnh, lỗi theo loại. */
  images: { files: number; bytes: number; items: number; duAn: number; loi: Record<string, number> } | null;
  /** Mốc mở rộng — căn hộ toàn bộ dự án, cộng từ các bản gộp `can_ho_du_an` của mốc (moRong). */
  apartmentsAll: { duAn: number; toa: number; toaKhop: number; maDuNhieu: number; soDaLay: number; soLoi: number } | null;
  firstAt: string;
  lastAt: string;
};

type Item = SourceSnapshot["items"][number];

/**
 * Đọc mọi snapshot S17 dưới `<root>/vn/` (thư mục hoàn chỉnh, không kể `.partial`), kiểm sha256 từng tệp items.
 * Tệp ảnh dưới `media/` KHÔNG BAO GIỜ đọc ở đây (cả trăm GB, và không phải gzip): chỉ lấy số tệp và số byte từ
 * manifest. `kinds` cho trước thì chỉ mở tệp items của snapshot khai kind đó trong `coverage.methods`; `kinds: []`
 * = chỉ đọc manifest (byKind vẫn có, nhanh dù kho có hàng chục nghìn snapshot).
 */
export async function readSourceSnapshots(root: string, o: { kinds?: string[] } = {}): Promise<SourceSnapshot[]> {
  const dir = join(root, S17_CITY);
  const names = (await readdir(dir)).filter((n) => n.startsWith(`${S17_CITY}__${S17_SOURCE}__`)).sort();
  const out: SourceSnapshot[] = [];
  for (const name of names) {
    let manifest: SnapshotManifest;
    try {
      manifest = JSON.parse(await readFile(join(dir, name, "manifest.json"), "utf8")) as SnapshotManifest;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue; // lượt khác đang chốt
      throw e;
    }
    const media = { files: 0, bytes: 0 };
    for (const f of manifest.files) {
      if (!f.name.startsWith("media/")) continue;
      media.files++;
      media.bytes += f.bytes;
    }
    const items: Item[] = [];
    const methods = manifest.coverage.methods ?? {};
    if (!o.kinds || o.kinds.some((k) => (methods[k] ?? 0) > 0)) {
      for (const f of manifest.files) {
        if (!f.name.startsWith("items-")) continue;
        const gz = await readFile(join(dir, name, f.name));
        if (createHash("sha256").update(gz).digest("hex") !== f.sha256) throw new Error(`sha256 không khớp: ${name}/${f.name}`);
        items.push(...(JSON.parse(gunzipSync(gz).toString("utf8")) as Item[]));
      }
    }
    out.push({ snapshotId: name, manifest, items, currentScheme: (manifest.coverage.notes ?? []).includes(S17_NOTES), media });
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
  let images: Counts["images"] = null;
  const duAnCoAnh = new Set<string>();
  let apartmentsAll: Counts["apartmentsAll"] = null;
  const ids = new Set<string>();
  let sawList = false;
  for (const s of current) {
    for (const [kind, n] of Object.entries(s.manifest.coverage.methods)) byKind[kind] = (byKind[kind] ?? 0) + n;
    if ((s.media?.files ?? 0) > 0) {
      images ??= { files: 0, bytes: 0, items: 0, duAn: 0, loi: {} };
      images.files += s.media?.files ?? 0;
      images.bytes += s.media?.bytes ?? 0;
    }
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
      } else if (it.kind === "anh_du_an") {
        images ??= { files: 0, bytes: 0, items: 0, duAn: 0, loi: {} };
        images.items++;
        duAnCoAnh.add(String((it.meta?.request as { duAn?: unknown } | undefined)?.duAn ?? ""));
        for (const m of (it.meta?.mediaFiles as Array<{ error?: unknown }> | undefined) ?? []) {
          if (typeof m?.error === "string") images.loi[m.error] = (images.loi[m.error] ?? 0) + 1;
        }
      } else if (it.kind === "can_ho_du_an" && it.meta?.moRong === true) {
        apartmentsAll ??= { duAn: 0, toa: 0, toaKhop: 0, maDuNhieu: 0, soDaLay: 0, soLoi: 0 };
        apartmentsAll.duAn++;
        apartmentsAll.toa += num(it.meta.soToa);
        apartmentsAll.toaKhop += num(it.meta.soToaKhop);
        apartmentsAll.maDuNhieu += num(it.meta.maDuNhieu);
        apartmentsAll.soDaLay += num(it.meta.soDaLay);
        apartmentsAll.soLoi += num(it.meta.soKhongLayDuoc);
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
    images: images ? { ...images, duAn: duAnCoAnh.size } : null,
    apartmentsAll,
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
    if (kind === "anh_du_an" && c.images) {
      const loi = Object.entries(c.images.loi).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(", ");
      lines.push(`  ảnh gốc: ${c.images.files} tệp · ${(c.images.bytes / 2 ** 30).toFixed(2)} GiB · dự án có ảnh: ${c.images.duAn}${loi ? ` · lỗi: ${loi}` : ""}`);
    }
    if (kind === "can_ho_du_an" && c.apartmentsAll) {
      lines.push(`  (mốc mở rộng) dự án đã xét: ${c.apartmentsAll.duAn} · toà: ${c.apartmentsAll.toa} (khớp ${c.apartmentsAll.toaKhop}) · mã căn: ${c.apartmentsAll.maDuNhieu} · có chi tiết: ${c.apartmentsAll.soDaLay} · không lấy được: ${c.apartmentsAll.soLoi}`);
    }
    if (kind === "tile_coverage" && c.tile) {
      lines.push(`  tỉnh: ${c.tile.provinces} · điểm quét: ${c.tile.scanned} · có dữ liệu: ${c.tile.withData} · rỗng: ${c.tile.empty} · vắng: ${c.tile.absent} · lỗi: ${c.tile.error}`);
    }
    return lines.join("\n");
  }
  for (const [k, n] of Object.entries(c.byKind).sort()) lines.push(`${k.padEnd(16)} ${n}`);
  if (c.images) lines.push(`ảnh gốc: ${c.images.files} tệp · ${(c.images.bytes / 2 ** 30).toFixed(2)} GiB · dự án có ảnh: ${c.images.duAn}`);
  if (c.apartmentsAll) lines.push(`căn hộ (mốc mở rộng): dự án ${c.apartmentsAll.duAn} · toà ${c.apartmentsAll.toa} (khớp ${c.apartmentsAll.toaKhop}) · mã căn ${c.apartmentsAll.maDuNhieu} · có chi tiết ${c.apartmentsAll.soDaLay}`);
  lines.push(`(snapshot khuôn 2: ${c.snapshots} · dừng có lỗi: ${c.stopped} · bản khuôn 1 bị bỏ qua: ${c.skippedOldScheme})`);
  return lines.join("\n");
}

async function main(argv: string[]): Promise<number> {
  const { values } = parseArgs({
    args: argv,
    strict: true,
    options: { "snapshots-root": { type: "string" }, kind: { type: "string" }, json: { type: "boolean" }, "chi-manifest": { type: "boolean" } },
  });
  if (!values["snapshots-root"]) {
    console.error("thiếu --snapshots-root");
    return 2;
  }
  // Chỉ đọc manifest khi có --kind (mở đúng snapshot khai kind đó) hoặc --chi-manifest: kho lớn vẫn đếm nhanh.
  const c = countSnapshots(
    await readSourceSnapshots(values["snapshots-root"], { kinds: values["chi-manifest"] === true ? [] : values.kind !== undefined ? [values.kind] : undefined }),
  );
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
