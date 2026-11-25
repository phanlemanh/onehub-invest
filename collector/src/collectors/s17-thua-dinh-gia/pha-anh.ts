/**
 * Pha `images` — tải TOÀN BỘ ảnh dự án vào kho chuẩn (mốc mở rộng, claudedp-2411-73).
 *
 * Việc phải làm đọc từ kho (catalog.ts), không gọi API. Có hai LỢT chạy bằng hai tiến trình riêng (thư mục trạng
 * thái riêng) để không chậm nhau: lượt «chính nguồn» (ảnh trên máy chủ của nguồn, link có hạn) và lượt «máy chủ
 * ngoài» (ảnh chèn từ nơi khác — Mạnh chốt 25/11: «Lấy cả ảnh ở máy chủ ngoài»).
 *
 * Mỗi lô tối đa `maxFiles` URL của một dự án → một snapshot: item `anh_du_an` mang URL (payload.media) và bảng đối
 * chiếu `meta.mediaFiles`, ảnh gốc dưới `media/`. Mã item ghi theo VỊ TRÍ trong danh sách ảnh của dự án
 * (`du-an-<id>-anh-<từ>-<tới>`), nên hai lượt khác nhau không bao giờ trùng mã; mỗi item là một phần, bên đọc cộng
 * dồn, KHÔNG lấy «bản mới nhất».
 *
 * Lỗi vĩnh viễn của một URL (xem LOI_VINH_VIEN_ANH) được ghi nhận một lần rồi thôi; lỗi tạm (mạng, 5xx, hết giờ)
 * chưa ghi, lượt sau thử lại, tối đa `toiDaLanThu` lượt rồi ghi `qua-so-lan-thu`. Dự án chỉ được đánh dấu xong khi
 * không còn ảnh dở. Lô chốt xong MỚI ghi tiến độ (nhật ký chỉ-ghi-thêm, một tệp mỗi dự án).
 *
 * Rào: máy chủ của nguồn trả 403 (không phải hết hạn), 429 hay trang HTML thay ảnh → BỊ CHẶN, dừng cả lượt. Máy chủ
 * ngoài chặn → ghi `chan-o-may-chu`, bỏ qua máy chủ đó (nhớ ở tệp `may-chu-bi-chan.json`), lượt vẫn đi tiếp; mỗi
 * máy chủ ngoài tối đa hai lời cùng lúc.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { RunStopped } from "./client.js";
import { LOI_VINH_VIEN_ANH, duoiCua, hashUrl, taiAnh, tenTepCua, type KetQuaTai } from "./anh.js";
import { projectImages } from "./catalog.js";
import { makeItem } from "./kinds.js";
import type { KeoDan } from "./keo-dan.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import type { BatchWriter } from "./store.js";
import { NhatKyTienDo } from "./tien-do.js";

export type AnhPhaseOptions = {
  /** Đuôi máy chủ lưu trữ của chính nguồn — đọc từ cấu hình local (tầng A). */
  hostSuffixes: string[];
  /** Lượt này chỉ lấy ảnh ở máy chủ ngoài nguồn (tiến trình riêng). */
  chiNgoai: boolean;
  /** Số tệp tải cùng lúc. */
  luongSong: number;
  maxBytes: number;
  timeoutMs: number;
  userAgent: string;
  /** Đệm thử trong test; mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
  /** Số lượt thử một URL lỗi tạm trước khi ghi nhận `qua-so-lan-thu` (mặc định 3). */
  toiDaLanThu?: number;
};

type MucMedia = { url: string; file?: string; sha256?: string; bytes?: number; error?: string; chiTiet?: string };

/** Nhiều lỗi tạm liền nhau thế này là mạng của máy thu hỏng — dừng, không đổ tiếp. */
const TOI_DA_LOI_LIEN = { nguon: 10, ngoai: 50 };
/** Mỗi máy chủ ngoài tối đa bấy nhiêu lời cùng lúc. */
const TOI_DA_MOT_MAY_CHU_NGOAI = 2;
const TEN_TEP_MAY_CHU_BI_CHAN = "may-chu-bi-chan.json";
/** Link còn hạn dưới bấy nhiêu giây vẫn được hỏi (để lệch đồng hồ hai phía không làm bỏ sót ảnh). */
const LEECH_HET_HAN = 300_000;

type TienDoAnh = { daLan: Set<string>; loiVinhVien: Map<string, string>; dem: Map<string, number>; xong: boolean };

function docTienDoAnh(lines: Array<Record<string, unknown>>): TienDoAnh {
  const out: TienDoAnh = { daLan: new Set(), loiVinhVien: new Map(), dem: new Map(), xong: false };
  for (const r of lines) {
    for (const h of (r.daTai as string[] | undefined) ?? []) out.daLan.add(h);
    for (const [h, loi] of Object.entries((r.loi ?? {}) as Record<string, string>)) out.loiVinhVien.set(h, loi);
    for (const [h, n] of Object.entries((r.dem ?? {}) as Record<string, number>)) out.dem.set(h, n);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

type MayChuBiChan = Map<string, { lyDo: string; lanDau: string; soLan: number }>;

async function docMayChuBiChan(duong: string): Promise<MayChuBiChan> {
  try {
    return new Map(Object.entries(JSON.parse(await readFile(duong, "utf8")) as Record<string, { lyDo: string; lanDau: string; soLan: number }>));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw e;
  }
}

async function ghiMayChuBiChan(duong: string, ds: MayChuBiChan): Promise<void> {
  await writeFile(`${duong}.moi`, JSON.stringify(Object.fromEntries(ds), null, 2));
  await rename(`${duong}.moi`, duong);
}

const hostCua = (url: string): string => {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url;
  }
};
const sha256Cua = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

export async function imagesPhase(o: RunOptions, anh: AnhPhaseOptions, keoDan: KeoDan): Promise<PhaseSummary> {
  const started = keoDan.calls;
  const writer = o.writer as BatchWriter;
  const motSnapshot = writer.maxFiles ?? 100;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const lop: "nguon" | "ngoai" = anh.chiNgoai ? "ngoai" : "nguon";
  const tienDoDir = o.tienDoDir as string;
  const kq = await projectImages(o.snapshotRoot as string, anh.hostSuffixes);
  const toiDaLanThu = anh.toiDaLanThu ?? 3;
  const toiDaLoiLien = TOI_DA_LOI_LIEN[lop];
  const toiDaMotMayChu = lop === "ngoai" ? Math.min(TOI_DA_MOT_MAY_CHU_NGOAI, Math.max(1, anh.luongSong)) : Math.max(1, anh.luongSong);
  const tepBiChan = join(tienDoDir, TEN_TEP_MAY_CHU_BI_CHAN);
  const mayChuBiChan: MayChuBiChan = lop === "ngoai" ? await docMayChuBiChan(tepBiChan) : new Map();

  let items = 0;
  let failed = 0;
  let soFile = 0;
  let soByte = 0;
  let soDuAnXong = 0;
  let dung: RunStopped | null = null;
  let loiLien = 0; // lỗi tạm liền nhau suốt cả lượt: một tệp thành công mới đặt về không

  for (const d of kq.duAn) {
    if (dung) break;
    const ds = d.anh.filter((a) => (a.ngoai ? "ngoai" : "nguon") === lop);
    if (!ds.length) continue;
    const tienDo = new NhatKyTienDo(join(tienDoDir, `${lop === "ngoai" ? "anh-ngoai" : "anh"}-${d.id}.jsonl`));
    const td = docTienDoAnh(await tienDo.readAll());
    if (td.xong) continue;
    const con = ds
      .map((a, i) => ({ ...a, vi: i + 1 }))
      .filter((a) => !td.daLan.has(hashUrl(a.url)) && !td.loiVinhVien.has(hashUrl(a.url)));
    let conLoiMang = 0;
    let soFileDuAn = 0;
    let soLoiDuAn = 0;
    const soLo = Math.max(1, Math.ceil(con.length / motSnapshot));
    for (let i = 0; i < soLo && !dung; i++) {
      const lo = con.slice(i * motSnapshot, (i + 1) * motSnapshot);
      if (!lo.length) break;

      // Tải lô này bằng một nhóm việc chạy song song; máy chủ của nguồn chặn thì cả lô dừng ngay.
      const ketQua = new Map<string, KetQuaTai>();
      const daLay = new Set<number>();
      const daBoQua = new Set<number>();
      const dangChayMayChu = new Map<string, number>();
      let biSua = false; // tệp máy chủ bị chặn đổi trong lô này
      let loiChan: RunStopped | null = null;
      // Link ký số đã quá hạn theo chính tham số của nó: không gửi lời nào (hỏi cũng chỉ được 403), ghi nhận là hết hạn.
      const gio = (o.now ?? (() => new Date()))().getTime();
      for (let k = 0; k < lo.length; k++) {
        const h = lo[k].hetHan;
        const han = h === null ? NaN : Date.parse(h);
        if (han + LEECH_HET_HAN <= gio) {
          ketQua.set(lo[k].url, { url: lo[k].url, loi: "het-han", http: 0, chiTiet: "du-doan-het-han" });
          daLay.add(k);
        }
      }
      const layViec = (): number | "het" => {
        for (let k = 0; k < lo.length; k++) {
          if (daLay.has(k) || daBoQua.has(k)) continue;
          const h = hashUrl(hostCua(lo[k].url));
          if (mayChuBiChan.has(h)) {
            daBoQua.add(k); // máy chủ này đã chặn: không hỏi nữa
            continue;
          }
          if ((dangChayMayChu.get(h) ?? 0) < toiDaMotMayChu) {
            daLay.add(k);
            dangChayMayChu.set(h, (dangChayMayChu.get(h) ?? 0) + 1);
            return k;
          }
        }
        return daLay.size + daBoQua.size >= lo.length ? "het" : -1; // -1: còn việc nhưng máy chủ đang bận
      };
      const worker = async (): Promise<void> => {
        for (;;) {
          if (loiChan) return;
          let k = layViec();
          while (k === -1) {
            await new Promise((r) => setTimeout(r, 3));
            if (loiChan) return;
            k = layViec();
          }
          if (k === "het") return;
          try {
            keoDan.assertRunning();
          } catch (e) {
            loiChan = e as RunStopped; // quá trần hoặc yêu cầu dừng
            return;
          }
          keoDan.calls++;
          const h = hashUrl(hostCua(lo[k].url));
          const x = await taiAnh(lo[k].url, { ...anh, duoiNguon: anh.hostSuffixes, keNgoai: true });
          dangChayMayChu.set(h, Math.max(0, (dangChayMayChu.get(h) ?? 1) - 1));
          if (!mayChuBiChan.has(h)) ketQua.set(lo[k].url, x); // máy chủ vừa bị chặn trong lúc tải: ghi là bị chặn
          if (x.loi === "ok") {
            loiLien = 0;
          } else if (x.loi === "chan") {
            if (lop === "nguon") {
              loiChan = keoDan.block(`máy chủ ảnh của nguồn trả HTTP ${x.http} (${x.chiTiet ?? "không rõ lý do"})`);
              return;
            }
            mayChuBiChan.set(h, { lyDo: x.chiTiet ?? `HTTP ${x.http}`, lanDau: at(), soLan: 1 });
            biSua = true;
          } else if (!LOI_VINH_VIEN_ANH.has(x.loi)) {
            loiLien++;
            if (loiLien >= toiDaLoiLien) {
              loiChan = keoDan.stopRun("network-down", `${toiDaLoiLien} tệp ảnh lỗi mạng liền nhau`);
              return;
            }
          }
        }
      };
      await Promise.all(Array.from({ length: Math.max(1, Math.min(toiDaMotMayChu, lo.length)) }, worker));
      if (lop === "ngoai" && biSua) {
        await mkdir(tienDoDir, { recursive: true });
        await ghiMayChuBiChan(tepBiChan, mayChuBiChan);
      }

      const tep: Array<{ name: string; bytes: Buffer }> = [];
      const daTai: string[] = [];
      const loi: Record<string, string> = {};
      const dem: Record<string, number> = {};
      const muc: MucMedia[] = [];
      const daiDien: typeof lo = []; // các URL thực sự có mặt trong item này
      let loByte = 0;
      for (const a of lo) {
        const h = hashUrl(a.url);
        const hostBiChan = lop === "ngoai" ? mayChuBiChan.get(hashUrl(hostCua(a.url))) : undefined;
        if (hostBiChan && !td.daLan.has(h) && !ketQua.get(a.url)?.bytes) {
          loi[h] = "chan-o-may-chu";
          muc.push({ url: a.url, error: "chan-o-may-chu", chiTiet: hostBiChan.lyDo });
          daiDien.push(a);
          continue;
        }
        const x = ketQua.get(a.url);
        if (!x) continue; // chưa tới lượt (dừng giữa lô) — lượt sau làm
        daiDien.push(a);
        if (x.loi === "ok" && x.bytes) {
          const name = tenTepCua(a.url, duoiCua(x.kieu, a.url));
          tep.push({ name, bytes: x.bytes });
          daTai.push(h);
          loByte += x.bytes.length;
          muc.push({ url: a.url, file: name, sha256: sha256Cua(x.bytes), bytes: x.bytes.length });
        } else if (LOI_VINH_VIEN_ANH.has(x.loi)) {
          loi[h] = x.loi;
          muc.push({ url: a.url, error: x.loi, chiTiet: x.chiTiet });
        } else {
          // Lỗi tạm: chưa ghi là lỗi; đếm lượt thử, quá hạn thì ghi nhận.
          const n = (td.dem.get(h) ?? 0) + 1;
          td.dem.set(h, n);
          dem[h] = n;
          conLoiMang++;
          if (n >= toiDaLanThu) {
            loi[h] = "qua-so-lan-thu";
            muc.push({ url: a.url, error: "qua-so-lan-thu", chiTiet: x.chiTiet ? `${x.loi}: ${x.chiTiet}` : x.loi });
          } else {
            muc.push({ url: a.url, error: x.loi, chiTiet: x.chiTiet });
          }
        }
      }
      const soLoiLo = Object.values(loi).filter((x) => x !== "chan-o-may-chu").length;
      const tienDoMoi = { ...(daTai.length ? { daTai } : {}), ...(Object.keys(loi).length ? { loi } : {}), ...(Object.keys(dem).length ? { dem } : {}) };
      if (!tep.length && !Object.keys(loi).length) {
        // Không có gì chốt (cả lô chỉ toàn lỗi tạm): chỉ ghi số lượt thử — dòng này không khẳng định việc gì đã làm.
        if (Object.keys(dem).length) await tienDo.append({ dem });
        dung = loiChan;
        continue;
      }
      const vi = daiDien.map((a) => a.vi);
      const item = makeItem(
        "anh_du_an",
        `du-an-${d.id}-anh${lop === "ngoai" ? "-ngoai" : ""}-${Math.min(...vi)}-${Math.max(...vi)}`,
        { media: daiDien.map((a) => ({ url: a.url, ...(a.nhom.length ? { nhom: a.nhom } : {}) })) },
        { request: { duAn: d.id }, nhomMayChu: lop, soFile: tep.length, soByte: loByte, mediaFiles: muc },
        at(),
      );
      await writer.addWithFiles(item, tep);
      await writer.flush(); // lô chốt xong rồi mới ghi tiến độ (trạng thái chung do trình điều khiển lưu)
      if (Object.keys(tienDoMoi).length) await tienDo.append(tienDoMoi);
      items++;
      failed += soLoiLo;
      soFile += tep.length;
      soByte += loByte;
      soFileDuAn += tep.length;
      soLoiDuAn += Object.keys(loi).length;
      o.log({ suKien: "anh-lot", duAn: d.id, nhomMayChu: lop, soFile: tep.length, soByte: loByte, soLoi: Object.keys(loi).length });
      dung = loiChan;
    }
    if (!dung) {
      if (conLoiMang > 0) continue; // còn ảnh lỗi tạm: để lượt sau thử lại, chưa đánh dấu xong
      await tienDo.append({ duAn: d.id, xong: true, soFile: soFileDuAn, soLoi: soLoiDuAn });
      soDuAnXong++;
      o.log({ suKien: "anh-du-an-xong", duAn: d.id, nhomMayChu: lop, soFile: soFileDuAn, soLoi: soLoiDuAn });
    }
  }
  if (dung) throw dung;
  return { phase: o.phase, calls: keoDan.calls - started, items, failed, so: { soDuAnXong, soFile, soByte, soLoi: failed } };
}
