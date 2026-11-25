/**
 * Pha `parcels-cell` — LƯỚI DÀY trong từng ô 1 km có dữ liệu, bước T2 (lõi, 30 m) và T3 (còn lại, 100 m) của
 * phần thửa mở rộng (Mạnh chốt 25/11: «mở cả thửa»).
 *
 * Ô cần làm đọc từ kết quả bản đồ phủ (`thua_ban_do` của pha `parcels-map`): ô 1 km nào có thửa ở chính nó hoặc ở
 * một trong tám ô kề. Không cần đa giác hành chính (đa giác tỉnh trên máy thu bị phình — xem pha-ban-do.ts). Thứ tự:
 * ô dày nhất trước (nhiều điểm trúng trong ô kề), rồi theo tile, cột, hàng. `gioiHan` = số ô nhiều nhất một lượt.
 *
 * Mỗi ô: lưới vuông ⌊1000/buoc⌋ điểm một cạnh, tâm ô là tâm lưới. Thửa ghi một lần (mã địa chính; gặp lại ở ô
 * khác tính là trùng), `phuongPhap: "luoi"`. Xong ô thì ghi bản gộp `thua_o`. Tiến độ chỉ-ghi-thêm, một tệp mỗi ô
 * (`o-<z>-<x>-<y>-<i>-<j>.jsonl`); lô chốt xong mới ghi dòng.
 */
import { join } from "node:path";

import { MAX_CONCURRENCY, RunStopped } from "./client.js";
import { readKind } from "./catalog.js";
import { ConfigError } from "./config.js";
import { assertNoSoftError, makeItem } from "./kinds.js";
import type { ToaDo } from "./pha-ban-do.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import { NhatKyTienDo, chotVaLuu } from "./tien-do.js";

const R = 6378137;
const MOT_DOT = 40;

/** Lưới vuông ⌊1000/buocM⌋ điểm một cạnh, cách đều `buocM` mét (Mercator), tâm ô là tâm lưới; bắc → nam, tây → đông. */
export function luoiO(tam: ToaDo, buocM: number): ToaDo[] {
  if (!Number.isFinite(buocM) || buocM <= 0) throw new ConfigError("buocM phải là số dương");
  if (buocM > 1000) throw new ConfigError("buocM không được lớn hơn 1000 (cạnh ô 1 km)");
  const n = Math.max(1, Math.floor(1000 / buocM));
  const cx = (tam[1] * Math.PI * R) / 180;
  const cy = Math.atanh(Math.sin((tam[0] * Math.PI) / 180)) * R;
  const le = ((n - 1) / 2) * buocM;
  const diem: ToaDo[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const my = cy + le - j * buocM;
      diem.push([(Math.atan(Math.sinh(my / R)) * 180) / Math.PI, ((cx - le + i * buocM) / R) * (180 / Math.PI)]);
    }
  }
  return diem;
}

export type OCoDuLieu = { id: string; tile: string; i: number; j: number; tam: ToaDo; soLanTrung: number };

const idO = (tile: string, i: number, j: number): string => `o-${tile.replace(/\//g, "-")}-${i}-${j}`;

/** Ô 1 km có dữ liệu theo bản đồ phủ: có thửa ở chính nó hoặc ở một trong tám ô kề; dày nhất đứng trước. */
export async function cacOCoDuLieu(root: string): Promise<OCoDuLieu[]> {
  const out: OCoDuLieu[] = [];
  for (const it of await readKind(root, "thua_ban_do")) {
    const tile = String(it.meta?.tile ?? "");
    const diem = (it.payload as { diem?: unknown } | null)?.diem;
    if (!tile || !Array.isArray(diem)) continue;
    const canh = Math.round(Math.sqrt(diem.length));
    if (canh * canh !== diem.length) continue;
    // «loi» là điểm lỗi mạng của bản đồ phủ — không nói gì được về việc có thửa hay không.
    const coThua = (i: number, j: number): boolean => {
      if (i < 0 || j < 0 || i >= canh || j >= canh) return false;
      const v = diem[j * canh + i]?.[2];
      return typeof v === "string" && v !== "loi";
    };
    for (let j = 0; j < canh; j++) {
      for (let i = 0; i < canh; i++) {
        let soLanTrung = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (coThua(i + di, j + dj)) soLanTrung++;
        if (soLanTrung === 0) continue;
        const p = diem[j * canh + i];
        out.push({ id: idO(tile, i, j), tile, i, j, tam: [p[0], p[1]], soLanTrung });
      }
    }
  }
  // Cùng một ô có thể xuất hiện ở hai bản đồ (một tile nằm trong hai bản mặt nạ) — giữ một.
  const duyNhat = new Map<string, OCoDuLieu>();
  for (const o of out) duyNhat.set(o.id, o);
  return [...duyNhat.values()].sort((a, b) => b.soLanTrung - a.soLanTrung || a.tile.localeCompare(b.tile) || a.i - b.i || a.j - b.j);
}

type Envelope = { status?: boolean; message?: string | null; data?: { properties?: { ogc_fid?: unknown; vi_tri_duong?: unknown } } | null };
type TienDoO = { daDiem: Set<number>; ogc: Map<number, string>; moi: Set<number>; loi: Set<number>; xong: boolean };

async function docO(duong: string): Promise<TienDoO> {
  const out: TienDoO = { daDiem: new Set(), ogc: new Map(), moi: new Set(), loi: new Set(), xong: false };
  for (const r of await new NhatKyTienDo(duong).readAll()) {
    for (const i of (r.daDiem as number[] | undefined) ?? []) out.daDiem.add(i);
    for (const [i, fid] of Object.entries((r.ogc ?? {}) as Record<string, string>)) out.ogc.set(Number(i), fid);
    for (const i of (r.moi as number[] | undefined) ?? []) out.moi.add(i);
    for (const i of (r.loi as number[] | undefined) ?? []) out.loi.add(i);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

export type OLuoiOptions = { buocM: number; gioiHan?: number };

export async function parcelsCell(o: RunOptions, luaChon: OLuoiOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const concurrency = o.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) throw new ConfigError(`concurrency phải là số nguyên từ 1 đến ${MAX_CONCURRENCY}`);
  const tienDoDir = o.tienDoDir as string;
  const cacO = await cacOCoDuLieu(o.snapshotRoot as string);
  let conLai = luaChon.gioiHan ?? Number.POSITIVE_INFINITY;

  // Thửa đã có ở ô nào cũng không ghi lặp: đọc lại mọi nhật ký ô.
  const daThay = new Set<string>();
  const daXong = new Set<string>();
  const tienDoO = new Map<string, TienDoO>();
  for (const c of cacO) {
    const td = await docO(join(tienDoDir, `${c.id}.jsonl`));
    tienDoO.set(c.id, td);
    if (td.xong) daXong.add(c.id);
    for (const fid of td.ogc.values()) daThay.add(fid);
  }

  let items = 0;
  let failed = 0;
  let soO = 0;
  let soDiem = 0;
  let soThuaMoi = 0;
  let soTrung = 0;
  let soKhongCo = 0;
  let soLoi = 0;
  let dung: RunStopped | null = null;

  for (const c of cacO) {
    if (dung || conLai <= 0) break;
    if (daXong.has(c.id)) continue;
    conLai--;
    const tienDo = new NhatKyTienDo(join(tienDoDir, `${c.id}.jsonl`));
    const td = tienDoO.get(c.id) as TienDoO;
    const diem = luoiO(c.tam, luaChon.buocM);
    const con = diem.map((_, i) => i).filter((i) => !td.daDiem.has(i) && !td.loi.has(i));
    for (let i = 0; i < con.length && !dung; i += MOT_DOT) {
      const phan = con.slice(i, i + MOT_DOT);
      const rs = await o.client.getJsonMany<Envelope>(
        phan.map((k) => ({ role: "parcel-profile" as const, params: { loaiTimKiem: "nha_pho", latitude: diem[k][0], longitude: diem[k][1] } })),
        concurrency,
      );
      const daDiem: number[] = [];
      const ogc: Record<number, string> = {};
      const moi: number[] = [];
      const loi: number[] = [];
      for (let j = 0; j < phan.length; j++) {
        const k = phan[j];
        const r = rs[j];
        if (!r.ok) {
          if (r.error instanceof RunStopped) {
            dung = r.error;
            continue;
          }
          loi.push(k);
          continue;
        }
        try {
          assertNoSoftError(r.value, `hồ sơ thửa ở toạ độ ${diem[k][0]},${diem[k][1]} (ô ${c.id})`);
        } catch (e) {
          dung = e as RunStopped;
          continue;
        }
        daDiem.push(k);
        const fid = String((r.value?.data as { properties?: { ogc_fid?: unknown } } | null)?.properties?.ogc_fid ?? "");
        if (!fid) continue;
        ogc[k] = fid;
        if (daThay.has(fid)) continue;
        daThay.add(fid);
        moi.push(k);
        const props = (r.value?.data as { properties?: Record<string, unknown> } | null)?.properties ?? {};
        await o.writer.add(
          makeItem(
            "thua",
            `thua-${fid}`,
            { json: r.value },
            { request: { latitude: diem[k][0], longitude: diem[k][1], loaiTimKiem: "nha_pho" }, phuongPhap: "luoi", khuVuc: c.id, ogcFid: fid, duong: String(props.vi_tri_duong ?? "").trim() || null },
            at(),
          ),
        );
        items++;
      }
      await chotVaLuu(o);
      await tienDo.append({ ...(daDiem.length ? { daDiem } : {}), ...(Object.keys(ogc).length ? { ogc } : {}), ...(moi.length ? { moi } : {}), ...(loi.length ? { loi } : {}) });
      for (const k of daDiem) td.daDiem.add(k);
      for (const [k, fid] of Object.entries(ogc)) td.ogc.set(Number(k), fid);
      for (const k of moi) td.moi.add(k);
      for (const k of loi) td.loi.add(k);
      failed += loi.length;
    }
    if (dung) break;
    const banGop = { soDiem: td.daDiem.size + td.loi.size, soThuaMoi: td.moi.size, soTrung: td.ogc.size - td.moi.size, soKhongCo: td.daDiem.size - td.ogc.size, soLoi: td.loi.size };
    await o.writer.add(
      makeItem("thua_o", c.id, banGop, { request: { buocM: luaChon.buocM }, tile: c.tile, o: [c.i, c.j], viTri: c.tam, phuongPhap: "luoi" }, at()),
    );
    items++;
    await chotVaLuu(o);
    await tienDo.append({ xong: true });
    soO++;
    soDiem += banGop.soDiem;
    soThuaMoi += banGop.soThuaMoi;
    soTrung += banGop.soTrung;
    soKhongCo += banGop.soKhongCo;
    soLoi += banGop.soLoi;
    o.log({ suKien: "o-luoi-xong", o: c.id, ...banGop });
  }
  if (dung) throw dung;
  return { phase: o.phase, calls: o.client.calls - started, items, failed, so: { soO, soDiem, soThuaMoi, soTrung, soKhongCo, soLoi } };
}
