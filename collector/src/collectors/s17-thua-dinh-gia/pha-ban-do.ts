/**
 * Pha `parcels-map` — BẢN ĐỒ PHỦ thửa, bước T1 của phần thửa mở rộng (Mạnh chốt 25/11: «mở cả thửa»).
 *
 * Mặt nạ vùng (mốc ngày 1) chỉ nói «ô 10 km × 10 km này có ít nhất một điểm có thửa» — mỗi điểm mặt nạ đại diện cho
 * một ô như vậy. Muốn dàn lưới dày thì phải biết CHÍNH XÁC ô 1 km nào có thửa. Pha này thăm dò 11 × 11 điểm cách 1 km
 * (mét Mercator) trong ô quanh TÂM của mỗi tile mặt nạ có dữ liệu. Đa giác «tỉnh» trên máy thu không dùng được để dựng
 * lưới (đo 25/11: 20 tỉnh cộng 352.000 km², TP.HCM bị tính 36.400 km²) — ô theo tile thì đúng và không cần đa giác.
 *
 * Kết quả: mỗi ô một item `thua_ban_do` (toạ độ và mã thửa của từng điểm; `null` = không có thửa; `"loi"` = lỗi mạng),
 * thửa gặp được ghi thành item `thua` với `phuongPhap: "ban-do"` — những thửa này không phải là kiểm kê, chỉ là dấu
 * chứng có dữ liệu. Điểm không có thửa nguồn trả trong khoảng 0,1 s nên pha rẻ.
 *
 * Tiến độ: nhật ký chỉ-ghi-thêm, một tệp mỗi ô (`ban-do-<z>-<x>-<y>.jsonl`), lô chốt xong mới ghi dòng. Điểm lỗi
 * mạng được ghi nhận (không hỏi lại). Thửa đã có (ở ô nào cũng vậy) không ghi lặp.
 */
import { join } from "node:path";

import { MAX_CONCURRENCY, RunStopped } from "./client.js";
import { readKind } from "./catalog.js";
import { ConfigError } from "./config.js";
import { assertNoSoftError, makeItem } from "./kinds.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import { NhatKyTienDo, chotVaLuu } from "./tien-do.js";

const R = 6378137;
const TILE_RE = /^(\d{1,2})\/(\d{1,8})\/(\d{1,8})$/;

/** Một điểm trên mặt đất: `[latitude, longitude]`. */
export type ToaDo = [number, number];

/**
 * Lưới `canh × canh` điểm cách `buoc` mét (Mercator) quanh tâm của tile `z/x/y`. Hàng đi từ bắc xuống nam, cột từ
 * tây sang đông. Với `canh` lẻ thì điểm giữa là đúng tâm tile.
 */
export function luoiBanDo(tile: string, canh: number, buoc: number): { tam: ToaDo; diem: ToaDo[] } {
  const m = TILE_RE.exec(tile);
  if (!m) throw new ConfigError(`tile phải có dạng z/x/y (toàn số): "${tile}"`);
  const z = Number(m[1]);
  const x = Number(m[2]);
  const y = Number(m[3]);
  const n = 2 ** z;
  const cx = ((x + 0.5) / n) * 2 * Math.PI * R - Math.PI * R;
  const cy = Math.PI * R - ((y + 0.5) / n) * 2 * Math.PI * R;
  const sangToaDo = (mx: number, my: number): ToaDo => [(Math.atan(Math.sinh(my / R)) * 180) / Math.PI, (mx / R) * (180 / Math.PI)];
  const diem: ToaDo[] = [];
  const le = (canh - 1) / 2;
  for (let j = 0; j < canh; j++) for (let i = 0; i < canh; i++) diem.push(sangToaDo(cx + (i - le) * buoc, cy + (le - j) * buoc));
  return { tam: sangToaDo(cx, cy), diem };
}

const CANH = 11;
const BUOC_M = 1000;
const MOT_DOT = 40;

type Envelope = { status?: boolean; message?: string | null; data?: { properties?: { ogc_fid?: unknown; vi_tri_duong?: unknown } } | null };

type TienDoO = { daDiem: Set<number>; ogc: Map<number, string>; loi: Set<number>; xong: boolean };

async function docO(duong: string): Promise<TienDoO> {
  const out: TienDoO = { daDiem: new Set(), ogc: new Map(), loi: new Set(), xong: false };
  for (const r of await new NhatKyTienDo(duong).readAll()) {
    for (const i of (r.daDiem as number[] | undefined) ?? []) out.daDiem.add(i);
    for (const [i, fid] of Object.entries((r.ogc ?? {}) as Record<string, string>)) out.ogc.set(Number(i), fid);
    for (const i of (r.loi as number[] | undefined) ?? []) out.loi.add(i);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

export async function parcelsMap(o: RunOptions): Promise<PhaseSummary> {
  const started = o.client.calls;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const concurrency = o.concurrency ?? 1;
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > MAX_CONCURRENCY) throw new ConfigError(`concurrency phải là số nguyên từ 1 đến ${MAX_CONCURRENCY}`);
  const tienDoDir = o.tienDoDir as string;

  // Mỗi tile mặt nạ có dữ liệu = một ô cần thăm dò (một tile có thể nằm trong hai bản mặt nạ — gộp).
  const cacO = new Map<string, string>();
  for (const it of await readKind(o.snapshotRoot as string, "tile_coverage")) {
    const tiles = (it.payload as { tiles?: unknown } | null)?.tiles;
    if (!Array.isArray(tiles)) continue;
    for (const t of tiles) if (typeof t === "string" && TILE_RE.test(t)) cacO.set(t, `ban-do-${t.replace(/\//g, "-")}.jsonl`);
  }

  // Thửa đã có ở ô nào cũng không ghi lặp: đọc lại mọi nhật ký ô.
  const daThay = new Set<string>();
  for (const tep of cacO.values()) {
    const td = await docO(join(tienDoDir, tep));
    for (const fid of td.ogc.values()) daThay.add(fid);
  }

  let items = 0;
  let failed = 0;
  let soO = 0;
  let soDiem = 0;
  let soDiemCoThua = 0;
  let soThua = 0;
  let soOCoDuLieu = 0;
  let dung: RunStopped | null = null;

  for (const [tile, tep] of cacO) {
    if (dung) break;
    const tienDo = new NhatKyTienDo(join(tienDoDir, tep));
    const td = await docO(join(tienDoDir, tep));
    if (td.xong) continue;
    const { tam, diem } = luoiBanDo(tile, CANH, BUOC_M);
    const con = diem.map((_, i) => i).filter((i) => !td.daDiem.has(i) && !td.loi.has(i));
    for (let i = 0; i < con.length && !dung; i += MOT_DOT) {
      const phan = con.slice(i, i + MOT_DOT);
      const rs = await o.client.getJsonMany<Envelope>(
        phan.map((k) => ({ role: "parcel-profile" as const, params: { loaiTimKiem: "nha_pho", latitude: diem[k][0], longitude: diem[k][1] } })),
        concurrency,
      );
      const daDiem: number[] = [];
      const ogc: Record<number, string> = {};
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
          assertNoSoftError(r.value, `hồ sơ thửa ở toạ độ ${diem[k][0]},${diem[k][1]} (bản đồ phủ)`);
        } catch (e) {
          dung = e as RunStopped;
          continue;
        }
        daDiem.push(k);
        const fid = String((r.value?.data as { properties?: { ogc_fid?: unknown } } | null)?.properties?.ogc_fid ?? "");
        if (!fid) continue; // điểm không nằm trong thửa nào
        ogc[k] = fid;
        if (daThay.has(fid)) continue; // thửa đã có ở ô nào đó
        daThay.add(fid);
        const props = (r.value?.data as { properties?: Record<string, unknown> } | null)?.properties ?? {};
        await o.writer.add(
          makeItem(
            "thua",
            `thua-${fid}`,
            { json: r.value },
            { request: { latitude: diem[k][0], longitude: diem[k][1], loaiTimKiem: "nha_pho" }, phuongPhap: "ban-do", khuVuc: tile.replace(/\//g, "-"), ogcFid: fid, duong: String(props.vi_tri_duong ?? "").trim() || null },
            at(),
          ),
        );
        soThua++;
        items++;
      }
      await chotVaLuu(o);
      await tienDo.append({ ...(daDiem.length ? { daDiem } : {}), ...(Object.keys(ogc).length ? { ogc } : {}), ...(loi.length ? { loi } : {}) });
      failed += loi.length;
    }
    if (dung) break;
    const xongTd = await docO(join(tienDoDir, tep));
    const oCo = [...xongTd.ogc.keys()].length;
    await o.writer.add(
      makeItem(
        "thua_ban_do",
        `ban-do-${tile.replace(/\//g, "-")}`,
        { buocM: BUOC_M, diem: diem.map((p, k) => [p[0], p[1], xongTd.ogc.has(k) ? xongTd.ogc.get(k) : xongTd.loi.has(k) ? "loi" : null]) },
        { request: { zoom: Number(tile.split("/")[0]) }, tile, buocM: BUOC_M, soDiem: diem.length, soCo: oCo, soLoi: xongTd.loi.size, viTri: tam },
        at(),
      ),
    );
    items++;
    await chotVaLuu(o);
    await tienDo.append({ xong: true });
    soO++;
    soDiem += xongTd.daDiem.size + xongTd.loi.size;
    soDiemCoThua += oCo;
    if (oCo > 0) soOCoDuLieu++;
    o.log({ suKien: "ban-do-o-xong", tile, soDiem: diem.length, soCo: oCo, soLoi: xongTd.loi.size });
  }
  if (dung) throw dung;
  return { phase: o.phase, calls: o.client.calls - started, items, failed, so: { soO, soDiem, soDiemCoThua, soThua, soOCoDuLieu } };
}
