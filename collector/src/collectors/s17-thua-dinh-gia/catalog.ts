/**
 * Đọc KHO SNAPSHOT của S17 để biết việc còn phải làm (mốc mở rộng, claudedp-2411-73) — không gọi nguồn.
 *
 * - `projectCatalog`: dự án nào có bảng căn và tên toà nào → pha căn hộ toàn bộ dự án làm theo đó. Mục danh sách
 *   dự án (`du_an_list`) luôn ghi «không có bảng căn» (đo 25/11: 0/2.508 đúng) trong khi chi tiết nói có, nên phải
 *   đọc chi tiết.
 * - `projectImages`: URL ảnh của mỗi dự án, lấy từ chính payload chi tiết đã thu.
 *
 * Chỉ mở snapshot mà manifest khai kind cần đọc; mỗi tệp kiểm sha256 trước khi giải nén (DATA-CONTRACT, quy tắc
 * tiêu thụ mục 2); snapshot không mang dấu hiệu khuôn 2 bị bỏ.
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import type { RawItem, SnapshotManifest } from "../../core/types.js";
import { hostDuocPhep } from "./anh.js";
import { parseCount } from "./kinds.js";
import { S17_CITY, S17_SOURCE } from "./store.js";

const DAU_HIEU = "S17 khuôn 2";

export async function readKind(root: string, kind: string): Promise<RawItem[]> {
  const goc = join(root, S17_CITY);
  let ten: string[];
  try {
    ten = await readdir(goc);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
  const out: RawItem[] = [];
  for (const d of ten.filter((x) => x.startsWith(`${S17_CITY}__${S17_SOURCE}__`)).sort()) {
    let manifest: SnapshotManifest;
    try {
      manifest = JSON.parse(await readFile(join(goc, d, "manifest.json"), "utf8")) as SnapshotManifest;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") continue; // tệp tạm của lượt khác đang chốt
      throw e;
    }
    if (!(manifest.coverage.notes ?? []).some((x) => x.startsWith(DAU_HIEU))) continue;
    if (!(manifest.coverage.methods?.[kind] > 0)) continue;
    for (const f of manifest.files) {
      if (!f.name.startsWith("items-")) continue;
      const buf = await readFile(join(goc, d, f.name));
      if (createHash("sha256").update(buf).digest("hex") !== f.sha256) throw new Error(`snapshot ${d}: tệp ${f.name} lệch sha256`);
      for (const it of JSON.parse(gunzipSync(buf).toString("utf8")) as RawItem[]) if (it.kind === kind) out.push(it);
    }
  }
  return out;
}

/** Mỗi sourceId giữ bản mới nhất theo `fetchedAt` (cùng bản ghi có thể nằm trong hai snapshot — DATA-CONTRACT). */
export function banMoiNhat(items: RawItem[]): RawItem[] {
  const m = new Map<string, RawItem>();
  for (const it of items) {
    const cu = m.get(it.sourceId);
    if (!cu || String(cu.fetchedAt) < String(it.fetchedAt)) m.set(it.sourceId, it);
  }
  return [...m.values()];
}

export type DuAnCatalog = { id: string; coBangCan: boolean; toa: string[]; soCan: number | null };

/**
 * Các dự án có bảng căn, lấy từ bản mới nhất của `du_an_detail`, xếp theo số căn nguồn khai từ lớn xuống nhỏ (dự án
 * to trước cho nhiều căn sớm), bằng nhau thì id nhỏ trước. Dự án có bảng căn nhưng không có tên toà vẫn được giữ
 * (`toa` rỗng) để pha căn hộ ghi nhận là «không liệt kê được».
 */
export async function projectCatalog(root: string): Promise<DuAnCatalog[]> {
  const out = new Map<string, DuAnCatalog>();
  for (const it of banMoiNhat(await readKind(root, "du_an_detail"))) {
    const props = (it.payload as { detail?: { data?: { properties?: { danh_sach_thap?: unknown; so_can?: unknown } } } } | null)?.detail?.data?.properties;
    if (it.meta?.coBangCan !== true) continue;
    const toa = Array.isArray(props?.danh_sach_thap) ? props.danh_sach_thap.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
    const id = String((it.meta?.request as { id?: unknown } | undefined)?.id ?? "");
    out.set(id, {
      id,
      coBangCan: true,
      toa: [...new Set(toa)],
      soCan: parseCount(props?.so_can),
    });
  }
  return [...out.values()].sort((a, b) => (b.soCan ?? -1) - (a.soCan ?? -1) || a.id.localeCompare(b.id, "en", { numeric: true }));
}

export type AnhCuaDuAn = { id: string; anh: Array<{ url: string; nhom: string[]; ngayKy: string | null }>; /** URL ở máy chủ ngoài — không tải, chỉ ghi lại kèm lý do. */ ngoai: string[] };

/** Ngày ký (YYYYMMDD) của link có chữ ký; link thường không có. */
export function ngayKyCuaLink(url: string): string | null {
  try {
    const d = new URL(url).searchParams.get("X-Amz-Date");
    return d && /^\d{8}/.test(d) ? d.slice(0, 8) : null;
  } catch {
    return null;
  }
}

const URL_RE = /https?:\/\/[^\s"'<>\\)]+/g;

function urlTrong(v: unknown, ra: string[]): void {
  if (v == null) return;
  if (typeof v === "string") {
    for (const m of v.match(URL_RE) ?? []) ra.push(m);
  } else if (Array.isArray(v)) {
    for (const x of v) urlTrong(x, ra);
  } else if (typeof v === "object") {
    for (const x of Object.values(v)) urlTrong(x, ra);
  }
}

/**
 * Ảnh của mỗi dự án: mọi URL trên máy chủ được phép, theo thứ tự gặp (nhóm thư viện trước, rồi phần còn lại của
 * payload), mỗi URL một lần kèm các tên nhóm chứa nó. Dự án có link ký SỚM NHẤT đứng trước (hết hạn sớm nhất phải
 * tải trước). URL ở máy chủ ngoài không lấy, trả trong `ngoai` để pha ghi lại kèm lý do.
 */
export async function projectImages(root: string, duoiMayChu: string[]): Promise<{ duAn: AnhCuaDuAn[]; soUrl: number; soUrlMayChuNgoai: number }> {
  const duAn: AnhCuaDuAn[] = [];
  let soUrlMayChuNgoai = 0;
  for (const it of banMoiNhat(await readKind(root, "du_an_detail"))) {
    const id = String((it.meta?.request as { id?: unknown } | undefined)?.id ?? "");
    const p = it.payload as
      | { gallery?: { data?: unknown }; detail?: { data?: { properties?: { nhom_hinh_anh?: unknown } } } }
      | null;
    const thuThap = new Map<string, { url: string; nhom: Set<string> }>();
    const ngoai = new Set<string>();
    const them = (url: string, nhom: string | null) => {
      if (!hostDuocPhep(url, duoiMayChu)) {
        if (!ngoai.has(url)) soUrlMayChuNgoai++;
        ngoai.add(url);
        return;
      }
      const x = thuThap.get(url) ?? { url, nhom: new Set<string>() };
      if (nhom) x.nhom.add(nhom);
      thuThap.set(url, x);
    };
    const nhom = (g: unknown) => String((g as { name?: unknown; title?: unknown } | null)?.name ?? (g as { title?: unknown } | null)?.title ?? "").trim();
    const dsNhom = Array.isArray(p?.gallery?.data) ? p.gallery.data : [];
    for (const g of dsNhom) {
      const ra: string[] = [];
      urlTrong(g, ra);
      for (const u of ra) them(u, nhom(g) || null);
    }
    const dsNhomChiTiet = Array.isArray(p?.detail?.data?.properties?.nhom_hinh_anh) ? p.detail.data.properties.nhom_hinh_anh : [];
    for (const g of dsNhomChiTiet) {
      const ra: string[] = [];
      urlTrong(g, ra);
      for (const u of ra) them(u, nhom(g) || null);
    }
    const conLai: string[] = [];
    urlTrong(it.payload, conLai);
    for (const u of conLai) them(u, null);
    if (!thuThap.size && !ngoai.size) continue;
    const anh = [...thuThap.values()].map((x) => ({ url: x.url, nhom: [...x.nhom], ngayKy: ngayKyCuaLink(x.url) }));
    duAn.push({ id, anh, ngoai: [...ngoai] });
  }
  const somNhat = (d: AnhCuaDuAn): number => Math.min(...d.anh.map((x) => Number(x.ngayKy ?? 99999999)));
  duAn.sort((a, b) => somNhat(a) - somNhat(b) || a.id.localeCompare(b.id, "en", { numeric: true }));
  return { duAn, soUrl: duAn.reduce((n, d) => n + d.anh.length, 0), soUrlMayChuNgoai };
}
